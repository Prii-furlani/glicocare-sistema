<?php
/**
 * =============================================================================
 * ARQUIVO: index.php (Localização: /backend/api/especialistas/index.php)
 * PROJETO: GlicoCare — Módulo de Credenciamento de Especialistas (RN-MOD-MKT)
 * OBJETIVO: Workflow de credenciamento e vitrine com auditoria imutável (RN-AUD-01).
 * MÉTODOS SUPORTADOS:
 *   - GET: Vitrine pública de especialistas e busca individual por ID.
 *   - POST: Submissão de credenciamento com auditoria (CRIACAO).
 *   - PATCH: Moderação administrativa (aprovação/rejeição) com auditoria (EDICAO).
 *   - DELETE: Exclusão/revogação de perfil profissional com auditoria (EXCLUSAO).
 * =============================================================================
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../services/AuditLogger.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

/**
 * Gera um slug amigável e único para a URL pública do especialista aprovado
 */
function gerarSlugEspecialista(string $nomeCompleto, int $id): string
{
    $limpo = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $nomeCompleto);
    $limpo = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '-', $limpo));
    return trim($limpo, '-') . '-' . $id;
}

/* =============================================================================
   MÉTODO GET: Listagem com filtros e detalhe individual
   ============================================================================= */
if ($method === 'GET') {
    $statusFiltro = $_GET['status'] ?? 'aprovado';

    if (!empty($_GET['id'])) {
        $stmt = $db->prepare(
            'SELECT e.*, u.nome_completo, u.email, u.telefone_whatsapp,
                    COALESCE(e.conselho_sigla, e.tipo_conselho) AS conselho_sigla,
                    COALESCE(e.conselho_numero, e.numero_conselho) AS conselho_numero,
                    COALESCE(e.conselho_uf, e.uf_conselho) AS conselho_uf,
                    COALESCE(AVG(a.nota), 4.9) AS media_nota,
                    COUNT(a.id) AS total_avaliacoes
             FROM especialistas e
             INNER JOIN usuarios u ON e.usuario_id = u.id
             LEFT JOIN avaliacoes_especialistas a ON a.especialista_id = e.id AND a.status_moderacao = "APROVADO"
             WHERE e.id = :id
             GROUP BY e.id'
        );
        $stmt->execute([':id' => (int) $_GET['id']]);
        $especialista = $stmt->fetch();

        if (!$especialista) {
            http_response_code(404);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Especialista não encontrado.']);
            exit;
        }

        // Busca lista de depoimentos e avaliações aprovadas
        $stmtAvs = $db->prepare(
            'SELECT a.id, a.nota, a.comentario, a.criado_em,
                    COALESCE(u.nome_completo, "Família GlicoCare") AS paciente_nome
             FROM avaliacoes_especialistas a
             LEFT JOIN usuarios u ON a.usuario_id = u.id
             WHERE a.especialista_id = :id AND a.status_moderacao = "APROVADO"
             ORDER BY a.criado_em DESC'
        );
        $stmtAvs->execute([':id' => (int) $_GET['id']]);
        $especialista['avaliacoes'] = $stmtAvs->fetchAll();

        echo json_encode(['sucesso' => true, 'dados' => $especialista]);
        exit;
    }

    $stmt = $db->prepare(
        'SELECT e.id, u.nome_completo, u.email, e.especialidade, e.tipo_conselho,
                e.numero_conselho, e.uf_conselho,
                COALESCE(e.conselho_sigla, e.tipo_conselho) AS conselho_sigla,
                COALESCE(e.conselho_numero, e.numero_conselho) AS conselho_numero,
                COALESCE(e.conselho_uf, e.uf_conselho) AS conselho_uf,
                e.foco_atuacao, e.biografia_metodo, e.valor_consulta, e.duracao_consulta_min,
                e.status_credenciamento, e.registro_verificado, e.slug,
                COALESCE(AVG(a.nota), 4.9) AS media_nota,
                COUNT(a.id) AS total_avaliacoes
         FROM especialistas e
         INNER JOIN usuarios u ON e.usuario_id = u.id
         LEFT JOIN avaliacoes_especialistas a ON a.especialista_id = e.id AND a.status_moderacao = "APROVADO"
         WHERE e.status_credenciamento = :status
         GROUP BY e.id
         ORDER BY u.nome_completo ASC'
    );
    $stmt->execute([':status' => $statusFiltro]);

    echo json_encode(['sucesso' => true, 'dados' => $stmt->fetchAll()]);
    exit;
}

