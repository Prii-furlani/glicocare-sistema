<?php
/**
 * =============================================================================
 * ARQUIVO: verificar_direito_retorno.php
 * LOCALIZAÇÃO: /backend/api/agendamentos/verificar_direito_retorno.php
 * PROJETO: GlicoCare — Precificação do Especialista & Retorno Incluso em até 30 Dias
 * OBJETIVO:
 *   1. Verificar se o paciente possui consulta avulsa concluída recente (<= 30 dias)
 *      com o especialista que ainda não gerou retorno, garantindo agendamento a R$ 0,00.
 *   2. Caso não tenha retorno disponível, aplicar a regra de precificação com
 *      split 65% Especialista / 35% GlicoCare (RN-FIN-03).
 *   3. Gravar trilha de auditoria imutável via AuditLogger (RN-AUD-01).
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

// Identifica o usuário autenticado (se logado)
$usuarioAuth = null;
try {
    $usuarioAuth = AuthMiddleware::autenticar($db, '/agendamentos/retorno');
} catch (Exception $e) {
    // Permite consulta pública de preços na vitrine se usuário não logado
}

$tz = new DateTimeZone('America/Sao_Paulo');
$agoraSp = new DateTime('now', $tz);

/* =============================================================================
   MÉTODO GET: Consulta de elegibilidade de retorno e cálculo de honorários
   ============================================================================= */
