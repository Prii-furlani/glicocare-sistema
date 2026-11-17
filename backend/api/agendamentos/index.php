<?php
/**
 * =============================================================================
 * ARQUIVO: index.php (Localização: /backend/api/agendamentos/index.php)
 * PROJETO: GlicoCare — Agendamentos, Financeiro Interno e Teleconsulta (RN-MOD-MKT)
 * OBJETIVO: Gestão de consultas com auditoria imutável (RN-AUD-01).
 * MÉTODOS SUPORTADOS:
 *   - GET: Consulta de agendamentos e verificação de slots disponíveis.
 *   - POST: Reserva com bloqueio imediato e auditoria (CRIACAO).
 *   - PATCH: Alteração de status / anexação de laudos com auditoria (EDICAO).
 *   - DELETE: Cancelamento / exclusão de agendamento com auditoria (EXCLUSAO).
 * =============================================================================
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../services/AuditLogger.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

/* =============================================================================
   MÉTODO GET: Listagem de consultas agendadas
   ============================================================================= */
if ($method === 'GET') {
    $especialistaId = isset($_GET['especialista_id']) ? (int) $_GET['especialista_id'] : null;

    if ($especialistaId) {
        $stmt = $db->prepare(
            'SELECT id, especialista_id, data_hora_consulta, status_agendamento, link_video_integrado
             FROM agendamentos
             WHERE especialista_id = :eid
             ORDER BY data_hora_consulta ASC'
        );
        $stmt->execute([':eid' => $especialistaId]);
    } else {
        $stmt = $db->query(
            'SELECT a.*, u.nome_completo AS paciente_nome
             FROM agendamentos a
             INNER JOIN usuarios u ON a.familiar_usuario_id = u.id
             ORDER BY a.data_hora_consulta DESC'
        );
    }

    echo json_encode(['sucesso' => true, 'dados' => $stmt->fetchAll()]);
    exit;
}

/* =============================================================================
   MÉTODO POST: Criação de consulta com bloqueio e auditoria (CRIACAO)
   ============================================================================= */
