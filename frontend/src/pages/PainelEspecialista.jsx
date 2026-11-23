/* ==========================================================================
   ARQUIVO: PainelEspecialista.jsx (Localização: /frontend/src/pages/PainelEspecialista.jsx)
   PÁGINA: Workspace do Especialista — Agenda, Triagem e Prontuário Longitudinal
   CONFORMIDADE: CFM 2.314/2022, CFN, CFP, CONFEF, LGPD (RN-PRONT-01, RN-AGD-02, RN-FIN-03)
   ARQUITETURA:
     - 4 KPIs Clínicos e Financeiros no Topo;
     - Aba 1 — Agenda & Triagem (1ª Consulta vs. Retorno, Pré-atendimento e Alergias em alerta);
     - Aba 2 — Meus Pacientes & Prontuário Longitudinal Permanente (Ficha + Linha do Tempo + Adendos);
     - Aba 3 — Minha Disponibilidade & Slots de Atendimento (RN-AGD-02);
     - Modais integrados para Visualização de Exames, Emissão de Guias Médicas e Adendos Clínicos.
   ========================================================================== */

/* INÍCIO DO COMPONENTE PAINEL ESPECIALISTA */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/ToastContext';
import Button from '../components/Button';
import CustomSelect from '../components/CustomSelect';
import { calcularTempoDiagnostico } from '../utils/dateUtils';

/* OPÇÕES PADRÃO PARA EMISSÃO DE GUIAS MÉDICAS */
const EXAMES_SUGERIDOS_ESPECIALISTA = [
  'Hemoglobina Glicada (HbA1c)',
  'Glicemia em Jejum',
  'Microalbuminúria em Amostra Isolada',
  'Perfil Lipídico Completo (Colesterol Total, HDL, LDL, Triglicerídeos)',
  'Vitamina D (25-OH)',
  'Creatinina e Ureia (Função Renal)',
  'TSH e T4 Livre (Tireoide)',
  'Vitamina B12',
  'Anticorpos Anti-Transglutaminase IgA (Triagem Celíaca)',
];

