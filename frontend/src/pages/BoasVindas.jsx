/* ==========================================================================
   ARQUIVO: BoasVindas.jsx (Localização: /frontend/src/pages/BoasVindas.jsx)
   OBJETIVO: Etapa 2 do onboarding acolhedor da GlicoCare — Tela Pós-Cadastro
             perguntando se o usuário prefere "Configurar agora" ou "Configurar depois".
   REGRAS DE NEGÓCIO ATENDIDAS:
     - RN-ACC-01: Transição suave pós-cadastro sem impor atrito ao usuário.
     - Design System "Porto Seguro" com o mascote Lufy e botões pílula.
   ========================================================================== */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import mascoteLufy from '../assets/lufy-mascote.jpg';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

/* INÍCIO DO COMPONENTE BOASVINDAS */
export default function BoasVindas() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const primeiroNome = usuario?.nome_completo?.split(' ')[0] || 'amigo(a)';

  /**
   * Conduz o usuário para o formulário de personalização
   */
  const handleConfigurarAgora = () => {
    navigate('/configurar-perfil');
  };

  /**
   * Leva direto para a página pessoal com o banner discreto de lembrar mais tarde
   */
  const handleConfigurarDepois = async () => {
    try {
      const token = localStorage.getItem('glicocare_token') || sessionStorage.getItem('glicocare_token');
      if (token) {
        await fetch('/backend/api/perfil/index.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ configurar_depois: true }),
        });
      }
    } catch (e) {
      // Ignora falha de rede e prossegue normalmente
    }
    navigate('/meu-perfil');
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 140px)',
        backgroundColor: 'var(--cor-fundo)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          backgroundColor: 'var(--cor-superficie)',
          borderRadius: '24px',
          padding: '3rem 2.5rem',
          textAlign: 'center',
          boxShadow: '0 16px 40px rgba(46, 40, 36, 0.08)',
          border: '1px solid rgba(124, 83, 63, 0.15)',
        }}
      >
        {/* Mascote Lufy com selo acolhedor */}
        <div style={{ display: 'inline-block', position: 'relative', marginBottom: '1.5rem' }}>
          <img
            src={mascoteLufy}
            alt="Lufy Mascote GlicoCare com Sensor"
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid #3B7E48',
              boxShadow: '0 8px 24px rgba(59, 126, 72, 0.2)',
            }}
          />
          <span
            style={{
              position: 'absolute',
              bottom: '0',
              right: '-6px',
              backgroundColor: '#3B7E48',
              color: '#FFF',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
            }}
          >
            ✓
          </span>
        </div>

        {/* Tag de boas-vindas */}
        <div>
          <span
            style={{
              display: 'inline-block',
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#7C533F',
              backgroundColor: '#EAE4D9',
              padding: '0.3rem 0.85rem',
              borderRadius: '20px',
              marginBottom: '1rem',
            }}
          >
            — Boas-vindas à Família GlicoCare
          </span>
        </div>

        {/* Saudação calorosa e humana */}
        <h1
          style={{
            fontFamily: 'var(--fonte-titulo)',
            fontSize: '2rem',
            color: 'var(--cor-texto)',
            marginBottom: '0.75rem',
            lineHeight: 1.25,
          }}
        >
          Que alegria ter você aqui, {primeiroNome}!
        </h1>

        <p
          style={{
            fontSize: '1rem',
            color: '#5A5049',
            lineHeight: 1.6,
            marginBottom: '2rem',
            maxWidth: '500px',
            margin: '0 auto 2rem',
          }}
        >
          Sua conta já está ativa e segura. O GlicoCare nasceu para ser seu porto seguro:
          um espaço onde o diabetes é compreendido com empatia, método e leveza.
        </p>

        {/* Card explicativo sobre a personalização */}
        <div
          style={{
            backgroundColor: '#FFF',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            textAlign: 'left',
            marginBottom: '2.25rem',
            border: '1px solid rgba(124, 83, 63, 0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
            <span style={{ fontSize: '1.1rem' }}>✨</span>
            <strong style={{ fontSize: '0.94rem', color: '#2E2824' }}>
              Personalize para ter uma experiência sob medida:
            </strong>
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: '1.4rem',
              fontSize: '0.88rem',
              color: '#5A5049',
              lineHeight: 1.6,
            }}
          >
            <li>Seu tipo de diabetes e terapia de insulina em uso</li>
            <li>Fatores que impactam sua glicemia (estresse, calor, exercícios)</li>
            <li>Orientações específicas de saúde e sensibilidade biológica</li>
          </ul>
        </div>

        {/* A pergunta central com as duas escolhas */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2
            style={{
              fontFamily: 'var(--fonte-titulo)',
              fontSize: '1.25rem',
              color: '#7C533F',
              marginBottom: '1.25rem',
            }}
          >
            Quer personalizar seu perfil de cuidado agora ou prefere fazer isso depois?
          </h2>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              alignItems: 'center',
            }}
          >
            {/* Opção 1: Configurar Agora */}
            <Button
              variante="primario"
              onClick={handleConfigurarAgora}
              style={{
                width: '100%',
                maxWidth: '380px',
                padding: '0.95rem 1.5rem',
                fontSize: '1rem',
                fontWeight: 700,
              }}
            >
              Configurar agora →
            </Button>

            {/* Opção 2: Configurar Depois */}
            <button
              type="button"
              onClick={handleConfigurarDepois}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#6A5E57',
                fontSize: '0.92rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0.5rem 1rem',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                transition: 'color 0.2s',
              }}
            >
              Prefiro configurar depois e ir direto para o Meu Espaço
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
/* FIM DO COMPONENTE BOASVINDAS */
