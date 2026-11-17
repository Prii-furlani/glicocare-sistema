<?php
/**
 * =============================================================================
 * ARQUIVO: gerar_guia_pdf.php (Localização: /backend/api/exames/gerar_guia_pdf.php)
 * PROJETO: GlicoCare — Guia Oficial de Solicitação de Exames Laboratoriais
 * OBJETIVO: Apresentação formatada, acolhedora e pronta para impressão/exportação
 *           em PDF do pedido médico de exames, contendo dados do paciente,
 *           especialista responsável, registro profissional (CRM/CRN) e autenticidade.
 * =============================================================================
 */

require_once __DIR__ . '/../../config/database.php';

$solicitacaoId = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($solicitacaoId <= 0) {
    http_response_code(400);
    echo '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Guia não encontrada</title></head><body style="font-family: sans-serif; text-align: center; padding: 50px;"><h2>Guia de exames não informada ou inválida.</h2></body></html>';
    exit;
}

$database = new Database();
$db = $database->getConnection();

$stmt = $db->prepare('
    SELECT se.*,
           ps.nome_completo AS paciente_nome,
           ps.data_nascimento AS paciente_nascimento,
           ps.tipo_diabetes,
           ps.data_diagnostico,
           esp.especialidade,
           esp.tipo_conselho,
           esp.numero_conselho,
           esp.uf_conselho,
           u_esp.nome_completo AS especialista_nome,
           u_esp.email AS especialista_email,
           a.data_hora_consulta,
           a.codigo_transacao_interna
    FROM solicitacoes_exames se
    INNER JOIN perfis_saude ps ON se.perfil_saude_id = ps.id
    INNER JOIN especialistas esp ON se.especialista_id = esp.id
    INNER JOIN usuarios u_esp ON esp.usuario_id = u_esp.id
    LEFT JOIN agendamentos a ON se.agendamento_id = a.id
    WHERE se.id = :id
    LIMIT 1
');
$stmt->execute([':id' => $solicitacaoId]);
$guia = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$guia) {
    http_response_code(404);
    echo '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Guia não encontrada</title></head><body style="font-family: sans-serif; text-align: center; padding: 50px;"><h2>Solicitação de exames não encontrada no sistema.</h2></body></html>';
    exit;
}

$examesLista = [];
if (!empty($guia['lista_exames_solicitados'])) {
    $decoded = json_decode($guia['lista_exames_solicitados'], true);
    if (is_array($decoded)) {
        $examesLista = $decoded;
    }
}

$dtSolicitacao = new DateTime($guia['data_solicitacao'] ?? 'now');
$dtFormatada = $dtSolicitacao->format('d/m/Y');
$horaFormatada = $dtSolicitacao->format('H:i');

$conselhoFormatado = "{$guia['tipo_conselho']} {$guia['numero_conselho']}-{$guia['uf_conselho']}";
$hashAutenticidade = strtoupper(substr(hash('sha256', "GC-EXA-{$guia['id']}-{$guia['paciente_nome']}-{$guia['data_solicitacao']}"), 0, 16));

