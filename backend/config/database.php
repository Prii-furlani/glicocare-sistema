<?php
/**
 * GlicoCare — Configuração de Conexão PDO
 * Compatível com:
 *  - TiDB Cloud (Serverless / Starter com SSL na porta 4000)
 *  - MySQL local (XAMPP / Laragon / Docker na porta 3306)
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

class Database {
    private string $host;
    private string $port;
    private string $db_name;
    private string $username;
    private string $password;
    private string $charset = 'utf8mb4';
    private bool $use_ssl = false;
    private ?PDO $conn = null;

    public function __construct() {
        $this->carregarEnv(__DIR__ . '/../.env');

        $this->host     = getenv('DB_HOST') ?: 'localhost';
        $this->port     = getenv('DB_PORT') ?: '3306';
        $this->db_name  = getenv('DB_NAME') ?: 'glicocare_db';
        $this->username = getenv('DB_USER') ?: 'root';
        $this->password = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';

        // Habilita SSL automaticamente se for TiDB Cloud (porta 4000 ou host contendo tidbcloud)
        $sslEnv = getenv('DB_SSL');
        if ($sslEnv !== false) {
            $this->use_ssl = filter_var($sslEnv, FILTER_VALIDATE_BOOLEAN);
        } else {
            $this->use_ssl = ($this->port === '4000' || strpos($this->host, 'tidbcloud.com') !== false);
        }
    }

    /**
     * Carrega variáveis de ambiente a partir do arquivo .env caso exista
     */
    private function carregarEnv(string $caminhoEnv): void {
        if (!file_exists($caminhoEnv)) {
            return;
        }

        $linhas = file($caminhoEnv, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($linhas as $linha) {
            $linha = trim($linha);
            if ($linha === '' || str_starts_with($linha, '#')) {
                continue;
            }

            if (str_contains($linha, '=')) {
                [$chave, $valor] = explode('=', $linha, 2);
                $chave = trim($chave);
                $valor = trim(trim($valor), '"\'');
                if (!array_key_exists($chave, $_ENV)) {
                    putenv("{$chave}={$valor}");
                    $_ENV[$chave] = $valor;
                }
            }
        }
    }

    public function getConnection(): PDO {
        if ($this->conn !== null) {
            return $this->conn;
        }

        $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db_name};charset={$this->charset}";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        // Opções SSL exigidas pelo TiDB Cloud
        if ($this->use_ssl) {
            if (defined('PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT')) {
                $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
            }
            if (defined('PDO::MYSQL_ATTR_SSL_CA')) {
                // Se um arquivo de certificado CA for especificado no .env
                $caPath = getenv('DB_SSL_CA');
                if ($caPath && file_exists($caPath)) {
                    $options[PDO::MYSQL_ATTR_SSL_CA] = $caPath;
                }
            }
        }

        try {
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            return $this->conn;
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'Erro ao conectar ao banco de dados GlicoCare.',
                'detalhe' => $e->getMessage()
            ]);
            exit;
        }
    }
}