/* =============================================================================
   MÉTODO POST: Submissão de credenciamento (Etapa 1) com auditoria (CRIACAO)
   ============================================================================= */
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
            'mensagem' => 'Dados incompletos. É obrigatório informar conselho ativo válido (CRM, CRN, CRP, CREF, PEDAGOGIA) e UF.'
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
              foco_atuacao, biografia_metodo, resumo_card, valor_consulta, duracao_consulta_min,
              aceite_exclusividade_financeira, status_credenciamento)
             VALUES
             (:uid, :esp, :tipo, :num, :uf, :foco, :bio, :resumo, :valor, :duracao, 1, "pendente_validacao")'
        );
        $stmtEsp->execute([
            ':uid'     => $usuarioId,
            ':esp'     => $payload['especialidade'] ?? 'Endocrinologia Pediátrica',
            ':tipo'    => $tipoConselho,
            ':num'     => trim($payload['numero_conselho']),
            ':uf'      => strtoupper(trim($payload['uf_conselho'])),
            ':foco'    => $focosString,
            ':bio'     => $payload['biografia_metodo'] ?? '',
            ':resumo'  => $payload['resumo_card'] ?? null,
            ':valor'   => (float) ($payload['valor_consulta'] ?? 240.00),
            ':duracao' => (int) ($payload['duracao_consulta_min'] ?? 60),
        ]);
        $especialistaId = (int) $db->lastInsertId();

        $db->commit();

        // Captura o snapshot gerado para a trilha de auditoria (RN-AUD-01)
        $snapshotNovo = AuditLogger::capturarSnapshot($db, 'especialistas', $especialistaId);

        // Registro de auditoria compulsório
        AuditLogger::registrar(
            $db,
            'CRIACAO',
            'especialistas',
            $especialistaId,
            '/credenciamento',
            null,
            $snapshotNovo,
            $usuarioId,
            trim($payload['nome_completo'])
        );

        http_response_code(201);
        echo json_encode([
            'sucesso' => true,
            'etapa_workflow' => 'Etapa 1 Concluída — Pendente de Verificação',
            'status_credenciamento' => 'Pendente de Verificação',
            'registro_verificado' => false,
            'especialista_id' => $especialistaId,
            'mensagem' => 'Submissão recebida com auditoria registrada! Entrou na Etapa 2 (Moderação Administrativa).'
        ]);
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        http_response_code(500);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Erro ao registrar credenciamento.',
            'detalhe' => $e->getMessage()
        ]);
    }
    exit;
}

/* =============================================================================
   MÉTODO PATCH: Moderação administrativa com auditoria (EDICAO)
   ============================================================================= */
if ($method === 'PATCH') {
    // Validação estrita de autorização RBAC (RN-ACC-01: Exclusivo Admin/Curadoria)
    $adminAuth = AuthMiddleware::autorizar($db, ['admin_moderador', 'admin'], '/painel-admin');

    $payload = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = isset($payload['id']) ? (int) $payload['id'] : 0;
    $acao = $payload['acao'] ?? 'aprovar';
    $nomeProfissional = $payload['nome_completo'] ?? 'especialista-glicocare';

    if (!$id) {
        http_response_code(400);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Informe o ID do especialista para moderação administrativa.']);
        exit;
    }

    // 1. Snapshot ANTES da alteração (RN-AUD-01)
    $snapshotAnterior = AuditLogger::capturarSnapshot($db, 'especialistas', $id);
    if (!$snapshotAnterior) {
        http_response_code(404);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Especialista não encontrado.']);
        exit;
    }

    $novoStatus = ($acao === 'rejeitar') ? 'rejeitado' : 'aprovado';
    $registroVerificado = ($novoStatus === 'aprovado') ? 1 : 0;
    $slugGerado = gerarSlugEspecialista($nomeProfissional, $id);

    $stmt = $db->prepare(
        'UPDATE especialistas
         SET status_credenciamento = :status,
             registro_verificado = :verificado,
             slug = :slug,
             validado_em = NOW()
         WHERE id = :id'
    );
    $stmt->execute([
        ':status'     => $novoStatus,
        ':verificado' => $registroVerificado,
        ':slug'       => $slugGerado,
        ':id'         => $id,
    ]);

    // 2. Snapshot DEPOIS da alteração
    $snapshotNovo = AuditLogger::capturarSnapshot($db, 'especialistas', $id);

    // 3. Registro compulsório de auditoria
    AuditLogger::registrar(
        $db,
        'EDICAO',
        'especialistas',
        $id,
        '/especialistas/' . $id,
        $snapshotAnterior,
        $snapshotNovo,
        $adminAuth['id'],
        $adminAuth['nome_completo']
    );

    echo json_encode([
        'sucesso' => true,
        'etapa_workflow' => ($registroVerificado === 1)
            ? 'Etapa 3 e 4 Ativadas — Perfil Publicado e Agenda Liberada'
            : 'Credenciamento Rejeitado na Moderação',
        'registro_verificado' => ($registroVerificado === 1),
        'slug' => $slugGerado,
        'url_perfil_publico' => '/especialistas/' . $id,
        'mensagem' => ($registroVerificado === 1)
            ? "Registro Verificado = True! Perfil #{$id} ({$slugGerado}) aprovado com log de auditoria imutável."
            : "Credenciamento #{$id} rejeitado na moderação administrativa com log registrado."
    ]);
    exit;
}

/* =============================================================================
   MÉTODO DELETE: Exclusão com snapshot prévio em auditoria (EXCLUSAO)
   ============================================================================= */
if ($method === 'DELETE') {
    // Validação estrita de autorização RBAC (RN-ACC-01: Exclusivo Admin/Curadoria)
    $adminAuth = AuthMiddleware::autorizar($db, ['admin_moderador', 'admin'], '/painel-admin');

    $payload = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = isset($_GET['id']) ? (int)$_GET['id'] : ($payload['id'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['sucesso' => false, 'mensagem' => 'ID do especialista é obrigatório para exclusão.']);
        exit;
    }

    // 1. Snapshot ANTES da exclusão (RN-AUD-01)
    $snapshotAnterior = AuditLogger::capturarSnapshot($db, 'especialistas', $id);
    if (!$snapshotAnterior) {
        http_response_code(404);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Especialista não encontrado.']);
        exit;
    }

    $stmt = $db->prepare('DELETE FROM especialistas WHERE id = :id');
    $stmt->execute([':id' => $id]);

    // 2. Registro de auditoria imutável (EXCLUSAO)
    AuditLogger::registrar(
        $db,
        'EXCLUSAO',
        'especialistas',
        $id,
        '/especialistas',
        $snapshotAnterior,
        null,
        $adminAuth['id'],
        $adminAuth['nome_completo']
    );

    echo json_encode([
        'sucesso' => true,
        'mensagem' => "Perfil do especialista #{$id} excluído com sucesso e preservado na trilha de auditoria."
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
