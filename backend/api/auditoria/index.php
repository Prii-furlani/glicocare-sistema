<?php
/**
 * =============================================================================
 * ARQUIVO: index.php (Localização: /backend/api/auditoria/index.php)
 * PROJETO: GlicoCare — Painel de Auditoria e Conformidade LGPD (RN-AUD-01)
 * OBJETIVO: Endpoint SOMENTE-LEITURA para consulta da trilha de auditoria imutável.
 * REGRA DE IMUTABILIDADE:
 *   - Métodos POST, PUT, PATCH e DELETE são terminantemente proibidos e bloqueados (HTTP 405).
 *   - Apenas o método GET é aceito para visualização administrativa.
 * =============================================================================
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../services/AuditLogger.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

/* INÍCIO DO BLOQUEIO ESTREITO DE MUTAÇÃO (RN-AUD-01) */
if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Método não permitido. A trilha de auditoria é estritamente imutável (append-only). Não são permitidas operações de criação direta, edição ou exclusão.'
    ]);
    exit;
}
/* FIM DO BLOQUEIO ESTREITO DE MUTAÇÃO */

/* INÍCIO DA CONSULTA SOMENTE-LEITURA */
try {
    $filtros = [
        'tabela_afetada' => $_GET['tabela_afetada'] ?? null,
        'acao'           => $_GET['acao'] ?? null,
        'registro_id'    => $_GET['registro_id'] ?? null,
        'usuario_id'     => $_GET['usuario_id'] ?? null,
        'data_inicio'    => $_GET['data_inicio'] ?? null,
        'data_fim'       => $_GET['data_fim'] ?? null,
        'limit'          => isset($_GET['limit']) ? (int)$_GET['limit'] : 100,
    ];

    $logs = AuditLogger::listar($db, $filtros);

    echo json_encode([
        'sucesso' => true,
        'total'   => count($logs),
        'dados'   => $logs,
        'diretriz' => 'RN-AUD-01: Trilha imutável de auditoria e conformidade LGPD.'
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Erro ao consultar a trilha de auditoria.',
        'detalhe' => $e->getMessage()
    ]);
}
/* FIM DA CONSULTA SOMENTE-LEITURA */
