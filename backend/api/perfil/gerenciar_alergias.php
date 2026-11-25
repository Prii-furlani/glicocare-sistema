<?php
/**
 * =============================================================================
 * ARQUIVO: gerenciar_alergias.php (Localização: /backend/api/perfil/gerenciar_alergias.php)
 * PROJETO: GlicoCare — Gestão Direta de Alergias & Sensibilidades Clínicas
 * OBJETIVO: Permitir consulta, adição e remoção direta de alergias do paciente
 *           ou dependente infantil via Modal/Sheet sem redirecionar ao wizard.
 * CONFORMIDADE: CFM, LGPD e RN-AUD-01 (AuditLogger em fuso America/Sao_Paulo).
 * =============================================================================
 */

/* INÍCIO DO ENDPOINT GERENCIAR_ALERGIAS */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../../services/AuditLogger.php';

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$database = new Database();
$db = $database->getConnection();

// Autenticação obrigatória
$usuarioLogado = AuthMiddleware::autenticar($db, '/meu-perfil');
$usuarioId = (int)$usuarioLogado['id'];
$usuarioNome = $usuarioLogado['nome_completo'];
$usuarioTipo = $usuarioLogado['tipo_usuario'] ?? 'paciente';

// Leitura de payload para POST ou DELETE
$input = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $rawInput = file_get_contents('php://input');
    if (!empty($rawInput)) {
        $input = json_decode($rawInput, true) ?? [];
    }
}

// Identifica o perfil de saúde (seja de paciente direto ou dependente)
$perfilSaudeId = isset($_GET['perfil_saude_id']) ? (int)$_GET['perfil_saude_id'] : 0;
if ($perfilSaudeId <= 0 && isset($input['perfil_saude_id'])) {
    $perfilSaudeId = (int)$input['perfil_saude_id'];
}

// Se não especificado, busca o perfil de saúde do próprio usuário autenticado
if ($perfilSaudeId <= 0) {
    $stmtP = $db->prepare('SELECT id FROM perfis_saude WHERE usuario_id = :uid ORDER BY id DESC LIMIT 1');
    $stmtP->execute([':uid' => $usuarioId]);
    $pRow = $stmtP->fetch(PDO::FETCH_ASSOC);
    if ($pRow) {
        $perfilSaudeId = (int)$pRow['id'];
    }
}

if ($perfilSaudeId <= 0) {
    http_response_code(400);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Perfil de saúde não localizado para este usuário.'
    ]);
    exit;
}

// Verificação de autorização de acesso (dono do perfil, cuidador autorizado ou admin)
$stmtAuthCheck = $db->prepare('
    SELECT 1 FROM perfis_saude WHERE id = :pid AND usuario_id = :uid
    UNION
    SELECT 1 FROM cuidadores_dependentes WHERE perfil_saude_id = :pid AND cuidador_usuario_id = :uid
');
$stmtAuthCheck->execute([':pid' => $perfilSaudeId, ':uid' => $usuarioId]);
$autorizado = $stmtAuthCheck->fetchColumn() || $usuarioTipo === 'admin';

if (!$autorizado) {
    http_response_code(403);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Acesso não autorizado ao prontuário deste dependente/perfil.'
    ]);
    exit;
}

/* =============================================================================
   MÉTODO GET: Listar alergias cadastradas do perfil
   ============================================================================= */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $db->prepare('
            SELECT id, perfil_saude_id, categoria, substancia_ou_item, gravidade, reacao_observada, criado_em
            FROM alergias_usuario
            WHERE perfil_saude_id = :pid
            ORDER BY FIELD(gravidade, "GRAVE", "MODERADA", "LEVE"), substancia_ou_item ASC
        ');
        $stmt->execute([':pid' => $perfilSaudeId]);
        $alergias = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Busca o status de possui_alergias na tabela perfis_saude
        $stmtFlag = $db->prepare('SELECT possui_alergias FROM perfis_saude WHERE id = :pid');
        $stmtFlag->execute([':pid' => $perfilSaudeId]);
        $flagRow = $stmtFlag->fetch(PDO::FETCH_ASSOC);
        $possuiAlergias = $flagRow ? (int)$flagRow['possui_alergias'] : 0;

        echo json_encode([
            'sucesso' => true,
            'perfil_saude_id' => $perfilSaudeId,
            'possui_alergias' => $possuiAlergias,
            'total' => count($alergias),
            'alergias' => $alergias
        ]);
        exit;
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao listar alergias: ' . $e->getMessage()]);
        exit;
    }
}

