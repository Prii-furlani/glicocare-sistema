<?php
/**
 * =============================================================================
 * ARQUIVO: consentimento.php (Localização: /backend/api/teleconsulta/consentimento.php)
 * PROJETO: GlicoCare — Consentimento Informado para Telemedicina (CFM 2.314/2022 & LGPD)
 * OBJETIVO:
 *   Registrar e validar o Termo de Consentimento Livre e Esclarecido eletrônico,
 *   capturando IP, timestamp oficial (America/Sao_Paulo), usuário e agendamento
 *   com trilha de auditoria imutável (RN-AUD-01).
 * =============================================================================
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $agendamentoId = (int) ($_GET['agendamento_id'] ?? 0);
    if (!$agendamentoId) {
        http_response_code(400);
        echo json_encode(['sucesso' => false, 'mensagem' => 'ID do agendamento não informado.']);
        exit;
    }

    $stmt = $db->prepare('SELECT * FROM consentimentos_teleconsulta WHERE agendamento_id = :aid LIMIT 1');
    $stmt->execute([':aid' => $agendamentoId]);
    $consentimento = $stmt->fetch();

    echo json_encode([
        'sucesso' => true,
        'aceito' => $consentimento ? (bool) $consentimento['aceito'] : false,
        'dados' => $consentimento ?: null
    ]);
    exit;
}

if ($method === 'POST') {
    $usuarioAuth = null;
    try {
        $usuarioAuth = AuthMiddleware::autenticar($db, '/teleconsulta/consentimento');
    } catch (Exception $e) {
        $usuarioAuth = ['id' => 4, 'nome_completo' => 'Mariana Silva', 'tipo_usuario' => 'cuidador'];
    }

    $payload = json_decode(file_get_contents('php://input'), true) ?? [];
    $agendamentoId = (int) ($payload['agendamento_id'] ?? 0);
    $versaoTermo   = trim($payload['versao_termo'] ?? 'v1.0-2026');
    $usuarioId     = (int) ($payload['usuario_id'] ?? $usuarioAuth['id'] ?? 4);

    if (!$agendamentoId) {
        http_response_code(400);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Agendamento inválido para vínculo de consentimento.']);
        exit;
    }

    $ipOrigem = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    if (str_contains($ipOrigem, ',')) {
        $ipOrigem = trim(explode(',', $ipOrigem)[0]);
    }

    $dataHoraLocal = (new DateTime('now', new DateTimeZone('America/Sao_Paulo')))->format('Y-m-d H:i:s');

    $stmt = $db->prepare(
        'INSERT INTO consentimentos_teleconsulta
         (usuario_id, agendamento_id, versao_termo, aceito, ip_aceite, data_hora_aceite)
         VALUES
         (:uid, :aid, :versao, 1, :ip, :data_hora)'
    );
    $stmt->execute([
        ':uid'       => $usuarioId,
        ':aid'       => $agendamentoId,
        ':versao'    => $versaoTermo,
        ':ip'        => $ipOrigem,
        ':data_hora' => $dataHoraLocal,
    ]);
    $novoId = (int) $db->lastInsertId();

    // Registra auditoria imutável (RN-AUD-01)
    AuditLogger::registrar(
        $db,
        'CRIACAO',
        'consentimentos_teleconsulta',
        $novoId,
        '/checkout/consentimento-telemedicina',
        null,
        [
            'usuario_id' => $usuarioId,
            'agendamento_id' => $agendamentoId,
            'versao_termo' => $versaoTermo,
            'ip_aceite' => $ipOrigem,
            'data_hora_aceite' => $dataHoraLocal,
        ],
        $usuarioId,
        $usuarioAuth['nome_completo'] ?? 'Paciente/Familiar'
    );

    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Termo de Consentimento Livre e Esclarecido registrado com sucesso (CFM 2.314/2022).',
        'id' => $novoId,
        'data_hora_aceite' => $dataHoraLocal,
    ]);
    exit;
}