if ($method === 'GET') {
    $especialistaId = (int)($_GET['especialista_id'] ?? 0);
    $usuarioId      = (int)($usuarioAuth['id'] ?? ($_GET['usuario_id'] ?? 0));
    $perfilSaudeId  = (int)($_GET['perfil_saude_id'] ?? 0);

    if ($especialistaId <= 0) {
        http_response_code(400);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Informe o ID do especialista.']);
        exit;
    }

    // 1. Busca dados do especialista (honorários, split e política de retorno)
    $stmtEsp = $db->prepare('
        SELECT e.id, e.valor_consulta, e.percentual_repasse, e.oferece_retorno_incluso, e.prazo_retorno_dias,
               u.nome_completo AS especialista_nome, e.especialidade
        FROM especialistas e
        INNER JOIN usuarios u ON e.usuario_id = u.id
        WHERE e.id = :eid
        LIMIT 1
    ');
    $stmtEsp->execute([':eid' => $especialistaId]);
    $especialista = $stmtEsp->fetch();

    if (!$especialista) {
        http_response_code(404);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Especialista não encontrado.']);
        exit;
    }

    $valorBruto = (float)$especialista['valor_consulta'];
    $percentualRepasse = (float)($especialista['percentual_repasse'] ?? 65.00);
    $ofereceRetorno = (bool)$especialista['oferece_retorno_incluso'];
    $prazoDias = (int)($especialista['prazo_retorno_dias'] ?? 30);

    // Cálculos de repasse padrão (Split 65% / 35%)
    $repasseLiquido = round($valorBruto * ($percentualRepasse / 100), 2);
    $taxaGlicoCare = round($valorBruto - $repasseLiquido, 2);

    $retornoData = [
        'especialista_id'        => $especialistaId,
        'especialista_nome'      => $especialista['especialista_nome'],
        'especialidade'          => $especialista['especialidade'],
        'valor_consulta_bruto'   => $valorBruto,
        'percentual_repasse'     => $percentualRepasse,
        'percentual_plataforma'  => round(100 - $percentualRepasse, 2),
        'repasse_liquido_esp'    => $repasseLiquido,
        'taxa_glicocare'         => $taxaGlicoCare,
        'oferece_retorno_incluso'=> $ofereceRetorno,
        'prazo_retorno_dias'     => $prazoDias,
        'tem_direito_retorno'    => false,
        'consulta_origem'        => null,
        'banner_mensagem'        => null,
        'valor_final_a_pagar'    => $valorBruto,
    ];

    // Se o usuário estiver autenticado e o médico oferecer retorno, busca histórico
    if ($usuarioId > 0 && $ofereceRetorno) {
        // Busca consulta avulsa concluída nos últimos N dias que não tenha sido usada como agendamento_origem_id
        $stmtCheck = $db->prepare('
            SELECT a.id, a.data_hora_consulta, a.comprovante_nf, a.status_atendimento
            FROM agendamentos a
            WHERE a.especialista_id = :eid
              AND a.familiar_usuario_id = :uid
              AND a.status_atendimento = "CONCLUIDO"
              AND a.tipo_agendamento = "CONSULTA_AVULSA"
              AND a.data_hora_consulta >= DATE_SUB(NOW(), INTERVAL :prazo DAY)
              AND a.id NOT IN (
                  SELECT agendamento_origem_id
                  FROM agendamentos
                  WHERE agendamento_origem_id IS NOT NULL
                    AND status_agendamento != "cancelado"
              )
            ORDER BY a.data_hora_consulta DESC
            LIMIT 1
        ');
        $stmtCheck->execute([
            ':eid'   => $especialistaId,
            ':uid'   => $usuarioId,
            ':prazo' => $prazoDias,
        ]);
        $consultaOrigem = $stmtCheck->fetch();

        if ($consultaOrigem) {
            $dataOrigem = new DateTime($consultaOrigem['data_hora_consulta'], $tz);
            $validoAte = clone $dataOrigem;
            $validoAte->modify("+{$prazoDias} days");

            $dataFormatada = $dataOrigem->format('d/m/Y');
            $validoAteFormatada = $validoAte->format('d/m/Y');

            $retornoData['tem_direito_retorno'] = true;
            $retornoData['valor_final_a_pagar'] = 0.00;
            $retornoData['consulta_origem'] = [
                'id'                 => (int)$consultaOrigem['id'],
                'data_consulta'      => $consultaOrigem['data_hora_consulta'],
                'data_formatada'     => $dataFormatada,
                'valido_ate'         => $validoAte->format('Y-m-d H:i:s'),
                'valido_ate_formatada'=> $validoAteFormatada,
                'comprovante_nf'     => $consultaOrigem['comprovante_nf'],
            ];
            $retornoData['banner_mensagem'] = "Você possui 1 retorno incluso referente à sua consulta de {$dataFormatada} (válido até {$validoAteFormatada}). Agende sem custo adicional.";
        }
    }

    echo json_encode(['sucesso' => true, 'dados' => $retornoData]);
    exit;
}

/* =============================================================================
   MÉTODO POST: Confirmação de Retorno Incluso sem Custo (R$ 0,00)
   ============================================================================= */
if ($method === 'POST') {
    if (!$usuarioAuth) {
        http_response_code(401);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Autenticação necessária para agendar retorno.']);
        exit;
    }

    $payload = json_decode(file_get_contents('php://input'), true) ?? [];
    $especialistaId    = (int)($payload['especialista_id'] ?? 0);
    $consultaOrigemId  = (int)($payload['consulta_origem_id'] ?? 0);
    $dataHoraConsulta  = trim($payload['data_hora_consulta'] ?? '');
    $familiarId        = (int)$usuarioAuth['id'];
    $usuarioNome       = $usuarioAuth['nome_completo'];

    if ($especialistaId <= 0 || $consultaOrigemId <= 0 || empty($dataHoraConsulta)) {
        http_response_code(400);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Informe o especialista, a consulta de origem e a data/hora do retorno.',
        ]);
        exit;
    }

    // Valida se a consulta de origem realmente pertence ao usuário e está dentro do prazo
    $stmtVal = $db->prepare('
        SELECT a.id, a.data_hora_consulta, e.prazo_retorno_dias
        FROM agendamentos a
        INNER JOIN especialistas e ON a.especialista_id = e.id
        WHERE a.id = :origem_id
          AND a.especialista_id = :eid
          AND a.familiar_usuario_id = :uid
          AND a.status_atendimento = "CONCLUIDO"
          AND a.tipo_agendamento = "CONSULTA_AVULSA"
          AND a.data_hora_consulta >= DATE_SUB(NOW(), INTERVAL e.prazo_retorno_dias DAY)
          AND a.id NOT IN (
              SELECT agendamento_origem_id
              FROM agendamentos
              WHERE agendamento_origem_id IS NOT NULL
                AND status_agendamento != "cancelado"
          )
        LIMIT 1
    ');
    $stmtVal->execute([
        ':origem_id' => $consultaOrigemId,
        ':eid'       => $especialistaId,
        ':uid'       => $familiarId,
    ]);
    $origemValida = $stmtVal->fetch();

    if (!$origemValida) {
        http_response_code(422);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'A consulta de origem não é elegível para retorno incluso (prazo expirado ou já utilizado).',
        ]);
        exit;
    }

    // Verifica se slot de horário está livre
    $stmtSlot = $db->prepare('
        SELECT id FROM agendamentos
        WHERE especialista_id = :eid
          AND data_hora_consulta = :dhora
          AND status_agendamento != "cancelado"
        LIMIT 1
    ');
    $stmtSlot->execute([':eid' => $especialistaId, ':dhora' => $dataHoraConsulta]);
    if ($stmtSlot->fetch()) {
        http_response_code(409);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Este horário acabou de ser reservado. Selecione outro slot disponível.',
        ]);
        exit;
    }

    $salaNativaId = 'SALA-NATIVA-GC-' . strtoupper(bin2hex(random_bytes(4)));
    $linkVideo = '/sala-consulta/' . $salaNativaId;
    $reciboRetorno = 'RET-GC-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));

    $stmtInsert = $db->prepare('
        INSERT INTO agendamentos (
            familiar_usuario_id, especialista_id, data_hora_consulta,
            valor_transacao_interna, taxa_servico_glicocare, repasse_especialista,
            comprovante_nf, codigo_transacao_interna,
            status_pagamento_interno, status_financeiro, status_agendamento, status_atendimento,
            tipo_agendamento, agendamento_origem_id,
            sala_token_unico, link_video_integrado, observacoes_familia
        ) VALUES (
            :fuid, :eid, :dhora,
            0.00, 0.00, 0.00,
            :nf, :cod,
            "pago_custodia_interna", "RETIDO_PLATAFORMA", "confirmado", "AGENDADO",
            "RETORNO_INCLUSO", :origem_id,
            :token, :link, :obs
        )
    ');
    $stmtInsert->execute([
        ':fuid'      => $familiarId,
        ':eid'       => $especialistaId,
        ':dhora'     => $dataHoraConsulta,
        ':nf'        => $reciboRetorno,
        ':cod'       => 'RET-FREE-' . strtoupper(bin2hex(random_bytes(3))),
        ':origem_id' => $consultaOrigemId,
        ':token'     => $salaNativaId,
        ':link'      => $linkVideo,
        ':obs'       => $payload['observacoes_familia'] ?? 'Retorno incluso agendado pela família sem custo adicional.',
    ]);
    $novoId = (int)$db->lastInsertId();

    // Auditoria imutável (RN-AUD-01)
    AuditLogger::registrar(
        $db,
        'CRIACAO',
        'agendamentos',
        $novoId,
        '/agendamentos/confirmar-retorno',
        null,
        [
            'tipo_agendamento'       => 'RETORNO_INCLUSO',
            'agendamento_origem_id'  => $consultaOrigemId,
            'especialista_id'        => $especialistaId,
            'familiar_usuario_id'    => $familiarId,
            'valor_pago'             => 0.00,
            'data_hora_consulta'     => $dataHoraConsulta,
            'sala_token'             => $salaNativaId,
            'data_hora_local'        => $agoraSp->format('Y-m-d H:i:s'),
        ],
        $familiarId,
        $usuarioNome
    );

    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Retorno incluso agendado com sucesso sem cobrança adicional!',
        'dados' => [
            'agendamento_id'   => $novoId,
            'tipo_agendamento' => 'RETORNO_INCLUSO',
            'valor_cobrado'    => 0.00,
            'data_hora'        => $dataHoraConsulta,
            'link_video'       => $linkVideo,
        ],
    ]);
    exit;
}
