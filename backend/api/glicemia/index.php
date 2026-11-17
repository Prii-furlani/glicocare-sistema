<?php
/**
 * =============================================================================
 * ARQUIVO: index.php (Localização: /backend/api/glicemia/index.php)
 * PROJETO: GlicoCare — Sistema de Saúde Integrada e Acolhimento em DM1
 * OBJETIVO: Gerenciar o diário pessoal de glicemia (registros_glicemia),
 *           permitindo listagem cronológica, novas leituras e exclusões
 *           com auditoria imutável compulsória (RN-AUD-01).
 * =============================================================================
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../../services/AuditLogger.php';

/* INÍCIO DAS CONFIGURAÇÕES DE CABEÇALHO HTTP E CORS */
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
/* FIM DAS CONFIGURAÇÕES DE CABEÇALHO HTTP */

$database = new Database();
$db = $database->getConnection();

// Autentica o usuário ativo via token Bearer (RN-ACC-01)
$usuarioLogado = AuthMiddleware::autenticar($db, '/meu-perfil');
$usuarioId = (int)$usuarioLogado['id'];

/**
 * Helper para obter ou criar o perfil_saude do usuário logado
 */
function obterOuCriarPerfilSaude(PDO $db, int $usuarioId, string $nomeUsuario): int
{
    $stmt = $db->prepare('SELECT id FROM perfis_saude WHERE usuario_id = :uid LIMIT 1');
    $stmt->execute([':uid' => $usuarioId]);
    $perfil = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($perfil) {
        return (int)$perfil['id'];
    }

    // Cria perfil padrão de saúde inicial
    $stmtCreate = $db->prepare(
        'INSERT INTO perfis_saude (usuario_id, nome_completo, data_nascimento, sexo, tipo_diabetes, terapia_insulina)
         VALUES (:uid, :nome, "2000-01-01", "outro", "Tipo 1A", "Caneta")'
    );
    $stmtCreate->execute([':uid' => $usuarioId, ':nome' => $nomeUsuario]);
    return (int)$db->lastInsertId();
}

/* INÍCIO DO ENDPOINT GET: LISTAR REGISTROS DE GLICEMIA */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $perfilId = obterOuCriarPerfilSaude($db, $usuarioId, $usuarioLogado['nome_completo']);

        // Busca configurações clínicas do perfil (FSI, Alvo, Duração)
        $stmtPerfil = $db->prepare('SELECT fsi, glicemia_alvo, duracao_insulina_horas FROM perfis_saude WHERE id = :pid LIMIT 1');
        $stmtPerfil->execute([':pid' => $perfilId]);
        $configClinica = $stmtPerfil->fetch(PDO::FETCH_ASSOC) ?: [
            'fsi'                    => null,
            'glicemia_alvo'          => 100,
            'duracao_insulina_horas' => 3,
        ];

        $stmt = $db->prepare(
            'SELECT id, perfil_saude_id, valor_mg_dl, momento_medicao, tipo_leitura,
                    acao_realizada, dose_insulina, dose_insulina AS dose_aplicada,
                    insulina_ativa_estimada, insulina_total_organismo,
                    variacao_por_minuto, tendencia_destro,
                    carboidratos_g, fator_contexto,
                    sintomas, observacoes, data_hora_medicao, criado_em
             FROM registros_glicemia
             WHERE perfil_saude_id = :pid
             ORDER BY data_hora_medicao DESC
             LIMIT 100'
        );
        $stmt->execute([':pid' => $perfilId]);
        $registros = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decodifica JSON de sintomas e normaliza tipos numéricos
        foreach ($registros as &$reg) {
            $reg['sintomas'] = !empty($reg['sintomas']) ? json_decode($reg['sintomas'], true) : [];
            $reg['valor_mg_dl'] = (int)$reg['valor_mg_dl'];
            $reg['dose_insulina'] = $reg['dose_insulina'] !== null ? (float)$reg['dose_insulina'] : null;
            $reg['dose_aplicada'] = $reg['dose_insulina'];
            $reg['insulina_ativa_estimada'] = $reg['insulina_ativa_estimada'] !== null ? (float)$reg['insulina_ativa_estimada'] : null;
            $reg['insulina_total_organismo'] = $reg['insulina_total_organismo'] !== null ? (float)$reg['insulina_total_organismo'] : null;
            $reg['variacao_por_minuto'] = $reg['variacao_por_minuto'] !== null ? (float)$reg['variacao_por_minuto'] : null;
        }

        http_response_code(200);
        echo json_encode([
            'sucesso'        => true,
            'config_clinica' => [
                'fsi'                    => $configClinica['fsi'] !== null ? (float)$configClinica['fsi'] : null,
                'glicemia_alvo'          => (int)($configClinica['glicemia_alvo'] ?? 100),
                'duracao_insulina_horas' => (int)($configClinica['duracao_insulina_horas'] ?? 3),
            ],
            'dados'          => $registros,
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao carregar histórico de glicemia.', 'detalhe' => $e->getMessage()]);
        exit;
    }
}
/* FIM DO ENDPOINT GET */

