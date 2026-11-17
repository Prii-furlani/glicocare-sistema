<?php
/**
 * =============================================================================
 * ARQUIVO: index.php (Localização: /backend/api/perfil/index.php)
 * PROJETO: GlicoCare — Sistema de Saúde Integrada e Acolhimento em DM1
 * OBJETIVO: Gerenciar a busca e atualização do perfil clínico personalizado
 *           (perfis_saude) e medicamentos ativos (medicamentos_usuario),
 *           com auditoria imutável compulsória (RN-AUD-01).
 * =============================================================================
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../../services/AuditLogger.php';

/* INÍCIO DAS CONFIGURAÇÕES DE CABEÇALHO HTTP E CORS */
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
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

/* INÍCIO DO ENDPOINT GET: CONSULTAR PERFIL DE SAÚDE E MEDICAMENTOS */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Busca perfil de saúde do usuário logado
        $stmtPerfil = $db->prepare(
            'SELECT id, usuario_id, nome_completo, data_nascimento, sexo,
                    altura_cm, peso_kg, tipo_diabetes, data_diagnostico,
                    terapia_insulina, fatores_glicemia, config_sexo_especifica,
                    criado_em, atualizado_em
             FROM perfis_saude
             WHERE usuario_id = :uid
             ORDER BY id DESC
             LIMIT 1'
        );
        $stmtPerfil->execute([':uid' => $usuarioId]);
        $perfil = $stmtPerfil->fetch(PDO::FETCH_ASSOC);

        $medicamentos = [];
        if ($perfil) {
            // Decodifica JSONs
            $perfil['fatores_glicemia'] = !empty($perfil['fatores_glicemia'])
                ? json_decode($perfil['fatores_glicemia'], true) : null;
            $perfil['config_sexo_especifica'] = !empty($perfil['config_sexo_especifica'])
                ? json_decode($perfil['config_sexo_especifica'], true) : null;

            // Busca medicamentos vinculados a este perfil
            $stmtMeds = $db->prepare(
                'SELECT id, perfil_saude_id, nome_medicamento, tipo, dose,
                        unidade_medida, horario, uso_continuo, numero_dias
                 FROM medicamentos_usuario
                 WHERE perfil_saude_id = :pid
                 ORDER BY id ASC'
            );
            $stmtMeds->execute([':pid' => $perfil['id']]);
            $medicamentos = $stmtMeds->fetchAll(PDO::FETCH_ASSOC);
        }

        http_response_code(200);
        echo json_encode([
            'sucesso' => true,
            'dados'   => [
                'usuario'      => [
                    'id'                 => $usuarioId,
                    'nome_completo'      => $usuarioLogado['nome_completo'],
                    'email'              => $usuarioLogado['email'],
                    'tipo_usuario'       => $usuarioLogado['tipo_usuario'] ?? 'diabetico',
                    'perfil_configurado' => (int)($usuarioLogado['perfil_configurado'] ?? 0) === 1,
                ],
                'perfil_saude' => $perfil,
                'medicamentos' => $medicamentos,
            ]
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao consultar perfil de saúde.', 'detalhe' => $e->getMessage()]);
        exit;
    }
}
/* FIM DO ENDPOINT GET */

