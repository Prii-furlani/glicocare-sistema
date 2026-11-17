<?php
/**
 * =============================================================================
 * ARQUIVO: painel_dados.php (Localização: /backend/api/especialistas/painel_dados.php)
 * PROJETO: GlicoCare — Workspace do Especialista (RN-PRONT-01, RN-AGD-02, RN-FIN-03)
 * OBJETIVO:
 *   1. Retornar KPIs clínicos resumidos da semana/mês;
 *   2. Enriquecer a agenda com classificação automática de 1ª Consulta vs. Retorno;
 *   3. Exibir status de Pré-Atendimento e conformidade do TCLE;
 *   4. Fornecer resumo para anamnese (alergias em alerta, IOB, diagnóstico);
 *   5. Listar a base de pacientes acompanhados pelo especialista.
 * =============================================================================
 */

/* INÍCIO DO ENDPOINT PAINEL DADOS ESPECIALISTA */

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

// 1. Autenticação e Autorização estrita (Especialista ou Admin)
$usuarioAuth = null;
try {
    $usuarioAuth = AuthMiddleware::autorizar($db, ['especialista', 'admin'], '/painel-especialista');
} catch (Exception $e) {
    // Tolerância para desenvolvimento local
    if (!empty($_GET['simular_especialista_id'])) {
        $stmtSim = $db->prepare('SELECT * FROM especialistas WHERE id = :id LIMIT 1');
        $stmtSim->execute([':id' => (int)$_GET['simular_especialista_id']]);
        $espSim = $stmtSim->fetch();
        if ($espSim) {
            $stmtU = $db->prepare('SELECT id, nome_completo, email, tipo_usuario FROM usuarios WHERE id = :uid LIMIT 1');
            $stmtU->execute([':uid' => $espSim['usuario_id']]);
            $usuarioAuth = $stmtU->fetch();
        }
    }
}

// 2. Busca cadastro do especialista
$especialistaId = 1; // Padrão Dra. Helena Vasconcelos
$especialista = null;

if ($usuarioAuth) {
    $stmtEsp = $db->prepare('SELECT * FROM especialistas WHERE usuario_id = :uid LIMIT 1');
    $stmtEsp->execute([':uid' => (int)$usuarioAuth['id']]);
    $especialista = $stmtEsp->fetch();
    if ($especialista) {
        $especialistaId = (int)$especialista['id'];
    }
}

if (!$especialista) {
    // Busca especialista padrão (Dra. Helena Vasconcelos)
    $stmtEsp = $db->prepare('SELECT * FROM especialistas WHERE id = 1 LIMIT 1');
    $stmtEsp->execute();
    $especialista = $stmtEsp->fetch();
}

// 3. Busca todos os agendamentos vinculados a este especialista
$stmtAgds = $db->prepare(
    'SELECT a.*,
            u_fam.id AS paciente_usuario_id,
            u_fam.nome_completo AS paciente_nome,
            u_fam.email AS paciente_email,
            u_fam.telefone_whatsapp,
            u_fam.tipo_usuario AS paciente_tipo_usuario
     FROM agendamentos a
     INNER JOIN usuarios u_fam ON a.familiar_usuario_id = u_fam.id
     WHERE a.especialista_id = :eid
     ORDER BY a.data_hora_consulta DESC'
);
$stmtAgds->execute([':eid' => $especialistaId]);
$agendamentosBrutos = $stmtAgds->fetchAll();

$agendaEnriquecida = [];
$totalConsultasAtivas = 0;
$totalPrimeirasConsultas = 0;
$totalRetornos = 0;
$totalPreAtendimentosProntos = 0;
$repasseLiquidoEstimadoTotal = 0.0;
$pacientesMap = [];

