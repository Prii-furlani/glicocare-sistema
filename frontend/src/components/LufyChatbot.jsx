/* ==========================================================================
   ARQUIVO: LufyChatbot.jsx
   COMPONENTE: LufyChatbot (Widget de Chat Flutuante Interativo — Mascote Lufy)
   OBJETIVO: Fornecer suporte humanizado e triagem por cenários para famílias
   lidando com Diabetes Tipo 1 (DM1), reproduzindo fielmente o design oficial:
   1. Botão Flutuante (position: fixed, bottom: 24px, right: 24px) em marfim
      suave (#F6F3EE) com imagem circular do Lufy e "Fale com o Lufy";
   2. Cabeçalho em Terracota (#7C533F) "Lufy, guardião GlicoCare — APOIO PARA
      O PRÓXIMO PASSO";
   3. Mensagem de boas-vindas empática e os 4 botões de atalho rápido (🩸, 🍬,
      🏫, 🌙);
   4. Resposta estruturada em 3 blocos para cada cenário: Acolhimento Imediato,
      Orientação Médica Obrigatória (Disclaimer) e Card "PARA LER COM CALMA"
      com link direto para a Biblioteca GlicoCare.
   ========================================================================== */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logoGlicoCare from '../assets/logo-glicocare.jpg';

/* INÍCIO DOS 4 CENÁRIOS DE TRIAGEM E RESPOSTAS ESTRUTURADAS DO LUFY */
const CENARIOS_LUFY = [
  {
    id: 'alta',
    icone: '🩸',
    rotuloBotao: 'A glicemia está muito alta (Acima da meta)',
    // 1. Acolhimento Imediato
    acolhimento:
      'Ei, respira fundo, estou aqui com você. Ver um número alto no visor assusta, mas mais de 40 fatores influenciam a glicemia além da comida. Você não falhou.',
    // 2. Aviso Médico Obrigatório (Disclaimer)
    orientacaoMedica:
      'Siga rigorosamente o plano de ação personalizado do seu endocrinologista para correções e incentive a hidratação com água. Nunca aplique doses extras seguidas sem orientação e procure o médico ou serviço de emergência diante de náuseas, vômitos, dor abdominal ou cetonas.',
    // 3. Sugestão de Conteúdo Contextual ("PARA LER COM CALMA")
    sugestaoConteudo: {
      categoria: 'TECNOLOGIA & AUTONOMIA',
      titulo: 'Como conversar sobre números sem culpa',
      descricao:
        'Uma abordagem acolhedora para transformar leituras de glicemia em informação útil — nunca em julgamento.',
      rota: '/artigo/6',
    },
  },
  {
    id: 'baixa',
    icone: '🍬',
    rotuloBotao: 'A glicemia está muito baixa (Sintomas de Hipoglicemia)',
    // 1. Acolhimento Imediato
    acolhimento:
      'Ei, respira fundo, estou aqui com você. Sua serenidade agora transmite segurança imediata para a criança. Vamos seguir um passo de cada vez.',
    // 2. Aviso Médico Obrigatório (Disclaimer)
    orientacaoMedica:
      'O plano de ação personalizado do seu endocrinologista vem sempre em primeiro lugar (como oferecer carboidrato de absorção rápida se a criança estiver consciente e reavaliar após 15 minutos). Diante de sonolência intensa, dificuldade para engolir, convulsão ou inconsciência, acione o serviço de emergência médica imediatamente.',
    // 3. Sugestão de Conteúdo Contextual ("PARA LER COM CALMA")
    sugestaoConteudo: {
      categoria: 'COM O LUFY',
      titulo: 'Hipoglicemia sem susto: um plano para toda a família',
      descricao:
        'Sinais, combinados e passos simples para agir com segurança e transmitir calma às crianças.',
      rota: '/artigo/1',
    },
  },
  {
    id: 'escola',
    icone: '🏫',
    rotuloBotao: 'Dúvida ou conflito na escola',
    // 1. Acolhimento Imediato
    acolhimento:
      'Ei, respira. Conflitos na escola mexem com toda a família, e pedir uma conversa clara não é exagero. Você está protegendo a rotina e o direito ao cuidado.',
    // 2. Aviso Médico Obrigatório (Disclaimer)
    orientacaoMedica:
      'Se a situação envolver alteração glicêmica ou sintomas físicos, o plano do endocrinologista vem primeiro. Oriente a escola a procurar a equipe médica ou o serviço de emergência diante de sinais graves.',
    // 3. Sugestão de Conteúdo Contextual ("PARA LER COM CALMA")
    sugestaoConteudo: {
      categoria: 'ROTINA ESCOLAR',
      titulo: 'DM1 na escola: parceria que acolhe',
      descricao:
        'Um roteiro para alinhar família, educadores e equipe de cuidado.',
      rota: '/artigo/2',
    },
  },
  {
    id: 'madrugada',
    icone: '🌙',
    rotuloBotao: 'Madrugada difícil / Exaustão emocional',
    // 1. Acolhimento Imediato
    acolhimento:
      'Ei, respira fundo, estou aqui acordado com você. As madrugadas em claro pesam no corpo e no coração, mas o cuidado que você dedica é extraordinário.',
    // 2. Aviso Médico Obrigatório (Disclaimer)
    orientacaoMedica:
      'Em oscilações noturnas, siga sempre as metas e orientações do endocrinologista responsável e confirme leituras duvidosas na ponta de dedo. Se notar sintomas físicos graves ou hipoglicemia severa na madrugada, procure o serviço de emergência imediatamente.',
    // 3. Sugestão de Conteúdo Contextual ("PARA LER COM CALMA")
    sugestaoConteudo: {
      categoria: 'TECNOLOGIA & AUTONOMIA',
      titulo: 'Sensores, leitores e rotina: construindo autonomia com tranquilidade',
      descricao:
        'Como transformar dados do dia a dia em apoio — sem que os números virem motivo de tensão constante.',
      rota: '/artigo/3',
    },
  },
];
/* FIM DOS 4 CENÁRIOS DE TRIAGEM E RESPOSTAS ESTRUTURADAS */

