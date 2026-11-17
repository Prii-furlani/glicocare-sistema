/* ==========================================================================
   ARQUIVO: ComoFuncionaAtendimentos.jsx
   PÁGINA: Como Funcionam os Atendimentos ("Atendimento Humanizado e Sem Pressa")
   OBJETIVO: Página editorial explicativa com layout fluido direto no fundo bege
   (#EAE4D9), detalhando a jornada completa de consulta na GlicoCare:
   1. Hero com acolhimento e compromisso com o tempo da família;
   2. 5 passos estruturados em cards leves (Escolha, Agendamento, Pagamento
      Seguro em Custódia, Pré-Atendimento Acolhedor, Teleconsulta Nativa);
   3. Bloco de Destaque: Por que o Pré-Atendimento transforma a consulta;
   4. FAQ interativo em Accordion tirando dúvidas práticas;
   5. CTA final convidando a conhecer a rede de especialistas.
   ========================================================================== */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/* Ícones SVG embutidos para máxima fidelidade e leveza */
function IconeBusca() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );
}

function IconeCalendario() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
}

function IconeEscudoSeguro() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      <polyline points="9 12 11 14 15 10"></polyline>
    </svg>
  );
}

function IconeFormularioAcolhedor() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  );
}

function IconeTeleconsulta() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"></polygon>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
    </svg>
  );
}

function IconeCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B7E48" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}

function IconeChevron({ aberto }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: aberto ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.25s ease',
      }}
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
}

