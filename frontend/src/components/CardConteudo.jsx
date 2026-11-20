/* ==========================================================================
   ARQUIVO: CardConteudo.jsx
   COMPONENTE: CardConteudo (Card Reutilizável da Biblioteca GlicoCare)
   OBJETIVO: Renderizar fielmente os dois estilos de Card de Conteúdo:
   1. Card com Foto de Capa (quando há imagem anexada e carregada com sucesso);
   2. Capa Editorial Padrão (CapaEditorialDefault) quando imagem_capa_url for
      nulo/vazio ou disparar erro de carregamento (onError).
   ========================================================================== */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CapaEditorialDefault from './CapaEditorialDefault';

/* INÍCIO DO COMPONENTE CARD DE CONTEÚDO */
export default function CardConteudo({
  id,                                     // ID do artigo para a rota /artigo/:id
  seloSuperior = 'GUIA ESSENCIAL',        // Rótulo do selo (ex: GUIA ESSENCIAL, AUTONOMIA POSSÍVEL)
  imagemCapa = null,                      // Se fornecido e válido, exibe foto; senão CapaEditorialDefault
  numeroEditorial = '01',                 // Número em Fraunces itálico
  corTopo = 'terracota',                  // 'terracota', 'verde', 'carvalho' ou código HEX
  iconeCategoria = '🐾',                  // Ícone ao lado do nome da categoria
  categoria = 'Com o Lufy',               // Nome da trilha/categoria
  tempoLeitura = '6 min de leitura',      // Estimativa de leitura
  titulo,                                 // Título em Fraunces
  resumo,                                 // Descrição empática
  textoBotao = 'Ler conteúdo',            // Texto à esquerda do rodapé
  destaqueSetaSolida = false,             // Se verdadeiro, botão circular aparece preenchido
  selo_editorial,                         // Compatibilidade com schema do banco de dados
  imagem_capa_url,                        // Compatibilidade com schema do banco de dados
  cor_capa_default,                       // Compatibilidade com schema do banco de dados
}) {
  const [erroCarregamentoImagem, setErroCarregamentoImagem] = useState(false);

  const seloFinal = seloSuperior || selo_editorial || 'GUIA ESSENCIAL';
  const fotoUrl = imagemCapa || imagem_capa_url || null;
  const corFinal = corTopo || cor_capa_default || 'terracota';

  // Determina se deve exibir imagem fotográfica ou a Capa Editorial Padrão
  const temFotoValida = Boolean(fotoUrl && !erroCarregamentoImagem);

  return (
    <Link to={`/artigo/${id}`} className="biblioteca-card">
      {/* INÍCIO DO TOPO VISUAL (FOTO OU CAPA EDITORIAL PADRÃO) */}
      <div>
        <div className="biblioteca-card__topo">
          {temFotoValida ? (
            /* Variante com Imagem Fotográfica / Ilustração */
            <>
              {/* Pílula branca flutuante no canto superior esquerdo sobre a foto */}
              <span
                style={{
                  position: 'absolute',
                  top: '1.15rem',
                  left: '1.15rem',
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
                }}
              >
                {seloFinal}
              </span>

              <img
                src={fotoUrl}
                alt={titulo}
                onError={() => setErroCarregamentoImagem(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </>
          ) : (
            /* Variante Capa Editorial Padrão Oficial ("Porto Seguro") */
            <CapaEditorialDefault
              selo={seloFinal}
              numero={numeroEditorial || id}
              cor={corFinal}
              categoria={categoria}
              variante="card"
            />
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
