<?php
/* =============================================================================
 * ARQUIVO: usuarios.php (Localização: /backend/api/admin/usuarios.php)
 * PROJETO: GlicoCare — Gestão Geral de Contas de Usuários
 * OBJETIVO: Permitir ao Administrador listar usuários registrados, filtrar
 *           por perfis (cuidador, diabético, especialista, admin) e alternar
 *           status de ativação com auditoria imutável (AuditLogger).
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
    $adminAuth = AuthMiddleware::autorizar($db, ['admin', 'admin_moderador'], '/admin/usuarios');
    /* FIM DA AUTORIZAÇÃO ADMINISTRATIVA */

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $busca = trim($_GET['busca'] ?? '');
        $tipo = trim($_GET['tipo'] ?? '');

        $clausulas = [];
        $params = [];

        if ($busca !== '') {
            $clausulas[] = "(nome_completo LIKE :busca OR email LIKE :busca OR telefone LIKE :busca)";
            $params[':busca'] = "%{$busca}%";
        }

        if ($tipo !== '' && $tipo !== 'todos') {
            $clausulas[] = "(tipo_usuario = :tipo OR tipo_perfil = :tipo)";
            $params[':tipo'] = $tipo;
        }

        $whereSql = !empty($clausulas) ? "WHERE " . implode(" AND ", $clausulas) : "";

        $stmt = $db->prepare("
            SELECT id, nome_completo, email, telefone, tipo_usuario, tipo_perfil, 
                   perfil_configurado, contexto_dm1, ativo, criado_em, atualizado_em
            FROM usuarios
            {$whereSql}
            ORDER BY id DESC
        ");
        $stmt->execute($params);
        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'sucesso' => true,
            'total' => count($usuarios),
            'dados' => $usuarios,
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $dados = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $id = isset($dados['id']) ? (int)$dados['id'] : 0;
        $ativo = isset($dados['ativo']) ? (int)$dados['ativo'] : null;

        if ($id <= 0 || $ativo === null) {
            throw new InvalidArgumentException("ID do usuário e novo status de ativação são obrigatórios.");
        }

        // Não permite auto-desativação do admin autenticado
        if ($id === (int)$adminAuth['id'] && $ativo === 0) {
            throw new LogicException("Você não pode desativar sua própria conta de administrador.");
        }

        $snapshotAnterior = AuditLogger::capturarSnapshot($db, 'usuarios', $id);
        if (!$snapshotAnterior) {
            throw new RuntimeException("Usuário #{$id} não encontrado.");
        }

        $stmtUpdate = $db->prepare("UPDATE usuarios SET ativo = :ativo, atualizado_em = NOW() WHERE id = :id");
        $stmtUpdate->execute([':ativo' => $ativo ? 1 : 0, ':id' => $id]);

        $snapshotNovo = AuditLogger::capturarSnapshot($db, 'usuarios', $id);

        AuditLogger::registrar(
            $db,
            'EDICAO',
            'usuarios',
            $id,
            '/admin',
            $snapshotAnterior,
            $snapshotNovo,
            $adminAuth['id'],
            $adminAuth['nome_completo']
        );

        echo json_encode([
            'sucesso' => true,
            'mensagem' => "Status do usuário #{$id} atualizado para " . ($ativo ? 'ativo' : 'inativo') . ".",
            'dados' => $snapshotNovo,
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
