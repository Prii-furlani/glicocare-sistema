<?php
/**
 * =============================================================================
 * ARQUIVO: alergias.php (Localização: /backend/api/perfil/alergias.php)
 * PROJETO: GlicoCare — Registro Estruturado de Alergias e Sensibilidades Clínicas
 * OBJETIVO: Gerenciar a consulta, inclusão e remoção de alergias e sensibilidades
 *           (alergias_usuario) com auditoria imutável (RN-AUD-01).
 * =============================================================================
 */

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

$usuarioLogado = AuthMiddleware::autenticar($db, '/meu-perfil');
$usuarioId = (int)$usuarioLogado['id'];
$usuarioNome = $usuarioLogado['nome_completo'];

// Identifica o perfil de saúde
$perfilSaudeId = isset($_GET['perfil_saude_id']) ? (int)$_GET['perfil_saude_id'] : 0;
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

/* MÉTODO GET: Listar alergias do perfil */
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
        $possuiAlergias = $flagRow ? $flagRow['possui_alergias'] : null;

        echo json_encode([
            'sucesso' => true,
            'perfil_saude_id' => $perfilSaudeId,
            'possui_alergias' => $possuiAlergias !== null ? (int)$possuiAlergias : null,
            'alergias' => $alergias
        ]);
        exit;
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao listar alergias: ' . $e->getMessage()]);
        exit;
    }
}

/* MÉTODO POST: Adicionar nova alergia ou atualizar status possui_alergias */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

    try {
        $substancia = trim($input['substancia_ou_item'] ?? '');
        $categoria = strtoupper(trim($input['categoria'] ?? 'OUTRA'));
        $gravidade = strtoupper(trim($input['gravidade'] ?? 'MODERADA'));
        $reacao = trim($input['reacao_observada'] ?? '');

        $categoriasValidas = ['MEDICAMENTO', 'ALIMENTO', 'ADESIVO_INSUMO', 'OUTRA'];
        $gravidadesValidas = ['LEVE', 'MODERADA', 'GRAVE'];

        if (!in_array($categoria, $categoriasValidas, true)) $categoria = 'OUTRA';
        if (!in_array($gravidade, $gravidadesValidas, true)) $gravidade = 'MODERADA';

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

        // Garante que possui_alergias = 1
        $stmtUpFlag = $db->prepare('UPDATE perfis_saude SET possui_alergias = 1 WHERE id = :pid');
        $stmtUpFlag->execute([':pid' => $perfilSaudeId]);

        $db->commit();

        AuditLogger::registrar(
            $db,
            'CRIACAO',
            'alergias_usuario',
            $novaAlergiaId,
            '/meu-perfil',
            null,
            [
                'perfil_saude_id' => $perfilSaudeId,
                'substancia' => $substancia,
                'categoria' => $categoria,
                'gravidade' => $gravidade
            ],
            $usuarioId,
            $usuarioNome
        );

        http_response_code(201);
        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Alergia cadastrada com sucesso!',
            'alergia_id' => $novaAlergiaId
        ]);
        exit;
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        http_response_code(500);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao salvar alergia: ' . $e->getMessage()]);
        exit;
    }
}

/* MÉTODO DELETE: Remover alergia */
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $alergiaId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
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
            echo json_encode(['sucesso' => false, 'mensagem' => 'Registro de alergia não encontrado.']);
            exit;
        }

        $stmtDel = $db->prepare('DELETE FROM alergias_usuario WHERE id = :id');
        $stmtDel->execute([':id' => $alergiaId]);

        // Se não houver mais alergias, verifica se deve atualizar flag
        $stmtCount = $db->prepare('SELECT COUNT(*) FROM alergias_usuario WHERE perfil_saude_id = :pid');
        $stmtCount->execute([':pid' => $perfilSaudeId]);
        if ((int)$stmtCount->fetchColumn() === 0) {
            $stmtUpZero = $db->prepare('UPDATE perfis_saude SET possui_alergias = 0 WHERE id = :pid');
            $stmtUpZero->execute([':pid' => $perfilSaudeId]);
        }

        AuditLogger::registrar(
            $db,
            'EXCLUSAO',
            'alergias_usuario',
            $alergiaId,
            '/meu-perfil',
            $alergiaExistente,
            null,
            $usuarioId,
            $usuarioNome
        );

        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Alergia removida do perfil.'
        ]);
        exit;
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao excluir alergia: ' . $e->getMessage()]);
        exit;
    }
}
