<?php
/**
 * =============================================================================
 * ARQUIVO: AuditLogger.php (Localização: /backend/services/AuditLogger.php)
 * PROJETO: GlicoCare — Sistema de Saúde Integrada e Acolhimento em DM1
 * OBJETIVO: Serviço centralizado e imutável de Auditoria e Logs (RN-AUD-01).
 *           Registra compulsoriamente todas as mutações no banco de dados
 *           (CRIACAO, EDICAO, EXCLUSAO) em estrita conformidade com a LGPD.
 *
 * REGRA DE IMUTABILIDADE ESTREITA (RN-AUD-01):
 *   - A tabela `logs_auditoria` é estritamente APPEND-ONLY (apenas inserção).
 *   - Não existem e são proibidos métodos de UPDATE ou DELETE nesta classe.
 *   - Qualquer tentativa de violar a imutabilidade dispara LogicException.
 * =============================================================================
 */

/* INÍCIO DA CLASSE AUDITLOGGER */
class AuditLogger
{
    /** Nome oficial da tabela de trilha de auditoria */
    private const TABELA_LOGS = 'logs_auditoria';

    /** Ações permitidas pelo enum da tabela logs_auditoria */
    private const ACOES_PERMITIDAS = ['CRIACAO', 'EDICAO', 'EXCLUSAO'];

    /** Fuso horário oficial para conformidade temporal no Brasil */
    private const TIMEZONE_OFICIAL = 'America/Sao_Paulo';

