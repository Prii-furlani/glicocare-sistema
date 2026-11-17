/* ==========================================================================
   ARQUIVO: Especialistas.jsx
   PÁGINA: Especialistas ("Rede de Especialistas GlicoCare" — Marketplace
   de Saúde Integrada)
   OBJETIVO: Exibir a página de listagem completa dos profissionais de saúde
   credenciados e validados (RN-MOD-MKT) com filtros avançados no topo:
   1. Barra de busca por nome ou registro (CRM, CRN, CREF, CRP);
   2. Seletor de especialidade (Endocrinologista, Nutricionista, Educador
      Físico, Psicólogo);
   3. Tags de foco clínico (Infância, Ajuste de Insulina, Esporte,
      Emagrecimento, Contagem de Carboidratos, Saúde Emocional);
   4. Grade de cards em Branco Acolhedor (#F6F3EE) com "Ver Perfil e Agendar".
   ========================================================================== */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CardEspecialista from '../components/CardEspecialista';
import { REDE_ESPECIALISTAS } from './Home';

/* INÍCIO DAS LISTAS DE FILTROS AVANÇADOS DO MARKETPLACE */
const ESPECIALIDADES_FILTRO = [
  { valor: 'Todos', rotulo: 'Todas as Especialidades' },
  { valor: 'ENDOCRINOLOGISTA', rotulo: '🩺 Endocrinologista' },
  { valor: 'NUTRICIONISTA', rotulo: '🥗 Nutricionista' },
  { valor: 'EDUCADOR FÍSICO', rotulo: '🏃 Educador Físico' },
  { valor: 'PSICÓLOGO', rotulo: '🧠 Psicólogo' },
];

const TAGS_FOCO_DISPONIVEIS = [
  'Todos os focos',
  'Infância',
  'Ajuste de Insulina',
  'Esporte',
  'Emagrecimento',
  'Contagem de Carboidratos',
  'Saúde Emocional',
];
/* FIM DAS LISTAS DE FILTROS AVANÇADOS */

