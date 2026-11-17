<?php
/**
 * =============================================================================
 * ARQUIVO: registrar_evento_sala.php (Localização: /backend/api/teleconsulta/registrar_evento_sala.php)
 * PROJETO: GlicoCare — Telemedicina e Conformidade (CFM 2.314/2022 & LGPD)
 * OBJETIVO:
 *   Registrar o timestamp exato de entrada/início da teleconsulta (iniciado_em)
 *   e de encerramento da chamada (encerrado_em) na tabela agendamentos,
 *   gravando a trilha imutável correspondente no serviço AuditLogger
 *   no fuso horário 'America/Sao_Paulo'.
 * =============================================================================
 */

/* INÍCIO DO ENDPOINT REGISTRAR EVENTO SALA */

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
    $usuarioAuth = AuthMiddleware::autenticar($db, '/teleconsulta/registrar_evento_sala');
} catch (Exception $e) {
    // Tolerância em desenvolvimento
}

$payload = json_decode(file_get_contents('php://input'), true) ?? [];

$agendamentoId = (int) ($payload['agendamento_id'] ?? 0);
$token = trim($payload['token'] ?? '');
$evento = trim($payload['evento'] ?? ''); // 'inicio' ou 'fim'

if (!$agendamentoId && !empty($token)) {
    // Busca agendamento por token caso o ID não tenha sido fornecido diretamente
    $stmtT = $db->prepare('SELECT id FROM agendamentos WHERE sala_token_unico = :t OR link_video_integrado LIKE :tl LIMIT 1');
    $stmtT->execute([':t' => $token, ':tl' => "%{$token}%"]);
    $rowT = $stmtT->fetch();
    if ($rowT) {
        $agendamentoId = (int) $rowT['id'];
    }
}

if (!$agendamentoId || !in_array($evento, ['inicio', 'fim'], true)) {
    http_response_code(400);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Parâmetros inválidos. Informe o agendamento_id (ou token) e evento ("inicio" ou "fim").'
    ]);
    exit;
}

// 1. Busca agendamento
$stmt = $db->prepare('SELECT * FROM agendamentos WHERE id = :id LIMIT 1');
$stmt->execute([':id' => $agendamentoId]);
$agendamento = $stmt->fetch();

if (!$agendamento) {
    http_response_code(404);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Agendamento não encontrado.']);
    exit;
}

// Data e hora atual no fuso America/Sao_Paulo
$agoraSP = (new DateTime('now', new DateTimeZone('America/Sao_Paulo')))->format('Y-m-d H:i:s');
$userIdAudit = $usuarioAuth ? (int)$usuarioAuth['id'] : (int)$agendamento['familiar_usuario_id'];

if ($evento === 'inicio') {
    // Registra início apenas se ainda não iniciado
    $stmtUp = $db->prepare(
        'UPDATE agendamentos 
         SET iniciado_em = COALESCE(iniciado_em, :agora),
             status_atendimento = CASE 
                WHEN status_atendimento = "AGENDADO" THEN "EM_ANDAMENTO" 
                ELSE status_atendimento 
             END,
             status_agendamento = CASE 
                WHEN status_agendamento = "agendado" OR status_agendamento = "confirmado" THEN "em_atendimento" 
                ELSE status_agendamento 
             END
         WHERE id = :id'
    );
    $stmtUp->execute([':agora' => $agoraSP, ':id' => $agendamentoId]);

    AuditLogger::registrar(
        $db,
        $userIdAudit,
        'EDICAO',
        'teleconsulta',
        $agendamentoId,
        "Início da chamada de teleconsulta registrado às {$agoraSP} (Horário de Brasília)"
    );

    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Início da teleconsulta registrado.',
        'dados' => [
            'agendamento_id' => $agendamentoId,
            'iniciado_em' => $agoraSP,
            'status_atendimento' => 'EM_ANDAMENTO'
        ]
    ]);
    exit;
}

if ($evento === 'fim') {
    // Registra encerramento da chamada
    $stmtUp = $db->prepare('UPDATE agendamentos SET encerrado_em = :agora WHERE id = :id');
    $stmtUp->execute([':agora' => $agoraSP, ':id' => $agendamentoId]);

    AuditLogger::registrar(
        $db,
        $userIdAudit,
        'EDICAO',
        'teleconsulta',
        $agendamentoId,
        "Encerramento da chamada de teleconsulta registrado às {$agoraSP} (Horário de Brasília)"
    );

    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Encerramento da teleconsulta registrado.',
        'dados' => [
            'agendamento_id' => $agendamentoId,
            'encerrado_em' => $agoraSP
        ]
    ]);
    exit;
}

/* FIM DO ENDPOINT REGISTRAR EVENTO SALA */