/* INÍCIO DO ENDPOINT POST: REGISTRAR NOVA MEDIÇÃO */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true) ?? [];

    $valorMgDl = (int)($payload['valor_mg_dl'] ?? 0);
    if ($valorMgDl <= 0) {
        http_response_code(400);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Por favor, informe o valor de glicemia medido em mg/dL.']);
        exit;
    }

    $momentoMedicao = trim($payload['momento_medicao'] ?? 'Padrao');
    $tipoLeitura = trim($payload['tipo_leitura'] ?? 'Manual');
    $acaoRealizada = trim($payload['acao_realizada'] ?? 'Nenhuma Acao');
    $doseInsulina = isset($payload['dose_insulina']) && $payload['dose_insulina'] !== '' 
        ? (float)$payload['dose_insulina'] 
        : (isset($payload['dose_aplicada']) && $payload['dose_aplicada'] !== '' ? (float)$payload['dose_aplicada'] : null);
    
    $insulinaAtivaEstimada = isset($payload['insulina_ativa_estimada']) && $payload['insulina_ativa_estimada'] !== '' 
        ? (float)$payload['insulina_ativa_estimada'] : null;
    
    $insulinaTotalOrganismo = isset($payload['insulina_total_organismo']) && $payload['insulina_total_organismo'] !== '' 
        ? (float)$payload['insulina_total_organismo'] : null;
    
    if ($insulinaTotalOrganismo === null && ($doseInsulina !== null || $insulinaAtivaEstimada !== null)) {
        $insulinaTotalOrganismo = (float)(($doseInsulina ?? 0) + ($insulinaAtivaEstimada ?? 0));
    }

    $variacaoPorMinuto = isset($payload['variacao_por_minuto']) && $payload['variacao_por_minuto'] !== '' 
        ? (float)$payload['variacao_por_minuto'] : null;
    
    $tendenciaDestro = !empty($payload['tendencia_destro']) ? trim($payload['tendencia_destro']) : null;

    $carboidratosG = !empty($payload['carboidratos_g']) ? (int)$payload['carboidratos_g'] : null;
    $fatorContexto = !empty($payload['fator_contexto']) ? trim($payload['fator_contexto']) : null;
    $sintomasJson = !empty($payload['sintomas']) ? json_encode($payload['sintomas'], JSON_UNESCAPED_UNICODE) : null;
    $observacoes = !empty($payload['observacoes']) ? trim($payload['observacoes']) : null;

    // Permite data/hora retroativa ou assume o fuso horário atual
    date_default_timezone_set('America/Sao_Paulo');
    $dataHoraMedicao = !empty($payload['data_hora_medicao'])
        ? date('Y-m-d H:i:s', strtotime($payload['data_hora_medicao']))
        : date('Y-m-d H:i:s');

    try {
        $perfilId = obterOuCriarPerfilSaude($db, $usuarioId, $usuarioLogado['nome_completo']);

        $stmtIn = $db->prepare(
            'INSERT INTO registros_glicemia (
                perfil_saude_id, valor_mg_dl, momento_medicao, tipo_leitura,
                acao_realizada, dose_insulina, insulina_ativa_estimada,
                insulina_total_organismo, variacao_por_minuto, tendencia_destro,
                carboidratos_g, fator_contexto, sintomas, observacoes, data_hora_medicao
             ) VALUES (
                :pid, :valor, :momento, :tipo,
                :acao, :dose, :iob,
                :itotal, :varmut, :tend,
                :carbos, :contexto, :sintomas, :obs, :datahora
             )'
        );

        $stmtIn->execute([
            ':pid'      => $perfilId,
            ':valor'    => $valorMgDl,
            ':momento'  => $momentoMedicao,
            ':tipo'     => $tipoLeitura,
            ':acao'     => $acaoRealizada,
            ':dose'     => $doseInsulina,
            ':iob'      => $insulinaAtivaEstimada,
            ':itotal'   => $insulinaTotalOrganismo,
            ':varmut'   => $variacaoPorMinuto,
            ':tend'     => $tendenciaDestro,
            ':carbos'   => $carboidratosG,
            ':contexto' => $fatorContexto,
            ':sintomas' => $sintomasJson,
            ':obs'      => $observacoes,
            ':datahora' => $dataHoraMedicao,
        ]);

        $novoId = (int)$db->lastInsertId();

        // Trilha de auditoria imutável (RN-AUD-01)
        AuditLogger::registrar(
            $db,
            'CRIACAO',
            'registros_glicemia',
            (string)$novoId,
            '/meu-perfil',
            null,
            [
                'id'                       => $novoId,
                'valor_mg_dl'              => $valorMgDl,
                'momento'                  => $momentoMedicao,
                'tipo_leitura'             => $tipoLeitura,
                'dose_insulina'            => $doseInsulina,
                'insulina_ativa_estimada'  => $insulinaAtivaEstimada,
                'insulina_total_organismo' => $insulinaTotalOrganismo,
                'variacao_por_minuto'      => $variacaoPorMinuto,
                'tendencia_destro'         => $tendenciaDestro,
                'data_hora'                => $dataHoraMedicao,
            ],
            $usuarioId,
            $usuarioLogado['nome_completo']
        );

        http_response_code(201);
        echo json_encode([
            'sucesso'  => true,
            'mensagem' => 'Medição registrada com sucesso no seu diário seguro.',
            'dados'    => [
                'id'                       => $novoId,
                'valor_mg_dl'              => $valorMgDl,
                'momento_medicao'          => $momentoMedicao,
                'tipo_leitura'             => $tipoLeitura,
                'dose_insulina'            => $doseInsulina,
                'insulina_ativa_estimada'  => $insulinaAtivaEstimada,
                'insulina_total_organismo' => $insulinaTotalOrganismo,
                'variacao_por_minuto'      => $variacaoPorMinuto,
                'tendencia_destro'         => $tendenciaDestro,
                'data_hora_medicao'        => $dataHoraMedicao,
            ]
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Não foi possível registrar a medição.', 'detalhe' => $e->getMessage()]);
        exit;
    }
}
}
/* FIM DO ENDPOINT POST */

