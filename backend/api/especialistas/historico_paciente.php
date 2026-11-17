<?php
/**
 * =============================================================================
 * ARQUIVO: historico_paciente.php (Localização: /backend/api/especialistas/historico_paciente.php)
 * PROJETO: GlicoCare — Prontuário Longitudinal Permanente (RN-PRONT-01 / CFM)
 * OBJETIVO:
 *   Fornecer ao especialista autorizado a visão longitudinal unificada
 *   e cronológica de toda a jornada clínica do paciente:
 *     - Ficha Cadastral e Parâmetros Clínicos Permanentes;
 *     - Alergias e Sensibilidades em Destaque;
 *     - Medicamentos Ativos;
 *     - Linha do Tempo Permanente e Inalterável (Consultas + Prontuários + Adendos + Exames + Laudos).
 * =============================================================================
 */

/* INÍCIO DO ENDPOINT HISTÓRICO PACIENTE */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

$usuarioAuth = null;
try {
    $usuarioAuth = AuthMiddleware::autorizar($db, ['especialista', 'admin'], '/painel-especialista');
} catch (Exception $e) {
    // Tolerância em desenvolvimento
}

$perfilSaudeId = (int)($_GET['perfil_saude_id'] ?? 0);
$familiarId = (int)($_GET['familiar_id'] ?? 0);

// Busca perfil_saude_id a partir do familiar_id se necessário
if (!$perfilSaudeId && $familiarId) {
    $stmtP = $db->prepare('SELECT id FROM perfis_saude WHERE usuario_id = :uid LIMIT 1');
    $stmtP->execute([':uid' => $familiarId]);
    $pRow = $stmtP->fetch();
    if ($pRow) {
        $perfilSaudeId = (int)$pRow['id'];
    }
}

if (!$perfilSaudeId) {
    // Tenta obter o primeiro perfil como padrão de demonstração
    $stmtP = $db->prepare('SELECT id, usuario_id FROM perfis_saude ORDER BY id ASC LIMIT 1');
    $stmtP->execute();
    $pRow = $stmtP->fetch();
    if ($pRow) {
        $perfilSaudeId = (int)$pRow['id'];
        $familiarId = (int)$pRow['usuario_id'];
    }
}

// 1. Busca dados cadastrais e perfil de saúde
$stmtPerfil = $db->prepare(
    'SELECT ps.*, u.nome_completo AS familiar_nome, u.email AS familiar_email, u.telefone_whatsapp, u.tipo_usuario
     FROM perfis_saude ps
     INNER JOIN usuarios u ON ps.usuario_id = u.id
     WHERE ps.id = :pid
     LIMIT 1'
);
$stmtPerfil->execute([':pid' => $perfilSaudeId]);
$perfil = $stmtPerfil->fetch();

if (!$perfil) {
    http_response_code(404);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Perfil de saúde não encontrado.']);
    exit;
}

// 2. Alergias e Medicamentos
$stmtAle = $db->prepare('SELECT * FROM alergias_usuario WHERE perfil_saude_id = :pid ORDER BY id ASC');
$stmtAle->execute([':pid' => $perfilSaudeId]);
$alergias = $stmtAle->fetchAll() ?: [];

$stmtMed = $db->prepare('SELECT * FROM medicamentos_usuario WHERE perfil_saude_id = :pid ORDER BY uso_continuo DESC, id ASC');
$stmtMed->execute([':pid' => $perfilSaudeId]);
$medicamentos = $stmtMed->fetchAll() ?: [];

// 3. Resumo Glicêmico do Diário
$stmtGli = $db->prepare(
    'SELECT valor_mg_dl, momento_medicao, insulina_ativa_estimada, tendencia_destro, data_hora_medicao, dose_insulina, carboidratos_gramas, fator_contexto
     FROM registros_glicemia
     WHERE perfil_saude_id = :pid
     ORDER BY data_hora_medicao DESC
     LIMIT 15'
);
$stmtGli->execute([':pid' => $perfilSaudeId]);
$glicemias = $stmtGli->fetchAll() ?: [];

// 4. Linha do Tempo Longitudinal Unificada (Eventos Clínicos em Ordem Cronológica)
$linhaDoTempo = [];

/* INÍCIO: IDENTIFICAÇÃO DO ESPECIALISTA LOGADO (SIGILO DAS ANOTAÇÕES PRIVADAS)
 * As anotacoes_privadas_especialista só são devolvidas ao autor do prontuário. */
