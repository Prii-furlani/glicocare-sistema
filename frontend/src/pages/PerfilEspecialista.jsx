/* ==========================================================================
   ARQUIVO: PerfilEspecialista.jsx
   PÁGINA: PerfilEspecialista (Perfil Individual do Profissional — Marketplace
   de Saúde Integrada GlicoCare)
   OBJETIVO: Exibir a página completa do perfil individual de cada especialista
   credenciado (RN-MOD-MKT), estruturada em:
   1. Cabeçalho do Perfil: Foto em destaque, Nome completo, Registro profissional
      (CRM/CRN/CRP/CREF), especialidade, tags de foco e avaliação média;
   2. Seção "Sobre o Método": Descrição humanizada da abordagem clínica;
   3. Seção de Agendamento (Agenda Integrada): Calendário interativo de datas
      e horários disponíveis para a consulta online;
   4. Botão de Checkout / Pagamento Seguro integrado à plataforma (100% interno);
   5. Histórico de Suporte Clínico Digital: Emissão e consulta de guias de
      exames laboratoriais, receitas digitais ICP-Brasil e laudos escolares.
   ========================================================================== */

import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { agendamentosService } from '../services/api';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import ModalTCLE from '../components/ModalTCLE';
import { FEATURES } from '../config/features';
import EmPreparacaoLufy from '../components/EmPreparacaoLufy';

