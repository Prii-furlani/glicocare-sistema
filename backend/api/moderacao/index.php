<?php
/**
 * =============================================================================
 * ARQUIVO: index.php (Localização: /backend/api/moderacao/index.php)
 * PROJETO: GlicoCare — Moderação de Conteúdo e Acolhimento Familiar (RN-MOD-01)
 * OBJETIVO: Fila de moderação com auditoria imutável compulsória (RN-AUD-01).
 * MÉTODOS SUPORTADOS:
 *   - GET: Consulta relatos aprovados por artigo ou fila de moderação pendente.
 *   - POST: Submissão de novo relato familiar com pré-avaliação e auditoria (CRIACAO).
 *   - PATCH: Decisão da curadoria (aprovação/rejeição) com auditoria (EDICAO).
 *   - DELETE: Exclusão de relato impróprio com snapshot prévio em auditoria (EXCLUSAO).
 * =============================================================================
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../services/AuditLogger.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

/**
 * Motor do Moderador Oficial de Conteúdo e Acolhimento GlicoCare (RN-MOD-01)
 */
function analisarMensagemModeradorGlicoCare(string $texto): array
{
    $textoLimpo = trim($texto);
    $textoMinusculo = mb_strtolower($textoLimpo, 'UTF-8');

    // 1. Verificação de links maliciosos, spam ou autopromoção comercial desconexa
    if (preg_match('/(https?:\/\/|www\.|\.com\.br|\.bet|pix|compre agora|ganhe dinheiro|promoção|desconto exclusivo|whatsapp\s*\d)/iu', $textoMinusculo)) {
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

    // Caso passe nos filtros críticos de segurança e mantenha tom acolhedor
    return [
        'classificacao' => '[APROVADA]',
        'status_banco'  => 'pendente',
        'parecer'       => '[APROVADA]: Mensagem segura, respeitosa e alinhada ao tom de acolhimento, empatia e apoio mútuo da comunidade GlicoCare.'
    ];
}

/* =============================================================================
   MÉTODO GET: Listagem de relatos aprovados ou fila de moderação
   ============================================================================= */
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

/* =============================================================================
   MÉTODO POST: Envio de relato com análise e auditoria (CRIACAO)
   ============================================================================= */
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

    $analise = analisarMensagemModeradorGlicoCare($payload['conteudo']);
    $usuarioId = !empty($payload['usuario_id']) ? (int)$payload['usuario_id'] : null;
    $nomeAutor = trim($payload['nome_autor']);

    $stmt = $db->prepare(
        'INSERT INTO depoimentos_moderacao
         (artigo_id, usuario_id, nome_exibicao_familiar, parentesco_contexto, relato, status_moderacao, motivo_moderacao)
         VALUES (:aid, :uid, :nome, :parentesco, :relato, :status_mod, :motivo)'
    );
    $stmt->execute([
        ':aid'        => (int) $payload['artigo_id'],
        ':uid'        => $usuarioId,
        ':nome'       => $nomeAutor,
        ':parentesco' => $payload['parentesco_contexto'] ?? 'Família DM1',
        ':relato'     => trim($payload['conteudo']),
        ':status_mod' => $analise['status_banco'],
        ':motivo'     => $analise['parecer'],
    ]);
    $novoId = (int) $db->lastInsertId();

    // Captura snapshot recém-criado para auditoria (RN-AUD-01)
    $snapshotNovo = AuditLogger::capturarSnapshot($db, 'depoimentos_moderacao', $novoId);

    AuditLogger::registrar(
        $db,
        'CRIACAO',
        'depoimentos_moderacao',
        $novoId,
        '/painel-moderacao',
        null,
        $snapshotNovo,
        $usuarioId,
        $nomeAutor
    );

    http_response_code(201);
    echo json_encode([
        'sucesso'       => true,
        'classificacao' => $analise['classificacao'],
        'parecer'       => $analise['parecer'],
        'mensagem'      => $analise['parecer'],
        'id'            => $novoId
    ]);
    exit;
}

/* =============================================================================
   MÉTODO PATCH: Moderação administrativa (aprovar/rejeitar) com auditoria (EDICAO)
   ============================================================================= */
if ($method === 'PATCH') {
    $payload = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = isset($payload['id']) ? (int) $payload['id'] : 0;
    $novoStatus = $payload['status_moderacao'] ?? '';

    if (!$id || !in_array($novoStatus, ['aprovado', 'rejeitado'], true)) {
        http_response_code(400);
        echo json_encode(['sucesso' => false, 'mensagem' => 'ID e status_moderacao válido (aprovado/rejeitado) são obrigatórios.']);
        exit;
    }

    // 1. Snapshot ANTES da decisão de moderação (RN-AUD-01)
    $snapshotAnterior = AuditLogger::capturarSnapshot($db, 'depoimentos_moderacao', $id);
    if (!$snapshotAnterior) {
        http_response_code(404);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Depoimento não encontrado para moderação.']);
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

    // 2. Snapshot DEPOIS da decisão
    $snapshotNovo = AuditLogger::capturarSnapshot($db, 'depoimentos_moderacao', $id);

    // 3. Registro de auditoria compulsório (EDICAO)
    $adminId = $payload['moderado_por_usuario_id'] ?? null;
    $adminNome = $payload['moderador_nome'] ?? 'Curador de Moderação';

    AuditLogger::registrar(
        $db,
        'EDICAO',
        'depoimentos_moderacao',
        $id,
        '/painel-moderacao',
        $snapshotAnterior,
        $snapshotNovo,
        $adminId,
        $adminNome
    );

    echo json_encode([
        'sucesso' => true,
        'mensagem' => "Depoimento #{$id} moderado para '{$novoStatus}' com auditoria imutável registrada."
    ]);
    exit;
}

/* =============================================================================
   MÉTODO DELETE: Exclusão com snapshot prévio em auditoria (EXCLUSAO)
   ============================================================================= */
if ($method === 'DELETE') {
    $payload = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = isset($_GET['id']) ? (int)$_GET['id'] : ($payload['id'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['sucesso' => false, 'mensagem' => 'ID do depoimento é obrigatório para exclusão.']);
        exit;
    }

    // 1. Snapshot ANTES de excluir (RN-AUD-01)
    $snapshotAnterior = AuditLogger::capturarSnapshot($db, 'depoimentos_moderacao', $id);
    if (!$snapshotAnterior) {
        http_response_code(404);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Depoimento não encontrado para exclusão.']);
        exit;
    }

    $stmt = $db->prepare('DELETE FROM depoimentos_moderacao WHERE id = :id');
    $stmt->execute([':id' => $id]);

    // 2. Registro compulsório de auditoria (EXCLUSAO)
    $adminId = $payload['usuario_id'] ?? null;
    $adminNome = $payload['usuario_nome'] ?? 'Curador de Moderação';

    AuditLogger::registrar(
        $db,
        'EXCLUSAO',
        'depoimentos_moderacao',
        $id,
        '/painel-moderacao',
        $snapshotAnterior,
        null,
        $adminId,
        $adminNome
    );

    echo json_encode([
        'sucesso' => true,
        'mensagem' => "Depoimento #{$id} excluído e preservado na trilha de auditoria."
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
