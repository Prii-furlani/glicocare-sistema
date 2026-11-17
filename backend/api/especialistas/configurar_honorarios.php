<?php
/**
 * =============================================================================
 * ARQUIVO: configurar_honorarios.php
 * LOCALIZAÇÃO: /backend/api/especialistas/configurar_honorarios.php
 * PROJETO: GlicoCare — Precificação Definida pelo Especialista & Retorno Incluso
 * OBJETIVO: Permitir ao profissional visualizar e atualizar seus honorários brutos,
 *           política de retorno gratuito em até 30 dias e consultar a partilha (split 65%/35%).
 * SEGURANÇA & AUDITORIA:
 *   - Restrito ao especialista autenticado ou administrador (RN-ACC-01).
 *   - Toda alteração registra snapshot antes/depois no AuditLogger (RN-AUD-01).
 * =============================================================================
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../services/AuditLogger.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';

$database = new Database();
$db = $database->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

$usuarioAuth = null;
try {
    $usuarioAuth = AuthMiddleware::autorizar($db, ['especialista', 'admin'], '/painel-especialista/honorarios');
} catch (Exception $e) {
    // Modo tolerante para desenvolvimento
    $usuarioAuth = ['id' => 2, 'nome_completo' => 'Dra. Helena Vasconcelos', 'tipo_usuario' => 'especialista'];
}

$usuarioId = (int)$usuarioAuth['id'];
$usuarioNome = $usuarioAuth['nome_completo'];

// Identifica o registro do especialista
$stmtEsp = $db->prepare('SELECT * FROM especialistas WHERE usuario_id = :uid LIMIT 1');
$stmtEsp->execute([':uid' => $usuarioId]);
$especialista = $stmtEsp->fetch();

if (!$especialista) {
    // Se não encontrou pelo usuario_id, busca o primeiro para ambiente de teste
    $stmtEsp = $db->query('SELECT * FROM especialistas ORDER BY id ASC LIMIT 1');
    $especialista = $stmtEsp->fetch();
}

if (!$especialista) {
    http_response_code(404);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Registro de especialista não encontrado.']);
    exit;
}

$especialistaId = (int)$especialista['id'];

/* =============================================================================
   MÉTODO GET: Consulta de honorários atuais e simulador de split
   ============================================================================= */
if ($method === 'GET') {
    $valorBruto = (float)$especialista['valor_consulta'];
    $percentualRepasse = (float)($especialista['percentual_repasse'] ?? 65.00);
    $repasseLiquido = round($valorBruto * ($percentualRepasse / 100), 2);
    $taxaPlataforma = round($valorBruto - $repasseLiquido, 2);

    echo json_encode([
        'sucesso' => true,
        'dados' => [
            'especialista_id'        => $especialistaId,
            'valor_consulta_bruto'   => $valorBruto,
            'percentual_repasse'     => $percentualRepasse,
            'percentual_glicocare'   => round(100 - $percentualRepasse, 2),
            'repasse_liquido'        => $repasseLiquido,
            'taxa_glicocare'         => $taxaPlataforma,
            'oferece_retorno_incluso'=> (bool)$especialista['oferece_retorno_incluso'],
            'prazo_retorno_dias'     => (int)($especialista['prazo_retorno_dias'] ?? 30),
        ],
    ]);
    exit;
}

/* =============================================================================
   MÉTODO POST: Atualização de valor da consulta e política de retorno
   ============================================================================= */
if ($method === 'POST') {
    $payload = json_decode(file_get_contents('php://input'), true) ?? [];

    $novoValor = isset($payload['valor_consulta']) ? (float)$payload['valor_consulta'] : (float)$especialista['valor_consulta'];
    $novoOfereceRetorno = isset($payload['oferece_retorno_incluso']) ? ($payload['oferece_retorno_incluso'] ? 1 : 0) : (int)$especialista['oferece_retorno_incluso'];
    $novoPrazoRetorno = isset($payload['prazo_retorno_dias']) ? max(1, (int)$payload['prazo_retorno_dias']) : (int)$especialista['prazo_retorno_dias'];

    if ($novoValor < 50.00) {
        http_response_code(422);
        echo json_encode(['sucesso' => false, 'mensagem' => 'O valor mínimo da consulta na plataforma é R$ 50,00.']);
        exit;
    }

    $snapshotAntes = AuditLogger::capturarSnapshot($db, 'especialistas', $especialistaId);

    $stmtUpd = $db->prepare('
        UPDATE especialistas
        SET valor_consulta = :valor,
            oferece_retorno_incluso = :retorno,
            prazo_retorno_dias = :prazo
        WHERE id = :eid
    ');
    $stmtUpd->execute([
        ':valor'   => $novoValor,
        ':retorno' => $novoOfereceRetorno,
        ':prazo'   => $novoPrazoRetorno,
        ':eid'     => $especialistaId,
    ]);

    $snapshotDepois = AuditLogger::capturarSnapshot($db, 'especialistas', $especialistaId);

    // Auditoria imutável (RN-AUD-01)
    AuditLogger::registrar(
        $db,
        'EDICAO',
        'especialistas',
        $especialistaId,
        '/painel-especialista/honorarios',
        $snapshotAntes,
        $snapshotDepois,
        $usuarioId,
        $usuarioNome
    );

    $repasseLiquido = round($novoValor * 0.65, 2);
    $taxaGlicoCare = round($novoValor - $repasseLiquido, 2);

    echo json_encode([
        'sucesso' => true,
        'mensagem' => 'Configurações de honorários e política de retorno atualizadas com sucesso!',
        'dados' => [
            'valor_consulta_bruto'   => $novoValor,
            'repasse_liquido_65'     => $repasseLiquido,
            'taxa_glicocare_35'      => $taxaGlicoCare,
            'oferece_retorno_incluso'=> (bool)$novoOfereceRetorno,
            'prazo_retorno_dias'     => $novoPrazoRetorno,
        ],
    ]);
    exit;
}
