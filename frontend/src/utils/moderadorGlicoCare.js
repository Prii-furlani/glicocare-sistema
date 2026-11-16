/* ==========================================================================
   ARQUIVO: moderadorGlicoCare.js
   MÓDULO: Moderador Oficial de Conteúdo e Acolhimento GlicoCare (RN-MOD-01)
   OBJETIVO: Analisar criticamente mensagens, depoimentos ou sugestões enviadas
   por usuários nos formulários do site antes da exibição pública, seguindo:
   1. Tom e Empatia (respeito, acolhimento, solidariedade ou dúvidas construtivas)
   2. Segurança Emocional e Clínica (bloqueio imediato de ofensas, julgamentos
      agressivos, spams, links maliciosos, autopromoção comercial desconexa ou
      informações médicas falsas perigosas para o manejo do DM1)
   3. Formato de Saída estrito: [APROVADA] ou [REJEITADA] com justificativa.
   ========================================================================== */

/* INÍCIO DA FUNÇÃO DE ANÁLISE DO MODERADOR OFICIAL */
export function analisarMensagemModerador(texto) {
  const textoLimpo = (texto || '').trim();
  const textoMinusculo = textoLimpo.toLowerCase();

  // 1. Rejeição por spam, links maliciosos ou autopromoção comercial desconexa
  const padraoSpamOuLinks =
    /(https?:\/\/|www\.|\.com\.br|\.bet|pix|compre agora|ganhe dinheiro|promoção|desconto exclusivo|clique no link|whatsapp\s*\d)/i;
  if (padraoSpamOuLinks.test(textoMinusculo)) {
    return {
      aprovada: false,
      categoria: '[REJEITADA]',
      saidaFormatada:
        '[REJEITADA]: A mensagem contém links externos, spam ou autopromoção comercial desconexa, violando as diretrizes de segurança da plataforma GlicoCare.',
    };
  }

  // 2. Rejeição por informações médicas falsas perigosas ao manejo clínico do DM1
  const padraoDesinformacaoClinica =
    /(pare de tomar insulina|suspenda a insulina|cura milagrosa|chá que cura|cura definitiva do diabetes|não precisa de insulina|substitua a insulina|abandone a insulina)/i;
  if (padraoDesinformacaoClinica.test(textoMinusculo)) {
    return {
      aprovada: false,
      categoria: '[REJEITADA]',
      saidaFormatada:
        '[REJEITADA]: Alerta grave de segurança clínica — a mensagem contém informação médica falsa e perigosa que incentiva a suspensão ou substituição indevida da insulina no manejo do Diabetes Tipo 1.',
    };
  }

  // 3. Rejeição por ofensas, ataques pessoais ou julgamentos agressivos contra famílias
  const padraoAgressividadeOuJulgamento =
    /(culpa é sua|mãe irresponsável|pai irresponsável|vocês são culpados|idiota|imbecil|burrice|incompetente|lixo|ridículo|vergonha na cara)/i;
  if (padraoAgressividadeOuJulgamento.test(textoMinusculo)) {
    return {
      aprovada: false,
      categoria: '[REJEITADA]',
      saidaFormatada:
        '[REJEITADA]: Viola a diretriz de Segurança Emocional e Tom de Empatia por conter julgamento agressivo ou linguagem ofensiva incompatível com o acolhimento familiar da GlicoCare.',
    };
  }

  // 4. Aprovação quando a mensagem transmite respeito, empatia, acolhimento ou dúvida construtiva
  return {
    aprovada: true,
    categoria: '[APROVADA]',
    saidaFormatada:
      '[APROVADA]: A mensagem é segura, respeitosa e transmite acolhimento, empatia ou dúvida construtiva alinhada à comunidade GlicoCare.',
  };
}
/* FIM DA FUNÇÃO DE ANÁLISE DO MODERADOR OFICIAL */
