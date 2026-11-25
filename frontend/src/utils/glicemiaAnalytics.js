/* ==========================================================================
   ARQUIVO: glicemiaAnalytics.js (Localização: /frontend/src/utils/glicemiaAnalytics.js)
   OBJETIVO:
     Motor de cálculo clínico-educativo e preditivo da plataforma GlicoCare:
     1. Insulina Ativa Estimada (IOB — Insulin On Board) com decaimento fisiológico
        individual por dose/bolus (multi-bolus) e tempo máximo de expiração;
     2. Projeção pelo Fator de Sensibilidade Insulínica (FSI) e detecção de sobreposição;
     3. Velocidade de Variação e Seta de Tendência entre pontas de dedo (destros <= 45 min).
   AVISO ÉTICO:
     Cálculos estritamente educativos baseados em parâmetros do médico assistente.
     A GlicoCare não altera nem prescreve doses de insulina.
   ========================================================================== */

/* INÍCIO DO MÓDULO DE CÁLCULO DE IOB MULTI-DOSE INDIVIDUAL */

/**
 * Retorna o fator de decaimento (0.0 a 1.0) para um tempo decorrido em minutos,
 * proporcional à duração de ação informada (padrão 3h = 180 min ou 4h = 240 min).
 * Curva fisiológica refinada para insulina rápida/ultrarrápida (Novorapid, Humalog, Fiasp, Apidra):
 *  - 0% do tempo: 100% ativa (1.0)
 *  - 16.7% do tempo (~30 min em 3h): 82% ativa (0.82)
 *  - 33.3% do tempo (~60 min em 3h): 62% ativa (0.62)
 *  - 50.0% do tempo (~90 min em 3h): 42% ativa (0.42)
 *  - 66.7% do tempo (~120 min em 3h): 24% ativa (0.24)
 *  - 83.3% do tempo (~150 min em 3h): 10% ativa (0.10)
 *  - >= 100% do tempo (180 min em 3h): 0% ativa (0.0)
 */
export function obterFatorDecaimentoInsulina(minutosDecorridos, duracaoHoras = 3) {
  const duracaoMinutos = Math.max(60, (duracaoHoras || 3) * 60);
  if (minutosDecorridos <= 0) return 1.0;
  if (minutosDecorridos >= duracaoMinutos) return 0.0;

  const f = minutosDecorridos / duracaoMinutos;

  // Pontos de controle da curva fisiológica (fração de tempo -> fração de insulina restante)
  const pontos = [
    { t: 0.0, i: 1.0 },
    { t: 30 / 180, i: 0.82 },
    { t: 60 / 180, i: 0.62 },
    { t: 90 / 180, i: 0.42 },
    { t: 120 / 180, i: 0.24 },
    { t: 150 / 180, i: 0.10 },
    { t: 1.0, i: 0.0 },
  ];

  for (let idx = 0; idx < pontos.length - 1; idx++) {
    const p1 = pontos[idx];
    const p2 = pontos[idx + 1];
    if (f >= p1.t && f <= p2.t) {
      const progressoSegmento = (f - p1.t) / (p2.t - p1.t);
      return Math.max(0, p1.i - progressoSegmento * (p1.i - p2.i));
    }
  }

  return 0.0;
}

/**
 * Normaliza qualquer campo de data/hora de registro (ISO string, Date, timestamp ou horário "HH:MM")
 * para timestamp em milissegundos.
 */
