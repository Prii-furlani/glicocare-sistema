<?php
/**
 * GlicoCare — Endpoint de Artigos e Sugestões da Biblioteca
 * Métodos suportados:
 *  - GET: Lista artigos publicados ou busca um artigo específico (?id=X)
 *  - POST: Cadastra novo artigo ou sugestão de tema enviada pelas famílias
 */

require_once __DIR__ . '/../../config/database.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (!empty($_GET['id'])) {
        $stmt = $db->prepare(
            'SELECT a.*, u.nome_completo AS autor_nome
             FROM artigos_conteudos a
             LEFT JOIN usuarios u ON a.autor_usuario_id = u.id
             WHERE a.id = :id AND a.status_publicacao = "publicado"'
        );
        $stmt->execute([':id' => (int) $_GET['id']]);
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
            'SELECT id, titulo, slug, categoria, resumo, tempo_leitura_min, criado_em
             FROM artigos_conteudos
             WHERE status_publicacao = "publicado" AND categoria = :categoria
             ORDER BY criado_em DESC'
        );
        $stmt->execute([':categoria' => $categoria]);
    } else {
        $stmt = $db->query(
            'SELECT id, titulo, slug, categoria, resumo, tempo_leitura_min, criado_em
             FROM artigos_conteudos
             WHERE status_publicacao = "publicado"
             ORDER BY criado_em DESC'
        );
    }

    echo json_encode(['sucesso' => true, 'dados' => $stmt->fetchAll()]);
    exit;
}

if ($method === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true) ?? [];

    if (empty($payload['titulo']) || empty($payload['conteudo'])) {
        http_response_code(400);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Título e conteúdo são obrigatórios.']);
        exit;
    }

    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $payload['titulo'])));

    $stmt = $db->prepare(
        'INSERT INTO artigos_conteudos
         (autor_usuario_id, titulo, slug, categoria, resumo, conteudo, tempo_leitura_min, status_publicacao)
         VALUES (:autor_id, :titulo, :slug, :categoria, :resumo, :conteudo, :tempo, :status)'
    );
    $stmt->execute([
        ':autor_id'  => $payload['autor_usuario_id'] ?? null,
        ':titulo'    => trim($payload['titulo']),
        ':slug'      => $slug . '-' . time(),
        ':categoria' => $payload['categoria'] ?? 'Acolhimento Inicial',
        ':resumo'    => $payload['resumo'] ?? '',
        ':conteudo'  => $payload['conteudo'],
        ':tempo'     => (int) ($payload['tempo_leitura_min'] ?? 5),
        ':status'    => 'rascunho',
    ]);

    http_response_code(201);
    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Sugestão/artigo registrado com sucesso para curadoria editorial.',
        'id' => (int) $db->lastInsertId()
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
