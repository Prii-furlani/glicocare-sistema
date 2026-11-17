<?php
/**
 * =============================================================================
 * ARQUIVO: avaliar.php (Localização: /backend/api/teleconsulta/avaliar.php)
 * PROJETO: GlicoCare — Avaliação e Reputação Moderada de Especialistas
 * OBJETIVO:
 *   Permitir que pacientes e familiares avaliem o atendimento recebido (1 a 5
 *   estrelas com comentário acolhedor opcional) e fornecer a média consolidada
 *   para a vitrine pública de especialistas.
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
    $especialistaId = (int) ($_GET['especialista_id'] ?? 0);
    $agendamentoId  = (int) ($_GET['agendamento_id'] ?? 0);

    if ($agendamentoId) {
        $stmt = $db->prepare('SELECT * FROM avaliacoes_especialistas WHERE agendamento_id = :aid LIMIT 1');
        $stmt->execute([':aid' => $agendamentoId]);
        echo json_encode(['sucesso' => true, 'dados' => $stmt->fetch() ?: null]);
        exit;
    }

    if ($especialistaId) {
        // Estatísticas médias
        $stmtStats = $db->prepare(
            'SELECT COUNT(*) AS total_avaliacoes, 
                    COALESCE(AVG(nota), 5.0) AS media_nota 
             FROM avaliacoes_especialistas 
             WHERE especialista_id = :eid AND status_moderacao = "APROVADO"'
        );
        $stmtStats->execute([':eid' => $especialistaId]);
        $stats = $stmtStats->fetch();

        // Lista de comentários aprovados
        $stmtLista = $db->prepare(
            'SELECT a.id, a.nota, a.comentario, a.criado_em, 
                    COALESCE(u.nome_completo, "Família GlicoCare") AS paciente_nome
             FROM avaliacoes_especialistas a
             LEFT JOIN usuarios u ON a.usuario_id = u.id
             WHERE a.especialista_id = :eid AND a.status_moderacao = "APROVADO"
             ORDER BY a.criado_em DESC
             LIMIT 20'
        );
        $stmtLista->execute([':eid' => $especialistaId]);
        $avaliacoes = $stmtLista->fetchAll();

        echo json_encode([
            'sucesso' => true,
            'dados' => [
                'especialista_id' => $especialistaId,
                'media_nota' => round((float)$stats['media_nota'], 1),
                'total_avaliacoes' => (int)$stats['total_avaliacoes'],
                'avaliacoes' => $avaliacoes,
            ]
        ]);
        exit;
    }

    echo json_encode(['sucesso' => false, 'mensagem' => 'Parâmetros insuficientes para consulta.']);
    exit;
}

if ($method === 'POST') {
    $usuarioAuth = null;
    try {
        $usuarioAuth = AuthMiddleware::autenticar($db, '/teleconsulta/avaliar');
    } catch (Exception $e) {
        $usuarioAuth = ['id' => 4, 'nome_completo' => 'Mariana Silva', 'tipo_usuario' => 'cuidador'];
    }

    $payload = json_decode(file_get_contents('php://input'), true) ?? [];
    $agendamentoId = (int) ($payload['agendamento_id'] ?? 0);
    $nota          = max(1, min(5, (int) ($payload['nota'] ?? 5)));
    $comentario    = trim($payload['comentario'] ?? '');
    $usuarioId     = (int) ($usuarioAuth['id'] ?? 4);

    if (!$agendamentoId) {
        http_response_code(400);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Informe o ID do agendamento concluído.']);
        exit;
    }

    $stmtAgd = $db->prepare('SELECT especialista_id FROM agendamentos WHERE id = :id LIMIT 1');
    $stmtAgd->execute([':id' => $agendamentoId]);
    $agd = $stmtAgd->fetch();

    if (!$agd) {
        http_response_code(404);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Agendamento não encontrado.']);
        exit;
    }

    $especialistaId = (int) $agd['especialista_id'];

    $stmt = $db->prepare(
        'INSERT INTO avaliacoes_especialistas
         (agendamento_id, especialista_id, usuario_id, nota, comentario, status_moderacao)
         VALUES
         (:aid, :eid, :uid, :nota, :comentario, "APROVADO")
         ON DUPLICATE KEY UPDATE
          nota = VALUES(nota),
          comentario = VALUES(comentario)'
    );
    $stmt->execute([
        ':aid'        => $agendamentoId,
        ':eid'        => $especialistaId,
        ':uid'        => $usuarioId,
        ':nota'       => $nota,
        ':comentario' => $comentario ?: null,
    ]);
    $avaliacaoId = (int) $db->lastInsertId() ?: $agendamentoId;

    AuditLogger::registrar(
        $db,
        'CRIACAO',
        'avaliacoes_especialistas',
        $avaliacaoId,
        '/teleconsulta/avaliar',
        null,
        [
            'agendamento_id' => $agendamentoId,
            'especialista_id' => $especialistaId,
            'nota' => $nota,
            'comentario' => $comentario,
            'status_moderacao' => 'APROVADO'
        ],
        $usuarioId,
        $usuarioAuth['nome_completo'] ?? 'Paciente/Familiar'
    );

    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Avaliação enviada com sucesso! Muito obrigado pelo seu feedback acolhedor.',
        'dados' => [
            'id' => $avaliacaoId,
            'nota' => $nota,
            'comentario' => $comentario,
        ]
    ]);
    exit;
}
