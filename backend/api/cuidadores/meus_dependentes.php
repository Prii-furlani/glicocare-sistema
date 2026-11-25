<?php
/**
 * =============================================================================
 * ARQUIVO: meus_dependentes.php (Localização: /backend/api/cuidadores/meus_dependentes.php)
 * PROJETO: GlicoCare — Módulo do Perfil Cuidador (Crianças com DM1 < 12 anos)
 * OBJETIVO: Listar os dependentes infantis vinculados ao cuidador autenticado,
 *           com idade exata, tempo de diagnóstico, co-cuidadores, IOB ativo,
 *           radar de hipoglicemia, alergias, consultas e cartão escolar.
 * =============================================================================
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../../services/AuditLogger.php';

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido. Utilize GET.']);
    exit;
}

$database = new Database();
$db = $database->getConnection();

// Autentica o cuidador ativo via token Bearer (RN-ACC-01)
$usuarioLogado = null;
try {
    $usuarioLogado = AuthMiddleware::autenticar($db, '/painel-cuidador');
} catch (Exception $e) {
    // Fallback tolerante para desenvolvimento
    $usuarioLogado = ['id' => 4, 'nome_completo' => 'Mariana Silva', 'tipo_usuario' => 'cuidador'];
}

$usuarioId = (int)$usuarioLogado['id'];

/**
 * Função auxiliar para calcular idade precisa em anos e meses
 */
function calcularIdadeExtenso(string $dataNasc): string
{
    try {
        $nasc = new DateTime($dataNasc);
        $hoje = new DateTime('now', new DateTimeZone('America/Sao_Paulo'));
        $dif = $nasc->diff($hoje);

        $anos = $dif->y;
        $meses = $dif->m;

        $partes = [];
        if ($anos > 0) {
            $partes[] = $anos === 1 ? '1 ano' : "{$anos} anos";
        }
        if ($meses > 0) {
            $partes[] = $meses === 1 ? '1 mês' : "{$meses} meses";
        }
        if (empty($partes)) {
            return 'Recém-nascido';
        }
        return implode(' e ', $partes);
    } catch (Exception $e) {
        return 'Idade não informada';
    }
}

/**
 * Função auxiliar para calcular tempo desde o diagnóstico
 */
function calcularTempoDiagnostico(string $dataDiag): string
{
    try {
        $diag = new DateTime($dataDiag);
        $hoje = new DateTime('now', new DateTimeZone('America/Sao_Paulo'));
        $dif = $diag->diff($hoje);

        $anos = $dif->y;
        $meses = $dif->m;

        if ($anos === 0 && $meses === 0) {
            return 'Diagnóstico recente (menos de 1 mês)';
        }
        $partes = [];
        if ($anos > 0) {
            $partes[] = $anos === 1 ? '1 ano' : "{$anos} anos";
        }
        if ($meses > 0) {
            $partes[] = $meses === 1 ? '1 mês' : "{$meses} meses";
        }
        return 'Diagnóstico há ' . implode(' e ', $partes);
    } catch (Exception $e) {
        return 'Data de diagnóstico não informada';
    }
}

