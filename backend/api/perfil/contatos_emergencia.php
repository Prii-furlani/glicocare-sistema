<?php
/**
 * =============================================================================
 * ARQUIVO: contatos_emergencia.php (Localização: /backend/api/perfil/contatos_emergencia.php)
 * PROJETO: GlicoCare — Apoio em Diabetes & Cuidado Integrado
 * OBJETIVO: Gerenciar múltiplos contatos de emergência (mínimo 1 obrigatório)
 *           vinculados ao perfil de saúde do paciente ou dependente infantil.
 * REGRAS DE NEGÓCIO:
 *   - RN-EMERG-01: Pelo menos 1 contato de emergência é estritamente obrigatório.
 *   - RN-AUD-01: Registro compulsório de auditoria imutável via AuditLogger (fuso America/Sao_Paulo).
 * =============================================================================
 */

/* INÍCIO DO ENDPOINT CONTATOS_EMERGENCIA */

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

// 1. Autenticação obrigatória (RN-ACC-01)
$usuarioLogado = AuthMiddleware::autenticar($db, '/meu-perfil');
$usuarioId = (int)$usuarioLogado['id'];
$usuarioNome = $usuarioLogado['nome_completo'];
$usuarioTipo = $usuarioLogado['tipo_usuario'] ?? 'paciente';

// 2. Leitura de payload para POST ou DELETE
$input = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $rawInput = file_get_contents('php://input');
    if (!empty($rawInput)) {
        $input = json_decode($rawInput, true) ?? [];
    }
}

// 3. Resolução do perfil_saude_id ativo
$perfilSaudeId = isset($_GET['perfil_saude_id']) ? (int)$_GET['perfil_saude_id'] : 0;
if ($perfilSaudeId <= 0 && isset($input['perfil_saude_id'])) {
    $perfilSaudeId = (int)$input['perfil_saude_id'];
}

if ($perfilSaudeId <= 0) {
    // Busca perfil próprio do usuário logado
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
        'mensagem' => 'Perfil de saúde não localizado para gerenciar contatos de emergência.'
    ]);
    exit;
}

// 4. Verificação de autorização (titular, cuidador legal ou admin)
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
        'mensagem' => 'Acesso não autorizado aos contatos de emergência deste paciente/dependente.'
    ]);
    exit;
}

// =============================================================================
// FUNÇÕES AUXILIARES: Normalização e Formatação de Telefones 1:N
// =============================================================================

/**
 * Normaliza e estrutura a lista de telefones de um contato
 * Formato retornado: [ ['numero' => '(11) 98888-7777', 'tipo' => 'Celular'], ... ]
 */
function normalizarTelefonesContato($telefonesRaw, $telefoneLegado = '') {
    $telefones = [];
    if (!empty($telefonesRaw)) {
        if (is_string($telefonesRaw)) {
            $dec = json_decode($telefonesRaw, true);
            if (is_array($dec)) {
                $telefones = $dec;
            }
        } elseif (is_array($telefonesRaw)) {
            $telefones = $telefonesRaw;
        }
    }

    $resultado = [];
    foreach ($telefones as $item) {
        if (is_array($item)) {
            $num = trim($item['numero'] ?? $item['telefone'] ?? '');
            $tipo = trim($item['tipo'] ?? 'Celular');
            if (!empty($num)) {
                $resultado[] = [
                    'numero' => $num,
                    'tipo' => !empty($tipo) ? $tipo : 'Celular'
                ];
            }
        } elseif (is_string($item) && !empty(trim($item))) {
            $resultado[] = [
                'numero' => trim($item),
                'tipo' => 'Celular'
            ];
        }
    }

    // Fallback retrocompatível para telefone principal se lista estiver vazia
    if (empty($resultado) && !empty(trim($telefoneLegado))) {
        $resultado[] = [
            'numero' => trim($telefoneLegado),
            'tipo' => 'Principal'
        ];
    }

    return $resultado;
}

/**
 * Aplica formatação de telefones 1:N para cada item da lista de contatos
 */
function formatarListaContatos($lista) {
    return array_map(function ($row) {
        $row['telefones'] = normalizarTelefonesContato($row['telefones'] ?? null, $row['telefone'] ?? '');
        return $row;
    }, $lista);
}

