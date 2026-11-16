<?php
/**
 * GlicoCare — Endpoint de Moderação de Depoimentos (RN-MOD-01)
 * "Vozes que já passaram por aqui" exige aprovação manual prévia antes da exibição pública.
 * Métodos suportados:
 *  - GET: Lista depoimentos aprovados por artigo (?artigo_id=X) ou fila pendente para admin
 *  - POST: Envia novo depoimento com status inicial obrigatório "pendente"
 *  - PATCH: Aprova ou rejeita depoimento no painel administrativo
 */

require_once __DIR__ . '/../../config/database.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

/**
 * Motor do Moderador Oficial de Conteúdo e Acolhimento GlicoCare (RN-MOD-01)
 * Analisa criticamente mensagens, depoimentos ou sugestões segundo:
 *  1. Tom e Empatia
 *  2. Segurança Emocional e Clínica (rejeita ofensas, spam, links maliciosos,
 *     autopromoção comercial desconexa ou informações médicas falsas perigosas no DM1)
 *  3. Formato de Saída estrito: [APROVADA] ou [REJEITADA] + justificativa interna.
 */
function analisarMensagemModeradorGlicoCare(string $texto): array
{
    $textoLimpo = trim($texto);
    $textoMinusculo = mb_strtolower($textoLimpo, 'UTF-8');

    // 1. Verificação de links maliciosos, spam ou autopromoção comercial desconexa
    if (preg_match('/(https?:\/\/|www\.|\.com\.br|\.bet|pix|compre agora| ganhe dinheiro|promoção|desconto exclusivo|whatsapp\s*\d)/iu', $textoMinusculo)) {
        return [
            'classificacao' => '[REJEITADA]',
            'status_banco'  => 'rejeitado',
            'parecer'       => '[REJEITADA]: Contém links externos, spam ou autopromoção comercial desconexa, violando a segurança da comunidade GlicoCare.'
        ];
    }

    // 2. Verificação de desinformação médica perigosa para Diabetes Tipo 1 (DM1)
    if (preg_match('/(pare de tomar insulina|suspenda a insulina|cura milagrosa|chá que cura diabetes|cura definitiva do dm1|não precisa de insulina|substitua a insulina)/iu', $textoMinusculo)) {
        return [
            'classificacao' => '[REJEITADA]',
            'status_banco'  => 'rejeitado',
            'parecer'       => '[REJEITADA]: Contém informação médica falsa e gravemente perigosa para o manejo clínico do Diabetes Tipo 1 (incentivo à suspensão ou substituição indevida de insulina).'
        ];
    }

    // 3. Verificação de ofensas, ataques pessoais ou julgamentos agressivos contra famílias
    if (preg_match('/(culpa é sua|mãe irresponsável|pai irresponsável|vocês são culpados|idiota|imbecil|burrice|incompetente|lixo)/iu', $textoMinusculo)) {
        return [
            'classificacao' => '[REJEITADA]',
            'status_banco'  => 'rejeitado',
            'parecer'       => '[REJEITADA]: Viola a diretriz de Segurança Emocional e Tom de Empatia por conter linguagem ofensiva ou julgamento agressivo contra familiares.'
        ];
    }

    // Caso passe nos filtros críticos de segurança e mantenha tom respeitoso/construtivo
    return [
        'classificacao' => '[APROVADA]',
        'status_banco'  => 'pendente', // Segue para confirmação no painel conforme RN-MOD-01 com pré-parecer aprovado
        'parecer'       => '[APROVADA]: Mensagem segura, respeitosa e alinhada ao tom de acolhimento, empatia e apoio mútuo da comunidade GlicoCare.'
    ];
}

if ($method === 'GET') {
    $statusFiltro = $_GET['status'] ?? 'aprovado';
    $artigoId = isset($_GET['artigo_id']) ? (int) $_GET['artigo_id'] : null;

    if ($artigoId) {
        $stmt = $db->prepare(
            'SELECT id, artigo_id, nome_exibicao_familiar, parentesco_contexto, relato, criado_em
             FROM depoimentos_moderacao
             WHERE artigo_id = :aid AND status_moderacao = :status
             ORDER BY moderado_em DESC, criado_em DESC'
        );
        $stmt->execute([
            ':aid'    => $artigoId,
            ':status' => $statusFiltro,
        ]);
    } else {
        $stmt = $db->prepare(
            'SELECT id, artigo_id, nome_exibicao_familiar, parentesco_contexto, relato, status_moderacao, criado_em
             FROM depoimentos_moderacao
             WHERE status_moderacao = :status
             ORDER BY criado_em ASC'
        );
        $stmt->execute([':status' => $statusFiltro]);
    }

    echo json_encode(['sucesso' => true, 'dados' => $stmt->fetchAll()]);
    exit;
}

if ($method === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true) ?? [];

    if (empty($payload['artigo_id']) || empty($payload['nome_autor']) || empty($payload['conteudo'])) {
        http_response_code(400);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Artigo, nome do familiar e relato são obrigatórios.'
        ]);
        exit;
    }

    // Analisa criticamente a mensagem pelo Moderador Oficial de Conteúdo e Acolhimento
    $analise = analisarMensagemModeradorGlicoCare($payload['conteudo']);

    // RN-MOD-01: Armazena o relato junto ao parecer oficial da moderação ([APROVADA] ou [REJEITADA])
    $stmt = $db->prepare(
        'INSERT INTO depoimentos_moderacao
         (artigo_id, usuario_id, nome_exibicao_familiar, parentesco_contexto, relato, status_moderacao, motivo_moderacao)
         VALUES (:aid, :uid, :nome, :parentesco, :relato, :status_mod, :motivo)'
    );
    $stmt->execute([
        ':aid'        => (int) $payload['artigo_id'],
        ':uid'        => $payload['usuario_id'] ?? null,
        ':nome'       => trim($payload['nome_autor']),
        ':parentesco' => $payload['parentesco_contexto'] ?? 'Família DM1',
        ':relato'     => trim($payload['conteudo']),
        ':status_mod' => $analise['status_banco'],
        ':motivo'     => $analise['parecer'],
    ]);

    http_response_code(201);
    echo json_encode([
        'sucesso'       => true,
        'classificacao' => $analise['classificacao'],
        'parecer'       => $analise['parecer'],
        'mensagem'      => $analise['parecer'],
        'id'            => (int) $db->lastInsertId()
    ]);
    exit;
}

if ($method === 'PATCH') {
    $payload = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = isset($payload['id']) ? (int) $payload['id'] : 0;
    $novoStatus = $payload['status_moderacao'] ?? '';

    if (!$id || !in_array($novoStatus, ['aprovado', 'rejeitado'], true)) {
        http_response_code(400);
        echo json_encode(['sucesso' => false, 'mensagem' => 'ID e status_moderacao válido (aprovado/rejeitado) são obrigatórios.']);
        exit;
    }

    $stmt = $db->prepare(
        'UPDATE depoimentos_moderacao
         SET status_moderacao = :status,
             moderado_por_usuario_id = :admin_id,
             motivo_moderacao = :motivo,
             moderado_em = NOW()
         WHERE id = :id'
    );
    $stmt->execute([
        ':status'   => $novoStatus,
        ':admin_id' => $payload['moderado_por_usuario_id'] ?? null,
        ':motivo'   => $payload['motivo_moderacao'] ?? null,
        ':id'       => $id,
    ]);

    echo json_encode([
        'sucesso' => true,
        'mensagem' => "Depoimento #{$id} atualizado para '{$novoStatus}'."
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
