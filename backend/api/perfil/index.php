<?php
/**
 * =============================================================================
 * ARQUIVO: index.php (Localização: /backend/api/perfil/index.php)
 * PROJETO: GlicoCare — Sistema de Saúde Integrada e Acolhimento em DM1
 * OBJETIVO: Gerenciar a busca e atualização do perfil clínico personalizado
 *           (perfis_saude), medicamentos ativos (medicamentos_usuario) e
 *           alergias/sensibilidades (alergias_usuario), com auditoria imutável compulsória (RN-AUD-01).
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

/* INÍCIO DO ENDPOINT GET: CONSULTAR PERFIL DE SAÚDE, MEDICAMENTOS E ALERGIAS */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Se informado perfil_saude_id via query (para visualização de profissional/consulta)
        $targetPerfilId = isset($_GET['perfil_saude_id']) ? (int)$_GET['perfil_saude_id'] : 0;

        if ($targetPerfilId > 0 && in_array($usuarioLogado['tipo_usuario'] ?? '', ['especialista', 'admin'], true)) {
            $stmtPerfil = $db->prepare(
                'SELECT id, usuario_id, nome_completo, data_nascimento, sexo,
                        altura_cm, peso_kg, tipo_diabetes, data_diagnostico,
                        terapia_insulina, fsi, glicemia_alvo, duracao_insulina_horas,
                        possui_alergias, fatores_glicemia, config_sexo_especifica,
                        criado_em, atualizado_em
                 FROM perfis_saude
                 WHERE id = :pid
                 LIMIT 1'
            );
            $stmtPerfil->execute([':pid' => $targetPerfilId]);
        } else {
            // Busca perfil de saúde do usuário logado
            $stmtPerfil = $db->prepare(
                'SELECT id, usuario_id, nome_completo, data_nascimento, sexo,
                        altura_cm, peso_kg, tipo_diabetes, data_diagnostico,
                        terapia_insulina, fsi, glicemia_alvo, duracao_insulina_horas,
                        possui_alergias, fatores_glicemia, config_sexo_especifica,
                        criado_em, atualizado_em
                 FROM perfis_saude
                 WHERE usuario_id = :uid
                 ORDER BY id DESC
                 LIMIT 1'
            );
            $stmtPerfil->execute([':uid' => $usuarioId]);
        }

        $perfil = $stmtPerfil->fetch(PDO::FETCH_ASSOC);

        $medicamentos = [];
        $alergias = [];

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

            // Busca alergias estruturadas vinculadas a este perfil
            $stmtAlergias = $db->prepare(
                'SELECT id, perfil_saude_id, categoria, substancia_ou_item,
                        gravidade, reacao_observada, criado_em
                 FROM alergias_usuario
                 WHERE perfil_saude_id = :pid
                 ORDER BY id ASC'
            );
            $stmtAlergias->execute([':pid' => $perfil['id']]);
            $alergias = $stmtAlergias->fetchAll(PDO::FETCH_ASSOC);

            // Busca contatos de emergência vinculados a este perfil (RN-EMERG-01)
            $stmtContatos = $db->prepare(
                'SELECT id, perfil_saude_id, nome_contato, relacao, telefone, ordem, criado_em
                 FROM contatos_emergencia
                 WHERE perfil_saude_id = :pid
                 ORDER BY ordem ASC, id ASC'
            );
            $stmtContatos->execute([':pid' => $perfil['id']]);
            $contatosEmergencia = $stmtContatos->fetchAll(PDO::FETCH_ASSOC);
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
                'alergias'     => $alergias,
                'contatos_emergencia' => $contatosEmergencia ?? [],
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
    $fsi = !empty($payload['fsi']) ? (float)$payload['fsi'] : null;
    $glicemiaAlvo = !empty($payload['glicemia_alvo']) ? (int)$payload['glicemia_alvo'] : 100;
    $duracaoInsulinaHoras = !empty($payload['duracao_insulina_horas']) ? (int)$payload['duracao_insulina_horas'] : 3;

    // Alergias e sensibilidades
    $possuiAlergias = null;
    if (array_key_exists('possui_alergias', $payload)) {
        if ($payload['possui_alergias'] === true || $payload['possui_alergias'] === 1 || $payload['possui_alergias'] === '1') {
            $possuiAlergias = 1;
        } elseif ($payload['possui_alergias'] === false || $payload['possui_alergias'] === 0 || $payload['possui_alergias'] === '0') {
            $possuiAlergias = 0;
        }
    }
    $alergiasLista = is_array($payload['alergias'] ?? null) ? $payload['alergias'] : [];

    $fatoresGlicemiaJson = !empty($payload['fatores_glicemia'])
        ? json_encode($payload['fatores_glicemia'], JSON_UNESCAPED_UNICODE) : null;
    $configSexoJson = !empty($payload['config_sexo_especifica'])
        ? json_encode($payload['config_sexo_especifica'], JSON_UNESCAPED_UNICODE) : null;

    $medicamentosLista = is_array($payload['medicamentos'] ?? null) ? $payload['medicamentos'] : [];

    try {
        // Inicia transação
        $db->beginTransaction();

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
                     fsi                    = :fsi,
                     glicemia_alvo          = :alvo,
                     duracao_insulina_horas = :duracao,
                     possui_alergias        = :alergias_flag,
                     fatores_glicemia       = :fatores,
                     config_sexo_especifica = :configsexo
                 WHERE id = :id'
            );
            $stmtUp->execute([
                ':nome'           => $nomeCompleto,
                ':dtnasc'         => $dataNascimento,
                ':sexo'           => $sexo,
                ':altura'         => $alturaCm,
                ':peso'           => $pesoKg,
                ':tipodm'         => $tipoDiabetes,
                ':dtdiag'         => $dataDiagnostico,
                ':terapia'        => $terapiaInsulina,
                ':fsi'            => $fsi,
                ':alvo'           => $glicemiaAlvo,
                ':duracao'        => $duracaoInsulinaHoras,
                ':alergias_flag'  => $possuiAlergias,
                ':fatores'        => $fatoresGlicemiaJson,
                ':configsexo'     => $configSexoJson,
                ':id'             => $perfilSaudeId,
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
                    'data_diagnostico' => $dataDiagnostico,
                    'terapia_insulina' => $terapiaInsulina,
                    'possui_alergias'  => $possuiAlergias,
                    'total_alergias'   => count($alergiasLista),
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
                    terapia_insulina, fsi, glicemia_alvo, duracao_insulina_horas,
                    possui_alergias, fatores_glicemia, config_sexo_especifica
                 ) VALUES (
                    :uid, :nome, :dtnasc, :sexo,
                    :altura, :peso, :tipodm, :dtdiag,
                    :terapia, :fsi, :alvo, :duracao,
                    :alergias_flag, :fatores, :configsexo
                 )'
            );
            $stmtIn->execute([
                ':uid'           => $usuarioId,
                ':nome'          => $nomeCompleto,
                ':dtnasc'        => $dataNascimento ?: '2000-01-01',
                ':sexo'          => $sexo,
                ':altura'        => $alturaCm,
                ':peso'          => $pesoKg,
                ':tipodm'        => $tipoDiabetes,
                ':dtdiag'        => $dataDiagnostico,
                ':terapia'       => $terapiaInsulina,
                ':fsi'           => $fsi,
                ':alvo'          => $glicemiaAlvo,
                ':duracao'       => $duracaoInsulinaHoras,
                ':alergias_flag' => $possuiAlergias,
                ':fatores'       => $fatoresGlicemiaJson,
                ':configsexo'    => $configSexoJson,
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
                    'data_diagnostico' => $dataDiagnostico,
                    'terapia_insulina' => $terapiaInsulina,
                    'possui_alergias'  => $possuiAlergias,
                ],
                $usuarioId,
                $usuarioLogado['nome_completo']
            );
        }

        // Marca o usuário como perfil_configurado = 1
        $stmtUserUp = $db->prepare('UPDATE usuarios SET perfil_configurado = 1 WHERE id = :uid');
        $stmtUserUp->execute([':uid' => $usuarioId]);

        // Sincroniza medicamentos (remove anteriores e insere a lista atualizada)
        if (!empty($perfilSaudeId)) {
            $stmtDelMeds = $db->prepare('DELETE FROM medicamentos_usuario WHERE perfil_saude_id = :pid');
            $stmtDelMeds->execute([':pid' => $perfilSaudeId]);

            if (!empty($medicamentosLista)) {
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

            // Sincroniza alergias e sensibilidades (alergias_usuario)
            $stmtDelAlergias = $db->prepare('DELETE FROM alergias_usuario WHERE perfil_saude_id = :pid');
            $stmtDelAlergias->execute([':pid' => $perfilSaudeId]);

            if ($possuiAlergias === 1 && !empty($alergiasLista)) {
                $stmtInAlergia = $db->prepare(
                    'INSERT INTO alergias_usuario (
                        perfil_saude_id, categoria, substancia_ou_item, gravidade, reacao_observada
                     ) VALUES (
                        :pid, :cat, :item, :gravidade, :reacao
                     )'
                );

                $categoriasValidas = ['MEDICAMENTO', 'ALIMENTO', 'ADESIVO_INSUMO', 'OUTRA'];
                $gravidadesValidas = ['LEVE', 'MODERADA', 'GRAVE'];

                foreach ($alergiasLista as $alergia) {
                    $itemNome = trim($alergia['substancia_ou_item'] ?? '');
                    if (!empty($itemNome)) {
                        $cat = strtoupper(trim($alergia['categoria'] ?? 'OUTRA'));
                        if (!in_array($cat, $categoriasValidas, true)) {
                            $cat = 'OUTRA';
                        }

                        $grav = strtoupper(trim($alergia['gravidade'] ?? 'MODERADA'));
                        if (!in_array($grav, $gravidadesValidas, true)) {
                            $grav = 'MODERADA';
                        }

                        $reacao = !empty($alergia['reacao_observada']) ? trim($alergia['reacao_observada']) : null;

                        $stmtInAlergia->execute([
                            ':pid'       => $perfilSaudeId,
                            ':cat'       => $cat,
                            ':item'      => $itemNome,
                            ':gravidade' => $grav,
                            ':reacao'    => $reacao,
                        ]);
                    }
                }

                // Auditoria da sincronização de alergias
                AuditLogger::registrar(
                    $db,
                    'EDICAO',
                    'alergias_usuario',
                    (string)$perfilSaudeId,
                    '/meu-perfil',
                    null,
                    ['total_alergias' => count($alergiasLista)],
                    $usuarioId,
                    $usuarioLogado['nome_completo']
                );
            }

            // Sincroniza contatos de emergência (RN-EMERG-01)
            $contatosPayload = $payload['contatos_emergencia'] ?? null;
            if (is_array($contatosPayload) && !empty($contatosPayload)) {
                $stmtDelContatos = $db->prepare('DELETE FROM contatos_emergencia WHERE perfil_saude_id = :pid');
                $stmtDelContatos->execute([':pid' => $perfilSaudeId]);

                $stmtInContato = $db->prepare('
                    INSERT INTO contatos_emergencia (perfil_saude_id, nome_contato, relacao, telefone, ordem, criado_em)
                    VALUES (:pid, :nome, :relacao, :tel, :ordem, NOW())
                ');

                $ordemIdx = 1;
                $telPrincipal = null;
                foreach ($contatosPayload as $ct) {
                    $nomeCt = trim($ct['nome_contato'] ?? '');
                    $telCt = trim($ct['telefone'] ?? '');
                    $relCt = trim($ct['relacao'] ?? 'Familiar');
                    if (!empty($nomeCt) && !empty($telCt)) {
                        $stmtInContato->execute([
                            ':pid' => $perfilSaudeId,
                            ':nome' => $nomeCt,
                            ':relacao' => $relCt,
                            ':tel' => $telCt,
                            ':ordem' => $ordemIdx,
                        ]);
                        if ($ordemIdx === 1) {
                            $telPrincipal = $telCt;
                        }
                        $ordemIdx++;
                    }
                }

                if ($telPrincipal) {
                    $stmtUpdTel = $db->prepare('UPDATE perfis_saude SET contato_emergencia_telefone = :tel WHERE id = :pid');
                    $stmtUpdTel->execute([':tel' => $telPrincipal, ':pid' => $perfilSaudeId]);
                }
            }
        }

        $db->commit();

        http_response_code(200);
        echo json_encode([
            'sucesso'  => true,
            'mensagem' => 'Seu perfil de cuidados foi atualizado com carinho e segurança!',
            'dados'    => [
                'perfil_saude_id'    => $perfilSaudeId,
                'perfil_configurado' => true,
                'possui_alergias'    => $possuiAlergias,
            ]
        ]);
        exit;

    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        http_response_code(500);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Não foi possível salvar seu perfil agora.', 'detalhe' => $e->getMessage()]);
        exit;
    }
}
/* FIM DO ENDPOINT POST / PUT */