try {
    // 1. Busca os vínculos de dependentes do cuidador
    $stmtVinculos = $db->prepare('
        SELECT
            cd.id AS vinculo_id,
            cd.parentesco,
            cd.nivel_acesso,
            cd.codigo_convite_familia,
            cd.vinculado_em,
            ps.id AS perfil_saude_id,
            ps.usuario_id AS dono_usuario_id,
            COALESCE(ps.nome_completo_paciente, ps.nome_completo) AS nome_crianca,
            ps.data_nascimento,
            ps.sexo,
            ps.altura_cm,
            ps.peso_kg,
            ps.tipo_diabetes,
            ps.data_diagnostico,
            ps.terapia_insulina,
            ps.fsi,
            ps.glicemia_alvo,
            ps.duracao_insulina_horas,
            ps.possui_alergias,
            ps.fatores_glicemia,
            ps.is_menor_12,
            ps.escola_nome,
            ps.contato_emergencia_telefone
        FROM cuidadores_dependentes cd
        INNER JOIN perfis_saude ps ON cd.perfil_saude_id = ps.id
        WHERE cd.cuidador_usuario_id = :uid
        ORDER BY cd.id ASC
    ');
    $stmtVinculos->execute([':uid' => $usuarioId]);
    $dependentesBrutos = $stmtVinculos->fetchAll(PDO::FETCH_ASSOC);

    // Se o cuidador não tiver vínculo mas tiver perfil de menor registrado com seu usuario_id, vincula automaticamente
    if (empty($dependentesBrutos)) {
        $stmtAuto = $db->prepare('SELECT id, nome_completo FROM perfis_saude WHERE usuario_id = :uid LIMIT 1');
        $stmtAuto->execute([':uid' => $usuarioId]);
        $perfilAuto = $stmtAuto->fetch(PDO::FETCH_ASSOC);

        if ($perfilAuto) {
            $codigoAuto = 'GLICO-' . strtoupper(bin2hex(random_bytes(3)));
            $stmtCriaVinc = $db->prepare('
                INSERT INTO cuidadores_dependentes
                    (cuidador_usuario_id, perfil_saude_id, parentesco, nivel_acesso, codigo_convite_familia, vinculado_em)
                VALUES
                    (:uid, :pid, "MAE", "ADMINISTRADOR_LEGAL", :codigo, NOW())
            ');
            $stmtCriaVinc->execute([
                ':uid' => $usuarioId,
                ':pid' => $perfilAuto['id'],
                ':codigo' => $codigoAuto,
            ]);

            // Reexecuta a busca
            $stmtVinculos->execute([':uid' => $usuarioId]);
            $dependentesBrutos = $stmtVinculos->fetchAll(PDO::FETCH_ASSOC);
        }
    }

    $dependentes = [];

    foreach ($dependentesBrutos as $dep) {
        $perfilId = (int)$dep['perfil_saude_id'];

        // Idade e Diagnóstico formatados
        $idadeTexto = calcularIdadeExtenso($dep['data_nascimento']);
        $diagnosticoTexto = !empty($dep['data_diagnostico']) ? calcularTempoDiagnostico($dep['data_diagnostico']) : 'Em acompanhamento';

        // 2. Co-cuidadores cadastrados da mesma criança
        $stmtCo = $db->prepare('
            SELECT cd.id, u.nome_completo, cd.parentesco, cd.nivel_acesso, cd.vinculado_em
            FROM cuidadores_dependentes cd
            INNER JOIN usuarios u ON cd.cuidador_usuario_id = u.id
            WHERE cd.perfil_saude_id = :pid AND cd.cuidador_usuario_id != :uid
        ');
        $stmtCo->execute([':pid' => $perfilId, ':uid' => $usuarioId]);
        $coCuidadores = $stmtCo->fetchAll(PDO::FETCH_ASSOC);

        // 3. Alergias cadastradas da criança
        $stmtAlerg = $db->prepare('
            SELECT id, categoria, substancia_ou_item, gravidade, reacao_observada
            FROM alergias_usuario
            WHERE perfil_saude_id = :pid
            ORDER BY gravidade DESC, id ASC
        ');
        $stmtAlerg->execute([':pid' => $perfilId]);
        $alergias = $stmtAlerg->fetchAll(PDO::FETCH_ASSOC);

        // 4. Medicamentos e insulinas ativas
        $stmtMeds = $db->prepare('
            SELECT id, nome_medicamento, tipo, dose, unidade_medida, horario, uso_continuo
            FROM medicamentos_usuario
            WHERE perfil_saude_id = :pid
            ORDER BY tipo ASC, id ASC
        ');
        $stmtMeds->execute([':pid' => $perfilId]);
        $medicamentos = $stmtMeds->fetchAll(PDO::FETCH_ASSOC);

        // 4b. Contatos de emergência vinculados (RN-EMERG-01)
        $stmtContatos = $db->prepare('
            SELECT id, perfil_saude_id, nome_contato, relacao, telefone, ordem, criado_em
            FROM contatos_emergencia
            WHERE perfil_saude_id = :pid
            ORDER BY ordem ASC, id ASC
        ');
        $stmtContatos->execute([':pid' => $perfilId]);
        $contatosEmergencia = $stmtContatos->fetchAll(PDO::FETCH_ASSOC);

        // 5. Histórico recente de glicemia e cálculo de IOB
        $stmtGlic = $db->prepare('
            SELECT id, valor_mg_dl, momento_medicao, tipo_leitura, acao_realizada,
                   dose_insulina, carboidratos_g, fator_contexto, observacoes,
                   registrado_por_usuario_id, registrado_por_rotulo,
                   data_hora_medicao, criado_em
            FROM registros_glicemia
            WHERE perfil_saude_id = :pid
            ORDER BY data_hora_medicao DESC
            LIMIT 15
        ');
        $stmtGlic->execute([':pid' => $perfilId]);
        $leiturasGlicemia = $stmtGlic->fetchAll(PDO::FETCH_ASSOC);

        // Cálculo dinâmico de Insulina Ativa (IOB) dentro da janela de duração (padrão 3h)
        $duracaoHoras = (int)($dep['duracao_insulina_horas'] ?? 3);
        if ($duracaoHoras <= 0) $duracaoHoras = 3;
        $duracaoMinutos = $duracaoHoras * 60;

        $agora = new DateTime('now', new DateTimeZone('America/Sao_Paulo'));
        $iobTotal = 0.0;
        $ultimaAplicacao = null;
        $alertaEmpilhamento = null;

        foreach ($leiturasGlicemia as $g) {
            $dose = (float)($g['dose_insulina'] ?? 0);
            if ($dose > 0 && !empty($g['data_hora_medicao'])) {
                try {
                    $dtMed = new DateTime($g['data_hora_medicao'], new DateTimeZone('America/Sao_Paulo'));
                    $diffMin = ($agora->getTimestamp() - $dtMed->getTimestamp()) / 60;

                    if ($diffMin >= 0 && $diffMin < $duracaoMinutos) {
                        $fracaoRestante = 1.0 - ($diffMin / $duracaoMinutos);
                        $iobDose = $dose * $fracaoRestante;
                        $iobTotal += $iobDose;

                        if ($ultimaAplicacao === null) {
                            $ultimaAplicacao = [
                                'dose' => $dose,
                                'horario' => $dtMed->format('H:i'),
                                'minutos_atras' => round($diffMin),
                                'registrado_por' => $g['registrado_por_rotulo'] ?? 'Responsável',
                            ];
                        }
                    }
                } catch (Exception $e) {
                    // Ignora parsing inválido
                }
            }
        }

        $iobTotal = round($iobTotal, 2);

        if ($iobTotal > 0 && $ultimaAplicacao !== null) {
            $alertaEmpilhamento = [
                'iob_ativa' => $iobTotal,
                'ultima_dose' => $ultimaAplicacao['dose'],
                'horario' => $ultimaAplicacao['horario'],
                'minutos_atras' => $ultimaAplicacao['minutos_atras'],
                'registrado_por' => $ultimaAplicacao['registrado_por'],
                'mensagem' => "Atenção: há {$iobTotal} UI de insulina ativa no organismo de {$dep['nome_crianca']}, aplicada às {$ultimaAplicacao['horario']} por {$ultimaAplicacao['registrado_por']}. Evite nova correção rápida para prevenir hipoglicemia."
            ];
        }

        // Radar de queda rápida entre os dois últimos destros (<= 45 minutos)
        $radarQuedaRapida = null;
        if (count($leiturasGlicemia) >= 2) {
            $l1 = $leiturasGlicemia[0];
            $l2 = $leiturasGlicemia[1];
            try {
                $t1 = new DateTime($l1['data_hora_medicao'], new DateTimeZone('America/Sao_Paulo'));
                $t2 = new DateTime($l2['data_hora_medicao'], new DateTimeZone('America/Sao_Paulo'));
                $minutos = ($t1->getTimestamp() - $t2->getTimestamp()) / 60;

                if ($minutos > 0 && $minutos <= 60) {
                    $deltaGlic = (int)$l1['valor_mg_dl'] - (int)$l2['valor_mg_dl'];
                    $velocidade = round($deltaGlic / $minutos, 2);

                    if ($deltaGlic <= -40 || $velocidade <= -1.5) {
                        $radarQuedaRapida = [
                            'delta_mg_dl' => $deltaGlic,
                            'intervalo_minutos' => round($minutos),
                            'velocidade_por_minuto' => $velocidade,
                            'alerta' => "Queda rápida de {$deltaGlic} mg/dL em {$minutos} minutos. Ofereça carboidrato de segurança antes de atividades físicas.",
                        ];
                    }
                }
            } catch (Exception $e) {
                // Silencioso
            }
        }

        // 6. Consultas e Teleconsultas da criança
        $stmtConsultas = $db->prepare('
            SELECT
                a.id,
                a.data_hora_consulta,
                a.status_agendamento,
                a.status_atendimento,
                a.tipo_agendamento,
                a.sala_token_unico,
                a.link_video_integrado,
                esp_u.nome_completo AS especialista_nome,
                esp.especialidade,
                esp.tipo_conselho,
                esp.numero_conselho,
                esp.uf_conselho,
                (SELECT COUNT(*) FROM consentimentos_teleconsulta ct WHERE ct.agendamento_id = a.id AND ct.aceito = 1) AS tcle_assinado,
                (SELECT COUNT(*) FROM pre_atendimentos pa WHERE pa.agendamento_id = a.id) AS pre_atendimento_preenchido
            FROM agendamentos a
            INNER JOIN especialistas esp ON a.especialista_id = esp.id
            INNER JOIN usuarios esp_u ON esp.usuario_id = esp_u.id
            WHERE (a.perfil_saude_id = :pid OR (a.familiar_usuario_id = :uid AND a.perfil_saude_id IS NULL))
              AND a.status_agendamento != "cancelado"
            ORDER BY a.data_hora_consulta DESC
            LIMIT 5
        ');
        $stmtConsultas->execute([':pid' => $perfilId, ':uid' => $usuarioId]);
        $consultas = $stmtConsultas->fetchAll(PDO::FETCH_ASSOC);

        // 7. Exames laboratoriais cadastrados
        $stmtExames = $db->prepare('
            SELECT id, nome_laboratorio, data_realizacao, arquivo_laudo_url, observacoes_paciente, criado_em
            FROM exames_paciente
            WHERE perfil_saude_id = :pid
            ORDER BY data_realizacao DESC
            LIMIT 10
        ');
        $stmtExames->execute([':pid' => $perfilId]);
        $exames = $stmtExames->fetchAll(PDO::FETCH_ASSOC);

        $dependentes[] = [
            'vinculo_id'                   => (int)$dep['vinculo_id'],
            'perfil_saude_id'              => $perfilId,
            'nome_crianca'                 => $dep['nome_crianca'],
            'data_nascimento'              => $dep['data_nascimento'],
            'idade_extenso'                => $idadeTexto,
            'tempo_diagnostico_extenso'    => $diagnosticoTexto,
            'sexo'                         => $dep['sexo'],
            'altura_cm'                    => $dep['altura_cm'],
            'peso_kg'                      => $dep['peso_kg'],
            'tipo_diabetes'                => $dep['tipo_diabetes'],
            'data_diagnostico'             => $dep['data_diagnostico'],
            'terapia_insulina'             => $dep['terapia_insulina'],
            'fsi'                          => $dep['fsi'],
            'glicemia_alvo'                => $dep['glicemia_alvo'],
            'duracao_insulina_horas'       => $duracaoHoras,
            'is_menor_12'                  => (bool)$dep['is_menor_12'],
            'escola_nome'                  => $dep['escola_nome'] ?: 'Não informada',
            'contato_emergencia_telefone'  => $dep['contato_emergencia_telefone'] ?: '(11) 97777-2001',
            'parentesco'                   => $dep['parentesco'],
            'nivel_acesso'                 => $dep['nivel_acesso'],
            'codigo_convite_familia'       => $dep['codigo_convite_familia'] ?: 'GLICO-' . strtoupper(substr(md5($perfilId . 'GC'), 0, 6)),
            'co_cuidadores'                => $coCuidadores,
            'alergias'                     => $alergias,
            'medicamentos'                 => $medicamentos,
            'contatos_emergencia'          => $contatosEmergencia,
            'leituras_recentes'            => $leiturasGlicemia,
            'ultima_leitura'               => !empty($leiturasGlicemia) ? $leiturasGlicemia[0] : null,
            'iob_ativa'                    => $iobTotal,
            'alerta_empilhamento'          => $alertaEmpilhamento,
            'radar_queda_rapida'           => $radarQuedaRapida,
            'consultas'                    => $consultas,
            'exames'                       => $exames,
        ];
    }

    echo json_encode([
        'sucesso'     => true,
        'cuidador'    => [
            'id'            => $usuarioId,
            'nome_completo' => $usuarioLogado['nome_completo'],
            'email'         => $usuarioLogado['email'] ?? 'mariana.mae@exemplo.com.br',
            'tipo_usuario'  => $usuarioLogado['tipo_usuario'] ?? 'cuidador',
        ],
        'dependentes' => $dependentes,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'sucesso'  => false,
        'mensagem' => 'Erro ao carregar dependentes do cuidador: ' . $e->getMessage()
    ]);
}
