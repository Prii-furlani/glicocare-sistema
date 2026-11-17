<?php
/* =============================================================================
 * ARQUIVO: curadoria_especialistas.php (Localização: /backend/api/admin/curadoria_especialistas.php)
 * PROJETO: GlicoCare — Curadoria e Credenciamento de Especialistas
 * OBJETIVO: Permitir ao Administrador verificar dados de conselho profissional
 *           (CRM, CRN, CRP, CREF), ativar/pausar profissionais na vitrine,
 *           e ajustar honorários, percentual de repasse (65%) e regra de retorno.
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
    $adminAuth = AuthMiddleware::autorizar($db, ['admin', 'admin_moderador'], '/admin/especialistas');
    /* FIM DA AUTORIZAÇÃO ADMINISTRATIVA */

    /* =========================================================================
       MÉTODO GET: LISTAR ESPECIALISTAS COM DADOS DE CONSELHO E HONORÁRIOS
       ========================================================================= */
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $db->query("
            SELECT e.id, e.usuario_id, e.nome_completo, e.email, e.telefone, 
                   e.especialidade, e.tipo_conselho, e.numero_conselho, e.uf_conselho,
                   e.rqe_numero, e.foco_atuacao, e.biografia, e.foto_perfil_url,
                   e.status_credenciamento, e.registro_verificado, e.nota_avaliacao,
                   e.total_avaliacoes, e.valor_consulta, e.percentual_repasse, 
                   e.oferece_retorno_incluso, e.prazo_retorno_dias, e.criado_em, e.atualizado_em,
                   u.ativo AS usuario_ativo
            FROM especialistas e
            LEFT JOIN usuarios u ON u.id = e.usuario_id
            ORDER BY e.status_credenciamento = 'pendente_validacao' DESC, e.id DESC
        ");
        $especialistas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'sucesso' => true,
            'total' => count($especialistas),
            'dados' => $especialistas,
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    /* =========================================================================
       MÉTODO POST: ATUALIZAR STATUS, REPASSE E CONSELHO (RN-ESP-01 / RN-FIN-03)
       ========================================================================= */
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $dados = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $id = isset($dados['id']) ? (int)$dados['id'] : (isset($dados['especialista_id']) ? (int)$dados['especialista_id'] : 0);
        if ($id <= 0) {
            throw new InvalidArgumentException("ID do especialista inválido ou não informado.");
        }

        $snapshotAnterior = AuditLogger::capturarSnapshot($db, 'especialistas', $id);
        if (!$snapshotAnterior) {
            throw new RuntimeException("Especialista #{$id} não encontrado.");
        }

        $camposUpdate = [];
        $params = [':id' => $id];

        // Atualização de status_credenciamento
        if (isset($dados['status_credenciamento'])) {
            $status = trim($dados['status_credenciamento']);
            if (in_array($status, ['ativo', 'pausado', 'rejeitado', 'pendente_validacao'], true)) {
                $camposUpdate[] = "status_credenciamento = :status";
                $params[':status'] = $status;

                // Se aprovado/ativo, marca registro_verificado como 1 automaticamente
                if ($status === 'ativo') {
                    $camposUpdate[] = "registro_verificado = 1";
                } elseif ($status === 'rejeitado') {
                    $camposUpdate[] = "registro_verificado = 0";
                }
            }
        }

        if (isset($dados['registro_verificado'])) {
            $camposUpdate[] = "registro_verificado = :verificado";
            $params[':verificado'] = (int)$dados['registro_verificado'] ? 1 : 0;
        }

        // Atualização de percentual_repasse (RN-FIN-03)
        if (isset($dados['percentual_repasse'])) {
            $repasse = (float)$dados['percentual_repasse'];
            if ($repasse >= 10.0 && $repasse <= 95.0) {
                $camposUpdate[] = "percentual_repasse = :repasse";
                $params[':repasse'] = $repasse;
            }
        }

        // Atualização de valor_consulta
        if (isset($dados['valor_consulta'])) {
            $valor = (float)$dados['valor_consulta'];
            if ($valor > 0) {
                $camposUpdate[] = "valor_consulta = :valor";
                $params[':valor'] = $valor;
            }
        }

        // Atualização de oferece_retorno_incluso e prazo_retorno_dias (RN-AGD-RETORNO)
        if (isset($dados['oferece_retorno_incluso'])) {
            $camposUpdate[] = "oferece_retorno_incluso = :oferece_retorno";
            $params[':oferece_retorno'] = (int)$dados['oferece_retorno_incluso'] ? 1 : 0;
        }

        if (isset($dados['prazo_retorno_dias'])) {
            $prazo = (int)$dados['prazo_retorno_dias'];
            if ($prazo >= 7 && $prazo <= 90) {
                $camposUpdate[] = "prazo_retorno_dias = :prazo";
                $params[':prazo'] = $prazo;
            }
        }

        if (empty($camposUpdate)) {
            throw new InvalidArgumentException("Nenhum dado válido para atualização.");
        }

        $sql = "UPDATE especialistas SET " . implode(", ", $camposUpdate) . ", atualizado_em = NOW() WHERE id = :id";
        $stmtUpdate = $db->prepare($sql);
        $stmtUpdate->execute($params);

        $snapshotNovo = AuditLogger::capturarSnapshot($db, 'especialistas', $id);

        AuditLogger::registrar(
            $db,
            'EDICAO',
            'especialistas',
            $id,
            '/admin',
            $snapshotAnterior,
            $snapshotNovo,
            $adminAuth['id'],
            $adminAuth['nome_completo']
        );

        echo json_encode([
            'sucesso' => true,
            'mensagem' => "Cadastro do especialista #{$id} atualizado com sucesso na curadoria!",
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