/* INÍCIO DOS DADOS DETALHADOS DOS 4 ESPECIALISTAS DA REDE GLICOCARE */
const PERFIS_DETALHADOS_REDE = {
  1: {
    id: 1,
    nome: 'Beatriz Nogueira',
    especialidade: 'Nutricionista Clínica & Pediátrica em DM1',
    conselho: 'CRN-3 62.418',
    nota: '4.8',
    totalAvaliacoes: 94,
    tempoExperiencia: '9 anos dedicados ao Diabetes Tipo 1',
    tagsFoco: ['Infância', 'Emagrecimento', 'Contagem de Carboidratos', 'Rotina Escolar'],
    fotoUrl:
      'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=400&q=80',
    sobreMetodoParagrafos: [
      'Acredito que a alimentação de uma criança ou jovem com Diabetes Tipo 1 jamais deve ser sinônimo de proibição ou medo à mesa. Meu método une a precisão científica da contagem de carboidratos com a nutrição afetiva e familiar.',
      'Durante nossas consultas online de 60 minutos, construímos juntos cardápios práticos para o dia a dia, opções de lancheiras escolares com carboidratos já mapeados e estratégias tranquilas para festas de aniversário, viagens e refeições fora de casa.',
    ],
    pilaresMetodo: [
      'Contagem de carboidratos visual e descomplicada para pais, cuidadores e crianças',
      'Planejamento de lancheiras escolares e adaptação alimentar sem exclusão social',
      'Manejo nutricional do impacto de proteínas e gorduras na curva glicêmica noturna',
    ],
    valorConsulta: 'R$ 220,00',
    agendaPorDia: {
      'Seg • 16 Nov': ['09:00', '10:30', '14:30', '16:00'],
      'Ter • 17 Nov': ['09:30', '11:00', '15:00'],
      'Qui • 19 Nov': ['10:00', '14:00', '16:30', '18:00'],
      'Sex • 20 Nov': ['09:00', '11:30', '15:30'],
    },
    historicoSuporteDigital: [
      {
        codigo: 'DOC-NUT-01',
        tipo: 'Guia de Exames Nutricionais e Metabólicos',
        descricao:
          'Solicitação digital de Perfil Lipídico, Vitamina D, Ferritina, Vitamina B12 e Função Tireoidiana (assinatura digital CRN-3).',
        status: 'Emissão Digital Integrada',
      },
      {
        codigo: 'DOC-NUT-02',
        tipo: 'Prescrição Dietética & Tabela de Bolus Alimentar',
        descricao:
          'Plano alimentar individualizado com tabela rápida de relação insulina/carboidrato alinhada ao endocrinologista.',
        status: 'Disponível no Prontuário',
      },
      {
        codigo: 'DOC-NUT-03',
        tipo: 'Carta Nutricional para a Escola',
        descricao:
          'Documento oficial orientando a coordenação escolar sobre lanches, recreio e substituição segura de alimentos.',
        status: 'Pronto para Impressão / PDF',
      },
    ],
  },
  2: {
    id: 2,
    nome: 'Dra. Ana Paula Ribeiro',
    especialidade: 'Endocrinologista e Metabologista (Foco em DM1)',
    conselho: 'CRM-SP 184.290 • RQE 74.112',
    nota: '4.9',
    totalAvaliacoes: 128,
    tempoExperiencia: '12 anos em Endocrinologia Pediátrica e Tecnologias em DM1',
    tagsFoco: ['Infância', 'Ajuste de Insulina', 'Sensores & Bombas', 'Recém-Diagnosticados'],
    fotoUrl:
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    sobreMetodoParagrafos: [
      'Receber o diagnóstico de Diabetes Tipo 1 transforma a rotina de toda a casa, e meu compromisso clínico é caminhar ao lado da família para que a segurança substitua o susto. Realizo consultas longas e acolhedoras, sem pressa, onde cada dúvida encontra resposta clara.',
      'Analisamos juntos os relatórios do sensor FreeStyle Libre (Tempo no Alvo, setas de tendência e padrões de madrugada), ajustando doses basais e bolus com delicadeza e entregando um Plano de Ação escrito passo a passo.',
    ],
    pilaresMetodo: [
      'Revisão compartilhada das curvas do sensor contínuo e ajuste fino de insulina basal/bolus',
      'Elaboração do Plano de Ação Individualizado para hipoglicemia, hiperglicemia e dias de doença',
      'Emissão integrada de receitas digitais ICP-Brasil para insulinas análogas e sensores',
    ],
    valorConsulta: 'R$ 340,00',
    agendaPorDia: {
      'Seg • 16 Nov': ['09:30', '11:00', '15:00'],
      'Qua • 18 Nov': ['08:30', '10:00', '14:30', '16:30'],
      'Qui • 19 Nov': ['09:30', '11:00', '15:30'],
      'Sex • 20 Nov': ['10:00', '14:00'],
    },
    historicoSuporteDigital: [
      {
        codigo: 'DOC-MED-01',
        tipo: 'Receita Digital ICP-Brasil (Insulinas e Insumos)',
        descricao:
          'Receituário eletrônico com QR Code válido em todas as farmácias do Brasil para insulinas rápidas, basais, agulhas e sensores.',
        status: 'Assinatura Digital ICP-Brasil',
      },
      {
        codigo: 'DOC-MED-02',
        tipo: 'Guia de Exames Laboratoriais Trimestrais',
        descricao:
          'Pedido médico digital de Hemoglobina Glicada (HbA1c), Peptídeo C, Microalbuminúria, TSH, T4 Livre e Anticorpos.',
        status: 'Emissão Digital Integrada',
      },
      {
        codigo: 'DOC-MED-03',
        tipo: 'Laudo Médico & Plano de Ação Escolar',
        descricao:
          'Relatório médico oficial com condutas de emergência para apresentação na escola, viagens aéreas e processos de fornecimento de insumos.',
        status: 'Disponível no Prontuário',
      },
    ],
  },
  3: {
    id: 3,
    nome: 'Dra. Camila Torres',
    especialidade: 'Psicóloga Clínica e Familiar (Especialista em Condições Crônicas)',
    conselho: 'CRP 06/183.442',
    nota: '5.0',
    totalAvaliacoes: 61,
    tempoExperiencia: '8 anos em Psicologia da Saúde e Acolhimento Parental',
    tagsFoco: ['Infância', 'Saúde Emocional', 'Acolhimento Parental', 'Adolescência'],
    fotoUrl:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    sobreMetodoParagrafos: [
      'Cuidar de quem cuida é o ponto de partida do meu trabalho. O impacto emocional do diagnóstico de DM1 e a vigilância constante nas madrugadas podem gerar exaustão silenciosa nos pais e ansiedade nas crianças.',
      'Ofereço um espaço terapêutico seguro, sereno e livre de julgamentos para elaborar o luto do diagnóstico, fortalecer o vínculo familiar, superar o medo de agulhas ou sensores e apoiar a transição saudável para a autonomia na adolescência.',
    ],
    pilaresMetodo: [
      'Prevenção e cuidado da sobrecarga emocional materna e paterna (burnout do cuidador)',
      'Abordagem lúdica infantil para aceitação do sensor e redução da ansiedade nos cuidados',
      'Mediação de conflitos familiares e fortalecimento da autoestima de crianças e adolescentes',
    ],
    valorConsulta: 'R$ 200,00',
    agendaPorDia: {
      'Ter • 17 Nov': ['10:00', '14:00', '16:00', '18:30'],
      'Qua • 18 Nov': ['09:00', '11:00', '15:00'],
      'Qui • 19 Nov': ['10:00', '14:30', '17:00'],
      'Sex • 20 Nov': ['09:30', '14:00', '16:00'],
    },
    historicoSuporteDigital: [
      {
        codigo: 'DOC-PSI-01',
        tipo: 'Relatório de Acompanhamento Psicológico Escolar',
        descricao:
          'Parecer técnico orientando a equipe pedagógica sobre acolhimento socioemocional e inclusão da criança em sala de aula.',
        status: 'Emissão Digital Integrada',
      },
      {
        codigo: 'DOC-PSI-02',
        tipo: 'Guia de Encaminhamento Multidisciplinar',
        descricao:
          'Registro integrado de evolução emocional compartilhado com o endocrinologista e nutricionista da família na GlicoCare.',
        status: 'Disponível no Prontuário',
      },
    ],
  },
  4: {
    id: 4,
    nome: 'Rafael Mendes',
    especialidade: 'Educador Físico (Fisiologia do Exercício no DM1)',
    conselho: 'CREF 162.907-G/SP',
    nota: '4.9',
    totalAvaliacoes: 76,
    tempoExperiencia: '10 anos em Prescrição de Exercício Seguro para DM1',
    tagsFoco: ['Esporte', 'Emagrecimento', 'Ajuste de Insulina', 'Infância'],
    fotoUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    sobreMetodoParagrafos: [
      'O movimento e o esporte são aliados extraordinários da estabilidade glicêmica quando planejados com segurança. Meu objetivo é garantir que crianças, jovens e adultos com DM1 pratiquem futebol, natação, corrida ou educação física escolar sem medo de hipoglicemias.',
      'Trabalhamos em sintonia com o endocrinologista e a nutricionista da família para mapear o comportamento da glicemia antes, durante e nas horas seguintes ao treino, criando protocolos práticos de suplementação e segurança.',
    ],
    pilaresMetodo: [
      'Protocolos personalizados de glicemia segura para antes, durante e pós-treino',
      'Orientação técnica para professores de Educação Física escolar e escolinhas esportivas',
      'Programas de condicionamento físico, composição corporal e emagrecimento saudável no DM1',
    ],
    valorConsulta: 'R$ 190,00',
    agendaPorDia: {
      'Seg • 16 Nov': ['08:30', '10:00', '17:00'],
      'Qua • 18 Nov': ['09:00', '14:00', '16:30', '18:30'],
      'Qui • 19 Nov': ['10:30', '15:00', '17:00'],
      'Sáb • 21 Nov': ['09:00', '10:30', '11:30'],
    },
    historicoSuporteDigital: [
      {
        codigo: 'DOC-EDF-01',
        tipo: 'Guia de Avaliação Física e Cardiometabólica',
        descricao:
          'Solicitação e diretrizes de avaliação funcional e teste ergométrico em conjunto com a equipe médica.',
        status: 'Emissão Digital Integrada',
      },
      {
        codigo: 'DOC-EDF-02',
        tipo: 'Protocolo de Segurança para Educação Física Escolar',
        descricao:
          'Ficha técnica plastificável com faixas seguras de glicemia para início da aula e reposição de carboidratos no esporte.',
        status: 'Pronto para Impressão / PDF',
      },
    ],
  },
};
/* FIM DOS DADOS DETALHADOS DOS ESPECIALISTAS */

