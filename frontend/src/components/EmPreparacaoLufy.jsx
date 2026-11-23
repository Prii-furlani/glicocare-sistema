/* ==========================================================================
   ARQUIVO: EmPreparacaoLufy.jsx (Localização: frontend/src/components/EmPreparacaoLufy.jsx)
   PROJETO: GlicoCare — Sistema Integrado de Apoio ao DM1
   OBJETIVO: Tela de aviso acolhedor "Em Preparação / Em Construção" no tom
             afetuoso do Mascote Lufy para funcionalidades da Fase 2
             (Teleatendimentos, Especialistas e Pagamentos/Pix).
   DESIGN SYSTEM: "Porto Seguro" (Compatível com Tema Claro e Dark Mode,
                  Fraunces + Plus Jakarta Sans, Terracota e Verde Alívio).
   ========================================================================== */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import lufyMascoteFoto from '../assets/lufy-mascote.jpg';

export default function EmPreparacaoLufy({ tituloCustomizado, subtituloCustomizado }) {
  const { usuario } = useAuth();

  // Redirecionamento inteligente do botão secundário para usuários logados vs visitantes
  const rotaCuidadoDiario = usuario
    ? (usuario.tipo_usuario === 'cuidador' ? '/painel-cuidador' : '/meu-perfil')
    : '/cadastro';

  return (
    <div
      style={{
        backgroundColor: 'var(--cor-fundo, #EAE4D9)',
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        color: 'var(--cor-texto, #2E2824)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: '720px',
          width: '100%',
          backgroundColor: 'var(--cor-superficie, #F6F3EE)',
          borderRadius: '24px',
          padding: 'clamp(2rem, 5vw, 3.5rem)',
          boxShadow: '0 20px 40px rgba(46, 40, 36, 0.08)',
          border: '1px solid rgba(124, 83, 63, 0.15)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Faixa / Selo Superior Acolhedor */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(59, 126, 72, 0.12)',
            color: 'var(--cor-cta, #3B7E48)',
            padding: '6px 16px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '1.75rem',
            border: '1px solid rgba(59, 126, 72, 0.25)',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--cor-cta, #3B7E48)',
              display: 'inline-block',
            }}
          />
          EM PREPARAÇÃO COM CARINHO
        </div>

        {/* Avatar e Ilustração do Lufy */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              padding: '4px',
              backgroundColor: 'var(--cor-fundo, #EAE4D9)',
              border: '2px solid rgba(124, 83, 63, 0.25)',
              boxShadow: '0 8px 24px rgba(46, 40, 36, 0.12)',
            }}
          >
            <img
              src={lufyMascoteFoto}
              alt="Lufy, o coala mascote guardião do GlicoCare"
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
            {/* Sensor simbólico de carinho / Libre */}
            <span
              title="Sensor de Cuidado do Lufy"
              style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                backgroundColor: 'var(--cor-cta, #3B7E48)',
                color: '#FFFFFF',
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                border: '2px solid var(--cor-superficie, #F6F3EE)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}
            >
              🌿
            </span>
          </div>
        </div>

        {/* Título Principal em Fraunces Serifada */}
        <h1
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 'clamp(1.75rem, 4vw, 2.35rem)',
            fontWeight: '600',
            lineHeight: 1.25,
            color: 'var(--cor-titulo, #7C533F)',
            marginBottom: '1.25rem',
            marginInline: 'auto',
          }}
        >
          {tituloCustomizado || 'Estamos preparando uma rede que realmente acolhe.'}
        </h1>

        {/* Mensagem no Tom de Voz do Lufy (Coala Guardião) */}
        <div
          style={{
            backgroundColor: 'var(--cor-fundo, #EAE4D9)',
            borderRadius: '16px',
            padding: '1.5rem',
            borderLeft: '4px solid var(--cor-cta, #3B7E48)',
            textAlign: 'left',
            marginBottom: '2rem',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.65,
              color: 'var(--cor-texto, #2E2824)',
              margin: 0,
            }}
          >
            {subtituloCustomizado || (
              <>
                <strong>Oi, aqui é o Lufy!</strong> Respire fundo: estamos cuidando de cada detalhe clínico e ético para conectar você a especialistas que entendem a rotina do diabetes com calma e respeito. Enquanto preparamos esse espaço, nossos conteúdos práticos, seu diário de glicemia e sua central de exames já estão abertos para acompanhar você hoje.
              </>
            )}
          </p>
        </div>

        {/* Pilares Ativos Disponíveis Hoje */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '2.25rem',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid rgba(124, 83, 63, 0.12)',
            }}
          >
            <div style={{ fontSize: '1.25rem', marginBottom: '4px' }}>📚</div>
            <strong style={{ fontSize: '0.875rem', color: 'var(--cor-titulo, #7C533F)' }}>
              Biblioteca & Guias
            </strong>
            <p style={{ fontSize: '0.8rem', color: '#665B53', margin: '4px 0 0' }}>
              Artigos práticos de alimentação, escola e autocuidado.
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid rgba(124, 83, 63, 0.12)',
            }}
          >
            <div style={{ fontSize: '1.25rem', marginBottom: '4px' }}>🩸</div>
            <strong style={{ fontSize: '0.875rem', color: 'var(--cor-titulo, #7C533F)' }}>
              Diário & Insulina (IOB)
            </strong>
            <p style={{ fontSize: '0.8rem', color: '#665B53', margin: '4px 0 0' }}>
              Controle de doses, sensibilidade e prevenção de hipos.
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid rgba(124, 83, 63, 0.12)',
            }}
          >
            <div style={{ fontSize: '1.25rem', marginBottom: '4px' }}>📑</div>
            <strong style={{ fontSize: '0.875rem', color: 'var(--cor-titulo, #7C533F)' }}>
              Central de Exames
            </strong>
            <p style={{ fontSize: '0.8rem', color: '#665B53', margin: '4px 0 0' }}>
              Histórico de HbA1c, laudos laboratoriais e cartão escolar.
            </p>
          </div>
        </div>

        {/* Botões de Redirecionamento Útil */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
          }}
        >
          {/* Botão Principal Verde Alívio */}
          <Link
            to="/conteudos"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--cor-cta, #3B7E48)',
              color: '#FFFFFF',
              padding: '12px 28px',
              borderRadius: '9999px',
              fontSize: '0.95rem',
              fontWeight: '600',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(59, 126, 72, 0.28)',
              transition: 'transform 0.15s ease, background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2D6337')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--cor-cta, #3B7E48)')}
          >
            Explorar Conteúdos e Guias →
          </Link>

          {/* Botão Secundário Discreto */}
          <Link
            to={rotaCuidadoDiario}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'transparent',
              color: 'var(--cor-titulo, #7C533F)',
              padding: '12px 22px',
              borderRadius: '9999px',
              fontSize: '0.92rem',
              fontWeight: '600',
              textDecoration: 'none',
              border: '1px solid rgba(124, 83, 63, 0.3)',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(124, 83, 63, 0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {usuario ? 'Ir para Meu Cuidado Diário' : 'Criar Conta de Cuidado Grátis'}
          </Link>
        </div>

        {/* Rodapé empático */}
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(124, 83, 63, 0.12)',
            fontSize: '0.78rem',
            color: '#7C6F64',
          }}
        >
          Fase 1 do GlicoCare ativa • Teleatendimentos e rede de especialistas em homologação ética (CFM 2.314/2022).
        </div>
      </div>
    </div>
  );
}