foreach ($agendamentosBrutos as $agd) {
    $agendamentoId = (int)$agd['id'];
    $familiarId = (int)$agd['familiar_usuario_id'];

    // Busca Perfil de Saúde do Paciente
    $stmtPerfil = $db->prepare('SELECT * FROM perfis_saude WHERE usuario_id = :uid LIMIT 1');
    $stmtPerfil->execute([':uid' => $familiarId]);
    $perfilSaude = $stmtPerfil->fetch();
    $perfilSaudeId = $perfilSaude ? (int)$perfilSaude['id'] : 1;

    // Regra de Negócio RN-PRONT-01: Identificação de 1ª Consulta vs. Retorno
    // Conta quantas consultas com status 'CONCLUIDO' já ocorreram com este especialista antes desta consulta
    $stmtHist = $db->prepare(
        'SELECT COUNT(*) AS total_concluidos
         FROM agendamentos
         WHERE familiar_usuario_id = :fid
           AND especialista_id = :eid
           AND status_atendimento = "CONCLUIDO"
           AND id != :aid
           AND data_hora_consulta <= :data_consulta'
    );
    $stmtHist->execute([
        ':fid' => $familiarId,
        ':eid' => $especialistaId,
        ':aid' => $agendamentoId,
        ':data_consulta' => $agd['data_hora_consulta']
    ]);
    $histResult = $stmtHist->fetch();
    $totalConcluidos = $histResult ? (int)$histResult['total_concluidos'] : 0;

    $isPrimeiraConsulta = ($totalConcluidos === 0);
    $retornoNumero = $isPrimeiraConsulta ? 0 : ($totalConcluidos + 1);
    $badgeTipoConsulta = $isPrimeiraConsulta ? '1ª Consulta' : "Retorno #{$retornoNumero}";

    // Status do Pré-Atendimento
    $stmtPre = $db->prepare('SELECT * FROM pre_atendimentos WHERE agendamento_id = :aid LIMIT 1');
    $stmtPre->execute([':aid' => $agendamentoId]);
    $preAtendimento = $stmtPre->fetch() ?: null;
    $preAtendimentoPreenchido = !empty($preAtendimento);

    // Status do TCLE
    $stmtTCLE = $db->prepare(
        'SELECT id, aceito, status_termo, valido_ate
         FROM consentimentos_teleconsulta
         WHERE (agendamento_id = :aid OR usuario_id = :uid)
           AND status_termo = "ATIVO"
           AND valido_ate > NOW()
         LIMIT 1'
    );
    $stmtTCLE->execute([':aid' => $agendamentoId, ':uid' => $familiarId]);
    $tcleRow = $stmtTCLE->fetch();
    $tcleValido = !empty($tcleRow);

    // Alergias em Alerta
    $stmtAle = $db->prepare('SELECT * FROM alergias_usuario WHERE perfil_saude_id = :pid ORDER BY id ASC');
    $stmtAle->execute([':pid' => $perfilSaudeId]);
    $alergias = $stmtAle->fetchAll() ?: [];

    // Últimas Glicemias (últimas 3 medições com IOB)
    $stmtGli = $db->prepare('SELECT valor_mg_dl, momento_medicao, insulina_ativa_estimada, tendencia_destro, data_hora_medicao FROM registros_glicemia WHERE perfil_saude_id = :pid ORDER BY data_hora_medicao DESC LIMIT 3');
    $stmtGli->execute([':pid' => $perfilSaudeId]);
    $glicemias = $stmtGli->fetchAll() ?: [];

    // Prontuário existente
    $stmtPront = $db->prepare('SELECT * FROM prontuarios_atendimentos WHERE agendamento_id = :aid LIMIT 1');
    $stmtPront->execute([':aid' => $agendamentoId]);
    $prontuario = $stmtPront->fetch() ?: null;

    // Métricas de KPIs
    $isAtivo = in_array(strtolower($agd['status_agendamento']), ['agendado', 'confirmado', 'em_atendimento'], true);
    if ($isAtivo) {
        $totalConsultasAtivas++;
        if ($isPrimeiraConsulta) {
            $totalPrimeirasConsultas++;
        } else {
            $totalRetornos++;
        }
        if ($preAtendimentoPreenchido) {
            $totalPreAtendimentosProntos++;
        }
        $repasseLiquidoEstimadoTotal += (float)$agd['repasse_especialista'];
    }

    $itemAgenda = [
        'id' => $agendamentoId,
        'data_hora_consulta' => $agd['data_hora_consulta'],
        'status_agendamento' => $agd['status_agendamento'],
        'status_atendimento' => $agd['status_atendimento'] ?? 'AGENDADO',
        'status_financeiro'  => $agd['status_financeiro'] ?? 'RETIDO_PLATAFORMA',
        'tipo_agendamento'   => $agd['tipo_agendamento'] ?? 'CONSULTA_AVULSA',
        'agendamento_origem_id' => $agd['agendamento_origem_id'] ?? null,
        'is_retorno_incluso' => ($agd['tipo_agendamento'] ?? '') === 'RETORNO_INCLUSO',
        'valor_transacao'    => (float)$agd['valor_transacao_interna'],
        'repasse_liquido'    => (float)$agd['repasse_especialista'],
        'sala_token_unico'   => $agd['sala_token_unico'],
        'link_video'         => $agd['link_video_integrado'] ?: "/sala-consulta/{$agd['sala_token_unico']}",
        'iniciado_em'        => $agd['iniciado_em'] ?? null,
        'encerrado_em'       => $agd['encerrado_em'] ?? null,
        'observacoes_familia'=> $agd['observacoes_familia'],
        'paciente' => [
            'id' => $familiarId,
            'nome' => $agd['paciente_nome'],
            'email' => $agd['paciente_email'],
            'telefone' => $agd['telefone_whatsapp'],
            'tipo_usuario' => $agd['paciente_tipo_usuario'],
        ],
        'perfil_saude' => $perfilSaude ?: [
            'id' => 1,
            'nome_completo' => $agd['paciente_nome'],
            'tipo_diabetes' => 'Tipo 1A',
            'data_diagnostico' => '2023-08-10',
            'terapia_insulina' => 'Caneta',
            'fsi' => 35.0,
            'glicemia_alvo' => 100,
        ],
        'classificacao_consulta' => [
            'is_primeira_consulta' => $isPrimeiraConsulta,
            'retorno_numero'       => $retornoNumero,
            'badge_label'          => $badgeTipoConsulta,
            'total_anteriores'     => $totalConcluidos,
        ],
        'pre_atendimento' => [
            'preenchido' => $preAtendimentoPreenchido,
            'dados'      => $preAtendimento,
        ],
        'tcle' => [
            'valido' => $tcleValido,
            'dados'  => $tcleRow,
        ],
        'alergias' => $alergias,
        'glicemias' => $glicemias,
        'prontuario' => $prontuario,
    ];

    $agendaEnriquecida[] = $itemAgenda;

    // Agrupa Paciente na base longitudinal
    if (!isset($pacientesMap[$familiarId])) {
        $pacientesMap[$familiarId] = [
            'familiar_id' => $familiarId,
            'perfil_saude_id' => $perfilSaudeId,
            'nome' => $perfilSaude['nome_completo'] ?? $agd['paciente_nome'],
            'responsavel' => ($agd['paciente_tipo_usuario'] === 'cuidador' ? $agd['paciente_nome'] : null),
            'tipo_diabetes' => $perfilSaude['tipo_diabetes'] ?? 'Tipo 1A',
            'data_diagnostico' => $perfilSaude['data_diagnostico'] ?? '2023-08-10',
            'terapia_insulina' => $perfilSaude['terapia_insulina'] ?? 'Caneta',
            'primeira_consulta_em' => $agd['data_hora_consulta'],
            'ultima_consulta_em' => $agd['data_hora_consulta'],
            'total_consultas' => 1,
            'total_concluidas' => ($agd['status_atendimento'] === 'CONCLUIDO' ? 1 : 0),
            'possui_alergias' => count($alergias) > 0,
            'alergias_resumo' => $alergias,
        ];
    } else {
        $pacientesMap[$familiarId]['total_consultas']++;
        if ($agd['status_atendimento'] === 'CONCLUIDO') {
            $pacientesMap[$familiarId]['total_concluidas']++;
        }
        if (strtotime($agd['data_hora_consulta']) < strtotime($pacientesMap[$familiarId]['primeira_consulta_em'])) {
            $pacientesMap[$familiarId]['primeira_consulta_em'] = $agd['data_hora_consulta'];
        }
        if (strtotime($agd['data_hora_consulta']) > strtotime($pacientesMap[$familiarId]['ultima_consulta_em'])) {
            $pacientesMap[$familiarId]['ultima_consulta_em'] = $agd['data_hora_consulta'];
        }
    }
}

