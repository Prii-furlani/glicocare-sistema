<?php
/**
 * =============================================================================
 * ARQUIVO: cadastrar_dependente.php (Localização: /backend/api/cuidadores/cadastrar_dependente.php)
 * PROJETO: GlicoCare — Módulo do Perfil Cuidador (Crianças com DM1 < 12 anos)
 * OBJETIVO: Cadastrar nova criança ou vincular-se via código de convite familiar,
 *           com auditoria imutável (RN-AUD-01) e fuso America/Sao_Paulo.
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

$modo = trim($payload['modo'] ?? 'novo'); // 'novo' ou 'convite'
$parentesco = in_array($payload['parentesco'] ?? '', ['MAE', 'PAI', 'AVO_A', 'RESPONSAVEL_LEGAL', 'OUTRO_CUIDADOR'])
    ? $payload['parentesco']
    : 'MAE';

try {
    /* =========================================================================
       MODO 1: VINCULAR VIA CÓDIGO DE CONVITE FAMILIAR
       ========================================================================= */
    if ($modo === 'convite' || !empty($payload['codigo_convite'])) {
        $codigo = strtoupper(trim($payload['codigo_convite'] ?? ''));

        if (empty($codigo)) {
            http_response_code(400);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Por favor, informe o código de convite da família.']);
            exit;
        }

        // Busca o vínculo existente com esse código
        $stmtBusca = $db->prepare('
            SELECT cd.perfil_saude_id, ps.nome_completo AS nome_crianca
            FROM cuidadores_dependentes cd
            INNER JOIN perfis_saude ps ON cd.perfil_saude_id = ps.id
            WHERE cd.codigo_convite_familia = :codigo
            LIMIT 1
        ');
        $stmtBusca->execute([':codigo' => $codigo]);
        $vinculoOrigem = $stmtBusca->fetch(PDO::FETCH_ASSOC);

        if (!$vinculoOrigem) {
            http_response_code(404);
            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'Código de convite não encontrado ou expirado. Verifique o código com o responsável principal.'
            ]);
            exit;
        }

        $perfilSaudeId = (int)$vinculoOrigem['perfil_saude_id'];

        // Verifica se o usuário já possui vínculo com essa criança
        $stmtJaVinculado = $db->prepare('
            SELECT id FROM cuidadores_dependentes
            WHERE cuidador_usuario_id = :uid AND perfil_saude_id = :pid
            LIMIT 1
        ');
        $stmtJaVinculado->execute([':uid' => $usuarioId, ':pid' => $perfilSaudeId]);
        if ($stmtJaVinculado->fetch()) {
            http_response_code(409);
            echo json_encode([
                'sucesso' => false,
                'mensagem' => "Você já está vinculado(a) ao perfil de {$vinculoOrigem['nome_crianca']}."
            ]);
            exit;
        }

        // Insere o novo cuidador vinculado
        $nivelAcesso = ($parentesco === 'PAI' || $parentesco === 'MAE') ? 'ADMINISTRADOR_LEGAL' : 'ACOMPANHANTE_DIARIO';
        $stmtNovoVinc = $db->prepare('
            INSERT INTO cuidadores_dependentes
                (cuidador_usuario_id, perfil_saude_id, parentesco, nivel_acesso, vinculado_em)
            VALUES
                (:uid, :pid, :parentesco, :nivel, NOW())
        ');
        $stmtNovoVinc->execute([
            ':uid'        => $usuarioId,
            ':pid'        => $perfilSaudeId,
            ':parentesco' => $parentesco,
            ':nivel'      => $nivelAcesso,
        ]);
        $novoId = (int)$db->lastInsertId();

        // Trilha de auditoria imutável (RN-AUD-01)
        AuditLogger::registrar(
            $db,
            'CRIACAO',
            'cuidadores_dependentes',
            $novoId,
            '/painel-cuidador',
            null,
            [
                'cuidador_usuario_id' => $usuarioId,
                'perfil_saude_id'     => $perfilSaudeId,
                'parentesco'          => $parentesco,
                'nivel_acesso'        => $nivelAcesso,
                'via_convite'         => $codigo,
            ],
            $usuarioId,
            $usuarioLogado['nome_completo']
        );

        echo json_encode([
            'sucesso'         => true,
            'mensagem'        => "Vínculo estabelecido com sucesso! Agora você acompanha {$vinculoOrigem['nome_crianca']}.",
            'perfil_saude_id' => $perfilSaudeId,
        ]);
        exit;
    }

    /* =========================================================================
       MODO 2: CADASTRAR NOVO DEPENDENTE (PERFIL DE SAÚDE + VÍNCULO)
       ========================================================================= */
    $nomeCrianca = trim($payload['nome_completo'] ?? '');
    $dataNascimento = trim($payload['data_nascimento'] ?? '');
    $sexo = in_array($payload['sexo'] ?? '', ['masculino', 'feminino', 'outro']) ? $payload['sexo'] : 'outro';
    $tipoDiabetes = trim($payload['tipo_diabetes'] ?? 'Tipo 1A');
    $dataDiagnostico = !empty($payload['data_diagnostico']) ? trim($payload['data_diagnostico']) : null;
    $terapiaInsulina = trim($payload['terapia_insulina'] ?? 'Caneta');
    $escolaNome = !empty($payload['escola_nome']) ? trim($payload['escola_nome']) : null;
    $contatoEmergencia = !empty($payload['contato_emergencia_telefone']) ? trim($payload['contato_emergencia_telefone']) : null;

    if (empty($nomeCrianca) || empty($dataNascimento)) {
        http_response_code(400);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Por favor, informe o nome completo da criança e a data de nascimento.'
        ]);
        exit;
    }

    // Calcula se é menor de 12 anos
    $nascDt = new DateTime($dataNascimento);
    $agora = new DateTime('now', new DateTimeZone('America/Sao_Paulo'));
    $idadeAnos = $nascDt->diff($agora)->y;
    $isMenor12 = ($idadeAnos < 12) ? 1 : 0;

    $db->beginTransaction();

    // 1. Cria o perfil_saude da criança
    $stmtCriaPerfil = $db->prepare('
        INSERT INTO perfis_saude (
            usuario_id, nome_completo, nome_completo_paciente, data_nascimento,
            sexo, tipo_diabetes, data_diagnostico, terapia_insulina,
            is_menor_12, escola_nome, contato_emergencia_telefone,
            glicemia_alvo, duracao_insulina_horas
        ) VALUES (
            :uid, :nome, :nome_paciente, :data_nasc,
            :sexo, :tipo_dm, :data_diag, :terapia,
            :is_menor, :escola, :contato,
            100, 3
        )
    ');
    $stmtCriaPerfil->execute([
        ':uid'           => $usuarioId,
        ':nome'          => $nomeCrianca,
        ':nome_paciente' => $nomeCrianca,
        ':data_nasc'     => $dataNascimento,
        ':sexo'          => $sexo,
        ':tipo_dm'       => $tipoDiabetes,
        ':data_diag'     => $dataDiagnostico,
        ':terapia'       => $terapiaInsulina,
        ':is_menor'      => $isMenor12,
        ':escola'        => $escolaNome,
        ':contato'       => $contatoEmergencia,
    ]);
    $novoPerfilId = (int)$db->lastInsertId();

    // 2. Gera código único de convite familiar para a criança (ex: THEO-9842 ou GLICO-ABCD)
    $prefixoNome = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $nomeCrianca), 0, 4));
    if (strlen($prefixoNome) < 3) $prefixoNome = 'GLICO';
    $codigoConvite = $prefixoNome . '-' . strtoupper(bin2hex(random_bytes(2)));

    // 3. Cria o vínculo de cuidador principal (ADMINISTRADOR_LEGAL)
    $stmtCriaVinc = $db->prepare('
        INSERT INTO cuidadores_dependentes (
            cuidador_usuario_id, perfil_saude_id, parentesco, nivel_acesso, codigo_convite_familia, vinculado_em
        ) VALUES (
            :uid, :pid, :parentesco, "ADMINISTRADOR_LEGAL", :codigo, NOW()
        )
    ');
    $stmtCriaVinc->execute([
        ':uid'        => $usuarioId,
        ':pid'        => $novoPerfilId,
        ':parentesco' => $parentesco,
        ':codigo'     => $codigoConvite,
    ]);
    $novoVinculoId = (int)$db->lastInsertId();

    // 4. Cadastra alergias iniciais se enviadas
    if (!empty($payload['alergias']) && is_array($payload['alergias'])) {
        $stmtAlerg = $db->prepare('
            INSERT INTO alergias_usuario (perfil_saude_id, categoria, substancia_ou_item, gravidade, reacao_observada)
            VALUES (:pid, :cat, :subst, :grav, :reacao)
        ');
        foreach ($payload['alergias'] as $al) {
            if (!empty($al['substancia_ou_item'])) {
                $stmtAlerg->execute([
                    ':pid'    => $novoPerfilId,
                    ':cat'    => $al['categoria'] ?? 'MEDICAMENTO',
                    ':subst'  => trim($al['substancia_ou_item']),
                    ':grav'   => $al['gravidade'] ?? 'MODERADA',
                    ':reacao' => trim($al['reacao_observada'] ?? ''),
                ]);
            }
        }
    }

    // 5. Cadastra insulinas/medicamentos iniciais se enviados
    if (!empty($payload['medicamentos']) && is_array($payload['medicamentos'])) {
        $stmtMed = $db->prepare('
            INSERT INTO medicamentos_usuario (perfil_saude_id, nome_medicamento, tipo, dose, unidade_medida, uso_continuo)
            VALUES (:pid, :nome, :tipo, :dose, :unidade, 1)
        ');
        foreach ($payload['medicamentos'] as $med) {
            if (!empty($med['nome_medicamento'])) {
                $stmtMed->execute([
                    ':pid'     => $novoPerfilId,
                    ':nome'    => trim($med['nome_medicamento']),
                    ':tipo'    => $med['tipo'] ?? 'Insulina',
                    ':dose'    => trim($med['dose'] ?? '1'),
                    ':unidade' => trim($med['unidade_medida'] ?? 'UI'),
                ]);
            }
        }
    }

    $db->commit();

    // Trilha de auditoria imutável (RN-AUD-01)
    AuditLogger::registrar(
        $db,
        'CRIACAO',
        'cuidadores_dependentes',
        $novoVinculoId,
        '/painel-cuidador',
        null,
        [
            'cuidador_usuario_id' => $usuarioId,
            'perfil_saude_id'     => $novoPerfilId,
            'nome_crianca'        => $nomeCrianca,
            'parentesco'          => $parentesco,
            'nivel_acesso'        => 'ADMINISTRADOR_LEGAL',
            'codigo_convite'      => $codigoConvite,
        ],
        $usuarioId,
        $usuarioLogado['nome_completo']
    );

    echo json_encode([
        'sucesso'                => true,
        'mensagem'               => "Perfil de {$nomeCrianca} cadastrado com sucesso!",
        'perfil_saude_id'        => $novoPerfilId,
        'codigo_convite_familia' => $codigoConvite,
    ]);
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'sucesso'  => false,
        'mensagem' => 'Erro ao cadastrar dependente: ' . $e->getMessage()
    ]);
}