/* INÍCIO DA PÁGINA DE LISTAGEM DE ESPECIALISTAS */
export default function Especialistas() {
  // Estados dos 3 filtros combinados do topo
  const [buscaNome, setBuscaNome] = useState('');
  const [especialidadeAtiva, setEspecialidadeAtiva] = useState('Todos');
  const [tagFocoAtiva, setTagFocoAtiva] = useState('Todos os focos');

  // Aplica simultaneamente busca textual + filtro de especialidade + tag de foco
  const profissionaisFiltrados = REDE_ESPECIALISTAS.filter((prof) => {
    const termo = buscaNome.trim().toLowerCase();
    const matchNomeOuRegistro =
      !termo ||
      prof.nome.toLowerCase().includes(termo) ||
      prof.conselho.toLowerCase().includes(termo) ||
      prof.especialidade.toLowerCase().includes(termo);

    const matchEspecialidade =
      especialidadeAtiva === 'Todos' ||
      prof.especialidade === especialidadeAtiva;

    const matchTagFoco =
      tagFocoAtiva === 'Todos os focos' ||
      (prof.tagsFoco && prof.tagsFoco.includes(tagFocoAtiva));

    return matchNomeOuRegistro && matchEspecialidade && matchTagFoco;
  });

  // Limpa rapidamente todos os filtros ativos
  const handleLimparFiltros = () => {
    setBuscaNome('');
    setEspecialidadeAtiva('Todos');
    setTagFocoAtiva('Todos os focos');
  };

  return (
    <div
      className="container"
      style={{
        paddingTop: 'var(--espaco-xl)',
        paddingBottom: 'var(--espaco-2xl)',
      }}
    >
      {/* ====================================================================
          1. CABEÇALHO EDITORIAL DA REDE DE ESPECIALISTAS GLICOCARE
          ==================================================================== */}
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '2.25rem',
        }}
      >
        <div style={{ maxWidth: 680 }}>
          <div className="section-line-eyebrow">
            MARKETPLACE DE SAÚDE INTEGRADA • RN-MOD-MKT
          </div>
          <h1 style={{ fontSize: 'var(--tamanho-h2)', marginBottom: '0.75rem' }}>
            Rede de Especialistas{' '}
            <span className="texto-italico-terracota">GlicoCare.</span>
          </h1>
          <p
            style={{
              fontSize: '1.06rem',
              color: 'var(--cor-texto-suave)',
              lineHeight: 1.65,
            }}
          >
            Profissionais com registro ativo verificado (CRM, CRN, CREF e CRP),
            preparados para apoiar cada fase do Diabetes Tipo 1 com escuta
            acolhedora, agendamento online e emissão integrada de receitas e
            guias de exames.
          </p>
          <div style={{ marginTop: '0.85rem' }}>
            <Link
              to="/como-funciona-atendimentos"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.94rem',
                fontWeight: 600,
                color: 'var(--cor-cta)',
                textDecoration: 'none',
              }}
            >
              <span>Entenda como funciona o atendimento humanizado na GlicoCare</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <Link
          to="/credenciamento"
          className="gc-btn gc-btn--contorno-verde"
          style={{ padding: '0.75rem 1.45rem' }}
        >
          <span>Sou especialista e quero me credenciar</span>
          <span aria-hidden="true">↗</span>
        </Link>
      </header>

      {/* ====================================================================
          2. PAINEL DE FILTROS AVANÇADOS NO TOPO (#F6F3EE)
          ==================================================================== */}
      <section
        aria-label="Filtros de busca de especialistas"
        style={{
          backgroundColor: 'var(--cor-superficie)', // Branco Acolhedor #F6F3EE
          border: '1px solid var(--cor-borda-suave)',
          borderRadius: '20px',
          padding: '1.75rem 2rem',
          marginBottom: '2.25rem',
          boxShadow: 'var(--sombra-card)',
        }}
      >
        {/* Linha 1: Barra de Busca por Nome/CRM + Seletor de Especialidade */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.35rem',
          }}
        >
          {/* Busca por Nome ou Registro Profissional */}
          <div>
            <label
              htmlFor="busca-especialista"
              className="gc-label"
              style={{ display: 'block', marginBottom: '0.45rem' }}
            >
              Buscar por nome ou registro (CRM / CRN / CREF / CRP)
            </label>
            <input
              id="busca-especialista"
              type="search"
              className="gc-input"
              placeholder="Ex: Dra. Ana Paula, Beatriz, CRM-SP..."
              value={buscaNome}
              onChange={(e) => setBuscaNome(e.target.value)}
              style={{ borderRadius: 'var(--raio-pilula)' }}
            />
          </div>

          {/* Seletor Dropdown + Pílulas de Especialidade */}
          <div>
            <label
              htmlFor="seletor-especialidade"
              className="gc-label"
              style={{ display: 'block', marginBottom: '0.45rem' }}
            >
              Especialidade Principal
            </label>
            <select
              id="seletor-especialidade"
              className="gc-select"
              value={especialidadeAtiva}
              onChange={(e) => setEspecialidadeAtiva(e.target.value)}
              style={{ borderRadius: 'var(--raio-pilula)' }}
            >
              {ESPECIALIDADES_FILTRO.map((item) => (
                <option key={item.valor} value={item.valor}>
                  {item.rotulo}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Linha 2: Botões rápidos de Especialidade */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span
            style={{
              display: 'block',
              fontSize: '0.76rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--cor-primaria)',
              marginBottom: '0.55rem',
            }}
          >
            Filtrar por área clínica:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
            {ESPECIALIDADES_FILTRO.map((esp) => (
              <button
                key={esp.valor}
                type="button"
                onClick={() => setEspecialidadeAtiva(esp.valor)}
                className={`filtro-pilula ${
                  especialidadeAtiva === esp.valor ? 'filtro-pilula--ativo' : ''
                }`}
              >
                {esp.rotulo}
              </button>
            ))}
          </div>
        </div>

        {/* Linha 3: Tags de Foco (Emagrecimento, Infância, Esporte, Ajuste de Insulina...) */}
        <div
          style={{
            borderTop: '1px solid var(--cor-borda-suave)',
            paddingTop: '1.15rem',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '0.76rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--cor-cta)',
              marginBottom: '0.55rem',
            }}
          >
            Tags de Foco e Especialização no DM1:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {TAGS_FOCO_DISPONIVEIS.map((tag) => {
              const selecionada = tagFocoAtiva === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTagFocoAtiva(tag)}
                  style={{
                    borderRadius: 'var(--raio-pilula)',
                    padding: '0.42rem 0.95rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: selecionada
                      ? '1.5px solid var(--cor-cta)'
                      : '1px solid var(--cor-borda)',
                    backgroundColor: selecionada
                      ? 'var(--cor-cta)'
                      : 'var(--cor-fundo)',
                    color: selecionada
                      ? 'var(--cor-branco)'
                      : 'var(--cor-texto)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tag === 'Todos os focos' ? tag : `#${tag}`}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. BARRA DE STATUS DA LISTAGEM + GRADE DE CARDS DOS PROFISSIONAIS
          ==================================================================== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.35rem',
        }}
      >
        <p style={{ fontSize: '0.94rem', color: 'var(--cor-texto-suave)' }}>
          Exibindo <strong>{profissionaisFiltrados.length}</strong>{' '}
          {profissionaisFiltrados.length === 1
            ? 'profissional verificado'
            : 'profissionais verificados'}{' '}
          para sua família
        </p>

        {(buscaNome ||
          especialidadeAtiva !== 'Todos' ||
          tagFocoAtiva !== 'Todos os focos') && (
          <button
            type="button"
            onClick={handleLimparFiltros}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--cor-primaria)',
              fontWeight: 700,
              fontSize: '0.88rem',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Limpar filtros ativos
          </button>
        )}
      </div>

      {profissionaisFiltrados.length === 0 ? (
        <div
          className="gc-card"
          style={{ textAlign: 'center', padding: '3rem 1.5rem' }}
        >
          <h3 style={{ marginBottom: '0.5rem' }}>
            Nenhum especialista encontrado para essa combinação de filtros
          </h3>
          <p
            style={{
              color: 'var(--cor-texto-suave)',
              marginBottom: '1.25rem',
            }}
          >
            Experimente selecionar "Todas as Especialidades" ou limpar a busca
            para ver toda a nossa rede credenciada.
          </p>
          <button
            type="button"
            className="gc-btn gc-btn--primario"
            onClick={handleLimparFiltros}
          >
            Ver todos os especialistas
          </button>
        </div>
      ) : (
        <section className="grid-2-colunas">
          {profissionaisFiltrados.map((prof) => (
            <CardEspecialista
              key={prof.id}
              id={prof.id}
              nome={prof.nome}
              especialidade={prof.especialidade}
              conselho={prof.conselho}
              nota={prof.nota}
              totalAvaliacoes={prof.totalAvaliacoes}
              fotoUrl={prof.fotoUrl}
              tagsFoco={prof.tagsFoco}
              resumoCurto={prof.resumoCurto}
              valorConsulta={prof.valorConsulta}
              textoBotao="Ver Perfil e Agendar"
            />
          ))}
        </section>
      )}
    </div>
  );
}
/* FIM DA PÁGINA DE LISTAGEM DE ESPECIALISTAS */
