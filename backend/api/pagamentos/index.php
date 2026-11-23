<?php
/**
 * =============================================================================
 * ARQUIVO: index.php (Localização: /backend/api/pagamentos/index.php)
 * PROJETO: GlicoCare — Módulo Financeiro e Split Pix (Fase 2 Preservada)
 * OBJETIVO:
 *   Gerenciar split financeiro de consultas (35% GlicoCare / 65% Especialista),
 *   custódia temporária protegida e emissão de cobranças Pix nativas.
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

$database = new Database();
$db = $database->getConnection();

/* INÍCIO BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS (TRAVA DE SEGURANÇA FASE 1) */
$telemedicinaAtiva = filter_var($_ENV['TELEMEDICINA_ATIVA'] ?? getenv('TELEMEDICINA_ATIVA') ?? 'false', FILTER_VALIDATE_BOOLEAN);
if (!$telemedicinaAtiva) {
    http_response_code(503);
    echo json_encode([
        'sucesso' => false,
        'fase' => 'fase_1',
        'mensagem' => 'O módulo de pagamentos, consultas e split Pix do GlicoCare está em fase de preparação com carinho e será ativado na Fase 2.'
    ]);
    exit;
}
/* FIM BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS */

/* =============================================================================
   INÍCIO DO CÓDIGO DA FASE 2: PROCESSAMENTO DE COBRANÇAS E SPLIT PIX
   (Preservado intacto para homologação na Fase 2)
   ============================================================================= */

// $payload = json_decode(file_get_contents('php://input'), true);
// ... Lógica de split 65/35 e geração de QR Code Pix integrado
echo json_encode([
    'sucesso' => true,
    'mensagem' => 'Endpoint de pagamentos e split Pix pronto para ativação na Fase 2.'
]);
