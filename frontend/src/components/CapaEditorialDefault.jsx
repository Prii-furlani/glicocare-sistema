/* =============================================================================
   ARQUIVO: CapaEditorialDefault.jsx
   LOCALIZAÇÃO: frontend/src/components/CapaEditorialDefault.jsx
   PROJETO: GlicoCare — Design System "Porto Seguro"
   OBJETIVO: Componente reutilizável de Capa Editorial Padrão para artigos e
             conteúdos que não possuem imagem anexada ou caso a imagem falhe
             ao carregar. Exibe fundo sólido terroso/verde oficial, círculos
             concêntricos delicados, selo superior em pílula marfim e
             numeração com tipografia Fraunces itálica.
   ============================================================================= */

import React from 'react';

/* INÍCIO DO MAPEAMENTO DA PALETA OFICIAL "PORTO SEGURO" */
export const PALETA_CAPA_DEFAULT = {
  terracota: '#947460', // Com o Lufy / Conversa em Família
  verde: '#527356',     // Rotina Escolar / Checklist Prático
  carvalho: '#665B53',  // Tecnologia & Autonomia / Vida Real
};

/**
 * Resolve a cor de fundo oficial da capa com base na escolha manual
 * ou na categoria/selo do conteúdo.
 */
export function resolverCorCapaEditorial(corManual, categoria = '', selo = '') {
  // 1. Caso haja cor manual válida
  if (corManual && PALETA_CAPA_DEFAULT[corManual.toLowerCase()]) {
    return PALETA_CAPA_DEFAULT[corManual.toLowerCase()];
  }
  if (corManual && (corManual.startsWith('#') || corManual.startsWith('rgb'))) {
    return corManual;
  }

  // 2. Fallback automático por Categoria ou Selo
  const cat = (categoria || '').toLowerCase();
  const s = (selo || '').toLowerCase();

  if (
    cat.includes('escola') ||
    s.includes('checklist') ||
    cat.includes('alimenta')
  ) {
    return PALETA_CAPA_DEFAULT.verde;
  }

  if (
    cat.includes('tecnologia') ||
    cat.includes('autonomia') ||
    s.includes('vida real') ||
    s.includes('autonomia')
  ) {
    return PALETA_CAPA_DEFAULT.carvalho;
  }

  // Padrão: Terracota para 'Com o Lufy', 'Conversa em Família', 'Acolhimento' e outros
  return PALETA_CAPA_DEFAULT.terracota;
}

/**
 * Formata o número editorial garantindo sempre 2 dígitos (01, 02, 03...).
 */
export function formatarNumeroEditorial(numero) {
  if (numero === null || numero === undefined || numero === '') return '01';
  const numInt = parseInt(numero, 10);
  if (!isNaN(numInt)) {
    return String(numInt).padStart(2, '0');
  }
  const limpo = String(numero).trim();
  return limpo.length === 1 ? `0${limpo}` : limpo || '01';
}
/* FIM DO MAPEAMENTO DA PALETA OFICIAL "PORTO SEGURO" */

