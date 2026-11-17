<?php
/**
 * =============================================================================
 * ARQUIVO: cadastro.php (Localização: /backend/api/auth/cadastro.php)
 * PROJETO: GlicoCare — Sistema de Saúde Integrada e Acolhimento em DM1
 * OBJETIVO: Processar o cadastro rápido de novos usuários (Etapa 1 do onboarding)
 *           com suporte aos perfis: Diabético, Cuidador e Especialista,
 *           gerando sessão imediata e registrando auditoria imutável (RN-AUD-01).
 * =============================================================================
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../services/AuditLogger.php';

/* INÍCIO DAS CONFIGURAÇÕES DE CABEÇALHO HTTP E CORS */
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
        'sucesso'  => false,
        'mensagem' => 'Método não permitido. Utilize o método POST para realizar o cadastro.'
    ]);
    exit;
}
/* FIM DAS CONFIGURAÇÕES DE CABEÇALHO HTTP */

/* INÍCIO DA LEITURA E VALIDAÇÃO DOS DADOS RECEBIDOS */
$inputRaw = file_get_contents('php://input');
$payload = json_decode($inputRaw, true) ?? [];

$nome = trim($payload['nome'] ?? $payload['nome_completo'] ?? '');
$email = strtolower(trim($payload['email'] ?? ''));
$senha = $payload['senha'] ?? '';
$tipoUsuario = trim($payload['tipo_usuario'] ?? 'diabetico');
$contextoDm1 = trim($payload['contexto_dm1'] ?? '');

// Validações básicas e acolhedoras
if (empty($nome)) {
    http_response_code(400);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Por favor, informe seu nome ou como prefere ser chamado(a).']);
    exit;
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Por favor, informe um endereço de e-mail válido para contato seguro.']);
    exit;
}

if (empty($senha) || strlen($senha) < 6) {
    http_response_code(400);
    echo json_encode(['sucesso' => false, 'mensagem' => 'A senha deve possuir pelo menos 6 caracteres para sua proteção.']);
    exit;
}

// Bloqueia auto-criação de admin via cadastro público
$perfisPermitidos = ['diabetico', 'cuidador', 'especialista'];
if (!in_array($tipoUsuario, $perfisPermitidos, true)) {
    $tipoUsuario = 'diabetico';
}

$tipoPerfilLegado = ($tipoUsuario === 'especialista') ? 'especialista' : 'familiar_paciente';
/* FIM DA LEITURA E VALIDAÇÃO DOS DADOS */

$database = new Database();
$db = $database->getConnection();

/* INÍCIO DA CRIAÇÃO DO USUÁRIO NO BANCO DE DADOS */
try {
    // 1. Verifica se o e-mail já está cadastrado
    $stmtCheck = $db->prepare('SELECT id FROM usuarios WHERE email = :email LIMIT 1');
    $stmtCheck->execute([':email' => $email]);
    if ($stmtCheck->fetch()) {
        http_response_code(409);
        echo json_encode([
            'sucesso'  => false,
            'mensagem' => 'Este e-mail já possui um espaço seguro na GlicoCare. Que tal acessar sua conta ou recuperar a senha?'
        ]);
        exit;
    }

    // 2. Hash seguro da senha com Bcrypt
    $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
    $tokenSessao = bin2hex(random_bytes(32));

    // 3. Insere o novo usuário
    $stmtInsert = $db->prepare(
        'INSERT INTO usuarios (
            nome_completo, email, senha_hash, tipo_perfil, tipo_usuario,
            perfil_configurado, contexto_dm1, token_sessao, token_expira_em, ativo
         ) VALUES (
            :nome, :email, :senha_hash, :tipo_perfil, :tipo_usuario,
            0, :contexto, :token_sessao, DATE_ADD(NOW(), INTERVAL 30 DAY), 1
         )'
    );

    $stmtInsert->execute([
        ':nome'         => $nome,
        ':email'        => $email,
        ':senha_hash'   => $senhaHash,
        ':tipo_perfil'  => $tipoPerfilLegado,
        ':tipo_usuario' => $tipoUsuario,
        ':contexto'     => !empty($contextoDm1) ? $contextoDm1 : ($tipoUsuario === 'cuidador' ? 'Cuidador / Apoio Familiar' : 'Pessoa com Diabetes'),
        ':token_sessao' => $tokenSessao,
    ]);

    $novoUsuarioId = (int)$db->lastInsertId();

    // 4. Registra na trilha de auditoria imutável (RN-AUD-01)
    AuditLogger::registrar(
        $db,
        'CRIACAO',
        'usuarios',
        (string)$novoUsuarioId,
        '/cadastro',
        null,
        [
            'id'           => $novoUsuarioId,
            'nome'         => $nome,
            'email'        => $email,
            'tipo_usuario' => $tipoUsuario,
        ],
        $novoUsuarioId,
        $nome
    );

    // 5. Determina rota inicial: especialista vai para credenciamento, outros para boas-vindas
    $rotaRedirecionamento = ($tipoUsuario === 'especialista')
        ? '/credenciamento'
        : '/boas-vindas';

    http_response_code(201);
    echo json_encode([
        'sucesso'  => true,
        'mensagem' => "Bem-vindo(a) ao GlicoCare, {$nome}! Seu espaço seguro foi criado com carinho.",
        'dados'    => [
            'token'   => $tokenSessao,
            'usuario' => [
                'id'                 => $novoUsuarioId,
                'nome_completo'      => $nome,
                'email'              => $email,
                'tipo_usuario'       => $tipoUsuario,
                'tipo_perfil'        => $tipoPerfilLegado,
                'perfil_configurado' => false,
                'contexto_dm1'       => $contextoDm1,
            ],
            'redirecionar_para' => $rotaRedirecionamento,
        ]
    ]);
    exit;

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'sucesso'  => false,
        'mensagem' => 'Não conseguimos concluir seu cadastro neste momento. Por favor, tente novamente.',
        'detalhe'  => $e->getMessage()
    ]);
    exit;
}
/* FIM DA CRIAÇÃO DO USUÁRIO */
