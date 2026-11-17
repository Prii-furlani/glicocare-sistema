/* ==========================================================================
   ARQUIVO: glicemiaAnalytics.js (Localização: /frontend/src/utils/glicemiaAnalytics.js)
   OBJETIVO:
     Motor de cálculo clínico-educativo e preditivo da plataforma GlicoCare:
     1. Insulina Ativa Estimada (IOB — Insulin On Board) com decaimento fisiológico;
     2. Projeção pelo Fator de Sensibilidade Insulínica (FSI) e detecção de sobreposição;
     3. Velocidade de Variação e Seta de Tendência entre pontas de dedo (destros <= 45 min).
   AVISO ÉTICO:
     Cálculos estritamente educativos baseados em parâmetros do médico assistente.
     A GlicoCare não altera nem prescreve doses de insulina.
   ========================================================================== */

/**
 * Retorna o fator de decaimento (0.0 a 1.0) para um tempo decorrido em minutos,
 * proporcional à duração de ação informada (padrão 3h = 180 min).
 * Curva fisiológica aproximada para insulina rápida/ultrarrápida:
 *  - 0% do tempo: 100% ativa (1.0)
 *  - 16.7% do tempo (~30 min em 3h): 80% ativa (0.8)
 *  - 33.3% do tempo (~60 min em 3h): 60% ativa (0.6)
 *  - 50.0% do tempo (~90 min em 3h): 40% ativa (0.4)
 *  - 66.7% do tempo (~120 min em 3h): 25% ativa (0.25)
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
    { t: 30 / 180, i: 0.8 },
    { t: 60 / 180, i: 0.6 },
    { t: 90 / 180, i: 0.4 },
    { t: 120 / 180, i: 0.25 },
    { t: 150 / 180, i: 0.1 },
    { t: 1.0, i: 0.0 },
  ];

  for (let idx = 0; idx < pontos.length - 1; idx++) {
    const p1 = pontos[idx];
    const p2 = pontos[idx + 1];
    if (f >= p1.t && f <= p2.t) {
      const progressoSegmento = (f - p1.t) / (p2.t - p1.t);
      return p1.i - progressoSegmento * (p1.i - p2.i);
    }
  }

  return 0.0;
}

/**
 * Calcula a Insulina Ativa Estimada (IOB) presente no organismo no momento informado.
 *
 * @param {Array} registrosRecentes Lista de registros de glicemia com dose_insulina / dose_aplicada
 * @param {Date|string|number} dataHoraReferencia Data/hora de referência para o cálculo (default agora)
 * @param {number} duracaoHoras Duração de ação da insulina rápida (3, 4 ou 5h, default 3)
 * @returns {Object} { iobTotal, textoExpiracao, totalDosesAtivas, detalhesDoses }
 */
export function calcularInsulinaAtiva(
  registrosRecentes = [],
  dataHoraReferencia = new Date(),
  duracaoHoras = 3
) {
  const refMs = new Date(dataHoraReferencia).getTime();
  const duracaoMinutos = (duracaoHoras || 3) * 60;
  const duracaoMs = duracaoMinutos * 60 * 1000;

  let iobTotal = 0;
  let maxMinutosRestantes = 0;
  const detalhesDoses = [];

  if (!Array.isArray(registrosRecentes) || registrosRecentes.length === 0) {
    return {
      iobTotal: 0,
      textoExpiracao: 'Nenhuma insulina ativa no momento',
      totalDosesAtivas: 0,
      detalhesDoses: [],
    };
  }

  registrosRecentes.forEach((reg) => {
    const dose = parseFloat(reg.dose_aplicada || reg.dose_insulina || 0);
    if (isNaN(dose) || dose <= 0) return;

    const dataHoraDose = new Date(reg.data_hora_medicao || reg.criado_em).getTime();
    const diffMs = refMs - dataHoraDose;

    // Apenas doses passadas aplicadas dentro do raio da duração da insulina
    if (diffMs >= 0 && diffMs < duracaoMs) {
      const minutosDecorridos = diffMs / (60 * 1000);
      const fator = obterFatorDecaimentoInsulina(minutosDecorridos, duracaoHoras);
      const iobDestaDose = dose * fator;

      if (iobDestaDose > 0.05) {
        iobTotal += iobDestaDose;
        const minutosRestantes = Math.max(0, duracaoMinutos - minutosDecorridos);
        if (minutosRestantes > maxMinutosRestantes) {
          maxMinutosRestantes = minutosRestantes;
        }

        detalhesDoses.push({
          id: reg.id,
          doseOriginal: dose,
          minutosDecorridos: Math.round(minutosDecorridos),
          minutosRestantes: Math.round(minutosRestantes),
          iobRestante: parseFloat(iobDestaDose.toFixed(2)),
          dataHora: reg.data_hora_medicao,
        });
      }
    }
  });

  // Formata o tempo restante de expiração
  let textoExpiracao = 'Nenhuma insulina ativa no momento';
  if (iobTotal > 0.05 && maxMinutosRestantes > 0) {
    const hRest = Math.floor(maxMinutosRestantes / 60);
    const mRest = Math.round(maxMinutosRestantes % 60);
    if (hRest > 0) {
      textoExpiracao = `expira em ~${hRest}h${mRest > 0 ? String(mRest).padStart(2, '0') : ''}`;
    } else {
      textoExpiracao = `expira em ~${mRest} min`;
    }
  }

  return {
    iobTotal: parseFloat(iobTotal.toFixed(2)),
    textoExpiracao,
    totalDosesAtivas: detalhesDoses.length,
    detalhesDoses,
  };
}

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
