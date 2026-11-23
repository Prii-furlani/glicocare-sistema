<?php
/**
 * =============================================================================
 * ARQUIVO: index.php (Localização: /backend/api/artigos/index.php)
 * PROJETO: GlicoCare — Biblioteca de Conteúdos Pedagógicos e Guias Práticos
 * OBJETIVO: Endpoints RESTful para gestão de artigos com auditoria imutável (RN-AUD-01).
 * MÉTODOS SUPORTADOS:
 *   - GET: Consulta pública de artigos publicados ou busca por ID.
 *   - POST: Criação de novo artigo/sugestão com auditoria (CRIACAO).
 *   - PATCH: Atualização editorial de artigo com auditoria (EDICAO).
 *   - DELETE: Exclusão editorial com snapshot prévio em auditoria (EXCLUSAO).
 * =============================================================================
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../services/AuditLogger.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

/* =============================================================================
   MÉTODO GET: Consulta pública e filtragem de artigos
   ============================================================================= */
if ($method === 'GET') {
    $idOrSlug = trim($_GET['id'] ?? ($_GET['slug'] ?? ''));
    if (!empty($idOrSlug)) {
        if (is_numeric($idOrSlug)) {
            $stmt = $db->prepare(
                'SELECT a.*, u.nome_completo AS autor_nome
                 FROM artigos_conteudos a
                 LEFT JOIN usuarios u ON a.autor_usuario_id = u.id
                 WHERE a.id = :id AND a.status_publicacao = "publicado"'
            );
            $stmt->execute([':id' => (int) $idOrSlug]);
        } else {
            $stmt = $db->prepare(
                'SELECT a.*, u.nome_completo AS autor_nome
                 FROM artigos_conteudos a
                 LEFT JOIN usuarios u ON a.autor_usuario_id = u.id
                 WHERE a.slug = :slug AND a.status_publicacao = "publicado"'
            );
            $stmt->execute([':slug' => $idOrSlug]);
        }
        $artigo = $stmt->fetch();

        if (!$artigo) {
            http_response_code(404);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Artigo não encontrado.']);
            exit;
        }

        echo json_encode(['sucesso' => true, 'dados' => $artigo]);
        exit;
    }

    $categoria = $_GET['categoria'] ?? null;
    if ($categoria && $categoria !== 'Todas') {
        $stmt = $db->prepare(
            'SELECT id, titulo, slug, categoria, resumo, tempo_leitura_min, imagem_capa_url, selo_editorial, cor_capa_default, criado_em
             FROM artigos_conteudos
             WHERE status_publicacao = "publicado" AND categoria = :categoria
             ORDER BY criado_em DESC'
        );
        $stmt->execute([':categoria' => $categoria]);
    } else {
        $stmt = $db->query(
            'SELECT id, titulo, slug, categoria, resumo, tempo_leitura_min, imagem_capa_url, selo_editorial, cor_capa_default, criado_em
             FROM artigos_conteudos
             WHERE status_publicacao = "publicado"
             ORDER BY criado_em DESC'
        );
    }

    echo json_encode(['sucesso' => true, 'dados' => $stmt->fetchAll()]);
    exit;
}

/* =============================================================================
   MÉTODO POST: Criação de novo artigo com registro de auditoria imutável (CRIACAO)
   ============================================================================= */
if ($method === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true) ?? [];

    if (empty($payload['titulo']) || empty($payload['conteudo'])) {
        http_response_code(400);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Título e conteúdo são obrigatórios.']);
        exit;
    }

    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $payload['titulo'])));
    $autorId = !empty($payload['autor_usuario_id']) ? (int)$payload['autor_usuario_id'] : 1;
    $autorNome = $payload['autor_nome'] ?? 'Curadoria Editorial GlicoCare';

    $stmt = $db->prepare(
        'INSERT INTO artigos_conteudos
         (autor_usuario_id, titulo, slug, categoria, resumo, conteudo, tempo_leitura_min, imagem_capa_url, selo_editorial, cor_capa_default, status_publicacao)
         VALUES (:autor_id, :titulo, :slug, :categoria, :resumo, :conteudo, :tempo, :imagem_capa, :selo, :cor_capa, :status)'
    );
    $stmt->execute([
        ':autor_id'    => $autorId,
        ':titulo'      => trim($payload['titulo']),
        ':slug'        => $slug . '-' . time(),
        ':categoria'   => $payload['categoria'] ?? 'Acolhimento Inicial',
        ':resumo'      => $payload['resumo'] ?? '',
        ':conteudo'    => $payload['conteudo'],
        ':tempo'       => (int) ($payload['tempo_leitura_min'] ?? 5),
        ':imagem_capa' => !empty($payload['imagem_capa_url']) ? $payload['imagem_capa_url'] : null,
        ':selo'        => $payload['selo_editorial'] ?? 'GUIA ESSENCIAL',
        ':cor_capa'    => $payload['cor_capa_default'] ?? 'terracota',
        ':status'      => $payload['status_publicacao'] ?? 'rascunho',
    ]);
    $novoId = (int) $db->lastInsertId();

    // Captura o snapshot recém-criado para auditoria (RN-AUD-01)
    $snapshotNovo = AuditLogger::capturarSnapshot($db, 'artigos_conteudos', $novoId);

    // Registra compulsoriamente a ação CRIACAO no AuditLogger
    AuditLogger::registrar(
        $db,
        'CRIACAO',
        'artigos_conteudos',
        $novoId,
        '/conteudos',
        null,
        $snapshotNovo,
        $autorId,
        $autorNome
    );

    http_response_code(201);
    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Artigo registrado com sucesso e auditado.',
        'id' => $novoId
    ]);
    exit;
}

