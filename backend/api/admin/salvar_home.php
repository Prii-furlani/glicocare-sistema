<?php
/* =============================================================================
 * ARQUIVO: salvar_home.php (Localização: /backend/api/admin/salvar_home.php)
 * PROJETO: GlicoCare — CMS Dinâmico da Home
 * OBJETIVO: Obter e salvar as configurações de textos, chamadas e uploads de
 *           imagens da página inicial (Home.jsx) diretamente no banco TiDB Cloud.
 * AUTORIZAÇÃO: Restrito ao perfil 'admin' / 'admin_moderador' (RN-ACC-01).
 * AUDITORIA: Registra compulsoriamente a mutação em logs_auditoria via AuditLogger.
 * ============================================================================= */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
    $adminAuth = AuthMiddleware::autorizar($db, ['admin', 'admin_moderador'], '/admin/home');
    /* FIM DA AUTORIZAÇÃO ADMINISTRATIVA */

    // Diretório de armazenamento de uploads da Home
    $dirUploads = __DIR__ . '/../../uploads/home/';
    if (!is_dir($dirUploads)) {
        mkdir($dirUploads, 0755, true);
    }

    /* INÍCIO DO MÉTODO GET: RETORNA CONFIGURAÇÕES ATUAIS */
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $db->query("
            SELECT id, secao, chave, tipo_campo, rotulo_admin, valor, atualizado_em
            FROM configuracoes_home
            ORDER BY secao ASC, id ASC
        ");
        $itens = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $agrupado = [];
        $dicionario = [];
        foreach ($itens as $item) {
            $agrupado[$item['secao']][] = $item;
            $dicionario[$item['chave']] = $item['valor'];
        }

        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Configurações da Home carregadas com sucesso.',
            'dados' => [
                'itens' => $itens,
                'secoes' => $agrupado,
                'dicionario' => $dicionario,
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }
    /* FIM DO MÉTODO GET */

    /* INÍCIO DO MÉTODO POST: PROCESSA ATUALIZAÇÕES E UPLOADS */
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $dadosRecebidos = [];

        // Verifica se o envio foi via multipart/form-data ou JSON
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (str_contains($contentType, 'application/json')) {
            $corpoRaw = file_get_contents('php://input');
            $dadosRecebidos = json_decode($corpoRaw, true) ?? [];
        } else {
            $dadosRecebidos = $_POST;
        }

        // Processa uploads de arquivos caso enviados em $_FILES
        if (!empty($_FILES)) {
            $extensoesPermitidas = ['jpg', 'jpeg', 'png', 'webp'];
            $tamanhoMaximo = 8 * 1024 * 1024; // 8 MB

            foreach ($_FILES as $campo => $arquivo) {
                if ($arquivo['error'] === UPLOAD_ERR_OK && !empty($arquivo['tmp_name'])) {
                    $ext = strtolower(pathinfo($arquivo['name'], PATHINFO_EXTENSION));

                    if (!in_array($ext, $extensoesPermitidas, true)) {
                        throw new InvalidArgumentException("Formato de imagem inválido para '{$campo}'. Utilize JPG, PNG ou WEBP.");
                    }

                    if ($arquivo['size'] > $tamanhoMaximo) {
                        throw new InvalidArgumentException("A imagem enviada excede o limite máximo permitido de 8MB.");
                    }

                    $nomeUnico = 'home_' . preg_replace('/[^a-z0-9_]/i', '', $campo) . '_' . date('Ymd_His') . '_' . bin2hex(random_bytes(3)) . '.' . $ext;
                    $caminhoDestino = $dirUploads . $nomeUnico;

                    if (move_uploaded_file($arquivo['tmp_name'], $caminhoDestino)) {
                        // URL pública acessível a partir do backend
                        $urlPublica = '/backend/uploads/home/' . $nomeUnico;
                        $dadosRecebidos[$campo] = $urlPublica;
                    }
                }
            }
        }

        if (empty($dadosRecebidos)) {
            throw new InvalidArgumentException('Nenhum dado ou campo enviado para atualização.');
        }

        // Snapshot anterior para auditoria
        $stmtAntigo = $db->query("SELECT chave, valor FROM configuracoes_home");
        $snapshotAnterior = $stmtAntigo->fetchAll(PDO::FETCH_KEY_PAIR);

        $stmtUpdate = $db->prepare("
            UPDATE configuracoes_home 
            SET valor = :valor, atualizado_em = NOW() 
            WHERE chave = :chave
        ");

        $camposAlterados = [];
        foreach ($dadosRecebidos as $chave => $valor) {
            // Ignora campos não string ou especiais
            if (!is_string($valor) && !is_numeric($valor)) {
                continue;
            }
            $valorFormatado = trim((string)$valor);

            $stmtUpdate->execute([
                ':valor' => $valorFormatado,
                ':chave' => $chave,
            ]);

            if ($stmtUpdate->rowCount() > 0) {
                $camposAlterados[$chave] = $valorFormatado;
            }
        }

        // Snapshot novo após as alterações
        $stmtNovo = $db->query("SELECT chave, valor FROM configuracoes_home");
        $snapshotNovo = $stmtNovo->fetchAll(PDO::FETCH_KEY_PAIR);

        // Registro imutável de auditoria (RN-AUD-01)
        AuditLogger::registrar(
            $db,
            'EDICAO',
            'configuracoes_home',
            'home_cms',
            '/admin',
            ['total_chaves' => count($camposAlterados), 'alteracoes' => $camposAlterados],
            ['status' => 'atualizado_com_sucesso', 'atualizado_por' => $adminAuth['nome_completo']],
            $adminAuth['id'],
            $adminAuth['nome_completo']
        );

        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Configurações da Home atualizadas com sucesso!',
            'dados' => [
                'campos_alterados' => array_keys($camposAlterados),
                'configuracoes_atuais' => $snapshotNovo,
            ]
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }
    /* FIM DO MÉTODO POST */

} catch (Exception $e) {
    http_response_code($e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 400);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