export default function ComoFuncionaAtendimentos() {
  // Controle de abertura do FAQ em accordion
  const [faqAberto, setFaqAberto] = useState(null);

  const toggleFaq = (index) => {
    setFaqAberto(faqAberto === index ? null : index);
  };

  const PASSOS_ATENDIMENTO = [
    {
      numero: '01',
      icone: <IconeBusca />,
      titulo: 'Escolha o especialista ideal para o seu momento',
      descricao:
        'Filtre endocrinologistas, nutricionistas, educadores físicos e psicólogos com CRM, CRN, CREF ou CRP ativos e verificados. Conheça a biografia, a metodologia de escuta e o relato de outras famílias que vivem o DM1.',
      destaque: 'Filtros por infância, esporte, diagnóstico recente e contagem de carboidratos.',
    },
    {
      numero: '02',
      icone: <IconeCalendario />,
      titulo: 'Agende com tranquilidade na agenda em tempo real',
      descricao:
        'Sem intermediários demorados no WhatsApp ou secretárias desavisadas. Veja os dias e horários reais disponíveis na rotina do especialista e selecione o momento que melhor se encaixa na rotina da sua casa.',
      destaque: 'Bloqueio instantâneo do horário e lembretes acolhedores por e-mail.',
    },
    {
      numero: '03',
      icone: <IconeEscudoSeguro />,
      titulo: 'Pagamento 100% seguro com custódia protegida',
      descricao:
        'A transação é realizada diretamente na plataforma GlicoCare. O valor pago permanece em custódia segura até que o atendimento seja concluído com respeito e atenção, emitindo recibo para reembolso e convênio.',
      destaque: 'Garantia total de acolhimento e proteção de ponta a ponta (RN-FIN-03).',
    },
    {
      numero: '04',
      icone: <IconeFormularioAcolhedor />,
      titulo: 'O Pré-Atendimento Acolhedor que muda o jogo',
      descricao:
        'Dias antes da consulta, você preenche um roteiro humanizado contando o que mais tira o seu sono, dúvidas que não quer esquecer e, se desejar, compartilha seu diário de glicemia e histórico de insulinas.',
      destaque: 'O profissional entra na chamada sabendo tudo sobre o seu contexto.',
    },
    {
      numero: '05',
      icone: <IconeTeleconsulta />,
      titulo: 'Teleconsulta nativa e plano de ação conjunto',
      descricao:
        'Conecte-se com um clique através do celular ou computador, sem instalar nenhum programa. Uma consulta sem pressa, com foco na vida real e emissão integrada de receitas digitais válidas em todo o Brasil.',
      destaque: 'Sala segura com áudio/vídeo nativo e documentos salvos no seu perfil.',
    },
  ];

  const BENEFICIOS_PRE_ATENDIMENTO = [
    {
      titulo: 'Zero tempo perdido com perguntas repetitivas',
      descricao:
        'Em vez de passar 20 minutos respondendo qual insulina usa, qual sensor colocou ou se tem alergias, o especialista já inicia a consulta focado nas decisões clínicas e no acolhimento.',
    },
    {
      titulo: 'Você não esquece nenhuma dúvida importante',
      descricao:
        'Na correria da rotina com diabetes, esquecemos perguntas cruciais na hora em que o médico pergunta "mais alguma coisa?". Com o pré-atendimento, você registra tudo no seu tempo.',
    },
    {
      titulo: 'Foco total nas suas dores e metas reais',
      descricao:
        'Se o problema são madrugadas em claro por medo de hipoglicemia, o profissional já estrutura o plano para devolver o sono e a segurança da sua família.',
    },
  ];

  const FAQS = [
    {
      pergunta: 'Preciso instalar algum aplicativo específico para a teleconsulta?',
      resposta:
        'Não! Nossa sala de teleconsulta nativa funciona diretamente no navegador de internet do seu celular, tablet ou computador. Ao chegar a hora marcada, basta clicar no botão de acesso dentro da sua conta GlicoCare.',
    },
    {
      pergunta: 'O que acontece se eu tiver um imprevisto e precisar remarcar?',
      resposta:
        'Nós entendemos que a rotina com diabetes é dinâmica e imprevistos acontecem. Você pode solicitar a remarcação da sua consulta diretamente pelo seu painel com antecedência, escolhendo uma nova data na agenda do profissional com total respeito e tranquilidade.',
    },
    {
      pergunta: 'O especialista terá acesso ao meu diário de glicemia e registros?',
      resposta:
        'Somente se você autorizar no formulário de Pré-Atendimento. Caso opte por compartilhar, o profissional terá acesso visual às suas médias, tempo no alvo, doses e anotações de rotina, tornando as orientações muito mais precisas e personalizadas.',
    },
    {
      pergunta: 'Como recebo as receitas, laudos médicos e o plano alimentar?',
      resposta:
        'Logo após o encerramento do atendimento, o especialista emite e assina digitalmente as receitas médicas, pedidos de exames e laudos. Todos os arquivos ficam salvos em PDF de alta resolução na sua área pessoal e também são enviados por e-mail com assinatura eletrônica válida em farmácias e laboratórios de todo o Brasil.',
    },
  ];

  return (
    <div
      style={{
        backgroundColor: 'var(--cor-fundo)',
        minHeight: '100vh',
        paddingTop: 'var(--espaco-xl)',
        paddingBottom: 'var(--espaco-2xl)',
      }}
    >
      <div className="container" style={{ maxWidth: '1080px', margin: '0 auto' }}>
        {/* ====================================================================
            1. HERO SECTION (Layout fluido e direto sobre o fundo bege)
            ==================================================================== */}
        <section
          style={{
            textAlign: 'center',
            maxWidth: '820px',
            margin: '0 auto 3.5rem auto',
            padding: '1rem 0.5rem',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(124, 83, 63, 0.08)',
              color: 'var(--cor-primaria)',
              padding: '0.4rem 1.1rem',
              borderRadius: '999px',
              fontSize: '0.84rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '1.25rem',
            }}
          >
            <span>— ATENDIMENTO HUMANIZADO E SEM PRESSA</span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--fonte-titulo)',
              fontSize: 'clamp(2.1rem, 4.5vw, 3.25rem)',
              lineHeight: 1.15,
              color: 'var(--cor-texto)',
              marginBottom: '1.25rem',
            }}
          >
            Consultas que acolhem, esclarecem e{' '}
            <span
              style={{
                fontStyle: 'italic',
                color: 'var(--cor-primaria)',
              }}
            >
              respeitam o tempo
            </span>{' '}
            da sua família.
          </h1>

          <p
            style={{
              fontSize: '1.15rem',
              color: 'var(--cor-texto-suave)',
              lineHeight: 1.7,
              marginBottom: '2rem',
            }}
          >
            Aqui você não é um número ou uma glicemia isolada. Nossos especialistas
            em Diabetes Tipo 1 dedicam tempo de verdade para ouvir sua história,
            compreender as nuances do seu dia a dia e construir soluções possíveis
            junto com você.
          </p>

          {/* Selos de Confiança em Destaque */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '1rem',
              fontSize: '0.9rem',
              color: 'var(--cor-texto)',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'var(--cor-superficie)',
                padding: '0.45rem 0.9rem',
                borderRadius: '12px',
                border: '1px solid var(--cor-borda-suave)',
              }}
            >
              <IconeCheck /> Especialistas com conselho verificado
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'var(--cor-superficie)',
                padding: '0.45rem 0.9rem',
                borderRadius: '12px',
                border: '1px solid var(--cor-borda-suave)',
              }}
            >
              <IconeCheck /> Pagamento seguro em custódia interna
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'var(--cor-superficie)',
                padding: '0.45rem 0.9rem',
                borderRadius: '12px',
                border: '1px solid var(--cor-borda-suave)',
              }}
            >
              <IconeCheck /> Teleconsulta nativa sem instalar nada
            </span>
          </div>
        </section>

        {/* ====================================================================
            2. OS 5 PASSOS DO ATENDIMENTO GLICOCARE
            ==================================================================== */}
        <section style={{ marginBottom: '4rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--cor-primaria)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              DA ESCOLHA AO PLANO DE AÇÃO
            </span>
            <h2
              style={{
                fontFamily: 'var(--fonte-titulo)',
                fontSize: 'clamp(1.75rem, 3vw, 2.35rem)',
                marginTop: '0.5rem',
              }}
            >
              Como funciona o seu atendimento passo a passo
            </h2>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            {PASSOS_ATENDIMENTO.map((passo, idx) => (
              <div
                key={passo.numero}
                style={{
                  backgroundColor: 'var(--cor-superficie)',
                  borderRadius: '20px',
                  border: '1px solid var(--cor-borda-suave)',
                  padding: '2rem 2.25rem',
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: '1.75rem',
                  alignItems: 'flex-start',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                {/* Coluna Esquerda: Número Grande e Ícone */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.6rem',
                    minWidth: '64px',
                  }}
                >
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '16px',
                      backgroundColor: idx === 3 ? 'rgba(59, 126, 72, 0.12)' : 'rgba(124, 83, 63, 0.08)',
                      color: idx === 3 ? 'var(--cor-cta)' : 'var(--cor-primaria)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {passo.icone}
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--fonte-titulo)',
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: idx === 3 ? 'var(--cor-cta)' : 'var(--cor-primaria)',
                    }}
                  >
                    {passo.numero}
                  </span>
                </div>

                {/* Coluna Direita: Informações */}
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--fonte-titulo)',
                      fontSize: '1.35rem',
                      color: 'var(--cor-texto)',
                      marginBottom: '0.6rem',
                    }}
                  >
                    {passo.titulo}
                  </h3>
                  <p
                    style={{
                      fontSize: '1.02rem',
                      color: 'var(--cor-texto-suave)',
                      lineHeight: 1.65,
                      marginBottom: '0.85rem',
                    }}
                  >
                    {passo.descricao}
                  </p>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: idx === 3 ? 'var(--cor-cta)' : 'var(--cor-primaria)',
                      backgroundColor: idx === 3 ? 'rgba(59, 126, 72, 0.08)' : 'rgba(124, 83, 63, 0.06)',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '8px',
                    }}
                  >
                    <span>✨</span>
                    <span>{passo.destaque}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ====================================================================
            3. BLOCO DE DESTAQUE: POR QUE O PRÉ-ATENDIMENTO É REVOLUCIONÁRIO?
            ==================================================================== */}
        <section
          style={{
            backgroundColor: 'var(--cor-superficie)',
            borderRadius: '24px',
            border: '1px solid var(--cor-borda-suave)',
            borderLeft: '6px solid var(--cor-cta)',
            padding: 'clamp(2rem, 4vw, 3rem)',
            marginBottom: '4.5rem',
            boxShadow: '0 8px 24px rgba(59, 126, 72, 0.06)',
          }}
        >
          <div style={{ maxWidth: '840px', marginBottom: '2rem' }}>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--cor-cta)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '0.5rem',
              }}
            >
              METODOLOGIA EXCLUSIVA GLICOCARE • PRÉ-ATENDIMENTO ACOLHEDOR
            </span>
            <h2
              style={{
                fontFamily: 'var(--fonte-titulo)',
                fontSize: 'clamp(1.75rem, 3.2vw, 2.35rem)',
                color: 'var(--cor-texto)',
                lineHeight: 1.2,
                marginBottom: '1rem',
              }}
            >
              Por que o Pré-Atendimento transforma a sua consulta?
            </h2>
            <p
              style={{
                fontSize: '1.08rem',
                color: 'var(--cor-texto-suave)',
                lineHeight: 1.65,
              }}
            >
              Em consultas tradicionais, metade da hora médica vai embora preenchendo
              fichas frias e repetindo marcas de insulinas. Na GlicoCare, nós
              invertemos essa lógica para que seu tempo de contato com o especialista
              seja 100% terapêutico, focado e transformador.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {BENEFICIOS_PRE_ATENDIMENTO.map((item, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid var(--cor-borda-suave)',
                  padding: '1.6rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(59, 126, 72, 0.14)',
                      color: 'var(--cor-cta)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <h4
                    style={{
                      fontFamily: 'var(--fonte-corpo)',
                      fontWeight: 700,
                      fontSize: '1.05rem',
                      color: 'var(--cor-texto)',
                      lineHeight: 1.3,
                    }}
                  >
                    {item.titulo}
                  </h4>
                </div>
                <p
                  style={{
                    fontSize: '0.94rem',
                    color: 'var(--cor-texto-suave)',
                    lineHeight: 1.6,
                  }}
                >
                  {item.descricao}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ====================================================================
            4. PERGUNTAS FREQUENTES (FAQ EM ACCORDION INTERATIVO)
            ==================================================================== */}
        <section style={{ maxWidth: '860px', margin: '0 auto 4.5rem auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--cor-primaria)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              TRANSPARÊNCIA TOTAL
            </span>
            <h2
              style={{
                fontFamily: 'var(--fonte-titulo)',
                fontSize: 'clamp(1.75rem, 3vw, 2.35rem)',
                marginTop: '0.5rem',
              }}
            >
              Dúvidas frequentes sobre o atendimento
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {FAQS.map((faq, idx) => {
              const estaAberto = faqAberto === idx;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'var(--cor-superficie)',
                    borderRadius: '16px',
                    border: '1px solid var(--cor-borda-suave)',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    style={{
                      width: '100%',
                      padding: '1.35rem 1.6rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontFamily: 'var(--fonte-corpo)',
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      color: 'var(--cor-texto)',
                    }}
                    aria-expanded={estaAberto}
                  >
                    <span>{faq.pergunta}</span>
                    <span style={{ color: 'var(--cor-primaria)' }}>
                      <IconeChevron aberto={estaAberto} />
                    </span>
                  </button>

                  {estaAberto && (
                    <div
                      style={{
                        padding: '0 1.6rem 1.35rem 1.6rem',
                        fontSize: '0.98rem',
                        color: 'var(--cor-texto-suave)',
                        lineHeight: 1.65,
                        borderTop: '1px solid rgba(124, 83, 63, 0.08)',
                        paddingTop: '1rem',
                      }}
                    >
                      {faq.resposta}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ====================================================================
            5. SEÇÃO FINAL: CHAMADA PARA AÇÃO (CTA)
            ==================================================================== */}
        <section
          style={{
            backgroundColor: 'var(--cor-superficie)',
            borderRadius: '24px',
            border: '1px solid var(--cor-borda-suave)',
            padding: 'clamp(2.5rem, 5vw, 3.5rem) 2rem',
            textAlign: 'center',
            maxWidth: '860px',
            margin: '0 auto',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)',
          }}
        >
          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--cor-cta)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '0.75rem',
            }}
          >
            DÊ O PRIMEIRO PASSO PARA UMA ROTINA MAIS LEVE
          </span>

          <h2
            style={{
              fontFamily: 'var(--fonte-titulo)',
              fontSize: 'clamp(1.9rem, 3.5vw, 2.6rem)',
              color: 'var(--cor-texto)',
              marginBottom: '1rem',
              lineHeight: 1.2,
            }}
          >
            Pronto para ter um acompanhamento que{' '}
            <span style={{ fontStyle: 'italic', color: 'var(--cor-primaria)' }}>
              realmente te escuta?
            </span>
          </h2>

          <p
            style={{
              fontSize: '1.08rem',
              color: 'var(--cor-texto-suave)',
              maxWidth: '620px',
              margin: '0 auto 2rem auto',
              lineHeight: 1.65,
            }}
          >
            Escolha um especialista credenciado, agende sua teleconsulta no seu tempo
            e sinta a tranquilidade de quem caminha ao seu lado no Diabetes Tipo 1.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '1rem',
            }}
          >
            <Link
              to="/especialistas"
              className="gc-btn gc-btn--primario"
              style={{
                backgroundColor: 'var(--cor-cta)',
                color: '#FFFFFF',
                padding: '0.95rem 2rem',
                fontSize: '1.02rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 6px 18px rgba(59, 126, 72, 0.25)',
              }}
            >
              <span>Conhecer nossos especialistas</span>
              <span aria-hidden="true">→</span>
            </Link>

            <Link
              to="/biblioteca"
              className="gc-btn gc-btn--contorno-verde"
              style={{
                padding: '0.95rem 1.6rem',
                fontSize: '1.02rem',
              }}
            >
              <span>Explorar conteúdos gratuitos</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