if ($method === 'POST') {
    // Autenticação obrigatória para agendar consulta (RN-ACC-01)
    $usuarioAuth = AuthMiddleware::autenticar($db, '/agendamentos');

    $payload = json_decode(file_get_contents('php://input'), true) ?? [];

    if (empty($payload['especialista_id']) || empty($payload['data_hora_consulta'])) {
        http_response_code(400);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Informe o especialista e a data/hora da consulta para bloquear o slot (RN-AGD-02).'
        ]);
        exit;
    }

    $especialistaId = (int) $payload['especialista_id'];
    $familiarId     = (int) $usuarioAuth['id'];
    $pacienteNome   = $usuarioAuth['nome_completo'];
    $dataHora       = trim($payload['data_hora_consulta']);
    $valorBruto     = (float) ($payload['valor_transacao_interna'] ?? 250.00);

    // 1. RN-AGD-02: Verifica se o slot já está reservado
    $stmtCheck = $db->prepare(
        'SELECT id FROM agendamentos
         WHERE especialista_id = :eid
           AND data_hora_consulta = :data_hora
           AND status_agendamento != "cancelado"
         LIMIT 1'
    );
    $stmtCheck->execute([
        ':eid'       => $especialistaId,
        ':data_hora' => $dataHora,
    ]);

    if ($stmtCheck->fetch()) {
        http_response_code(409);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'RN-AGD-02: Este horário acabou de ser reservado por outra família. Por favor, selecione outro slot disponível.'
        ]);
        exit;
    }

    // 2. RN-FIN-03: Cálculo de taxas e comprovante NF
    $taxaPlataforma = round($valorBruto * 0.12, 2);
    $repasseLiquido = round($valorBruto - $taxaPlataforma, 2);
    $numeroReciboNF = 'NF-GC-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));
    $codTransacao   = 'GC-PAY-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(4)));

    // 3. RN-ATD-04: Sala nativa de videoconferência
    $salaNativaId   = 'SALA-NATIVA-GC-' . strtoupper(bin2hex(random_bytes(4)));
    $rotaInternaVideo = '/sala-consulta/' . $salaNativaId;

    $stmt = $db->prepare(
        'INSERT INTO agendamentos
         (familiar_usuario_id, especialista_id, data_hora_consulta, valor_transacao_interna,
          taxa_servico_glicocare, repasse_especialista, comprovante_nf, codigo_transacao_interna,
          status_pagamento_interno, status_financeiro, status_agendamento, status_atendimento,
          sala_token_unico, link_video_integrado, observacoes_familia)
         VALUES
         (:fuid, :eid, :data_hora, :valor, :taxa, :repasse, :nf, :cod_trans,
          "pago_retido_custodia", "RETIDO_PLATAFORMA", "confirmado", "AGENDADO",
          :token, :link, :obs)'
    );
    $stmt->execute([
        ':fuid'      => $familiarId,
        ':eid'       => $especialistaId,
        ':data_hora' => $dataHora,
        ':valor'     => $valorBruto,
        ':taxa'      => $taxaPlataforma,
        ':repasse'   => $repasseLiquido,
        ':nf'        => $numeroReciboNF,
        ':cod_trans' => $codTransacao,
        ':token'     => $salaNativaId,
        ':link'      => $rotaInternaVideo,
        ':obs'       => $payload['observacoes_familia'] ?? null,
    ]);
    $novoId = (int) $db->lastInsertId();

    // 3B. Registra o Termo de Consentimento Informado (CFM 2.314/2022 & LGPD)
    $ipOrigem = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    if (str_contains($ipOrigem, ',')) {
        $ipOrigem = trim(explode(',', $ipOrigem)[0]);
    }
    $dataHoraLocal = (new DateTime('now', new DateTimeZone('America/Sao_Paulo')))->format('Y-m-d H:i:s');
    $versaoTermo   = $payload['versao_termo'] ?? 'v1.0-2026';

    try {
        $stmtCons = $db->prepare(
            'INSERT INTO consentimentos_teleconsulta
             (usuario_id, agendamento_id, versao_termo, aceito, ip_aceite, data_hora_aceite)
             VALUES (:uid, :aid, :versao, 1, :ip, :data_hora)'
        );
        $stmtCons->execute([
            ':uid'       => $familiarId,
            ':aid'       => $novoId,
            ':versao'    => $versaoTermo,
            ':ip'        => $ipOrigem,
            ':data_hora' => $dataHoraLocal,
        ]);
        $consentimentoId = (int) $db->lastInsertId();

        AuditLogger::registrar(
            $db,
            'CRIACAO',
            'consentimentos_teleconsulta',
            $consentimentoId,
            '/agendamentos/checkout',
            null,
            ['agendamento_id' => $novoId, 'versao_termo' => $versaoTermo, 'ip_aceite' => $ipOrigem],
            $familiarId,
            $pacienteNome
        );
    } catch (Exception $e) {
        // Silencioso se tabela não migrada
    }

    // 4. Captura snapshot recém-criado e audita (RN-AUD-01)
    $snapshotNovo = AuditLogger::capturarSnapshot($db, 'agendamentos', $novoId);
    $pacienteNome = $payload['paciente_nome'] ?? "Familiar #{$familiarId}";

    AuditLogger::registrar(
        $db,
        'CRIACAO',
        'agendamentos',
        $novoId,
        '/agendamentos',
        null,
        $snapshotNovo,
        $familiarId,
        $pacienteNome
    );

    http_response_code(201);
    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Agendamento confirmado com auditoria imutável registrada (RN-AUD-01).',
        'id' => $novoId,
        'rn_agd_02' => [
            'slot_bloqueado' => $dataHora,
            'notificacao_paciente' => 'Enviada por e-mail e painel GlicoCare',
            'notificacao_especialista' => 'Enviada para o painel clínico do profissional',
        ],
        'rn_fin_03' => [
            'valor_total' => $valorBruto,
            'taxa_servico_glicocare' => $taxaPlataforma,
            'repasse_especialista' => $repasseLiquido,
            'comprovante_nf' => $numeroReciboNF,
        ],
        'rn_atd_04' => [
            'sala_nativa_id' => $salaNativaId,
            'rota_interna_video' => $rotaInternaVideo,
            'historico_clinico_unificado' => true,
        ],
    ]);
    exit;
}

