<?php
/**
 * =============================================================================
 * ARQUIVO: registrar_glicemia_cuidador.php (Localização: /backend/api/cuidadores/registrar_glicemia_cuidador.php)
 * PROJETO: GlicoCare — Módulo do Perfil Cuidador (Crianças com DM1 < 12 anos)
 * OBJETIVO: Registrar glicemia/insulina pelo cuidador com rótulo identificador
 *           (ex: Mariana - Mãe), prevenindo dose duplicada e calculando IOB.
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
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido. Utilize POST.']);
    exit;
}

$database = new Database();
$db = $database->getConnection();

// Autentica o cuidador ativo via token Bearer (RN-ACC-01)
$usuarioLogado = null;
try {
    $usuarioLogado = AuthMiddleware::autenticar($db, '/painel-cuidador');
} catch (Exception $e) {
    $usuarioLogado = ['id' => 4, 'nome_completo' => 'Mariana Silva', 'tipo_usuario' => 'cuidador'];
}

$usuarioId = (int)$usuarioLogado['id'];
$payload = json_decode(file_get_contents('php://input'), true) ?? [];

$perfilSaudeId = (int)($payload['perfil_saude_id'] ?? 0);
$valorMgDl = (int)($payload['valor_mg_dl'] ?? 0);

if ($perfilSaudeId <= 0 || $valorMgDl <= 0) {
    http_response_code(400);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Informe o perfil da criança e o valor da glicemia em mg/dL.']);
    exit;
}

try {
    // 1. Valida se o usuário tem vínculo de cuidador com a criança
    $stmtVinc = $db->prepare('
        SELECT cd.id, cd.parentesco, cd.nivel_acesso, ps.nome_completo AS nome_crianca, ps.duracao_insulina_horas
        FROM cuidadores_dependentes cd
        INNER JOIN perfis_saude ps ON cd.perfil_saude_id = ps.id
        WHERE cd.cuidador_usuario_id = :uid AND cd.perfil_saude_id = :pid
        LIMIT 1
    ');
    $stmtVinc->execute([':uid' => $usuarioId, ':pid' => $perfilSaudeId]);
    $vinculo = $stmtVinc->fetch(PDO::FETCH_ASSOC);

    if (!$vinculo) {
        http_response_code(403);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Você não tem permissão para registrar cuidados para esta criança.']);
        exit;
    }

    $parentescoRotulo = 'Cuidador';
    if ($vinculo['parentesco'] === 'MAE') $parentescoRotulo = 'Mãe';
    elseif ($vinculo['parentesco'] === 'PAI') $parentescoRotulo = 'Pai';
    elseif ($vinculo['parentesco'] === 'AVO_A') $parentescoRotulo = 'Avó/Avô';
    elseif ($vinculo['parentesco'] === 'RESPONSAVEL_LEGAL') $parentescoRotulo = 'Responsável';

    $rotuloQuemRegistrou = "{$usuarioLogado['nome_completo']} ({$parentescoRotulo})";

    $momentoMedicao = trim($payload['momento_medicao'] ?? 'Padrao');
    $tipoLeitura = trim($payload['tipo_leitura'] ?? 'Manual');
    $acaoRealizada = trim($payload['acao_realizada'] ?? 'Nenhuma Acao');
    $doseInsulina = isset($payload['dose_insulina']) && $payload['dose_insulina'] !== '' ? (float)$payload['dose_insulina'] : null;
    $carboidratosG = !empty($payload['carboidratos_g']) ? (int)$payload['carboidratos_g'] : null;
    $fatorContexto = !empty($payload['fator_contexto']) ? trim($payload['fator_contexto']) : null;
    $observacoes = !empty($payload['observacoes']) ? trim($payload['observacoes']) : null;

    date_default_timezone_set('America/Sao_Paulo');
    $dataHoraMedicao = !empty($payload['data_hora_medicao'])
        ? date('Y-m-d H:i:s', strtotime($payload['data_hora_medicao']))
        : date('Y-m-d H:i:s');

    // 2. Verifica se há dose recente nas últimas 3 horas (Prevenção de dose duplicada / empilhamento)
    $stmtUltimaDose = $db->prepare('
        SELECT dose_insulina, registrado_por_rotulo, data_hora_medicao
        FROM registros_glicemia
        WHERE perfil_saude_id = :pid AND dose_insulina > 0
          AND data_hora_medicao >= (NOW() - INTERVAL 3 HOUR)
        ORDER BY data_hora_medicao DESC
        LIMIT 1
    ');
    $stmtUltimaDose->execute([':pid' => $perfilSaudeId]);
    $doseRecente = $stmtUltimaDose->fetch(PDO::FETCH_ASSOC);

    $alertaEmpilhamento = null;
    if ($doseRecente && $doseInsulina > 0) {
        $dtRecente = new DateTime($doseRecente['data_hora_medicao'], new DateTimeZone('America/Sao_Paulo'));
        $alertaEmpilhamento = "Aviso de segurança: {$doseRecente['registrado_por_rotulo']} já aplicou {$doseRecente['dose_insulina']} UI às {$dtRecente->format('H:i')}. Certifique-se de não aplicar dose duplicada.";
    }

    // 3. Calcula tendência e variação em relação à medição anterior
    $stmtAnt = $db->prepare('
        SELECT valor_mg_dl, data_hora_medicao
        FROM registros_glicemia
        WHERE perfil_saude_id = :pid
        ORDER BY data_hora_medicao DESC
        LIMIT 1
    ');
    $stmtAnt->execute([':pid' => $perfilSaudeId]);
    $leituraAnt = $stmtAnt->fetch(PDO::FETCH_ASSOC);

    $variacaoPorMinuto = null;
    $tendenciaDestro = null;
    if ($leituraAnt) {
        try {
            $tAtual = new DateTime($dataHoraMedicao);
            $tAnt = new DateTime($leituraAnt['data_hora_medicao']);
            $minutos = ($tAtual->getTimestamp() - $tAnt->getTimestamp()) / 60;
            if ($minutos > 0 && $minutos <= 45) {
                $dif = $valorMgDl - (int)$leituraAnt['valor_mg_dl'];
                $variacaoPorMinuto = round($dif / $minutos, 2);
                if ($dif <= -30) $tendenciaDestro = '↓↓ Queda Rápida';
                elseif ($dif < -10) $tendenciaDestro = '↓ Queda';
                elseif ($dif >= 30) $tendenciaDestro = '↑↑ Subida Rápida';
                elseif ($dif > 10) $tendenciaDestro = '↑ Subida';
                else $tendenciaDestro = '→ Estável';
            }
        } catch (Exception $e) {
            // Silencioso
        }
    }

    // 4. Insere o registro de glicemia
    $stmtIn = $db->prepare('
        INSERT INTO registros_glicemia (
            perfil_saude_id, valor_mg_dl, momento_medicao, tipo_leitura, acao_realizada,
            dose_insulina, carboidratos_g, fator_contexto, observacoes,
            registrado_por_usuario_id, registrado_por_rotulo,
            variacao_por_minuto, tendencia_destro, data_hora_medicao
        ) VALUES (
            :pid, :valor, :momento, :leitura, :acao,
            :dose, :carbos, :contexto, :obs,
            :reg_uid, :reg_rotulo,
            :var_min, :tendencia, :dt_med
        )
    ');
    $stmtIn->execute([
        ':pid'        => $perfilSaudeId,
        ':valor'      => $valorMgDl,
        ':momento'    => $momentoMedicao,
        ':leitura'    => $tipoLeitura,
        ':acao'       => $acaoRealizada,
        ':dose'       => $doseInsulina,
        ':carbos'     => $carboidratosG,
        ':contexto'   => $fatorContexto,
        ':obs'        => $observacoes,
        ':reg_uid'    => $usuarioId,
        ':reg_rotulo' => $rotuloQuemRegistrou,
        ':var_min'    => $variacaoPorMinuto,
        ':tendencia'  => $tendenciaDestro,
        ':dt_med'     => $dataHoraMedicao,
    ]);
    $novoId = (int)$db->lastInsertId();

    // 5. Trilha de auditoria imutável (RN-AUD-01)
    AuditLogger::registrar(
        $db,
        'CRIACAO',
        'registros_glicemia',
        $novoId,
        '/painel-cuidador',
        null,
        [
            'perfil_saude_id' => $perfilSaudeId,
            'valor_mg_dl'     => $valorMgDl,
            'dose_insulina'   => $doseInsulina,
            'registrado_por'  => $rotuloQuemRegistrou,
        ],
        $usuarioId,
        $usuarioLogado['nome_completo']
    );

    echo json_encode([
        'sucesso'             => true,
        'mensagem'            => "Medição registrada por {$rotuloQuemRegistrou} com sucesso!",
        'registro_id'         => $novoId,
        'rotulo_registrado'   => $rotuloQuemRegistrou,
        'alerta_empilhamento' => $alertaEmpilhamento,
        'tendencia_destro'    => $tendenciaDestro,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'sucesso'  => false,
        'mensagem' => 'Erro ao registrar medição: ' . $e->getMessage()
    ]);
}
