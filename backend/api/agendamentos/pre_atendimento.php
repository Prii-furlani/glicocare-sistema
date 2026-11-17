<?php
/**
 * =============================================================================
 * ARQUIVO: pre_atendimento.php (Localização: /backend/api/agendamentos/pre_atendimento.php)
 * PROJETO: GlicoCare — Módulo de Pré-Atendimento Acolhedor
 * OBJETIVO: Coleta humanizada de dores, dúvidas e histórico para preparar
 *           a teleconsulta com empatia, registrando auditoria imutável (RN-AUD-01).
 *
 * MÉTODOS SUPORTADOS:
 *   - GET: Consulta o pré-atendimento de uma consulta (Familiar, Especialista ou Admin).
 *   - POST / PUT: Criação ou atualização do pré-atendimento pela família com auditoria.
 * =============================================================================
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../services/AuditLogger.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Suporte a pré-voo CORS
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/* =============================================================================
   MÉTODO GET: Buscar Pré-Atendimento de um agendamento
   ============================================================================= */
if ($method === 'GET') {
    $agendamentoId = isset($_GET['agendamento_id']) ? (int) $_GET['agendamento_id'] : 0;

    if ($agendamentoId <= 0) {
        http_response_code(400);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Parâmetro agendamento_id é obrigatório.'
        ]);
        exit;
    }

    $usuarioAuth = AuthMiddleware::autenticar($db, '/como-funciona-atendimentos');

    // Busca detalhes do agendamento com especialista e paciente
    $stmtAg = $db->prepare('
        SELECT a.id, a.familiar_usuario_id, a.especialista_id, a.data_hora_consulta, a.status_agendamento,
               u.nome_completo AS familiar_nome,
               esp_u.nome_completo AS especialista_nome,
               esp.especialidade,
               esp.usuario_id AS especialista_usuario_id
        FROM agendamentos a
        INNER JOIN usuarios u ON a.familiar_usuario_id = u.id
        INNER JOIN especialistas esp ON a.especialista_id = esp.id
        INNER JOIN usuarios esp_u ON esp.usuario_id = esp_u.id
        WHERE a.id = :aid
    ');
    $stmtAg->execute([':aid' => $agendamentoId]);
    $agendamento = $stmtAg->fetch();

    if (!$agendamento) {
        http_response_code(404);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Agendamento não encontrado.']);
        exit;
    }

    // Validação de acesso (Familiar dono, Especialista da consulta ou Admin)
    $ehFamiliar = ((int) $agendamento['familiar_usuario_id'] === (int) $usuarioAuth['id']);
    $ehEspecialista = ((int) $agendamento['especialista_usuario_id'] === (int) $usuarioAuth['id']);
    $ehAdmin = in_array($usuarioAuth['tipo_usuario'] ?? '', ['admin']) ||
               in_array($usuarioAuth['tipo_perfil'] ?? '', ['admin_moderador']);

    if (!$ehFamiliar && !$ehEspecialista && !$ehAdmin) {
        AuthMiddleware::rejeitarAcesso(
            $db,
            $usuarioAuth,
            '/como-funciona-atendimentos',
            'Você não tem permissão para visualizar o pré-atendimento deste agendamento.'
        );
    }

    // Busca pré-atendimento se houver
    $stmtPre = $db->prepare('SELECT * FROM pre_atendimentos WHERE agendamento_id = :aid');
    $stmtPre->execute([':aid' => $agendamentoId]);
    $preAtendimento = $stmtPre->fetch();

    echo json_encode([
        'sucesso' => true,
        'agendamento' => [
            'id' => (int) $agendamento['id'],
            'data_hora_consulta' => $agendamento['data_hora_consulta'],
            'status_agendamento' => $agendamento['status_agendamento'],
            'familiar_nome' => $agendamento['familiar_nome'],
            'especialista_nome' => $agendamento['especialista_nome'],
            'especialidade' => $agendamento['especialidade'],
        ],
        'pre_atendimento' => $preAtendimento ?: null,
        'permissao_edicao' => ($ehFamiliar || $ehAdmin)
    ]);
    exit;
}

/* =============================================================================
   MÉTODOS POST & PUT: Salvar / Atualizar Pré-Atendimento (com Auditoria)
   ============================================================================= */