/* INÍCIO DO ENDPOINT DELETE: EXCLUIR REGISTRO */
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['sucesso' => false, 'mensagem' => 'ID do registro não informado.']);
        exit;
    }

    try {
        $perfilId = obterOuCriarPerfilSaude($db, $usuarioId, $usuarioLogado['nome_completo']);

        $stmtBusca = $db->prepare('SELECT * FROM registros_glicemia WHERE id = :id AND perfil_saude_id = :pid LIMIT 1');
        $stmtBusca->execute([':id' => $id, ':pid' => $perfilId]);
        $registroAntigo = $stmtBusca->fetch(PDO::FETCH_ASSOC);

        if (!$registroAntigo) {
            http_response_code(404);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Registro não encontrado ou você não tem permissão para excluí-lo.']);
            exit;
        }

        $stmtDel = $db->prepare('DELETE FROM registros_glicemia WHERE id = :id AND perfil_saude_id = :pid');
        $stmtDel->execute([':id' => $id, ':pid' => $perfilId]);

        // Trilha de auditoria imutável (RN-AUD-01)
        AuditLogger::registrar(
            $db,
            'EXCLUSAO',
            'registros_glicemia',
            (string)$id,
            '/meu-perfil',
            $registroAntigo,
            null,
            $usuarioId,
            $usuarioLogado['nome_completo']
        );

        http_response_code(200);
        echo json_encode(['sucesso' => true, 'mensagem' => 'Registro de glicemia excluído com segurança.']);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao excluir registro.', 'detalhe' => $e->getMessage()]);
        exit;
    }
}
/* FIM DO ENDPOINT DELETE */