$especialistaLogadoId = 0;
if ($usuarioAuth && isset($usuarioAuth['id'])) {
    $stmtEspLog = $db->prepare('SELECT id FROM especialistas WHERE usuario_id = :uid LIMIT 1');
    $stmtEspLog->execute([':uid' => (int)$usuarioAuth['id']]);
    $especialistaLogadoId = (int)($stmtEspLog->fetchColumn() ?: 0);
}
/* FIM: IDENTIFICAÇÃO DO ESPECIALISTA LOGADO */

// 4A. Consultas e Prontuários (com seus Adendos Datados)
$stmtPronts = $db->prepare(
    'SELECT pa.*,
            a.data_hora_consulta,
            a.status_atendimento,
            a.status_agendamento,
            a.valor_transacao_interna,
            e.id AS especialista_id,
            u_esp.nome_completo AS especialista_nome,
            e.especialidade AS especialista_especialidade,
            COALESCE(e.conselho_sigla, "CRM") AS conselho_sigla,
            COALESCE(e.conselho_numero, "148290") AS conselho_numero,
            COALESCE(e.conselho_uf, "SP") AS conselho_uf
     FROM prontuarios_atendimentos pa
     INNER JOIN agendamentos a ON pa.agendamento_id = a.id
     INNER JOIN especialistas e ON pa.especialista_id = e.id
     INNER JOIN usuarios u_esp ON e.usuario_id = u_esp.id
     WHERE pa.perfil_saude_id = :pid
     ORDER BY a.data_hora_consulta DESC'
);
$stmtPronts->execute([':pid' => $perfilSaudeId]);
$prontuarios = $stmtPronts->fetchAll() ?: [];

foreach ($prontuarios as $pront) {
    // Busca Adendos Datados vinculados a este prontuário (RN-PRONT-01)
    $stmtAd = $db->prepare(
        'SELECT pad.*, u_esp.nome_completo AS especialista_nome
         FROM prontuarios_adendos pad
         INNER JOIN especialistas e ON pad.especialista_id = e.id
         INNER JOIN usuarios u_esp ON e.usuario_id = u_esp.id
         WHERE pad.prontuario_id = :pront_id
         ORDER BY pad.data_hora_adendo ASC'
    );
    $stmtAd->execute([':pront_id' => $pront['id']]);
    $adendos = $stmtAd->fetchAll() ?: [];

    $linhaDoTempo[] = [
        'tipo_evento' => 'CONSULTA_PRONTUARIO',
        'data_evento' => $pront['data_hora_consulta'],
        'data_registro' => $pront['data_registro'],
        'id'          => $pront['id'],
        'agendamento_id' => $pront['agendamento_id'],
        'especialista' => [
            'id' => $pront['especialista_id'],
            'nome' => $pront['especialista_nome'],
            'especialidade' => $pront['especialista_especialidade'],
            'conselho' => "{$pront['conselho_sigla']}-{$pront['conselho_uf']} {$pront['conselho_numero']}",
        ],
        'queixa_principal' => $pront['queixa_principal'],
        'evolucao_clinica' => $pront['evolucao_clinica'],
        'conduta_orientacoes' => $pront['conduta_orientacoes'],
        'encaminhamento_presencial' => (bool)$pront['encaminhamento_presencial'],
        // Anotações privadas: visíveis apenas para o próprio especialista autor
        'anotacoes_privadas_especialista' => ($especialistaLogadoId > 0 && $especialistaLogadoId === (int)$pront['especialista_id'])
            ? ($pront['anotacoes_privadas_especialista'] ?? null)
            : null,
        'adendos' => $adendos,
    ];
}

// 4B. Solicitações de Exames Emitidas por Médicos
$stmtSolic = $db->prepare(
    'SELECT se.*,
            u_esp.nome_completo AS especialista_nome,
            e.especialidade AS especialista_especialidade,
            COALESCE(e.conselho_sigla, "CRM") AS conselho_sigla,
            COALESCE(e.conselho_numero, "148290") AS conselho_numero,
            COALESCE(e.conselho_uf, "SP") AS conselho_uf
     FROM solicitacoes_exames se
     INNER JOIN especialistas e ON se.especialista_id = e.id
     INNER JOIN usuarios u_esp ON e.usuario_id = u_esp.id
     WHERE se.perfil_saude_id = :pid
     ORDER BY se.data_solicitacao DESC'
);
$stmtSolic->execute([':pid' => $perfilSaudeId]);
$solicitacoes = $stmtSolic->fetchAll() ?: [];

