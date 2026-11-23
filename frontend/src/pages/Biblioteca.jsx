/* ==========================================================================
   ARQUIVO: Biblioteca.jsx
   PÁGINA: Biblioteca ("Informação para a vida real.")
   OBJETIVO: Exibir a página dedicada da Biblioteca de Conteúdos com a mesma
   Experiência Híbrida Responsiva:
   - Desktop: Grade estruturada da Biblioteca de Conteúdos com filtros no topo;
   - Mobile (<= 768px): Feed Vertical fluido e contínuo otimizado para rolagem
     com o polegar, cards empilhados com border-radius de 12px e fundo #F6F3EE.
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import CardConteudo from '../components/CardConteudo';
import SugerirConteudoCTA from '../components/SugerirConteudoCTA';
import GlicoLoader from '../components/GlicoLoader';
import { ARTIGOS_BIBLIOTECA } from './Home';

/* INÍCIO DA PÁGINA BIBLIOTECA */
export default function Biblioteca() {
  const [artigosLista, setArtigosLista] = useState(ARTIGOS_BIBLIOTECA);
  /* INÍCIO CONTROLE DE CARREGAMENTO (GLICOLOADER SKELETON) */
  const [carregandoArtigos, setCarregandoArtigos] = useState(true);
  /* FIM CONTROLE DE CARREGAMENTO (GLICOLOADER SKELETON) */
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todos');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    setCarregandoArtigos(true);
    fetch('/backend/api/artigos/index.php')
      .then((res) => res.json())
      .then((resJson) => {
        if (resJson && resJson.sucesso && Array.isArray(resJson.dados) && resJson.dados.length > 0) {
          const artigosNormalizados = resJson.dados.map((a, idx) => ({
            id: a.id,
            slug: a.slug,
            seloSuperior: a.selo_editorial || 'GUIA ESSENCIAL',
            imagemCapa: a.imagem_capa_url || null,
            numeroEditorial: String(idx + 1).padStart(2, '0'),
            corTopo: a.cor_capa_default || 'terracota',
            iconeCategoria: a.categoria === 'Rotina Escolar' ? '🏫' : (a.categoria === 'Tecnologia & Autonomia' ? '💡' : '🐾'),
            categoria: a.categoria,
            tempoLeitura: `${a.tempo_leitura_min || 6} min de leitura`,
            titulo: a.titulo,
            resumo: a.resumo,
            destaqueSetaSolida: idx === 0,
          }));
          setArtigosLista(artigosNormalizados);
        }
      })
      .catch((err) => {
        console.warn('Biblioteca utilizando acervo editorial inicial:', err);
      })
      .finally(() => {
        setCarregandoArtigos(false);
      });
  }, []);

  const artigosFiltrados = artigosLista.filter((artigo) => {
    const matchCategoria =
      categoriaSelecionada === 'Todos' ||
      artigo.categoria === categoriaSelecionada;
    const matchBusca =
      artigo.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      artigo.resumo.toLowerCase().includes(busca.toLowerCase());
    return matchCategoria && matchBusca;
  });

  return (
    <div className="container" style={{ paddingTop: 'var(--espaco-xl)' }}>
      {/* INÍCIO DO CABEÇALHO EDITORIAL DA BIBLIOTECA */}
      <header style={{ maxWidth: 680, marginBottom: '2rem' }}>
        <div className="section-line-eyebrow">BIBLIOTECA DE CONTEÚDOS</div>
        <h1 style={{ fontSize: 'var(--tamanho-h2)', marginBottom: '0.85rem' }}>
          Informação para a{' '}
          <span className="texto-italico-terracota">vida real.</span>
        </h1>
        <p style={{ fontSize: '1.08rem', color: 'var(--cor-texto-suave)' }}>
          Conteúdos claros, cuidadosos e práticos para consultar no seu tempo —
          em casa, na escola ou entre uma tarefa e outra.
        </p>
      </header>
      {/* FIM DO CABEÇALHO */}

      {/* Indicador sutil exibido em telas mobile para o Feed Vertical */}
      <div className="indicador-modo-feed">
        <span>📱 Feed Vertical otimizado para leitura rápida</span>
      </div>

      {/* INÍCIO DOS FILTROS EM PÍLULA E BUSCA */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '0.5rem',
        }}
      >
        <div className="conteudos-filtros-bar" style={{ marginBottom: '1.5rem' }}>
          {[
            { id: 'Todos', label: 'Todos', icone: null },
            { id: 'Com o Lufy', label: 'Com o Lufy', icone: '🐾' },
            { id: 'Rotina Escolar', label: 'Rotina Escolar', icone: '🏫' },
            {
              id: 'Tecnologia & Autonomia',
              label: 'Tecnologia & Autonomia',
              icone: '💡',
            },
          ].map((aba) => (
            <button
              key={aba.id}
              type="button"
              onClick={() => setCategoriaSelecionada(aba.id)}
              className={`filtro-pilula ${
                categoriaSelecionada === aba.id ? 'filtro-pilula--ativo' : ''
              }`}
            >
              {aba.icone && <span aria-hidden="true">{aba.icone}</span>}
              <span>{aba.label}</span>
            </button>
          ))}
        </div>

        <input
          type="search"
          placeholder="Buscar conteúdo..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="gc-input"
          style={{
            maxWidth: 280,
            borderRadius: 'var(--raio-pilula)',
            marginBottom: '1.5rem',
          }}
        />
      </div>
      {/* FIM DOS FILTROS EM PÍLULA E BUSCA */}

      {/* INÍCIO DO CONTAINER HÍBRIDO (GRID DESKTOP / FEED VERTICAL MOBILE) */}
      <section className="conteudos-hibrido-container">
        {/* INÍCIO BLOCO FEEDBACK CARREGAMENTO (GLICOLOADER SKELETON) */}
        {carregandoArtigos ? (
          <GlicoLoader variant="skeleton" tipo="grid" quantidade={6} />
        ) : (
          artigosFiltrados.map((artigo) => (
            <CardConteudo
              key={artigo.id}
              id={artigo.id}
              seloSuperior={artigo.seloSuperior}
              imagemCapa={artigo.imagemCapa}
              numeroEditorial={artigo.numeroEditorial}
              corTopo={artigo.corTopo}
              iconeCategoria={artigo.iconeCategoria}
              categoria={artigo.categoria}
              tempoLeitura={artigo.tempoLeitura}
              titulo={artigo.titulo}
              resumo={artigo.resumo}
              destaqueSetaSolida={artigo.destaqueSetaSolida}
            />
          ))
        )}
        {/* FIM BLOCO FEEDBACK CARREGAMENTO (GLICOLOADER SKELETON) */}
      </section>
      {/* FIM DO CONTAINER HÍBRIDO */}

      {/* INÍCIO DO CTA SECUNDÁRIO EM BARRA/PÍLULA LARGA ("Sugerir um conteúdo ↗") */}
      <SugerirConteudoCTA />
      {/* FIM DO CTA SECUNDÁRIO */}
    </div>
  );
}
/* FIM DA PÁGINA BIBLIOTECA */
