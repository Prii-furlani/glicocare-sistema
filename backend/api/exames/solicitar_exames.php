<?php
/**
 * =============================================================================
 * ARQUIVO: solicitar_exames.php (Localização: /backend/api/exames/solicitar_exames.php)
 * PROJETO: GlicoCare — Emissão de Guias de Solicitação de Exames
 * OBJETIVO: Permitir que especialistas emitam guias de exames laboratoriais
 *           durante ou após teleconsultas, com auditoria imutável (RN-EXA-01 / RN-AUD-01).
 * =============================================================================
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../../services/AuditLogger.php';

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Método não permitido. Utilize POST.'
    ]);
    exit;
}

$database = new Database();
$db = $database->getConnection();

// Apenas especialistas ou curadores/administradores podem emitir guias médicas
$usuarioLogado = AuthMiddleware::autorizar($db, ['especialista', 'admin'], '/especialistas/atendimento');
$usuarioId = (int)$usuarioLogado['id'];
$usuarioNome = $usuarioLogado['nome_completo'];

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

try {
    $agendamentoId = isset($input['agendamento_id']) ? (int)$input['agendamento_id'] : 0;
    $perfilSaudeId = isset($input['perfil_saude_id']) ? (int)$input['perfil_saude_id'] : 0;
    $tituloPedido = trim($input['titulo_pedido'] ?? '');
    $listaExames = $input['lista_exames_solicitados'] ?? [];

    if (is_string($listaExames)) {
        $decoded = json_decode($listaExames, true);
        if (is_array($decoded)) {
            $listaExames = $decoded;
        } else {
            $listaExames = array_filter(array_map('trim', explode(',', $listaExames)));
        }
    }

    if ($agendamentoId <= 0) {
        http_response_code(422);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Agendamento vinculado não informado.']);
        exit;
    }

    if (empty($tituloPedido)) {
        http_response_code(422);
        echo json_encode(['sucesso' => false, 'mensagem' => 'O título do pedido médico é obrigatório.']);
        exit;
    }

    if (empty($listaExames) || !is_array($listaExames)) {
        http_response_code(422);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Selecione ao menos um exame para a guia médica.']);
        exit;
    }

    // Identifica o especialista emissor
    $stmtEsp = $db->prepare('SELECT id FROM especialistas WHERE usuario_id = :uid LIMIT 1');
    $stmtEsp->execute([':uid' => $usuarioId]);
    $espRow = $stmtEsp->fetch(PDO::FETCH_ASSOC);

    if ($espRow) {
        $especialistaId = (int)$espRow['id'];
    } else {
        // Se for admin emitindo suporte para a consulta, busca o especialista do próprio agendamento
        $stmtAgEsp = $db->prepare('SELECT especialista_id FROM agendamentos WHERE id = :aid');
        $stmtAgEsp->execute([':aid' => $agendamentoId]);
        $rowAgEsp = $stmtAgEsp->fetch(PDO::FETCH_ASSOC);
        $especialistaId = $rowAgEsp ? (int)$rowAgEsp['especialista_id'] : 1;
    }

    // Se perfil_saude_id não foi passado, descobre através do familiar do agendamento
    if ($perfilSaudeId <= 0) {
        $stmtPerfil = $db->prepare('
            SELECT ps.id
            FROM agendamentos a
            INNER JOIN perfis_saude ps ON ps.usuario_id = a.familiar_usuario_id
            WHERE a.id = :aid
            ORDER BY ps.id ASC LIMIT 1
        ');
        $stmtPerfil->execute([':aid' => $agendamentoId]);
        $rowPerfil = $stmtPerfil->fetch(PDO::FETCH_ASSOC);
        if ($rowPerfil) {
            $perfilSaudeId = (int)$rowPerfil['id'];
        }
    }

    if ($perfilSaudeId <= 0) {
        http_response_code(422);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Perfil de saúde do paciente não localizado.']);
        exit;
    }

    $tz = new DateTimeZone('America/Sao_Paulo');
    $agoraSp = (new DateTime('now', $tz))->format('Y-m-d H:i:s');
    $jsonExames = json_encode(array_values($listaExames), JSON_UNESCAPED_UNICODE);

    $stmtInsert = $db->prepare('
        INSERT INTO solicitacoes_exames (
            agendamento_id, especialista_id, perfil_saude_id,
            titulo_pedido, lista_exames_solicitados, guia_pdf_path,
            status, data_solicitacao
        ) VALUES (
            :aid, :eid, :pid,
            :titulo, :exames, NULL,
            "PENDENTE", :agora
        )
    ');

    $stmtInsert->execute([
        ':aid'    => $agendamentoId,
        ':eid'    => $especialistaId,
        ':pid'    => $perfilSaudeId,
        ':titulo' => $tituloPedido,
        ':exames' => $jsonExames,
        ':agora'  => $agoraSp
    ]);

    $solicitacaoId = (int)$db->lastInsertId();
    $guiaPdfPath = '/backend/api/exames/gerar_guia_pdf.php?id=' . $solicitacaoId;

    $stmtUpd = $db->prepare('UPDATE solicitacoes_exames SET guia_pdf_path = :path WHERE id = :id');
    $stmtUpd->execute([':path' => $guiaPdfPath, ':id' => $solicitacaoId]);

    // Trilha de auditoria imutável (RN-AUD-01)
    AuditLogger::registrar(
        $db,
        'CRIACAO',
        'solicitacoes_exames',
        $solicitacaoId,
        '/especialistas/atendimento',
        null,
        [
            'agendamento_id' => $agendamentoId,
            'especialista_id' => $especialistaId,
            'perfil_saude_id' => $perfilSaudeId,
            'titulo_pedido' => $tituloPedido,
            'total_exames' => count($listaExames)
        ],
        $usuarioId,
        $usuarioNome
    );

    http_response_code(201);
    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Guia médica de exames gerada com sucesso!',
        'solicitacao_id' => $solicitacaoId,
        'guia_pdf_path' => $guiaPdfPath
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Erro ao emitir guia de exames: ' . $e->getMessage()
    ]);
}