// Definir cabeçalho HTML para documento visual
header('Content-Type: text/html; charset=UTF-8');
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guia de Exames #<?= htmlspecialchars((string)$guia['id']) ?> — GlicoCare</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --cor-fundo: #EAE4D9;
      --cor-superficie: #FFFFFF;
      --cor-texto: #2E2824;
      --cor-texto-suave: #665C54;
      --cor-primaria: #7C533F;
      --cor-primaria-suave: rgba(124, 83, 63, 0.08);
      --cor-cta: #3B7E48;
      --cor-borda: #E2DBD0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--cor-fundo);
      color: var(--cor-texto);
      line-height: 1.5;
      padding: 24px;
    }

    .top-actions {
      max-width: 820px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 999px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      text-decoration: none;
      border: none;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background-color: var(--cor-cta);
      color: #FFFFFF;
    }

    .btn-primary:hover {
      background-color: #2F6539;
    }

    .btn-secondary {
      background-color: #FFFFFF;
      color: var(--cor-texto);
      border: 1px solid var(--cor-borda);
    }

    .btn-secondary:hover {
      background-color: #F6F3EE;
    }

    .guia-folha {
      max-width: 820px;
      margin: 0 auto;
      background-color: var(--cor-superficie);
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(46, 40, 36, 0.06);
      padding: 44px;
      border: 1px solid var(--cor-borda);
      position: relative;
    }

    .cabecalho {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid var(--cor-borda);
      padding-bottom: 24px;
      margin-bottom: 28px;
    }

    .marca-logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-simbolo {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background-color: var(--cor-primaria);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .marca-texto h1 {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 24px;
      color: var(--cor-primaria);
      letter-spacing: -0.5px;
    }

    .marca-texto p {
      font-size: 12px;
      color: var(--cor-texto-suave);
    }

    .cabecalho-doc {
      text-align: right;
    }

    .badge-guia {
      display: inline-block;
      background-color: var(--cor-primaria-suave);
      color: var(--cor-primaria);
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      padding: 5px 12px;
      border-radius: 999px;
      margin-bottom: 6px;
    }

    .doc-numero {
      font-size: 13px;
      color: var(--cor-texto-suave);
    }

    .secao-bloco {
      background-color: #FAF8F5;
      border: 1px solid #ECE7E0;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 24px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .campo-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .campo-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--cor-texto-suave);
    }

    .campo-valor {
      font-size: 15px;
      font-weight: 600;
      color: var(--cor-texto);
    }

    .titulo-solicitacao {
      margin-bottom: 20px;
    }

    .titulo-solicitacao h2 {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 20px;
      color: var(--cor-primaria);
      margin-bottom: 6px;
    }

    .titulo-solicitacao p {
      font-size: 13px;
      color: var(--cor-texto-suave);
    }

    .lista-exames {
      list-style: none;
      margin-bottom: 30px;
      border: 1px solid var(--cor-borda);
      border-radius: 12px;
      overflow: hidden;
    }

    .item-exame {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 20px;
      background-color: #FFFFFF;
      border-bottom: 1px solid #F0EAE1;
      font-size: 15px;
      font-weight: 500;
    }

    .item-exame:last-child {
      border-bottom: none;
    }

    .item-exame:nth-child(even) {
      background-color: #FCFBF9;
    }

    .box-check {
      width: 18px;
      height: 18px;
      border: 2px solid var(--cor-primaria);
      border-radius: 4px;
      flex-shrink: 0;
    }

    .instrucoes-preparo {
      background-color: #F3F8F4;
      border: 1px solid #D1E5D7;
      border-radius: 12px;
      padding: 18px 22px;
      margin-bottom: 36px;
    }

    .instrucoes-preparo h3 {
      font-size: 13px;
      font-weight: 700;
      color: var(--cor-cta);
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .instrucoes-preparo ul {
      margin-left: 20px;
      font-size: 13px;
      color: #384A3B;
      line-height: 1.6;
    }

    .rodape-assinatura {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 2px solid var(--cor-borda);
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 24px;
    }

    .area-assinatura {
      text-align: center;
      min-width: 280px;
    }

    .linha-assinatura {
      width: 100%;
      border-top: 1px dashed var(--cor-primaria);
      margin-bottom: 8px;
    }

    .nome-medico {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 16px;
      font-weight: 600;
      color: var(--cor-primaria);
    }

    .conselho-medico {
      font-size: 13px;
      color: var(--cor-texto-suave);
    }

    .autenticidade-box {
      font-size: 11px;
      color: var(--cor-texto-suave);
      text-align: right;
    }

    .autenticidade-hash {
      font-family: monospace;
      font-size: 13px;
      font-weight: 700;
      color: var(--cor-texto);
      letter-spacing: 1px;
      margin-top: 3px;
    }

    @media print {
      body {
        background-color: #FFFFFF;
        padding: 0;
      }
      .top-actions {
        display: none !important;
      }
      .guia-folha {
        box-shadow: none;
        border: none;
        padding: 20px;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>

  <div class="top-actions">
    <button class="btn btn-secondary" onclick="window.close(); if(!window.closed) history.back();">
      ← Voltar
    </button>
    <button class="btn btn-primary" onclick="window.print();">
      🖨️ Imprimir / Salvar em PDF
    </button>
  </div>

  <main class="guia-folha">
    <header class="cabecalho">
      <div class="marca-logo">
        <div class="logo-simbolo">🩺</div>
        <div class="marca-texto">
          <h1>GlicoCare</h1>
          <p>Saúde Integrada & Acolhimento em Diabetes Tipo 1</p>
        </div>
      </div>
      <div class="cabecalho-doc">
        <div class="badge-guia">Guia de Solicitação Médica</div>
        <div class="doc-numero">Pedido #<?= htmlspecialchars((string)$guia['id']) ?> • <?= $dtFormatada ?> às <?= $horaFormatada ?></div>
      </div>
    </header>

    <section class="secao-bloco">
      <div class="campo-item">
        <span class="campo-label">Paciente</span>
        <span class="campo-valor"><?= htmlspecialchars($guia['paciente_nome']) ?></span>
      </div>
      <div class="campo-item">
        <span class="campo-label">Diagnóstico</span>
        <span class="campo-valor"><?= htmlspecialchars($guia['tipo_diabetes']) ?></span>
      </div>
      <div class="campo-item">
        <span class="campo-label">Especialista Solicitante</span>
        <span class="campo-valor"><?= htmlspecialchars($guia['especialista_nome']) ?></span>
      </div>
      <div class="campo-item">
        <span class="campo-label">Registro Profissional</span>
        <span class="campo-valor"><?= htmlspecialchars($conselhoFormatado) ?></span>
      </div>
    </section>

    <div class="titulo-solicitacao">
      <h2><?= htmlspecialchars($guia['titulo_pedido']) ?></h2>
      <p>Solicito a realização dos seguintes procedimentos e dosagens laboratoriais para controle e acompanhamento clínico:</p>
    </div>

    <ul class="lista-exames">
      <?php if (!empty($examesLista)): ?>
        <?php foreach ($examesLista as $exame): ?>
          <li class="item-exame">
            <div class="box-check"></div>
            <span><?= htmlspecialchars((string)$exame) ?></span>
          </li>
        <?php endforeach; ?>
      <?php else: ?>
        <li class="item-exame">
          <span>Hemoglobina Glicada (HbA1c) e Perfil Metabólico Geral</span>
        </li>
      <?php endif; ?>
    </ul>

    <div class="instrucoes-preparo">
      <h3>🐾 Orientações para a Família e Coleta com Acolhimento</h3>
      <ul>
        <li>Em caso de crianças pequenas, informe o laboratório para preferência de punção rápida com equipe pediátrica especializada.</li>
        <li>Jejum padrão de 8 horas para glicemia em jejum e perfil lipídico. Não suspender água.</li>
        <li>Em caso de sintomas de hipoglicemia antes ou durante o trajeto, trate imediatamente com carboidratos rápidos e informe a equipe de coleta.</li>
        <li>Após receber o laudo digital, faça o upload direto na aba <strong>"Meus Exames & Guias"</strong> do seu espaço seguro no GlicoCare.</li>
      </ul>
    </div>

    <footer class="rodape-assinatura">
      <div class="area-assinatura">
        <div class="linha-assinatura"></div>
        <div class="nome-medico"><?= htmlspecialchars($guia['especialista_nome']) ?></div>
        <div class="conselho-medico"><?= htmlspecialchars($guia['especialidade']) ?> • <?= htmlspecialchars($conselhoFormatado) ?></div>
      </div>
      <div class="autenticidade-box">
        <div>Documento assinado digitalmente via plataforma GlicoCare</div>
        <div>Código de Autenticidade:</div>
        <div class="autenticidade-hash"><?= htmlspecialchars($hashAutenticidade) ?></div>
      </div>
    </footer>
  </main>

</body>
</html>
