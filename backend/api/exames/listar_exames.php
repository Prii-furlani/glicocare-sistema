<?php
/**
 * =============================================================================
 * ARQUIVO: listar_exames.php (Localização: /backend/api/exames/listar_exames.php)
 * PROJETO: GlicoCare — Central de Exames e Linha do Tempo Laboratorial
 * OBJETIVO: Listar histórico completo de coletas e exames de um perfil de saúde,
 *           incluindo marcadores individuais aninhados, laudos anexados e
 *           pedidos/guias médicas emitidas por especialistas (RN-EXA-01).
 *
 * PERFIS AUTORIZADOS:
 *   - Paciente / Cuidador: Consulta o histórico de exames do próprio perfil.
 *   - Especialista: Consulta histórico de seus pacientes em teleconsulta/acompanhamento.
 *   - Curadoria / Admin: Auditoria e suporte operacional.
 * =============================================================================
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Método não permitido. Utilize GET.'
    ]);
    exit;
}

$database = new Database();
$db = $database->getConnection();

$usuarioLogado = AuthMiddleware::autenticar($db, '/meu-perfil');
$usuarioId = (int)$usuarioLogado['id'];
$tipoUsuario = $usuarioLogado['tipo_usuario'] ?? $usuarioLogado['tipo_perfil'];

try {
    $perfilSaudeId = isset($_GET['perfil_saude_id']) ? (int)$_GET['perfil_saude_id'] : 0;
    $agendamentoId = isset($_GET['agendamento_id']) ? (int)$_GET['agendamento_id'] : 0;

    // Se informado agendamento_id, busca o perfil_saude vinculado
    if ($perfilSaudeId <= 0 && $agendamentoId > 0) {
        $stmtAg = $db->prepare('
            SELECT ps.id AS perfil_saude_id
            FROM agendamentos a
            LEFT JOIN perfis_saude ps ON ps.usuario_id = a.familiar_usuario_id
            WHERE a.id = :aid
            ORDER BY ps.id ASC LIMIT 1
        ');
        $stmtAg->execute([':aid' => $agendamentoId]);
        $rowAg = $stmtAg->fetch(PDO::FETCH_ASSOC);
        if ($rowAg && !empty($rowAg['perfil_saude_id'])) {
            $perfilSaudeId = (int)$rowAg['perfil_saude_id'];
        }
    }

    // Se perfil ainda não resolvido e for paciente/cuidador, busca o próprio perfil
    if ($perfilSaudeId <= 0) {
        $stmtP = $db->prepare('SELECT id FROM perfis_saude WHERE usuario_id = :uid ORDER BY id DESC LIMIT 1');
        $stmtP->execute([':uid' => $usuarioId]);
        $rowP = $stmtP->fetch(PDO::FETCH_ASSOC);
        if ($rowP) {
            $perfilSaudeId = (int)$rowP['id'];
        }
    }

    if ($perfilSaudeId <= 0) {
        http_response_code(200);
        echo json_encode([
            'sucesso' => true,
            'perfil_saude' => null,
            'solicitacoes' => [],
            'exames' => [],
            'mensagem' => 'Nenhum perfil de saúde encontrado para este usuário.'
        ]);
        exit;
    }

    // 1. Busca dados básicos do perfil de saúde
    $stmtPerfil = $db->prepare('
        SELECT id, usuario_id, nome_completo, data_nascimento, sexo, tipo_diabetes, data_diagnostico
        FROM perfis_saude
        WHERE id = :pid
    ');
    $stmtPerfil->execute([':pid' => $perfilSaudeId]);
    $perfilSaude = $stmtPerfil->fetch(PDO::FETCH_ASSOC);

    // 2. Busca solicitações de exames (guias médicas) vinculadas ao perfil
    $stmtSolic = $db->prepare('
        SELECT se.id, se.agendamento_id, se.especialista_id, se.perfil_saude_id,
               se.titulo_pedido, se.lista_exames_solicitados, se.guia_pdf_path,
               se.status, se.data_solicitacao,
               e.especialidade, e.tipo_conselho, e.numero_conselho, e.uf_conselho,
               u.nome_completo AS especialista_nome
        FROM solicitacoes_exames se
        INNER JOIN especialistas e ON se.especialista_id = e.id
        INNER JOIN usuarios u ON e.usuario_id = u.id
        WHERE se.perfil_saude_id = :pid
        ORDER BY se.data_solicitacao DESC
    ');
    $stmtSolic->execute([':pid' => $perfilSaudeId]);
    $solicitacoesRaw = $stmtSolic->fetchAll(PDO::FETCH_ASSOC);

    $solicitacoes = array_map(function ($row) {
        $lista = $row['lista_exames_solicitados'];
        if (is_string($lista)) {
            $decoded = json_decode($lista, true);
            $row['lista_exames_solicitados'] = is_array($decoded) ? $decoded : [];
        }
        return $row;
    }, $solicitacoesRaw);

    // 3. Busca histórico de exames realizados (cabeçalhos)
    $stmtExames = $db->prepare('
        SELECT ep.id, ep.perfil_saude_id, ep.solicitacao_id, ep.laboratorio,
               ep.data_realizacao, ep.data_registro_app, ep.arquivo_anexo_path,
               ep.arquivo_nome_original, ep.observacoes_paciente,
               se.titulo_pedido AS solicitacao_titulo
        FROM exames_paciente ep
        LEFT JOIN solicitacoes_exames se ON ep.solicitacao_id = se.id
        WHERE ep.perfil_saude_id = :pid
        ORDER BY ep.data_realizacao DESC, ep.id DESC
    ');
    $stmtExames->execute([':pid' => $perfilSaudeId]);
    $exames = $stmtExames->fetchAll(PDO::FETCH_ASSOC);

    // 4. Busca os marcadores de cada exame
    if (!empty($exames)) {
        $exameIds = array_column($exames, 'id');
        $placeholders = implode(',', array_fill(0, count($exameIds), '?'));

        $stmtItens = $db->prepare("
            SELECT id, exame_id, nome_marcador, valor_resultado, unidade, valor_referencia
            FROM exames_resultados_itens
            WHERE exame_id IN ($placeholders)
            ORDER BY id ASC
        ");
        $stmtItens->execute($exameIds);
        $todosItens = $stmtItens->fetchAll(PDO::FETCH_ASSOC);

        $itensPorExame = [];
        foreach ($todosItens as $item) {
            $eid = (int)$item['exame_id'];
            if (!isset($itensPorExame[$eid])) {
                $itensPorExame[$eid] = [];
            }
            $itensPorExame[$eid][] = $item;
        }

        foreach ($exames as &$ex) {
            $eid = (int)$ex['id'];
            $ex['marcadores'] = $itensPorExame[$eid] ?? [];
        }
        unset($ex);
    }

    echo json_encode([
        'sucesso' => true,
        'perfil_saude' => $perfilSaude,
        'solicitacoes' => $solicitacoes,
        'exames' => $exames
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Erro ao carregar histórico de exames: ' . $e->getMessage()
    ]);
}
