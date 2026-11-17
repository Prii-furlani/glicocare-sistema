<?php
/* =============================================================================
 * ARQUIVO: moderar_depoimentos.php (Localização: /backend/api/admin/moderar_depoimentos.php)
 * PROJETO: GlicoCare — Moderação Ética de Depoimentos e Avaliações (RN-MOD-01)
 * OBJETIVO: Permitir ao Administrador acolher e moderar relatos familiares e
 *           avaliações de teleconsultas, garantindo um ambiente seguro e afetuoso.
 * AUTORIZAÇÃO: Restrito ao perfil 'admin' / 'admin_moderador' (RN-ACC-01).
 * ============================================================================= */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../../services/AuditLogger.php';

try {
    /* INÍCIO DA AUTORIZAÇÃO ADMINISTRATIVA */
    $db = Database::getConnection();
    $adminAuth = AuthMiddleware::autorizar($db, ['admin', 'admin_moderador'], '/admin/moderacao');
    /* FIM DA AUTORIZAÇÃO ADMINISTRATIVA */

    /* =========================================================================
       MÉTODO GET: LISTAR DEPOIMENTOS E AVALIAÇÕES PARA MODERAÇÃO
       ========================================================================= */
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $statusFiltro = $_GET['status'] ?? 'todos'; // 'todos' | 'pendente' | 'aprovado' | 'rejeitado'

        $whereDep = "";
        $paramsDep = [];
        if ($statusFiltro !== 'todos') {
            $whereDep = "WHERE dm.status_moderacao = :status";
            $paramsDep[':status'] = $statusFiltro;
        }

        $stmtDep = $db->prepare("
            SELECT dm.id, dm.artigo_id, ac.titulo AS artigo_titulo, dm.usuario_id,
                   dm.nome_exibicao_familiar, dm.parentesco_contexto, dm.relato,
                   dm.status_moderacao, dm.criado_em, dm.moderado_em,
                   'artigo_comentario' AS tipo_registro
            FROM depoimentos_moderacao dm
            LEFT JOIN artigos_conteudos ac ON ac.id = dm.artigo_id
            {$whereDep}
            ORDER BY dm.status_moderacao = 'pendente' DESC, dm.id DESC
        ");
        $stmtDep->execute($paramsDep);
        $depoimentosArtigos = $stmtDep->fetchAll(PDO::FETCH_ASSOC);

        // Também lista avaliações das teleconsultas concluídas
        $stmtAval = $db->query("
            SELECT ae.id, ae.agendamento_id, ae.especialista_id, esp.nome_completo AS especialista_nome,
                   u.nome_completo AS paciente_nome, ae.nota, ae.comentario AS relato,
                   ae.status_moderacao, ae.criado_em,
                   'avaliacao_teleconsulta' AS tipo_registro
            FROM avaliacoes_especialistas ae
            LEFT JOIN especialistas esp ON esp.id = ae.especialista_id
            LEFT JOIN usuarios u ON u.id = ae.usuario_id
            ORDER BY ae.status_moderacao = 'PENDENTE' DESC, ae.id DESC
            LIMIT 30
        ");
        $avaliacoesTeleconsulta = $stmtAval->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'sucesso' => true,
            'dados' => [
                'depoimentos' => $depoimentosArtigos,
                'avaliacoes_teleconsulta' => $avaliacoesTeleconsulta,
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    /* =========================================================================
       MÉTODO POST: APROVAR OU REJEITAR DEPOIMENTO / COMENTÁRIO
       ========================================================================= */
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $dados = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $id = isset($dados['id']) ? (int)$dados['id'] : 0;
        $acao = strtolower(trim($dados['acao'] ?? ''));
        $tipo = trim($dados['tipo'] ?? 'artigo_comentario');

        if ($id <= 0 || !in_array($acao, ['aprovar', 'rejeitar'], true)) {
            throw new InvalidArgumentException("Parâmetros inválidos. Informe 'id' e 'acao' ('aprovar' ou 'rejeitar').");
        }

        $novoStatus = ($acao === 'aprovar') ? 'aprovado' : 'rejeitado';

        if ($tipo === 'avaliacao_teleconsulta') {
            $statusUpper = strtoupper($novoStatus);
            $snapshotAnterior = AuditLogger::capturarSnapshot($db, 'avaliacoes_especialistas', $id);

            $stmtUpdate = $db->prepare("
                UPDATE avaliacoes_especialistas 
                SET status_moderacao = :status 
                WHERE id = :id
            ");
            $stmtUpdate->execute([':status' => $statusUpper, ':id' => $id]);

            $snapshotNovo = AuditLogger::capturarSnapshot($db, 'avaliacoes_especialistas', $id);

            AuditLogger::registrar(
                $db,
                'EDICAO',
                'avaliacoes_especialistas',
                $id,
                '/admin',
                $snapshotAnterior,
                $snapshotNovo,
                $adminAuth['id'],
                $adminAuth['nome_completo']
            );
        } else {
            $snapshotAnterior = AuditLogger::capturarSnapshot($db, 'depoimentos_moderacao', $id);

            $stmtUpdate = $db->prepare("
                UPDATE depoimentos_moderacao 
                SET status_moderacao = :status, moderado_por_usuario_id = :admin_id, moderado_em = NOW() 
                WHERE id = :id
            ");
            $stmtUpdate->execute([
                ':status' => $novoStatus,
                ':admin_id' => $adminAuth['id'],
                ':id' => $id,
            ]);

            $snapshotNovo = AuditLogger::capturarSnapshot($db, 'depoimentos_moderacao', $id);

            AuditLogger::registrar(
                $db,
                'EDICAO',
                'depoimentos_moderacao',
                $id,
                '/admin',
                $snapshotAnterior,
                $snapshotNovo,
                $adminAuth['id'],
                $adminAuth['nome_completo']
            );
        }

        echo json_encode([
            'sucesso' => true,
            'mensagem' => "Depoimento #{$id} " . ($acao === 'aprovar' ? 'aprovado e publicado' : 'rejeitado') . " com sucesso!",
            'novo_status' => $novoStatus,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

} catch (Exception $e) {
    http_response_code($e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
