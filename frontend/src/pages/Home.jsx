/* ==========================================================================
   ARQUIVO: Home.jsx
   PÁGINA: Home (Landing Page Completa e Híbrida da Plataforma GlicoCare)
   OBJETIVO: Renderizar todas as seções fiéis às 20 telas enviadas e implementar
   a Experiência Híbrida Responsiva na Seção de Conteúdos:
   - Desktop: Grade (Grid) estruturada da Biblioteca de Conteúdos com filtros;
   - Mobile (<= 768px): Feed Vertical fluido e contínuo otimizado para rolagem
     com o polegar, cards empilhados com border-radius de 12px e fundo #F6F3EE.
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import lufyMascoteFoto from '../assets/lufy-mascote.jpg';
import familiaCuidadoFoto from '../assets/familia-cuidado.jpg';
import CardConteudo from '../components/CardConteudo';
import CardEspecialista from '../components/CardEspecialista';
import SugerirConteudoCTA from '../components/SugerirConteudoCTA';
import CapaEditorialDefault from '../components/CapaEditorialDefault';
import { FEATURES } from '../config/features';

/* INÍCIO DOS DADOS ESTRUTURADOS FIÉIS ÀS IMAGENS DO PROTÓTIPO */

// 6 Artigos da seção "BIBLIOTECA DE CONTEÚDOS — Informação para a vida real."
export const ARTIGOS_BIBLIOTECA = [
  {
    id: 1,
    slug: 'hipoglicemia-sem-susto',
    seloSuperior: 'GUIA ESSENCIAL',
    imagemCapa: lufyMascoteFoto,
    iconeCategoria: '🐾',
    categoria: 'Com o Lufy',
    tempoLeitura: '6 min de leitura',
    titulo: 'Hipoglicemia sem susto: um plano para toda a família',
    resumo:
      'Sinais, combinados e passos simples para agir com segurança e transmitir calma às crianças.',
    destaqueSetaSolida: true,
  },
  {
    id: 2,
    slug: 'dm1-na-escola',
    seloSuperior: 'PARA COMPARTILHAR',
    imagemCapa: familiaCuidadoFoto,
    iconeCategoria: '🏫',
    categoria: 'Rotina Escolar',
    tempoLeitura: '8 min de leitura',
    titulo: 'DM1 na escola: como construir uma parceria que acolhe',
    resumo:
      'Um roteiro prático para alinhar família, professores e equipe de cuidado desde o primeiro dia.',
    destaqueSetaSolida: false,
  },
  {
    id: 3,
    slug: 'do-sensor-a-autonomia',
    seloSuperior: 'AUTONOMIA POSSÍVEL',
    imagemCapa: null,
    numeroEditorial: '01',
    corTopo: 'carvalho', // Paleta Porto Seguro: #665B53
    iconeCategoria: '💡',
    categoria: 'Tecnologia & Autonomia',
    tempoLeitura: '5 min de leitura',
    titulo: 'Do sensor à autonomia: tecnologia que aproxima',
    resumo:
      'Como transformar dados e dispositivos em aliados da rotina, sem deixar que eles ocupem tudo.',
    destaqueSetaSolida: false,
  },
  {
    id: 4,
    slug: 'como-falar-sobre-diabetes',
    seloSuperior: 'CONVERSA EM FAMÍLIA',
    imagemCapa: null,
    numeroEditorial: '02',
    corTopo: 'terracota', // Paleta Porto Seguro: #947460
    iconeCategoria: '🐾',
    categoria: 'Com o Lufy',
    tempoLeitura: '7 min de leitura',
    titulo: 'Como falar sobre diabetes sem transformar tudo em diabetes',
    resumo:
      'Palavras, perguntas e pausas que ajudam a criança a entender o cuidado sem perder a leveza.',
    destaqueSetaSolida: false,
  },
  {
    id: 5,
    slug: 'mochila-segura',
    seloSuperior: 'CHECKLIST PRÁTICO',
    imagemCapa: null,
    numeroEditorial: '03',
    corTopo: 'verde', // Paleta Porto Seguro: #527356
    iconeCategoria: '🏫',
    categoria: 'Rotina Escolar',
    tempoLeitura: '4 min de leitura',
    titulo: 'A mochila segura: o que preparar para a rotina escolar',
    resumo:
      'Uma lista visual e objetiva para organizar insumos, contatos e combinados importantes.',
    destaqueSetaSolida: false,
  },
  {
    id: 6,
    slug: 'numeros-informam-pessoas-cuidam',
    seloSuperior: 'VIDA REAL',
    imagemCapa: null,
    numeroEditorial: '04',
    corTopo: 'carvalho', // Paleta Porto Seguro: #665B53
    iconeCategoria: '💡',
    categoria: 'Tecnologia & Autonomia',
    tempoLeitura: '6 min de leitura',
    titulo: 'Números informam. Pessoas cuidam.',
    resumo:
      'Um olhar mais humano para tendências, alarmes e decisões compartilhadas no dia a dia.',
    destaqueSetaSolida: false,
  },
  {
    id: 7,
    slug: 'insulina-ativa-e-queda-rapida',
    seloSuperior: 'GUIA ESSENCIAL',
    imagemCapa: null,
    numeroEditorial: '05',
    corTopo: 'verde', // Paleta Porto Seguro: #527356
    iconeCategoria: '💡',
    categoria: 'Tecnologia & Autonomia',
    tempoLeitura: '7 min de leitura',
    titulo: 'Insulina Ativa e Queda Rápida: como não ficar "às cegas" no destro',
    resumo:
      'Como calcular a insulina restante no organismo (IOB), evitar empilhamento perigoso de doses e ler a velocidade de variação entre pontas de dedo sem precisar de sensor contínuo.',
    destaqueSetaSolida: true,
  },
];