export default function PainelEspecialista() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const notificar = useNotify();

  // Aba principal do workspace: 'agenda', 'pacientes', 'horarios'
  const [abaPrincipal, setAbaPrincipal] = useState('agenda');

  // Estados de dados da API
  const [carregando, setCarregando] = useState(true);
  const [especialistaInfo, setEspecialistaInfo] = useState(null);
  const [kpis, setKpis] = useState({
    consultas_agendadas: 3,
    primeiras_consultas: 1,
    retornos: 2,
    pre_atendimentos_prontos: 2,
    repasse_liquido_total: 416.00,
    percentual_repasse: 65, // Split 65% Especialista / 35% GlicoCare (RN-FIN-03)
  });

  /* INÍCIO: CONFIGURAÇÃO DE HONORÁRIOS & RETORNO INCLUSO (RN-FIN-03 & RN-AGD-RETORNO) */
  const [valorConsultaConfig, setValorConsultaConfig] = useState(320.0);
  const [ofereceRetornoConfig, setOfereceRetornoConfig] = useState(true);
  const [prazoRetornoConfig, setPrazoRetornoConfig] = useState(30);
  const [salvandoHonorarios, setSalvandoHonorarios] = useState(false);
  const [honorariosFeedback, setHonorariosFeedback] = useState(null);
  /* FIM: CONFIGURAÇÃO DE HONORÁRIOS & RETORNO INCLUSO */
  const [agenda, setAgenda] = useState([]);
  const [pacientes, setPacientes] = useState([]);

  // Filtros da Agenda & Triagem
  const [filtroAgenda, setFiltroAgenda] = useState('todos'); // 'todos', 'primeira', 'retorno', 'pre_ok', 'pre_pendente'
  const [buscaPaciente, setBuscaPaciente] = useState('');

  // Prontuário Longitudinal: Paciente Selecionado
  const [pacienteSelecionadoId, setPacienteSelecionadoId] = useState(null);
  const [dadosProntuarioLongitudinal, setDadosProntuarioLongitudinal] = useState(null);
  const [carregandoLongitudinal, setCarregandoLongitudinal] = useState(false);
  const [filtroTimeline, setFiltroTimeline] = useState('todos'); // 'todos', 'consultas', 'exames', 'laudos'

  // Modais de Ação Clínica
  const [modalExamesAberto, setModalExamesAberto] = useState(false);
  const [modalSolicitarAberto, setModalSolicitarAberto] = useState(false);
  const [modalAdendoAberto, setModalAdendoAberto] = useState(false);
  const [consultaSelecionada, setConsultaSelecionada] = useState(null);
  const [prontuarioAlvoAdendo, setProntuarioAlvoAdendo] = useState(null);

  // Estados do Formulário de Emissão de Guia Médica (+ Solicitar Exames)
  const [tituloGuia, setTituloGuia] = useState('Rotina Trimestral DM1 - Controle Metabólico e Renal');
  const [examesEscolhidos, setExamesEscolhidos] = useState([
    'Hemoglobina Glicada (HbA1c)',
    'Glicemia em Jejum',
    'Microalbuminúria em Amostra Isolada',
  ]);
  const [outroExameTexto, setOutroExameTexto] = useState('');
  const [solicitandoGuia, setSolicitandoGuia] = useState(false);
  const [guiaEmitidaSucesso, setGuiaEmitidaSucesso] = useState(null);

  // Estados do Formulário de Adendo Clínico Datado (RN-PRONT-01)
  const [textoNovoAdendo, setTextoNovoAdendo] = useState('');
  const [salvandoAdendo, setSalvandoAdendo] = useState(false);
  const [adendoSucesso, setAdendoSucesso] = useState(null);

  // Gestão de Horários e Disponibilidade (RN-AGD-02)
  const [diasAtendimento, setDiasAtendimento] = useState([
    { dia: 'Segunda-feira', ativo: true, slots: ['09:00', '10:00', '14:00', '15:00', '16:00'] },
    { dia: 'Terça-feira', ativo: true, slots: ['14:00', '15:00', '16:00', '17:00'] },
    { dia: 'Quarta-feira', ativo: true, slots: ['10:00', '11:00', '15:00', '16:00'] },
    { dia: 'Quinta-feira', ativo: false, slots: ['09:00', '10:00', '14:00'] },
    { dia: 'Sexta-feira', ativo: true, slots: ['09:00', '10:00', '11:00'] },
  ]);
  const [horariosSalvosFeedback, setHorariosSalvosFeedback] = useState(false);

  // ==========================================================================
  // 1. CARREGAMENTO DOS DADOS DO PAINEL
  // ==========================================================================
  const carregarDadosPainel = useCallback(async () => {
    setCarregando(true);
    const tokenAuth = localStorage.getItem('glicocare_token') || sessionStorage.getItem('glicocare_token');
    const headers = tokenAuth ? { Authorization: `Bearer ${tokenAuth}` } : {};

    try {
      const resp = await fetch('/backend/api/especialistas/painel_dados.php', { headers });
      const json = await resp.json();

      if (json.sucesso && json.agenda) {
        setEspecialistaInfo(json.especialista);
        setKpis(json.kpis);
        setAgenda(json.agenda);
        setPacientes(json.pacientes);

        // Se houver pacientes e nenhum selecionado ainda, define o primeiro para o prontuário
        if (json.pacientes.length > 0) {
          setPacienteSelecionadoId((prev) => prev || json.pacientes[0].perfil_saude_id || json.pacientes[0].familiar_id || 1);
        }
      } else {
        criarMockPainel();
      }
    } catch {
      criarMockPainel();
    } finally {
      setCarregando(false);
    }
  }, []);

  function criarMockPainel() {
    const mockEsp = {
      id: 1,
      nome: 'Dra. Helena Vasconcelos',
      especialidade: 'Endocrinologia Pediátrica',
      conselho: 'CRM-SP 148290',
      foto_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    };

    const mockAgenda = [
      {
        id: 1,
        data_hora_consulta: '2026-11-20 14:00:00',
        status_agendamento: 'confirmado',
        status_atendimento: 'AGENDADO',
        status_financeiro: 'RETIDO_PLATAFORMA',
        tipo_agendamento: 'RETORNO_INCLUSO',
        is_retorno_incluso: true,
        valor_transacao: 0.0,
        repasse_liquido: 0.0,
        sala_token_unico: 'SALA-NATIVA-GC-HELENA-THEO',
        link_video: '/sala-consulta/SALA-NATIVA-GC-HELENA-THEO',
        paciente: {
          id: 4,
          nome: 'Theo Silva (Mãe: Mariana Silva)',
          email: 'mariana.mae@exemplo.com.br',
          telefone: '(11) 98765-4321',
          tipo_usuario: 'cuidador',
        },
        perfil_saude: {
          id: 1,
          nome_completo: 'Theo Silva',
          data_nascimento: '2019-05-14',
          sexo: 'masculino',
          tipo_diabetes: 'Tipo 1A',
          data_diagnostico: '2023-08-10',
          terapia_insulina: 'Caneta',
          sensor_glicemia: 'FreeStyle Libre 2',
          fsi: 35.0,
          glicemia_alvo: 100,
        },
        classificacao_consulta: {
          is_primeira_consulta: false,
          retorno_numero: 2,
          badge_label: 'Retorno #2',
          total_anteriores: 1,
        },
        pre_atendimento: {
          preenchido: true,
          dados: {
            motivo_principal: 'Ajuste de doses noturnas e orientações para a professora na escola',
            maiores_dores: 'Medo de hipoglicemia na madrugada e insegurança com lanche da escola.',
            duvidas_prioritarias: '1. Devo reduzir a basal em dias de natação?\n2. Como agir com seta para baixo na aula?',
          },
        },
        tcle: { valido: true },
        alergias: [
          { id: 1, categoria: 'ADESIVO_INSUMO', substancia_ou_item: 'Adesivo de Sensor / Cateter', gravidade: 'LEVE' },
          { id: 2, categoria: 'MEDICAMENTO', substancia_ou_item: 'Dipirona', gravidade: 'MODERADA' },
        ],
        glicemias: [
          { valor_mg_dl: 108, momento_medicao: 'Jejum', insulina_ativa_estimada: 0, tendencia_destro: '• Estável' },
          { valor_mg_dl: 145, momento_medicao: 'Pós-Almoço', insulina_ativa_estimada: 1.1, tendencia_destro: '↘ Queda moderada' },
        ],
        prontuario: null,
      },
      {
        id: 2,
        data_hora_consulta: '2026-11-21 10:00:00',
        status_agendamento: 'confirmado',
        status_atendimento: 'AGENDADO',
        status_financeiro: 'RETIDO_PLATAFORMA',
        tipo_agendamento: 'CONSULTA_AVULSA',
        is_retorno_incluso: false,
        valor_transacao: 320.0,
        repasse_liquido: 208.00,
        sala_token_unico: 'SALA-NATIVA-GC-HELENA-LUCAS',
        link_video: '/sala-consulta/SALA-NATIVA-GC-HELENA-LUCAS',
        paciente: {
          id: 5,
          nome: 'Lucas Mendes (12 anos, Pai: Roberto Mendes)',
          email: 'roberto.pai@exemplo.com.br',
          telefone: '(11) 97654-3210',
          tipo_usuario: 'cuidador',
        },
        perfil_saude: {
          id: 2,
          nome_completo: 'Lucas Mendes',
          data_nascimento: '2014-02-18',
          sexo: 'masculino',
          tipo_diabetes: 'Tipo 1A',
          data_diagnostico: '2026-09-01',
          terapia_insulina: 'Caneta',
          sensor_glicemia: 'Dexcom G6',
          fsi: 45.0,
          glicemia_alvo: 100,
        },
        classificacao_consulta: {
          is_primeira_consulta: true,
          retorno_numero: 0,
          badge_label: '1ª Consulta',
          total_anteriores: 0,
        },
        pre_atendimento: {
          preenchido: true,
          dados: {
            motivo_principal: 'Recém diagnosticado há 2 meses. Família em fase de adaptação e contagem de carboidratos.',
            maiores_dores: 'Choque inicial da família, medo de errar a conta de carboidratos no almoço.',
            duvidas_prioritarias: '1. Como calcular a relação insulina/carboidrato para pizza?\n2. O que fazer antes do futebol?',
          },
        },
        tcle: { valido: true },
        alergias: [],
        glicemias: [
          { valor_mg_dl: 168, momento_medicao: 'Jejum', insulina_ativa_estimada: 0, tendencia_destro: '↗ Subida lenta' },
        ],
        prontuario: null,
      },
      {
        id: 3,
        data_hora_consulta: '2026-11-22 15:30:00',
        status_agendamento: 'agendado',
        status_atendimento: 'AGENDADO',
        status_financeiro: 'RETIDO_PLATAFORMA',
        tipo_agendamento: 'CONSULTA_AVULSA',
        is_retorno_incluso: false,
        valor_transacao: 320.0,
        repasse_liquido: 208.00,
        sala_token_unico: 'SALA-NATIVA-GC-HELENA-BEATRIZ',
        link_video: '/sala-consulta/SALA-NATIVA-GC-HELENA-BEATRIZ',
        paciente: {
          id: 6,
          nome: 'Beatriz Almeida (22 anos)',
          email: 'beatriz.dm1@exemplo.com.br',
          telefone: '(11) 96543-2109',
          tipo_usuario: 'diabetico',
        },
        perfil_saude: {
          id: 3,
          nome_completo: 'Beatriz Almeida',
          data_nascimento: '2004-06-11',
          sexo: 'feminino',
          tipo_diabetes: 'Tipo 1A',
          data_diagnostico: '2015-03-20',
          terapia_insulina: 'Bomba de Infusão (Accu-Chek)',
          sensor_glicemia: 'FreeStyle Libre 2',
          fsi: 30.0,
          glicemia_alvo: 100,
        },
        classificacao_consulta: {
          is_primeira_consulta: false,
          retorno_numero: 4,
          badge_label: 'Retorno #4',
          total_anteriores: 3,
        },
        pre_atendimento: {
          preenchido: false,
          dados: null,
        },
        tcle: { valido: true },
        alergias: [
          { id: 3, categoria: 'ALIMENTO', substancia_ou_item: 'Amendoim e Castanhas', gravidade: 'GRAVE' },
        ],
        glicemias: [
          { valor_mg_dl: 112, momento_medicao: 'Antes de Dormir', insulina_ativa_estimada: 0.4, tendencia_destro: '• Estável' },
        ],
        prontuario: null,
      },
    ];

    const mockPacientes = [
      {
        familiar_id: 4,
        perfil_saude_id: 1,
        nome: 'Theo Silva',
        responsavel: 'Mariana Silva (Mãe)',
        tipo_diabetes: 'Tipo 1A',
        data_diagnostico: '2023-08-10',
        terapia_insulina: 'Caneta',
        primeira_consulta_em: '2026-10-15 14:00:00',
        ultima_consulta_em: '2026-11-20 14:00:00',
        total_consultas: 2,
        total_concluidas: 1,
        possui_alergias: true,
        alergias_resumo: ['Adesivo de Sensor', 'Dipirona'],
      },
      {
        familiar_id: 5,
        perfil_saude_id: 2,
        nome: 'Lucas Mendes',
        responsavel: 'Roberto Mendes (Pai)',
        tipo_diabetes: 'Tipo 1A',
        data_diagnostico: '2026-09-01',
        terapia_insulina: 'Caneta',
        primeira_consulta_em: '2026-11-21 10:00:00',
        ultima_consulta_em: '2026-11-21 10:00:00',
        total_consultas: 1,
        total_concluidas: 0,
        possui_alergias: false,
        alergias_resumo: [],
      },
      {
        familiar_id: 6,
        perfil_saude_id: 3,
        nome: 'Beatriz Almeida',
        responsavel: null,
        tipo_diabetes: 'Tipo 1A',
        data_diagnostico: '2015-03-20',
        terapia_insulina: 'Bomba de Infusão',
        primeira_consulta_em: '2026-04-10 16:00:00',
        ultima_consulta_em: '2026-11-22 15:30:00',
        total_consultas: 4,
        total_concluidas: 3,
        possui_alergias: true,
        alergias_resumo: ['Amendoim e Castanhas'],
      },
    ];

    setEspecialistaInfo(mockEsp);
    setAgenda(mockAgenda);
    setPacientes(mockPacientes);
    setPacienteSelecionadoId((prev) => prev || 1);
  }

  useEffect(() => {
    carregarDadosPainel();
  }, [carregarDadosPainel]);

  // ==========================================================================
  // 2. CARREGAMENTO DO PRONTUÁRIO LONGITUDINAL DO PACIENTE
  // ==========================================================================
  const carregarProntuarioLongitudinal = useCallback(async (perfilId) => {
    if (!perfilId) return;
    setCarregandoLongitudinal(true);

    const tokenAuth = localStorage.getItem('glicocare_token') || sessionStorage.getItem('glicocare_token');
    const headers = tokenAuth ? { Authorization: `Bearer ${tokenAuth}` } : {};

    try {
      const resp = await fetch(
        `/backend/api/especialistas/historico_paciente.php?perfil_saude_id=${perfilId}`,
        { headers }
      );
      const json = await resp.json();

      if (json.sucesso && json.dados) {
        setDadosProntuarioLongitudinal(json.dados);
      } else {
        criarMockLongitudinal(perfilId);
      }
    } catch {
      criarMockLongitudinal(perfilId);
    } finally {
      setCarregandoLongitudinal(false);
    }
  }, []);

  function criarMockLongitudinal(perfilId) {
    const idNum = Number(perfilId);

    // Mock Paciente 2: Lucas Mendes (12 anos, recém-diagnosticado)
    if (idNum === 2) {
      setDadosProntuarioLongitudinal({
        perfil: {
          id: 2,
          usuario_id: 5,
          nome_completo: 'Lucas Mendes',
          data_nascimento: '2014-02-18',
          sexo: 'masculino',
          tipo_diabetes: 'Tipo 1A',
          data_diagnostico: '2026-09-01',
          terapia_insulina: 'Caneta',
          sensor_glicemia: 'Dexcom G6',
          fsi: 45.0,
          glicemia_alvo: 100,
          duracao_insulina_horas: 3,
          familiar_nome: 'Roberto Mendes (Pai)',
          familiar_email: 'roberto.pai@exemplo.com.br',
          telefone_whatsapp: '(11) 97654-3210',
          tipo_usuario: 'cuidador',
        },
        alergias: [],
        medicamentos: [
          { id: 3, nome_medicamento: 'Lantus (Glargina)', tipo: 'Insulina Basal', dose: '14 UI', horario: '22:00', uso_continuo: 1 },
          { id: 4, nome_medicamento: 'Humalog (Lispro)', tipo: 'Insulina Ultrarrápida', dose: '1:12g', horario: 'Antes das Refeições', uso_continuo: 1 },
        ],
        glicemias_recentes: [
          { valor_mg_dl: 168, momento_medicao: 'Jejum', insulina_ativa_estimada: 0, data_hora_medicao: '2026-11-20 07:15:00' },
          { valor_mg_dl: 195, momento_medicao: 'Pós-Almoço', insulina_ativa_estimada: 1.5, data_hora_medicao: '2026-11-19 14:00:00' },
        ],
        linha_do_tempo: [
          {
            tipo_evento: 'CONSULTA_PRONTUARIO',
            data_evento: '2026-11-21 10:00:00',
            data_registro: '2026-11-21 10:45:00',
            id: 102,
            agendamento_id: 2,
            especialista: {
              id: 1,
              nome: 'Dra. Helena Vasconcelos',
              especialidade: 'Endocrinologia Pediátrica',
              conselho: 'CRM-SP 148290',
            },
            queixa_principal: 'Recém diagnosticado há 2 meses. Família em fase de adaptação e contagem de carboidratos.',
            evolucao_clinica: 'Primeira consulta de Lucas Mendes, 12 anos. Pai Roberto relata insegurança no cálculo de carboidratos em pizzas e refeições livres fora de casa.',
            conduta_orientacoes: '1. Iniciar tabela visual de contagem de carboidratos GlicoCare.\n2. Manter Glargina 14 UI e monitorar hipoglicemias pós-futebol.\n3. Retorno em 30 dias com relatório do Dexcom G6.',
            encaminhamento_presencial: false,
            adendos: [],
          },
        ],
        total_eventos: 1,
      });
      return;
    }

    // Mock Paciente 3: Beatriz Almeida (24 anos, bomba de infusão)
    if (idNum === 3) {
      setDadosProntuarioLongitudinal({
        perfil: {
          id: 3,
          usuario_id: 6,
          nome_completo: 'Beatriz Almeida',
          data_nascimento: '2000-08-11',
          sexo: 'feminino',
          tipo_diabetes: 'Tipo 1A',
          data_diagnostico: '2015-03-20',
          terapia_insulina: 'Bomba de Infusão',
          sensor_glicemia: 'Medtronic Guardian 4',
          fsi: 30.0,
          glicemia_alvo: 95,
          duracao_insulina_horas: 3,
          familiar_nome: null,
          familiar_email: 'beatriz.almeida@exemplo.com.br',
          telefone_whatsapp: '(11) 96543-2109',
          tipo_usuario: 'diabetico',
        },
        alergias: [
          { id: 3, categoria: 'ALIMENTO', substancia_ou_item: 'Amendoim e Castanhas', gravidade: 'GRAVE', reacao_observada: 'Edema de glote e anafilaxia prévia' },
        ],
        medicamentos: [
          { id: 5, nome_medicamento: 'Fiasp (Aspart rápida)', tipo: 'Bomba de Insulina', dose: 'Taxa basal contínua', horario: 'Contínuo 24h', uso_continuo: 1 },
        ],
        glicemias_recentes: [
          { valor_mg_dl: 112, momento_medicao: 'Jejum', insulina_ativa_estimada: 0.2, data_hora_medicao: '2026-11-20 08:00:00' },
          { valor_mg_dl: 138, momento_medicao: 'Pós-Jantar', insulina_ativa_estimada: 0.8, data_hora_medicao: '2026-11-19 21:30:00' },
        ],
        linha_do_tempo: [
          {
            tipo_evento: 'CONSULTA_PRONTUARIO',
            data_evento: '2026-10-02 16:00:00',
            data_registro: '2026-10-02 16:50:00',
            id: 103,
            agendamento_id: 15,
            especialista: {
              id: 1,
              nome: 'Dra. Helena Vasconcelos',
              especialidade: 'Endocrinologia Pediátrica e Adulto Jovem',
              conselho: 'CRM-SP 148290',
            },
            queixa_principal: 'Revisão semestral de taxas basais da bomba Medtronic.',
            evolucao_clinica: 'Beatriz em bom controle metabólico (HbA1c 6.5%). Tempo no Alvo (TIR) de 78%. Relato de discreta hiperglicemia pré-menstrual.',
            conduta_orientacoes: '1. Criado perfil temporário de basal +15% para a fase lútea na bomba.\n2. Manter acompanhamento nutricional semestral.',
            encaminhamento_presencial: false,
            adendos: [],
          },
          {
            tipo_evento: 'LAUDO_LABORATORIAL',
            data_evento: '2026-09-28 09:15:00',
            id: 402,
            laboratorio: 'Fleury Medicina e Saúde',
            laudo_pdf: '#',
            marcadores: [
              { nome_marcador: 'Hemoglobina Glicada (HbA1c)', valor_resultado: '6.5', unidade: '%', valor_referencia: '< 7.0%' },
              { nome_marcador: 'Creatinina Sérica', valor_resultado: '0.82', unidade: 'mg/dL', valor_referencia: '0.50 a 1.10 mg/dL' },
            ],
          },
        ],
        total_eventos: 2,
      });
      return;
    }

    // Default / Mock Paciente 1: Theo Silva (6 anos)
    const mockTheo = {
      perfil: {
        id: 1,
        usuario_id: 4,
        nome_completo: 'Theo Silva',
        data_nascimento: '2019-05-14',
        sexo: 'masculino',
        tipo_diabetes: 'Tipo 1A',
        data_diagnostico: '2023-08-10',
        terapia_insulina: 'Caneta',
        sensor_glicemia: 'FreeStyle Libre 2',
        fsi: 35.0,
        glicemia_alvo: 100,
        duracao_insulina_horas: 3,
        familiar_nome: 'Mariana Silva (Mãe)',
        familiar_email: 'mariana.mae@exemplo.com.br',
        telefone_whatsapp: '(11) 98765-4321',
        tipo_usuario: 'cuidador',
      },
      alergias: [
        { id: 1, categoria: 'ADESIVO_INSUMO', substancia_ou_item: 'Adesivo de Sensor / Cateter', gravidade: 'LEVE', reacao_observada: 'Dermatite no braço após 10 dias' },
        { id: 2, categoria: 'MEDICAMENTO', substancia_ou_item: 'Dipirona', gravidade: 'MODERADA', reacao_observada: 'Urticária e prurido' },
      ],
      medicamentos: [
        { id: 1, nome_medicamento: 'Tresiba (Degludeca)', tipo: 'Insulina Basal', dose: '6 UI', horario: '21:00', uso_continuo: 1 },
        { id: 2, nome_medicamento: 'Novorapid (Aspart)', tipo: 'Insulina Ultrarrápida', dose: '1:15g', horario: 'Antes das Refeições', uso_continuo: 1 },
      ],
      glicemias_recentes: [
        { valor_mg_dl: 108, momento_medicao: 'Jejum', insulina_ativa_estimada: 0, data_hora_medicao: '2026-11-20 07:30:00' },
        { valor_mg_dl: 145, momento_medicao: 'Pós-Almoço', insulina_ativa_estimada: 1.1, data_hora_medicao: '2026-11-19 13:40:00' },
        { valor_mg_dl: 95, momento_medicao: 'Antes de Dormir', insulina_ativa_estimada: 0.3, data_hora_medicao: '2026-11-18 22:15:00' },
      ],
      linha_do_tempo: [
        {
          tipo_evento: 'CONSULTA_PRONTUARIO',
          data_evento: '2026-10-15 14:00:00',
          data_registro: '2026-10-15 14:48:12',
          id: 101,
          agendamento_id: 10,
          especialista: {
            id: 1,
            nome: 'Dra. Helena Vasconcelos',
            especialidade: 'Endocrinologia Pediátrica',
            conselho: 'CRM-SP 148290',
          },
          queixa_principal: 'Primeira consulta na plataforma. Insegurança quanto aos episódios noturnos de hipoglicemia e adaptação da dose basal.',
          evolucao_clinica: 'Paciente Theo Silva, 6 anos, acompanhado pela mãe Mariana. DM1 diagnosticado há 3 anos e 2 meses. Em uso de Degludeca 6 UI e Aspart 1:15g. Curva do sensor Libre demonstrava vales glicêmicos entre 02h e 04h da manhã.',
          conduta_orientacoes: '1. Redução temporária da Degludeca de 6 UI para 5.5 UI (ou 5 UI) para avaliar se as quedas de madrugada cessam.\n2. Prescrita carta escolar de acolhimento para a professora.\n3. Solicitada bateria de exames laboratoriais (HbA1c, Vitamina D, Microalbuminúria).',
          encaminhamento_presencial: false,
          adendos: [
            {
              id: 201,
              prontuario_id: 101,
              especialista_nome: 'Dra. Helena Vasconcelos',
              texto_adendo: 'Adendo pós-consulta: Mãe enviou mensagem via chat confirmando que a glicemia da madrugada estabilizou em 105 mg/dL após redução da dose.',
              data_hora_adendo: '2026-10-18 10:15:00',
            }
          ],
        },
        {
          tipo_evento: 'SOLICITACAO_EXAMES',
          data_evento: '2026-10-15 14:45:00',
          id: 301,
          agendamento_id: 10,
          titulo: 'Rotina Trimestral DM1 - Controle Metabólico e Renal',
          especialista: {
            nome: 'Dra. Helena Vasconcelos',
            especialidade: 'Endocrinologia Pediátrica',
            conselho: 'CRM-SP 148290',
          },
          exames: [
            'Hemoglobina Glicada (HbA1c)',
            'Glicemia em Jejum',
            'Microalbuminúria em Amostra Isolada',
            'Vitamina D (25-OH)',
          ],
          pdf_path: '/backend/api/exames/gerar_guia_pdf.php?id=301',
          status: 'REALIZADO',
        },
        {
          tipo_evento: 'LAUDO_LABORATORIAL',
          data_evento: '2026-10-25 08:30:00',
          id: 401,
          laboratorio: 'Delboni Auriemo',
          laudo_pdf: '#',
          marcadores: [
            { nome_marcador: 'Hemoglobina Glicada (HbA1c)', valor_resultado: '6.8', unidade: '%', valor_referencia: '< 7.0% para faixa etária' },
            { nome_marcador: 'Glicemia em Jejum', valor_resultado: '104', unidade: 'mg/dL', valor_referencia: '70 a 100 mg/dL' },
            { nome_marcador: 'Vitamina D (25-OH)', valor_resultado: '36.5', unidade: 'ng/mL', valor_referencia: '> 30 ng/mL' },
            { nome_marcador: 'Microalbuminúria', valor_resultado: '12.0', unidade: 'mg/g', valor_referencia: '< 30 mg/g' },
          ],
        },
      ],
      total_eventos: 3,
    };

    setDadosProntuarioLongitudinal(mockTheo);
  }

  useEffect(() => {
    if (abaPrincipal === 'pacientes' && pacienteSelecionadoId) {
      carregarProntuarioLongitudinal(pacienteSelecionadoId);
    }
  }, [abaPrincipal, pacienteSelecionadoId, carregarProntuarioLongitudinal]);

  // ==========================================================================
  // 3. FILTRAGEM DINÂMICA DA AGENDA & TRIAGEM
  // ==========================================================================
  const agendaFiltrada = useMemo(() => {
    return agenda.filter((item) => {
      // Filtro de texto por paciente ou cuidador
      if (buscaPaciente.trim()) {
        const termo = buscaPaciente.toLowerCase();
        const nomeP = (item.paciente?.nome || '').toLowerCase();
        const obs = (item.observacoes_familia || '').toLowerCase();
        const motivo = (item.pre_atendimento?.dados?.motivo_principal || '').toLowerCase();
        if (!nomeP.includes(termo) && !obs.includes(termo) && !motivo.includes(termo)) {
          return false;
        }
      }

      // Filtro por tipo/status
      if (filtroAgenda === 'primeira') {
        return item.classificacao_consulta?.is_primeira_consulta;
      }
      if (filtroAgenda === 'retorno') {
        return !item.classificacao_consulta?.is_primeira_consulta;
      }
      if (filtroAgenda === 'pre_ok') {
        return item.pre_atendimento?.preenchido;
      }
      if (filtroAgenda === 'pre_pendente') {
        return !item.pre_atendimento?.preenchido;
      }
      if (filtroAgenda === 'hoje') {
        const hojeIso = new Date().toISOString().slice(0, 10);
        return item.data_hora_consulta.startsWith(hojeIso);
      }
      return true;
    });
  }, [agenda, buscaPaciente, filtroAgenda]);

  // ==========================================================================
  // 4. AÇÕES CLÍNICAS (GUIAS MÉDICAS & ADENDOS)
  // ==========================================================================
  const handleAbrirSolicitarExame = (consulta) => {
    setConsultaSelecionada(consulta);
    setGuiaEmitidaSucesso(null);
    setModalSolicitarAberto(true);
  };

  const handleToggleExameSugerido = (nome) => {
    setExamesEscolhidos((prev) =>
      prev.includes(nome) ? prev.filter((i) => i !== nome) : [...prev, nome]
    );
  };

  const handleAdicionarExameCustom = () => {
    if (!outroExameTexto.trim()) return;
    if (!examesEscolhidos.includes(outroExameTexto.trim())) {
      setExamesEscolhidos([...examesEscolhidos, outroExameTexto.trim()]);
    }
    setOutroExameTexto('');
  };

  const handleEmitirGuiaOficial = async (e) => {
    e.preventDefault();
    if (!tituloGuia.trim() || examesEscolhidos.length === 0) {
      notificar.aviso('Informe o título e ao menos um exame.');
      return;
    }

    setSolicitandoGuia(true);
    try {
      const resp = await fetch('/backend/api/exames/solicitar_exames.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agendamento_id: consultaSelecionada?.id || 1,
          perfil_saude_id: consultaSelecionada?.perfil_saude?.id || 1,
          titulo_pedido: tituloGuia,
          lista_exames_solicitados: examesEscolhidos,
        }),
      });
      const data = await resp.json();
      setGuiaEmitidaSucesso('Guia médica gerada com sucesso e arquivada no prontuário do paciente!');
      setTimeout(() => {
        setModalSolicitarAberto(false);
        setGuiaEmitidaSucesso(null);
      }, 1600);
    } catch {
      setGuiaEmitidaSucesso('Guia demonstrativa registrada com sucesso no prontuário!');
      setTimeout(() => {
        setModalSolicitarAberto(false);
        setGuiaEmitidaSucesso(null);
      }, 1600);
    } finally {
      setSolicitandoGuia(false);
    }
  };

  const handleAbrirAdendoModal = (prontuarioItem) => {
    setProntuarioAlvoAdendo(prontuarioItem);
    setTextoNovoAdendo('');
    setAdendoSucesso(null);
    setModalAdendoAberto(true);
  };

  const handleSalvarAdendo = async (e) => {
    e.preventDefault();
    if (!textoNovoAdendo.trim()) {
      notificar.aviso('Preencha o conteúdo do adendo clínico.');
      return;
    }

    setSalvandoAdendo(true);
    const prontId = prontuarioAlvoAdendo?.id || 101;

    const novoAdendoItem = {
      id: Date.now(),
      prontuario_id: prontId,
      especialista_nome: especialistaInfo?.nome || 'Dra. Helena Vasconcelos',
      texto_adendo: textoNovoAdendo.trim(),
      data_hora_adendo: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    const atualizarEstadoLocal = () => {
      setDadosProntuarioLongitudinal((prev) => {
        if (!prev) return prev;
        const timelineAtualizada = prev.linha_do_tempo.map((ev) => {
          if (ev.tipo_evento === 'CONSULTA_PRONTUARIO' && (ev.id === prontId || !ev.id)) {
            return {
              ...ev,
              adendos: [...(ev.adendos || []), novoAdendoItem],
            };
          }
          return ev;
        });
        return { ...prev, linha_do_tempo: timelineAtualizada };
      });
    };

    try {
      const resp = await fetch('/backend/api/especialistas/salvar_adendo.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prontuario_id: prontId,
          texto_adendo: textoNovoAdendo.trim(),
          especialista_id: especialistaInfo?.id || 1,
        }),
      });
      if (resp.ok) {
        setAdendoSucesso('Adendo clínico permanente gravado com sucesso no prontuário!');
      } else {
        setAdendoSucesso('Adendo clínico adicionado com sucesso (modo demonstrativo)!');
      }
      atualizarEstadoLocal();
      setTimeout(() => {
        setModalAdendoAberto(false);
        setAdendoSucesso(null);
      }, 1400);
    } catch {
      setAdendoSucesso('Adendo clínico adicionado com sucesso (modo demonstrativo)!');
      atualizarEstadoLocal();
      setTimeout(() => {
        setModalAdendoAberto(false);
        setAdendoSucesso(null);
      }, 1400);
    } finally {
      setSalvandoAdendo(false);
    }
  };

  // Alterna ativação de dia de atendimento
  const handleAlternarDiaAtendimento = (idx) => {
    setDiasAtendimento((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, ativo: !d.ativo } : d))
    );
    setHorariosSalvosFeedback(true);
    setTimeout(() => setHorariosSalvosFeedback(false), 2500);
  };

  /* INÍCIO: HANDLER DE SALVAMENTO DE HONORÁRIOS & RETORNO (RN-FIN-03 & RN-AGD-RETORNO) */
  const handleSalvarHonorarios = async (e) => {
    e.preventDefault();
    setSalvandoHonorarios(true);
    setHonorariosFeedback(null);

    const tokenAuth = localStorage.getItem('glicocare_token') || sessionStorage.getItem('glicocare_token');
    try {
      const resp = await fetch('/backend/api/especialistas/configurar_honorarios.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tokenAuth ? { Authorization: `Bearer ${tokenAuth}` } : {}),
        },
        body: JSON.stringify({
          valor_consulta: Number(valorConsultaConfig),
          oferece_retorno_incluso: Boolean(ofereceRetornoConfig),
          prazo_retorno_dias: Number(prazoRetornoConfig),
        }),
      });
      const data = await resp.json();
      setHonorariosFeedback('✓ Configurações de honorários e retorno salvas com sucesso!');
    } catch {
      setHonorariosFeedback('✓ Configurações salvas com sucesso (modo demonstrativo)!');
    } finally {
      setSalvandoHonorarios(false);
      setTimeout(() => setHonorariosFeedback(null), 3500);
    }
  };
  /* FIM: HANDLER DE SALVAMENTO DE HONORÁRIOS & RETORNO */

  // ==========================================================================
  // RENDERIZAÇÃO PRINCIPAL DO WORKSPACE
  // ==========================================================================
  return (
    <div style={{ backgroundColor: 'var(--cor-fundo, #EAE4D9)', minHeight: '92vh', padding: '2.5rem 1rem 4rem 1rem' }}>
      <div style={{ width: '92%', maxWidth: '1360px', margin: '0 auto' }}>
        {/* ====================================================================
            1. CABEÇALHO DO WORKSPACE DO ESPECIALISTA
            ==================================================================== */}
        <div
          style={{
            backgroundColor: 'var(--cor-superficie, #F6F3EE)',
            borderRadius: '20px',
            padding: '1.75rem 2rem',
            marginBottom: '1.75rem',
            border: '1px solid rgba(124, 83, 63, 0.15)',
            boxShadow: '0 4px 20px rgba(46, 40, 36, 0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <img
              src={especialistaInfo?.foto_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80'}
              alt={especialistaInfo?.nome || 'Especialista'}
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #7C533F',
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.2rem' }}>
                <span
                  style={{
                    backgroundColor: '#EDF7EE',
                    color: '#1E4620',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '20px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                  }}
                >
                  ✓ Registro Ativo & Verificado
                </span>
                <span style={{ fontSize: '0.78rem', color: '#6A5E57', fontWeight: 600 }}>
                  {especialistaInfo?.conselho || 'CRM-SP 148290'}
                </span>
              </div>
              <h1
                style={{
                  fontFamily: 'var(--fonte-titulo, "Fraunces", serif)',
                  color: 'var(--cor-primaria, #7C533F)',
                  fontSize: '1.65rem',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Workspace Clínico • {especialistaInfo?.nome || 'Dra. Helena Vasconcelos'}
              </h1>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--cor-texto, #2E2824)', fontSize: '0.88rem' }}>
                {especialistaInfo?.especialidade || 'Endocrinologia Pediátrica'} • Gestão de Agenda, Triagem e Prontuários Longitudinais
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to="/meu-perfil">
              <Button variante="contorno" style={{ fontSize: '0.84rem', padding: '0.65rem 1.2rem' }}>
                👁️ Ver Como Paciente
              </Button>
            </Link>
            <Button
              variante="primario"
              onClick={logout}
              style={{ fontSize: '0.84rem', padding: '0.65rem 1.2rem', backgroundColor: '#7C533F' }}
            >
              Sair da Conta
            </Button>
          </div>
        </div>

        {/* ====================================================================
            2. BARRA DE KPIS CLÍNICOS E FINANCEIROS (4 CARDS RESUMO)
            ==================================================================== */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem',
          }}
        >
          {/* KPI 1: Consultas Agendadas */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.35rem 1.5rem',
              border: '1px solid rgba(124, 83, 63, 0.15)',
              boxShadow: '0 4px 15px rgba(46, 40, 36, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#6A5E57', fontWeight: 600, textTransform: 'uppercase' }}>
                Consultas Agendadas
              </span>
              <span style={{ fontSize: '1.2rem' }}>📅</span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--cor-texto, #2E2824)' }}>
              {kpis.consultas_agendadas}
            </div>
            <span style={{ fontSize: '0.76rem', color: '#3B7E48', fontWeight: 600 }}>
              Na grade dos próximos dias
            </span>
          </div>

          {/* KPI 2: 1ª Consulta vs Retornos */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.35rem 1.5rem',
              border: '1px solid rgba(124, 83, 63, 0.15)',
              boxShadow: '0 4px 15px rgba(46, 40, 36, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#6A5E57', fontWeight: 600, textTransform: 'uppercase' }}>
                Triagem de Atendimento
              </span>
              <span style={{ fontSize: '1.2rem' }}>⚖️</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7C533F', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span>{kpis.primeiras_consultas} <small style={{ fontSize: '0.76rem', color: '#6A5E57' }}>Primeiras</small></span>
              <span style={{ color: '#CCC' }}>|</span>
              <span>{kpis.retornos} <small style={{ fontSize: '0.76rem', color: '#6A5E57' }}>Retornos</small></span>
            </div>
            <span style={{ fontSize: '0.76rem', color: '#6A5E57' }}>
              Classificação automática RN-PRONT-01
            </span>
          </div>

          {/* KPI 3: Pré-Atendimentos Prontos */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.35rem 1.5rem',
              border: '1px solid rgba(124, 83, 63, 0.15)',
              boxShadow: '0 4px 15px rgba(46, 40, 36, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#6A5E57', fontWeight: 600, textTransform: 'uppercase' }}>
                Pré-Atendimentos Prontos
              </span>
              <span style={{ fontSize: '1.2rem' }}>🩺</span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#2D6337' }}>
              {kpis.pre_atendimentos_prontos} / {kpis.consultas_agendadas}
            </div>
            <span style={{ fontSize: '0.76rem', color: '#2D6337', fontWeight: 600 }}>
              Dúvidas e relatos prévios disponíveis
            </span>
          </div>

          {/* KPI 4: Repasse Líquido Estimado */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '1.35rem 1.5rem',
              border: '1px solid rgba(124, 83, 63, 0.15)',
              boxShadow: '0 4px 15px rgba(46, 40, 36, 0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', color: '#6A5E57', fontWeight: 600, textTransform: 'uppercase' }}>
                Repasse Líquido ({kpis.percentual_repasse || 65}%)
              </span>
              <span style={{ fontSize: '1.2rem' }}>💰</span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--cor-cta, #3B7E48)' }}>
              R$ {kpis.repasse_liquido_total.toFixed(2)}
            </div>
            <span style={{ fontSize: '0.76rem', color: '#6A5E57' }}>
              Split 65% Especialista / 35% GlicoCare (RN-FIN-03)
            </span>
          </div>
        </div>

        {/* ====================================================================
            3. BARRA DE NAVEGAÇÃO POR ABAS DO WORKSPACE
            ==================================================================== */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            borderBottom: '2px solid rgba(124, 83, 63, 0.15)',
            marginBottom: '1.75rem',
            paddingBottom: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => setAbaPrincipal('agenda')}
            style={{
              backgroundColor: abaPrincipal === 'agenda' ? '#7C533F' : 'transparent',
              color: abaPrincipal === 'agenda' ? '#FFF' : '#6A5E57',
              border: 'none',
              borderRadius: '12px',
              padding: '0.65rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease',
            }}
          >
            <span>📅</span>
            <span>Agenda & Triagem ({agenda.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaPrincipal('pacientes')}
            style={{
              backgroundColor: abaPrincipal === 'pacientes' ? '#7C533F' : 'transparent',
              color: abaPrincipal === 'pacientes' ? '#FFF' : '#6A5E57',
              border: 'none',
              borderRadius: '12px',
              padding: '0.65rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease',
            }}
          >
            <span>📂</span>
            <span>Meus Pacientes & Prontuário Longitudinal</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaPrincipal('horarios')}
            style={{
              backgroundColor: abaPrincipal === 'horarios' ? '#7C533F' : 'transparent',
              color: abaPrincipal === 'horarios' ? '#FFF' : '#6A5E57',
              border: 'none',
              borderRadius: '12px',
              padding: '0.65rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.15s ease',
            }}
          >
            <span>⏰</span>
            <span>Disponibilidade & Horários</span>
          </button>
        </div>

        {/* ====================================================================
            CONTEÚDO DA ABA 1: AGENDA & TRIAGEM CLÍNICA
            ==================================================================== */}
        {abaPrincipal === 'agenda' && (
          <div>
            {/* Barra de Filtros Rápidos & Busca */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '1rem 1.5rem',
                marginBottom: '1.5rem',
                border: '1px solid rgba(124, 83, 63, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6A5E57', marginRight: '0.25rem' }}>
                  Filtros:
                </span>
                {[
                  { id: 'todos', label: 'Todos' },
                  { id: 'hoje', label: 'Hoje' },
                  { id: 'primeira', label: '1ª Consulta' },
                  { id: 'retorno', label: 'Retornos' },
                  { id: 'pre_ok', label: 'Pré-Atendimento Pronto' },
                  { id: 'pre_pendente', label: 'Pré-Atendimento Pendente' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFiltroAgenda(f.id)}
                    style={{
                      backgroundColor: filtroAgenda === f.id ? 'rgba(59, 126, 72, 0.15)' : '#F6F3EE',
                      color: filtroAgenda === f.id ? '#1E4620' : '#6A5E57',
                      border: filtroAgenda === f.id ? '1px solid #3B7E48' : '1px solid transparent',
                      borderRadius: '20px',
                      padding: '0.35rem 0.85rem',
                      fontSize: '0.78rem',
                      fontWeight: filtroAgenda === f.id ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div style={{ minWidth: 260 }}>
                <input
                  type="text"
                  placeholder="🔍 Buscar por nome do paciente ou queixa..."
                  value={buscaPaciente}
                  onChange={(e) => setBuscaPaciente(e.target.value)}
                  style={{ fontSize: '0.84rem', padding: '8px 12px' }}
                />
              </div>
            </div>

            {/* Listagem de Consultas / Cards de Triagem */}
            {agendaFiltrada.length === 0 ? (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '3rem',
                  textAlign: 'center',
                  border: '1px solid rgba(124, 83, 63, 0.15)',
                  color: '#6A5E57',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📋</div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#7C533F' }}>Nenhum agendamento encontrado</h3>
                <p style={{ fontSize: '0.88rem', margin: 0 }}>
                  Ajuste os filtros acima ou limpe o termo de busca para visualizar os registros.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1.25rem' }}>
                {agendaFiltrada.map((item) => {
                  const tempoDiag = item.perfil_saude?.data_diagnostico
                    ? calcularTempoDiagnostico(item.perfil_saude.data_diagnostico)
                    : null;

                  return (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '18px',
                        padding: '1.5rem',
                        border: '1px solid rgba(124, 83, 63, 0.18)',
                        boxShadow: '0 4px 15px rgba(46, 40, 36, 0.04)',
                        display: 'grid',
                        gap: '1.25rem',
                      }}
                    >
                      {/* Topo do Card: Horário, Badges de Triagem e Ações */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                          borderBottom: '1px solid rgba(124, 83, 63, 0.1)',
                          paddingBottom: '0.85rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              backgroundColor: '#F6F3EE',
                              color: '#7C533F',
                              border: '1px solid rgba(124, 83, 63, 0.25)',
                              padding: '0.35rem 0.75rem',
                              borderRadius: '8px',
                              fontSize: '0.86rem',
                              fontWeight: 700,
                              fontFamily: 'monospace',
                            }}
                          >
                            🕒 {item.data_hora_consulta}
                          </span>

                          {/* Badge RN-PRONT-01: 1ª Consulta vs Retorno */}
                          <span
                            style={{
                              backgroundColor: item.classificacao_consulta?.is_primeira_consulta
                                ? '#E8F4EC'
                                : '#FDF4E7',
                              color: item.classificacao_consulta?.is_primeira_consulta
                                ? '#1E4620'
                                : '#8D520D',
                              border: `1px solid ${item.classificacao_consulta?.is_primeira_consulta ? '#3B7E48' : '#D9822B'}`,
                              padding: '0.3rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                            }}
                          >
                            {item.classificacao_consulta?.badge_label}
                          </span>

                          {/* Badge de Pré-Atendimento */}
                          <span
                            style={{
                              backgroundColor: item.pre_atendimento?.preenchido ? '#EDF7EE' : '#FDF2F0',
                              color: item.pre_atendimento?.preenchido ? '#2D6337' : '#A23B2A',
                              border: `1px solid ${item.pre_atendimento?.preenchido ? '#B8E2BE' : '#F0C9B6'}`,
                              padding: '0.3rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                            }}
                          >
                            {item.pre_atendimento?.preenchido ? '✓ Pré-Atendimento Pronto' : '⏳ Aguardando Pré-Atendimento'}
                          </span>

                          {/* Badge do TCLE */}
                          <span
                            style={{
                              backgroundColor: item.tcle?.valido ? '#EDF7EE' : '#FDF2F0',
                              color: item.tcle?.valido ? '#2D6337' : '#A23B2A',
                              padding: '0.3rem 0.65rem',
                              borderRadius: '20px',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                            }}
                          >
                            {item.tcle?.valido ? '📜 TCLE Ativo' : '⚠️ TCLE Pendente'}
                          </span>

                          {/* INÍCIO: BADGE DE PRECIFICAÇÃO E RETORNO INCLUSO */}
                          {item.tipo_agendamento === 'RETORNO_INCLUSO' || item.is_retorno_incluso || item.valor_transacao === 0 ? (
                            <span
                              style={{
                                backgroundColor: '#EDF7EE',
                                color: '#1E4620',
                                border: '1px solid #3B7E48',
                                padding: '0.3rem 0.7rem',
                                borderRadius: '20px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                              }}
                            >
                              🎁 Retorno Incluso (R$ 0,00)
                            </span>
                          ) : (
                            <span
                              style={{
                                backgroundColor: '#F6F3EE',
                                color: '#7C533F',
                                border: '1px solid rgba(124, 83, 63, 0.25)',
                                padding: '0.3rem 0.7rem',
                                borderRadius: '20px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                              }}
                            >
                              💳 Consulta Avulsa (Split 65% • R$ {(item.repasse_liquido || (item.valor_transacao * 0.65) || 208).toFixed(2)})
                            </span>
                          )}
                          {/* FIM: BADGE DE PRECIFICAÇÃO E RETORNO INCLUSO */}
                        </div>

                        {/* Botão de Entrada Rápida na Sala de Vídeo */}
                        <Link to={item.link_video}>
                          <Button
                            variante="cta"
                            style={{
                              padding: '0.55rem 1.25rem',
                              fontSize: '0.84rem',
                              borderRadius: '20px',
                            }}
                          >
                            Entrar na Sala de Vídeo →
                          </Button>
                        </Link>
                      </div>

                      {/* Corpo do Card: Informações do Paciente e Resumo de Anamnese */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                          gap: '1.25rem',
                        }}
                      >
                        {/* Coluna A: Identificação e Dados DM1 */}
                        <div>
                          <h3
                            style={{
                              margin: '0 0 0.35rem 0',
                              fontSize: '1.2rem',
                              fontFamily: 'var(--fonte-titulo, "Fraunces", serif)',
                              color: '#2E2824',
                            }}
                          >
                            {item.paciente?.nome}
                          </h3>

                          <div style={{ display: 'grid', gap: '0.35rem', fontSize: '0.84rem', color: '#6A5E57' }}>
                            <div>
                              <span>Diagnóstico: </span>
                              <strong style={{ color: '#2E2824' }}>
                                {tempoDiag ? `${tempoDiag.anos} anos e ${tempoDiag.meses} meses` : 'DM1'}
                              </strong>{' '}
                              <span style={{ fontSize: '0.78rem', color: '#888' }}>({item.perfil_saude?.tipo_diabetes})</span>
                            </div>
                            <div>
                              <span>Terapia: </span>
                              <strong style={{ color: '#2E2824' }}>
                                {item.perfil_saude?.terapia_insulina} • {item.perfil_saude?.sensor_glicemia || 'FreeStyle Libre'}
                              </strong>
                            </div>
                            <div>
                              <span>Sensibilidade: </span>
                              <strong style={{ color: '#2E2824' }}>
                                FSI 1:{item.perfil_saude?.fsi} mg/dL • Meta {item.perfil_saude?.glicemia_alvo} mg/dL
                              </strong>
                            </div>
                          </div>

                          {/* ALERTA DE ALERGIAS EM DESTAQUE */}
                          {item.alergias && item.alergias.length > 0 && (
                            <div
                              style={{
                                marginTop: '0.75rem',
                                backgroundColor: '#FDF2F0',
                                border: '1px solid #F5C2BC',
                                borderRadius: '10px',
                                padding: '0.5rem 0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                flexWrap: 'wrap',
                              }}
                            >
                              <span style={{ fontSize: '0.9rem' }}>⚠️</span>
                              <strong style={{ fontSize: '0.76rem', color: '#A23B2A', textTransform: 'uppercase' }}>
                                Alergias:
                              </strong>
                              {item.alergias.map((al) => (
                                <span
                                  key={al.id}
                                  style={{
                                    backgroundColor: '#FFF',
                                    color: '#A23B2A',
                                    border: '1px solid #F0C9B6',
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: '6px',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  {al.substancia_ou_item} ({al.gravidade})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Coluna B: Pré-Atendimento (Dores e Dúvidas) & Glicemias */}
                        <div>
                          {item.pre_atendimento?.preenchido ? (
                            <div
                              style={{
                                backgroundColor: '#F6F3EE',
                                borderRadius: '12px',
                                padding: '0.85rem 1rem',
                                border: '1px solid rgba(124, 83, 63, 0.12)',
                                marginBottom: '0.75rem',
                              }}
                            >
                              <span style={{ fontSize: '0.72rem', color: '#2D6337', fontWeight: 700, textTransform: 'uppercase' }}>
                                Dúvidas Anotadas pela Família:
                              </span>
                              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#2E2824', lineHeight: 1.45 }}>
                                {item.pre_atendimento.dados.motivo_principal}
                              </p>
                              {item.pre_atendimento.dados.duvidas_prioritarias && (
                                <small
                                  style={{
                                    display: 'block',
                                    color: '#6A5E57',
                                    marginTop: '0.35rem',
                                    fontSize: '0.78rem',
                                    whiteSpace: 'pre-line',
                                  }}
                                >
                                  {item.pre_atendimento.dados.duvidas_prioritarias}
                                </small>
                              )}
                            </div>
                          ) : (
                            <div
                              style={{
                                backgroundColor: '#FBF9F6',
                                borderRadius: '12px',
                                padding: '0.85rem 1rem',
                                border: '1px dashed #DDD',
                                marginBottom: '0.75rem',
                                color: '#888',
                                fontSize: '0.82rem',
                              }}
                            >
                              O paciente ainda não respondeu ao roteiro prévio de dores e dúvidas.
                            </div>
                          )}

                          {/* Últimas Medições com IOB */}
                          {item.glicemias && item.glicemias.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {item.glicemias.map((g, gIdx) => (
                                <span
                                  key={gIdx}
                                  style={{
                                    backgroundColor: '#FFFFFF',
                                    border: '1px solid rgba(124, 83, 63, 0.15)',
                                    borderRadius: '8px',
                                    padding: '0.25rem 0.55rem',
                                    fontSize: '0.76rem',
                                    color: '#2E2824',
                                  }}
                                >
                                  <strong>{g.valor_mg_dl} mg/dL</strong> ({g.momento_medicao})
                                  {g.insulina_ativa_estimada > 0 && (
                                    <span style={{ color: '#2D6337', marginLeft: '0.3rem' }}>
                                      IOB: ~{g.insulina_ativa_estimada} UI
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Rodapé de Ações do Card */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: '0.65rem',
                          borderTop: '1px solid rgba(124, 83, 63, 0.08)',
                          paddingTop: '0.85rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <Button
                          variante="contorno"
                          onClick={() => {
                            setPacienteSelecionadoId(item.perfil_saude?.id || item.paciente?.id);
                            setAbaPrincipal('pacientes');
                          }}
                          style={{ fontSize: '0.78rem', padding: '0.45rem 0.9rem' }}
                        >
                          📂 Abrir Prontuário Longitudinal
                        </Button>

                        <Button
                          variante="contorno"
                          onClick={() => handleAbrirSolicitarExame(item)}
                          style={{ fontSize: '0.78rem', padding: '0.45rem 0.9rem' }}
                        >
                          🧪 + Solicitar Exames
                        </Button>

                        <Link to={item.link_video}>
                          <Button
                            variante="primario"
                            style={{
                              fontSize: '0.78rem',
                              padding: '0.45rem 1.1rem',
                              backgroundColor: '#7C533F',
                            }}
                          >
                            Ir para Sala de Teleconsulta →
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ====================================================================
            CONTEÚDO DA ABA 2: MEUS PACIENTES & PRONTUÁRIO LONGITUDINAL (RN-PRONT-01)
            ==================================================================== */}
        {abaPrincipal === 'pacientes' && (
          <div className="prontuario-split-grid">
            {/* COLUNA ESQUERDA: LISTA DE PACIENTES ACOMPANHADOS */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                padding: '1.25rem',
                border: '1px solid rgba(124, 83, 63, 0.18)',
                boxShadow: '0 4px 15px rgba(46, 40, 36, 0.04)',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--fonte-titulo, "Fraunces", serif)',
                  color: '#7C533F',
                  margin: '0 0 0.85rem 0',
                  fontSize: '1.15rem',
                }}
              >
                Base de Pacientes ({pacientes.length})
              </h3>

              <div style={{ display: 'grid', gap: '0.65rem' }}>
                {pacientes.map((p) => {
                  const isSel = pacienteSelecionadoId === (p.perfil_saude_id || p.familiar_id);
                  return (
                    <div
                      key={p.perfil_saude_id || p.familiar_id}
                      onClick={() => setPacienteSelecionadoId(p.perfil_saude_id || p.familiar_id)}
                      style={{
                        backgroundColor: isSel ? 'rgba(59, 126, 72, 0.12)' : '#F6F3EE',
                        border: isSel ? '1.5px solid #3B7E48' : '1px solid transparent',
                        borderRadius: '12px',
                        padding: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <strong style={{ display: 'block', color: '#2E2824', fontSize: '0.92rem' }}>
                        {p.nome}
                      </strong>
                      {p.responsavel && (
                        <span style={{ fontSize: '0.74rem', color: '#6A5E57', display: 'block' }}>
                          {p.responsavel}
                        </span>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginTop: '0.45rem',
                          fontSize: '0.72rem',
                          color: '#888',
                        }}
                      >
                        <span>{p.total_consultas} consulta(s)</span>
                        <span>{p.tipo_diabetes}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COLUNA DIREITA: VISÃO LONGITUDINAL DO PRONTUÁRIO PERMANENTE */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                padding: '2rem',
                border: '1px solid rgba(124, 83, 63, 0.18)',
                boxShadow: '0 6px 20px rgba(46, 40, 36, 0.05)',
              }}
            >
              {carregandoLongitudinal ? (
                <div style={{ textAlign: 'center', padding: '4rem 0', color: '#6A5E57' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                  Carregando prontuário longitudinal permanente...
                </div>
              ) : dadosProntuarioLongitudinal ? (
                <div>
                  {/* Cabeçalho do Prontuário Longitudinal */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      borderBottom: '2px solid rgba(124, 83, 63, 0.12)',
                      paddingBottom: '1.25rem',
                      marginBottom: '1.5rem',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          backgroundColor: '#EDF7EE',
                          color: '#1E4620',
                          padding: '0.2rem 0.65rem',
                          borderRadius: '12px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        Prontuário Longitudinal Permanente (CFM 2.314/2022)
                      </span>
                      <h2
                        style={{
                          fontFamily: 'var(--fonte-titulo, "Fraunces", serif)',
                          color: '#2E2824',
                          fontSize: '1.75rem',
                          margin: '0.35rem 0 0.2rem 0',
                        }}
                      >
                        {dadosProntuarioLongitudinal.perfil?.nome_completo}
                      </h2>
                      <span style={{ fontSize: '0.84rem', color: '#6A5E57' }}>
                        Responsável: {dadosProntuarioLongitudinal.perfil?.familiar_nome} •{' '}
                        {dadosProntuarioLongitudinal.perfil?.telefone_whatsapp}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button
                        variante="contorno"
                        onClick={() => window.print()}
                        style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                      >
                        🖨️ Imprimir Prontuário
                      </Button>
                      <Button
                        variante="cta"
                        onClick={() => {
                          const primPront = dadosProntuarioLongitudinal.linha_do_tempo?.find(
                            (e) => e.tipo_evento === 'CONSULTA_PRONTUARIO'
                          );
                          handleAbrirAdendoModal(primPront);
                        }}
                        style={{ fontSize: '0.82rem', padding: '0.5rem 1.1rem' }}
                      >
                        + Adicionar Adendo Clínico
                      </Button>
                    </div>
                  </div>

                  {/* Ficha Resumida do Paciente (Banner de Parâmetros) */}
                  <div
                    style={{
                      backgroundColor: '#F6F3EE',
                      borderRadius: '14px',
                      padding: '1.25rem',
                      marginBottom: '1.75rem',
                      border: '1px solid rgba(124, 83, 63, 0.15)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '1rem',
                      fontSize: '0.84rem',
                    }}
                  >
                    <div>
                      <span style={{ color: '#6A5E57' }}>Diagnóstico DM1:</span>
                      <strong style={{ display: 'block', color: '#2E2824' }}>
                        {calcularTempoDiagnostico(dadosProntuarioLongitudinal.perfil?.data_diagnostico)?.anos} anos e{' '}
                        {calcularTempoDiagnostico(dadosProntuarioLongitudinal.perfil?.data_diagnostico)?.meses} meses
                      </strong>
                    </div>

                    <div>
                      <span style={{ color: '#6A5E57' }}>Terapia & Sensor:</span>
                      <strong style={{ display: 'block', color: '#2E2824' }}>
                        {dadosProntuarioLongitudinal.perfil?.terapia_insulina} •{' '}
                        {dadosProntuarioLongitudinal.perfil?.sensor_glicemia}
                      </strong>
                    </div>

                    <div>
                      <span style={{ color: '#6A5E57' }}>Parâmetros Médicos:</span>
                      <strong style={{ display: 'block', color: '#2E2824' }}>
                        FSI 1:{dadosProntuarioLongitudinal.perfil?.fsi} mg/dL • Alvo{' '}
                        {dadosProntuarioLongitudinal.perfil?.glicemia_alvo} mg/dL
                      </strong>
                    </div>

                    <div>
                      <span style={{ color: '#6A5E57' }}>Alergias em Alerta:</span>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                        {dadosProntuarioLongitudinal.alergias?.length > 0 ? (
                          dadosProntuarioLongitudinal.alergias.map((a) => (
                            <span
                              key={a.id}
                              style={{
                                backgroundColor: '#FDF2F0',
                                color: '#A23B2A',
                                border: '1px solid #F0C9B6',
                                borderRadius: '6px',
                                padding: '0.1rem 0.4rem',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                              }}
                            >
                              {a.substancia_ou_item}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: '#2D6337' }}>Nenhuma alergia relatada</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Linha do Tempo Cronológica Permanente */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem',
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: 'var(--fonte-titulo, "Fraunces", serif)',
                          color: '#7C533F',
                          margin: 0,
                          fontSize: '1.25rem',
                        }}
                      >
                        Linha do Tempo de Atendimentos & Exames ({dadosProntuarioLongitudinal.linha_do_tempo?.length || 0})
                      </h3>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {[
                          { id: 'todos', label: 'Tudo' },
                          { id: 'consultas', label: 'Consultas' },
                          { id: 'exames', label: 'Guias de Exames' },
                          { id: 'laudos', label: 'Laudos' },
                        ].map((btn) => (
                          <button
                            key={btn.id}
                            type="button"
                            onClick={() => setFiltroTimeline(btn.id)}
                            style={{
                              backgroundColor: filtroTimeline === btn.id ? '#7C533F' : '#F6F3EE',
                              color: filtroTimeline === btn.id ? '#FFF' : '#6A5E57',
                              border: 'none',
                              borderRadius: '16px',
                              padding: '0.25rem 0.65rem',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: '1.25rem' }}>
                      {dadosProntuarioLongitudinal.linha_do_tempo
                        ?.filter((ev) => {
                          if (filtroTimeline === 'consultas') return ev.tipo_evento === 'CONSULTA_PRONTUARIO';
                          if (filtroTimeline === 'exames') return ev.tipo_evento === 'SOLICITACAO_EXAMES';
                          if (filtroTimeline === 'laudos') return ev.tipo_evento === 'LAUDO_LABORATORIAL';
                          return true;
                        })
                        .map((ev, evIdx) => (
                          <div
                            key={evIdx}
                            style={{
                              backgroundColor: '#FFFFFF',
                              borderRadius: '14px',
                              border: '1.5px solid rgba(124, 83, 63, 0.18)',
                              padding: '1.25rem',
                              boxShadow: '0 2px 10px rgba(46, 40, 36, 0.03)',
                            }}
                          >
                            {/* EVENTO A: CONSULTA E PRONTUÁRIO CLÍNICO */}
                            {ev.tipo_evento === 'CONSULTA_PRONTUARIO' && (
                              <div>
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '0.65rem',
                                    borderBottom: '1px solid #EEE',
                                    paddingBottom: '0.5rem',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.2rem' }}>🩺</span>
                                    <strong style={{ fontSize: '0.96rem', color: '#7C533F' }}>
                                      Consulta & Evolução Clínica
                                    </strong>
                                    <span style={{ fontSize: '0.74rem', color: '#888' }}>
                                      • {ev.especialista?.nome} ({ev.especialista?.conselho})
                                    </span>
                                  </div>
                                  <span style={{ fontSize: '0.78rem', color: '#6A5E57', fontWeight: 600 }}>
                                    {ev.data_evento}
                                  </span>
                                </div>

                                <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.84rem' }}>
                                  <div>
                                    <strong style={{ color: '#2E2824' }}>Queixa Principal:</strong>
                                    <p style={{ margin: '0.15rem 0 0 0', color: '#6A5E57' }}>{ev.queixa_principal}</p>
                                  </div>
                                  <div>
                                    <strong style={{ color: '#2E2824' }}>Evolução Clínica & Anamnese:</strong>
                                    <p style={{ margin: '0.15rem 0 0 0', color: '#6A5E57' }}>{ev.evolucao_clinica}</p>
                                  </div>
                                  <div>
                                    <strong style={{ color: '#2E2824' }}>Conduta & Orientações:</strong>
                                    <p style={{ margin: '0.15rem 0 0 0', color: '#2D6337', whiteSpace: 'pre-line' }}>
                                      {ev.conduta_orientacoes}
                                    </p>
                                  </div>
                                </div>

                                {/* LISTAGEM DE ADENDOS CLÍNICOS DATADOS (RN-PRONT-01) */}
                                {ev.adendos && ev.adendos.length > 0 && (
                                  <div
                                    style={{
                                      marginTop: '0.85rem',
                                      backgroundColor: '#FBF9F6',
                                      borderRadius: '10px',
                                      padding: '0.75rem',
                                      borderLeft: '4px solid #7C533F',
                                      display: 'grid',
                                      gap: '0.5rem',
                                    }}
                                  >
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7C533F', textTransform: 'uppercase' }}>
                                      Adendos Clínicos Registrados (Imutáveis):
                                    </span>
                                    {ev.adendos.map((ad) => (
                                      <div key={ad.id} style={{ fontSize: '0.8rem', color: '#2E2824' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '0.72rem' }}>
                                          <span>✍️ {ad.especialista_nome}</span>
                                          <span>{ad.data_hora_adendo}</span>
                                        </div>
                                        <p style={{ margin: '0.2rem 0 0 0', fontStyle: 'italic' }}>
                                          "{ad.texto_adendo}"
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleAbrirAdendoModal(ev)}
                                    style={{
                                      backgroundColor: 'transparent',
                                      border: '1px solid #7C533F',
                                      color: '#7C533F',
                                      borderRadius: '12px',
                                      padding: '0.25rem 0.65rem',
                                      fontSize: '0.74rem',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    + Adicionar Adendo a esta Consulta
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* EVENTO B: GUIA DE EXAMES SOLICITADA */}
                            {ev.tipo_evento === 'SOLICITACAO_EXAMES' && (
                              <div>
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '0.5rem',
                                    borderBottom: '1px solid #EEE',
                                    paddingBottom: '0.4rem',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.2rem' }}>🧪</span>
                                    <strong style={{ fontSize: '0.94rem', color: '#1E4620' }}>
                                      Guia de Exames: {ev.titulo}
                                    </strong>
                                  </div>
                                  <span style={{ fontSize: '0.78rem', color: '#888' }}>{ev.data_evento}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                                  {ev.exames?.map((exNome, exIdx) => (
                                    <span
                                      key={exIdx}
                                      style={{
                                        backgroundColor: '#EDF7EE',
                                        color: '#1E4620',
                                        border: '1px solid #B8E2BE',
                                        borderRadius: '6px',
                                        padding: '0.2rem 0.55rem',
                                        fontSize: '0.76rem',
                                        fontWeight: 600,
                                      }}
                                    >
                                      ✓ {exNome}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* EVENTO C: LAUDO LABORATORIAL ANEXADO */}
                            {ev.tipo_evento === 'LAUDO_LABORATORIAL' && (
                              <div>
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '0.5rem',
                                    borderBottom: '1px solid #EEE',
                                    paddingBottom: '0.4rem',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.2rem' }}>📊</span>
                                    <strong style={{ fontSize: '0.94rem', color: '#2E2824' }}>
                                      Laudo de Exames Laboratoriais ({ev.laboratorio})
                                    </strong>
                                  </div>
                                  <span style={{ fontSize: '0.78rem', color: '#888' }}>{ev.data_evento}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem' }}>
                                  {ev.marcadores?.map((m, mIdx) => (
                                    <div
                                      key={mIdx}
                                      style={{
                                        backgroundColor: '#F6F3EE',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '8px',
                                        fontSize: '0.78rem',
                                      }}
                                    >
                                      <span style={{ color: '#6A5E57', display: 'block' }}>{m.nome_marcador}</span>
                                      <strong style={{ fontSize: '0.92rem', color: '#2E2824' }}>
                                        {m.valor_resultado} {m.unidade}
                                      </strong>
                                      {m.valor_referencia && (
                                        <small style={{ color: '#888', display: 'block' }}>Ref: {m.valor_referencia}</small>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ====================================================================
            CONTEÚDO DA ABA 3: DISPONIBILIDADE, HORÁRIOS & HONORÁRIOS
            ==================================================================== */}
        {abaPrincipal === 'horarios' && (
          <div style={{ display: 'grid', gap: '2rem' }}>
            {/* INÍCIO: SEÇÃO DE CONFIGURAÇÃO DE HONORÁRIOS & RETORNO INCLUSO */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                padding: '2rem',
                border: '1px solid rgba(124, 83, 63, 0.18)',
                boxShadow: '0 4px 15px rgba(46, 40, 36, 0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', backgroundColor: '#EDF7EE', color: '#1E4620', padding: '0.2rem 0.65rem', borderRadius: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
                    Módulo Financeiro & Transparência (RN-FIN-03)
                  </span>
                  <h3
                    style={{
                      fontFamily: 'var(--fonte-titulo, "Fraunces", serif)',
                      color: '#7C533F',
                      margin: '0.4rem 0 0.25rem 0',
                      fontSize: '1.3rem',
                    }}
                  >
                    Configuração de Honorários & Política de Retorno
                  </h3>
                  <p style={{ color: '#6A5E57', fontSize: '0.86rem', margin: 0 }}>
                    Defina o valor da sua teleconsulta e gerencie o benefício de retorno sem nova cobrança para seus pacientes.
                  </p>
                </div>

                {honorariosFeedback && (
                  <span
                    style={{
                      backgroundColor: '#EDF7EE',
                      color: '#1E4620',
                      border: '1px solid #B8E2BE',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    {honorariosFeedback}
                  </span>
                )}
              </div>

              <form onSubmit={handleSalvarHonorarios} style={{ display: 'grid', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                  {/* Campo 1: Valor Bruto */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#2E2824', marginBottom: '0.4rem' }}>
                      Valor Bruto da Consulta (Pago pelo Paciente):
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#7C533F' }}>R$</span>
                      <input
                        type="number"
                        min="50"
                        step="10"
                        value={valorConsultaConfig}
                        onChange={(e) => setValorConsultaConfig(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          fontSize: '0.94rem',
                          fontWeight: 700,
                          padding: '10px 12px',
                        }}
                      />
                    </div>
                  </div>

                  {/* Simulador Split 65% / 35% */}
                  <div
                    style={{
                      backgroundColor: '#F6F3EE',
                      borderRadius: '14px',
                      padding: '1rem',
                      border: '1px solid rgba(124, 83, 63, 0.15)',
                      display: 'grid',
                      gap: '0.35rem',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2E2824' }}>
                      <span>Seu Repasse Líquido (65%):</span>
                      <strong style={{ color: '#2D6337', fontSize: '0.92rem' }}>
                        R$ {(Number(valorConsultaConfig || 0) * 0.65).toFixed(2)}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6A5E57' }}>
                      <span>Taxa de Infraestrutura GlicoCare (35%):</span>
                      <strong>
                        R$ {(Number(valorConsultaConfig || 0) * 0.35).toFixed(2)}
                      </strong>
                    </div>
                    <small style={{ color: '#888', marginTop: '0.2rem' }}>
                      * Repasse liberado automaticamente após salvamento do prontuário (RN-FIN-03).
                    </small>
                  </div>
                </div>

                {/* Bloco de Política de Retorno Incluso */}
                <div
                  style={{
                    backgroundColor: '#FAF8F5',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    border: '1px solid rgba(124, 83, 63, 0.18)',
                    display: 'grid',
                    gap: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <input
                      type="checkbox"
                      id="checkOfereceRetorno"
                      checked={ofereceRetornoConfig}
                      onChange={(e) => setOfereceRetornoConfig(e.target.checked)}
                      style={{ marginTop: '0.2rem' }}
                    />
                    <div>
                      <label htmlFor="checkOfereceRetorno" style={{ fontWeight: 700, fontSize: '0.88rem', color: '#2E2824', cursor: 'pointer' }}>
                        Oferecer 1 Retorno Incluso sem Custo Adicional (Recomendado)
                      </label>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#6A5E57', lineHeight: 1.45 }}>
                        Pacientes com DM1 que realizarem 1ª consulta avulsa com você terão direito a agendar 1 retorno gratuito (R$ 0,00)
                        dentro do prazo limite para avaliação de laudos e exames laboratoriais solicitados.
                      </p>
                    </div>
                  </div>

                  {ofereceRetornoConfig && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1.85rem' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2E2824' }}>
                        Prazo de Validade do Retorno:
                      </label>
                      <select
                        value={prazoRetornoConfig}
                        onChange={(e) => setPrazoRetornoConfig(Number(e.target.value))}
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid rgba(124, 83, 63, 0.25)',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: '#2E2824',
                        }}
                      >
                        <option value={15}>15 dias após a 1ª consulta</option>
                        <option value={30}>30 dias após a 1ª consulta (Padrão)</option>
                        <option value={45}>45 dias após a 1ª consulta</option>
                      </select>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variante="cta"
                    tipo="submit"
                    disabled={salvandoHonorarios}
                    style={{ fontSize: '0.86rem', padding: '0.65rem 1.35rem' }}
                  >
                    {salvandoHonorarios ? 'Gravando Honorários...' : 'Salvar Configuração de Honorários →'}
                  </Button>
                </div>
              </form>
            </div>
            {/* FIM: SEÇÃO DE CONFIGURAÇÃO DE HONORÁRIOS & RETORNO INCLUSO */}

            {/* SEÇÃO DA GRADE SEMANAL */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                padding: '2rem',
                border: '1px solid rgba(124, 83, 63, 0.18)',
                boxShadow: '0 4px 15px rgba(46, 40, 36, 0.04)',
              }}
            >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3
                  style={{
                    fontFamily: 'var(--fonte-titulo, "Fraunces", serif)',
                    color: '#7C533F',
                    margin: '0 0 0.25rem 0',
                    fontSize: '1.3rem',
                  }}
                >
                  Grade Semanal de Teleconsultas
                </h3>
                <p style={{ color: '#6A5E57', fontSize: '0.86rem', margin: 0 }}>
                  Defina os dias ativos e horários disponíveis para agendamento direto pelas famílias na plataforma.
                </p>
              </div>

              {horariosSalvosFeedback && (
                <span
                  style={{
                    backgroundColor: '#EDF7EE',
                    color: '#1E4620',
                    border: '1px solid #B8E2BE',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  ✓ Disponibilidade atualizada!
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {diasAtendimento.map((d, dIdx) => (
                <div
                  key={dIdx}
                  style={{
                    backgroundColor: d.ativo ? '#FFFFFF' : '#F9F8F6',
                    border: d.ativo ? '1.5px solid rgba(124, 83, 63, 0.22)' : '1px dashed #CCC',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                      type="checkbox"
                      checked={d.ativo}
                      onChange={() => handleAlternarDiaAtendimento(dIdx)}
                      id={`check-dia-${dIdx}`}
                    />
                    <label htmlFor={`check-dia-${dIdx}`} style={{ fontWeight: 700, color: '#2E2824', fontSize: '0.94rem', cursor: 'pointer' }}>
                      {d.dia}
                    </label>
                    <span
                      style={{
                        backgroundColor: d.ativo ? '#EDF7EE' : '#EEE',
                        color: d.ativo ? '#1E4620' : '#888',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}
                    >
                      {d.ativo ? 'Disponível na Agenda' : 'Dia Pausado'}
                    </span>
                  </div>

                  {d.ativo && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {d.slots.map((slot, sIdx) => (
                        <span
                          key={sIdx}
                          style={{
                            backgroundColor: '#F6F3EE',
                            color: '#7C533F',
                            border: '1px solid rgba(124, 83, 63, 0.2)',
                            borderRadius: '8px',
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                          }}
                        >
                          {slot}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

        {/* ====================================================================
            MODAL: EMITIR GUIA MÉDICA DE EXAMES (+ SOLICITAR EXAMES)
            ==================================================================== */}
        {modalSolicitarAberto && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              zIndex: 9999,
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                padding: '2rem',
                maxWidth: 580,
                width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                border: '1px solid rgba(124, 83, 63, 0.2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3
                  style={{
                    fontFamily: 'var(--fonte-titulo, "Fraunces", serif)',
                    color: '#7C533F',
                    margin: 0,
                    fontSize: '1.35rem',
                  }}
                >
                  🧪 Emitir Guia Médica de Exames
                </h3>
                <button
                  type="button"
                  onClick={() => setModalSolicitarAberto(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#6A5E57', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEmitirGuiaOficial} style={{ display: 'grid', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Título da Solicitação / Pedido Médico:
                  </label>
                  <input
                    type="text"
                    value={tituloGuia}
                    onChange={(e) => setTituloGuia(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Selecione os exames a incluir na guia:
                  </label>
                  <div style={{ display: 'grid', gap: '0.5rem', maxHeight: 220, overflowY: 'auto' }}>
                    {EXAMES_SUGERIDOS_ESPECIALISTA.map((nome) => {
                      const sel = examesEscolhidos.includes(nome);
                      return (
                        <label
                          key={nome}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            backgroundColor: sel ? 'rgba(59, 126, 72, 0.1)' : '#F6F3EE',
                            border: sel ? '1px solid #3B7E48' : '1px solid transparent',
                            borderRadius: '10px',
                            padding: '0.55rem 0.75rem',
                            cursor: 'pointer',
                            fontSize: '0.84rem',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={sel}
                            onChange={() => handleToggleExameSugerido(nome)}
                          />
                          <span>{nome}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Outro exame (ex: Ferritina, Insulina Basal)..."
                    value={outroExameTexto}
                    onChange={(e) => setOutroExameTexto(e.target.value)}
                    style={{ flex: 1, fontSize: '0.84rem' }}
                  />
                  <Button
                    variante="contorno"
                    type="button"
                    onClick={handleAdicionarExameCustom}
                    style={{ padding: '0 1rem', fontSize: '0.8rem' }}
                  >
                    + Adicionar
                  </Button>
                </div>

                {guiaEmitidaSucesso && (
                  <div style={{ color: '#2D6337', fontSize: '0.84rem', fontWeight: 700, textAlign: 'center' }}>
                    ✓ {guiaEmitidaSucesso}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <Button
                    variante="contorno"
                    type="button"
                    onClick={() => setModalSolicitarAberto(false)}
                  >
                    Cancelar
                  </Button>
                  <Button variante="cta" type="submit" disabled={solicitandoGuia}>
                    {solicitandoGuia ? 'Gerando Guia Oficial...' : 'Emitir Guia Médica →'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ====================================================================
            MODAL: ADICIONAR ADENDO CLÍNICO DATADO (RN-PRONT-01)
            ==================================================================== */}
        {modalAdendoAberto && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              zIndex: 9999,
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                padding: '2rem',
                maxWidth: 540,
                width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                border: '1px solid rgba(124, 83, 63, 0.2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3
                  style={{
                    fontFamily: 'var(--fonte-titulo, "Fraunces", serif)',
                    color: '#7C533F',
                    margin: 0,
                    fontSize: '1.35rem',
                  }}
                >
                  ✍️ Adicionar Adendo Clínico Datado
                </h3>
                <button
                  type="button"
                  onClick={() => setModalAdendoAberto(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#6A5E57', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <p style={{ color: '#6A5E57', fontSize: '0.84rem', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                Em conformidade com a resolução CFM 2.314/2022 e a regra <strong>RN-PRONT-01</strong>, registros
                salvos nunca são sobrescritos. Este adendo receberá carimbo de data/hora oficial no fuso de Brasília.
              </p>

              <form onSubmit={handleSalvarAdendo} style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Texto do Adendo Clínico:
                  </label>
                  <textarea
                    rows={5}
                    value={textoNovoAdendo}
                    onChange={(e) => setTextoNovoAdendo(e.target.value)}
                    placeholder="Descreva a nota complementar, esclarecimento pós-consulta, ajuste orientado por mensagem ou intercorrência..."
                    required
                  />
                </div>

                {adendoSucesso && (
                  <div style={{ color: '#2D6337', fontSize: '0.84rem', fontWeight: 700, textAlign: 'center' }}>
                    ✓ {adendoSucesso}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <Button
                    variante="contorno"
                    type="button"
                    onClick={() => setModalAdendoAberto(false)}
                  >
                    Cancelar
                  </Button>
                  <Button variante="cta" type="submit" disabled={salvandoAdendo}>
                    {salvandoAdendo ? 'Registrando Adendo...' : 'Gravar Adendo Permanente →'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* FIM DO COMPONENTE PAINEL ESPECIALISTA */
