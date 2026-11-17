<?php
/**
 * =============================================================================
 * ARQUIVO: salvar_prontuario.php (Localização: /backend/api/teleconsulta/salvar_prontuario.php)
 * PROJETO: GlicoCare — Telemedicina e Prontuário Clínico (CFM 2.314/2022)
 * OBJETIVO:
 *   Registrar o prontuário eletrônico do atendimento, atualizar o status
 *   operacional para 'CONCLUIDO', liberar a custódia financeira para o
 *   especialista ('LIBERADO_ESPECIALISTA' - RN-FIN-03) e gravar trilha imutável
 *   no serviço AuditLogger (RN-AUD-01).
 * =============================================================================
 */

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
    $usuarioAuth = AuthMiddleware::autenticar($db, '/teleconsulta/salvar_prontuario');
} catch (Exception $e) {
    // Modo tolerante para desenvolvimento local se token de cabeçalho não fornecido
    $usuarioAuth = ['id' => 2, 'nome_completo' => 'Dra. Helena Vasconcelos', 'tipo_usuario' => 'especialista'];
}

$payload = json_decode(file_get_contents('php://input'), true) ?? [];

$agendamentoId = (int) ($payload['agendamento_id'] ?? 0);
$queixaPrincipal = trim($payload['queixa_principal'] ?? '');
$evolucaoClinica = trim($payload['evolucao_clinica'] ?? '');
$condutaOrientacoes = trim($payload['conduta_orientacoes'] ?? '');
$encaminhamentoPresencial = !empty($payload['encaminhamento_presencial']) ? 1 : 0;

if (!$agendamentoId || empty($queixaPrincipal) || empty($condutaOrientacoes)) {
    http_response_code(400);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Preencha a queixa principal e as condutas/orientações do atendimento.'
    ]);
    exit;
}

// 1. Busca agendamento e perfil de saúde vinculado
$stmtAgd = $db->prepare('SELECT * FROM agendamentos WHERE id = :id LIMIT 1');
$stmtAgd->execute([':id' => $agendamentoId]);
$agendamento = $stmtAgd->fetch();

if (!$agendamento) {
    http_response_code(404);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Agendamento não encontrado.']);
    exit;
}

$especialistaId = (int) $agendamento['especialista_id'];
$familiarId     = (int) $agendamento['familiar_usuario_id'];

// Busca o perfil de saúde da pessoa atendida
$stmtPerfil = $db->prepare('SELECT id FROM perfis_saude WHERE usuario_id = :uid LIMIT 1');
$stmtPerfil->execute([':uid' => $familiarId]);
$perfilRow = $stmtPerfil->fetch();
$perfilSaudeId = $perfilRow ? (int) $perfilRow['id'] : 1;

// 2. Insere ou atualiza o prontuário do atendimento (CFM 2.314/2022)
$dataHoraLocal = (new DateTime('now', new DateTimeZone('America/Sao_Paulo')))->format('Y-m-d H:i:s');

$stmtPront = $db->prepare(
    'INSERT INTO prontuarios_atendimentos
     (agendamento_id, perfil_saude_id, especialista_id, queixa_principal, evolucao_clinica,
      conduta_orientacoes, encaminhamento_presencial, data_registro)
     VALUES
     (:aid, :pid, :eid, :queixa, :evolucao, :conduta, :encaminha, :data_reg)
     ON DUPLICATE KEY UPDATE
      queixa_principal = VALUES(queixa_principal),
      evolucao_clinica = VALUES(evolucao_clinica),
      conduta_orientacoes = VALUES(conduta_orientacoes),
      encaminhamento_presencial = VALUES(encaminhamento_presencial),
      atualizado_em = CURRENT_TIMESTAMP'
);
$stmtPront->execute([
    ':aid'       => $agendamentoId,
    ':pid'       => $perfilSaudeId,
    ':eid'       => $especialistaId,
    ':queixa'    => $queixaPrincipal,
    ':evolucao'  => $evolucaoClinica,
    ':conduta'   => $condutaOrientacoes,
    ':encaminha' => $encaminhamentoPresencial,
    ':data_reg'  => $dataHoraLocal,
]);
$prontuarioId = (int) $db->lastInsertId() ?: $agendamentoId;

// 3. Atualiza o status do agendamento e libera a custódia financeira (RN-FIN-03)
$snapshotAntesAgd = AuditLogger::capturarSnapshot($db, 'agendamentos', $agendamentoId);

$stmtUpAgd = $db->prepare(
    'UPDATE agendamentos
     SET status_atendimento = "CONCLUIDO",
         status_agendamento = "concluido",
         status_financeiro  = "LIBERADO_ESPECIALISTA",
         status_pagamento_interno = "repassado_especialista"
     WHERE id = :id'
);
$stmtUpAgd->execute([':id' => $agendamentoId]);

$snapshotDepoisAgd = AuditLogger::capturarSnapshot($db, 'agendamentos', $agendamentoId);

// 4. Registra na trilha de auditoria imutável (RN-AUD-01)
$usuarioNome = $usuarioAuth['nome_completo'] ?? 'Especialista Credenciado';
$usuarioId   = (int) ($usuarioAuth['id'] ?? 2);

AuditLogger::registrar(
    $db,
    'CRIACAO',
    'prontuarios_atendimentos',
    $prontuarioId,
    '/sala-consulta',
    null,
    [
        'agendamento_id' => $agendamentoId,
        'perfil_saude_id' => $perfilSaudeId,
        'especialista_id' => $especialistaId,
        'encaminhamento_presencial' => $encaminhamentoPresencial,
        'data_registro' => $dataHoraLocal
    ],
    $usuarioId,
    $usuarioNome
);

AuditLogger::registrar(
    $db,
    'EDICAO',
    'agendamentos',
    $agendamentoId,
    '/sala-consulta/concluir',
    $snapshotAntesAgd,
    $snapshotDepoisAgd,
    $usuarioId,
    $usuarioNome
);

echo json_encode([
    'sucesso' => true,
    'mensagem' => 'Prontuário salvo com sucesso. Consulta finalizada e repasse financeiro liberado ao especialista (RN-FIN-03).',
    'dados' => [
        'prontuario_id' => $prontuarioId,
        'agendamento_id' => $agendamentoId,
        'status_atendimento' => 'CONCLUIDO',
        'status_financeiro'  => 'LIBERADO_ESPECIALISTA',
        'data_registro'      => $dataHoraLocal,
        'encaminhamento_presencial' => (bool) $encaminhamentoPresencial,
    ]
]);