// 4 Profissionais da seção "REDE DE ESPECIALISTAS GLICOCARE"
export const REDE_ESPECIALISTAS = [
  {
    id: 1,
    nome: 'Beatriz Nogueira',
    especialidade: 'NUTRICIONISTA',
    conselho: 'CRN-3 62.418',
    nota: '4.8',
    totalAvaliacoes: 94,
    tagsFoco: ['Infância', 'Emagrecimento', 'Contagem de Carboidratos'],
    resumoCurto:
      'Nutrição afetiva, lancheiras escolares seguras e contagem de carboidratos descomplicada.',
    valorConsulta: 'R$ 220,00',
    ofereceRetornoIncluso: true,
    prazoRetornoDias: 30,
    fotoUrl:
      'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 2,
    nome: 'Dra. Ana Paula Ribeiro',
    especialidade: 'ENDOCRINOLOGISTA',
    conselho: 'CRM-SP 184.290',
    nota: '4.9',
    totalAvaliacoes: 128,
    tagsFoco: ['Infância', 'Ajuste de Insulina', 'Sensores & Bombas'],
    resumoCurto:
      'Endocrinologia pediátrica e do adulto com foco em leitura de sensores e plano de ação personalizado.',
    valorConsulta: 'R$ 340,00',
    ofereceRetornoIncluso: true,
    prazoRetornoDias: 30,
    fotoUrl:
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 3,
    nome: 'Dra. Camila Torres',
    especialidade: 'PSICÓLOGO',
    conselho: 'CRP 06/183.442',
    nota: '5.0',
    totalAvaliacoes: 61,
    tagsFoco: ['Infância', 'Saúde Emocional', 'Acolhimento Parental'],
    resumoCurto:
      'Psicologia clínica voltada ao pós-diagnóstico de DM1, ansiedade familiar e autonomia na adolescência.',
    valorConsulta: 'R$ 200,00',
    fotoUrl:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 4,
    nome: 'Rafael Mendes',
    especialidade: 'EDUCADOR FÍSICO',
    conselho: 'CREF 162.907-G/SP',
    nota: '4.9',
    totalAvaliacoes: 76,
    tagsFoco: ['Esporte', 'Emagrecimento', 'Ajuste de Insulina'],
    resumoCurto:
      'Fisiologia do exercício no DM1, prevenção de hipoglicemia no esporte e educação física escolar.',
    valorConsulta: 'R$ 190,00',
    fotoUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  },
];

// 5 Perguntas Frequentes (FAQ) exatas da imagem media_1794449289958_f15f1ce7.png
const PERGUNTAS_FAQ = [
  {
    numero: '01',
    pergunta: 'A GlicoCare substitui o acompanhamento médico?',
    resposta:
      'Não. A GlicoCare oferece apoio pedagógico, conteúdo educativo e acolhimento prático. Toda decisão clínica deve ser conduzida pela equipe médica que acompanha a pessoa com DM1.',
  },
  {
    numero: '02',
    pergunta: 'O conteúdo é indicado para quem acabou de receber o diagnóstico?',
    resposta:
      'Sim. A Linha de Frente 1 (Primeiros Passos) e os guias essenciais foram desenhados especialmente para acolher as famílias logo após o diagnóstico, organizando a rotina com calma e sem pânico.',
  },
  {
    numero: '03',
    pergunta: 'A escola também pode usar os materiais?',
    resposta:
      'Sim! A Pedagogia do Cuidado Escolar é um dos nossos pilares: nossos checklists, roteiros e guias visuais são feitos para aproximar família, professores e equipe escolar.',
  },
  {
    numero: '04',
    pergunta: 'Quem desenvolve os conteúdos da plataforma?',
    resposta:
      'Os materiais unem vivência real em 1ª pessoa do Diabetes Tipo 1, direção pedagógica e a revisão da nossa rede de especialistas verificados.',
  },
  {
    numero: '05',
    pergunta: 'Como funciona a comunidade GlicoCare?',
    resposta:
      'É um espaço seguro de troca e escuta entre famílias. Para preservar o acolhimento e evitar condutas clínicas indevidas, todos os depoimentos passam por aprovação manual prévia (RN-MOD-01).',
  },
];
/* FIM DOS DADOS ESTRUTURADOS */

