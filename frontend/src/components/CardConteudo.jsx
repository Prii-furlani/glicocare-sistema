/* ==========================================================================
   ARQUIVO: CardConteudo.jsx
   COMPONENTE: CardConteudo (Card Reutilizável da Biblioteca GlicoCare)
   OBJETIVO: Renderizar fielmente os dois estilos de Card de Conteúdo do
   protótipo:
   1. Card com Foto de Capa (ex: "Hipoglicemia sem susto" com Lufy ou "DM1 na
      escola" com a ilustração mãe e filha);
   2. Card Editorial Numerado (01, 02, 03, 04) com fundo colorido terroso ou
      verde sálvia, círculos concêntricos e ponto decorativo.
   ========================================================================== */

import React from 'react';
import { Link } from 'react-router-dom';

/* INÍCIO DO COMPONENTE CARD DE CONTEÚDO */
export default function CardConteudo({
  id,                                     // ID do artigo para a rota /artigo/:id
  seloSuperior = 'GUIA ESSENCIAL',        // Pílula branca no canto superior esquerdo da capa
  imagemCapa = null,                      // Se fornecido, exibe imagem; caso contrário exibe banner numerado
  numeroEditorial = '01',                 // Número em Fraunces itálico exibido quando não há foto
  corTopo = '#9C7A63',                    // Cor de fundo do topo editorial numerado
  iconeCategoria = '🐾',                  // Ícone ao lado do nome da categoria
  categoria = 'Com o Lufy',               // Nome da trilha/categoria
  tempoLeitura = '6 min de leitura',      // Estimativa de leitura
  titulo,                                 // Título em Fraunces
  resumo,                                 // Descrição empática
  textoBotao = 'Ler conteúdo',            // Texto à esquerda do rodapé
  destaqueSetaSolida = false,             // Se verdadeiro, o botão circular ↗ já aparece preenchido em verde
}) {
  return (
    <Link to={`/artigo/${id}`} className="biblioteca-card">
      {/* INÍCIO DO TOPO VISUAL (FOTO OU BANNER NUMERADO 01..04) */}
      <div>
        <div
          className="biblioteca-card__topo"
          style={{
            backgroundColor: corTopo,
          }}
        >
          {/* Pílula branca flutuante no canto superior esquerdo */}
          <span
            style={{
              position: 'absolute',
              top: '1.15rem',
              left: '1.15rem',
              zIndex: 3,
              backgroundColor: 'var(--cor-superficie)',
              color: 'var(--cor-texto)',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '0.4rem 0.9rem',
              borderRadius: 'var(--raio-pilula)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}
          >
            {seloSuperior}
          </span>

          {imagemCapa ? (
            /* Variante com Imagem Ilustrativa / 3D */
            <img
              src={imagemCapa}
              alt={titulo}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            /* Variante Editorial Numerada (01, 02, 03, 04) idêntica ao protótipo */
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                padding: '1.35rem 1.5rem',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
              }}
            >
              {/* Círculos concêntricos sutis no canto superior direito */}
              <div className="biblioteca-card__circulos-deco" aria-hidden="true" />

              {/* Grande número em Fraunces itálico claro */}
              <span
                className="serif-title"
                style={{
                  fontSize: '4.4rem',
                  fontStyle: 'italic',
                  color: 'rgba(246, 243, 238, 0.88)',
                  lineHeight: 0.9,
                }}
              >
                {numeroEditorial}
              </span>

              {/* Pontinho marfim no canto inferior direito do banner */}
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(246, 243, 238, 0.85)',
                }}
                aria-hidden="true"
              />
            </div>
          )}
        </div>

        {/* INÍCIO DO CORPO TEXTUAL DO CARD */}
        <div style={{ padding: '1.65rem 1.75rem 0' }}>
          {/* Metadados: Categoria à esquerda e tempo de leitura à direita */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              marginBottom: '0.8rem',
              fontSize: '0.82rem',
            }}
          >
            <span
              style={{
                fontWeight: 700,
                color: 'var(--cor-primaria)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span aria-hidden="true">{iconeCategoria}</span>
              <span>{categoria}</span>
            </span>

            <span style={{ color: 'var(--cor-texto-suave)' }}>
              {tempoLeitura}
            </span>
          </div>

          {/* Título em Fraunces */}
          <h3
            style={{
              fontSize: '1.45rem',
              marginBottom: '0.75rem',
              lineHeight: 1.25,
            }}
          >
            {titulo}
          </h3>

          {/* Resumo empático */}
          <p
            style={{
              fontSize: '0.94rem',
              color: 'var(--cor-texto-suave)',
              marginBottom: '1.5rem',
            }}
          >
            {resumo}
          </p>
        </div>
        {/* FIM DO CORPO TEXTUAL DO CARD */}
      </div>

      {/* INÍCIO DO RODAPÉ DO CARD ("Ler conteúdo" + botão circular ↗) */}
      <div style={{ padding: '0 1.75rem 1.5rem' }}>
        <div
          style={{
            borderTop: '1px solid var(--cor-borda-suave)',
            paddingTop: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: '0.92rem',
              color: 'var(--cor-cta)',
            }}
          >
            {textoBotao}
          </span>

          <span
            className={`biblioteca-card__seta-btn ${
              destaqueSetaSolida ? 'biblioteca-card__seta-btn--solido' : ''
            }`}
            aria-hidden="true"
          >
            ↗
          </span>
        </div>
      </div>
      {/* FIM DO RODAPÉ DO CARD */}
    </Link>
  );
}
/* FIM DO COMPONENTE CARD DE CONTEÚDO */
