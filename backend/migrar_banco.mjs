import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

function parseEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...vals] = trimmed.split('=');
    env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

async function main() {
  const envPath = path.resolve('backend', '.env');
  const env = parseEnv(envPath);

  const host = env.DB_HOST || 'localhost';
  const port = parseInt(env.DB_PORT || '4000', 10);
  const user = env.DB_USER || 'root';
  const password = env.DB_PASS || '';
  const isCloud = port === 4000 || host.includes('tidbcloud.com');

  console.log(`📡 Conectando ao banco em ${host}:${port}...`);

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    ssl: isCloud ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : false,
    multipleStatements: true,
  });

  console.log('✅ Conexão estabelecida com sucesso!');

  // Garante que o ENUM de logs_auditoria suporte LOGIN e FALHA_LOGIN
  try {
    await connection.query('USE `glicocare_db`;');
    await connection.query(`
      ALTER TABLE \`logs_auditoria\`
      MODIFY COLUMN \`acao\` ENUM('CRIACAO', 'EDICAO', 'EXCLUSAO', 'LOGIN', 'FALHA_LOGIN') NOT NULL;
    `);
    console.log('✅ ENUM acao em logs_auditoria atualizado para suportar LOGIN e FALHA_LOGIN.');
  } catch (err) {
    console.log('ℹ️ Verificação de enum logs_auditoria:', err.message);
  }

  const sqlPath = path.resolve('backend', 'database_tidb.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('⏳ Executando script SQL completo...');
  await connection.query(sql);

  console.log('✅ Script executado com sucesso!');

  await connection.query('USE `glicocare_db`;');
  const [tables] = await connection.query('SHOW TABLES;');
  console.log('\n📋 Tabelas ativas no banco:');
  console.table(tables);

  await connection.end();
}

main().catch((err) => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
