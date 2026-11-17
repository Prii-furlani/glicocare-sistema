<?php
/**
 * =============================================================================
 * ARQUIVO: cadastrar_exame.php (Localização: /backend/api/exames/cadastrar_exame.php)
 * PROJETO: GlicoCare — Central de Exames e Upload de Laudos Digitais
 * OBJETIVO: Cadastro de bateria de exames laboratoriais, inserção em lote de
 *           marcadores clínicos (1:N), upload seguro de laudos (PDF/imagem) e
 *           vinculação com guias médicas de solicitação emitidas por especialistas.
 *
 * REGRA DE NEGÓCIO (RN-EXA-01):
 *   - Validação de formato (PDF, JPG, JPEG, PNG) e tamanho máximo de 10MB.
 *   - Transação atômica PDO garantindo integridade entre cabeçalho e itens.
 *   - Atualização automática de solicitacoes_exames.status para 'REALIZADO'.
 *   - Trilha de auditoria imutável (RN-AUD-01) com fuso America/Sao_Paulo.
 * =============================================================================
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../../services/AuditLogger.php';

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Método não permitido. Utilize POST multipart/form-data.'
    ]);
    exit;
}

$database = new Database();
$db = $database->getConnection();

// Autentica usuário logado
$usuarioLogado = AuthMiddleware::autenticar($db, '/meu-perfil');
$usuarioId = (int)$usuarioLogado['id'];
$usuarioNome = $usuarioLogado['nome_completo'];

try {
    // 1. Identifica o perfil de saúde
    $perfilSaudeId = isset($_POST['perfil_saude_id']) ? (int)$_POST['perfil_saude_id'] : 0;
    if ($perfilSaudeId <= 0) {
        $stmtP = $db->prepare('SELECT id FROM perfis_saude WHERE usuario_id = :uid ORDER BY id DESC LIMIT 1');
        $stmtP->execute([':uid' => $usuarioId]);
        $rowP = $stmtP->fetch(PDO::FETCH_ASSOC);
        if ($rowP) {
            $perfilSaudeId = (int)$rowP['id'];
        }
    }

    if ($perfilSaudeId <= 0) {
        http_response_code(400);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Perfil de saúde não identificado. Por favor, conclua seu cadastro de saúde primeiro.'
        ]);
        exit;
    }

    // 2. Validações dos campos obrigatórios
    $laboratorio = trim($_POST['laboratorio'] ?? '');
    $dataRealizacao = trim($_POST['data_realizacao'] ?? '');
    $solicitacaoId = !empty($_POST['solicitacao_id']) ? (int)$_POST['solicitacao_id'] : null;
    $observacoes = trim($_POST['observacoes_paciente'] ?? '');

    if (empty($laboratorio)) {
        http_response_code(422);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'O nome do laboratório ou unidade de saúde é obrigatório.'
        ]);
        exit;
    }

    if (empty($dataRealizacao) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dataRealizacao)) {
        http_response_code(422);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'A data de realização deve estar no formato AAAA-MM-DD.'
        ]);
        exit;
    }

    // 3. Processamento do arquivo de laudo (opcional ou enviado)
    $arquivoAnexoPath = null;
    $arquivoNomeOriginal = null;

    if (isset($_FILES['arquivo_laudo']) && $_FILES['arquivo_laudo']['error'] !== UPLOAD_ERR_NO_FILE) {
        $file = $_FILES['arquivo_laudo'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'Falha no envio do arquivo anexado. Código de erro: ' . $file['error']
            ]);
            exit;
        }

        // Validação de tamanho: limite máximo de 10MB
        $maxSizeBytes = 10 * 1024 * 1024;
        if ($file['size'] > $maxSizeBytes) {
            http_response_code(400);
            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'O arquivo enviado excede o limite máximo permitido de 10 MB.'
            ]);
            exit;
        }

        // Validação de extensão permitida
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $extsPermitidas = ['pdf', 'jpg', 'jpeg', 'png'];
        if (!in_array($ext, $extsPermitidas, true)) {
            http_response_code(400);
            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'Formato não suportado. Envie laudos em formato PDF, JPG, JPEG ou PNG.'
            ]);
            exit;
        }

        $uploadsDir = realpath(__DIR__ . '/../../uploads/exames');
        if (!$uploadsDir) {
            $uploadsDir = __DIR__ . '/../../uploads/exames';
            if (!is_dir($uploadsDir)) {
                mkdir($uploadsDir, 0775, true);
            }
        }

        $nomeSeguro = 'laudo_' . bin2hex(random_bytes(16)) . '.' . $ext;
        $destino = $uploadsDir . DIRECTORY_SEPARATOR . $nomeSeguro;

        if (!move_uploaded_file($file['tmp_name'], $destino)) {
            http_response_code(500);
            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'Não foi possível salvar o arquivo de laudo no servidor.'
            ]);
            exit;
        }

        $arquivoAnexoPath = '/backend/uploads/exames/' . $nomeSeguro;
        $arquivoNomeOriginal = mb_substr($file['name'], 0, 250);
    }

    // 4. Processamento dos itens de marcadores clínicos
    $itensMarcadores = [];
    if (!empty($_POST['itens_marcadores'])) {
        $rawItens = $_POST['itens_marcadores'];
        if (is_string($rawItens)) {
            $decoded = json_decode($rawItens, true);
            if (is_array($decoded)) {
                $itensMarcadores = $decoded;
            }
        } elseif (is_array($rawItens)) {
            $itensMarcadores = $rawItens;
        }
    }

    // 5. Início da transação no banco de dados
    $db->beginTransaction();

    $tz = new DateTimeZone('America/Sao_Paulo');
    $agoraSp = (new DateTime('now', $tz))->format('Y-m-d H:i:s');

    // Inserção na tabela exames_paciente
    $stmtExame = $db->prepare('
        INSERT INTO exames_paciente (
            perfil_saude_id, solicitacao_id, laboratorio, data_realizacao,
            data_registro_app, arquivo_anexo_path, arquivo_nome_original, observacoes_paciente
        ) VALUES (
            :perfil_id, :solic_id, :lab, :data_realizacao,
            :data_registro, :arquivo_path, :arquivo_orig, :obs
        )
    ');
    $stmtExame->execute([
        ':perfil_id'        => $perfilSaudeId,
        ':solic_id'         => $solicitacaoId,
        ':lab'              => $laboratorio,
        ':data_realizacao'  => $dataRealizacao,
        ':data_registro'    => $agoraSp,
        ':arquivo_path'     => $arquivoAnexoPath,
        ':arquivo_orig'     => $arquivoNomeOriginal,
        ':obs'              => !empty($observacoes) ? $observacoes : null
    ]);
    $exameId = (int)$db->lastInsertId();

    // Inserção dos marcadores na tabela exames_resultados_itens
    $stmtItem = $db->prepare('
        INSERT INTO exames_resultados_itens (
            exame_id, nome_marcador, valor_resultado, unidade, valor_referencia
        ) VALUES (
            :exame_id, :nome, :valor, :unidade, :ref
        )
    ');

    $itensInseridos = 0;
    foreach ($itensMarcadores as $item) {
        $nomeMarcador = trim($item['nome_marcador'] ?? '');
        $valorResultado = trim((string)($item['valor_resultado'] ?? ''));
        $unidade = trim($item['unidade'] ?? '');
        $valorRef = trim($item['valor_referencia'] ?? '');

        if ($nomeMarcador !== '' && $valorResultado !== '') {
            $stmtItem->execute([
                ':exame_id' => $exameId,
                ':nome'     => $nomeMarcador,
                ':valor'    => $valorResultado,
                ':unidade'  => $unidade !== '' ? $unidade : '-',
                ':ref'      => $valorRef !== '' ? $valorRef : null
            ]);
            $itensInseridos++;
        }
    }

    // Se vinculado a uma solicitação médica, atualiza status para REALIZADO
    if ($solicitacaoId) {
        $stmtUpdSolic = $db->prepare('
            UPDATE solicitacoes_exames
            SET status = "REALIZADO", atualizado_em = :agora
            WHERE id = :solic_id AND perfil_saude_id = :perfil_id
        ');
        $stmtUpdSolic->execute([
            ':agora'     => $agoraSp,
            ':solic_id'  => $solicitacaoId,
            ':perfil_id' => $perfilSaudeId
        ]);
    }

    $db->commit();

    // Trilha de auditoria imutável (RN-AUD-01)
    AuditLogger::registrar(
        $db,
        'CRIACAO',
        'exames_paciente',
        $exameId,
        '/meu-perfil',
        null,
        [
            'laboratorio' => $laboratorio,
            'data_realizacao' => $dataRealizacao,
            'solicitacao_id' => $solicitacaoId,
            'total_marcadores' => $itensInseridos,
            'teve_anexo' => !empty($arquivoAnexoPath)
        ],
        $usuarioId,
        $usuarioNome
    );

    http_response_code(201);
    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Exame registrado com carinho e adicionado ao seu histórico de saúde!',
        'exame_id' => $exameId,
        'solicitacao_id_vinculada' => $solicitacaoId,
        'total_marcadores' => $itensInseridos,
        'arquivo_anexo_path' => $arquivoAnexoPath
    ]);
} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Ocorreu um erro ao salvar o exame: ' . $e->getMessage()
    ]);
}
