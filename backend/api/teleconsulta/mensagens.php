<?php
/**
 * =============================================================================
 * ARQUIVO: mensagens.php (Localização: /backend/api/teleconsulta/mensagens.php)
 * PROJETO: GlicoCare — Telemedicina e Comunicação em Tempo Real
 * OBJETIVO:
 *   Gerenciar o chat paralelo da teleconsulta e envio rápido de arquivos
 *   (fotos de pele, ponta de dedo, relatórios PDF) entre paciente e especialista.
 * =============================================================================
 */

/* INÍCIO DO ENDPOINT MENSAGENS TELECONSULTA */

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

$metodo = $_SERVER['REQUEST_METHOD'];

// GET: Lista mensagens do agendamento
if ($metodo === 'GET') {
    $agendamentoId = (int) ($_GET['agendamento_id'] ?? 0);
    if (!$agendamentoId) {
        http_response_code(400);
        echo json_encode(['sucesso' => false, 'mensagem' => 'agendamento_id não informado.']);
        exit;
    }

    $stmt = $db->prepare('SELECT * FROM mensagens_teleconsulta WHERE agendamento_id = :aid ORDER BY id ASC');
    $stmt->execute([':aid' => $agendamentoId]);
    $mensagens = $stmt->fetchAll();

    echo json_encode([
        'sucesso' => true,
        'mensagens' => $mensagens ?: []
    ]);
    exit;
}

// POST: Envia mensagem ou arquivo
if ($metodo === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true) ?? [];

    $agendamentoId = (int) ($payload['agendamento_id'] ?? 0);
    $remetenteId = (int) ($payload['remetente_id'] ?? 0);
    $remetenteNome = trim($payload['remetente_nome'] ?? 'Participante');
    $papelRemetente = in_array($payload['papel_remetente'] ?? '', ['especialista', 'paciente'], true) 
        ? $payload['papel_remetente'] 
        : 'paciente';
    $conteudo = trim($payload['conteudo'] ?? '');
    $arquivoUrl = trim($payload['arquivo_url'] ?? '');
    $arquivoNome = trim($payload['arquivo_nome'] ?? '');
    $arquivoTipo = trim($payload['arquivo_tipo'] ?? '');

    if (!$agendamentoId || (empty($conteudo) && empty($arquivoUrl))) {
        http_response_code(400);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Mensagem ou arquivo obrigatório.']);
        exit;
    }

    $stmt = $db->prepare(
        'INSERT INTO mensagens_teleconsulta
         (agendamento_id, remetente_id, remetente_nome, papel_remetente, conteudo, arquivo_url, arquivo_nome, arquivo_tipo)
         VALUES
         (:aid, :rid, :rnome, :rpapel, :conteudo, :aurl, :anome, :atipo)'
    );
    $stmt->execute([
        ':aid' => $agendamentoId,
        ':rid' => $remetenteId ?: 1,
        ':rnome' => $remetenteNome,
        ':rpapel' => $papelRemetente,
        ':conteudo' => $conteudo ?: null,
        ':aurl' => $arquivoUrl ?: null,
        ':anome' => $arquivoNome ?: null,
        ':atipo' => $arquivoTipo ?: null,
    ]);

    $novoId = (int) $db->lastInsertId();

    $stmtNovo = $db->prepare('SELECT * FROM mensagens_teleconsulta WHERE id = :id LIMIT 1');
    $stmtNovo->execute([':id' => $novoId]);
    $novaMsg = $stmtNovo->fetch();

    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Enviada com sucesso.',
        'dados' => $novaMsg
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['sucesso' => false, 'mensagem' => 'Método não suportado.']);

/* FIM DO ENDPOINT MENSAGENS TELECONSULTA */
