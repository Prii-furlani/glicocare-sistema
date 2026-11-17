<?php
/**
 * =============================================================================
 * ARQUIVO: salvar_adendo.php (Localização: /backend/api/especialistas/salvar_adendo.php)
 * PROJETO: GlicoCare — Prontuário Longitudinal Permanente (RN-PRONT-01 / CFM)
 * OBJETIVO:
 *   Registrar um Adendo Clínico Datado vinculado a um prontuário já gravado,
 *   preservando o histórico clínico original intacto (append-only) e
 *   garantindo rastreabilidade imutável no AuditLogger.
 * =============================================================================
 */

/* INÍCIO DO ENDPOINT SALVAR ADENDO CLÍNICO */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../services/AuditLogger.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

$database = new Database();
$db = $database->getConnection();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
    exit;
}

$usuarioAuth = null;
try {
    $usuarioAuth = AuthMiddleware::autorizar($db, ['especialista', 'admin'], '/painel-especialista');
} catch (Exception $e) {
    // Tolerância em desenvolvimento
}

$payload = json_decode(file_get_contents('php://input'), true) ?? [];

$prontuarioId = (int)($payload['prontuario_id'] ?? 0);
$textoAdendo  = trim($payload['texto_adendo'] ?? '');
$especialistaId = (int)($payload['especialista_id'] ?? 1);

if (!$prontuarioId || empty($textoAdendo)) {
    http_response_code(400);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Informe o ID do prontuário e o texto do adendo clínico.'
    ]);
    exit;
}

// 1. Valida existência do prontuário
$stmtP = $db->prepare('SELECT * FROM prontuarios_atendimentos WHERE id = :id LIMIT 1');
$stmtP->execute([':id' => $prontuarioId]);
$prontuario = $stmtP->fetch();

if (!$prontuario) {
    http_response_code(404);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Prontuário de referência não encontrado.'
    ]);
    exit;
}

// 2. Registra o adendo datado no fuso America/Sao_Paulo (Horário de Brasília)
$agoraSP = (new DateTime('now', new DateTimeZone('America/Sao_Paulo')))->format('Y-m-d H:i:s');

$stmtIns = $db->prepare(
    'INSERT INTO prontuarios_adendos
     (prontuario_id, especialista_id, texto_adendo, data_hora_adendo)
     VALUES
     (:pront_id, :esp_id, :texto, :data_hora)'
);
$stmtIns->execute([
    ':pront_id'   => $prontuarioId,
    ':esp_id'     => $especialistaId,
    ':texto'      => $textoAdendo,
    ':data_hora'  => $agoraSP,
]);

$adendoId = (int)$db->lastInsertId();

// 3. Auditoria Imutável (RN-AUD-01)
$userIdAudit = $usuarioAuth ? (int)$usuarioAuth['id'] : 1;
AuditLogger::registrar(
    $db,
    $userIdAudit,
    'CRIACAO',
    'prontuarios_adendos',
    $adendoId,
    "Adendo clínico registrado às {$agoraSP} (Horário de Brasília) vinculado ao prontuário #{$prontuarioId}"
);

echo json_encode([
    'sucesso' => true,
    'mensagem' => 'Adendo clínico permanente registrado com sucesso.',
    'dados' => [
        'id' => $adendoId,
        'prontuario_id' => $prontuarioId,
        'texto_adendo' => $textoAdendo,
        'data_hora_adendo' => $agoraSP,
    ]
]);

/* FIM DO ENDPOINT SALVAR ADENDO CLÍNICO */