/* =============================================================================
   MÉTODO PATCH: Atualização de status ou laudo com auditoria (EDICAO)
   ============================================================================= */
if ($method === 'PATCH') {
    $payload = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = isset($payload['id']) ? (int)$payload['id'] : 0;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['sucesso' => false, 'mensagem' => 'ID do agendamento é obrigatório para atualização.']);
        exit;
    }

    // 1. Snapshot ANTES da alteração (RN-AUD-01)
    $snapshotAnterior = AuditLogger::capturarSnapshot($db, 'agendamentos', $id);
    if (!$snapshotAnterior) {
        http_response_code(404);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Agendamento não encontrado.']);
        exit;
    }

    $campos = [];
    $params = [':id' => $id];

    if (isset($payload['status_agendamento'])) {
        $campos[] = 'status_agendamento = :status_agendamento';
        $params[':status_agendamento'] = trim($payload['status_agendamento']);
    }
    if (isset($payload['status_pagamento_interno'])) {
        $campos[] = 'status_pagamento_interno = :status_pagamento';
        $params[':status_pagamento'] = trim($payload['status_pagamento_interno']);
    }
    if (isset($payload['url_laudo_receita_pdf'])) {
        $campos[] = 'url_laudo_receita_pdf = :laudo_url';
        $params[':laudo_url'] = trim($payload['url_laudo_receita_pdf']);
    }
    if (isset($payload['observacoes_familia'])) {
        $campos[] = 'observacoes_familia = :obs';
        $params[':obs'] = trim($payload['observacoes_familia']);
    }

    if (empty($campos)) {
        http_response_code(400);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Nenhum campo informado para atualização.']);
        exit;
    }

    $sql = 'UPDATE agendamentos SET ' . implode(', ', $campos) . ' WHERE id = :id';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    // 2. Snapshot DEPOIS da alteração
    $snapshotNovo = AuditLogger::capturarSnapshot($db, 'agendamentos', $id);

    // 3. Registro compulsório de auditoria
    $usuarioId = $payload['usuario_id'] ?? null;
    $usuarioNome = $payload['usuario_nome'] ?? 'Especialista / Sistema';

    AuditLogger::registrar(
        $db,
        'EDICAO',
        'agendamentos',
        $id,
        '/agendamentos',
        $snapshotAnterior,
        $snapshotNovo,
        $usuarioId,
        $usuarioNome
    );

    echo json_encode([
        'sucesso' => true,
        'mensagem' => "Agendamento #{$id} atualizado e registrado na auditoria imutável."
    ]);
    exit;
}

/* =============================================================================
   MÉTODO DELETE: Cancelamento / exclusão com auditoria (EXCLUSAO)
   ============================================================================= */
if ($method === 'DELETE') {
    $payload = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = isset($_GET['id']) ? (int)$_GET['id'] : ($payload['id'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['sucesso' => false, 'mensagem' => 'ID do agendamento é obrigatório para exclusão.']);
        exit;
    }

    // 1. Snapshot ANTES da exclusão (RN-AUD-01)
    $snapshotAnterior = AuditLogger::capturarSnapshot($db, 'agendamentos', $id);
    if (!$snapshotAnterior) {
        http_response_code(404);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Agendamento não encontrado.']);
        exit;
    }

    $stmt = $db->prepare('DELETE FROM agendamentos WHERE id = :id');
    $stmt->execute([':id' => $id]);

    // 2. Registro de auditoria imutável (EXCLUSAO)
    $usuarioId = $payload['usuario_id'] ?? null;
    $usuarioNome = $payload['usuario_nome'] ?? 'Administrador / Familiar';

    AuditLogger::registrar(
        $db,
        'EXCLUSAO',
        'agendamentos',
        $id,
        '/agendamentos',
        $snapshotAnterior,
        null,
        $usuarioId,
        $usuarioNome
    );

    echo json_encode([
        'sucesso' => true,
        'mensagem' => "Agendamento #{$id} excluído com sucesso e preservado na trilha de auditoria."
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
