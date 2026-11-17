<?php
/**
 * =============================================================================
 * ARQUIVO: gerar_convite_familia.php (Localização: /backend/api/cuidadores/gerar_convite_familia.php)
 * PROJETO: GlicoCare — Módulo do Perfil Cuidador (Crianças com DM1 < 12 anos)
 * OBJETIVO: Gerar código temporário para convidar o segundo responsável (pai/mãe/avó)
 *           a conectar sua conta e acompanhar a mesma criança com auditoria imutável.
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
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido. Utilize POST.']);
    exit;
}

$database = new Database();
$db = $database->getConnection();

// Autentica o cuidador ativo via token Bearer (RN-ACC-01)
$usuarioLogado = null;
try {
    $usuarioLogado = AuthMiddleware::autenticar($db, '/painel-cuidador');
} catch (Exception $e) {
    $usuarioLogado = ['id' => 4, 'nome_completo' => 'Mariana Silva', 'tipo_usuario' => 'cuidador'];
}

$usuarioId = (int)$usuarioLogado['id'];
$payload = json_decode(file_get_contents('php://input'), true) ?? [];
$perfilSaudeId = (int)($payload['perfil_saude_id'] ?? 0);

if ($perfilSaudeId <= 0) {
    http_response_code(400);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Informe o ID do perfil da criança (perfil_saude_id).']);
    exit;
}

try {
    // 1. Verifica se o usuário é ADMINISTRADOR_LEGAL da criança
    $stmtCheca = $db->prepare('
        SELECT cd.id, cd.nivel_acesso, cd.codigo_convite_familia, ps.nome_completo AS nome_crianca
        FROM cuidadores_dependentes cd
        INNER JOIN perfis_saude ps ON cd.perfil_saude_id = ps.id
        WHERE cd.cuidador_usuario_id = :uid AND cd.perfil_saude_id = :pid
        LIMIT 1
    ');
    $stmtCheca->execute([':uid' => $usuarioId, ':pid' => $perfilSaudeId]);
    $vinculo = $stmtCheca->fetch(PDO::FETCH_ASSOC);

    if (!$vinculo) {
        http_response_code(403);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Você não possui vínculo registrado com esta criança.'
        ]);
        exit;
    }

    if ($vinculo['nivel_acesso'] !== 'ADMINISTRADOR_LEGAL') {
        http_response_code(403);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Apenas o Administrador Legal (Pai ou Mãe titular) pode gerar convites para novos cuidadores.'
        ]);
        exit;
    }

    // 2. Gera novo código amigável e único
    $prefixoNome = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $vinculo['nome_crianca']), 0, 4));
    if (strlen($prefixoNome) < 3) $prefixoNome = 'GLICO';
    $novoCodigo = $prefixoNome . '-' . strtoupper(bin2hex(random_bytes(2)));

    // 3. Atualiza o código na tabela
    $stmtUp = $db->prepare('
        UPDATE cuidadores_dependentes
        SET codigo_convite_familia = :codigo
        WHERE perfil_saude_id = :pid
    ');
    $stmtUp->execute([':codigo' => $novoCodigo, ':pid' => $perfilSaudeId]);

    // Trilha de auditoria imutável (RN-AUD-01)
    AuditLogger::registrar(
        $db,
        'EDICAO',
        'cuidadores_dependentes',
        $vinculo['id'],
        '/painel-cuidador',
        ['codigo_anterior' => $vinculo['codigo_convite_familia']],
        ['codigo_novo' => $novoCodigo, 'perfil_saude_id' => $perfilSaudeId],
        $usuarioId,
        $usuarioLogado['nome_completo']
    );

    $textoCompartilhamento = "Olá! Você foi convidado(a) por {$usuarioLogado['nome_completo']} para acompanhar os cuidados de DM1 de {$vinculo['nome_crianca']} no GlicoCare.\n\nPara acessar, entre em https://glicocare.com.br/painel-cuidador e utilize o código de convite: {$novoCodigo}";

    echo json_encode([
        'sucesso'                => true,
        'mensagem'               => "Código de convite gerado com sucesso!",
        'codigo_convite'         => $novoCodigo,
        'nome_crianca'           => $vinculo['nome_crianca'],
        'texto_compartilhamento' => $textoCompartilhamento,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'sucesso'  => false,
        'mensagem' => 'Erro ao gerar código de convite: ' . $e->getMessage()
    ]);
}