// =============================================================================
// MÉTODO GET: Listar contatos de emergência ordenados por prioridade
// =============================================================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $db->prepare('
            SELECT id, perfil_saude_id, nome_contato, relacao, telefone, telefones, ordem, criado_em
            FROM contatos_emergencia
            WHERE perfil_saude_id = :pid
            ORDER BY ordem ASC, id ASC
        ');
        $stmt->execute([':pid' => $perfilSaudeId]);
        $contatos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $contatosFormatados = formatarListaContatos($contatos);

        http_response_code(200);
        echo json_encode([
            'sucesso' => true,
            'total' => count($contatosFormatados),
            'contatos' => $contatosFormatados,
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Erro ao listar contatos de emergência: ' . $e->getMessage()
        ]);
        exit;
    }
}

// =============================================================================
// MÉTODO POST: Cadastrar novo contato de emergência (1:N telefones)
// =============================================================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nomeContato = trim($input['nome_contato'] ?? '');
    $relacao = trim($input['relacao'] ?? 'Familiar');
    $ordem = isset($input['ordem']) ? (int)$input['ordem'] : 0;

    if (empty($nomeContato)) {
        http_response_code(400);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'O nome do contato de emergência é obrigatório.'
        ]);
        exit;
    }

    // Processa telefones: aceita array "telefones" ou string "telefone"
    $telefonesRaw = $input['telefones'] ?? null;
    $telefoneLegado = trim($input['telefone'] ?? '');
    $telefonesNormalizados = normalizarTelefonesContato($telefonesRaw, $telefoneLegado);

    // Validação estrita: pelo menos 1 telefone válido com DDD (mínimo 10 dígitos)
    $telefonesValidados = [];
    foreach ($telefonesNormalizados as $telItem) {
        $digitos = preg_replace('/\D/', '', $telItem['numero']);
        if (strlen($digitos) >= 10) {
            $telefonesValidados[] = [
                'numero' => $telItem['numero'],
                'tipo' => $telItem['tipo'] ?? 'Celular',
            ];
        }
    }

    if (empty($telefonesValidados)) {
        http_response_code(400);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'É obrigatório cadastrar pelo menos 1 telefone com DDD (mínimo 10 dígitos) para o contato de emergência.'
        ]);
        exit;
    }

    $telefonePrincipal = $telefonesValidados[0]['numero'];
    $telefonesJson = json_encode($telefonesValidados, JSON_UNESCAPED_UNICODE);

    try {
        // Se a ordem não foi explicitamente fornecida, calcula MAX(ordem) + 1
        if ($ordem <= 0) {
            $stmtOrdem = $db->prepare('SELECT COALESCE(MAX(ordem), 0) + 1 FROM contatos_emergencia WHERE perfil_saude_id = :pid');
            $stmtOrdem->execute([':pid' => $perfilSaudeId]);
            $ordem = (int)$stmtOrdem->fetchColumn();
        }

        $agora = new DateTime('now', new DateTimeZone('America/Sao_Paulo'));
        $dataHoraCriacao = $agora->format('Y-m-d H:i:s');

        $stmtInsert = $db->prepare('
            INSERT INTO contatos_emergencia (perfil_saude_id, nome_contato, relacao, telefone, telefones, ordem, criado_em)
            VALUES (:pid, :nome, :relacao, :tel, :telefones, :ordem, :criado_em)
        ');
        $stmtInsert->execute([
            ':pid' => $perfilSaudeId,
            ':nome' => $nomeContato,
            ':relacao' => $relacao,
            ':tel' => $telefonePrincipal,
            ':telefones' => $telefonesJson,
            ':ordem' => $ordem,
            ':criado_em' => $dataHoraCriacao,
        ]);

        $novoId = (int)$db->lastInsertId();

        // Atualiza contato_emergencia_telefone do perfil caso seja o 1º contato
        if ($ordem === 1) {
            $stmtUpdPerfil = $db->prepare('UPDATE perfis_saude SET contato_emergencia_telefone = :tel WHERE id = :pid');
            $stmtUpdPerfil->execute([':tel' => $telefonePrincipal, ':pid' => $perfilSaudeId]);
        }

        // Auditoria imutável (RN-AUD-01)
        AuditLogger::registrar(
            $db,
            'CRIACAO',
            'contatos_emergencia',
            (string)$novoId,
            '/meu-perfil/contatos-emergencia',
            null,
            [
                'nome_contato' => $nomeContato,
                'relacao' => $relacao,
                'telefone' => $telefonePrincipal,
                'telefones' => $telefonesValidados,
                'ordem' => $ordem,
            ],
            $usuarioId,
            $usuarioNome
        );

        // Retorna a lista atualizada
        $stmtAtualizados = $db->prepare('
            SELECT id, perfil_saude_id, nome_contato, relacao, telefone, telefones, ordem, criado_em
            FROM contatos_emergencia
            WHERE perfil_saude_id = :pid
            ORDER BY ordem ASC, id ASC
        ');
        $stmtAtualizados->execute([':pid' => $perfilSaudeId]);
        $contatosAtualizados = formatarListaContatos($stmtAtualizados->fetchAll(PDO::FETCH_ASSOC));

        http_response_code(201);
        echo json_encode([
            'sucesso' => true,
            'mensagem' => "Contato de emergência \"{$nomeContato}\" adicionado com sucesso!",
            'id' => $novoId,
            'contatos' => $contatosAtualizados,
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Erro ao cadastrar contato de emergência: ' . $e->getMessage()
        ]);
        exit;
    }
}

// =============================================================================
// MÉTODO DELETE: Remover contato (COM BLOQUEIO SE FOR O ÚLTIMO RESTANTE)
// =============================================================================
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $contatoId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($contatoId <= 0 && isset($input['id'])) {
        $contatoId = (int)$input['id'];
    }

    if ($contatoId <= 0) {
        http_response_code(400);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'ID do contato de emergência não informado.'
        ]);
        exit;
    }

    try {
        // Valida se o contato existe e pertence ao perfil autorizado
        $stmtCheck = $db->prepare('
            SELECT id, nome_contato, telefone, telefones, ordem
            FROM contatos_emergencia
            WHERE id = :cid AND perfil_saude_id = :pid
            LIMIT 1
        ');
        $stmtCheck->execute([':cid' => $contatoId, ':pid' => $perfilSaudeId]);
        $contatoExistente = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if (!$contatoExistente) {
            http_response_code(404);
            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'Contato de emergência não encontrado para este perfil.'
            ]);
            exit;
        }

        // REGRA DE NEGÓCIO MANDATÓRIA (RN-EMERG-01): MÍNIMO 1 CONTATO OBRIGATÓRIO
        $stmtCount = $db->prepare('SELECT COUNT(*) FROM contatos_emergencia WHERE perfil_saude_id = :pid');
        $stmtCount->execute([':pid' => $perfilSaudeId]);
        $totalRestante = (int)$stmtCount->fetchColumn();

        if ($totalRestante <= 1) {
            http_response_code(400);
            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'É obrigatório manter pelo menos 1 contato de emergência cadastrado para a segurança do paciente.',
                'bloqueado' => true,
            ]);
            exit;
        }

        // Exclui o contato
        $stmtDel = $db->prepare('DELETE FROM contatos_emergencia WHERE id = :cid');
        $stmtDel->execute([':cid' => $contatoId]);

        // Auditoria imutável (RN-AUD-01)
        AuditLogger::registrar(
            $db,
            'EXCLUSAO',
            'contatos_emergencia',
            (string)$contatoId,
            '/meu-perfil/contatos-emergencia',
            $contatoExistente,
            null,
            $usuarioId,
            $usuarioNome
        );

        // Retorna a lista atualizada
        $stmtAtualizados = $db->prepare('
            SELECT id, perfil_saude_id, nome_contato, relacao, telefone, telefones, ordem, criado_em
            FROM contatos_emergencia
            WHERE perfil_saude_id = :pid
            ORDER BY ordem ASC, id ASC
        ');
        $stmtAtualizados->execute([':pid' => $perfilSaudeId]);
        $contatosAtualizados = formatarListaContatos($stmtAtualizados->fetchAll(PDO::FETCH_ASSOC));

        // Atualiza telefone principal do perfil se necessário
        if (!empty($contatosAtualizados)) {
            $stmtUpdPerfil = $db->prepare('UPDATE perfis_saude SET contato_emergencia_telefone = :tel WHERE id = :pid');
            $stmtUpdPerfil->execute([':tel' => $contatosAtualizados[0]['telefone'], ':pid' => $perfilSaudeId]);
        }

        http_response_code(200);
        echo json_encode([
            'sucesso' => true,
            'mensagem' => "Contato de emergência \"{$contatoExistente['nome_contato']}\" removido com sucesso.",
            'contatos' => $contatosAtualizados,
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Erro ao remover contato de emergência: ' . $e->getMessage()
        ]);
        exit;
    }
}

http_response_code(405);
echo json_encode(['sucesso' => false, 'mensagem' => 'Método não suportado.']);
exit;

/* FIM DO ENDPOINT CONTATOS_EMERGENCIA */
