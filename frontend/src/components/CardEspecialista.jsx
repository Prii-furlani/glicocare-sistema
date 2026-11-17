/* ==========================================================================
   ARQUIVO: CardEspecialista.jsx
   COMPONENTE: CardEspecialista (Card Reutilizável da Rede de Especialistas)
   OBJETIVO: Exibir o card individual de cada especialista no Marketplace de
   Saúde Integrada GlicoCare com layout limpo em Branco Acolhedor (#F6F3EE),
   foto redonda, nome, especialidade principal, CRM/Registro, selo de
   verificação ativa (RN-MOD-MKT), tags de foco clínico e botão "Ver Perfil
   e Agendar ↗".
   ========================================================================== */

import React from 'react';
import { Link } from 'react-router-dom';

/* INÍCIO DO COMPONENTE CARD DE ESPECIALISTA */
export default function CardEspecialista({
  id,                                     // ID do profissional para a rota /especialistas/:id
  nome,                                   // Ex: 'Dra. Ana Paula Ribeiro'
  especialidade,                          // Ex: 'ENDOCRINOLOGISTA'
  conselho,                               // Ex: 'CRM-SP 184.290'
  nota = '4.9',                           // Avaliação média da comunidade
  totalAvaliacoes = 94,                   // Quantidade de avaliações verificadas
  fotoUrl,                                // URL/asset da foto de perfil do especialista
  tagsFoco = [],                          // Ex: ['Infância', 'Ajuste de Insulina']
  resumoCurto = '',                       // Descrição sintética da atuação
  valorConsulta = '',                     // Valor transparente da consulta integrada
  ofereceRetornoIncluso = true,           // Política de retorno gratuito incluso (RN-AGD-RETORNO)
  prazoRetornoDias = 30,                  // Janela em dias para usufruir do retorno
  textoBotao = 'Ver Perfil e Agendar',    // Rótulo do botão CTA inferior
}) {
  return (
    <article
      className="especialista-card"
      style={{
        backgroundColor: 'var(--cor-superficie)', // Branco Acolhedor / Marfim (#F6F3EE)
      }}
    >
      {/* INÍCIO DO TOPO E DADOS DO PROFISSIONAL */}
      <div>
        {/* Linha superior: Foto redonda à esquerda + Selo de verificação (✓) à direita */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '0.75rem',
            marginBottom: '1.15rem',
          }}
        >
          <img
            src={fotoUrl}
            alt={nome}
            style={{
              width: 84,
              height: 84,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid var(--cor-fundo)',
              boxShadow: '0 4px 14px rgba(46, 40, 36, 0.09)',
              backgroundColor: 'var(--cor-fundo)',
            }}
          />

          {/* Selo de verificação ativa do Conselho (RN-MOD-MKT) */}
          <span
            title="Conselho profissional ativo e verificado pela curadoria GlicoCare"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#E4EFE4',
              color: 'var(--cor-cta)',
              border: '1px solid #BCD5BF',
              borderRadius: 'var(--raio-pilula)',
              padding: '0.32rem 0.75rem',
              fontSize: '0.72rem',
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                backgroundColor: 'var(--cor-cta)',
                color: 'var(--cor-branco)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.68rem',
              }}
            >
              ✓
            </span>
            <span>Conselho Verificado</span>
          </span>
        </div>

        {/* Especialidade principal em caixa alta Terracota (#7C533F) */}
        <span
          style={{
            display: 'block',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--cor-primaria)',
            marginBottom: '0.3rem',
          }}
        >
          {especialidade}
        </span>

        {/* Nome do profissional em fonte serifada Fraunces */}
        <h3 style={{ fontSize: '1.48rem', marginBottom: '0.2rem' }}>{nome}</h3>

        {/* Registro no conselho de classe (CRM / CRN / CRP / CREF) */}
        <p
          style={{
            fontSize: '0.86rem',
            fontWeight: 600,
            color: 'var(--cor-texto-suave)',
            marginBottom: resumoCurto || tagsFoco.length > 0 ? '0.85rem' : '1.2rem',
          }}
        >
          Registro ativo: {conselho}
        </p>

        {/* Breve descrição do foco clínico */}
        {resumoCurto && (
          <p
            style={{
              fontSize: '0.9rem',
              lineHeight: 1.55,
              color: 'var(--cor-texto)',
              marginBottom: '0.9rem',
            }}
          >
            {resumoCurto}
          </p>
        )}

        {/* Tags de Foco (Ex: Infância, Ajuste de Insulina, Esporte, Emagrecimento) */}
        {tagsFoco && tagsFoco.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.4rem',
              marginBottom: '1.15rem',
            }}
          >
            {tagsFoco.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--cor-fundo)',
                  color: 'var(--cor-primaria)',
                  border: '1px solid var(--cor-borda-suave)',
                  borderRadius: 'var(--raio-pilula)',
                  padding: '0.22rem 0.7rem',
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {/* FIM DO TOPO E DADOS DO PROFISSIONAL */}

      {/* INÍCIO DA AVALIAÇÃO E BOTÃO "VER PERFIL E AGENDAR" */}
      <div>
        <div
          style={{
            borderTop: '1px solid var(--cor-borda-suave)',
            paddingTop: '0.9rem',
            marginBottom: '1rem',
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ color: 'var(--cor-primaria)' }} aria-hidden="true">
              ★
            </span>
            <strong style={{ color: 'var(--cor-texto)' }}>{nota}</strong>
            <span style={{ color: 'var(--cor-texto-suave)' }}>
              ({totalAvaliacoes} avaliações)
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            {valorConsulta && (
              <span
                style={{
                  display: 'block',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: 'var(--cor-cta)',
                }}
              >
                Consulta online: {valorConsulta}
              </span>
            )}
            {ofereceRetornoIncluso && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#2D6337',
                  backgroundColor: '#EDF7EE',
                  border: '1px solid #C4E5C7',
                  borderRadius: '12px',
                  padding: '0.15rem 0.55rem',
                  marginTop: '0.25rem',
                }}
              >
                ✓ Inclui 1 retorno em até {prazoRetornoDias} dias
              </span>
            )}
          </div>
        </div>

        {/* Barra de ação em Verde Alívio (#3B7E48) */}
        <Link to={`/especialistas/${id}`} className="especialista-cta-bar">
          <span>{textoBotao}</span>
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
      {/* FIM DA AVALIAÇÃO E BOTÃO DE PERFIL/AGENDA */}
    </article>
  );
}
/* FIM DO COMPONENTE CARD DE ESPECIALISTA */