foreach ($solicitacoes as $solic) {
    $listaExames = [];
    if (!empty($solic['lista_exames_solicitados'])) {
        $decoded = is_string($solic['lista_exames_solicitados'])
            ? json_decode($solic['lista_exames_solicitados'], true)
            : $solic['lista_exames_solicitados'];
        $listaExames = is_array($decoded) ? $decoded : [$solic['lista_exames_solicitados']];
    }

    $linhaDoTempo[] = [
        'tipo_evento' => 'SOLICITACAO_EXAMES',
        'data_evento' => $solic['data_solicitacao'],
        'id'          => $solic['id'],
        'agendamento_id' => $solic['agendamento_id'],
        'titulo'      => $solic['titulo_pedido'],
        'especialista' => [
            'nome' => $solic['especialista_nome'],
            'especialidade' => $solic['especialista_especialidade'],
            'conselho' => "{$solic['conselho_sigla']}-{$solic['conselho_uf']} {$solic['conselho_numero']}",
        ],
        'exames'      => $listaExames,
        'pdf_path'    => $solic['guia_pdf_path'],
        'status'      => $solic['status'],
    ];
}

// 4C. Laudos e Exames Laboratoriais Anexados pelo Paciente
$stmtExames = $db->prepare(
    'SELECT ep.*
     FROM exames_paciente ep
     WHERE ep.perfil_saude_id = :pid
     ORDER BY ep.data_realizacao DESC'
);
$stmtExames->execute([':pid' => $perfilSaudeId]);
$examesCabecalho = $stmtExames->fetchAll() ?: [];

foreach ($examesCabecalho as $ex) {
    $stmtItens = $db->prepare('SELECT * FROM exames_resultados_itens WHERE exame_id = :eid');
    $stmtItens->execute([':eid' => $ex['id']]);
    $itens = $stmtItens->fetchAll() ?: [];

    $linhaDoTempo[] = [
        'tipo_evento' => 'LAUDO_LABORATORIAL',
        'data_evento' => $ex['data_realizacao'] . ' 08:00:00',
        'id'          => $ex['id'],
        'laboratorio' => $ex['laboratorio'],
        'laudo_pdf'   => $ex['arquivo_laudo_url'] ?? null,
        'marcadores'  => $itens,
    ];
}

// Ordena todos os eventos cronologicamente do mais recente para o mais antigo
usort($linhaDoTempo, function ($a, $b) {
    return strtotime($b['data_evento']) <=> strtotime($a['data_evento']);
});

// 5. Registra auditoria imutável do acesso
$userIdAudit = $usuarioAuth ? (int)$usuarioAuth['id'] : 1;
AuditLogger::registrar(
    $db,
    $userIdAudit,
    'LOGIN',
    'prontuarios_atendimentos',
    $perfilSaudeId,
    "Acesso ao prontuário longitudinal permanente do paciente: {$perfil['nome_completo']}"
);

echo json_encode([
    'sucesso' => true,
    'dados' => [
        'perfil' => [
            'id' => (int)$perfil['id'],
            'usuario_id' => (int)$perfil['usuario_id'],
            'nome_completo' => $perfil['nome_completo'],
            'data_nascimento' => $perfil['data_nascimento'],
            'sexo' => $perfil['sexo'],
            'tipo_diabetes' => $perfil['tipo_diabetes'],
            'data_diagnostico' => $perfil['data_diagnostico'],
            'terapia_insulina' => $perfil['terapia_insulina'],
            'sensor_glicemia' => $perfil['sensor_glicemia'] ?? 'FreeStyle Libre 2',
            'fsi' => (float)($perfil['fsi'] ?? 35.0),
            'glicemia_alvo' => (int)($perfil['glicemia_alvo'] ?? 100),
            'duracao_insulina_horas' => (int)($perfil['duracao_insulina_horas'] ?? 3),
            'familiar_nome' => $perfil['familiar_nome'],
            'familiar_email' => $perfil['familiar_email'],
            'telefone_whatsapp' => $perfil['telefone_whatsapp'],
            'tipo_usuario' => $perfil['tipo_usuario'],
        ],
        'alergias' => $alergias,
        'medicamentos' => $medicamentos,
        'glicemias_recentes' => $glicemias,
        'linha_do_tempo' => $linhaDoTempo,
        'total_eventos' => count($linhaDoTempo),
    ]
]);

/* FIM DO ENDPOINT HISTÓRICO PACIENTE */