/* =============================================================================
   MÉTODO POST: Adicionar nova alergia diretamente pelo modal/gaveta
   ============================================================================= */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $substancia = trim($input['substancia_ou_item'] ?? '');
        $categoria = strtoupper(trim($input['categoria'] ?? 'OUTRA'));
        $gravidade = strtoupper(trim($input['gravidade'] ?? 'MODERADA'));
        $reacao = trim($input['reacao_observada'] ?? '');

        // Mapeamentos resilientes para compatibilidade
        if (strpos($categoria, 'ADESIVO') !== false || strpos($categoria, 'INSUMO') !== false) {
            $categoria = 'ADESIVO_INSUMO';
        } elseif (strpos($categoria, 'MEDIC') !== false) {
            $categoria = 'MEDICAMENTO';
        } elseif (strpos($categoria, 'ALIM') !== false) {
            $categoria = 'ALIMENTO';
        } else {
            $categoria = 'OUTRA';
        }

        if (strpos($gravidade, 'GRAVE') !== false || strpos($gravidade, 'ANAFIL') !== false) {
            $gravidade = 'GRAVE';
        } elseif (strpos($gravidade, 'LEVE') !== false) {
            $gravidade = 'LEVE';
        } else {
            $gravidade = 'MODERADA';
        }

        if (empty($substancia)) {
            http_response_code(422);
            echo json_encode(['sucesso' => false, 'mensagem' => 'O nome da substância ou insumo é obrigatório.']);
            exit;
        }

        $db->beginTransaction();

        $stmtIn = $db->prepare('
            INSERT INTO alergias_usuario (
                perfil_saude_id, categoria, substancia_ou_item, gravidade, reacao_observada
            ) VALUES (
                :pid, :cat, :item, :gravidade, :reacao
            )
        ');
        $stmtIn->execute([
            ':pid'       => $perfilSaudeId,
            ':cat'       => $categoria,
            ':item'      => $substancia,
            ':gravidade' => $gravidade,
            ':reacao'    => !empty($reacao) ? $reacao : null
        ]);
        $novaAlergiaId = (int)$db->lastInsertId();

        // Atualiza a flag de alergias no perfil de saúde
        $stmtUpFlag = $db->prepare('UPDATE perfis_saude SET possui_alergias = 1 WHERE id = :pid');
        $stmtUpFlag->execute([':pid' => $perfilSaudeId]);

        $db->commit();

        // Auditoria imutável (RN-AUD-01) com fuso de Brasília
        AuditLogger::registrar(
            $db,
            'CRIACAO',
            'alergias_usuario',
            $novaAlergiaId,
            '/perfil/gerenciar_alergias.php',
            null,
            [
                'perfil_saude_id' => $perfilSaudeId,
                'substancia' => $substancia,
                'categoria' => $categoria,
                'gravidade' => $gravidade,
                'reacao' => $reacao
            ],
            $usuarioId,
            $usuarioNome
        );

        $novaAlergia = [
            'id' => $novaAlergiaId,
            'perfil_saude_id' => $perfilSaudeId,
            'categoria' => $categoria,
            'substancia_ou_item' => $substancia,
            'gravidade' => $gravidade,
            'reacao_observada' => $reacao,
            'criado_em' => date('Y-m-d H:i:s')
        ];

        http_response_code(201);
        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Alergia cadastrada com sucesso!',
            'alergia' => $novaAlergia
        ]);
        exit;
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        http_response_code(500);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao salvar alergia: ' . $e->getMessage()]);
        exit;
    }
}

/* =============================================================================
   MÉTODO DELETE: Remover alergia com auditoria
   ============================================================================= */
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $alergiaId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($alergiaId <= 0 && isset($input['id'])) {
        $alergiaId = (int)$input['id'];
    }

    if ($alergiaId <= 0) {
        http_response_code(400);
        echo json_encode(['sucesso' => false, 'mensagem' => 'ID da alergia não informado.']);
        exit;
    }

    try {
        $stmtFind = $db->prepare('SELECT * FROM alergias_usuario WHERE id = :id AND perfil_saude_id = :pid');
        $stmtFind->execute([':id' => $alergiaId, ':pid' => $perfilSaudeId]);
        $alergiaExistente = $stmtFind->fetch(PDO::FETCH_ASSOC);

        if (!$alergiaExistente) {
            http_response_code(404);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Registro de alergia não encontrado neste perfil.']);
            exit;
        }

        $stmtDel = $db->prepare('DELETE FROM alergias_usuario WHERE id = :id');
        $stmtDel->execute([':id' => $alergiaId]);

        // Se não houver mais alergias cadastradas, zera a flag no perfil de saúde
        $stmtCount = $db->prepare('SELECT COUNT(*) FROM alergias_usuario WHERE perfil_saude_id = :pid');
        $stmtCount->execute([':pid' => $perfilSaudeId]);
        if ((int)$stmtCount->fetchColumn() === 0) {
            $stmtUpZero = $db->prepare('UPDATE perfis_saude SET possui_alergias = 0 WHERE id = :pid');
            $stmtUpZero->execute([':pid' => $perfilSaudeId]);
        }

        // Auditoria de exclusão
        AuditLogger::registrar(
            $db,
            'EXCLUSAO',
            'alergias_usuario',
            $alergiaId,
            '/perfil/gerenciar_alergias.php',
            $alergiaExistente,
            null,
            $usuarioId,
            $usuarioNome
        );

        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Alergia removida com sucesso.'
        ]);
        exit;
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao excluir alergia: ' . $e->getMessage()]);
        exit;
    }
}

/* FIM DO ENDPOINT GERENCIAR_ALERGIAS */