    /**
     * Registra compulsoriamente uma mutação no sistema na tabela logs_auditoria.
     *
     * @param PDO $db Instância ativa de conexão PDO
     * @param string $acao Tipo da operação ('CRIACAO', 'EDICAO' ou 'EXCLUSAO')
     * @param string $tabelaAfetada Entidade modificada no banco (ex: 'especialistas')
     * @param string|int $registroId Identificador único do registro afetado
     * @param string $paginaImpacto Rota ou tela do front-end impactada (ex: '/especialistas')
     * @param array|null $valorAnterior Dados antes da alteração (NULL em CRIACAO)
     * @param array|null $valorNovo Dados após a alteração (NULL em EXCLUSAO)
     * @param int|null $usuarioId ID do usuário autenticado (se aplicável)
     * @param string|null $usuarioNome Nome ou identificação do responsável pela ação
     * @param string|null $ipOrigem Endereço IP do cliente (opcional; auto-detectado se omitido)
     * @return int ID do log gerado no banco de dados
     *
     * @throws InvalidArgumentException Se os parâmetros fornecidos violarem as regras de negócio
     * @throws RuntimeException Se ocorrer erro ao persistir o log no banco
     */
    public static function registrar(
        PDO $db,
        string $acao,
        string $tabelaAfetada,
        string|int $registroId,
        string $paginaImpacto,
        ?array $valorAnterior = null,
        ?array $valorNovo = null,
        ?int $usuarioId = null,
        ?string $usuarioNome = null,
        ?string $ipOrigem = null
    ): int {
        /* INÍCIO DA VALIDAÇÃO DA AÇÃO (RN-AUD-01) */
        $acaoFormatada = strtoupper(trim($acao));
        if (!in_array($acaoFormatada, self::ACOES_PERMITIDAS, true)) {
            throw new InvalidArgumentException(
                "Ação de auditoria inválida: '{$acao}'. As ações válidas são: " . implode(', ', self::ACOES_PERMITIDAS)
            );
        }

        if (empty($tabelaAfetada)) {
            throw new InvalidArgumentException("O parâmetro 'tabelaAfetada' é obrigatório para registrar a auditoria.");
        }

        if ($registroId === '' || $registroId === null) {
            throw new InvalidArgumentException("O parâmetro 'registroId' é obrigatório para identificar o registro modificado.");
        }

        if (empty($paginaImpacto)) {
            throw new InvalidArgumentException("O parâmetro 'paginaImpacto' é obrigatório para rastrear a tela afetada.");
        }

        // Regra de integridade semântica dos valores:
        // CRIACAO -> valorAnterior é forçado a NULL
        // EXCLUSAO -> valorNovo é forçado a NULL
        if ($acaoFormatada === 'CRIACAO') {
            $valorAnterior = null;
        }
        if ($acaoFormatada === 'EXCLUSAO') {
            $valorNovo = null;
        }
        /* FIM DA VALIDAÇÃO DA AÇÃO */

        /* INÍCIO DO PROCESSAMENTO DE DATA, HORA, USUÁRIO E IP */
        date_default_timezone_set(self::TIMEZONE_OFICIAL);
        $dataHoraLocal = date('Y-m-d H:i:s');

        // Identificação padrão caso nome não seja enviado
        if (empty($usuarioNome)) {
            $usuarioNome = $usuarioId ? "Usuário #{$usuarioId}" : 'Sistema / Anônimo';
        }

        // Detecção do IP real do requisitante
        if (empty($ipOrigem)) {
            $ipOrigem = self::obterIpOrigem();
        }

        // Serialização JSON segura com preservação de acentos e barras
        $jsonAnterior = ($valorAnterior !== null)
            ? json_encode($valorAnterior, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            : null;

        $jsonNovo = ($valorNovo !== null)
            ? json_encode($valorNovo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            : null;
        /* FIM DO PROCESSAMENTO DE DADOS */

        /* INÍCIO DA INSERÇÃO IMUTÁVEL VIA PREPARED STATEMENTS (APPEND-ONLY) */
        $sql = "INSERT INTO `" . self::TABELA_LOGS . "` (
                    `usuario_id`,
                    `usuario_nome`,
                    `acao`,
                    `tabela_afetada`,
                    `registro_id`,
                    `pagina_impacto`,
                    `valor_anterior`,
                    `valor_novo`,
                    `ip_origem`,
                    `data_hora_local`
                ) VALUES (
                    :usuario_id,
                    :usuario_nome,
                    :acao,
                    :tabela_afetada,
                    :registro_id,
                    :pagina_impacto,
                    :valor_anterior,
                    :valor_novo,
                    :ip_origem,
                    :data_hora_local
                )";

        try {
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':usuario_id'      => $usuarioId,
                ':usuario_nome'    => mb_substr(trim($usuarioNome), 0, 150, 'UTF-8'),
                ':acao'            => $acaoFormatada,
                ':tabela_afetada'  => mb_substr(trim($tabelaAfetada), 0, 100, 'UTF-8'),
                ':registro_id'     => mb_substr((string)$registroId, 0, 100, 'UTF-8'),
                ':pagina_impacto'  => mb_substr(trim($paginaImpacto), 0, 150, 'UTF-8'),
                ':valor_anterior'  => $jsonAnterior,
                ':valor_novo'      => $jsonNovo,
                ':ip_origem'       => $ipOrigem ? mb_substr($ipOrigem, 0, 45, 'UTF-8') : null,
                ':data_hora_local' => $dataHoraLocal,
            ]);

            return (int)$db->lastInsertId();
        } catch (PDOException $e) {
            throw new RuntimeException("Falha crítica ao gravar log de auditoria imutável: " . $e->getMessage(), 0, $e);
        }
        /* FIM DA INSERÇÃO IMUTÁVEL */
    }

    /**
     * Captura um snapshot completo de um registro antes de sua edição ou exclusão.
     * Utilizado para alimentar compulsoriamente o campo 'valor_anterior'.
     *
     * @param PDO $db Instância ativa de conexão PDO
     * @param string $tabela Nome da tabela alvo
     * @param string|int $id Identificador do registro
     * @param string $colunaId Nome da coluna de chave primária (padrão 'id')
     * @return array|null Array associativo com os dados ou null se inexistente
     */
    public static function capturarSnapshot(
        PDO $db,
        string $tabela,
        string|int $id,
        string $colunaId = 'id'
    ): ?array {
        $tabelaLimpa = preg_replace('/[^a-zA-Z0-9_]/', '', $tabela);
        $colunaLimpa = preg_replace('/[^a-zA-Z0-9_]/', '', $colunaId);

        try {
            $stmt = $db->prepare("SELECT * FROM `{$tabelaLimpa}` WHERE `{$colunaLimpa}` = :id LIMIT 1");
            $stmt->execute([':id' => $id]);
            $registro = $stmt->fetch(PDO::FETCH_ASSOC);

            // Mascara eventuais senhas em hash por conformidade e segurança da LGPD
            if ($registro && isset($registro['senha_hash'])) {
                $registro['senha_hash'] = '***PROTEGIDO_HASH***';
            }

            return $registro ?: null;
        } catch (PDOException $e) {
            return null;
        }
    }

    /**
     * Detecta o endereço IP do requisitante de forma resiliente contra proxies reversos.
     *
     * @return string Endereço IP detectado
     */
    public static function obterIpOrigem(): string
    {
        $headers = [
            'HTTP_CF_CONNECTING_IP', // Suporte Cloudflare
            'HTTP_X_REAL_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_CLIENT_IP',
            'REMOTE_ADDR'
        ];

        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ips = explode(',', $_SERVER[$header]);
                $ip = trim($ips[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }

    /**
     * Consulta somente-leitura da trilha de auditoria para visualização administrativa.
     *
     * @param PDO $db
     * @param array $filtros Filtros opcionais (tabela, acao, usuario_id, data_inicio, data_fim, limit)
     * @return array Lista de registros de auditoria
     */
    public static function listar(PDO $db, array $filtros = []): array
    {
        $sql = "SELECT * FROM `" . self::TABELA_LOGS . "` WHERE 1=1";
        $params = [];

        if (!empty($filtros['tabela_afetada'])) {
            $sql .= " AND tabela_afetada = :tabela";
            $params[':tabela'] = $filtros['tabela_afetada'];
        }

        if (!empty($filtros['acao'])) {
            $sql .= " AND acao = :acao";
            $params[':acao'] = strtoupper($filtros['acao']);
        }

        if (!empty($filtros['registro_id'])) {
            $sql .= " AND registro_id = :registro_id";
            $params[':registro_id'] = (string)$filtros['registro_id'];
        }

        if (!empty($filtros['usuario_id'])) {
            $sql .= " AND usuario_id = :usuario_id";
            $params[':usuario_id'] = (int)$filtros['usuario_id'];
        }

        if (!empty($filtros['data_inicio'])) {
            $sql .= " AND data_hora_local >= :data_inicio";
            $params[':data_inicio'] = $filtros['data_inicio'];
        }

        if (!empty($filtros['data_fim'])) {
            $sql .= " AND data_hora_local <= :data_fim";
            $params[':data_fim'] = $filtros['data_fim'];
        }

        $limite = isset($filtros['limit']) ? (int)$filtros['limit'] : 100;
        $sql .= " ORDER BY id DESC LIMIT {$limite}";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $registros = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decodifica os campos JSON para conveniência da API
        foreach ($registros as &$reg) {
            if ($reg['valor_anterior'] !== null) {
                $reg['valor_anterior'] = json_decode($reg['valor_anterior'], true);
            }
            if ($reg['valor_novo'] !== null) {
                $reg['valor_novo'] = json_decode($reg['valor_novo'], true);
            }
        }

        return $registros;
    }

    /**
     * PROIBIÇÃO ESTREITA DE IMUTABILIDADE:
     * Bloqueia terminantemente qualquer invocação de atualização ou exclusão na tabela logs_auditoria.
     *
     * @throws LogicException Sempre disparada para assegurar imutabilidade absoluta.
     */
    public static function impedirMutacaoDeLog(): void
    {
        throw new LogicException(
            "VIOLAÇÃO DE IMUTABILIDADE: A tabela logs_auditoria é estritamente append-only. " .
            "Operações de UPDATE ou DELETE são terminantemente proibidas por diretriz LGPD e RN-AUD-01."
        );
    }
}
/* FIM DA CLASSE AUDITLOGGER */
