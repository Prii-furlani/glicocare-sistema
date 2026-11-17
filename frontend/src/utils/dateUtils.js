/* ==========================================================================
   ARQUIVO: dateUtils.js (Localização: /frontend/src/utils/dateUtils.js)
   OBJETIVO: Utilitários puros para cálculos de datas da plataforma GlicoCare,
             em especial o tempo decorrido desde o diagnóstico de DM1
             e a classificação empática de fases da jornada do paciente.
   REGRAS DE NEGÓCIO:
     - Cálculo de anos e meses naturais em português.
     - Classificação de fase:
         * recem_diagnosticado (< 6 meses)
         * adaptacao (6 meses a 2 anos)
         * experiente (> 2 anos)
   ========================================================================== */

/**
 * Calcula anos e meses decorridos desde a data da descoberta / diagnóstico de diabetes
 * e retorna dados completos formatados para exibição no perfil e anamnese.
 *
 * @param {string|Date|null} dataDiagnostico Data no formato YYYY-MM-DD, YYYY-MM ou instância Date
 * @returns {Object|null} Objeto contendo anos, meses, textos formatados e fase da jornada
 */
export function calcularTempoDiagnostico(dataDiagnostico) {
  if (!dataDiagnostico) return null;

  try {
    // Normaliza se veio apenas YYYY-MM
    let dataStr = typeof dataDiagnostico === 'string' ? dataDiagnostico.trim() : '';
    if (dataStr && dataStr.length === 7 && dataStr.includes('-')) {
      dataStr = `${dataStr}-01`;
    }

    const dataInicio = new Date(dataStr || dataDiagnostico);
    const hoje = new Date();

    if (isNaN(dataInicio.getTime()) || dataInicio > hoje) {
      return null;
    }

    let anos = hoje.getFullYear() - dataInicio.getFullYear();
    let meses = hoje.getMonth() - dataInicio.getMonth();
    const dias = hoje.getDate() - dataInicio.getDate();

    // Ajusta se o dia do mês atual for menor que o dia do diagnóstico
    if (dias < 0) {
      meses--;
    }

    // Ajusta se os meses ficaram negativos
    if (meses < 0) {
      anos--;
      meses += 12;
    }

    if (anos < 0) {
      anos = 0;
      meses = 0;
    }

    const totalMeses = anos * 12 + meses;

    // Formatação em linguagem natural em português
    let textoFormatado = '';
    if (anos === 0) {
      if (meses === 0) {
        textoFormatado = 'Menos de 1 mês';
      } else if (meses === 1) {
        textoFormatado = '1 mês';
      } else {
        textoFormatado = `${meses} meses`;
      }
    } else if (anos === 1) {
      if (meses === 0) {
        textoFormatado = '1 ano';
      } else if (meses === 1) {
        textoFormatado = '1 ano e 1 mês';
      } else {
        textoFormatado = `1 ano e ${meses} meses`;
      }
    } else {
      if (meses === 0) {
        textoFormatado = `${anos} anos`;
      } else if (meses === 1) {
        textoFormatado = `${anos} anos e 1 mês`;
      } else {
        textoFormatado = `${anos} anos e ${meses} meses`;
      }
    }

    // Classificação da fase da jornada de convivência com DM1
    let fase = 'experiente';
    let rotuloFase = 'Jornada Experiente';
    let mensagemAcolhedora = `Sua jornada já soma ${textoFormatado} de aprendizado, força e superação.`;
    let badgeIcone = '🌱';

    if (totalMeses < 6) {
      fase = 'recem_diagnosticado';
      rotuloFase = 'Recém-diagnosticado(a)';
      mensagemAcolhedora = `Primeiros passos: ${textoFormatado} de diagnóstico — estamos com você em cada descoberta!`;
      badgeIcone = '🌿';
    } else if (totalMeses <= 24) {
      fase = 'adaptacao';
      rotuloFase = 'Fase de Adaptação';
      mensagemAcolhedora = `${textoFormatado} de caminhada: construindo uma rotina serena e segura.`;
      badgeIcone = '✨';
    }

    return {
      anos,
      meses,
      totalMeses,
      textoFormatado,
      textoJornada: `${textoFormatado} de jornada`,
      fase,
      rotuloFase,
      mensagemAcolhedora,
      badgeIcone,
    };
  } catch (err) {
    console.warn('Erro ao calcular tempo de diagnóstico:', err);
    return null;
  }
}
