<?php
/* =============================================================================
 * ARQUIVO: gerenciar_artigos.php (Localização: /backend/api/admin/gerenciar_artigos.php)
 * PROJETO: GlicoCare — Gestão Editorial da Biblioteca de Conteúdos
 * OBJETIVO: Permitir ao Administrador (Priscila) criar, editar, listar, excluir
 *           e publicar artigos com blocos estruturados, capas personalizadas
 *           e controle de status editorial com registro imutável no AuditLogger.
 * AUTORIZAÇÃO: Restrito ao perfil 'admin' / 'admin_moderador' (RN-ACC-01).
 * ============================================================================= */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../../services/AuditLogger.php';

try {
    /* INÍCIO DA AUTORIZAÇÃO ADMINISTRATIVA */
    $db = Database::getConnection();
    $adminAuth = AuthMiddleware::autorizar($db, ['admin', 'admin_moderador'], '/admin/artigos');
    /* FIM DA AUTORIZAÇÃO ADMINISTRATIVA */

    $dirUploads = __DIR__ . '/../../uploads/artigos/';
    if (!is_dir($dirUploads)) {
        mkdir($dirUploads, 0755, true);
    }

    $metodo = $_SERVER['REQUEST_METHOD'];

    /* =========================================================================
       MÉTODO GET: LISTAR OU CONSULTAR ARTIGO
       ========================================================================= */
    if ($metodo === 'GET') {
        $id = isset($_GET['id']) ? (int)$_GET['id'] : null;

        if ($id) {
            $stmt = $db->prepare("
                SELECT id, autor_usuario_id, autor_nome, titulo, titulo_destaque_italico, 
                       subtitulo, slug, categoria, resumo, conteudo, conteudo_blocos, 
                       tempo_leitura, tempo_leitura_min, imagem_capa_url, legenda_capa, 
                       status_publicacao, criado_em, atualizado_em
                FROM artigos_conteudos
                WHERE id = :id
            ");
            $stmt->execute([':id' => $id]);
            $artigo = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$artigo) {
                http_response_code(404);
                echo json_encode(['sucesso' => false, 'mensagem' => 'Artigo não encontrado.'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            if (!empty($artigo['conteudo_blocos'])) {
                $artigo['conteudo_blocos'] = json_decode($artigo['conteudo_blocos'], true);
            }

            echo json_encode(['sucesso' => true, 'dados' => $artigo], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Listagem geral com filtros opcionais
        $categoria = $_GET['categoria'] ?? null;
        $status = $_GET['status'] ?? null;
        $busca = $_GET['busca'] ?? null;

        $clausulas = [];
        $params = [];

        if ($categoria) {
            $clausulas[] = "categoria = :categoria";
            $params[':categoria'] = $categoria;
        }

        if ($status) {
            $clausulas[] = "status_publicacao = :status";
            $params[':status'] = $status;
        }

        if ($busca) {
            $clausulas[] = "(titulo LIKE :busca OR resumo LIKE :busca OR autor_nome LIKE :busca)";
            $params[':busca'] = "%{$busca}%";
        }

        $whereSql = !empty($clausulas) ? "WHERE " . implode(" AND ", $clausulas) : "";

        $stmtList = $db->prepare("
            SELECT id, autor_nome, titulo, titulo_destaque_italico, subtitulo, slug, 
                   categoria, resumo, tempo_leitura, imagem_capa_url, legenda_capa, 
                   status_publicacao, criado_em, atualizado_em
            FROM artigos_conteudos
            {$whereSql}
            ORDER BY id DESC
        ");
        $stmtList->execute($params);
        $artigos = $stmtList->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'sucesso' => true,
            'total' => count($artigos),
            'dados' => $artigos,
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    /* =========================================================================
       MÉTODO POST OU PUT: CRIAR OU ATUALIZAR ARTIGO
       ========================================================================= */
    if ($metodo === 'POST' || $metodo === 'PUT') {
        $dados = [];
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        if (str_contains($contentType, 'application/json')) {
            $dados = json_decode(file_get_contents('php://input'), true) ?? [];
        } else {
            $dados = $_POST;
        }

        // Processa upload de capa em $_FILES['imagem_capa']
        if (isset($_FILES['imagem_capa']) && $_FILES['imagem_capa']['error'] === UPLOAD_ERR_OK) {
            $arquivo = $_FILES['imagem_capa'];
            $ext = strtolower(pathinfo($arquivo['name'], PATHINFO_EXTENSION));
            $extPermitidas = ['jpg', 'jpeg', 'png', 'webp'];

            if (!in_array($ext, $extPermitidas, true)) {
                throw new InvalidArgumentException("Formato de imagem inválido. Utilize JPG, PNG ou WEBP.");
            }

            if ($arquivo['size'] > 8 * 1024 * 1024) {
                throw new InvalidArgumentException("A imagem de capa não pode exceder 8MB.");
            }

            $nomeArquivo = 'artigo_capa_' . date('Ymd_His') . '_' . bin2hex(random_bytes(3)) . '.' . $ext;
            if (move_uploaded_file($arquivo['tmp_name'], $dirUploads . $nomeArquivo)) {
                $dados['imagem_capa_url'] = '/backend/uploads/artigos/' . $nomeArquivo;
            }
        }

        $id = isset($dados['id']) && (int)$dados['id'] > 0 ? (int)$dados['id'] : null;
        $titulo = trim($dados['titulo'] ?? '');
        if (empty($titulo)) {
            throw new InvalidArgumentException("O título do artigo é obrigatório.");
        }

        $tituloDestaqueItalico = trim($dados['titulo_destaque_italico'] ?? '');
        $subtitulo = trim($dados['subtitulo'] ?? '');
        $categoria = trim($dados['categoria'] ?? 'Acolhimento Inicial');
        $resumo = trim($dados['resumo'] ?? '');
        $tempoLeitura = trim($dados['tempo_leitura'] ?? '5 min de leitura');
        $tempoLeituraMin = (int)filter_var($tempoLeitura, FILTER_SANITIZE_NUMBER_INT);
        if ($tempoLeituraMin <= 0) $tempoLeituraMin = 5;

        $imagemCapaUrl = trim($dados['imagem_capa_url'] ?? '');
        $legendaCapa = trim($dados['legenda_capa'] ?? '');
        $autorNome = trim($dados['autor_nome'] ?? 'Priscila Manzoni Furlani');
        $statusPublicacao = trim(strtolower($dados['status_publicacao'] ?? 'publicado'));
        if (!in_array($statusPublicacao, ['rascunho', 'em_revisao', 'publicado', 'arquivado'], true)) {
            $statusPublicacao = 'publicado';
        }

        // Gera slug limpo
        $slug = trim($dados['slug'] ?? '');
        if (empty($slug)) {
            $slugBase = iconv('UTF-8', 'ASCII//TRANSLIT', $titulo);
            $slugBase = preg_replace('/[^a-zA-Z0-9\s]/', '', $slugBase);
            $slug = strtolower(trim(preg_replace('/\s+/', '-', $slugBase)));
            if (empty($slug)) $slug = 'artigo-' . time();
        }

        // Blocos estruturados de conteúdo (JSON)
        $conteudoBlocos = null;
        if (isset($dados['conteudo_blocos'])) {
            $conteudoBlocos = is_array($dados['conteudo_blocos']) 
                ? json_encode($dados['conteudo_blocos'], JSON_UNESCAPED_UNICODE) 
                : $dados['conteudo_blocos'];
        }

        $conteudoTexto = trim($dados['conteudo'] ?? '');
        if (empty($conteudoTexto) && !empty($conteudoBlocos)) {
            $conteudoTexto = $resumo;
        }

        if ($id) {
            /* INÍCIO ATUALIZAÇÃO (EDICAO) */
            $snapshotAnterior = AuditLogger::capturarSnapshot($db, 'artigos_conteudos', $id);

            $stmtUpdate = $db->prepare("
                UPDATE artigos_conteudos SET
                    titulo = :titulo,
                    titulo_destaque_italico = :titulo_destaque_italico,
                    subtitulo = :subtitulo,
                    slug = :slug,
                    categoria = :categoria,
                    resumo = :resumo,
                    conteudo = :conteudo,
                    conteudo_blocos = :conteudo_blocos,
                    tempo_leitura = :tempo_leitura,
                    tempo_leitura_min = :tempo_leitura_min,
                    imagem_capa_url = :imagem_capa_url,
                    legenda_capa = :legenda_capa,
                    autor_nome = :autor_nome,
                    status_publicacao = :status_publicacao,
                    atualizado_em = NOW()
                WHERE id = :id
            ");

            $stmtUpdate->execute([
                ':titulo' => $titulo,
                ':titulo_destaque_italico' => $tituloDestaqueItalico,
                ':subtitulo' => $subtitulo,
                ':slug' => $slug,
                ':categoria' => $categoria,
                ':resumo' => $resumo,
                ':conteudo' => $conteudoTexto,
                ':conteudo_blocos' => $conteudoBlocos,
                ':tempo_leitura' => $tempoLeitura,
                ':tempo_leitura_min' => $tempoLeituraMin,
                ':imagem_capa_url' => $imagemCapaUrl,
                ':legenda_capa' => $legendaCapa,
                ':autor_nome' => $autorNome,
                ':status_publicacao' => $statusPublicacao,
                ':id' => $id,
            ]);

            $snapshotNovo = AuditLogger::capturarSnapshot($db, 'artigos_conteudos', $id);

            AuditLogger::registrar(
                $db,
                'EDICAO',
                'artigos_conteudos',
                $id,
                '/admin',
                $snapshotAnterior,
                $snapshotNovo,
                $adminAuth['id'],
                $adminAuth['nome_completo']
            );

            echo json_encode([
                'sucesso' => true,
                'mensagem' => 'Artigo atualizado com sucesso no acervo editorial!',
                'dados' => ['id' => $id, 'slug' => $slug]
            ], JSON_UNESCAPED_UNICODE);
            exit;
            /* FIM ATUALIZAÇÃO */
        } else {
            /* INÍCIO CRIAÇÃO (CRIACAO) */
            $stmtInsert = $db->prepare("
                INSERT INTO artigos_conteudos (
                    autor_usuario_id, autor_nome, titulo, titulo_destaque_italico, 
                    subtitulo, slug, categoria, resumo, conteudo, conteudo_blocos, 
                    tempo_leitura, tempo_leitura_min, imagem_capa_url, legenda_capa, 
                    status_publicacao, criado_em, atualizado_em
                ) VALUES (
                    :autor_usuario_id, :autor_nome, :titulo, :titulo_destaque_italico, 
                    :subtitulo, :slug, :categoria, :resumo, :conteudo, :conteudo_blocos, 
                    :tempo_leitura, :tempo_leitura_min, :imagem_capa_url, :legenda_capa, 
                    :status_publicacao, NOW(), NOW()
                )
            ");

            $stmtInsert->execute([
                ':autor_usuario_id' => $adminAuth['id'],
                ':autor_nome' => $autorNome,
                ':titulo' => $titulo,
                ':titulo_destaque_italico' => $tituloDestaqueItalico,
                ':subtitulo' => $subtitulo,
                ':slug' => $slug,
                ':categoria' => $categoria,
                ':resumo' => $resumo,
                ':conteudo' => $conteudoTexto,
                ':conteudo_blocos' => $conteudoBlocos,
                ':tempo_leitura' => $tempoLeitura,
                ':tempo_leitura_min' => $tempoLeituraMin,
                ':imagem_capa_url' => $imagemCapaUrl,
                ':legenda_capa' => $legendaCapa,
                ':status_publicacao' => $statusPublicacao,
            ]);

            $novoId = (int)$db->lastInsertId();
            $snapshotNovo = AuditLogger::capturarSnapshot($db, 'artigos_conteudos', $novoId);

            AuditLogger::registrar(
                $db,
                'CRIACAO',
                'artigos_conteudos',
                $novoId,
                '/admin',
                null,
                $snapshotNovo,
                $adminAuth['id'],
                $adminAuth['nome_completo']
            );

            echo json_encode([
                'sucesso' => true,
                'mensagem' => 'Novo artigo publicado com sucesso na Biblioteca de Conteúdos!',
                'dados' => ['id' => $novoId, 'slug' => $slug]
            ], JSON_UNESCAPED_UNICODE);
            exit;
            /* FIM CRIAÇÃO */
        }
    }

    /* =========================================================================
       MÉTODO DELETE: EXCLUIR ARTIGO
       ========================================================================= */
    if ($metodo === 'DELETE') {
        $id = isset($_GET['id']) ? (int)$_GET['id'] : null;
        if (!$id) {
            $dados = json_decode(file_get_contents('php://input'), true) ?? [];
            $id = isset($dados['id']) ? (int)$dados['id'] : null;
        }

        if (!$id) {
            throw new InvalidArgumentException("ID do artigo é obrigatório para exclusão.");
        }

        $snapshotAnterior = AuditLogger::capturarSnapshot($db, 'artigos_conteudos', $id);
        if (!$snapshotAnterior) {
            throw new RuntimeException("Artigo não encontrado para exclusão.");
        }

        $stmtDel = $db->prepare("DELETE FROM artigos_conteudos WHERE id = :id");
        $stmtDel->execute([':id' => $id]);

        AuditLogger::registrar(
            $db,
            'EXCLUSAO',
            'artigos_conteudos',
            $id,
            '/admin',
            $snapshotAnterior,
            null,
            $adminAuth['id'],
            $adminAuth['nome_completo']
        );

        echo json_encode([
            'sucesso' => true,
            'mensagem' => "Artigo #{$id} removido com sucesso."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

} catch (Exception $e) {
    http_response_code($e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