if ($method === 'POST' || $method === 'PUT') {
    $usuarioAuth = AuthMiddleware::autenticar($db, '/como-funciona-atendimentos');

    $payload = json_decode(file_get_contents('php://input'), true) ?? [];

    $agendamentoId = isset($payload['agendamento_id']) ? (int) $payload['agendamento_id'] : 0;
    $motivoPrincipal = trim($payload['motivo_principal'] ?? '');
    $maioresDores = trim($payload['maiores_dores'] ?? '');
    $duvidasPrioritarias = trim($payload['duvidas_prioritarias'] ?? '');
    $compartilharPerfil = isset($payload['compartilhar_perfil_saude']) ? (int) (bool) $payload['compartilhar_perfil_saude'] : 1;

    if ($agendamentoId <= 0 || empty($motivoPrincipal) || empty($maioresDores)) {
        http_response_code(400);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Os campos "Motivo principal" e "O que mais está incomodando / maiores dores" são obrigatórios.'
        ]);
        exit;
    }

    // Verifica agendamento e permissão
    $stmtAg = $db->prepare('SELECT id, familiar_usuario_id FROM agendamentos WHERE id = :aid');
    $stmtAg->execute([':aid' => $agendamentoId]);
    $agendamento = $stmtAg->fetch();

    if (!$agendamento) {
        http_response_code(404);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Agendamento não encontrado.']);
        exit;
    }

    $ehFamiliar = ((int) $agendamento['familiar_usuario_id'] === (int) $usuarioAuth['id']);
    $ehAdmin = in_array($usuarioAuth['tipo_usuario'] ?? '', ['admin']) ||
               in_array($usuarioAuth['tipo_perfil'] ?? '', ['admin_moderador']);

    if (!$ehFamiliar && !$ehAdmin) {
        http_response_code(403);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Apenas a família responsável pelo agendamento pode preencher o pré-atendimento.'
        ]);
        exit;
    }

    // Verifica se já existe pré-atendimento para este agendamento
    $stmtCheck = $db->prepare('SELECT id FROM pre_atendimentos WHERE agendamento_id = :aid');
    $stmtCheck->execute([':aid' => $agendamentoId]);
    $existente = $stmtCheck->fetch();

    $fusoHorario = new DateTimeZone('America/Sao_Paulo');
    $agora = (new DateTime('now', $fusoHorario))->format('Y-m-d H:i:s');

    if ($existente) {
        // EDICAO
        $preId = (int) $existente['id'];
        $snapshotAnterior = AuditLogger::capturarSnapshot($db, 'pre_atendimentos', $preId);

        $stmtUp = $db->prepare('
            UPDATE pre_atendimentos
            SET motivo_principal = :motivo,
                maiores_dores = :dores,
                duvidas_prioritarias = :duvidas,
                compartilhar_perfil_saude = :comp,
                preenchido_em = :preenchido
            WHERE id = :id
        ');
        $stmtUp->execute([
            ':motivo' => $motivoPrincipal,
            ':dores' => $maioresDores,
            ':duvidas' => $duvidasPrioritarias ?: null,
            ':comp' => $compartilharPerfil,
            ':preenchido' => $agora,
            ':id' => $preId
        ]);

        $snapshotNovo = AuditLogger::capturarSnapshot($db, 'pre_atendimentos', $preId);

        AuditLogger::registrar(
            $db,
            'EDICAO',
            'pre_atendimentos',
            $preId,
            '/como-funciona-atendimentos',
            $snapshotAnterior,
            $snapshotNovo,
            $usuarioAuth['id'],
            $usuarioAuth['nome_completo']
        );

        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Pré-atendimento atualizado com carinho e acolhimento!',
            'dados' => $snapshotNovo
        ]);
        exit;
    } else {
        // CRIACAO
        $stmtIns = $db->prepare('
            INSERT INTO pre_atendimentos
            (agendamento_id, motivo_principal, maiores_dores, duvidas_prioritarias, compartilhar_perfil_saude, preenchido_em)
            VALUES
            (:aid, :motivo, :dores, :duvidas, :comp, :preenchido)
        ');
        $stmtIns->execute([
            ':aid' => $agendamentoId,
            ':motivo' => $motivoPrincipal,
            ':dores' => $maioresDores,
            ':duvidas' => $duvidasPrioritarias ?: null,
            ':comp' => $compartilharPerfil,
            ':preenchido' => $agora
        ]);

        $novoId = (int) $db->lastInsertId();
        $snapshotNovo = AuditLogger::capturarSnapshot($db, 'pre_atendimentos', $novoId);

        AuditLogger::registrar(
            $db,
            'CRIACAO',
            'pre_atendimentos',
            $novoId,
            '/como-funciona-atendimentos',
            null,
            $snapshotNovo,
            $usuarioAuth['id'],
            $usuarioAuth['nome_completo']
        );

        http_response_code(201);
        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Pré-atendimento acolhedor enviado com sucesso para a equipe médica!',
            'dados' => $snapshotNovo
        ]);
        exit;
    }
}

// Método não suportado
http_response_code(405);
echo json_encode(['sucesso' => false, 'mensagem' => 'Método HTTP não suportado.']);
exit;
