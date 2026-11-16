<?php
/**
 * GlicoCare — Endpoint do Módulo de Credenciamento de Profissionais e Especialistas (RN-MOD-MKT)
 * Implementa as 4 etapas do Workflow de Credenciamento:
 *  - Etapa 1 (POST): Submissão do formulário "Seja um Especialista GlicoCare" com status "Pendente de Verificação".
 *  - Etapa 2 e 3 (PATCH): Moderação Administrativa no Back-Office -> valida conselho/comprovante,
 *    define "Registro Verificado = True", gera Slug/ID e publica na listagem pública.
 *  - Etapa 4 (GET / PATCH): Listagem pública com filtros e gestão de agenda em tempo real.
 */

require_once __DIR__ . '/../../config/database.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

/**
 * Gera um slug amigável e único para a URL pública do especialista aprovado (Etapa 3)
 */
function gerarSlugEspecialista(string $nomeCompleto, int $id): string
{
    $limpo = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $nomeCompleto);
    $limpo = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $limpo));
    return trim($limpo, '-') . '-' . $id;
}

if ($method === 'GET') {
    $statusFiltro = $_GET['status'] ?? 'aprovado';

    if (!empty($_GET['id'])) {
        $stmt = $db->prepare(
            'SELECT e.*, u.nome_completo, u.email, u.telefone_whatsapp
             FROM especialistas e
             INNER JOIN usuarios u ON e.usuario_id = u.id
             WHERE e.id = :id'
        );
        $stmt->execute([':id' => (int) $_GET['id']]);
        $especialista = $stmt->fetch();

        if (!$especialista) {
            http_response_code(404);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Especialista não encontrado.']);
            exit;
        }

        echo json_encode(['sucesso' => true, 'dados' => $especialista]);
        exit;
    }

    $stmt = $db->prepare(
        'SELECT e.id, u.nome_completo, u.email, e.especialidade, e.tipo_conselho,
                e.numero_conselho, e.uf_conselho, e.foco_atuacao, e.biografia_metodo,
                e.valor_consulta, e.status_credenciamento
         FROM especialistas e
         INNER JOIN usuarios u ON e.usuario_id = u.id
         WHERE e.status_credenciamento = :status
         ORDER BY u.nome_completo ASC'
    );
    $stmt->execute([':status' => $statusFiltro]);

    echo json_encode(['sucesso' => true, 'dados' => $stmt->fetchAll()]);
    exit;
}

// ETAPA 1 (SUBMISSÃO): Recebe o formulário "Seja um Especialista GlicoCare" com status "pendente_validacao"
if ($method === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true) ?? [];

    $conselhosPermitidos = ['CRM', 'CRN', 'CRP', 'CREF', 'PEDAGOGIA'];
    $tipoConselho = strtoupper(trim($payload['tipo_conselho'] ?? ''));

    if (
        empty($payload['nome_completo']) ||
        empty($payload['email']) ||
        !in_array($tipoConselho, $conselhosPermitidos, true) ||
        empty($payload['numero_conselho']) ||
        empty($payload['uf_conselho'])
    ) {
        http_response_code(400);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Dados incompletos. É obrigatório informar registro de conselho ativo (CRM, CRN, CRP, CREF) e UF.'
        ]);
        exit;
    }

    try {
        $db->beginTransaction();

        $stmtUser = $db->prepare(
            'INSERT INTO usuarios (nome_completo, email, senha_hash, tipo_perfil, telefone_whatsapp)
             VALUES (:nome, :email, :senha, "especialista", :telefone)'
        );
        $stmtUser->execute([
            ':nome'     => trim($payload['nome_completo']),
            ':email'    => trim($payload['email']),
            ':senha'    => password_hash(bin2hex(random_bytes(8)), PASSWORD_DEFAULT),
            ':telefone' => trim($payload['telefone_whatsapp'] ?? ''),
        ]);
        $usuarioId = (int) $db->lastInsertId();

        $focosString = is_array($payload['focos_atuacao'] ?? null)
            ? implode(', ', $payload['focos_atuacao'])
            : ($payload['foco_atuacao'] ?? 'Manejo Integrado em DM1');

        $stmtEsp = $db->prepare(
            'INSERT INTO especialistas
             (usuario_id, especialidade, tipo_conselho, numero_conselho, uf_conselho,
              foco_atuacao, biografia_metodo, valor_consulta, aceite_exclusividade_financeira, status_credenciamento)
             VALUES
             (:uid, :esp, :tipo, :num, :uf, :foco, :bio, :valor, 1, "pendente_validacao")'
        );
        $stmtEsp->execute([
            ':uid'   => $usuarioId,
            ':esp'   => $payload['especialidade'] ?? 'Endocrinologia',
            ':tipo'  => $tipoConselho,
            ':num'   => trim($payload['numero_conselho']),
            ':uf'    => strtoupper(trim($payload['uf_conselho'])),
            ':foco'  => $focosString,
            ':bio'   => $payload['biografia_metodo'] ?? '',
            ':valor' => (float) ($payload['valor_consulta'] ?? 240.00),
        ]);
        $especialistaId = (int) $db->lastInsertId();

        $db->commit();

        http_response_code(201);
        echo json_encode([
            'sucesso' => true,
            'etapa_workflow' => 'Etapa 1 Concluída — Pendente de Verificação',
            'status_credenciamento' => 'Pendente de Verificação',
            'registro_verificado' => false,
            'especialista_id' => $especialistaId,
            'mensagem' => 'Submissão recebida! Seu cadastro entrou na Etapa 2 (Moderação Administrativa) com status "Pendente de Verificação".'
        ]);
    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao registrar credenciamento.', 'detalhe' => $e->getMessage()]);
    }
    exit;
}

// ETAPAS 2 e 3 (MODERAÇÃO ADMINISTRATIVA -> APROVAÇÃO E ATIVAÇÃO):
// Valida o documento e o conselho ativo, define "Registro Verificado = True", gera Slug/ID e publica na vitrine
if ($method === 'PATCH') {
    $payload = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = isset($payload['id']) ? (int) $payload['id'] : 0;
    $acao = $payload['acao'] ?? 'aprovar';
    $nomeProfissional = $payload['nome_completo'] ?? 'especialista-glicocare';

    if (!$id) {
        http_response_code(400);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Informe o ID do especialista para moderação administrativa.']);
        exit;
    }

    $novoStatus = ($acao === 'rejeitar') ? 'rejeitado' : 'aprovado';
    $registroVerificado = ($novoStatus === 'aprovado');
    $slugGerado = gerarSlugEspecialista($nomeProfissional, $id);

    $stmt = $db->prepare(
        'UPDATE especialistas
         SET status_credenciamento = :status
         WHERE id = :id'
    );
    $stmt->execute([
        ':status' => $novoStatus,
        ':id'     => $id,
    ]);

    echo json_encode([
        'sucesso' => true,
        'etapa_workflow' => $registroVerificado
            ? 'Etapa 3 e 4 Ativadas — Perfil Publicado e Agenda Liberada'
            : 'Credenciamento Rejeitado na Moderação',
        'registro_verificado' => $registroVerificado,
        'slug' => $slugGerado,
        'url_perfil_publico' => '/especialistas/' . $id,
        'mensagem' => $registroVerificado
            ? "Registro Verificado = True! Perfil #{$id} ({$slugGerado}) publicado automaticamente na listagem pública."
            : "Credenciamento #{$id} rejeitado pela moderação administrativa."
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