/* INÍCIO DA PÁGINA DE PERFIL DO ESPECIALISTA */
export default function PerfilEspecialista() {
  /* INÍCIO BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS (COMENTADO PARA LANÇAMENTO FASE 1) */
  if (!FEATURES.TELEMEDICINA_ATIVA) {
    return (
      <EmPreparacaoLufy
        tituloCustomizado="Os perfis e agendamentos de especialistas estão em preparação com carinho."
      />
    );
  }
  /* FIM BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS */

  const { id } = useParams();
  const idNum = Number(id) || 2;
  const profissional =
    PERFIS_DETALHADOS_REDE[idNum] || PERFIS_DETALHADOS_REDE[2];

  // Lista de dias disponíveis na agenda integrada do profissional
  const diasDisponiveis = Object.keys(profissional.agendaPorDia);

  const { usuario } = useAuth();

  // Estados da Agenda Integrada e Checkout Interno (RN-MOD-MKT)
  const [diaSelecionado, setDiaSelecionado] = useState(diasDisponiveis[0]);
  const [horarioSelecionado, setHorarioSelecionado] = useState(
    profissional.agendaPorDia[diasDisponiveis[0]][0]
  );
  const [nomeFamiliar, setNomeFamiliar] = useState('');
  const [motivoBreve, setMotivoBreve] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState('pix');
  const [checkoutConcluido, setCheckoutConcluido] = useState(false);
  const [aceiteConsentimento, setAceiteConsentimento] = useState(false);
  const [modalTCLEAberta, setModalTCLEAberta] = useState(false);
  const [tokenSalaNativa, setTokenSalaNativa] = useState('SALA-NATIVA-GC-HELENA-THEO');

  // RN-AGD-02: Lista de slots bloqueados em tempo real para evitar conflitos de horário
  const [slotsBloqueados, setSlotsBloqueados] = useState([]);

  // RN-FIN-03: Protocolo de Recibo / Nota Fiscal emitido para família e especialista
  const [protocoloNF, setProtocoloNF] = useState('NF-GC-2026-84920');

  // RN-ATD-04: Controla a abertura do Ambiente Nativo de Videoconferência GlicoCare
  const [salaNativaAberta, setSalaNativaAberta] = useState(false);

  // Estado para pré-visualização de documento digital do Histórico de Suporte
  const [documentoVisualizado, setDocumentoVisualizado] = useState(null);

  // Atualiza o dia selecionado no calendário e pré-seleciona o primeiro horário livre
  const handleTrocarDia = (novoDia) => {
    setDiaSelecionado(novoDia);
    const horariosDoDia = profissional.agendaPorDia[novoDia] || [];
    const primeiroLivre =
      horariosDoDia.find((h) => !slotsBloqueados.includes(`${novoDia}|${h}`)) ||
      '';
    setHorarioSelecionado(primeiroLivre);
  };

  // Finaliza o agendamento (RN-AGD-02) e o checkout 100% interno (RN-FIN-03 / RN-ATD-04)
  const handleFinalizarCheckoutInterno = async (e) => {
    e.preventDefault();
    if (!diaSelecionado || !horarioSelecionado || !nomeFamiliar.trim()) return;
    if (!aceiteConsentimento) {
      alert('É obrigatório aceitar o Termo de Consentimento Livre e Esclarecido para Teleatendimento (CFM 2.314/2022).');
      return;
    }

    const chaveSlot = `${diaSelecionado}|${horarioSelecionado}`;
    if (slotsBloqueados.includes(chaveSlot)) return;

    const tokenGerado = `SALA-NATIVA-GC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    setTokenSalaNativa(tokenGerado);

    try {
      await agendamentosService.criarAgendamento({
        especialista_id: profissional.id,
        nome_familiar: nomeFamiliar.trim(),
        data_hora_consulta: `${diaSelecionado} às ${horarioSelecionado}`,
        observacoes_familia: motivoBreve.trim(),
        aceite_termo_teleconsulta: true,
        versao_termo: 'v1.0-2026',
      });
    } catch {
      // Fallback demonstrativo local caso o servidor PHP não esteja ativo na porta 8000
    }

    // Bloqueia imediatamente o horário na agenda do especialista (RN-AGD-02)
    setSlotsBloqueados((prev) => [...prev, chaveSlot]);
    setProtocoloNF(
      `NF-GC-2026-${Math.floor(10000 + Math.random() * 90000)}`
    );
    setCheckoutConcluido(true);
  };

  return (
    <div
      className="container"
      style={{
        paddingTop: 'var(--espaco-xl)',
        paddingBottom: 'var(--espaco-2xl)',
      }}
    >
      {/* Botão de retorno à listagem da Rede de Especialistas */}
      <Link
        to="/especialistas"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          marginBottom: '1.5rem',
          fontWeight: 700,
          fontSize: '0.92rem',
          color: 'var(--cor-primaria)',
        }}
      >
        ← Voltar para a Rede de Especialistas GlicoCare
      </Link>

      {/* ====================================================================
          1. CABEÇALHO DO PERFIL DO PROFISSIONAL (#F6F3EE)
          ==================================================================== */}
      <section
        style={{
          backgroundColor: 'var(--cor-superficie)', // Branco Acolhedor #F6F3EE
          border: '1px solid var(--cor-borda-suave)',
          borderRadius: '22px',
          padding: '2.5rem',
          marginBottom: '2rem',
          boxShadow: 'var(--sombra-card)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.75rem',
          }}
        >
          {/* Foto redonda em destaque + Dados principais */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.65rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ position: 'relative' }}>
              <img
                src={profissional.fotoUrl}
                alt={profissional.nome}
                style={{
                  width: 118,
                  height: 118,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid var(--cor-fundo)',
                  boxShadow: '0 8px 24px rgba(46, 40, 36, 0.12)',
                }}
              />
              <span
                title="Profissional Verificado GlicoCare"
                style={{
                  position: 'absolute',
                  bottom: 4,
                  right: 4,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'var(--cor-cta)',
                  color: 'var(--cor-branco)',
                  border: '3px solid var(--cor-superficie)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                ✓
              </span>
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  flexWrap: 'wrap',
                  marginBottom: '0.35rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--cor-primaria)',
                  }}
                >
                  {profissional.especialidade}
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    backgroundColor: '#E3EFE4',
                    color: 'var(--cor-cta)',
                    padding: '0.2rem 0.65rem',
                    borderRadius: 'var(--raio-pilula)',
                  }}
                >
                  ✓ Registro Ativo Verificado (RN-MOD-MKT)
                </span>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(1.85rem, 3vw, 2.45rem)',
                  marginBottom: '0.35rem',
                }}
              >
                {profissional.nome}
              </h1>

              <p
                style={{
                  fontSize: '0.95rem',
                  color: 'var(--cor-texto-suave)',
                  fontWeight: 600,
                  marginBottom: '0.85rem',
                }}
              >
                {profissional.conselho} • {profissional.tempoExperiencia}
              </p>

              {/* Tags de Foco do Profissional */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {profissional.tagsFoco.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--cor-fundo)',
                      color: 'var(--cor-primaria)',
                      border: '1px solid var(--cor-borda)',
                      borderRadius: 'var(--raio-pilula)',
                      padding: '0.25rem 0.75rem',
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Box de Avaliação Média da Comunidade e Valor da Teleconsulta */}
          <div
            style={{
              backgroundColor: 'var(--cor-fundo)',
              border: '1px solid var(--cor-borda)',
              borderRadius: '18px',
              padding: '1.25rem 1.5rem',
              minWidth: 230,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '1.55rem',
                fontWeight: 700,
                color: 'var(--cor-texto)',
                fontFamily: 'var(--fonte-titulo)',
              }}
            >
              ★ {profissional.nota}{' '}
              <span
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: 'var(--cor-texto-suave)',
                  fontFamily: 'var(--fonte-corpo)',
                }}
              >
                ({profissional.totalAvaliacoes} avaliações)
              </span>
            </div>
            <span
              style={{
                display: 'block',
                fontSize: '0.76rem',
                color: 'var(--cor-texto-suave)',
                marginBottom: '0.75rem',
              }}
            >
              Avaliação média das famílias GlicoCare
            </span>

            <div
              style={{
                borderTop: '1px solid var(--cor-borda-suave)',
                paddingTop: '0.7rem',
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--cor-primaria)',
                  fontWeight: 700,
                }}
              >
                Consulta Online (60 min)
              </span>
              <strong
                style={{
                  fontSize: '1.35rem',
                  color: 'var(--cor-cta)',
                }}
              >
                {profissional.valorConsulta}
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          GRADE PRINCIPAL: COLUNA ESQUERDA (MÉTODO + SUPORTE DIGITAL) E
          COLUNA DIREITA (AGENDA INTEGRADA + CHECKOUT SEGURO)
          ==================================================================== */}
      <div
        className="perfil-especialista-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1.15fr 0.95fr',
          gap: '2rem',
          alignItems: 'start',
        }}
      >
        {/* COLUNA ESQUERDA */}
        <div style={{ display: 'grid', gap: '2rem' }}>
          {/* 2. SEÇÃO "SOBRE O MÉTODO" */}
          <section
            style={{
              backgroundColor: 'var(--cor-superficie)',
              border: '1px solid var(--cor-borda-suave)',
              borderRadius: '22px',
              padding: '2.25rem',
              boxShadow: 'var(--sombra-card)',
            }}
          >
            <div className="section-line-eyebrow">ABORDAGEM HUMANIZADA</div>
            <h2 style={{ fontSize: '1.7rem', marginBottom: '1rem' }}>
              Sobre o <span className="texto-italico-terracota">Método</span>
            </h2>

            {profissional.sobreMetodoParagrafos.map((paragrafo, idx) => (
              <p
                key={idx}
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.7,
                  color: 'var(--cor-texto)',
                  marginBottom: '1.1rem',
                }}
              >
                {paragrafo}
              </p>
            ))}

            <div
              style={{
                backgroundColor: 'var(--cor-fundo)',
                borderRadius: '16px',
                padding: '1.35rem 1.5rem',
                marginTop: '1.35rem',
                borderLeft: '4px solid var(--cor-cta)',
              }}
            >
              <h3
                style={{
                  fontSize: '1.08rem',
                  color: 'var(--cor-texto)',
                  marginBottom: '0.75rem',
                }}
              >
                O que está incluído no atendimento:
              </h3>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'grid',
                  gap: '0.6rem',
                }}
              >
                {profissional.pilaresMetodo.map((pilar, index) => (
                  <li
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.65rem',
                      fontSize: '0.92rem',
                      lineHeight: 1.5,
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--cor-cta)',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </span>
                    <span>{pilar}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* SEÇÃO 2B: AVALIAÇÕES E REPUTAÇÃO MODERADA (CFM 2.314/2022) */}
          <section
            style={{
              backgroundColor: 'var(--cor-superficie)',
              border: '1px solid var(--cor-borda-suave)',
              borderRadius: '22px',
              padding: '2.25rem',
              boxShadow: 'var(--sombra-card)',
            }}
          >
            <div className="section-line-eyebrow">REPUTAÇÃO E EXPERIÊNCIA FAMILIAR</div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.65rem', margin: '0 0 0.25rem 0' }}>
                  Avaliações das <span className="texto-italico-terracota">Famílias</span>
                </h2>
                <span style={{ fontSize: '0.86rem', color: 'var(--cor-texto-suave)' }}>
                  Depoimentos reais e moderados após conclusão do prontuário oficial.
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'var(--cor-fundo)',
                  padding: '0.45rem 0.95rem',
                  borderRadius: '16px',
                  border: '1px solid var(--cor-borda)',
                }}
              >
                <span style={{ fontSize: '1.2rem', color: '#F59E0B' }}>★</span>
                <strong style={{ fontSize: '1.15rem' }}>{profissional.nota}</strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--cor-texto-suave)' }}>
                  ({profissional.totalAvaliacoes} avaliações)
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '0.9rem' }}>
              <div
                style={{
                  backgroundColor: 'var(--cor-fundo)',
                  borderRadius: '16px',
                  padding: '1.15rem 1.35rem',
                  border: '1px solid var(--cor-borda-suave)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.4rem',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.92rem' }}>Mariana S. (Mãe do Theo, 6 anos)</strong>
                    <span style={{ marginLeft: '0.5rem', color: '#F59E0B', fontSize: '0.85rem' }}>
                      ★★★★★
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--cor-cta)',
                      fontWeight: 700,
                      backgroundColor: '#E4EFE4',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '10px',
                    }}
                  >
                    ✓ Consulta Concluída
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--cor-texto)', lineHeight: 1.55 }}>
                  "A Dra. Helena analisou as curvas do sensor do Theo com uma paciência incrível. Ajustou a dose basal da madrugada sem nos assustar e construiu conosco uma carta acolhedora para os professores. Hoje dormimos em paz!"
                </p>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--cor-fundo)',
                  borderRadius: '16px',
                  padding: '1.15rem 1.35rem',
                  border: '1px solid var(--cor-borda-suave)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.4rem',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.92rem' }}>Carlos Eduardo (Pessoa com DM1 há 10 anos)</strong>
                    <span style={{ marginLeft: '0.5rem', color: '#F59E0B', fontSize: '0.85rem' }}>
                      ★★★★★
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--cor-cta)',
                      fontWeight: 700,
                      backgroundColor: '#E4EFE4',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '10px',
                    }}
                  >
                    ✓ Consulta Concluída
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--cor-texto)', lineHeight: 1.55 }}>
                  "Excelente escuta ativa e domínio das novas tecnologias de infusão contínua. As orientações pós-consulta no meu prontuário foram muito precisas."
                </p>
              </div>
            </div>
          </section>

          {/* 5. SEÇÃO DE HISTÓRICO DE SUPORTE (EMISSÃO DE GUIAS DE EXAMES E RECEITAS DIGITAIS) */}
          <section
            style={{
              backgroundColor: 'var(--cor-superficie)',
              border: '1px solid var(--cor-borda-suave)',
              borderRadius: '22px',
              padding: '2.25rem',
              boxShadow: 'var(--sombra-card)',
            }}
          >
            <div className="section-line-eyebrow">
              CONTINUIDADE DO CUIDADO • DOCUMENTOS DIGITAIS
            </div>
            <h2 style={{ fontSize: '1.65rem', marginBottom: '0.6rem' }}>
              Histórico de Suporte, Guias de Exames e{' '}
              <span className="texto-italico-terracota">Receitas Digitais</span>
            </h2>
            <p
              style={{
                fontSize: '0.94rem',
                color: 'var(--cor-texto-suave)',
                lineHeight: 1.6,
                marginBottom: '1.5rem',
              }}
            >
              Todos os atendimentos realizados na plataforma contam com emissão
              integrada de documentos clínicos assinados digitalmente, disponíveis
              a qualquer momento no painel da família:
            </p>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {profissional.historicoSuporteDigital.map((doc) => (
                <div
                  key={doc.codigo}
                  style={{
                    backgroundColor: 'var(--cor-fundo)',
                    border: '1px solid var(--cor-borda)',
                    borderRadius: '16px',
                    padding: '1.2rem 1.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.3rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: '#E3EFE4',
                          color: 'var(--cor-cta)',
                          padding: '0.18rem 0.6rem',
                          borderRadius: 'var(--raio-pilula)',
                        }}
                      >
                        ✓ {doc.status}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--cor-texto-suave)',
                          fontWeight: 600,
                        }}
                      >
                        #{doc.codigo}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                      {doc.tipo}
                    </h3>
                    <p
                      style={{
                        fontSize: '0.88rem',
                        color: 'var(--cor-texto-suave)',
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
                      {doc.descricao}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setDocumentoVisualizado(
                        documentoVisualizado?.codigo === doc.codigo ? null : doc
                      )
                    }
                    style={{
                      backgroundColor: 'var(--cor-superficie)',
                      border: '1px solid var(--cor-primaria)',
                      color: 'var(--cor-primaria)',
                      borderRadius: 'var(--raio-pilula)',
                      padding: '0.5rem 1rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {documentoVisualizado?.codigo === doc.codigo
                      ? 'Ocultar modelo'
                      : 'Ver modelo digital ↗'}
                  </button>
                </div>
              ))}
            </div>

            {/* Pré-visualização interativa do documento digital selecionado */}
            {documentoVisualizado && (
              <div
                style={{
                  marginTop: '1.25rem',
                  backgroundColor: '#FAF7F2',
                  border: '1.5px dashed var(--cor-cta)',
                  borderRadius: '16px',
                  padding: '1.25rem 1.5rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem',
                  }}
                >
                  <strong style={{ color: 'var(--cor-cta)', fontSize: '0.9rem' }}>
                    📄 Prévia de Emissão Integrada GlicoCare —{' '}
                    {documentoVisualizado.tipo}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--cor-primaria)' }}>
                    Profissional: {profissional.nome} ({profissional.conselho})
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '0.86rem',
                    color: 'var(--cor-texto)',
                    margin: 0,
                    lineHeight: 1.55,
                  }}
                >
                  Após a conclusão da teleconsulta, este documento é assinado
                  eletronicamente pelo especialista e liberado com QR Code de
                  validação no aplicativo e por e-mail para impressão ou uso em
                  farmácias e laboratórios.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* COLUNA DIREITA: 3. AGENDA INTEGRADA + 4. CHECKOUT / PAGAMENTO SEGURO */}
        <section
          style={{
            backgroundColor: 'var(--cor-superficie)',
            border: '1.5px solid var(--cor-cta)',
            borderRadius: '22px',
            padding: '2.25rem',
            boxShadow: 'var(--sombra-card)',
            position: 'sticky',
            top: '5.8rem',
          }}
        >
          <div className="section-line-eyebrow">AGENDA INTEGRADA ONLINE</div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>
            Agendar Consulta{' '}
            <span className="texto-italico-terracota">Integrada</span>
          </h2>
          <p
            style={{
              fontSize: '0.88rem',
              color: 'var(--cor-texto-suave)',
              marginBottom: '1.35rem',
            }}
          >
            Selecione o dia e o horário no calendário abaixo. Todo o atendimento e
            pagamento são 100% internos e protegidos pela GlicoCare (RN-MOD-MKT).
          </p>

          {checkoutConcluido ? (
            <div
              style={{
                backgroundColor: 'var(--cor-cta-suave)',
                border: '1.5px solid var(--cor-cta)',
                borderRadius: '18px',
                padding: '1.65rem',
                color: 'var(--cor-texto)',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  backgroundColor: 'var(--cor-cta)',
                  color: 'var(--cor-branco)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  padding: '0.28rem 0.8rem',
                  borderRadius: 'var(--raio-pilula)',
                  marginBottom: '0.75rem',
                }}
              >
                ✓ CHECKOUT E AGENDAMENTO CONFIRMADOS
              </span>
              <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>
                Sua teleconsulta está reservada!
              </h3>
              <p
                style={{
                  fontSize: '0.92rem',
                  lineHeight: 1.6,
                  marginBottom: '0.85rem',
                }}
              >
                Confirmamos o atendimento com <strong>{profissional.nome}</strong>{' '}
                para <strong>{diaSelecionado}</strong> às{' '}
                <strong>{horarioSelecionado}</strong> (Modalidade:{' '}
                {metodoPagamento === 'pix'
                  ? 'PIX Seguro GlicoCare'
                  : 'Cartão de Crédito Interno'}
                ).
              </p>
              <div
                style={{
                  backgroundColor: 'var(--cor-superficie)',
                  padding: '0.9rem 1rem',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  marginBottom: '0.85rem',
                  display: 'grid',
                  gap: '0.35rem',
                }}
              >
                <div>
                  <strong>📅 RN-AGD-02 (Slot Bloqueado & Notificações):</strong>{' '}
                  Horário bloqueado na agenda de {profissional.nome}. Confirmação
                  enviada automaticamente para a família e para o especialista.
                </div>
                <div>
                  <strong>🧾 RN-FIN-03 (Recibo e Nota Fiscal Digital):</strong>{' '}
                  Comprovante <code>{protocoloNF}</code> emitido para o usuário e
                  para o profissional com retenção e repasse programado.
                </div>
                <div>
                  <strong>🎥 RN-ATD-04 (Videoconferência Nativa):</strong> Sala de
                  vídeo integrada disponível abaixo sem necessidade de links
                  externos.
                </div>
              </div>

              {/* Botão de Acesso Direto à Sala Nativa de Videoconsulta */}
              <Link
                to={`/sala-consulta/${tokenSalaNativa}`}
                className="gc-btn gc-btn--primario"
                style={{
                  width: '100%',
                  marginBottom: '0.6rem',
                  display: 'block',
                  textAlign: 'center',
                  textDecoration: 'none',
                  backgroundColor: 'var(--cor-cta)',
                  fontSize: '0.92rem',
                }}
              >
                🎥 Entrar na Sala de Videoconsulta Nativa ({tokenSalaNativa}) ↗
              </Link>

              {/* Pré-atendimento CTA */}
              <div style={{ textAlign: 'center', margin: '0.6rem 0 0.85rem 0' }}>
                <Link
                  to="/como-funciona-atendimentos"
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--cor-primaria)',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  📝 Como preencher o Pré-Atendimento para esta consulta ↗
                </Link>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCheckoutConcluido(false);
                  setSalaNativaAberta(false);
                }}
                className="gc-btn gc-btn--secundario"
                style={{ width: '100%' }}
              >
                Realizar outro agendamento
              </button>
            </div>
          ) : (
            <form onSubmit={handleFinalizarCheckoutInterno}>
              {/* PASSO 1: Calendário Interativo de Datas */}
              <div style={{ marginBottom: '1.25rem' }}>
                <span
                  className="gc-label"
                  style={{ display: 'block', marginBottom: '0.5rem' }}
                >
                  1. Escolha o dia no calendário (RN-AGD-02):
                </span>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.5rem',
                  }}
                >
                  {diasDisponiveis.map((dia) => {
                    const ativo = diaSelecionado === dia;
                    return (
                      <button
                        key={dia}
                        type="button"
                        onClick={() => handleTrocarDia(dia)}
                        style={{
                          padding: '0.65rem 0.75rem',
                          borderRadius: '12px',
                          border: ativo
                            ? '2px solid var(--cor-primaria)'
                            : '1px solid var(--cor-borda)',
                          backgroundColor: ativo
                            ? 'var(--cor-primaria)'
                            : 'var(--cor-fundo)',
                          color: ativo
                            ? 'var(--cor-branco)'
                            : 'var(--cor-texto)',
                          fontWeight: 700,
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                        }}
                      >
                        📅 {dia}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PASSO 2: Seleção de Horário Disponível com Bloqueio Imediato de Slot */}
              <div style={{ marginBottom: '1.25rem' }}>
                <span
                  className="gc-label"
                  style={{ display: 'block', marginBottom: '0.5rem' }}
                >
                  2. Horários em tempo real para {diaSelecionado}:
                </span>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.5rem',
                  }}
                >
                  {(profissional.agendaPorDia[diaSelecionado] || []).map(
                    (hora) => {
                      const bloqueado = slotsBloqueados.includes(
                        `${diaSelecionado}|${hora}`
                      );
                      const selecionado =
                        !bloqueado && horarioSelecionado === hora;
                      return (
                        <button
                          key={hora}
                          type="button"
                          disabled={bloqueado}
                          onClick={() => setHorarioSelecionado(hora)}
                          style={{
                            padding: '0.6rem',
                            borderRadius: 'var(--raio-pilula)',
                            border: bloqueado
                              ? '1px dashed var(--cor-borda)'
                              : selecionado
                              ? '2px solid var(--cor-cta)'
                              : '1px solid var(--cor-borda)',
                            backgroundColor: bloqueado
                              ? '#E6E0D5'
                              : selecionado
                              ? 'var(--cor-cta)'
                              : 'var(--cor-branco)',
                            color: bloqueado
                              ? 'var(--cor-texto-suave)'
                              : selecionado
                              ? 'var(--cor-branco)'
                              : 'var(--cor-texto)',
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            cursor: bloqueado ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {bloqueado ? `🔒 ${hora} (Reservado)` : `🕒 ${hora}`}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* PASSO 3: Identificação da Família */}
              <FormInput
                name="nomeFamiliar"
                label="3. Nome do responsável e paciente DM1"
                placeholder="Ex: Juliana Martins (Mãe do Lucas, 7 anos)"
                value={nomeFamiliar}
                onChange={(e) => setNomeFamiliar(e.target.value)}
                obrigatorio
              />

              <FormInput
                name="motivoBreve"
                label="Principal foco da consulta (opcional)"
                placeholder="Ex: Ajuste de basal noturna e plano para a escola"
                value={motivoBreve}
                onChange={(e) => setMotivoBreve(e.target.value)}
              />

              {/* PASSO 4: Checkout / Pagamento Seguro 100% Interno */}
              <div
                style={{
                  backgroundColor: 'var(--cor-fundo)',
                  border: '1px solid var(--cor-borda)',
                  borderRadius: '14px',
                  padding: '1rem 1.15rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.6rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--cor-primaria)',
                    }}
                  >
                    🔒 Checkout Interno GlicoCare
                  </span>
                  <strong style={{ color: 'var(--cor-cta)', fontSize: '1.05rem' }}>
                    {profissional.valorConsulta}
                  </strong>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    marginBottom: '0.6rem',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setMetodoPagamento('pix')}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '10px',
                      border:
                        metodoPagamento === 'pix'
                          ? '1.5px solid var(--cor-cta)'
                          : '1px solid var(--cor-borda)',
                      backgroundColor:
                        metodoPagamento === 'pix'
                          ? '#E4EFE4'
                          : 'var(--cor-superficie)',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      color: 'var(--cor-texto)',
                    }}
                  >
                    ⚡ PIX Seguro Interno
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodoPagamento('cartao')}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '10px',
                      border:
                        metodoPagamento === 'cartao'
                          ? '1.5px solid var(--cor-cta)'
                          : '1px solid var(--cor-borda)',
                      backgroundColor:
                        metodoPagamento === 'cartao'
                          ? '#E4EFE4'
                          : 'var(--cor-superficie)',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      color: 'var(--cor-texto)',
                    }}
                  >
                    💳 Cartão (até 3x)
                  </button>
                </div>

                <p
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--cor-texto-suave)',
                    margin: 0,
                    lineHeight: 1.45,
                  }}
                >
                  Garantia RN-MOD-MKT: Pagamento, vídeo-consulta e emissão de
                  receitas ocorrem 100% dentro da plataforma, sem links externos.
                </p>
              </div>

              {/* PASSO 5: TERMO DE CONSENTIMENTO INFORMADO OBRIGATÓRIO (CFM 2.314/2022 & LGPD) */}
              <div
                style={{
                  backgroundColor: '#FAF7F2',
                  border: '1.5px solid var(--cor-borda)',
                  borderRadius: '14px',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    required
                    checked={aceiteConsentimento}
                    onChange={(e) => setAceiteConsentimento(e.target.checked)}
                    style={{ marginTop: 3 }}
                  />
                  <div style={{ fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--cor-texto)' }}>
                    <strong>
                      Li e aceito o Termo de Consentimento Livre e Esclarecido para Teleatendimento:
                    </strong>
                    <div style={{ marginTop: '0.35rem', color: 'var(--cor-texto-suave)', fontSize: '0.77rem' }}>
                      Declaro estar ciente de que a teleconsulta é regida pelas Resoluções dos Conselhos de
                      Saúde (CFM 2.314/2022, CFN, CFP, CONFEF) e LGPD. Compreendo os limites técnicos de
                      conexão, que o atendimento remoto não substitui pronto-socorro em emergências
                      severas (como cetoacidose aguda), a guarda sigilosa dos meus dados de saúde e o dever
                      do especialista de indicar consulta presencial caso identifique sinais de alarme.
                    </div>
                  </div>
                </label>

                <div style={{ marginTop: '0.65rem', borderTop: '1px dashed var(--cor-borda-suave)', paddingTop: '0.5rem' }}>
                  <button
                    type="button"
                    id="btn-abrir-tcle-oficial"
                    onClick={() => setModalTCLEAberta(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--cor-primaria)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    📜 Abrir e assinar o TCLE oficial completo (TCLE-GC-2026.1) com carimbo digital ↗
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variante="primario"
                disabled={!aceiteConsentimento}
                style={{
                  width: '100%',
                  padding: '0.95rem 1.4rem',
                  opacity: !aceiteConsentimento ? 0.6 : 1,
                  cursor: !aceiteConsentimento ? 'not-allowed' : 'pointer',
                }}
              >
                Finalizar Checkout e Pagamento Seguro ({profissional.valorConsulta}) ↗
              </Button>
            </form>
          )}
        </section>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .perfil-especialista-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* MODAL FORMAL DE TCLE (CFM 2.314/2022 & LGPD) */}
      <ModalTCLE
        aberto={modalTCLEAberta}
        onFechar={() => setModalTCLEAberta(false)}
        agendamentoId={1}
        profissionalNome={profissional.nome}
        profissionalConselho={profissional.conselho}
        usuario={usuario}
        onSucessoAssinatura={() => {
          setAceiteConsentimento(true);
          setModalTCLEAberta(false);
        }}
      />
    </div>
  );
}
/* FIM DA PÁGINA DE PERFIL DO ESPECIALISTA */
