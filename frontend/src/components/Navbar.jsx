/* ==========================================================================
   ARQUIVO: Navbar.jsx
   COMPONENTE: Navbar (Navegação Responsiva Distinta Desktop / Mobile / Leitura)
   OBJETIVO: Aplicar a experiência de navegação responsiva da plataforma
   GlicoCare em 3 modos distintos:
   1. COMPUTADOR (Desktop > 980px):
      - Barra fixa no topo (sticky), logo oficial com selo do Lufy à esquerda;
      - Links horizontais visíveis ("Início", "Diferenciais",
        "Biblioteca / Conteúdos", "Especialistas", "Planos", "FAQ");
      - Botão CTA em destaque à extrema direita ("Baixar guia gratuito");
      - Sem botão de menu hambúrguer no Desktop;
      - Rolagem suave (smooth scroll) sem saltos confusos para seções internas.
   2. CELULAR (Mobile <= 980px):
      - Logo à esquerda e botão de Menu Hambúrguer (três linhas) à direita;
      - Gaveta (overlay) em tom de marfim suave (#F6F3EE) com a lista completa
        de navegação vertical e o botão de destaque na parte inferior.
   3. NAVBAR INTERNA DE LEITURA (/artigo/:id):
      - Navbar limpa contendo apenas a logo da GlicoCare à esquerda e o botão
        secundário "← Voltar à biblioteca" à direita.
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoGlicoCare from '../assets/logo-glicocare.jpg';
import Button from './Button';
import { useAuth } from '../context/AuthContext';

/* INÍCIO DO COMPONENTE NAVBAR */
export default function Navbar() {
  // Contexto de autenticação e controle de perfis (RN-ACC-01)
  const { usuario, estaAutenticado, logout } = useAuth();

  // Controla a abertura e fechamento da gaveta (overlay) no Mobile
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Controla a barra de aviso de liberação imediata do Guia Gratuito
  const [guiaAvisoAberto, setGuiaAvisoAberto] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Rota e rótulo do painel de acordo com o perfil logado (4 Perfis GlicoCare)
  const obterDadosPerfil = () => {
    if (!usuario) return { rota: '/login', badge: '', icone: '👤', rotulo: 'Entrar' };
    const p = usuario.tipo_usuario || usuario.papel || usuario.tipo_perfil || usuario.tipo;
    if (p === 'admin' || p === 'admin_moderador') {
      return { rota: '/painel-admin', badge: 'Curadoria', icone: '🛡️', rotulo: 'Painel Curadoria' };
    }
    if (p === 'especialista') {
      return { rota: '/painel-especialista', badge: 'Especialista', icone: '🩺', rotulo: 'Meu Painel' };
    }
    if (p === 'cuidador') {
      return { rota: '/meu-perfil', badge: 'Cuidador', icone: '🤝', rotulo: 'Meu Espaço' };
    }
    if (p === 'diabetico') {
      return { rota: '/meu-perfil', badge: 'Diabético', icone: '🌱', rotulo: 'Meu Espaço' };
    }
    return { rota: '/meu-perfil', badge: 'Família DM1', icone: '🏠', rotulo: 'Meu Espaço' };
  };

  const perfilInfo = obterDadosPerfil();

  // Verifica se o usuário está em uma página interna de leitura de artigo (/artigo/:id)
  const isArticlePage = location.pathname.startsWith('/artigo/');

  // Fecha automaticamente a gaveta mobile ao trocar de rota
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname, location.hash]);

  /**
   * Direciona suavemente para uma seção da Landing Page (#inicio, #diferenciais,
   * #conteudos, #especialistas-home, #planos, #faq) sem saltos bruscos,
   * funcionando mesmo quando o usuário parte de outra rota (/biblioteca, /especialistas).
   */
  const handleNavegarSecaoSuave = (e, idSecao) => {
    e.preventDefault();
    setDrawerOpen(false);

    const rolarParaElemento = () => {
      const elemento = document.getElementById(idSecao);
      if (elemento) {
        elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    if (location.pathname !== '/') {
      navigate('/');
      // Aguarda a montagem da Home antes de realizar a rolagem suave
      setTimeout(rolarParaElemento, 80);
    } else {
      rolarParaElemento();
    }
  };

  /* ========================================================================
     3. NAVBAR INTERNA DE LEITURA (PÁGINA DE ARTIGO / BLOG — /artigo/:id)
        Exibe apenas a logo da GlicoCare à esquerda e o botão secundário
        "← Voltar à biblioteca" à direita.
     ======================================================================== */
  if (isArticlePage) {
    return (
      <header className="gc-navbar gc-navbar--leitura">
        <div className="container gc-navbar__inner">
          {/* Logo oficial da GlicoCare à esquerda */}
          <Link to="/" className="gc-navbar__brand">
            <img
              src={logoGlicoCare}
              alt="Logo GlicoCare — Selo Oficial do Lufy"
              className="gc-navbar__logo-img"
            />
            <div>
              <span className="serif-title gc-navbar__brand-title">
                GlicoCare
              </span>
              <span className="gc-navbar__brand-subtitle">
                APOIO EM DIABETES
              </span>
            </div>
          </Link>

          {/* Botão secundário "← Voltar à biblioteca" à direita */}
          <Link to="/biblioteca" className="gc-navbar__btn-voltar">
            <span aria-hidden="true">←</span>
            <span>Voltar à biblioteca</span>
          </Link>
        </div>
      </header>
    );
  }
  /* FIM DA NAVBAR INTERNA DE LEITURA */

  /* ========================================================================
     1 & 2. NAVBAR PRINCIPAL RESPONSIVA (DESKTOP HORIZONTAL / MOBILE HAMBÚRGUER)
     ======================================================================== */
  return (
    <header className="gc-navbar">
      <div className="container gc-navbar__inner">
        {/* Esquerda: Logotipo Oficial com o Selo do Lufy e nome "GlicoCare" */}
        <Link
          to="/"
          onClick={(e) => handleNavegarSecaoSuave(e, 'inicio')}
          className="gc-navbar__brand"
        >
          <img
            src={logoGlicoCare}
            alt="Selo Oficial GlicoCare — Apoio em Diabetes"
            className="gc-navbar__logo-img"
          />
          <div>
            <span className="serif-title gc-navbar__brand-title">
              GlicoCare
            </span>
            <span className="gc-navbar__brand-subtitle">
              APOIO EM DIABETES
            </span>
          </div>
        </Link>

        {/* Centro/Direita (Exclusivo Desktop): Barra Horizontal Completa de Links */}
        <nav
          className="gc-navbar__desktop-links"
          aria-label="Navegação principal desktop"
        >
          <a
            href="/#inicio"
            onClick={(e) => handleNavegarSecaoSuave(e, 'inicio')}
            className="gc-navbar__link"
          >
            Início
          </a>
          <a
            href="/#diferenciais"
            onClick={(e) => handleNavegarSecaoSuave(e, 'diferenciais')}
            className="gc-navbar__link"
          >
            Diferenciais
          </a>
          <a
            href="/#conteudos"
            onClick={(e) => handleNavegarSecaoSuave(e, 'conteudos')}
            className="gc-navbar__link"
          >
            Biblioteca / Conteúdos
          </a>
          <Link
            to="/especialistas"
            className={`gc-navbar__link ${
              location.pathname.startsWith('/especialistas')
                ? 'gc-navbar__link--ativo'
                : ''
            }`}
          >
            Especialistas
          </Link>
          <a
            href="/#planos"
            onClick={(e) => handleNavegarSecaoSuave(e, 'planos')}
            className="gc-navbar__link"
          >
            Planos
          </a>
          <a
            href="/#faq"
            onClick={(e) => handleNavegarSecaoSuave(e, 'faq')}
            className="gc-navbar__link"
          >
            FAQ
          </a>

          {/* Link para Tela de Login ou Painel do Perfil Logado (RN-ACC-01) */}
          {estaAutenticado ? (
            <Link
              to={perfilInfo.rota}
              className={`gc-navbar__link ${
                location.pathname === perfilInfo.rota ? 'gc-navbar__link--ativo' : ''
              }`}
              style={{ fontWeight: 600, color: '#3B7E48' }}
            >
              {perfilInfo.icone} {perfilInfo.rotulo}
            </Link>
          ) : (
            <Link
              to="/login"
              className={`gc-navbar__link ${
                location.pathname === '/login' ? 'gc-navbar__link--ativo' : ''
              }`}
              style={{ fontWeight: 600, color: '#3B7E48' }}
            >
              Entrar
            </Link>
          )}
        </nav>

        {/* Extrema Direita (Desktop CTA / Mobile Botão Hambúrguer) */}
        <div className="gc-navbar__actions">
          {/* Autenticação Desktop: Exibe perfil + logout quando autenticado, ou botão entrar */}
          {estaAutenticado ? (
            <div
              className="gc-navbar__user-desktop"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Link
                to={perfilInfo.rota}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: '#2E2824',
                  backgroundColor: '#F6F3EE',
                  border: '1px solid rgba(124, 83, 63, 0.25)',
                  borderRadius: '20px',
                  padding: '0.45rem 0.85rem',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                title={`Acessar ${perfilInfo.rotulo}`}
              >
                <span>{perfilInfo.icone}</span>
                <span>{usuario.nome_completo?.split(' ')[0] || usuario.nome?.split(' ')[0] || 'Usuário'}</span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    backgroundColor: '#EAE4D9',
                    color: '#7C533F',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                  }}
                >
                  {perfilInfo.badge}
                </span>
              </Link>
              <button
                type="button"
                onClick={logout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#A23B2A',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  padding: '0.4rem 0.6rem',
                }}
                title="Encerrar sessão segura"
              >
                Sair
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="gc-navbar__btn-entrar-desktop"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.86rem',
                fontWeight: 600,
                color: '#3B7E48',
                backgroundColor: 'transparent',
                border: '1px solid rgba(59, 126, 72, 0.45)',
                borderRadius: '20px',
                padding: '0.5rem 1rem',
                transition: 'all 0.2s',
              }}
            >
              <span>👤</span>
              <span>Entrar</span>
            </Link>
          )}

          {/* Botão de Ação em Destaque (Exclusivo Desktop — oculto no Mobile) */}
          <div className="gc-navbar__desktop-cta">
            <Button
              variante="primario"
              onClick={() => setGuiaAvisoAberto(true)}
              style={{ padding: '0.68rem 1.35rem', fontSize: '0.88rem' }}
            >
              Baixar guia gratuito →
            </Button>
          </div>

          {/* Botão de Menu Hambúrguer de 3 linhas (Exclusivo Mobile — removido do Desktop) */}
          <button
            type="button"
            className="gc-navbar__hamburger-btn"
            aria-label={
              drawerOpen
                ? 'Fechar menu de navegação'
                : 'Abrir menu de navegação'
            }
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(!drawerOpen)}
          >
            {drawerOpen ? (
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>✕</span>
            ) : (
              <>
                <span className="gc-navbar__hamburger-line" />
                <span className="gc-navbar__hamburger-line" />
                <span className="gc-navbar__hamburger-line" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ====================================================================
          2. GAVETA (OVERLAY) MOBILE EM TOM DE MARFIM SUAVE (#F6F3EE)
             Contém a lista completa de navegação vertical e o botão de
             destaque na parte inferior.
          ==================================================================== */}
      {drawerOpen && (
        <div
          className="gc-navbar__mobile-overlay"
          role="dialog"
          aria-label="Menu de navegação mobile"
        >
          <div className="container gc-navbar__mobile-drawer-content">
            <nav
              aria-label="Links de navegação mobile"
              className="gc-navbar__mobile-nav-list"
            >
              <a
                href="/#inicio"
                onClick={(e) => handleNavegarSecaoSuave(e, 'inicio')}
                className="gc-navbar__mobile-link"
              >
                <span>Início</span>
                <span aria-hidden="true">→</span>
              </a>

              <a
                href="/#diferenciais"
                onClick={(e) => handleNavegarSecaoSuave(e, 'diferenciais')}
                className="gc-navbar__mobile-link"
              >
                <span>Diferenciais</span>
                <span aria-hidden="true">→</span>
              </a>

              <a
                href="/#conteudos"
                onClick={(e) => handleNavegarSecaoSuave(e, 'conteudos')}
                className="gc-navbar__mobile-link"
              >
                <span>Biblioteca / Conteúdos</span>
                <span aria-hidden="true">→</span>
              </a>

              <Link
                to="/especialistas"
                onClick={() => setDrawerOpen(false)}
                className="gc-navbar__mobile-link"
              >
                <span>Especialistas</span>
                <span aria-hidden="true">→</span>
              </Link>

              <a
                href="/#planos"
                onClick={(e) => handleNavegarSecaoSuave(e, 'planos')}
                className="gc-navbar__mobile-link"
              >
                <span>Planos</span>
                <span aria-hidden="true">→</span>
              </a>

              <a
                href="/#faq"
                onClick={(e) => handleNavegarSecaoSuave(e, 'faq')}
                className="gc-navbar__mobile-link"
              >
                <span>FAQ</span>
                <span aria-hidden="true">→</span>
              </a>

              {/* Autenticação Mobile: Usuário logado ou botão de login */}
              {estaAutenticado ? (
                <div
                  style={{
                    backgroundColor: '#EAE4D9',
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                    marginTop: '0.75rem',
                    marginBottom: '0.75rem',
                    border: '1px solid rgba(124, 83, 63, 0.2)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.45rem',
                    }}
                  >
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2E2824' }}>
                      {perfilInfo.icone} Olá, {usuario.nome_completo?.split(' ')[0] || usuario.nome?.split(' ')[0] || 'Usuário'}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        backgroundColor: '#F6F3EE',
                        color: '#7C533F',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '8px',
                        fontWeight: 700,
                      }}
                    >
                      {perfilInfo.badge}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
                    <Link
                      to={perfilInfo.rota}
                      onClick={() => setDrawerOpen(false)}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '0.55rem 0.75rem',
                        backgroundColor: '#3B7E48',
                        color: '#FFF',
                        borderRadius: '8px',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      {perfilInfo.rotulo} →
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setDrawerOpen(false);
                        logout();
                      }}
                      style={{
                        padding: '0.55rem 0.85rem',
                        backgroundColor: 'transparent',
                        border: '1px solid #A23B2A',
                        color: '#A23B2A',
                        borderRadius: '8px',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Sair
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                  <Link
                    to="/login"
                    onClick={() => setDrawerOpen(false)}
                    className="gc-navbar__mobile-link"
                    style={{
                      color: '#3B7E48',
                      fontWeight: 700,
                      backgroundColor: '#EAE4D9',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                    }}
                  >
                    <span>👤 Entrar no meu espaço seguro</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                  <Link
                    to="/cadastro"
                    onClick={() => setDrawerOpen(false)}
                    className="gc-navbar__mobile-link"
                    style={{
                      color: '#7C533F',
                      fontWeight: 700,
                      backgroundColor: '#F6F3EE',
                      border: '1px solid rgba(124, 83, 63, 0.25)',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                    }}
                  >
                    <span>🌱 Criar conta gratuita</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              )}

              <hr className="gc-navbar__mobile-divider" />

              <Link
                to="/biblioteca"
                onClick={() => setDrawerOpen(false)}
                className="gc-navbar__mobile-sublink"
              >
                📚 Acessar Acervo Completo da Biblioteca
              </Link>

              <Link
                to="/credenciamento"
                onClick={() => setDrawerOpen(false)}
                className="gc-navbar__mobile-sublink"
              >
                ✓ Seja um Especialista GlicoCare (Credenciamento)
              </Link>
            </nav>

            {/* Botão de Destaque na Parte Inferior da Gaveta Mobile */}
            <div className="gc-navbar__mobile-cta-footer">
              <Button
                variante="primario"
                style={{ width: '100%', padding: '0.9rem 1.4rem' }}
                onClick={() => {
                  setDrawerOpen(false);
                  setGuiaAvisoAberto(true);
                }}
              >
                Baixar guia gratuito →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Aviso acolhedor ao clicar em "Baixar guia gratuito" */}
      {guiaAvisoAberto && (
        <div
          style={{
            backgroundColor: 'var(--cor-cta-suave)',
            borderTop: '1px solid var(--cor-cta)',
            padding: '0.75rem var(--espaco-lg)',
          }}
        >
          <div
            className="container"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
              fontSize: '0.9rem',
            }}
          >
            <span>
              🌿 <strong>Guia Essencial Gratuito liberado:</strong> Acesse agora
              nosso plano prático{' '}
              <em>"Hipoglicemia sem susto: um plano para toda a família"</em>!
            </span>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Link
                to="/artigo/1"
                onClick={() => setGuiaAvisoAberto(false)}
                style={{
                  fontWeight: 700,
                  color: 'var(--cor-cta)',
                  textDecoration: 'underline',
                }}
              >
                Abrir Guia Gratuito →
              </Link>
              <button
                type="button"
                aria-label="Fechar aviso do guia"
                onClick={() => setGuiaAvisoAberto(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
/* FIM DO COMPONENTE NAVBAR */