/* INÍCIO DO COMPONENTE PÁGINA HOME */
export default function Home() {
  // Estado do filtro de categorias da Biblioteca de Conteúdos
  const [filtroBiblioteca, setFiltroBiblioteca] = useState('Todos');

  // Estado do formulário "Sugerir um conteúdo"
  const [modalSugestaoAberto, setModalSugestaoAberto] = useState(false);
  const [temaSugerido, setTemaSugerido] = useState('');
  const [sugestaoEnviada, setSugestaoEnviada] = useState(false);

  // Estado do acordeão FAQ (inicia com a pergunta 01 aberta como na imagem)
  const [faqAberto, setFaqAberto] = useState(0);

  // Estado do CMS Dinâmico da Home (carregado via /backend/api/publico/home_config.php)
  const [cmsConfig, setCmsConfig] = useState({
    hero_badge: 'INFORMAÇÃO QUE ACOLHE. CUIDADO QUE APROXIMA.',
    hero_titulo: 'Transforme o diagnóstico em uma rotina segura e sem pânico.',
    hero_titulo_destaque: 'segura',
    hero_subtitulo: 'Apoio pedagógico e acolhimento prático para famílias que vivem o Diabetes Tipo 1 — do diagnóstico à autonomia, um passo de cada vez.',
    hero_cta_primario: 'Quero começar com segurança',
    hero_cta_secundario: 'Conheça nossa história',
    hero_balao_lufy: '“Ei, respira. A gente vai aprender isso juntos.”',
    hero_imagem_url: '',
    lufy_eyebrow: 'CONHEÇA O LUFY',
    lufy_titulo: 'Tecnologia no braço. Afeto no coração.',
    lufy_titulo_destaque: 'Afeto',
    lufy_paragrafo_1: 'Lufy nasceu para ser uma presença familiar nos momentos em que tudo parece novo demais. Um coala guardião que transforma termos difíceis em conversas possíveis.',
    lufy_paragrafo_2: 'Com o sensor no bracinho, ele mostra para as crianças que o monitoramento não é um peso, mas uma ferramenta de autonomia e liberdade.',
    lufy_citacao_foto: '“Cuidar também é ensinar com calma, até que a confiança encontre seu lugar.”',
    lufy_imagem_url: '',
    cta_final_titulo: 'Dê o primeiro passo para uma rotina mais serena.',
    cta_final_subtitulo: 'Junte-se a centenas de famílias que transformaram o medo em aprendizado e confiança diária.',
    cta_final_botao: 'Conheça nossos planos e comece hoje',
  });

  // Lista de artigos publicados (carregados dinamicamente com fallback editorial)
  const [artigosLista, setArtigosLista] = useState(ARTIGOS_BIBLIOTECA);

  useEffect(() => {
    // 1. Carrega textos e imagens configuradas do CMS da Home
    fetch('/backend/api/publico/home_config.php')
      .then((res) => res.json())
      .then((resJson) => {
        if (resJson && resJson.sucesso && resJson.dados) {
          setCmsConfig((prev) => ({ ...prev, ...resJson.dados }));
        }
      })
      .catch((err) => {
        console.warn('CMS Dinâmico utilizando fallback padrão:', err);
      });

    // 2. Carrega artigos publicados do banco de dados (artigos_conteudos)
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
        console.warn('Biblioteca de Conteúdos utilizando acervo editorial inicial:', err);
      });
  }, []);

  // Filtra os artigos exibidos na grade Desktop / Feed Vertical Mobile
  const artigosExibidos = artigosLista.filter(
    (art) => filtroBiblioteca === 'Todos' || art.categoria === filtroBiblioteca
  );

  const handleEnviarSugestao = (e) => {
    e.preventDefault();
    if (!temaSugerido.trim()) return;
    setSugestaoEnviada(true);
    setTemaSugerido('');
  };

  return (
    <div>
      {/* =====================================================================
          1. INÍCIO DA HERO SECTION (#inicio) + SHOWCASE CARD DO LUFY (GRID FLUIDO)
          ===================================================================== */}
      <section
        id="inicio"
        style={{
          padding: 'clamp(2.5rem, 5vw, 4.25rem) 0 var(--espaco-2xl)',
        }}
      >
        <div className="container">
          <div className="hero-grid">
            {/* Coluna Esquerda: Título em Fraunces, Subtítulo, CTAs e Rede de Apoio */}
            <div className="hero-content-col">
              <div className="eyebrow-pill" style={{ marginBottom: '1.6rem' }}>
                <span className="eyebrow-pill__dot" aria-hidden="true" />
                <span>{cmsConfig.hero_badge || 'INFORMAÇÃO QUE ACOLHE. CUIDADO QUE APROXIMA.'}</span>
              </div>

              <h1 style={{ marginBottom: '1.65rem' }}>
                {cmsConfig.hero_titulo && cmsConfig.hero_titulo_destaque && cmsConfig.hero_titulo.includes(cmsConfig.hero_titulo_destaque) ? (
                  <>
                    {cmsConfig.hero_titulo.split(cmsConfig.hero_titulo_destaque)[0]}
                    <span className="palavra-destaque-segura">
                      {cmsConfig.hero_titulo_destaque}
                      <svg
                        className="palavra-destaque-curva"
                        viewBox="0 0 220 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 10.5C62 3.5 154 3.5 217 9.5"
                          stroke="#3B7E48"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                    {cmsConfig.hero_titulo.split(cmsConfig.hero_titulo_destaque)[1]}
                  </>
                ) : (
                  cmsConfig.hero_titulo || (
                    <>
                      Transforme o diagnóstico em uma rotina{' '}
                      <span className="palavra-destaque-segura">
                        segura
                        <svg
                          className="palavra-destaque-curva"
                          viewBox="0 0 220 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <path
                            d="M3 10.5C62 3.5 154 3.5 217 9.5"
                            stroke="#3B7E48"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>{' '}
                      e sem pânico.
                    </>
                  )
                )}
              </h1>

              <p
                style={{
                  fontSize: 'clamp(1.08rem, 1.8vw, 1.25rem)',
                  color: 'var(--cor-texto-suave)',
                  lineHeight: 1.65,
                  maxWidth: 620,
                  marginBottom: '2.15rem',
                }}
              >
                {cmsConfig.hero_subtitulo ||
                  'Apoio pedagógico e acolhimento prático para famílias que vivem o Diabetes Tipo 1 — do diagnóstico à autonomia, um passo de cada vez.'}
              </p>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '2.25rem',
                }}
              >
                <a href="#planos" className="gc-btn gc-btn--primario">
                  <span>{cmsConfig.hero_cta_primario || 'Quero começar com segurança'}</span>
                  <span aria-hidden="true">→</span>
                </a>

                <a href="#conheca-o-lufy" className="gc-btn gc-btn--secundario">
                  <span>{cmsConfig.hero_cta_secundario || 'Conheça nossa história'}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              </div>

              <div className="rede-apoio-row">
                <div className="rede-apoio-avatars" aria-hidden="true">
                  <span
                    className="rede-avatar"
                    style={{ backgroundColor: 'var(--cor-primaria)' }}
                  >
                    P
                  </span>
                  <span
                    className="rede-avatar"
                    style={{ backgroundColor: 'var(--cor-cta)' }}
                  >
                    M
                  </span>
                  <span
                    className="rede-avatar"
                    style={{ backgroundColor: 'var(--cor-taupe)' }}
                  >
                    A
                  </span>
                </div>

                <div>
                  <strong
                    style={{
                      display: 'block',
                      fontSize: '0.93rem',
                      color: 'var(--cor-texto)',
                      lineHeight: 1.3,
                    }}
                  >
                    Uma rede que entende
                  </strong>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.88rem',
                      color: 'var(--cor-texto-suave)',
                    }}
                  >
                    você não precisa saber tudo hoje.
                  </span>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Card de Destaque do Mascote Lufy (Aproveita a largura total) */}
            <div className="hero-lufy-col">
              <div
                className="hero-lufy-showcase"
                style={{
                  margin: 0,
                  width: '100%',
                }}
              >
                <div className="lufy-dark-bubble">
                  <p
                    style={{
                      fontSize: '0.96rem',
                      lineHeight: 1.5,
                      marginBottom: '0.45rem',
                      fontWeight: 500,
                    }}
                  >
                    {cmsConfig.hero_balao_lufy || '“Ei, respira. A gente vai aprender isso juntos.”'}
                  </p>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      color: 'var(--cor-borda)',
                      fontWeight: 600,
                    }}
                  >
                    — Lufy
                  </span>
                </div>

                <img
                  src={cmsConfig.hero_imagem_url || lufyMascoteFoto}
                  alt="Mascote Lufy — Coala guardião com o sensor FreeStyle Libre no braço"
                  style={{
                    width: '100%',
                    maxHeight: 520,
                    objectFit: 'cover',
                    borderRadius: '14px',
                    display: 'block',
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    padding: '1.35rem 0.4rem 0.25rem',
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--cor-primaria)',
                        marginBottom: '0.25rem',
                      }}
                    >
                      SEU GUARDIÃO DA JORNADA
                    </span>
                    <h3
                      style={{
                        fontSize: '1.65rem',
                        fontWeight: 700,
                        color: 'var(--cor-texto)',
                      }}
                    >
                      Conheça o Lufy
                    </h3>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        backgroundColor: '#EFECE6',
                        border: '1px solid var(--cor-borda-suave)',
                        borderRadius: 'var(--raio-pilula)',
                        padding: '0.45rem 1.1rem 0.45rem 0.55rem',
                      }}
                    >
                      <span
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          backgroundColor: '#DCEAD9',
                          color: 'var(--cor-cta)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                        }}
                      >
                        ✓
                      </span>
                      <div style={{ fontSize: '0.78rem', lineHeight: 1.25 }}>
                        <strong style={{ display: 'block', color: 'var(--cor-texto)' }}>
                          Conteúdo claro
                        </strong>
                        <span style={{ color: 'var(--cor-texto-suave)' }}>
                          e responsável
                        </span>
                      </div>
                    </div>

                    <a
                      href="#conheca-o-lufy"
                      aria-label="Ir para seção Conheça o Lufy"
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        backgroundColor: 'var(--cor-cta)',
                        color: 'var(--cor-branco)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                      }}
                    >
                      ↗
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* FIM DA HERO SECTION */}

      {/* =====================================================================
          2. INÍCIO DA SEÇÃO "CONHEÇA O LUFY — Tecnologia no braço. Afeto no coração." (2 COLUNAS)
          ===================================================================== */}
      <section
        id="conheca-o-lufy"
        className="section-spacing"
        style={{
          backgroundColor: 'var(--cor-superficie)',
          borderTop: '1px solid var(--cor-borda-suave)',
          borderBottom: '1px solid var(--cor-borda-suave)',
        }}
      >
        <div className="container">
          <div className="lufy-section-grid">
            {/* Coluna Esquerda: Imagem da Família com a Citação Acolhedora */}
            <div style={{ position: 'relative' }}>
              <img
                src={cmsConfig.lufy_imagem_url || familiaCuidadoFoto}
                alt="Mãe e filha conversando com serenidade na mesa da cozinha com insumos do DM1"
                style={{
                  width: '100%',
                  borderRadius: '20px',
                  display: 'block',
                  boxShadow: 'var(--sombra-card)',
                }}
              />

              <div
                style={{
                  marginTop: '-2.5rem',
                  marginLeft: 'auto',
                  marginRight: '1rem',
                  maxWidth: 460,
                  backgroundColor: '#EAE4D9',
                  border: '1px solid var(--cor-borda)',
                  borderRadius: '16px',
                  padding: '1.25rem 1.6rem',
                  boxShadow: '0 10px 30px rgba(46, 40, 36, 0.10)',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <p
                  className="serif-title"
                  style={{
                    fontSize: '1.08rem',
                    lineHeight: 1.5,
                    color: 'var(--cor-texto)',
                  }}
                >
                  {cmsConfig.lufy_citacao_foto ||
                    '“Cuidar também é ensinar com calma, até que a confiança encontre seu lugar.”'}
                </p>
              </div>
            </div>

            {/* Coluna Direita: Narrativa do Lufy e Pilares Calma e Coragem */}
            <div>
              <div className="section-line-eyebrow">{cmsConfig.lufy_eyebrow || 'CONHEÇA O LUFY'}</div>

              <h2 style={{ marginBottom: '1.25rem' }}>
                {cmsConfig.lufy_titulo && cmsConfig.lufy_titulo_destaque && cmsConfig.lufy_titulo.includes(cmsConfig.lufy_titulo_destaque) ? (
                  <>
                    {cmsConfig.lufy_titulo.split(cmsConfig.lufy_titulo_destaque)[0]}
                    <span className="texto-italico-terracota">{cmsConfig.lufy_titulo_destaque}</span>
                    {cmsConfig.lufy_titulo.split(cmsConfig.lufy_titulo_destaque)[1]}
                  </>
                ) : (
                  cmsConfig.lufy_titulo || (
                    <>
                      Tecnologia no braço.{' '}
                      <span className="texto-italico-terracota">Afeto</span> no coração.
                    </>
                  )
                )}
              </h2>

              <p
                style={{
                  fontSize: '1.08rem',
                  color: 'var(--cor-texto-suave)',
                  marginBottom: '1.15rem',
                  lineHeight: 1.65,
                }}
              >
                {cmsConfig.lufy_paragrafo_1 ||
                  'Lufy nasceu para ser uma presença familiar nos momentos em que tudo parece novo demais. Um coala guardião que transforma termos difíceis em conversas possíveis.'}
              </p>

              <p
                style={{
                  fontSize: '1.08rem',
                  color: 'var(--cor-texto-suave)',
                  marginBottom: '2rem',
                  lineHeight: 1.65,
                }}
              >
                {cmsConfig.lufy_paragrafo_2 ||
                  'Com seu sensor no braço, ele mostra às crianças que a tecnologia faz parte do cuidado — mas que são o carinho, a informação e a rede de apoio que tornam a jornada mais leve.'}
              </p>

              <div className="grid-2-colunas">
                <div
                  style={{
                    backgroundColor: '#F3EFE8',
                    border: '1px solid var(--cor-borda-suave)',
                    borderRadius: '14px',
                    padding: '1.5rem 1.65rem',
                  }}
                >
                  <h3
                    className="serif-title"
                    style={{
                      color: 'var(--cor-primaria)',
                      fontSize: '1.65rem',
                      marginBottom: '0.3rem',
                    }}
                  >
                    Calma
                  </h3>
                  <p style={{ fontSize: '0.94rem', color: 'var(--cor-texto-suave)' }}>
                    para acolher cada dúvida
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: '#F3EFE8',
                    border: '1px solid var(--cor-borda-suave)',
                    borderRadius: '14px',
                    padding: '1.5rem 1.65rem',
                  }}
                >
                  <h3
                    className="serif-title"
                    style={{
                      color: 'var(--cor-primaria)',
                      fontSize: '1.65rem',
                      marginBottom: '0.3rem',
                    }}
                  >
                    Coragem
                  </h3>
                  <p style={{ fontSize: '0.94rem', color: 'var(--cor-texto-suave)' }}>
                    para construir autonomia
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* FIM DA SEÇÃO "CONHEÇA O LUFY" */}

      {/* =====================================================================
          3. INÍCIO DA SEÇÃO "UM CUIDADO QUE VAI ALÉM — Por que a GlicoCare é diferente?"
          ===================================================================== */}
      <section id="diferenciais" className="section-spacing">
        <div className="container">
          <div style={{ maxWidth: 680, marginBottom: '2.75rem' }}>
            <div className="section-line-eyebrow">UM CUIDADO QUE VAI ALÉM</div>
            <h2 style={{ marginBottom: '1rem' }}>
              Por que a GlicoCare é{' '}
              <span className="texto-italico-terracota">diferente?</span>
            </h2>
            <p
              style={{
                fontSize: '1.08rem',
                color: 'var(--cor-texto-suave)',
              }}
            >
              Não entregamos apenas informação. Criamos caminhos para que ela
              faça sentido na vida real.
            </p>
          </div>

          <div className="grid-3-colunas">
            {/* Card 01 */}
            <article className="diferencial-card">
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '2rem',
                  }}
                >
                  <span className="diferencial-icon-circle" aria-hidden="true">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                  </span>
                  <span
                    className="serif-title"
                    style={{
                      fontStyle: 'italic',
                      color: 'var(--cor-primaria)',
                      fontSize: '1.1rem',
                    }}
                  >
                    01
                  </span>
                </div>

                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.85rem' }}>
                  Pedagogia do Cuidado Escolar
                </h3>
                <p
                  style={{
                    fontSize: '0.95rem',
                    color: 'var(--cor-texto-suave)',
                    marginBottom: '2rem',
                  }}
                >
                  Traduzimos o DM1 para a rotina da escola, criando pontes
                  seguras entre família, educadores e crianças.
                </p>
              </div>
              <div style={{ borderTop: '1px solid var(--cor-borda-suave)' }} />
            </article>

            {/* Card 02 */}
            <article className="diferencial-card">
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '2rem',
                  }}
                >
                  <span className="diferencial-icon-circle" aria-hidden="true">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
                    </svg>
                  </span>
                  <span
                    className="serif-title"
                    style={{
                      fontStyle: 'italic',
                      color: 'var(--cor-primaria)',
                      fontSize: '1.1rem',
                    }}
                  >
                    02
                  </span>
                </div>

                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.85rem' }}>
                  Vivência Real em 1ª Pessoa
                </h3>
                <p
                  style={{
                    fontSize: '0.95rem',
                    color: 'var(--cor-texto-suave)',
                    marginBottom: '2rem',
                  }}
                >
                  Conteúdo construído por quem conhece a rotina, as dúvidas e as
                  pequenas vitórias de perto.
                </p>
              </div>
              <div style={{ borderTop: '1px solid var(--cor-borda-suave)' }} />
            </article>

            {/* Card 03 */}
            <article className="diferencial-card">
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '2rem',
                  }}
                >
                  <span className="diferencial-icon-circle" aria-hidden="true">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="6" r="3" />
                      <path d="M8.5 15.5l7-7" strokeDasharray="2 2" />
                    </svg>
                  </span>
                  <span
                    className="serif-title"
                    style={{
                      fontStyle: 'italic',
                      color: 'var(--cor-primaria)',
                      fontSize: '1.1rem',
                    }}
                  >
                    03
                  </span>
                </div>

                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.85rem' }}>
                  Trilhas por Ciclo de Vida
                </h3>
                <p
                  style={{
                    fontSize: '0.95rem',
                    color: 'var(--cor-texto-suave)',
                    marginBottom: '2rem',
                  }}
                >
                  Orientações que acompanham cada fase — do diagnóstico à
                  autonomia, sem sobrecarregar a família.
                </p>
              </div>
              <div style={{ borderTop: '1px solid var(--cor-borda-suave)' }} />
            </article>
          </div>
        </div>
      </section>
      {/* FIM DA SEÇÃO "UM CUIDADO QUE VAI ALÉM" */}

      {/* =====================================================================
          4. INÍCIO DA SEÇÃO DE CONTEÚDOS (EXPERIÊNCIA HÍBRIDA RESPONSIVA)
             - Desktop: Grade estruturada da Biblioteca de Conteúdos
             - Mobile (<= 768px): Feed Vertical fluido otimizado para o polegar
          ===================================================================== */}
      <section
        id="conteudos"
        className="section-spacing"
        style={{ paddingTop: '1rem' }}
      >
        <div className="container">
          <div style={{ maxWidth: 680, marginBottom: '2rem' }}>
            <div className="section-line-eyebrow">BIBLIOTECA DE CONTEÚDOS</div>
            <h2 style={{ marginBottom: '1rem' }}>
              Informação para a{' '}
              <span className="texto-italico-terracota">vida real.</span>
            </h2>
            <p
              style={{
                fontSize: '1.08rem',
                color: 'var(--cor-texto-suave)',
              }}
            >
              Conteúdos claros, cuidadosos e práticos para consultar no seu
              tempo — em casa, na escola ou entre uma tarefa e outra.
            </p>
          </div>

          {/* Indicador sutil que aparece apenas no celular destacando o Feed Vertical */}
          <div className="indicador-modo-feed">
            <span>📱 Feed Vertical otimizado para leitura rápida</span>
          </div>

          {/* Barra de Filtros por Categoria (Grade no Desktop / Deslize de Polegar no Mobile) */}
          <div className="conteudos-filtros-bar">
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
                onClick={() => setFiltroBiblioteca(aba.id)}
                className={`filtro-pilula ${
                  filtroBiblioteca === aba.id ? 'filtro-pilula--ativo' : ''
                }`}
              >
                {aba.icone && <span aria-hidden="true">{aba.icone}</span>}
                <span>{aba.label}</span>
              </button>
            ))}
          </div>

          {/* Container Híbrido: Grid no Desktop -> Feed Vertical Contínuo no Mobile */}
          <div className="conteudos-hibrido-container">
            {artigosExibidos.map((artigo) => (
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
            ))}
          </div>

          {/* CTA Secundário em Barra/Pílula Larga ("Sugerir um conteúdo ↗") */}
          <SugerirConteudoCTA />
        </div>
      </section>
      {/* FIM DA SEÇÃO DE CONTEÚDOS HÍBRIDA */}

      {/* =====================================================================
          5. SEÇÃO "REDE DE ESPECIALISTAS GLICOCARE" (FASE 2)
          ===================================================================== */}
      {/* INÍCIO BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS (COMENTADO PARA LANÇAMENTO FASE 1) */}
      {FEATURES.TELEMEDICINA_ATIVA && (
        <section
          id="especialistas-home"
          className="section-spacing"
          style={{
            backgroundColor: 'var(--cor-superficie)',
            borderTop: '1px solid var(--cor-borda-suave)',
          }}
        >
          <div className="container">
            <div style={{ maxWidth: 680, marginBottom: '2.5rem' }}>
              <div className="section-line-eyebrow">
                REDE DE ESPECIALISTAS GLICOCARE
              </div>
              <h2 style={{ marginBottom: '1rem' }}>
                Um cuidado que conversa{' '}
                <span className="texto-italico-terracota">entre si.</span>
              </h2>
              <p
                style={{
                  fontSize: '1.08rem',
                  color: 'var(--cor-texto-suave)',
                  marginBottom: '1.65rem',
                }}
              >
                Profissionais verificados para apoiar diferentes dimensões da
                rotina com DM1 — com escuta, clareza e atendimento online.
              </p>

              <Link
                to="/especialistas"
                className="gc-btn gc-btn--contorno-verde"
                style={{ padding: '0.75rem 1.5rem' }}
              >
                <span>Ver rede completa</span>
                <span aria-hidden="true">↗</span>
              </Link>
            </div>

            <div className="grid-2-colunas">
              {REDE_ESPECIALISTAS.map((prof) => (
                <CardEspecialista
                  key={prof.id}
                  id={prof.id}
                  nome={prof.nome}
                  especialidade={prof.especialidade}
                  conselho={prof.conselho}
                  nota={prof.nota}
                  totalAvaliacoes={prof.totalAvaliacoes}
                  fotoUrl={prof.fotoUrl}
                  valorConsulta={prof.valorConsulta}
                  ofereceRetornoIncluso={prof.ofereceRetornoIncluso}
                  prazoRetornoDias={prof.prazoRetornoDias}
                />
              ))}
            </div>
          </div>
        </section>
      )}
      {/* FIM BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS */}

      {/* =====================================================================
          6. INÍCIO DA SEÇÃO ESCURA "ESCOLHA SEU PRÓXIMO PASSO — Um só propósito."
          ===================================================================== */}
      <section id="planos" className="secao-escura-planos">
        <div className="container-leitura">
          <div style={{ textAlign: 'center', marginBottom: '3.25rem' }}>
            <div
              className="section-line-eyebrow section-line-eyebrow--claro"
              style={{ justifyContent: 'center' }}
            >
              ESCOLHA SEU PRÓXIMO PASSO
            </div>

            <h2
              className="serif-title"
              style={{
                fontStyle: 'italic',
                color: '#D59B78',
                fontSize: 'clamp(2.1rem, 4vw, 3rem)',
                marginBottom: '1rem',
              }}
            >
              Um só propósito.
            </h2>

            <p
              style={{
                color: '#A59B92',
                fontSize: '1.08rem',
                maxWidth: 620,
                margin: '0 auto',
              }}
            >
              Apoio para o momento que sua família vive agora, com espaço para
              crescer no seu próprio ritmo.
            </p>
          </div>

          {/* CARD 1: LINHA DE FRENTE 1 — Primeiros Passos (Gratuita) */}
          <article className="plano-card-claro">
            <span className="plano-badge-flutuante">
              RECOMENDADO PARA COMEÇAR
            </span>

            <span
              style={{
                display: 'block',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--cor-primaria)',
                marginBottom: '0.6rem',
              }}
            >
              LINHA DE FRENTE 1
            </span>

            <h3
              style={{
                fontSize: '2.05rem',
                color: 'var(--cor-texto)',
                marginBottom: '0.2rem',
              }}
            >
              Primeiros Passos
            </h3>

            <span
              className="serif-title"
              style={{
                display: 'block',
                fontStyle: 'italic',
                fontSize: '1.4rem',
                color: 'var(--cor-cta)',
                marginBottom: '1rem',
              }}
            >
              Gratuita
            </span>

            <p
              style={{
                color: 'var(--cor-texto-suave)',
                marginBottom: '1.65rem',
              }}
            >
              Para acolher o diagnóstico e organizar a rotina com mais clareza.
            </p>

            <hr
              style={{
                border: 'none',
                borderTop: '1px solid var(--cor-borda-suave)',
                marginBottom: '1.65rem',
              }}
            />

            <ul
              style={{
                listStyle: 'none',
                display: 'grid',
                gap: '0.9rem',
                marginBottom: '2rem',
              }}
            >
              {[
                'Guia prático de acolhimento',
                'Checklist para a escola',
                'Conteúdos essenciais sobre DM1',
                'Comunidade de apoio',
              ].map((item, idx) => (
                <li
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    fontSize: '0.95rem',
                  }}
                >
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      backgroundColor: '#E1ECE0',
                      color: 'var(--cor-cta)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/biblioteca"
              className="especialista-cta-bar"
              style={{ padding: '1.05rem 1.6rem', fontSize: '0.95rem' }}
            >
              <span>Começar gratuitamente</span>
              <span aria-hidden="true">↗</span>
            </Link>
          </article>

          {/* CARD 2: LINHA DE FRENTE 2 — Cuidado Contínuo (Paga) */}
          <article className="plano-card-escuro">
            <span
              style={{
                display: 'block',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#C7A993',
                marginBottom: '0.6rem',
              }}
            >
              LINHA DE FRENTE 2
            </span>

            <h3
              style={{
                fontSize: '2.05rem',
                color: 'var(--cor-superficie)',
                marginBottom: '0.2rem',
              }}
            >
              Cuidado Contínuo
            </h3>

            <span
              className="serif-title"
              style={{
                display: 'block',
                fontStyle: 'italic',
                fontSize: '1.4rem',
                color: '#D2B49C',
                marginBottom: '1rem',
              }}
            >
              Paga
            </span>

            <p style={{ color: '#B5ABA2', marginBottom: '1.65rem' }}>
              Para famílias que buscam aprofundamento e suporte ao longo da
              jornada.
            </p>

            <hr
              style={{
                border: 'none',
                borderTop: '1px solid #4A413B',
                marginBottom: '1.65rem',
              }}
            />

            <ul
              style={{
                listStyle: 'none',
                display: 'grid',
                gap: '0.9rem',
                marginBottom: '2rem',
              }}
            >
              {[
                'Trilhas por fase de vida',
                'Encontros temáticos ao vivo',
                'Materiais aprofundados',
                'Rede de especialistas parceiros',
              ].map((item, idx) => (
                <li
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    fontSize: '0.95rem',
                    color: '#EAE4D9',
                  }}
                >
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      backgroundColor: '#48403A',
                      color: '#D2B49C',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/biblioteca"
              style={{
                width: '100%',
                border: '1px solid #5C524B',
                borderRadius: 'var(--raio-pilula)',
                padding: '1.05rem 1.6rem',
                color: 'var(--cor-superficie)',
                fontWeight: 600,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Conhecer a assinatura</span>
              <span aria-hidden="true">↗</span>
            </Link>
          </article>

          {/* CARD 3: LINHA DE FRENTE 3 — Curadoria GlicoCare (Marketplace) — Exato à imagem media_1794449271421_d3987c81.png */}
          <article className="plano-card-escuro" style={{ marginBottom: 0 }}>
            <span
              style={{
                display: 'block',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#C7A993',
                marginBottom: '0.6rem',
              }}
            >
              LINHA DE FRENTE 3
            </span>

            <h3
              style={{
                fontSize: '2.05rem',
                color: 'var(--cor-superficie)',
                marginBottom: '0.2rem',
              }}
            >
              Curadoria GlicoCare
            </h3>

            <span
              className="serif-title"
              style={{
                display: 'block',
                fontStyle: 'italic',
                fontSize: '1.4rem',
                color: '#D2B49C',
                marginBottom: '1rem',
              }}
            >
              Marketplace
            </span>

            <p style={{ color: '#B5ABA2', marginBottom: '1.65rem' }}>
              Produtos e recursos selecionados para uma rotina mais leve e
              segura.
            </p>

            <hr
              style={{
                border: 'none',
                borderTop: '1px solid #4A413B',
                marginBottom: '1.65rem',
              }}
            />

            <ul
              style={{
                listStyle: 'none',
                display: 'grid',
                gap: '0.9rem',
                marginBottom: '2rem',
              }}
            >
              {[
                'Curadoria de produtos',
                'Parceiros de confiança',
                'Soluções para casa e escola',
                'Condições para a comunidade',
              ].map((item, idx) => (
                <li
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    fontSize: '0.95rem',
                    color: '#EAE4D9',
                  }}
                >
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      backgroundColor: '#48403A',
                      color: '#D2B49C',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* INÍCIO BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS (COMENTADO PARA LANÇAMENTO FASE 1) */}
            {FEATURES.TELEMEDICINA_ATIVA ? (
              <Link
                to="/especialistas"
                style={{
                  width: '100%',
                  border: '1px solid #5C524B',
                  borderRadius: 'var(--raio-pilula)',
                  padding: '1.05rem 1.6rem',
                  color: 'var(--cor-superficie)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>Explorar a curadoria</span>
                <span aria-hidden="true">↗</span>
              </Link>
            ) : (
              <Link
                to="/conteudos"
                style={{
                  width: '100%',
                  border: '1px solid #5C524B',
                  borderRadius: 'var(--raio-pilula)',
                  padding: '1.05rem 1.6rem',
                  color: 'var(--cor-superficie)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                }}
              >
                <span>Explorar Guias e Diário</span>
                <span aria-hidden="true">→</span>
              </Link>
            )}
            {/* FIM BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS */}
          </article>
        </div>
      </section>
      {/* FIM DA SEÇÃO ESCURA "ESCOLHA SEU PRÓXIMO PASSO" */}

      {/* =====================================================================
          7. INÍCIO DA SEÇÃO MANIFESTO FIEL À IMAGEM media_1794449279249_764afcd4.png
          ===================================================================== */}
      <section
        id="manifesto"
        style={{
          backgroundColor: 'var(--cor-superficie)',
          padding: 'clamp(4rem, 8vw, 6.5rem) 0',
          textAlign: 'center',
          borderBottom: '1px solid var(--cor-borda-suave)',
        }}
      >
        <div className="container-leitura">
          {/* Grande aspa decorativa superior */}
          <div
            className="serif-title"
            style={{
              fontSize: '4.5rem',
              lineHeight: 0.7,
              color: '#C8B9A6',
              marginBottom: '1.5rem',
              userSelect: 'none',
            }}
            aria-hidden="true"
          >
            “
          </div>

          {/* Citação central em Fraunces com destaque itálico em Terracota */}
          <blockquote
            className="serif-title"
            style={{
              fontSize: 'clamp(1.65rem, 3.3vw, 2.45rem)',
              lineHeight: 1.35,
              color: 'var(--cor-texto)',
              maxWidth: 780,
              margin: '0 auto 2.5rem',
            }}
          >
            A GlicoCare nasceu da certeza de que{' '}
            <span className="texto-italico-terracota">
              informação sem acolhimento não basta.
            </span>{' '}
            Toda família merece um lugar seguro para aprender, respirar e
            seguir.
          </blockquote>

          {/* Traço horizontal central */}
          <div
            style={{
              width: 56,
              height: 1.5,
              backgroundColor: 'var(--cor-primaria)',
              margin: '0 auto 1.35rem',
            }}
          />

          {/* Assinatura da Fundadora */}
          <strong
            style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--cor-texto)',
              marginBottom: '0.35rem',
            }}
          >
            PRISCILA MANZONI FURLANI
          </strong>
          <span
            style={{
              fontSize: '0.88rem',
              color: 'var(--cor-texto-suave)',
            }}
          >
            Fundadora da GlicoCare
          </span>
        </div>
      </section>
      {/* FIM DA SEÇÃO MANIFESTO */}

      {/* =====================================================================
          8. INÍCIO DA SEÇÃO FAQ FIEL ÀS IMAGENS media_1794449289958 e media_1794449299112
          ===================================================================== */}
      <section id="faq" className="section-spacing">
        <div className="container">
          <div style={{ maxWidth: 680, marginBottom: '3rem' }}>
            <div className="section-line-eyebrow">PERGUNTAS FREQUENTES</div>

            <h2 style={{ marginBottom: '1rem' }}>
              Dúvidas também merecem
              <br />
              <span className="texto-italico-terracota">acolhimento.</span>
            </h2>

            <p
              style={{
                fontSize: '1.08rem',
                color: 'var(--cor-texto-suave)',
                marginBottom: '1.35rem',
              }}
            >
              Reunimos respostas claras para você seguir com mais confiança.
            </p>

            <a
              href="mailto:contato@glicocare.com.br"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontWeight: 700,
                fontSize: '0.94rem',
                color: 'var(--cor-cta)',
              }}
            >
              <span>Ainda tem uma pergunta? Fale com a gente</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>

          {/* Lista Minimalista Numerada (01..05) com divisores horizontais */}
          <div
            className="faq-lista-editorial"
            role="region"
            aria-label="Perguntas Frequentes"
          >
            {PERGUNTAS_FAQ.map((item, indice) => {
              const estaAberto = faqAberto === indice;
              return (
                <div key={item.numero} className="faq-linha-editorial">
                  <button
                    type="button"
                    className="faq-botao-editorial"
                    aria-expanded={estaAberto}
                    onClick={() =>
                      setFaqAberto((atual) =>
                        atual === indice ? null : indice
                      )
                    }
                  >
                    <span className="faq-numero-editorial">{item.numero}</span>
                    <span className="faq-titulo-editorial">
                      {item.pergunta}
                    </span>
                    <span
                      style={{
                        color: 'var(--cor-primaria)',
                        fontSize: '1.35rem',
                        fontWeight: 400,
                        lineHeight: 1,
                      }}
                      aria-hidden="true"
                    >
                      {estaAberto ? '−' : '+'}
                    </span>
                  </button>

                  {estaAberto && (
                    <div className="faq-resposta-editorial">
                      <p>{item.resposta}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* FIM DA SEÇÃO FAQ */}

      {/* =====================================================================
          9. INÍCIO DA SEÇÃO CTA FINAL (DINÂMICO CMS)
          ===================================================================== */}
      <section
        id="cta-final"
        style={{
          backgroundColor: 'var(--cor-superficie)',
          borderTop: '1px solid var(--cor-borda-suave)',
          padding: 'clamp(3.5rem, 6vw, 5.5rem) 0',
          textAlign: 'center',
        }}
      >
        <div className="container" style={{ maxWidth: '820px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.35rem)',
              color: 'var(--cor-texto)',
              marginBottom: '1.25rem',
            }}
          >
            {cmsConfig.cta_final_titulo || 'Dê o primeiro passo para uma rotina mais serena.'}
          </h2>
          <p
            style={{
              fontSize: '1.1rem',
              color: 'var(--cor-texto-suave)',
              lineHeight: 1.6,
              marginBottom: '2.25rem',
              maxWidth: '640px',
              marginInline: 'auto',
            }}
          >
            {cmsConfig.cta_final_subtitulo ||
              'Junte-se a centenas de famílias que transformaram o medo em aprendizado e confiança diária.'}
          </p>
          <a
            href="#planos"
            className="gc-btn gc-btn--primario"
            style={{ padding: '0.95rem 2.25rem', fontSize: '1.05rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span>{cmsConfig.cta_final_botao || 'Conheça nossos planos e comece hoje'}</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>
      {/* FIM DA SEÇÃO CTA FINAL */}
    </div>
  );
}
/* FIM DO COMPONENTE PÁGINA HOME */
