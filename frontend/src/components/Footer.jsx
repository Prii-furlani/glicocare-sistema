/* ==========================================================================
   ARQUIVO: Footer.jsx
   COMPONENTE: Footer (Rodapé Oficial Fiel à Imagem media_1794449307069_f990c009.png)
   OBJETIVO: Exibir o rodapé institucional idêntico ao protótipo enviado:
   - Coluna 1: Selo circular do Lufy + "GlicoCare" + descrição;
   - Coluna 2 ("NAVEGUE"): Início, Diferenciais, Biblioteca / Conteúdos,
     Especialistas, Planos, Perguntas frequentes;
   - Coluna 3 ("VAMOS CONVERSAR"): contato@glicocare.com.br sublinhado +
     "Conteúdo responsável, humano e feito para a vida real.";
   - Barra inferior: "© 2026 GlicoCare. Todos os direitos reservados." à
     esquerda e aviso de suporte pedagógico e médico à direita.
   ========================================================================== */

import React from 'react';
import { Link } from 'react-router-dom';
import logoGlicoCare from '../assets/logo-glicocare.jpg';

/* INÍCIO DO COMPONENTE FOOTER */
export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: '#DFD8CA', // Tom bege fendi suave idêntico à imagem do rodapé
        borderTop: '1px solid var(--cor-borda)',
        padding: '4rem 0 2.5rem',
      }}
    >
      <div className="container">
        {/* INÍCIO DAS 3 COLUNAS DO RODAPÉ */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2.5rem',
            marginBottom: '3.25rem',
          }}
        >
          {/* Coluna 1: Selo Oficial + GlicoCare + Propósito */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                marginBottom: '1.15rem',
              }}
            >
              <img
                src={logoGlicoCare}
                alt="Selo Oficial GlicoCare com o coala Lufy"
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid var(--cor-borda)',
                  backgroundColor: 'var(--cor-superficie)',
                }}
              />
              <span
                className="serif-title"
                style={{
                  fontSize: '1.55rem',
                  fontWeight: 700,
                  color: 'var(--cor-texto)',
                }}
              >
                GlicoCare
              </span>
            </div>
            <p
              style={{
                fontSize: '0.95rem',
                color: 'var(--cor-texto-suave)',
                maxWidth: 380,
                lineHeight: 1.65,
              }}
            >
              Um porto seguro de informação, apoio pedagógico e acolhimento
              prático para famílias que vivem o DM1.
            </p>
          </div>

          {/* Coluna 2: NAVEGUE */}
          <div>
            <span
              style={{
                display: 'block',
                fontSize: '0.74rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--cor-primaria)',
                marginBottom: '1.1rem',
              }}
            >
              NAVEGUE
            </span>
            <ul
              style={{
                listStyle: 'none',
                display: 'grid',
                gap: '0.7rem',
                fontSize: '0.94rem',
                fontWeight: 700,
                color: 'var(--cor-texto)',
              }}
            >
              <li>
                <a href="/#inicio">Início</a>
              </li>
              <li>
                <a href="/#diferenciais">Diferenciais</a>
              </li>
              <li>
                <a href="/#conteudos">Biblioteca / Conteúdos</a>
              </li>
              <li>
                <Link to="/especialistas">Especialistas</Link>
              </li>
              <li>
                <a href="/#planos">Planos</a>
              </li>
              <li>
                <a href="/#faq">Perguntas frequentes</a>
              </li>
              <li>
                <Link
                  to="/admin"
                  style={{
                    color: 'var(--cor-primaria)',
                    fontSize: '0.88rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    marginTop: '0.25rem',
                  }}
                  title="Acesso restrito ao Painel Administrativo e CMS da Home"
                >
                  ⚙️ Painel Admin & CMS
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: VAMOS CONVERSAR */}
          <div>
            <span
              style={{
                display: 'block',
                fontSize: '0.74rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--cor-primaria)',
                marginBottom: '1.1rem',
              }}
            >
              VAMOS CONVERSAR
            </span>

            <a
              href="mailto:contato@glicocare.com.br"
              className="serif-title"
              style={{
                display: 'inline-block',
                fontSize: '1.22rem',
                fontWeight: 700,
                color: 'var(--cor-texto)',
                borderBottom: '1.5px solid var(--cor-primaria)',
                paddingBottom: '0.15rem',
                marginBottom: '1rem',
              }}
            >
              contato@glicocare.com.br
            </a>

            <p
              style={{
                fontSize: '0.94rem',
                color: 'var(--cor-texto-suave)',
                maxWidth: 290,
              }}
            >
              Conteúdo responsável, humano e feito para a vida real.
            </p>
          </div>
        </div>
        {/* FIM DAS 3 COLUNAS DO RODAPÉ */}

        {/* INÍCIO DA BARRA INFERIOR DE DIREITOS E AVISO MÉDICO */}
        <div
          style={{
            borderTop: '1px solid var(--cor-borda)',
            paddingTop: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1.25rem',
            fontSize: '0.8rem',
            color: 'var(--cor-texto-suave)',
          }}
        >
          <span>© 2026 GlicoCare. Todos os direitos reservados.</span>

          <span style={{ maxWidth: 620, textAlign: 'right' }}>
            A GlicoCare oferece suporte pedagógico e acolhimento. Nossos
            conteúdos não substituem diagnóstico, prescrição ou acompanhamento
            médico.
          </span>
        </div>
        {/* FIM DA BARRA INFERIOR */}
      </div>
    </footer>
  );
}
/* FIM DO COMPONENTE FOOTER */