/* INÍCIO DO COMPONENTE CAPA EDITORIAL PADRÃO */
export default function CapaEditorialDefault({
  selo = 'GUIA ESSENCIAL',
  numero = '01',
  cor = 'terracota',
  categoria = '',
  variante = 'card', // 'card' | 'banner' | 'preview' | 'mini'
  className = '',
  style = {},
  aspectRatio = null,
}) {
  const corFundo = resolverCorCapaEditorial(cor, categoria, selo);
  const numeroFormatado = formatarNumeroEditorial(numero);
  const textoSelo = (selo || 'GUIA ESSENCIAL').toUpperCase();

  // Definição de proporções e dimensões conforme variante
  const isBanner = variante === 'banner';
  const isMini = variante === 'mini';
  const isPreview = variante === 'preview';

  // Configurações dimensionais dinâmicas
  const alturaContainer = isBanner
    ? 'clamp(240px, 34vw, 380px)'
    : isMini
    ? '64px'
    : isPreview
    ? '180px'
    : '100%';

  const raioBorda = isBanner ? '16px' : isMini ? '8px' : '0';

  return (
    <div
      className={`capa-editorial-default capa-editorial-default--${variante} ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: alturaContainer,
        backgroundColor: corFundo,
        overflow: 'hidden',
        borderRadius: raioBorda,
        aspectRatio: aspectRatio || (isBanner ? '16 / 7' : undefined),
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        userSelect: 'none',
        boxSizing: 'border-box',
        ...style,
      }}
      aria-label={`Capa editorial: ${textoSelo} - ${numeroFormatado}`}
    >
      {/* ===================================================================
          1. INÍCIO DO SELO SUPERIOR (Pílula Marfim Oficial)
          =================================================================== */}
      {!isMini && (
        <span
          className="capa-editorial-default__selo"
          style={{
            position: 'absolute',
            top: isBanner ? '1.5rem' : '1.15rem',
            left: isBanner ? '1.5rem' : '1.15rem',
            zIndex: 3,
            backgroundColor: '#F6F3EE',
            color: '#2E2824',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '0.38rem 0.9rem',
            borderRadius: '9999px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            lineHeight: 1.2,
            display: 'inline-flex',
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          {textoSelo}
        </span>
      )}
      {/* FIM DO SELO SUPERIOR */}

      {/* ===================================================================
          2. INÍCIO DOS ELEMENTOS GRÁFICOS SUTIS
             - Dois arcos concêntricos finos no canto superior direito
             - Pequeno círculo sólido de 8px (#EAE4D9) no canto inferior direito
          =================================================================== */}
      <div
        className="capa-editorial-default__arcos-concentricost"
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: isBanner ? '-60px' : '-50px',
          right: isBanner ? '-60px' : '-50px',
          width: isBanner ? '260px' : '200px',
          height: isBanner ? '260px' : '200px',
          borderRadius: '50%',
          border: '1px solid rgba(246, 243, 238, 0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        {/* Arco/círculo concêntrico interno */}
        <div
          style={{
            width: isBanner ? '185px' : '142px',
            height: isBanner ? '185px' : '142px',
            borderRadius: '50%',
            border: '1px solid rgba(246, 243, 238, 0.22)',
          }}
        />
      </div>

      {/* Pequeno círculo sólido (8px, #EAE4D9) no canto inferior direito */}
      {!isMini && (
        <div
          className="capa-editorial-default__ponto-decorativo"
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: isBanner ? '1.8rem' : '1.35rem',
            right: isBanner ? '1.8rem' : '1.35rem',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#EAE4D9',
            opacity: 0.95,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      )}
      {/* FIM DOS ELEMENTOS GRÁFICOS SUTIS */}

      {/* ===================================================================
          3. INÍCIO DA NUMERAÇÃO EDITORIAL EM ITÁLICO
             - Fonte serifada Fraunces itálica com cor #EAE4D9
          =================================================================== */}
      <span
        className="capa-editorial-default__numero serif-title"
        style={{
          fontFamily: 'var(--fonte-titulo, Fraunces, serif)',
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: isMini
            ? '1.8rem'
            : isBanner
            ? 'clamp(3.4rem, 6vw, 5.2rem)'
            : 'clamp(2.6rem, 4vw, 3.4rem)',
          color: '#EAE4D9',
          lineHeight: 0.9,
          position: 'absolute',
          bottom: isMini ? '0.35rem' : isBanner ? '1.6rem' : '1.15rem',
          left: isMini ? '0.5rem' : isBanner ? '1.6rem' : '1.25rem',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        {numeroFormatado}
      </span>
      {/* FIM DA NUMERAÇÃO EDITORIAL EM ITÁLICO */}
    </div>
  );
}
/* FIM DO COMPONENTE CAPA EDITORIAL PADRÃO (CapaEditorialDefault.jsx) */