/* INÍCIO DO ENDPOINT POST / PUT: SALVAR OU ATUALIZAR PERFIL DE SAÚDE */
if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true) ?? [];

    $acaoConfigurarDepois = !empty($payload['configurar_depois']);

    // Se o usuário optou por "Configurar depois", apenas retorna sucesso sem bloquear navegação
    if ($acaoConfigurarDepois) {
        http_response_code(200);
        echo json_encode([
            'sucesso'  => true,
            'mensagem' => 'Tudo bem! Você pode personalizar seu espaço seguro a qualquer momento.',
            'dados'    => ['perfil_configurado' => false]
        ]);
        exit;
    }

    $nomeCompleto = trim($payload['nome_completo'] ?? $usuarioLogado['nome_completo']);
    $dataNascimento = !empty($payload['data_nascimento']) ? $payload['data_nascimento'] : null;
    $sexo = strtolower(trim($payload['sexo'] ?? 'outro'));
    if (!in_array($sexo, ['masculino', 'feminino', 'outro'], true)) {
        $sexo = 'outro';
    }

    $alturaCm = !empty($payload['altura_cm']) ? (float)$payload['altura_cm'] : null;
    $pesoKg = !empty($payload['peso_kg']) ? (float)$payload['peso_kg'] : null;
    $tipoDiabetes = trim($payload['tipo_diabetes'] ?? 'Tipo 1A');
    $dataDiagnostico = !empty($payload['data_diagnostico']) ? $payload['data_diagnostico'] : null;
    $terapiaInsulina = trim($payload['terapia_insulina'] ?? 'Caneta');

    $fatoresGlicemiaJson = !empty($payload['fatores_glicemia'])
        ? json_encode($payload['fatores_glicemia'], JSON_UNESCAPED_UNICODE) : null;
    $configSexoJson = !empty($payload['config_sexo_especifica'])
        ? json_encode($payload['config_sexo_especifica'], JSON_UNESCAPED_UNICODE) : null;

    $medicamentosLista = is_array($payload['medicamentos'] ?? null) ? $payload['medicamentos'] : [];

    try {
        // Verifica se já existe um perfil_saude para este usuario_id
        $stmtBusca = $db->prepare('SELECT * FROM perfis_saude WHERE usuario_id = :uid LIMIT 1');
        $stmtBusca->execute([':uid' => $usuarioId]);
        $perfilExistente = $stmtBusca->fetch(PDO::FETCH_ASSOC);

        $perfilSaudeId = null;

        if ($perfilExistente) {
            $perfilSaudeId = (int)$perfilExistente['id'];

            // Atualiza registro existente
            $stmtUp = $db->prepare(
                'UPDATE perfis_saude
                 SET nome_completo          = :nome,
                     data_nascimento        = :dtnasc,
                     sexo                   = :sexo,
                     altura_cm              = :altura,
                     peso_kg                = :peso,
                     tipo_diabetes          = :tipodm,
                     data_diagnostico       = :dtdiag,
                     terapia_insulina       = :terapia,
                     fatores_glicemia       = :fatores,
                     config_sexo_especifica = :configsexo
                 WHERE id = :id'
            );
            $stmtUp->execute([
                ':nome'       => $nomeCompleto,
                ':dtnasc'     => $dataNascimento,
                ':sexo'       => $sexo,
                ':altura'     => $alturaCm,
                ':peso'       => $pesoKg,
                ':tipodm'     => $tipoDiabetes,
                ':dtdiag'     => $dataDiagnostico,
                ':terapia'    => $terapiaInsulina,
                ':fatores'    => $fatoresGlicemiaJson,
                ':configsexo' => $configSexoJson,
                ':id'         => $perfilSaudeId,
            ]);

            // Auditoria imutável da alteração (RN-AUD-01)
            AuditLogger::registrar(
                $db,
                'EDICAO',
                'perfis_saude',
                (string)$perfilSaudeId,
                '/meu-perfil',
                $perfilExistente,
                [
                    'id'               => $perfilSaudeId,
                    'nome_completo'    => $nomeCompleto,
                    'tipo_diabetes'    => $tipoDiabetes,
                    'terapia_insulina' => $terapiaInsulina,
                ],
                $usuarioId,
                $usuarioLogado['nome_completo']
            );
        } else {
            // Criação do novo perfil de saúde
            $stmtIn = $db->prepare(
                'INSERT INTO perfis_saude (
                    usuario_id, nome_completo, data_nascimento, sexo,
                    altura_cm, peso_kg, tipo_diabetes, data_diagnostico,
                    terapia_insulina, fatores_glicemia, config_sexo_especifica
                 ) VALUES (
                    :uid, :nome, :dtnasc, :sexo,
                    :altura, :peso, :tipodm, :dtdiag,
                    :terapia, :fatores, :configsexo
                 )'
            );
            $stmtIn->execute([
                ':uid'        => $usuarioId,
                ':nome'       => $nomeCompleto,
                ':dtnasc'     => $dataNascimento ?: '2000-01-01',
                ':sexo'       => $sexo,
                ':altura'     => $alturaCm,
                ':peso'       => $pesoKg,
                ':tipodm'     => $tipoDiabetes,
                ':dtdiag'     => $dataDiagnostico,
                ':terapia'    => $terapiaInsulina,
                ':fatores'    => $fatoresGlicemiaJson,
                ':configsexo' => $configSexoJson,
            ]);
            $perfilSaudeId = (int)$db->lastInsertId();

            // Auditoria imutável da criação (RN-AUD-01)
            AuditLogger::registrar(
                $db,
                'CRIACAO',
                'perfis_saude',
                (string)$perfilSaudeId,
                '/meu-perfil',
                null,
                [
                    'id'               => $perfilSaudeId,
                    'usuario_id'       => $usuarioId,
                    'nome_completo'    => $nomeCompleto,
                    'tipo_diabetes'    => $tipoDiabetes,
                    'terapia_insulina' => $terapiaInsulina,
                ],
                $usuarioId,
                $usuarioLogado['nome_completo']
            );
        }

        // Marca o usuário como perfil_configurado = 1
        $stmtUserUp = $db->prepare('UPDATE usuarios SET perfil_configurado = 1 WHERE id = :uid');
        $stmtUserUp->execute([':uid' => $usuarioId]);

        // Sincroniza medicamentos (remove anteriores deste perfil e insere os novos da lista)
        if (!empty($perfilSaudeId)) {
            $stmtDelMeds = $db->prepare('DELETE FROM medicamentos_usuario WHERE perfil_saude_id = :pid');
            $stmtDelMeds->execute([':pid' => $perfilSaudeId]);

            $stmtInMed = $db->prepare(
                'INSERT INTO medicamentos_usuario (
                    perfil_saude_id, nome_medicamento, tipo, dose,
                    unidade_medida, horario, uso_continuo, numero_dias
                 ) VALUES (
                    :pid, :nome, :tipo, :dose,
                    :unidade, :horario, :continuo, :dias
                 )'
            );

            foreach ($medicamentosLista as $med) {
                if (!empty(trim($med['nome_medicamento'] ?? ''))) {
                    $stmtInMed->execute([
                        ':pid'      => $perfilSaudeId,
                        ':nome'     => trim($med['nome_medicamento']),
                        ':tipo'     => $med['tipo'] ?? 'Insulina',
                        ':dose'     => trim($med['dose'] ?? '1'),
                        ':unidade'  => trim($med['unidade_medida'] ?? 'UI'),
                        ':horario'  => !empty($med['horario']) ? $med['horario'] : null,
                        ':continuo' => isset($med['uso_continuo']) ? ((int)$med['uso_continuo'] ? 1 : 0) : 1,
                        ':dias'     => !empty($med['numero_dias']) ? (int)$med['numero_dias'] : null,
                    ]);
                }
            }
        }

        http_response_code(200);
        echo json_encode([
            'sucesso'  => true,
            'mensagem' => 'Seu perfil de cuidados foi atualizado com carinho e segurança!',
            'dados'    => [
                'perfil_saude_id'    => $perfilSaudeId,
                'perfil_configurado' => true,
            ]
        ]);
        exit;

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Não foi possível salvar seu perfil agora.', 'detalhe' => $e->getMessage()]);
        exit;
    }
}
/* FIM DO ENDPOINT POST / PUT */
