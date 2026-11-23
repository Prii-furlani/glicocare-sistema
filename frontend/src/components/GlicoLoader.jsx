/* ==========================================================================
   ARQUIVO: GlicoLoader.jsx (Localização: frontend/src/components/GlicoLoader.jsx)
   PROJETO: GlicoCare — Sistema Integrado de Apoio ao DM1
   OBJETIVO: Componente reutilizável de Loaders, Skeletons e Feedback de
             Carregamento oficial do Design System "Porto Seguro".
   VARIANTES:
     1. 'pagina': Carregamento imersivo e acolhedor de tela ou seção com o
        mascote Lufy respirando suavemente envolto por um anel giratório duplo
        nas cores oficiais Verde Alívio (--cor-cta) e Terracota (--cor-primaria).
     2. 'skeleton': Esqueletos com animação suave de brilho (shimmer) para
        cards da biblioteca, feed de glicemia (diário) e histórico de exames,
        evitando saltos de layout (CLS) durante requisições ao TiDB Cloud.
     3. 'botao': Mini-spinner compacto inline (16px x 16px) com rotação suave
        para botões em estado de envio (isLoading / salvando), prevenindo
        cliques múltiplos acidentais.
   COMPATIBILIDADE: 100% responsivo e adaptado para Tema Claro e Dark Mode.
   ========================================================================== */

import React from 'react';
import lufyMascoteFoto from '../assets/lufy-mascote.jpg';