/* =============================================================================
   MÉTODO PATCH: Edição de artigo com captura de valor_anterior e valor_novo (EDICAO)
   ============================================================================= */
if ($method === 'PATCH') {
    $payload = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = isset($payload['id']) ? (int)$payload['id'] : 0;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['sucesso' => false, 'mensagem' => 'ID do artigo é obrigatório para edição.']);
        exit;
    }

    // 1. Captura snapshot ANTES da alteração (RN-AUD-01)
    $snapshotAnterior = AuditLogger::capturarSnapshot($db, 'artigos_conteudos', $id);
    if (!$snapshotAnterior) {
        http_response_code(404);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Artigo não encontrado para edição.']);
        exit;
    }

    // 2. Aplica atualizações conforme campos enviados
    $campos = [];
    $params = [':id' => $id];

    if (isset($payload['titulo'])) {
        $campos[] = 'titulo = :titulo';
        $params[':titulo'] = trim($payload['titulo']);
    }
    if (isset($payload['categoria'])) {
        $campos[] = 'categoria = :categoria';
        $params[':categoria'] = trim($payload['categoria']);
    }
    if (isset($payload['resumo'])) {
        $campos[] = 'resumo = :resumo';
        $params[':resumo'] = trim($payload['resumo']);
    }
    if (isset($payload['conteudo'])) {
        $campos[] = 'conteudo = :conteudo';
        $params[':conteudo'] = $payload['conteudo'];
    }
    if (isset($payload['tempo_leitura_min'])) {
        $campos[] = 'tempo_leitura_min = :tempo';
        $params[':tempo'] = (int)$payload['tempo_leitura_min'];
    }
    if (isset($payload['imagem_capa_url'])) {
        $campos[] = 'imagem_capa_url = :imagem_capa';
        $params[':imagem_capa'] = !empty($payload['imagem_capa_url']) ? $payload['imagem_capa_url'] : null;
    }
    if (isset($payload['selo_editorial'])) {
        $campos[] = 'selo_editorial = :selo';
        $params[':selo'] = trim($payload['selo_editorial']);
    }
    if (isset($payload['cor_capa_default'])) {
        $campos[] = 'cor_capa_default = :cor_capa';
        $params[':cor_capa'] = trim($payload['cor_capa_default']);
    }
    if (isset($payload['status_publicacao'])) {
        $campos[] = 'status_publicacao = :status';
        $params[':status'] = trim($payload['status_publicacao']);
    }

    if (empty($campos)) {
        http_response_code(400);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Nenhum campo fornecido para atualização.']);
        exit;
    }

    $sql = 'UPDATE artigos_conteudos SET ' . implode(', ', $campos) . ' WHERE id = :id';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    // 3. Captura snapshot DEPOIS da alteração
    $snapshotNovo = AuditLogger::capturarSnapshot($db, 'artigos_conteudos', $id);

    // 4. Registra auditoria compulsoriamente (RN-AUD-01)
    $usuarioId = $payload['usuario_id'] ?? $snapshotAnterior['autor_usuario_id'];
    $usuarioNome = $payload['usuario_nome'] ?? 'Equipe Editorial GlicoCare';

    AuditLogger::registrar(
        $db,
        'EDICAO',
        'artigos_conteudos',
        $id,
        '/conteudos/' . $id,
        $snapshotAnterior,
        $snapshotNovo,
        $usuarioId,
        $usuarioNome
    );

    echo json_encode([
        'sucesso' => true,
        'mensagem' => "Artigo #{$id} atualizado com sucesso e auditado com conformidade imutável."
    ]);
    exit;
}

/* =============================================================================
   MÉTODO DELETE: Exclusão de artigo com preservação do histórico em auditoria (EXCLUSAO)
   ============================================================================= */
if ($method === 'DELETE') {
    $payload = json_decode(file_get_contents('php://input'), true) ?? [];
    $id = isset($_GET['id']) ? (int)$_GET['id'] : ($payload['id'] ?? 0);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['sucesso' => false, 'mensagem' => 'ID do artigo é obrigatório para exclusão.']);
        exit;
    }

    // 1. Captura snapshot do registro ANTES de excluir (RN-AUD-01)
    $snapshotAnterior = AuditLogger::capturarSnapshot($db, 'artigos_conteudos', $id);
    if (!$snapshotAnterior) {
        http_response_code(404);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Artigo não encontrado para exclusão.']);
        exit;
    }

    // 2. Remove o registro
    $stmt = $db->prepare('DELETE FROM artigos_conteudos WHERE id = :id');
    $stmt->execute([':id' => $id]);

    // 3. Registra auditoria imutável com valor_novo = NULL
    $usuarioId = $payload['usuario_id'] ?? null;
    $usuarioNome = $payload['usuario_nome'] ?? 'Administrador';

    AuditLogger::registrar(
        $db,
        'EXCLUSAO',
        'artigos_conteudos',
        $id,
        '/conteudos',
        $snapshotAnterior,
        null,
        $usuarioId,
        $usuarioNome
    );

    echo json_encode([
        'sucesso' => true,
        'mensagem' => "Artigo #{$id} excluído com sucesso e preservado na trilha de auditoria."
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