function extrairTimestampRegistro(reg, refDate = new Date()) {
  const campoData = reg.registrado_em || reg.data_hora_medicao || reg.criado_em || reg.data_hora;
  if (campoData) {
    if (campoData instanceof Date) return campoData.getTime();
    if (typeof campoData === 'number') return campoData;

    const parsed = new Date(campoData).getTime();
    if (!isNaN(parsed)) return parsed;

    // Suporte robusto a formato brasileiro DD/MM/YYYY HH:MM:SS ou DD/MM/YYYY, HH:MM
    if (typeof campoData === 'string' && campoData.includes('/')) {
      const regexPtBr = /(\d{1,2})\/(\d{1,2})\/(\d{4})[,\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/;
      const match = campoData.match(regexPtBr);
      if (match) {
        const dia = parseInt(match[1], 10);
        const mes = parseInt(match[2], 10) - 1;
        const ano = parseInt(match[3], 10);
        const hora = parseInt(match[4], 10);
        const min = parseInt(match[5], 10);
        const seg = match[6] ? parseInt(match[6], 10) : 0;
        return new Date(ano, mes, dia, hora, min, seg).getTime();
      }
    }
  }

  // Fallback para quando o registro possui apenas horário string (ex: "12:30" ou "12:30:00")
  if (reg.horario && typeof reg.horario === 'string') {
    const partes = reg.horario.split(':');
    if (partes.length >= 2) {
      const d = new Date(refDate);
      d.setHours(parseInt(partes[0], 10), parseInt(partes[1], 10), partes[2] ? parseInt(partes[2], 10) : 0, 0);
      return d.getTime();
    }
  }

  return null;
}

/**
 * Formata minutos restantes em texto amigável de expiração (ex: "expira em ~2h35" ou "expira em ~45min")
 */
export function formatarTextoExpiracao(minutosRestantes) {
  if (!minutosRestantes || minutosRestantes <= 0) {
    return 'Nenhuma insulina ativa no momento';
  }
  const hRest = Math.floor(minutosRestantes / 60);
  const mRest = Math.round(minutosRestantes % 60);
  if (hRest > 0) {
    const mFormatado = mRest > 0 ? String(mRest).padStart(2, '0') : '00';
    return `expira em ~${hRest}h${mFormatado}`;
  }
  return `expira em ~${mRest}min`;
}

/**
 * Calcula a Insulina Ativa Estimada (IOB — Insulin On Board) consolidada a partir
 * do decaimento fisiológico individual de cada dose rápida/ultrarrápida ativa (Multi-Bolus).
 *
 * @param {Array} registrosRecentes Lista de registros de glicemia com dose rápida
 * @param {number} duracaoHoras Duração de ação configurada da insulina rápida (3, 4 ou 5h, default 3)
 * @param {Date|string|number} dataHoraReferencia Data/hora de referência para o cálculo (default agora)
 * @returns {Object} {
 *   iobTotal: number (ex: 7.9),
 *   textoExpiracao: string (ex: "expira em ~3h00"),
 *   maxMinutosRestantes: number,
 *   totalDosesAtivas: number,
 *   detalhesDoses: Array<{
 *     id,
 *     doseOriginal,
 *     iobRestante,
 *     minutosDecorridos,
 *     minutosRestantes,
 *     horarioFormatado,
 *     rotuloTexto,
 *     contexto
 *   }>
 * }
 */
export function calcularInsulinaAtiva(
  registrosRecentes = [],
  duracaoHoras = 3,
  dataHoraReferencia = new Date()
) {
  // Trata inversão acidental de parâmetros (se duracaoHoras for uma Date)
  let refDate = dataHoraReferencia instanceof Date ? dataHoraReferencia : new Date(dataHoraReferencia || Date.now());
  let duracaoH = typeof duracaoHoras === 'number' ? duracaoHoras : 3;
  if (duracaoHoras instanceof Date) {
    refDate = duracaoHoras;
    duracaoH = typeof dataHoraReferencia === 'number' ? dataHoraReferencia : 3;
  }

  const refMs = refDate.getTime();
  const duracaoMinutos = Math.max(60, (duracaoH || 3) * 60);
  const duracaoMs = duracaoMinutos * 60 * 1000;

  let somaIob = 0;
  let maxMinutosRestantes = 0;
  const detalhesDoses = [];

  if (!Array.isArray(registrosRecentes) || registrosRecentes.length === 0) {
    return {
      iobTotal: 0.0,
      textoExpiracao: 'Nenhuma insulina ativa no momento',
      maxMinutosRestantes: 0,
      totalDosesAtivas: 0,
      detalhesDoses: [],
    };
  }

  registrosRecentes.forEach((reg, index) => {
    // Extrai a dose rápida numérica
    const dose = parseFloat(reg.dose_insulina || reg.dose_aplicada || reg.insulina_ui || 0);
    if (isNaN(dose) || dose <= 0) return;

    // Ignora insulinas basais lentas se informadas
    const nomeOuTipo = (reg.tipo_insulina || reg.nome_medicamento || reg.tipo || reg.medicamento_nome || '').toLowerCase();
    const ehBasalLenta =
      nomeOuTipo.includes('basal') ||
      nomeOuTipo.includes('tresiba') ||
      nomeOuTipo.includes('lantus') ||
      nomeOuTipo.includes('levemir') ||
      nomeOuTipo.includes('toujeo') ||
      nomeOuTipo.includes('degludeca') ||
      nomeOuTipo.includes('glargina') ||
      nomeOuTipo.includes('detemir') ||
      nomeOuTipo.includes('nph');

    if (ehBasalLenta) return;

    const dataHoraDoseMs = extrairTimestampRegistro(reg, refDate);
    if (!dataHoraDoseMs) return;

    const diffMs = refMs - dataHoraDoseMs;

    // Apenas doses passadas aplicadas dentro da janela da duração da insulina
    if (diffMs >= 0 && diffMs < duracaoMs) {
      const minutosDecorridos = diffMs / (60 * 1000);
      const fator = obterFatorDecaimentoInsulina(minutosDecorridos, duracaoH);
      const iobDestaDose = dose * fator;

      if (iobDestaDose > 0.01) {
        somaIob += iobDestaDose;
        const minutosRestantes = Math.max(0, duracaoMinutos - minutosDecorridos);
        if (minutosRestantes > maxMinutosRestantes) {
          maxMinutosRestantes = minutosRestantes;
        }

        // Formata o horário da aplicação para exibição limpa
        const dateObjDose = new Date(dataHoraDoseMs);
        const horarioFormatado = !isNaN(dateObjDose.getTime())
          ? dateObjDose.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          : (reg.horario || 'Recente');

        const tempoExpDose = formatarTextoExpiracao(minutosRestantes);
        const iobFormatado = Number(iobDestaDose.toFixed(1));

        detalhesDoses.push({
          id: reg.id || `dose-${index}`,
          doseOriginal: Number(dose.toFixed(1)),
          iobRestante: iobFormatado,
          minutosDecorridos: Math.round(minutosDecorridos),
          minutosRestantes: Math.round(minutosRestantes),
          horarioFormatado,
          rotuloTexto: `${horarioFormatado} • ${dose.toFixed(1)} UI → restam ${iobFormatado.toFixed(1)} UI (${tempoExpDose})`,
          contexto: reg.fator_contexto || reg.momento_medicao || 'Bolus de Refeição/Correção',
          dataHora: reg.data_hora_medicao || reg.registrado_em,
        });
      }
    }
  });

  // Ordena detalhes das doses: da mais recente para a mais antiga
  detalhesDoses.sort((a, b) => a.minutosDecorridos - b.minutosDecorridos);

  const iobTotal = Number(somaIob.toFixed(1));
  const textoExpiracao = formatarTextoExpiracao(maxMinutosRestantes);

  return {
    iobTotal,
    textoExpiracao,
    maxMinutosRestantes: Math.round(maxMinutosRestantes),
    totalDosesAtivas: detalhesDoses.length,
    detalhesDoses,
  };
}

// Alias conveniente para calcularInsulinaAtiva
export const calcularIOB = calcularInsulinaAtiva;

/* FIM DO MÓDULO DE CÁLCULO DE IOB MULTI-DOSE INDIVIDUAL */

/**
 * Calcula a Projeção pelo Fator de Sensibilidade Insulínica (FSI) e avalia risco de hipo/empilhamento.
 *
 * @param {number} glicemiaAtual Valor em mg/dL no momento da medição
 * @param {number} insulinaAtiva Total de UI ativas no organismo (IOB)
 * @param {number} novaDose Dose pretendida para aplicação imediata (UI)
 * @param {number} fsi Fator de Sensibilidade Insulínica (1 UI reduz X mg/dL)
 * @param {number} glicemiaAlvo Meta glicêmica educativa (default 100 mg/dL)
 * @returns {Object}
 */
export function calcularProjecaoFSI(
  glicemiaAtual,
  insulinaAtiva = 0,
  novaDose = 0,
  fsi = null,
  glicemiaAlvo = 100
) {
  const gAtual = parseInt(glicemiaAtual, 10);
  const iAtiva = Math.max(0, parseFloat(insulinaAtiva) || 0);
  const nDose = Math.max(0, parseFloat(novaDose) || 0);
  const fsiValor = parseFloat(fsi);
  const alvo = parseInt(glicemiaAlvo, 10) || 100;

  if (isNaN(gAtual) || gAtual <= 0) {
    return null;
  }

  const insulinaTotal = parseFloat((iAtiva + nDose).toFixed(2));

  // Sem FSI configurado no perfil
  if (isNaN(fsiValor) || fsiValor <= 0) {
    return {
      temFSI: false,
      insulinaTotal,
      quedaEstimada: null,
      glicemiaProjetada: null,
      riscoHipo: false,
      mensagem:
        insulinaTotal > 0
          ? `Você tem ${insulinaTotal} UI totais no organismo. Para estimar a queda em mg/dL, configure seu FSI orientado pelo médico.`
          : null,
    };
  }

  const quedaEstimada = Math.round(insulinaTotal * fsiValor);
  const glicemiaProjetada = Math.round(gAtual - quedaEstimada);
  const diferencaAlvo = Math.round(glicemiaProjetada - alvo);
  const riscoHipo = glicemiaProjetada < 70;

  let alertaNivel = 'normal';
  let mensagemEducativa = '';

  if (riscoHipo) {
    alertaNivel = 'risco_hipoglicemia';
    mensagemEducativa = `⚠️ Atenção carinhosa: com a insulina ativa (${iAtiva} UI) somada à nova dose (${nDose} UI), a projeção de queda (~${quedaEstimada} mg/dL) leva a glicemia para ~${glicemiaProjetada} mg/dL, abaixo de 70 mg/dL. Verifique com calma se há risco de empilhamento de doses antes de aplicar.`;
  } else if (glicemiaProjetada >= 70 && glicemiaProjetada <= 140) {
    alertaNivel = 'no_alvo';
    mensagemEducativa = `🌱 Ótima projeção! A combinação de insulina ativa e dose leva a glicemia estimada para ~${glicemiaProjetada} mg/dL, dentro da meta segura de conforto.`;
  } else {
    alertaNivel = 'acima_alvo';
    mensagemEducativa = `Com seu FSI de ${fsiValor}, a redução estimada é de ~${quedaEstimada} mg/dL, projetando a glicemia para ~${glicemiaProjetada} mg/dL.`;
  }

  return {
    temFSI: true,
    fsi: fsiValor,
    glicemiaAlvo: alvo,
    insulinaAtiva: iAtiva,
    novaDose: nDose,
    insulinaTotal,
    quedaEstimada,
    glicemiaProjetada,
    diferencaAlvo,
    riscoHipo,
    alertaNivel,
    mensagemEducativa,
  };
}

/**
 * Calcula a velocidade de variação e seta de tendência entre duas medições consecutivas
 * em intervalo curto (<= 45 minutos), simulando a inteligência dos sensores para ponta de dedo.
 *
 * @param {number} glicemiaAtual Valor da leitura atual em mg/dL
 * @param {Date|string|number} dataHoraAtual Data/hora da medição atual
 * @param {Object} ultimoRegistro Registro anterior mais recente
 * @returns {Object}
 */
export function calcularTendenciaDestro(
  glicemiaAtual,
  dataHoraAtual = new Date(),
  ultimoRegistro = null
) {
  const gAtual = parseInt(glicemiaAtual, 10);
  if (isNaN(gAtual) || gAtual <= 0) return null;

  if (!ultimoRegistro || !ultimoRegistro.valor_mg_dl) {
    return {
      temComparacao: false,
      rotulo: 'Primeiro registro',
      icone: '•',
      taxaPorMinuto: 0,
      variacaoTotal: 0,
      deltaMinutos: null,
      cor: '#7C533F',
    };
  }

  const gAnterior = parseInt(ultimoRegistro.valor_mg_dl, 10);
  const tAtual = new Date(dataHoraAtual).getTime();
  const tAnterior = new Date(ultimoRegistro.data_hora_medicao || ultimoRegistro.criado_em).getTime();

  const diffMs = tAtual - tAnterior;
  const deltaMinutos = Math.round(diffMs / (60 * 1000));

  // Intervalo fora do limite para correlação fisiológica confiável de tendência (> 45 minutos)
  if (deltaMinutos < 1 || deltaMinutos > 45) {
    return {
      temComparacao: false,
      rotulo: deltaMinutos > 45 ? 'Última há > 45 min' : 'Medições simultâneas',
      icone: '•',
      taxaPorMinuto: 0,
      variacaoTotal: gAtual - gAnterior,
      deltaMinutos,
      cor: '#6C625A',
    };
  }

  const variacaoTotal = gAtual - gAnterior;
  const taxaPorMinuto = parseFloat((variacaoTotal / deltaMinutos).toFixed(2));

  // Matriz de tendências clínicas baseada na velocidade por minuto
  if (taxaPorMinuto > 2.0) {
    return {
      temComparacao: true,
      deltaMinutos,
      variacaoTotal,
      taxaPorMinuto,
      icone: '↑↑',
      rotulo: 'Subida brusca',
      descricao: `Subindo muito rápido (> +2 mg/dL/min, +${variacaoTotal} mg/dL em ${deltaMinutos} min)`,
      cor: '#C47451',
      alertaQuedaRapida: false,
    };
  }
  if (taxaPorMinuto > 1.0) {
    return {
      temComparacao: true,
      deltaMinutos,
      variacaoTotal,
      taxaPorMinuto,
      icone: '↑',
      rotulo: 'Subida rápida',
      descricao: `Subindo rápido (+1 a +2 mg/dL/min, +${variacaoTotal} mg/dL em ${deltaMinutos} min)`,
      cor: '#D4A338',
      alertaQuedaRapida: false,
    };
  }
  if (taxaPorMinuto > 0.4) {
    return {
      temComparacao: true,
      deltaMinutos,
      variacaoTotal,
      taxaPorMinuto,
      icone: '↗',
      rotulo: 'Subida moderada',
      descricao: `Subindo moderadamente (+${variacaoTotal} mg/dL em ${deltaMinutos} min)`,
      cor: '#7C533F',
      alertaQuedaRapida: false,
    };
  }
  if (taxaPorMinuto >= -0.4 && taxaPorMinuto <= 0.4) {
    return {
      temComparacao: true,
      deltaMinutos,
      variacaoTotal,
      taxaPorMinuto,
      icone: '→',
      rotulo: 'Estável',
      descricao: `Variação leve/estável (${variacaoTotal >= 0 ? '+' : ''}${variacaoTotal} mg/dL em ${deltaMinutos} min)`,
      cor: '#3B7E48',
      alertaQuedaRapida: false,
    };
  }
  if (taxaPorMinuto >= -1.0 && taxaPorMinuto < -0.4) {
    return {
      temComparacao: true,
      deltaMinutos,
      variacaoTotal,
      taxaPorMinuto,
      icone: '↘',
      rotulo: 'Queda moderada',
      descricao: `Queda moderada (${variacaoTotal} mg/dL em ${deltaMinutos} min)`,
      cor: '#D4A338',
      alertaQuedaRapida: false,
    };
  }
  if (taxaPorMinuto >= -2.0 && taxaPorMinuto < -1.0) {
    return {
      temComparacao: true,
      deltaMinutos,
      variacaoTotal,
      taxaPorMinuto,
      icone: '↓',
      rotulo: 'Queda rápida',
      descricao: `Atenção: glicemia caindo rápido (${variacaoTotal} mg/dL em ${deltaMinutos} min, taxa ${taxaPorMinuto} mg/dL/min)`,
      cor: '#E06A55',
      alertaQuedaRapida: true,
    };
  }

  // Queda brusca (< -2.0 mg/dL/min)
  return {
    temComparacao: true,
    deltaMinutos,
    variacaoTotal,
    taxaPorMinuto,
    icone: '↓↓',
    rotulo: 'Queda brusca',
    descricao: `🚨 Queda brusca detectada (${variacaoTotal} mg/dL em apenas ${deltaMinutos} min)! Atenção preventiva mesmo que o valor atual ainda pareça normal.`,
    cor: '#A23B2A',
    alertaQuedaRapida: true,
  };
}