/* INÍCIO DO COMPONENTE GLICOLOADER */
export default function GlicoLoader({
  variant = 'pagina',
  variante,                  // Suporte a sinonímia em português
  tipo = 'grid',             // Para skeleton: 'card' | 'grid' | 'diario' | 'exame' | 'linha' | 'texto'
  quantidade = 3,            // Quantidade de elementos skeleton a renderizar
  count,                     // Sinônimo para quantidade
  mensagem = 'Organizando tudo com calma para você...',
  submensagem = 'Respire fundo enquanto preparamos seus dados com carinho.',
  texto,                     // Para botão: texto opcional ao lado do spinner
  minHeight = '50vh',        // Altura mínima para variante página
  style = {},
  className = '',
}) {
  const varianteAtiva = variante || variant || 'pagina';
  const totalSkeletons = count || quantidade || 3;

  /* ========================================================================
     1. VARIANTE BOTÃO: MINI-SPINNER INLINE
     ======================================================================== */
  if (varianteAtiva === 'botao' || varianteAtiva === 'spinner') {
    return (
      <span
        className={`glico-loader-botao ${className}`}
        style={style}
        role="status"
        aria-live="polite"
      >
        <span className="glico-loader-botao__spinner" aria-hidden="true" />
        {texto && <span>{texto}</span>}
      </span>
    );
  }

  /* ========================================================================
     2. VARIANTE SKELETON: SHIMMER ANTI-CLS
     ======================================================================== */
  if (varianteAtiva === 'skeleton') {
    // 2.1 Skeleton de Cards de Artigo / Conteúdos (em Grade)
    if (tipo === 'grid' || tipo === 'card') {
      return (
        <div
          className={`glico-skeleton-grid ${className}`}
          style={style}
          aria-busy="true"
          aria-label="Carregando conteúdos..."
        >
          {Array.from({ length: totalSkeletons }).map((_, index) => (
            <div key={`skeleton-card-${index}`} className="glico-skeleton-card">
              {/* Simulação da Capa Editorial */}
              <div className="glico-skeleton-base glico-skeleton-card__capa" />
              {/* Simulação do Selo Superior */}
              <div className="glico-skeleton-base glico-skeleton-card__selo" />
              {/* Simulação do Título do Card */}
              <div className="glico-skeleton-base glico-skeleton-card__titulo" />
              {/* Simulação de Linhas de Resumo */}
              <div className="glico-skeleton-base glico-skeleton-card__linha" />
              <div className="glico-skeleton-base glico-skeleton-card__linha glico-skeleton-card__linha--curta" />
            </div>
          ))}
        </div>
      );
    }

    // 2.2 Skeleton de Itens do Diário de Glicemia
    if (tipo === 'diario') {
      return (
        <div
          className={`glico-skeleton-diario-lista ${className}`}
          style={{ width: '100%', ...style }}
          aria-busy="true"
          aria-label="Carregando medições de glicemia..."
        >
          {Array.from({ length: totalSkeletons }).map((_, index) => (
            <div key={`skeleton-diario-${index}`} className="glico-skeleton-diario-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                <div
                  className="glico-skeleton-base"
                  style={{ width: '56px', height: '42px', borderRadius: '10px' }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    className="glico-skeleton-base"
                    style={{ width: '140px', height: '16px', marginBottom: '6px' }}
                  />
                  <div
                    className="glico-skeleton-base"
                    style={{ width: '220px', height: '12px' }}
                  />
                </div>
              </div>
              <div
                className="glico-skeleton-base"
                style={{ width: '80px', height: '24px', borderRadius: '999px' }}
              />
            </div>
          ))}
        </div>
      );
    }

    // 2.3 Skeleton de Central de Exames
    if (tipo === 'exame') {
      return (
        <div
          className={`glico-skeleton-exame-lista ${className}`}
          style={{ width: '100%', ...style }}
          aria-busy="true"
          aria-label="Carregando histórico de exames..."
        >
          {Array.from({ length: totalSkeletons }).map((_, index) => (
            <div key={`skeleton-exame-${index}`} className="glico-skeleton-exame-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div
                  className="glico-skeleton-base"
                  style={{ width: '180px', height: '22px' }}
                />
                <div
                  className="glico-skeleton-base"
                  style={{ width: '110px', height: '16px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', margin: '0.5rem 0' }}>
                <div
                  className="glico-skeleton-base"
                  style={{ width: '90px', height: '26px', borderRadius: '999px' }}
                />
                <div
                  className="glico-skeleton-base"
                  style={{ width: '120px', height: '26px', borderRadius: '999px' }}
                />
                <div
                  className="glico-skeleton-base"
                  style={{ width: '100px', height: '26px', borderRadius: '999px' }}
                />
              </div>
              <div
                className="glico-skeleton-base"
                style={{ width: '70%', height: '14px' }}
              />
            </div>
          ))}
        </div>
      );
    }

    // 2.4 Skeleton Genérico de Linhas de Texto
    return (
      <div
        className={`glico-skeleton-linhas ${className}`}
        style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.65rem', ...style }}
        aria-busy="true"
      >
        {Array.from({ length: totalSkeletons }).map((_, index) => (
          <div
            key={`skeleton-linha-${index}`}
            className="glico-skeleton-base"
            style={{
              width: index === totalSkeletons - 1 ? '60%' : '100%',
              height: '16px',
            }}
          />
        ))}
      </div>
    );
  }

  /* ========================================================================
     3. VARIANTE PÁGINA (PADRÃO): TELA / SEÇÃO COM O LUFY E ANEL ORGÂNICO
     ======================================================================== */
  return (
    <div
      className={`glico-loader-pagina ${className}`}
      style={{ minHeight, ...style }}
      role="status"
      aria-live="polite"
    >
      {/* Halo Orgânico Duplo Giratório com Avatar do Lufy */}
      <div className="glico-loader-pagina__halo-container">
        <div className="glico-loader-pagina__halo-ring" aria-hidden="true" />
        <img
          src={lufyMascoteFoto}
          alt="Lufy, o coala guardião do GlicoCare respirando com calma"
          className="glico-loader-pagina__lufy-avatar"
        />
      </div>

      {/* Mensagem Editorial Acolhedora */}
      {mensagem && (
        <h3 className="glico-loader-pagina__mensagem">
          {mensagem}
        </h3>
      )}

      {/* Submensagem Opcional de Serenidade */}
      {submensagem && (
        <p className="glico-loader-pagina__submensagem">
          {submensagem}
        </p>
      )}
    </div>
  );
}
/* FIM DO COMPONENTE GLICOLOADER */