/* INÍCIO DO COMPONENTE LUFY CHATBOT */
export default function LufyChatbot() {
  const location = useLocation();

  // INÍCIO: OCULTA O BOTÃO DO LUFY NA SALA DE TELECONSULTA PARA EVITAR POLUIÇÃO VISUAL
  if (
    location.pathname.startsWith('/sala-consulta') ||
    location.pathname.startsWith('/atendimento-nativo')
  ) {
    return null;
  }
  // FIM: OCULTA O BOTÃO DO LUFY NA SALA DE TELECONSULTA

  // Controla se a janela do chat está aberta ou recolhida no botão flutuante
  const [aberto, setAberto] = useState(false);

  // Guarda o objeto do cenário atualmente selecionado (null exibe a lista inicial dos 4 cenários)
  const [cenarioSelecionado, setCenarioSelecionado] = useState(null);

  return (
    <div className="lufy-widget-container">
      {/* ====================================================================
          INÍCIO DA JANELA DE CHAT FLUTUANTE DO LUFY
          ==================================================================== */}
      {aberto && (
        <section
          className="lufy-chat-window"
          aria-label="Assistente virtual Lufy, guardião GlicoCare"
        >
          {/* 1. CABEÇALHO EM TERRACOTA (#7C533F) FIEL AO DESIGN */}
          <header className="lufy-chat-header">
            <div className="lufy-chat-header-info">
              <div className="lufy-chat-header-avatar-wrap">
                <img
                  src={logoGlicoCare}
                  alt="Selo do mascote Lufy"
                  className="lufy-chat-header-avatar"
                />
                <span className="lufy-chat-status-dot" aria-hidden="true" />
              </div>
              <div>
                <h3 className="lufy-chat-header-title">
                  Lufy, guardião GlicoCare
                </h3>
                <span className="lufy-chat-header-subtitle">
                  APOIO PARA O PRÓXIMO PASSO
                </span>
              </div>
            </div>

            <button
              type="button"
              className="lufy-chat-close-btn"
              aria-label="Fechar janela de chat do Lufy"
              onClick={() => setAberto(false)}
            >
              ✕
            </button>
          </header>

          {/* 2. CORPO DE MENSAGENS E TRIAGEM POR CENÁRIOS */}
          <div className="lufy-chat-body">
            {/* Mensagem Inicial de Boas-Vindas do Lufy */}
            <div className="lufy-msg-row">
              <img
                src={logoGlicoCare}
                alt="Lufy"
                className="lufy-msg-mini-avatar"
              />
              <div className="lufy-msg-bubble">
                Olá! Sou o Lufy, o guardião da GlicoCare. Estou aqui para te
                ajudar. O que está acontecendo agora?
              </div>
            </div>

            {/* ESTADO A: Nenhum cenário clicado ainda -> Exibe os 4 botões de atalho rápido */}
            {!cenarioSelecionado ? (
              <div className="lufy-scenarios-section">
                <span className="lufy-scenarios-eyebrow">
                  ESCOLHA O CENÁRIO MAIS PRÓXIMO
                </span>

                {CENARIOS_LUFY.map((cenario) => (
                  <button
                    key={cenario.id}
                    type="button"
                    className="lufy-scenario-btn"
                    onClick={() => setCenarioSelecionado(cenario)}
                  >
                    <span
                      className="lufy-scenario-icon-circle"
                      aria-hidden="true"
                    >
                      {cenario.icone}
                    </span>
                    <span className="lufy-scenario-label">
                      {cenario.rotuloBotao}
                    </span>
                    <span className="lufy-scenario-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              /* ESTADO B: Cenário selecionado -> Exibe a escolha + os 3 blocos obrigatórios */
              <>
                {/* Balão Verde Alívio (#3B7E48) à direita com o cenário escolhido */}
                <div className="lufy-user-choice-row">
                  <div className="lufy-user-choice-bubble">
                    <span aria-hidden="true">{cenarioSelecionado.icone}</span>
                    <span>{cenarioSelecionado.rotuloBotao}</span>
                  </div>
                </div>

                {/* Bloco 1: Acolhimento Imediato com o mini-avatar do Lufy */}
                <div className="lufy-msg-row">
                  <img
                    src={logoGlicoCare}
                    alt="Lufy"
                    className="lufy-msg-mini-avatar"
                  />
                  <div className="lufy-msg-bubble">
                    {cenarioSelecionado.acolhimento}
                  </div>
                </div>

                {/* Thread indentada com o Bloco 2 (Aviso Médico) e Bloco 3 (Conteúdo Contextual) */}
                <div className="lufy-response-thread">
                  {/* Bloco 2: Aviso Médico Obrigatório (Disclaimer) */}
                  <div className="lufy-medical-disclaimer-card">
                    <div className="lufy-medical-disclaimer-header">
                      {/* Ícone de escudo com check em Terracota (#7C533F) */}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                      <span>ORIENTAÇÃO MÉDICA OBRIGATÓRIA</span>
                    </div>
                    <p className="lufy-medical-disclaimer-text">
                      {cenarioSelecionado.orientacaoMedica}
                    </p>
                  </div>

                  {/* Bloco 3: Sugestão de Conteúdo Contextual ("PARA LER COM CALMA") */}
                  <div className="lufy-content-suggestion-card">
                    <div className="lufy-content-suggestion-header">
                      {/* Ícone de livro aberto em Verde Alívio (#3B7E48) */}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                      </svg>
                      <span>PARA LER COM CALMA</span>
                    </div>

                    <span className="lufy-content-suggestion-category">
                      {cenarioSelecionado.sugestaoConteudo.categoria}
                    </span>

                    <h4 className="lufy-content-suggestion-title">
                      {cenarioSelecionado.sugestaoConteudo.titulo}
                    </h4>

                    <p className="lufy-content-suggestion-desc">
                      {cenarioSelecionado.sugestaoConteudo.descricao}
                    </p>

                    <Link
                      to={cenarioSelecionado.sugestaoConteudo.rota}
                      className="lufy-content-suggestion-cta"
                      onClick={() => setAberto(false)}
                    >
                      <span>Abrir na Biblioteca GlicoCare</span>
                      <span aria-hidden="true">↗</span>
                    </Link>
                  </div>

                  {/* Link para voltar à escolha dos 4 cenários */}
                  <button
                    type="button"
                    className="lufy-reset-scenario-btn"
                    onClick={() => setCenarioSelecionado(null)}
                  >
                    Escolher outro cenário
                  </button>
                </div>
              </>
            )}
          </div>

          {/* 3. RODAPÉ INSTITUCIONAL DE SEGURANÇA CLÍNICA */}
          <footer className="lufy-chat-footer">
            O Lufy oferece apoio pedagógico e emocional. Não substitui avaliação
            ou orientação médica.
          </footer>
        </section>
      )}
      {/* FIM DA JANELA DE CHAT FLUTUANTE DO LUFY */}

      {/* ====================================================================
          INÍCIO DO BOTÃO FLUTUANTE DISCRETO (TRIGGER) NO CANTO INFERIOR DIREITO
          Redesenhado de forma compacta e discreta para nunca obstruir cards ou ações
          ==================================================================== */}
      <button
        type="button"
        className="lufy-floating-trigger lufy-floating-trigger--discreto"
        onClick={() => setAberto(!aberto)}
        aria-expanded={aberto}
        title="Fale com o Lufy — Apoio GlicoCare"
        aria-label="Fale com o Lufy — Assistente virtual de apoio em diabetes"
      >
        {/* Imagem circular do Lufy com indicador verde */}
        <div style={{ position: 'relative', width: 42, height: 42, flexShrink: 0 }}>
          <img
            src={logoGlicoCare}
            alt="Mascote Lufy — Guardião GlicoCare"
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1.5px solid var(--cor-borda)',
            }}
          />
          <span
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: 'var(--cor-cta)', // Verde alívio (#3B7E48)
              border: '2px solid var(--cor-superficie)',
            }}
          />
        </div>

        {/* Rótulo compacto que surge suavemente em desktop ou hover sem obstruir a tela */}
        <span className="lufy-floating-trigger__label">
          Lufy
        </span>
      </button>
      {/* FIM DO BOTÃO FLUTUANTE (TRIGGER) */}
    </div>
  );
}
/* FIM DO COMPONENTE LUFY CHATBOT */
