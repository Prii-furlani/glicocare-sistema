<?php
/* =============================================================================
 * ARQUIVO: home_config.php (Localização: /backend/api/publico/home_config.php)
 * PROJETO: GlicoCare — CMS Dinâmico Público da Home
 * OBJETIVO: Fornecer endpoint público, leve e ultrarrápido para a Home.jsx
 *           consumir textos, imagens e chamadas editadas via Painel Admin,
 *           mantendo fallback seguro em caso de indisponibilidade momentânea.
 * AUTORIZAÇÃO: Aberto ao público (Leitura da Landing Page).
 * ============================================================================= */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/database.php';

/* INÍCIO DOS VALORES PADRÃO DE FALLBACK SEGURO */
$fallbackDicionario = [
    'hero_badge' => 'INFORMAÇÃO QUE ACOLHE. CUIDADO QUE APROXIMA.',
    'hero_titulo' => 'Transforme o diagnóstico em uma rotina segura e sem pânico.',
    'hero_titulo_destaque' => 'segura',
    'hero_subtitulo' => 'Apoio pedagógico e acolhimento prático para famílias que vivem o Diabetes Tipo 1 — do diagnóstico à autonomia, um passo de cada vez.',
    'hero_cta_primario' => 'Quero começar com segurança',
    'hero_cta_secundario' => 'Conheça nossa história',
    'hero_balao_lufy' => '“Ei, respira. A gente vai aprender isso juntos.”',
    'hero_imagem_url' => '',
    'lufy_eyebrow' => 'CONHEÇA O LUFY',
    'lufy_titulo' => 'Tecnologia no braço. Afeto no coração.',
    'lufy_titulo_destaque' => 'Afeto',
    'lufy_paragrafo_1' => 'Lufy nasceu para ser uma presença familiar nos momentos em que tudo parece novo demais. Um coala guardião que transforma termos difíceis em conversas possíveis.',
    'lufy_paragrafo_2' => 'Com o sensor no bracinho, ele mostra para as crianças que o monitoramento não é um peso, mas uma ferramenta de autonomia e liberdade.',
    'lufy_citacao_foto' => '“Cuidar também é ensinar com calma, até que a confiança encontre seu lugar.”',
    'lufy_imagem_url' => '',
    'cta_final_titulo' => 'Dê o primeiro passo para uma rotina mais serena.',
    'cta_final_subtitulo' => 'Junte-se a centenas de famílias que transformaram o medo em aprendizado e confiança diária.',
    'cta_final_botao' => 'Conheça nossos planos e comece hoje',
];
/* FIM DOS VALORES PADRÃO */

try {
    $db = Database::getConnection();
    $stmt = $db->query("
        SELECT secao, chave, tipo_campo, valor 
        FROM configuracoes_home
    ");
    $registros = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($registros)) {
        echo json_encode([
            'sucesso' => true,
            'origem' => 'fallback_padrao',
            'dados' => $fallbackDicionario,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $dicionario = $fallbackDicionario;
    foreach ($registros as $reg) {
        $dicionario[$reg['chave']] = $reg['valor'];
    }

    echo json_encode([
        'sucesso' => true,
        'origem' => 'banco_tidb',
        'dados' => $dicionario,
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    // Retorna fallback limpo com código 200 para que a Home nunca quebre
    echo json_encode([
        'sucesso' => true,
        'origem' => 'fallback_resiliente',
        'dados' => $fallbackDicionario,
        'aviso' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