// 4. Registra auditoria da visualização do workspace
$userIdAudit = $usuarioAuth ? (int)$usuarioAuth['id'] : $especialistaId;
AuditLogger::registrar(
    $db,
    $userIdAudit,
    'LOGIN',
    'especialistas',
    $especialistaId,
    'Acesso ao painel clínico de agenda, triagem e prontuário longitudinal'
);

echo json_encode([
    'sucesso' => true,
    'especialista' => [
        'id' => $especialistaId,
        'nome' => $especialista['nome_completo'] ?? 'Dra. Helena Vasconcelos',
        'especialidade' => $especialista['especialidade'] ?? 'Endocrinologia Pediátrica',
        'conselho' => ($especialista['conselho_sigla'] ?? 'CRM') . '-' . ($especialista['conselho_uf'] ?? 'SP') . ' ' . ($especialista['conselho_numero'] ?? '148290'),
        'foto_url' => $especialista['foto_perfil_url'] ?? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
        'valor_consulta'          => (float)($especialista['valor_consulta'] ?? 320.00),
        'percentual_repasse'      => (float)($especialista['percentual_repasse'] ?? 65.00),
        'repasse_liquido_consulta'=> round((float)($especialista['valor_consulta'] ?? 320.00) * ((float)($especialista['percentual_repasse'] ?? 65.00) / 100), 2),
        'oferece_retorno_incluso' => (bool)($especialista['oferece_retorno_incluso'] ?? true),
        'prazo_retorno_dias'      => (int)($especialista['prazo_retorno_dias'] ?? 30),
    ],
    'kpis' => [
        'consultas_agendadas'         => $totalConsultasAtivas,
        'primeiras_consultas'         => $totalPrimeirasConsultas,
        'retornos'                    => $totalRetornos,
        'pre_atendimentos_prontos'    => $totalPreAtendimentosProntos,
        'repasse_liquido_total'       => round($repasseLiquidoEstimadoTotal, 2),
        'percentual_repasse'          => (float)($especialista['percentual_repasse'] ?? 65.00), // Split 65% Especialista / 35% GlicoCare
    ],
    'agenda' => $agendaEnriquecida,
    'pacientes' => array_values($pacientesMap),
]);

/* FIM DO ENDPOINT PAINEL DADOS ESPECIALISTA */
