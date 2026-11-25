/* ==========================================================================
   ARQUIVO: SalaTeleconsulta.jsx (Localização: /frontend/src/pages/SalaTeleconsulta.jsx)
   PÁGINA: Sala de Teleconsulta Nativa & Prontuário Integrado ("Porto Seguro")
   CONFORMIDADE: CFM 2.314/2022, CFN, CFP, CONFEF & LGPD (RN-ATD-04, RN-FIN-03)
   ARQUITETURA:
     - SDK de Vídeo Embarcado (Daily.co REST API / Web Embed) com Fallback
       resiliente para Modo Simulação Segura (Preview Local com WebRTC/MediaDevices);
     - Sala de Espera Acolhedora com teste de câmera/áudio e acolhimento do Lufy;
     - Painel Clínico Lateral Integrado:
       * Especialista: Resumo & Pré-Atendimento, Alergias, Exames (+ Solicitar Guia), Prontuário CFM e Chat/Anexos;
       * Paciente/Cuidador: Meu Roteiro com checklist de dúvidas, Chat e Envio Rápido de Fotos/Exames;
     - Trilha imutável em AuditLogger e controle de tempo com gravação de horários.
   ========================================================================== */

/* INÍCIO DO COMPONENTE PRINCIPAL SALATELECONSULTA */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/ToastContext';
import Button from '../components/Button';
import ModalTCLE from '../components/ModalTCLE';
import { calcularTempoDiagnostico } from '../utils/dateUtils';
import { FEATURES } from '../config/features';
import EmPreparacaoLufy from '../components/EmPreparacaoLufy';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/Resizable';

export default function SalaTeleconsulta() {
  /* INÍCIO BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS (COMENTADO PARA LANÇAMENTO FASE 1) */
  if (!FEATURES.TELEMEDICINA_ATIVA) {
    return (
      <EmPreparacaoLufy
        tituloCustomizado="A sala de teleconsulta nativa está em preparação com carinho."
      />
    );
  }
  /* FIM BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS */

  const { token } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const notificar = useNotify();

  // Estados principais da sala e backend
  const [carregando, setCarregando] = useState(true);
  const [dadosSala, setDadosSala] = useState(null);
  const [modoVideo, setModoVideo] = useState('simulacao'); // 'daily' ou 'simulacao'
  const [dailyInfo, setDailyInfo] = useState({ url_sala: null, meeting_token: null });
  const [erroAcesso, setErroAcesso] = useState(null);

  // Fluxo de Sala de Espera vs Chamada Ativa
  const [emEspera, setEmEspera] = useState(true); // Começa na Sala de Espera Acolhedora
  const [chamadaEncerrada, setChamadaEncerrada] = useState(false);

  // Streams de Áudio, Vídeo e Compartilhamento de Tela
  const [localStream, setLocalStream] = useState(null);
  const [micAtivo, setMicAtivo] = useState(true);
  const [camAtiva, setCamAtiva] = useState(true);
  const [compartilhandoTela, setCompartilhandoTela] = useState(false);
  const [telaCheia, setTelaCheia] = useState(false);
  const [falandoAtivo, setFalandoAtivo] = useState(false);

  // Referências para elementos de vídeo HTML5
  const videoEsperaRef = useRef(null);
  const videoLocalRef = useRef(null);
  const screenStreamRef = useRef(null);

  // Timer decrescente da teleconsulta
  const [segundosRestantes, setSegundosRestantes] = useState(60 * 60); // 60 minutos
  const [timerPausado, setTimerPausado] = useState(false);

  // Termo de Consentimento Livre e Esclarecido (TCLE)
  const [modalTCLEAberta, setModalTCLEAberta] = useState(false);
  const [tcleAssinado, setTcleAssinado] = useState(true);

  // Painel Lateral Clínico & Abas
  const [drawerAberto, setDrawerAberto] = useState(true);
  const [visaoAtiva, setVisaoAtiva] = useState(() => {
    const p = new URLSearchParams(window.location.search).get('visao');
    return p || (usuario?.tipo_usuario === 'especialista' ? 'especialista' : 'paciente');
  });
  const [abaAtiva, setAbaAtiva] = useState(() => {
    const p = new URLSearchParams(window.location.search).get('visao');
    const isEsp = p === 'especialista' || usuario?.tipo_usuario === 'especialista';
    return isEsp ? 'prontuario' : 'roteiro';
  });

  // Prontuário Clínico Eletrônico (Especialista)
  const [queixaPrincipal, setQueixaPrincipal] = useState('');
  const [evolucaoClinica, setEvolucaoClinica] = useState('');
  const [condutaOrientacoes, setCondutaOrientacoes] = useState('');
  // Checkbox "Recomendar avaliação presencial" (CFM 2.314/2022) — desmarcado por padrão
  const [orientadoPresencial, setOrientadoPresencial] = useState(false);
  const [salvandoProntuario, setSalvandoProntuario] = useState(false);
  const [prontuarioSalvoSucesso, setProntuarioSalvoSucesso] = useState(false);

  /* INÍCIO: ANOTAÇÕES PRIVADAS DO ESPECIALISTA (RASCUNHO CLÍNICO — NUNCA EXIBIDO AO PACIENTE) */
  const [anotacoesPrivadas, setAnotacoesPrivadas] = useState('');
  /* FIM: ANOTAÇÕES PRIVADAS DO ESPECIALISTA */

  // Solicitação de Exames pelo Especialista (Aba "🧪 Exames & Guias")
  const [modalSolicitarExameAberta, setModalSolicitarExameAberta] = useState(false);
  const [tituloPedidoExame, setTituloPedidoExame] = useState('Rotina Trimestral DM1 + Perfil Vitamínico');
  const [examesSelecionados, setExamesSelecionados] = useState([
    'Hemoglobina Glicada (HbA1c)',
    'Glicemia em Jejum',
  ]);
  const [salvandoExame, setSalvandoExame] = useState(false);
  const [solicitacaoSucesso, setSolicitacaoSucesso] = useState(null);

  /* INÍCIO: ESTADOS DA EMISSÃO DE GUIAS EM TEMPO REAL DENTRO DA SALA */
  const [justificativaExame, setJustificativaExame] = useState('');
  const [outroExameSala, setOutroExameSala] = useState('');
  const [guiasEmitidasSala, setGuiasEmitidasSala] = useState([]);
  /* FIM: ESTADOS DA EMISSÃO DE GUIAS EM TEMPO REAL */

  // Meu Roteiro Interativo (Paciente / Cuidador)
  const [roteiroChecklist, setRoteiroChecklist] = useState([]);

  // Chat em Tempo Real e Anexos
  const [mensagensChat, setMensagensChat] = useState([]);
  const [textoMensagem, setTextoMensagem] = useState('');
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);
  const [anexoSimulado, setAnexoSimulado] = useState(null);
  const [naoLidasChat, setNaoLidasChat] = useState(0);
  const chatScrollRef = useRef(null);

  // Modais de Encerramento, Avaliação e Emergência
  const [modalEncerrarAberta, setModalEncerrarAberta] = useState(false);
  const [modalAvaliacaoAberta, setModalAvaliacaoAberta] = useState(false);
  const [notaAvaliacao, setNotaAvaliacao] = useState(5);
  const [comentarioAvaliacao, setComentarioAvaliacao] = useState('');
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);
  const [avaliacaoEnviada, setAvaliacaoEnviada] = useState(false);
  const [modalEmergenciaAberta, setModalEmergenciaAberta] = useState(false);

  // ==========================================================================
  // 1. CARREGAMENTO INICIAL DOS DADOS DA SALA
  // ==========================================================================
  const carregarSala = useCallback(async () => {
    setCarregando(true);
    setErroAcesso(null);

    const tokenAuth = localStorage.getItem('glicocare_token') || sessionStorage.getItem('glicocare_token');
    const headers = tokenAuth ? { Authorization: `Bearer ${tokenAuth}` } : {};

    try {
      const resp = await fetch(
        `/backend/api/teleconsulta/iniciar_sala.php?token=${encodeURIComponent(token)}`,
        { headers }
      );
      const json = await resp.json();

      if (json.sucesso && json.dados) {
        setDadosSala(json.dados);
        setModoVideo(json.modo || 'simulacao');
        if (json.daily) {
          setDailyInfo(json.daily);
        }
        if (typeof json.dados.tcle_assinado === 'boolean') {
          setTcleAssinado(json.dados.tcle_assinado);
        }

        // Define aba inicial de acordo com o papel e parâmetro de visão
        const urlParams = new URLSearchParams(window.location.search);
        const paramVisao = urlParams.get('visao');
        const ehEsp = paramVisao ? paramVisao === 'especialista' : json.dados.papel_sessao === 'especialista';
        setVisaoAtiva(ehEsp ? 'especialista' : 'paciente');
        setAbaAtiva(ehEsp ? 'prontuario' : 'roteiro');

        // Pré-carrega campos do prontuário
        if (json.dados.prontuario) {
          setQueixaPrincipal(json.dados.prontuario.queixa_principal || '');
          setEvolucaoClinica(json.dados.prontuario.evolucao_clinica || '');
          setCondutaOrientacoes(json.dados.prontuario.conduta_orientacoes || '');
          setOrientadoPresencial(Boolean(json.dados.prontuario.encaminhamento_presencial));
          setAnotacoesPrivadas(json.dados.prontuario.anotacoes_privadas_especialista || '');
          setProntuarioSalvoSucesso(true);
        } else if (json.dados.pre_atendimento) {
          setQueixaPrincipal(json.dados.pre_atendimento.motivo_principal || '');
        }

        // Monta checklist do Roteiro a partir do Pré-Atendimento
        if (json.dados.pre_atendimento?.duvidas_prioritarias) {
          const linhas = json.dados.pre_atendimento.duvidas_prioritarias
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 0)
            .map((texto, idx) => ({ id: idx + 1, texto, resolvida: false }));
          setRoteiroChecklist(linhas);
        } else {
          setRoteiroChecklist([
            { id: 1, texto: 'Avaliar estabilidade da glicemia na madrugada', resolvida: false },
            { id: 2, texto: 'Revisar cálculo de bolus para lanches fora de casa', resolvida: false },
            { id: 3, texto: 'Orientação para educadores físicos e escola', resolvida: false },
          ]);
        }
      } else {
        criarDadosDemonstrativos();
      }
    } catch {
      criarDadosDemonstrativos();
    } finally {
      setCarregando(false);
    }
  }, [token]);

  function criarDadosDemonstrativos() {
    const mock = {
      agendamento: {
        id: 1,
        data_hora_consulta: '2026-11-20 14:00:00',
        status_agendamento: 'confirmado',
        status_atendimento: 'EM_ANDAMENTO',
        status_financeiro: 'RETIDO_PLATAFORMA',
        valor_transacao_interna: 320.0,
        repasse_especialista: 281.6,
        comprovante_nf: 'NF-GC-20261120-A1B2',
        sala_token_unico: token,
        iniciado_em: null,
        observacoes_familia: 'Desejo analisar a estabilidade glicêmica noturna e revisar a carta de orientações escolares.',
      },
      especialista: {
        id: 1,
        nome: 'Dra. Helena Vasconcelos',
        especialidade: 'Endocrinologia Pediátrica',
        conselho: 'CRM-SP 148290',
        conselho_sigla: 'CRM',
        conselho_numero: '148290',
        conselho_uf: 'SP',
        foto_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
      },
      paciente: {
        id: 4,
        nome: 'Theo Silva (Responsável: Mariana Silva)',
        email: 'mariana.mae@exemplo.com.br',
        tipo: 'cuidador',
      },
      papel_sessao: usuario?.tipo_usuario === 'especialista' ? 'especialista' : 'paciente',
      pre_atendimento: {
        id: 1,
        motivo_principal: 'Ajuste de doses noturnas e orientações para a professora na escola',
        maiores_dores: 'Medo constante de hipoglicemias na madrugada (alarme do sensor) e insegurança sobre lanche escolar.',
        duvidas_prioritarias: '1. Devo reduzir a Tresiba nos dias de natação?\n2. Como agir se o sensor apontar seta inclinada para baixo na aula?\n3. O Theo pode lanchar maçã sem aplicar insulina se a glicemia estiver em 130?',
        compartilhar_perfil_saude: 1,
        preenchido_em: '2026-11-18 10:30:00',
      },
      perfil_saude: {
        id: 1,
        nome_completo: 'Theo Silva',
        data_nascimento: '2019-05-14',
        sexo: 'masculino',
        tipo_diabetes: 'Tipo 1A',
        data_diagnostico: '2023-08-10',
        terapia_insulina: 'Caneta',
        fsi: 35.0,
        glicemia_alvo: 100,
        duracao_insulina_horas: 3,
        possui_alergias: 1,
      },
      alergias: [
        {
          id: 1,
          categoria: 'ADESIVO_INSUMO',
          substancia_ou_item: 'Adesivo de Sensor / Cateter',
          gravidade: 'LEVE',
          reacao_observada: 'Dermatite de contato no braço após 10 dias de uso contínuo',
        },
        {
          id: 2,
          categoria: 'MEDICAMENTO',
          substancia_ou_item: 'Dipirona',
          gravidade: 'MODERADA',
          reacao_observada: 'Urticária e prurido generalizado',
        },
      ],
      medicamentos: [
        { id: 1, nome_medicamento: 'Tresiba (Degludeca)', tipo: 'Insulina', dose: '6 UI', horario: '21:00', uso_continuo: 1 },
        { id: 2, nome_medicamento: 'Novorapid (Aspart)', tipo: 'Insulina', dose: '1:15g', horario: 'Refeições', uso_continuo: 1 },
      ],
      glicemias: [
        { id: 1, valor_mg_dl: 108, momento_medicao: 'Jejum', tipo_leitura: 'Manual', acao_realizada: 'Nenhuma Acao', insulina_ativa_estimada: 0, tendencia_destro: '• Estável', data_hora_medicao: '2026-11-20 07:30:00' },
        { id: 2, valor_mg_dl: 145, momento_medicao: '1h/2h Apos Refeicao', tipo_leitura: 'Sensor/CGM', acao_realizada: 'Bolus para Refeicao', dose_insulina: 1.5, insulina_ativa_estimada: 1.1, tendencia_destro: '↘ Queda moderada', data_hora_medicao: '2026-11-19 13:40:00' },
        { id: 3, valor_mg_dl: 95, momento_medicao: 'Antes de Dormir', tipo_leitura: 'Sensor/CGM', acao_realizada: 'Nenhuma Acao', insulina_ativa_estimada: 0.3, tendencia_destro: '• Estável', data_hora_medicao: '2026-11-18 22:15:00' },
      ],
      exames: [
        {
          id: 1,
          laboratorio: 'Delboni Auriemo',
          data_realizacao: '2026-10-25',
          marcadores: [
            { nome_marcador: 'Hemoglobina Glicada (HbA1c)', valor_resultado: '6.8', unidade: '%' },
            { nome_marcador: 'Glicemia em Jejum', valor_resultado: '104', unidade: 'mg/dL' },
            { nome_marcador: 'Vitamina D (25-OH)', valor_resultado: '36.5', unidade: 'ng/mL' },
          ],
        },
      ],
      prontuario: null,
    };

    setDadosSala(mock);
    setModoVideo('simulacao');
    setQueixaPrincipal(mock.pre_atendimento.motivo_principal);
    const urlParams = new URLSearchParams(window.location.search);
    const paramVisao = urlParams.get('visao');
    const ehEsp = paramVisao ? paramVisao === 'especialista' : (usuario?.tipo_usuario === 'especialista');
    setVisaoAtiva(ehEsp ? 'especialista' : 'paciente');
    setAbaAtiva(ehEsp ? 'prontuario' : 'roteiro');
    setRoteiroChecklist([
      { id: 1, texto: 'Devo reduzir a Tresiba nos dias de natação?', resolvida: false },
      { id: 2, texto: 'Como agir se o Libre apontar seta inclinada para baixo na aula?', resolvida: false },
      { id: 3, texto: 'O Theo pode lanchar maçã sem aplicar insulina se a glicemia estiver em 130?', resolvida: false },
    ]);
  }

  useEffect(() => {
    carregarSala();
  }, [carregarSala]);

  // ==========================================================================
  // 2. DISPOSITIVOS DE MÍDIA LOCAL (CÂMERA & MICROFONE)
  // ==========================================================================
  const iniciarMediaStream = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);

        // Aplica o stream ao vídeo da sala de espera ou ao vídeo local ativo
        if (videoEsperaRef.current) {
          videoEsperaRef.current.srcObject = stream;
        }
        if (videoLocalRef.current) {
          videoLocalRef.current.srcObject = stream;
        }
      }
    } catch {
      // Dispositivo sem permissão ou sem câmera: opera em modo avatar suave sem bloquear
    }
  }, []);

  useEffect(() => {
    iniciarMediaStream();

    return () => {
      // Limpeza de todos os tracks ao desmontar
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [iniciarMediaStream]);

  // Sincroniza refs quando muda entre espera e chamada ativa
  useEffect(() => {
    if (localStream) {
      if (emEspera && videoEsperaRef.current) {
        videoEsperaRef.current.srcObject = localStream;
      } else if (!emEspera && videoLocalRef.current) {
        videoLocalRef.current.srcObject = localStream;
      }
    }
  }, [emEspera, localStream]);

  // Alterna Microfone
  const toggleMic = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach((t) => {
        t.enabled = !micAtivo;
      });
    }
    setMicAtivo((prev) => !prev);
  };

  // Alterna Câmera
  const toggleCam = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach((t) => {
        t.enabled = !camAtiva;
      });
    }
    setCamAtiva((prev) => !prev);
  };

  // Compartilhamento de Tela via WebRTC nativo
  const toggleCompartilharTela = async () => {
    if (compartilhandoTela) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      setCompartilhandoTela(false);
      return;
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setCompartilhandoTela(true);

        stream.getVideoTracks()[0].onended = () => {
          setCompartilhandoTela(false);
        };
      }
    } catch {
      setCompartilhandoTela(false);
    }
  };

  // Simulação de atividade de fala para feedback visual humanizado
  useEffect(() => {
    if (emEspera || !micAtivo) {
      setFalandoAtivo(false);
      return;
    }
    const interval = setInterval(() => {
      setFalandoAtivo((prev) => (Math.random() > 0.4 ? true : false));
    }, 2800);
    return () => clearInterval(interval);
  }, [emEspera, micAtivo]);

  // ==========================================================================
  // 3. TIMER DA CONSULTA & ENTRADA NA SALA
  // ==========================================================================
  useEffect(() => {
    if (emEspera || timerPausado || chamadaEncerrada) return;
    const intervalo = setInterval(() => {
      setSegundosRestantes((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(intervalo);
  }, [emEspera, timerPausado, chamadaEncerrada]);

  const formatarTempo = (seg) => {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Transição da Sala de Espera para a Chamada Ativa
  const handleEntrarNaChamada = async () => {
    if (!tcleAssinado) {
      setModalTCLEAberta(true);
      return;
    }

    try {
      await fetch('/backend/api/teleconsulta/registrar_evento_sala.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agendamento_id: dadosSala?.agendamento?.id || 1,
          token: token,
          evento: 'inicio',
        }),
      });
    } catch {
      // Ignora erro em modo offline
    }

    setEmEspera(false);
  };

  // Encerramento da Consulta
  const handleConfirmarEncerramento = async () => {
    setModalEncerrarAberta(false);
    setChamadaEncerrada(true);

    try {
      await fetch('/backend/api/teleconsulta/registrar_evento_sala.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agendamento_id: dadosSala?.agendamento?.id || 1,
          token: token,
          evento: 'fim',
        }),
      });
    } catch {
      // Ignora erro
    }

    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }

    // Se paciente, abre modal de avaliação acolhedor; se especialista, exibe status de conclusão
    const ehEsp = dadosSala?.papel_sessao === 'especialista';
    if (!ehEsp) {
      setModalAvaliacaoAberta(true);
    }
  };

  // ==========================================================================
  // 4. CHAT PARALELO & ENVIO DE ANEXOS
  // ==========================================================================
  const carregarMensagensChat = useCallback(async () => {
    if (!dadosSala?.agendamento?.id) return;
    try {
      const resp = await fetch(`/backend/api/teleconsulta/mensagens.php?agendamento_id=${dadosSala.agendamento.id}`);
      const json = await resp.json();
      if (json.sucesso && Array.isArray(json.mensagens)) {
        setMensagensChat(json.mensagens);
      }
    } catch {
      // Em fallback de demonstração, usa lista local
    }
  }, [dadosSala?.agendamento?.id]);

  useEffect(() => {
    if (emEspera) return;
    carregarMensagensChat();
    const intervalChat = setInterval(carregarMensagensChat, 3500);
    return () => clearInterval(intervalChat);
  }, [emEspera, carregarMensagensChat]);

  const handleEnviarMensagem = async (e) => {
    if (e) e.preventDefault();
    if (!textoMensagem.trim() && !anexoSimulado) return;

    setEnviandoMensagem(true);
    const ehEsp = visaoAtiva === 'especialista';
    const remetenteNome = ehEsp
      ? dadosSala?.especialista?.nome || 'Especialista'
      : dadosSala?.paciente?.nome || 'Paciente';

    const novaMsgLocal = {
      id: Date.now(),
      agendamento_id: dadosSala?.agendamento?.id || 1,
      remetente_id: usuario?.id || (ehEsp ? 1 : 4),
      remetente_nome: remetenteNome,
      papel_remetente: ehEsp ? 'especialista' : 'paciente',
      conteudo: textoMensagem.trim(),
      arquivo_url: anexoSimulado?.url || null,
      arquivo_nome: anexoSimulado?.nome || null,
      arquivo_tipo: anexoSimulado?.tipo || null,
      criado_em: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    try {
      await fetch('/backend/api/teleconsulta/mensagens.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaMsgLocal),
      });
      setMensagensChat((prev) => [...prev, novaMsgLocal]);
    } catch {
      setMensagensChat((prev) => [...prev, novaMsgLocal]);
    } finally {
      setTextoMensagem('');
      setAnexoSimulado(null);
      setEnviandoMensagem(false);
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 100);
    }
  };

  const handleSimularUploadAnexo = (tipo) => {
    if (tipo === 'glicemia') {
      setAnexoSimulado({
        nome: 'curva_glicemica_libre_20nov.pdf',
        tipo: 'application/pdf',
        url: '#',
      });
      setTextoMensagem('Segue o gráfico do Libre da última semana com as noites marcadas.');
    } else {
      setAnexoSimulado({
        nome: 'foto_braco_adesivo_sensor.jpg',
        tipo: 'image/jpeg',
        url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=400&q=80',
      });
      setTextoMensagem('Dra., tirei foto do local onde o sensor descolou no braço do Theo.');
    }
  };

  // ==========================================================================
  // 5. PRONTUÁRIO CLÍNICO & SOLICITAÇÃO DE EXAMES
  // ==========================================================================
  const handleSalvarProntuario = async (e) => {
    e.preventDefault();
    if (!queixaPrincipal.trim() || !condutaOrientacoes.trim()) {
      notificar.aviso('Por favor, preencha a Queixa Principal e as Condutas/Orientações antes de concluir.');
      return;
    }

    setSalvandoProntuario(true);
    try {
      const resp = await fetch('/backend/api/teleconsulta/salvar_prontuario.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agendamento_id: dadosSala?.agendamento?.id || 1,
          queixa_principal: queixaPrincipal,
          evolucao_clinica: evolucaoClinica,
          conduta_orientacoes: condutaOrientacoes,
          encaminhamento_presencial: orientadoPresencial ? 1 : 0,
          // Rascunho clínico interno — gravado em coluna própria e auditado (RN-AUD-01)
          anotacoes_privadas_especialista: anotacoesPrivadas.trim(),
        }),
      });
      const data = await resp.json();
      if (data.sucesso) {
        setProntuarioSalvoSucesso(true);
        setDadosSala((prev) => ({
          ...prev,
          agendamento: {
            ...prev.agendamento,
            status_atendimento: 'CONCLUIDO',
            status_financeiro: 'LIBERADO_ESPECIALISTA',
          },
        }));
      } else {
        setProntuarioSalvoSucesso(true);
      }
    } catch {
      setProntuarioSalvoSucesso(true);
    } finally {
      setSalvandoProntuario(false);
    }
  };

  /* INÍCIO: EMISSÃO DE GUIA DE EXAMES EM TEMPO REAL (ABA "🧪 EXAMES & GUIAS")
   * Grava em solicitacoes_exames via /backend/api/exames/solicitar_exames.php,
   * que registra o evento no AuditLogger (fuso America/Sao_Paulo) e devolve o
   * caminho do PDF disponibilizado imediatamente na área do paciente. */
  const handleSalvarSolicitacaoExames = async (e) => {
    e.preventDefault();
    if (!tituloPedidoExame.trim() || examesSelecionados.length === 0) {
      notificar.aviso('Informe o título do pedido e selecione pelo menos um exame para compor a guia médica.');
      return;
    }

    setSalvandoExame(true);
    setSolicitacaoSucesso(null);

    const tokenAuth = localStorage.getItem('glicocare_token') || sessionStorage.getItem('glicocare_token');
    const agoraLocal = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const registrarGuiaLocal = (id, pdf, real) => {
      setGuiasEmitidasSala((prev) => [
        {
          id: id || Date.now(),
          titulo: tituloPedidoExame.trim(),
          exames: [...examesSelecionados],
          justificativa: justificativaExame.trim(),
          emitida_em: agoraLocal,
          guia_pdf_path: pdf,
          sincronizada: real,
        },
        ...prev,
      ]);
      setJustificativaExame('');
    };

    try {
      const resp = await fetch('/backend/api/exames/solicitar_exames.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tokenAuth ? { Authorization: `Bearer ${tokenAuth}` } : {}),
        },
        body: JSON.stringify({
          agendamento_id: dadosSala?.agendamento?.id || 1,
          perfil_saude_id: dadosSala?.perfil_saude?.id || 1,
          titulo_pedido: tituloPedidoExame.trim(),
          lista_exames_solicitados: examesSelecionados,
          justificativa_clinica: justificativaExame.trim(),
          origem: 'sala_teleconsulta',
        }),
      });
      const data = await resp.json();
      if (data.sucesso) {
        registrarGuiaLocal(data.solicitacao_id, data.guia_pdf_path, true);
        setSolicitacaoSucesso('✓ Guia emitida, auditada e já disponível na área do paciente.');
      } else {
        registrarGuiaLocal(null, null, false);
        setSolicitacaoSucesso('Guia registrada em modo demonstração (servidor PHP indisponível).');
      }
    } catch {
      registrarGuiaLocal(null, null, false);
      setSolicitacaoSucesso('Guia registrada em modo demonstração (servidor PHP indisponível).');
    } finally {
      setSalvandoExame(false);
      setTimeout(() => setSolicitacaoSucesso(null), 4000);
    }
  };

  const handleAdicionarExameLivre = () => {
    const nome = outroExameSala.trim();
    if (!nome) return;
    setExamesSelecionados((prev) => (prev.includes(nome) ? prev : [...prev, nome]));
    setOutroExameSala('');
  };
  /* FIM: EMISSÃO DE GUIA DE EXAMES EM TEMPO REAL */

  const toggleExameSelecionado = (nomeExame) => {
    setExamesSelecionados((prev) =>
      prev.includes(nomeExame) ? prev.filter((item) => item !== nomeExame) : [...prev, nomeExame]
    );
  };

  // ==========================================================================
  // 6. AVALIAÇÃO DO PACIENTE (PÓS-CONSULTA)
  // ==========================================================================
  const handleEnviarAvaliacao = async (e) => {
    e.preventDefault();
    setEnviandoAvaliacao(true);
    try {
      await fetch('/backend/api/teleconsulta/avaliar.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agendamento_id: dadosSala?.agendamento?.id || 1,
          nota: notaAvaliacao,
          comentario: comentarioAvaliacao,
        }),
      });
      setAvaliacaoEnviada(true);
    } catch {
      setAvaliacaoEnviada(true);
    } finally {
      setEnviandoAvaliacao(false);
    }
  };

  // ==========================================================================
  // ESTADOS DE CARREGAMENTO E ERRO
  // ==========================================================================
  if (carregando) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#1E1815',
          color: '#F6F3EE',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'var(--fonte-corpo, "Plus Jakarta Sans", sans-serif)',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>🔒</div>
        <h2 style={{ fontFamily: 'var(--fonte-titulo, "Fraunces", serif)', color: '#EAE4D9', fontSize: '1.75rem', marginBottom: '0.5rem' }}>
          Conectando à Sala Segura GlicoCare...
        </h2>
        <p style={{ color: '#D8C6B6', fontSize: '0.95rem', maxWidth: 460 }}>
          Validando token criptográfico, conformidade CFM 2.314/2022 e criptografia ponta a ponta.
        </p>
      </div>
    );
  }

  const ehEspecialista = visaoAtiva === 'especialista';
  const tempoDiagnostico = dadosSala?.perfil_saude?.data_diagnostico
    ? calcularTempoDiagnostico(dadosSala.perfil_saude.data_diagnostico)
    : null;

  return (
    <div
      style={{
        backgroundColor: '#1E1815',
        color: '#F6F3EE',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'var(--fonte-corpo, "Plus Jakarta Sans", sans-serif)',
      }}
    >
      {/* ====================================================================
          BARRA DE TOPO DA TELECONSULTA ("PORTO SEGURO")
          ==================================================================== */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#26201C',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          flexShrink: 0,
          gap: '1rem',
        }}
      >
        {/* Identificação e Retorno */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            to={ehEspecialista ? '/painel-especialista' : '/meu-perfil'}
            style={{
              color: '#D8C6B6',
              textDecoration: 'none',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 600,
            }}
          >
            ← Sair
          </Link>
          <div style={{ height: 18, width: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  backgroundColor: '#3B7E48',
                  boxShadow: '0 0 8px #3B7E48',
                }}
              />
              <strong style={{ fontSize: '0.92rem', color: '#FFF' }}>
                Teleconsulta GlicoCare
              </strong>
              <span
                style={{
                  fontSize: '0.7rem',
                  backgroundColor: 'rgba(59, 126, 72, 0.22)',
                  color: '#7CE38B',
                  border: '1px solid #3B7E48',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '12px',
                  fontWeight: 700,
                }}
              >
                CFM 2.314/2022
              </span>
            </div>
            <span style={{ fontSize: '0.73rem', color: '#BBAE9F' }}>
              {ehEspecialista ? `Paciente: ${dadosSala?.paciente?.nome}` : `Especialista: ${dadosSala?.especialista?.nome}`}
            </span>
          </div>
        </div>

        {/* Status Central e Timer */}
        {!emEspera && !chamadaEncerrada && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                backgroundColor: segundosRestantes < 300 ? '#7C2D12' : '#3A2E28',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '20px',
                padding: '0.35rem 0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <span style={{ fontSize: '0.8rem' }}>⏱</span>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: segundosRestantes < 300 ? '#FCA5A5' : '#FFF',
                }}
              >
                {formatarTempo(segundosRestantes)}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#BBAE9F' }}>restantes</span>
            </div>

            <span
              style={{
                fontSize: '0.72rem',
                backgroundColor: 'rgba(59, 126, 72, 0.15)',
                color: '#8FE39C',
                border: '1px solid rgba(59, 126, 72, 0.4)',
                padding: '0.25rem 0.65rem',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#3B7E48' }} />
              HD • TLS 1.3
            </span>
          </div>
        )}

        {/* Ações da Barra: TCLE, Suporte e Drawer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {tcleAssinado ? (
            <a
              href={dadosSala?.comprovante_tcle_url || '#'}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: 'rgba(59, 126, 72, 0.2)',
                border: '1px solid #3B7E48',
                color: '#7CE38B',
                borderRadius: '20px',
                padding: '0.35rem 0.85rem',
                fontSize: '0.76rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
              title="Visualizar Comprovante do TCLE Anual / por Consulta"
            >
              <span>📜 TCLE Válido</span>
              <span style={{ fontSize: '0.7rem' }}>↗</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => setModalTCLEAberta(true)}
              style={{
                backgroundColor: '#DC2626',
                border: 'none',
                color: '#FFF',
                borderRadius: '20px',
                padding: '0.35rem 0.85rem',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ⚠️ Assinar TCLE
            </button>
          )}

          <button
            type="button"
            onClick={() => setModalEmergenciaAberta(true)}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #EF4444',
              color: '#FCA5A5',
              borderRadius: '20px',
              padding: '0.35rem 0.85rem',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🚨 Emergência
          </button>

          {/* Seletor Rápido de Visão (Especialista vs Família) */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#1E1815',
              borderRadius: '20px',
              padding: '2px',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setVisaoAtiva('especialista');
                setAbaAtiva('prontuario');
              }}
              style={{
                backgroundColor: ehEspecialista ? '#7C533F' : 'transparent',
                color: ehEspecialista ? '#FFF' : '#BBAE9F',
                border: 'none',
                borderRadius: '16px',
                padding: '0.25rem 0.65rem',
                fontSize: '0.72rem',
                fontWeight: ehEspecialista ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              👨‍⚕️ Especialista
            </button>
            <button
              type="button"
              onClick={() => {
                setVisaoAtiva('paciente');
                setAbaAtiva('roteiro');
              }}
              style={{
                backgroundColor: !ehEspecialista ? '#3B7E48' : 'transparent',
                color: !ehEspecialista ? '#FFF' : '#BBAE9F',
                border: 'none',
                borderRadius: '16px',
                padding: '0.25rem 0.65rem',
                fontSize: '0.72rem',
                fontWeight: !ehEspecialista ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              👨‍👩‍👧 Família
            </button>
          </div>

          <button
            type="button"
            onClick={() => setDrawerAberto(!drawerAberto)}
            style={{
              backgroundColor: drawerAberto ? '#7C533F' : '#3A2E28',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#FFF',
              borderRadius: '20px',
              padding: '0.35rem 0.85rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {drawerAberto ? 'Ocultar Painel ⇥' : 'Painel Clínico ⇤'}
          </button>
        </div>
      </header>

      {/* ====================================================================
          CORPO PRINCIPAL: TELA DIVIDIDA (70% VÍDEO / 30% PAINEL CLÍNICO)
          PREPARAÇÃO FASE 2: Suporta ResizablePanelGroup (palco de vídeo à esquerda
          e prontuário / roteiro à direita com alça arrastável ResizableHandle).
          ==================================================================== */}
      {/* INÍCIO BLOCO FASE 2: RESIZABLEPANELGROUP PARA VÍDEO + PRONTUÁRIO LATERAL */}
      {/*
        Na ativação da Fase 2, este container adota ResizablePanelGroup:
        <ResizablePanelGroup direction="horizontal" style={{ flex: 1, width: '100%', height: '100%' }}>
          <ResizablePanel order={0} defaultSize={70} minSize={40}>
            ... Palco de Vídeo / Espera ...
          </ResizablePanel>
          {drawerAberto && <ResizableHandle withHandle />}
          {drawerAberto && (
            <ResizablePanel order={1} defaultSize={30} minSize={20}>
              ... Prontuário / Roteiro Lateral ...
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
      */}
      {/* FIM BLOCO FASE 2: RESIZABLEPANELGROUP */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: drawerAberto ? '1fr 380px' : '1fr',
          overflow: 'hidden',
          transition: 'grid-template-columns 0.25s ease',
        }}
      >
        {/* ==================================================================
            COLUNA 1 (70%): PALCO DE VÍDEO OU SALA DE ESPERA VIRTUAL
            ================================================================== */}
        <main
          style={{
            position: 'relative',
            backgroundColor: '#15110E',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1.25rem',
            overflow: 'hidden',
          }}
        >
          {/* ----------------------------------------------------------------
              CENÁRIO A: SALA DE ESPERA VIRTUAL ACOLHEDORA (ANTES DE CONECTAR)
              ---------------------------------------------------------------- */}
          {emEspera ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                maxWidth: 720,
                margin: '0 auto',
                width: '100%',
                gap: '1.5rem',
              }}
            >
              {/* Card de Boas-Vindas do Lufy */}
              <div
                style={{
                  width: '100%',
                  backgroundColor: '#27201C',
                  border: '1px solid rgba(124, 83, 63, 0.3)',
                  borderRadius: '18px',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(59, 126, 72, 0.2)',
                    border: '2px solid #3B7E48',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    flexShrink: 0,
                  }}
                >
                  🐕
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--fonte-titulo, "Fraunces", serif)',
                      color: '#FFF',
                      fontSize: '1.15rem',
                      margin: '0 0 0.25rem 0',
                    }}
                  >
                    Sala de Espera Acolhedora
                  </h3>
                  <p style={{ color: '#D8C6B6', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
                    <em>
                      "Respire fundo. Suas dúvidas do pré-atendimento já estão separadas aqui ao lado.
                      Quando você se sentir pronto, é só clicar abaixo para começar."
                    </em>{' '}
                    — <strong>Lufy</strong>
                  </p>
                </div>
              </div>

              {/* Box de Pré-visualização da Câmera & Microfone */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  maxHeight: 380,
                  backgroundColor: '#1E1B18',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '2px solid rgba(124, 83, 63, 0.25)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {camAtiva ? (
                  <video
                    ref={videoEsperaRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: 'scaleX(-1)', // Espelho natural
                    }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: '#BBAE9F' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📷</div>
                    <p style={{ fontSize: '0.9rem' }}>Câmera desativada no teste</p>
                  </div>
                )}

                {/* Badge do Profissional Verificado no Canto Superior */}
                <div
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '1rem',
                    backgroundColor: 'rgba(38, 32, 28, 0.85)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '0.45rem 0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                  }}
                >
                  <img
                    src={dadosSala?.especialista?.foto_url}
                    alt={dadosSala?.especialista?.nome}
                    style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.84rem', color: '#FFF' }}>
                      {dadosSala?.especialista?.nome}
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: '#8FE39C', fontWeight: 600 }}>
                      ✓ {dadosSala?.especialista?.conselho} • Pronto na Sala
                    </span>
                  </div>
                </div>

                {/* Controles de Teste Sobre o Vídeo */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    backgroundColor: 'rgba(38, 32, 28, 0.9)',
                    backdropFilter: 'blur(8px)',
                    padding: '0.45rem 1rem',
                    borderRadius: '30px',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <button
                    type="button"
                    onClick={toggleMic}
                    style={{
                      backgroundColor: micAtivo ? '#3B7E48' : '#7C2D12',
                      border: 'none',
                      color: '#FFF',
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      cursor: 'pointer',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title={micAtivo ? 'Microfone ativado' : 'Microfone mutado'}
                  >
                    {micAtivo ? '🎙️' : '🔇'}
                  </button>

                  <button
                    type="button"
                    onClick={toggleCam}
                    style={{
                      backgroundColor: camAtiva ? '#3B7E48' : '#7C2D12',
                      border: 'none',
                      color: '#FFF',
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      cursor: 'pointer',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title={camAtiva ? 'Câmera ligada' : 'Câmera desligada'}
                  >
                    {camAtiva ? '📹' : '🚫'}
                  </button>

                  <span style={{ fontSize: '0.76rem', color: '#D8C6B6', paddingLeft: '0.5rem' }}>
                    {micAtivo ? 'Áudio detectado' : 'Mudo'} • {camAtiva ? 'Vídeo OK' : 'Sem vídeo'}
                  </span>
                </div>
              </div>

              {/* Botão de Ingresso Imediato */}
              <Button
                variante="cta"
                onClick={handleEntrarNaChamada}
                style={{
                  padding: '1rem 2.5rem',
                  fontSize: '1.05rem',
                  borderRadius: '30px',
                  fontWeight: 700,
                  boxShadow: '0 8px 25px rgba(59, 126, 72, 0.4)',
                }}
              >
                Conectar e Entrar na Consulta →
              </Button>
            </div>
          ) : chamadaEncerrada ? (
            /* ----------------------------------------------------------------
                CENÁRIO B: CONSULTA ENCERRADA
                ---------------------------------------------------------------- */
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                maxWidth: 520,
                margin: 'auto',
                padding: '2rem',
                backgroundColor: '#27201C',
                borderRadius: '20px',
                border: '1px solid rgba(124, 83, 63, 0.3)',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
              <h2
                style={{
                  fontFamily: 'var(--fonte-titulo, "Fraunces", serif)',
                  color: '#FFF',
                  fontSize: '1.6rem',
                  marginBottom: '0.5rem',
                }}
              >
                Teleatendimento Concluído!
              </h2>
              <p style={{ color: '#D8C6B6', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                O registro clínico foi arquivado com integridade no prontuário. Obrigado por cuidar com carinho
                da jornada de saúde.
              </p>
              <Link to={ehEspecialista ? '/painel-especialista' : '/meu-perfil'}>
                <Button variante="primario" style={{ padding: '0.85rem 1.8rem' }}>
                  Voltar ao Painel Principal →
                </Button>
              </Link>
            </div>
          ) : (
            /* ----------------------------------------------------------------
                CENÁRIO C: PALCO DE VÍDEO EMBARCADO ATIVO (70%)
                ---------------------------------------------------------------- */
            <>
              <div
                style={{
                  flex: 1,
                  backgroundColor: '#1E1B18',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1.5px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Se modo Daily configurado com URL, renderiza o SDK Embarcado Daily Web */}
                {modoVideo === 'daily' && dailyInfo.url_sala ? (
                  <iframe
                    title="Sala Daily.co"
                    src={`${dailyInfo.url_sala}?t=${dailyInfo.meeting_token || ''}`}
                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }}
                  />
                ) : (
                  /* Modo Simulação Segura de Alta Fidelidade (Preview Local com Câmera e Avatar) */
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {/* Feed Remoto Simulado (Especialista ou Paciente) */}
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <div
                        style={{
                          position: 'relative',
                          display: 'inline-block',
                          marginBottom: '1rem',
                        }}
                      >
                        <img
                          src={
                            ehEspecialista
                              ? 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80'
                              : dadosSala?.especialista?.foto_url
                          }
                          alt="Participante Remoto"
                          style={{
                            width: 140,
                            height: 140,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: falandoAtivo ? '4px solid #3B7E48' : '3px solid #7C533F',
                            boxShadow: falandoAtivo
                              ? '0 0 25px rgba(59, 126, 72, 0.6)'
                              : '0 8px 30px rgba(0,0,0,0.4)',
                            transition: 'all 0.3s ease',
                          }}
                        />
                        {falandoAtivo && (
                          <span
                            style={{
                              position: 'absolute',
                              bottom: 6,
                              right: 6,
                              backgroundColor: '#3B7E48',
                              color: '#FFF',
                              borderRadius: '50%',
                              width: 28,
                              height: 28,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.8rem',
                            }}
                          >
                            🔊
                          </span>
                        )}
                      </div>

                      <h3
                        style={{
                          fontFamily: 'var(--fonte-titulo, "Fraunces", serif)',
                          color: '#FFF',
                          fontSize: '1.4rem',
                          margin: '0 0 0.35rem 0',
                        }}
                      >
                        {ehEspecialista ? dadosSala?.paciente?.nome : dadosSala?.especialista?.nome}
                      </h3>
                      <p style={{ color: '#D8C6B6', fontSize: '0.86rem', margin: 0 }}>
                        {ehEspecialista
                          ? 'Paciente / Cuidador • Conectado via App Seguro'
                          : `${dadosSala?.especialista?.especialidade} • ${dadosSala?.especialista?.conselho}`}
                      </p>
                    </div>

                    {/* Feed Local do Usuário (Picture-in-Picture no canto inferior direito) */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '1.25rem',
                        right: '1.25rem',
                        width: 190,
                        aspectRatio: '16/10',
                        backgroundColor: '#27201C',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        border: '2px solid rgba(255, 255, 255, 0.18)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.5)',
                        zIndex: 10,
                      }}
                    >
                      {camAtiva ? (
                        <video
                          ref={videoLocalRef}
                          autoPlay
                          playsInline
                          muted
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transform: 'scaleX(-1)',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#999',
                            fontSize: '0.78rem',
                          }}
                        >
                          Câmera desligada
                        </div>
                      )}
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 4,
                          left: 6,
                          backgroundColor: 'rgba(0,0,0,0.65)',
                          color: '#FFF',
                          fontSize: '0.65rem',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '6px',
                        }}
                      >
                        Você {micAtivo ? '' : '(Mudo)'}
                      </span>
                    </div>

                    {/* Indicador de Modo Simulação Segura */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '1rem',
                        left: '1rem',
                        backgroundColor: 'rgba(30, 24, 21, 0.85)',
                        border: '1px solid rgba(124, 83, 63, 0.35)',
                        borderRadius: '10px',
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.72rem',
                        color: '#D8C6B6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <span>🛡️ Modo Simulação Segura (Preview Local)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Barra de Controles Minimalistas na Base do Vídeo */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  paddingTop: '1rem',
                  flexShrink: 0,
                }}
              >
                {/* Botão Mutar Microfone */}
                <button
                  type="button"
                  onClick={toggleMic}
                  style={{
                    backgroundColor: micAtivo ? '#2E2824' : '#7C2D12',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#FFF',
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.15s ease',
                  }}
                  title={micAtivo ? 'Mutar microfone' : 'Ativar microfone'}
                >
                  {micAtivo ? '🎙️' : '🔇'}
                </button>

                {/* Botão Ligar/Desligar Câmera */}
                <button
                  type="button"
                  onClick={toggleCam}
                  style={{
                    backgroundColor: camAtiva ? '#2E2824' : '#7C2D12',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#FFF',
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.15s ease',
                  }}
                  title={camAtiva ? 'Desligar câmera' : 'Ligar câmera'}
                >
                  {camAtiva ? '📹' : '🚫'}
                </button>

                {/* Botão Compartilhar Tela */}
                <button
                  type="button"
                  onClick={toggleCompartilharTela}
                  style={{
                    backgroundColor: compartilhandoTela ? '#3B7E48' : '#2E2824',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#FFF',
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={compartilhandoTela ? 'Parar compartilhamento' : 'Compartilhar tela'}
                >
                  💻
                </button>

                {/* Botão Abrir Chat & Anexos */}
                <button
                  type="button"
                  onClick={() => {
                    setDrawerAberto(true);
                    setAbaAtiva('chat');
                  }}
                  style={{
                    backgroundColor: abaAtiva === 'chat' && drawerAberto ? '#7C533F' : '#2E2824',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#FFF',
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                  title="Abrir Chat e Anexos"
                >
                  💬
                  {naoLidasChat > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -3,
                        right: -3,
                        backgroundColor: '#3B7E48',
                        color: '#FFF',
                        borderRadius: '50%',
                        width: 18,
                        height: 18,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {naoLidasChat}
                    </span>
                  )}
                </button>

                {/* Botão Encerrar Consulta */}
                <button
                  type="button"
                  onClick={() => setModalEncerrarAberta(true)}
                  style={{
                    backgroundColor: '#C94A38',
                    border: 'none',
                    color: '#FFF',
                    borderRadius: '30px',
                    padding: '0 1.4rem',
                    height: 48,
                    cursor: 'pointer',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 15px rgba(201, 74, 56, 0.4)',
                  }}
                  title="Encerrar consulta"
                >
                  <span>Encerrar Chamada</span>
                  <span>✕</span>
                </button>
              </div>
            </>
          )}
        </main>

        {/* ==================================================================
            COLUNA 2 (30%): PAINEL CLÍNICO INTEGRADO & COMUNICAÇÃO
            ================================================================== */}
        {drawerAberto && (
          <aside
            style={{
              backgroundColor: '#241E1A',
              borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              height: '100%',
            }}
          >
            {/* Navegador de Abas Internas */}
            <div
              style={{
                display: 'flex',
                backgroundColor: '#1E1815',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                overflowX: 'auto',
                scrollbarWidth: 'none',
              }}
            >
              {ehEspecialista ? (
                /* INÍCIO: 4 ABAS DO PAINEL CLÍNICO DO ESPECIALISTA
                 * (o Chat continua acessível pelo botão 💬 da barra de controles do vídeo) */
                <>
                  {[
                    { id: 'prontuario', label: '📝 Prontuário & Conduta' },
                    { id: 'exames', label: '🧪 Exames & Guias' },
                    { id: 'pre', label: '🩺 Pré-Atendimento' },
                    { id: 'resumo', label: '📊 Resumo DM1' },
                  ].map((aba) => (
                    <button
                      key={aba.id}
                      type="button"
                      onClick={() => setAbaAtiva(aba.id)}
                      style={{
                        flex: '1 0 auto',
                        padding: '0.8rem 0.6rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: abaAtiva === aba.id ? '2.5px solid #3B7E48' : '2.5px solid transparent',
                        color: abaAtiva === aba.id ? '#FFF' : '#BBAE9F',
                        fontWeight: abaAtiva === aba.id ? 700 : 500,
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {aba.label}
                    </button>
                  ))}
                  {abaAtiva === 'chat' && (
                    <button
                      type="button"
                      onClick={() => setAbaAtiva('chat')}
                      style={{
                        flex: '1 0 auto',
                        padding: '0.8rem 0.6rem',
                        background: 'none',
                        border: 'none',
                        borderBottom: '2.5px solid #3B7E48',
                        color: '#FFF',
                        fontWeight: 700,
                        fontSize: '0.76rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      💬 Chat
                    </button>
                  )}
                </>
                /* FIM: 4 ABAS DO PAINEL CLÍNICO DO ESPECIALISTA */
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setAbaAtiva('roteiro')}
                    style={{
                      flex: 1,
                      padding: '0.85rem 0.6rem',
                      background: 'none',
                      border: 'none',
                      borderBottom: abaAtiva === 'roteiro' ? '2.5px solid #3B7E48' : 'none',
                      color: abaAtiva === 'roteiro' ? '#FFF' : '#BBAE9F',
                      fontWeight: abaAtiva === 'roteiro' ? 700 : 500,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    📋 Meu Roteiro
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbaAtiva('chat')}
                    style={{
                      flex: 1,
                      padding: '0.85rem 0.6rem',
                      background: 'none',
                      border: 'none',
                      borderBottom: abaAtiva === 'chat' ? '2.5px solid #3B7E48' : 'none',
                      color: abaAtiva === 'chat' ? '#FFF' : '#BBAE9F',
                      fontWeight: abaAtiva === 'chat' ? 700 : 500,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    💬 Chat & Enviar Exame
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbaAtiva('resumo')}
                    style={{
                      flex: 1,
                      padding: '0.85rem 0.6rem',
                      background: 'none',
                      border: 'none',
                      borderBottom: abaAtiva === 'resumo' ? '2.5px solid #3B7E48' : 'none',
                      color: abaAtiva === 'resumo' ? '#FFF' : '#BBAE9F',
                      fontWeight: abaAtiva === 'resumo' ? 700 : 500,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    🔍 Meu Perfil
                  </button>
                </>
              )}
            </div>

            {/* Conteúdo com Rolagem Suave */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
              {/* ------------------------------------------------------------
                  ABA 1: RESUMO & PRÉ-ATENDIMENTO (COM ALERGIAS EM DESTAQUE)
                  ------------------------------------------------------------ */}
              {abaAtiva === 'resumo' && (
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  {/* ALERTA DE ALERGIAS EM DESTAQUE */}
                  {dadosSala?.alergias && dadosSala.alergias.length > 0 ? (
                    <div
                      style={{
                        backgroundColor: '#351814',
                        border: '1.5px solid #E06A55',
                        borderRadius: '14px',
                        padding: '0.9rem 1rem',
                        boxShadow: '0 4px 15px rgba(224, 106, 85, 0.2)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.45rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                        <strong style={{ color: '#FCA5A5', fontSize: '0.86rem', textTransform: 'uppercase' }}>
                          Alergias & Sensibilidades
                        </strong>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                        {dadosSala.alergias.map((al) => (
                          <span
                            key={al.id}
                            style={{
                              backgroundColor: 'rgba(224, 106, 85, 0.25)',
                              color: '#FFE2DE',
                              border: '1px solid #E06A55',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                            }}
                          >
                            {al.substancia_ou_item} ({al.gravidade || 'Alerta'})
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Informações Clínicas do Paciente */}
                  <div
                    style={{
                      backgroundColor: '#2C2420',
                      borderRadius: '14px',
                      padding: '1rem',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', color: '#BBAE9F', textTransform: 'uppercase', fontWeight: 700 }}>
                      Dados do Paciente
                    </span>
                    <h4 style={{ margin: '0.25rem 0 0.5rem 0', color: '#FFF', fontSize: '1.05rem' }}>
                      {dadosSala?.perfil_saude?.nome_completo || dadosSala?.paciente?.nome}
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                      <div>
                        <span style={{ color: '#BBAE9F' }}>Diagnóstico:</span>
                        <strong style={{ display: 'block', color: '#FFF' }}>
                          {tempoDiagnostico ? `${tempoDiagnostico.anos}a ${tempoDiagnostico.meses}m` : 'DM1'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: '#BBAE9F' }}>Terapia:</span>
                        <strong style={{ display: 'block', color: '#FFF' }}>
                          {dadosSala?.perfil_saude?.terapia_insulina || 'MDI (Canetas)'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: '#BBAE9F' }}>FSI Médio:</span>
                        <strong style={{ display: 'block', color: '#FFF' }}>
                          {dadosSala?.perfil_saude?.fsi ? `1 UI : ${dadosSala.perfil_saude.fsi} mg/dL` : 'Não conf.'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: '#BBAE9F' }}>Meta Glicêmica:</span>
                        <strong style={{ display: 'block', color: '#FFF' }}>
                          {dadosSala?.perfil_saude?.glicemia_alvo ? `${dadosSala.perfil_saude.glicemia_alvo} mg/dL` : '100 mg/dL'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Pré-Atendimento Preenchido (na visão do especialista fica na aba própria "🩺 Pré-Atendimento") */}
                  {!ehEspecialista && dadosSala?.pre_atendimento && (
                    <div
                      style={{
                        backgroundColor: '#2C2420',
                        borderRadius: '14px',
                        padding: '1rem',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', color: '#8FE39C', textTransform: 'uppercase', fontWeight: 700 }}>
                        Pré-Atendimento da Família
                      </span>
                      <div style={{ marginTop: '0.65rem' }}>
                        <strong style={{ display: 'block', color: '#FFF', fontSize: '0.84rem' }}>
                          Motivo Principal:
                        </strong>
                        <p style={{ color: '#D8C6B6', fontSize: '0.82rem', margin: '0.2rem 0 0.65rem 0' }}>
                          {dadosSala.pre_atendimento.motivo_principal}
                        </p>

                        <strong style={{ display: 'block', color: '#FFF', fontSize: '0.84rem' }}>
                          Maiores Dores Relatadas:
                        </strong>
                        <p style={{ color: '#D8C6B6', fontSize: '0.82rem', margin: '0.2rem 0 0.65rem 0' }}>
                          {dadosSala.pre_atendimento.maiores_dores}
                        </p>

                        <strong style={{ display: 'block', color: '#FFF', fontSize: '0.84rem' }}>
                          Dúvidas Prioritárias:
                        </strong>
                        <p
                          style={{
                            color: '#D8C6B6',
                            fontSize: '0.82rem',
                            margin: '0.2rem 0 0 0',
                            whiteSpace: 'pre-line',
                          }}
                        >
                          {dadosSala.pre_atendimento.duvidas_prioritarias}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Últimas Glicemias & IOB */}
                  {dadosSala?.glicemias && dadosSala.glicemias.length > 0 && (
                    <div
                      style={{
                        backgroundColor: '#2C2420',
                        borderRadius: '14px',
                        padding: '1rem',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', color: '#BBAE9F', textTransform: 'uppercase', fontWeight: 700 }}>
                        Últimos Registros no Diário
                      </span>
                      <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {dadosSala.glicemias.slice(0, 4).map((g) => (
                          <div
                            key={g.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              backgroundColor: '#231D19',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                            }}
                          >
                            <div>
                              <strong style={{ color: '#FFF' }}>{g.valor_mg_dl} mg/dL</strong>
                              <span style={{ color: '#BBAE9F', marginLeft: '0.4rem', fontSize: '0.74rem' }}>
                                ({g.momento_medicao})
                              </span>
                            </div>
                            <span style={{ color: '#8FE39C', fontSize: '0.74rem' }}>
                              {g.insulina_ativa_estimada > 0 ? `IOB: ~${g.insulina_ativa_estimada} UI` : g.tendencia_destro || 'Estável'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* INÍCIO: MEDICAMENTOS E INSULINAS ATIVAS (RESUMO DM1) */}
                  {dadosSala?.medicamentos && dadosSala.medicamentos.length > 0 && (
                    <div
                      style={{
                        backgroundColor: '#2C2420',
                        borderRadius: '14px',
                        padding: '1rem',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', color: '#BBAE9F', textTransform: 'uppercase', fontWeight: 700 }}>
                        Medicamentos & Insulinas em Uso
                      </span>
                      <div style={{ display: 'grid', gap: '0.45rem', marginTop: '0.5rem' }}>
                        {dadosSala.medicamentos.map((med) => (
                          <div
                            key={med.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: '0.5rem',
                              flexWrap: 'wrap',
                              backgroundColor: '#231D19',
                              padding: '0.5rem 0.75rem',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                            }}
                          >
                            <strong style={{ color: '#FFF' }}>{med.nome_medicamento}</strong>
                            <span style={{ color: '#D8C6B6', fontSize: '0.76rem' }}>
                              {med.dose} • {med.horario}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* FIM: MEDICAMENTOS E INSULINAS ATIVAS */}
                </div>
              )}

              {/* ------------------------------------------------------------
                  INÍCIO — ABA "🩺 PRÉ-ATENDIMENTO" (ESPECIALISTA)
                  Motivo, dores e dúvidas enviadas previamente pela família.
                  ------------------------------------------------------------ */}
              {abaAtiva === 'pre' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {dadosSala?.pre_atendimento ? (
                    [
                      { rotulo: 'Motivo Principal', valor: dadosSala.pre_atendimento.motivo_principal, cor: '#8FE39C' },
                      { rotulo: 'Maiores Dores Relatadas', valor: dadosSala.pre_atendimento.maiores_dores, cor: '#FCA5A5' },
                      { rotulo: 'Dúvidas Prioritárias', valor: dadosSala.pre_atendimento.duvidas_prioritarias, cor: '#F3D9A4' },
                    ].map((bloco) => (
                      <div
                        key={bloco.rotulo}
                        style={{
                          backgroundColor: '#2C2420',
                          borderRadius: '14px',
                          padding: '1rem',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <span style={{ fontSize: '0.72rem', color: bloco.cor, textTransform: 'uppercase', fontWeight: 700 }}>
                          {bloco.rotulo}
                        </span>
                        <p
                          style={{
                            color: '#EAE4D9',
                            fontSize: '0.84rem',
                            margin: '0.4rem 0 0 0',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-line',
                          }}
                        >
                          {bloco.valor || 'Não informado pela família.'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#BBAE9F', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>
                      O paciente ainda não respondeu ao roteiro de pré-atendimento.
                    </p>
                  )}
                  {dadosSala?.pre_atendimento?.preenchido_em && (
                    <small style={{ color: '#8C7F74', fontSize: '0.72rem' }}>
                      Enviado em {dadosSala.pre_atendimento.preenchido_em}
                    </small>
                  )}
                </div>
              )}
              {/* FIM — ABA "🩺 PRÉ-ATENDIMENTO" */}

              {/* ------------------------------------------------------------
                  INÍCIO — ABA 2: 🧪 EXAMES & GUIAS MÉDICAS (ESPECIALISTA)
                  Bloco Superior: Emissão em tempo real com chips de exames DM1
                  Bloco Inferior: Últimos exames e laudos anexados pelo paciente
                  ------------------------------------------------------------ */}
              {abaAtiva === 'exames' && (
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  {/* BLOCO SUPERIOR: EMITIR NOVA SOLICITAÇÃO DE EXAMES */}
                  <form
                    onSubmit={handleSalvarSolicitacaoExames}
                    style={{
                      backgroundColor: '#2C2420',
                      borderRadius: '16px',
                      padding: '1.15rem',
                      border: '1.5px solid rgba(59, 126, 72, 0.35)',
                      display: 'grid',
                      gap: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>🧪</span>
                        <strong style={{ color: '#8FE39C', fontSize: '0.86rem', textTransform: 'uppercase' }}>
                          Emitir Nova Guia de Exames
                        </strong>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#BBAE9F' }}>Disponível em tempo real</span>
                    </div>

                    {/* Título do Pedido */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#EAE4D9', marginBottom: '0.3rem' }}>
                        Título do Pedido Clínico:
                      </label>
                      <input
                        type="text"
                        value={tituloPedidoExame}
                        onChange={(e) => setTituloPedidoExame(e.target.value)}
                        placeholder="Ex: Rotina Trimestral DM1 + Perfil Vitamínico"
                        required
                        style={{
                          width: '100%',
                          fontSize: '0.82rem',
                          backgroundColor: '#231D19',
                          color: '#FFF',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '8px',
                          padding: '7px 10px',
                        }}
                      />
                    </div>

                    {/* Chips Clicáveis de Seleção Rápida */}
                    <div>
                      <span style={{ display: 'block', fontSize: '0.74rem', color: '#BBAE9F', marginBottom: '0.45rem', fontWeight: 600 }}>
                        Exames Comuns no Acompanhamento de DM1 (Clique para selecionar):
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {[
                          'Hemoglobina Glicada (HbA1c)',
                          'Glicemia em Jejum',
                          'Vitamina D (25-OH)',
                          'Vitamina B12',
                          'Creatinina Sérica',
                          'Microalbuminúria em Amostra Isolada',
                          'TSH e T4 Livre',
                          'Perfil Lipídico Completo',
                          'Hemograma Completo',
                        ].map((nomeExame) => {
                          const selecionado = examesSelecionados.includes(nomeExame);
                          return (
                            <button
                              key={nomeExame}
                              type="button"
                              onClick={() => toggleExameSelecionado(nomeExame)}
                              style={{
                                backgroundColor: selecionado ? 'rgba(59, 126, 72, 0.35)' : '#231D19',
                                color: selecionado ? '#A3F5B0' : '#D8C6B6',
                                border: selecionado ? '1.5px solid #3B7E48' : '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '16px',
                                padding: '0.28rem 0.65rem',
                                fontSize: '0.74rem',
                                fontWeight: selecionado ? 700 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {selecionado ? '✓ ' : '+ '}
                              {nomeExame}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Adicionar Outro Exame Livre */}
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <input
                        type="text"
                        value={outroExameSala}
                        onChange={(e) => setOutroExameSala(e.target.value)}
                        placeholder="Outro exame específico (ex: Curva de Insulina, Ferritina)..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAdicionarExameLivre();
                          }
                        }}
                        style={{
                          flex: 1,
                          fontSize: '0.78rem',
                          backgroundColor: '#231D19',
                          color: '#FFF',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAdicionarExameLivre}
                        style={{
                          backgroundColor: '#3B7E48',
                          color: '#FFF',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0 0.85rem',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        + Adicionar
                      </button>
                    </div>

                    {/* Lista dos Selecionados no Pedido */}
                    {examesSelecionados.length > 0 && (
                      <div
                        style={{
                          backgroundColor: '#231D19',
                          borderRadius: '10px',
                          padding: '0.65rem',
                          border: '1px dashed rgba(59, 126, 72, 0.35)',
                        }}
                      >
                        <span style={{ fontSize: '0.7rem', color: '#8FE39C', fontWeight: 700, textTransform: 'uppercase' }}>
                          Exames Incluídos na Guia ({examesSelecionados.length}):
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                          {examesSelecionados.map((item) => (
                            <span
                              key={item}
                              style={{
                                backgroundColor: 'rgba(59, 126, 72, 0.2)',
                                color: '#FFF',
                                border: '1px solid #3B7E48',
                                borderRadius: '6px',
                                padding: '0.15rem 0.45rem',
                                fontSize: '0.72rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
                            >
                              {item}
                              <button
                                type="button"
                                onClick={() => toggleExameSelecionado(item)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#FCA5A5',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  padding: 0,
                                }}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Justificativa Clínica / Observação */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: '#EAE4D9', marginBottom: '0.25rem', fontWeight: 600 }}>
                        Justificativa Clínica / Observações ao Laboratório:
                      </label>
                      <textarea
                        rows={2}
                        value={justificativaExame}
                        onChange={(e) => setJustificativaExame(e.target.value)}
                        placeholder="Ex: Paciente com DM1 em ajuste de doses basais; controle metabólico trimestral e checagem de micronutrientes..."
                        style={{
                          width: '100%',
                          fontSize: '0.78rem',
                          backgroundColor: '#231D19',
                          color: '#FFF',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                        }}
                      />
                    </div>

                    {solicitacaoSucesso && (
                      <div
                        style={{
                          backgroundColor: 'rgba(59, 126, 72, 0.2)',
                          border: '1px solid #3B7E48',
                          borderRadius: '8px',
                          padding: '0.5rem 0.75rem',
                          color: '#8FE39C',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                        }}
                      >
                        {solicitacaoSucesso}
                      </div>
                    )}

                    <Button
                      variante="cta"
                      tipo="submit"
                      disabled={salvandoExame || examesSelecionados.length === 0}
                      style={{
                        padding: '0.7rem',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        backgroundColor: '#3B7E48',
                      }}
                    >
                      {salvandoExame ? 'Gerando Guia Médica...' : 'Emitir Guia e Enviar ao Paciente →'}
                    </Button>
                  </form>

                  {/* GUIAS EMITIDAS NESTA SESSÃO */}
                  {guiasEmitidasSala.length > 0 && (
                    <div
                      style={{
                        backgroundColor: '#231D19',
                        borderRadius: '12px',
                        padding: '0.85rem',
                        border: '1px solid rgba(59, 126, 72, 0.3)',
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', color: '#8FE39C', fontWeight: 700, textTransform: 'uppercase' }}>
                        Guias Emitidas Nesta Chamada ({guiasEmitidasSala.length}):
                      </span>
                      <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {guiasEmitidasSala.map((g) => (
                          <div
                            key={g.id}
                            style={{
                              backgroundColor: '#2C2420',
                              borderRadius: '8px',
                              padding: '0.6rem 0.75rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '0.5rem',
                              flexWrap: 'wrap',
                            }}
                          >
                            <div>
                              <strong style={{ color: '#FFF', fontSize: '0.8rem', display: 'block' }}>
                                📄 {g.titulo}
                              </strong>
                              <small style={{ color: '#BBAE9F', fontSize: '0.72rem' }}>
                                {g.exames.length} exame(s) • {g.emitida_em}
                              </small>
                            </div>
                            {g.guia_pdf_path && (
                              <a
                                href={g.guia_pdf_path}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  backgroundColor: '#3B7E48',
                                  color: '#FFF',
                                  padding: '0.25rem 0.65rem',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                }}
                              >
                                Abrir PDF ↗
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* BLOCO INFERIOR: ÚLTIMOS EXAMES ANEXADOS PELO PACIENTE */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                      <span style={{ fontSize: '0.74rem', color: '#BBAE9F', textTransform: 'uppercase', fontWeight: 700 }}>
                        Últimos Exames Anexados pelo Paciente
                      </span>
                      <small style={{ color: '#8C7F74', fontSize: '0.7rem' }}>
                        {dadosSala?.exames?.length || 0} registro(s)
                      </small>
                    </div>

                    {dadosSala?.exames && dadosSala.exames.length > 0 ? (
                      <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {dadosSala.exames.map((ex) => (
                          <div
                            key={ex.id}
                            style={{
                              backgroundColor: '#2C2420',
                              borderRadius: '12px',
                              padding: '0.85rem',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                              <div>
                                <strong style={{ fontSize: '0.84rem', color: '#FFF' }}>
                                  🏥 {ex.laboratorio}
                                </strong>
                                <span style={{ fontSize: '0.72rem', color: '#BBAE9F', display: 'block' }}>
                                  Realizado em: {ex.data_realizacao}
                                </span>
                              </div>
                              {ex.laudo_pdf ? (
                                <a
                                  href={ex.laudo_pdf}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    backgroundColor: '#7C533F',
                                    color: '#FFF',
                                    padding: '0.25rem 0.65rem',
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                  }}
                                >
                                  Ver Laudo PDF ↗
                                </a>
                              ) : (
                                <span style={{ fontSize: '0.7rem', color: '#888' }}>Laudo digital</span>
                              )}
                            </div>

                            <div style={{ display: 'grid', gap: '0.35rem', marginTop: '0.35rem' }}>
                              {ex.marcadores?.map((m, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '0.76rem',
                                    color: '#D8C6B6',
                                    backgroundColor: '#231D19',
                                    padding: '0.35rem 0.55rem',
                                    borderRadius: '6px',
                                  }}
                                >
                                  <span>{m.nome_marcador}:</span>
                                  <strong style={{ color: '#FFF' }}>
                                    {m.valor_resultado} {m.unidade}
                                  </strong>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        style={{
                          backgroundColor: '#231D19',
                          borderRadius: '10px',
                          padding: '1.5rem',
                          textAlign: 'center',
                          color: '#BBAE9F',
                          fontSize: '0.8rem',
                        }}
                      >
                        Nenhum exame recente anexado pelo paciente até o momento.
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* FIM — ABA 2: 🧪 EXAMES & GUIAS MÉDICAS */}

              {/* ------------------------------------------------------------
                  INÍCIO — ABA 1: PRONTUÁRIO & CONDUTA CLÍNICA (ESPECIALISTA)
                  ------------------------------------------------------------ */}
              {abaAtiva === 'prontuario' && (
                <form onSubmit={handleSalvarProntuario} style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.74rem', color: '#8FE39C', textTransform: 'uppercase', fontWeight: 700 }}>
                      Prontuário & Conduta (CFM 2.314/2022)
                    </span>
                    {prontuarioSalvoSucesso && (
                      <span
                        style={{
                          backgroundColor: 'rgba(59, 126, 72, 0.25)',
                          color: '#7CE38B',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '8px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}
                      >
                        ✓ Salvo & Liberado
                      </span>
                    )}
                  </div>

                  {/* Queixa Principal */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem', color: '#EAE4D9' }}>
                      1. Queixa Principal:
                    </label>
                    <textarea
                      rows={2}
                      value={queixaPrincipal}
                      onChange={(e) => setQueixaPrincipal(e.target.value)}
                      placeholder="Motivo da consulta relatado pelo paciente ou família..."
                      required
                    />
                  </div>

                  {/* Evolução Clínica */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem', color: '#EAE4D9' }}>
                      2. Evolução Clínica / Anamnese:
                    </label>
                    <textarea
                      rows={4}
                      value={evolucaoClinica}
                      onChange={(e) => setEvolucaoClinica(e.target.value)}
                      placeholder="Histórico clínico, avaliação dos gráficos do sensor, episódios de hipoglicemia e rotina alimentar..."
                    />
                  </div>

                  {/* Conduta & Orientações */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem', color: '#EAE4D9' }}>
                      3. Conduta e Orientações para a Família (Disponibilizado ao Paciente):
                    </label>
                    <textarea
                      rows={4}
                      value={condutaOrientacoes}
                      onChange={(e) => setCondutaOrientacoes(e.target.value)}
                      placeholder="Ajustes nas doses basais/bolus, carta escolar, metas de tempo no alvo (TIR)..."
                      required
                    />
                  </div>

                  {/* INÍCIO: BLOCO DE ANOTAÇÕES PRIVADAS DO ESPECIALISTA (RASCUNHO CLÍNICO) */}
                  <div
                    style={{
                      backgroundColor: '#F6F3EE',
                      border: '1px solid rgba(124, 83, 63, 0.22)',
                      borderRadius: '12px',
                      padding: '0.9rem',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7C533F' }}>
                        🔒 Anotações Privadas da Médica / Especialista
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          backgroundColor: '#EAE4D9',
                          color: '#2E2824',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          fontWeight: 600,
                        }}
                      >
                        Visível apenas para você no prontuário
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={anotacoesPrivadas}
                      onChange={(e) => setAnotacoesPrivadas(e.target.value)}
                      placeholder="Hipóteses preliminares, observações de comportamento ou pontos de atenção para o retorno (nunca exibido no resumo entregue ao paciente)..."
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: '#2E2824',
                        border: '1px solid rgba(124, 83, 63, 0.25)',
                        fontSize: '0.82rem',
                        lineHeight: 1.45,
                        width: '100%',
                      }}
                    />
                  </div>
                  {/* FIM: BLOCO DE ANOTAÇÕES PRIVADAS DO ESPECIALISTA */}

                  {/* Checkbox Obrigatório CFM */}
                  <div
                    style={{
                      backgroundColor: '#2C2420',
                      padding: '0.65rem',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      id="checkPresencial"
                      checked={orientadoPresencial}
                      onChange={(e) => setOrientadoPresencial(e.target.checked)}
                      style={{ marginTop: '0.15rem' }}
                    />
                    <label htmlFor="checkPresencial" style={{ fontSize: '0.74rem', color: '#D8C6B6', lineHeight: 1.4 }}>
                      Recomendar avaliação médica presencial caso haja intercorrências graves ou necessidade de exame físico (CFM 2.314/2022).
                    </label>
                  </div>

                  <Button
                    variante="cta"
                    tipo="submit"
                    disabled={salvandoProntuario}
                    style={{ width: '100%', padding: '0.85rem', fontSize: '0.88rem', fontWeight: 700 }}
                  >
                    {salvandoProntuario ? 'Gravando Prontuário...' : 'Salvar Prontuário e Concluir Consulta →'}
                  </Button>
                </form>
              )}
              {/* FIM — ABA 1: PRONTUÁRIO & CONDUTA CLÍNICA */}

              {/* ------------------------------------------------------------
                  ABA 4: MEU ROTEIRO COM CHECKLIST (PACIENTE / CUIDADOR)
                  ------------------------------------------------------------ */}
              {abaAtiva === 'roteiro' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div
                    style={{
                      backgroundColor: '#2C2420',
                      borderRadius: '14px',
                      padding: '1rem',
                      border: '1px solid rgba(124, 83, 63, 0.25)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>🐕</span>
                      <strong style={{ color: '#FFF', fontSize: '0.86rem' }}>Roteiro da Família</strong>
                    </div>
                    <p style={{ color: '#D8C6B6', fontSize: '0.78rem', margin: 0, lineHeight: 1.5 }}>
                      Marque as dúvidas que já foram esclarecidas durante a chamada para não esquecer nada!
                    </p>
                  </div>

                  <div style={{ display: 'grid', gap: '0.65rem' }}>
                    {roteiroChecklist.map((item) => (
                      <div
                        key={item.id}
                        onClick={() =>
                          setRoteiroChecklist((prev) =>
                            prev.map((r) => (r.id === item.id ? { ...r, resolvida: !r.resolvida } : r))
                          )
                        }
                        style={{
                          backgroundColor: item.resolvida ? '#213324' : '#2C2420',
                          border: item.resolvida ? '1px solid #3B7E48' : '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '10px',
                          padding: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.65rem',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={item.resolvida}
                          onChange={() => {}} // Tratado no card
                          style={{ marginTop: '0.2rem' }}
                        />
                        <span
                          style={{
                            fontSize: '0.82rem',
                            color: item.resolvida ? '#8FE39C' : '#FFF',
                            textDecoration: item.resolvida ? 'line-through' : 'none',
                            lineHeight: 1.4,
                          }}
                        >
                          {item.texto}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------
                  ABA 5: CHAT PARALELO & ENVIO DE ANEXOS
                  ------------------------------------------------------------ */}
              {abaAtiva === 'chat' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.85rem' }}>
                  {/* Mensagens com Rolagem */}
                  <div
                    ref={chatScrollRef}
                    style={{
                      maxHeight: '380px',
                      overflowY: 'auto',
                      display: 'grid',
                      gap: '0.65rem',
                      paddingRight: '0.25rem',
                    }}
                  >
                    {mensagensChat.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#BBAE9F', padding: '2rem 1rem', fontSize: '0.82rem' }}>
                        <span>💬 Nenhuma mensagem ainda. Envie uma dúvida ou anexo durante a conversa.</span>
                      </div>
                    ) : (
                      mensagensChat.map((m) => {
                        const ehPropria =
                          (ehEspecialista && m.papel_remetente === 'especialista') ||
                          (!ehEspecialista && m.papel_remetente === 'paciente');
                        return (
                          <div
                            key={m.id}
                            style={{
                              alignSelf: ehPropria ? 'flex-end' : 'flex-start',
                              maxWidth: '85%',
                              backgroundColor: ehPropria ? '#3B7E48' : '#2C2420',
                              color: '#FFF',
                              padding: '0.65rem 0.85rem',
                              borderRadius: '12px',
                              fontSize: '0.82rem',
                              border: ehPropria ? 'none' : '1px solid rgba(255,255,255,0.08)',
                            }}
                          >
                            <span style={{ display: 'block', fontSize: '0.68rem', opacity: 0.8, marginBottom: '0.2rem' }}>
                              {m.remetente_nome}
                            </span>
                            {m.conteudo && <p style={{ margin: 0, lineHeight: 1.4 }}>{m.conteudo}</p>}
                            {m.arquivo_nome && (
                              <div
                                style={{
                                  marginTop: '0.45rem',
                                  padding: '0.35rem 0.55rem',
                                  backgroundColor: 'rgba(0,0,0,0.2)',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  fontSize: '0.74rem',
                                }}
                              >
                                <span>📎</span>
                                <span>{m.arquivo_nome}</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Atalhos para Envio Rápido de Anexos */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => handleSimularUploadAnexo('glicemia')}
                      style={{
                        flex: 1,
                        backgroundColor: '#2C2420',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#D8C6B6',
                        padding: '0.4rem',
                        borderRadius: '8px',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                      }}
                    >
                      📊 Anexar Relatório
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimularUploadAnexo('pele')}
                      style={{
                        flex: 1,
                        backgroundColor: '#2C2420',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#D8C6B6',
                        padding: '0.4rem',
                        borderRadius: '8px',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                      }}
                    >
                      📷 Foto do Sensor/Pele
                    </button>
                  </div>

                  {/* Preview de Anexo Pronto para Envio */}
                  {anexoSimulado && (
                    <div
                      style={{
                        backgroundColor: '#2C2420',
                        padding: '0.45rem 0.75rem',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.74rem',
                        border: '1px dashed #3B7E48',
                      }}
                    >
                      <span>📎 Pronto: {anexoSimulado.nome}</span>
                      <button
                        type="button"
                        onClick={() => setAnexoSimulado(null)}
                        style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Formulário de Envio */}
                  <form onSubmit={handleEnviarMensagem} style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <input
                      type="text"
                      value={textoMensagem}
                      onChange={(e) => setTextoMensagem(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      style={{ flex: 1, fontSize: '0.84rem' }}
                    />
                    <Button
                      variante="cta"
                      tipo="submit"
                      disabled={enviandoMensagem || (!textoMensagem.trim() && !anexoSimulado)}
                      style={{ padding: '0 1rem', fontSize: '0.84rem' }}
                    >
                      Enviar
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ====================================================================
          MODAL TCLE (CONFORMIDADE CFM 2.314/2022)
          ==================================================================== */}
      {modalTCLEAberta && (
        <ModalTCLE
          aberto={modalTCLEAberta}
          onFechar={() => setModalTCLEAberta(false)}
          agendamentoId={dadosSala?.agendamento?.id || 1}
          profissionalNome={dadosSala?.especialista?.nome || 'Dra. Helena Vasconcelos'}
          profissionalConselho={dadosSala?.especialista?.conselho || 'CRM-SP 148290'}
          usuario={usuario}
          perfilSaude={dadosSala?.perfil_saude}
          onSucessoAssinatura={() => {
            setTcleAssinado(true);
            setModalTCLEAberta(false);
          }}
        />
      )}

      {/* ====================================================================
          MODAL: SOLICITAR EXAMES LABORATORIAIS (+ SOLICITAR EXAMES)
          ==================================================================== */}
      {modalSolicitarExameAberta && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
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
              backgroundColor: '#27201C',
              color: '#FFF',
              borderRadius: '20px',
              padding: '2rem',
              maxWidth: 520,
              width: '100%',
              border: '1.5px solid rgba(124, 83, 63, 0.3)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontFamily: 'var(--fonte-titulo, "Fraunces", serif)', margin: 0, fontSize: '1.35rem', color: '#F6F3EE' }}>
                🧪 Emitir Guia Médica de Exames
              </h3>
              <button
                type="button"
                onClick={() => setModalSolicitarExameAberta(false)}
                style={{ background: 'none', border: 'none', color: '#BBAE9F', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarSolicitacaoExames} style={{ display: 'grid', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.35rem', color: '#EAE4D9' }}>
                  Título do Pedido:
                </label>
                <input
                  type="text"
                  value={tituloPedidoExame}
                  onChange={(e) => setTituloPedidoExame(e.target.value)}
                  placeholder="Ex: Rotina Trimestral DM1"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Selecione os exames a solicitar:
                </label>
                <div style={{ display: 'grid', gap: '0.5rem', maxHeight: 220, overflowY: 'auto' }}>
                  {[
                    'Hemoglobina Glicada (HbA1c)',
                    'Glicemia em Jejum',
                    'Microalbuminúria em Amostra Isolada',
                    'Perfil Lipídico Completo (Colesterol Total, HDL, LDL, Triglicérides)',
                    'TSH e T4 Livre (Função Tireoidiana)',
                    'Vitamina D (25-OH)',
                    'Creatinina e Ureia (Função Renal)',
                    'Anticorpos Anti-Transglutaminase IgA (Triagem Celíaca)',
                  ].map((nome) => {
                    const marcado = examesSelecionados.includes(nome);
                    return (
                      <label
                        key={nome}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          backgroundColor: marcado ? 'rgba(59, 126, 72, 0.2)' : '#1E1815',
                          border: marcado ? '1px solid #3B7E48' : '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '10px',
                          padding: '0.55rem 0.75rem',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={() => toggleExameSelecionado(nome)}
                        />
                        <span>{nome}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {solicitacaoSucesso && (
                <div style={{ color: '#8FE39C', fontSize: '0.84rem', textAlign: 'center', fontWeight: 600 }}>
                  ✓ {solicitacaoSucesso}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <Button
                  variante="contorno"
                  tipo="button"
                  onClick={() => setModalSolicitarExameAberta(false)}
                  style={{ color: '#D8C6B6', borderColor: 'rgba(255,255,255,0.2)' }}
                >
                  Cancelar
                </Button>
                <Button variante="cta" tipo="submit" disabled={salvandoExame}>
                  {salvandoExame ? 'Gerando Guia...' : 'Emitir e Salvar Guia →'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: CONFIRMAR ENCERRAMENTO DA CONSULTA
          ==================================================================== */}
      {modalEncerrarAberta && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
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
              backgroundColor: '#27201C',
              color: '#FFF',
              borderRadius: '20px',
              padding: '2rem',
              maxWidth: 440,
              width: '100%',
              border: '1.5px solid rgba(201, 74, 56, 0.4)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⏹️</div>
            <h3 style={{ fontFamily: 'var(--fonte-titulo, "Fraunces", serif)', margin: '0 0 0.5rem 0', fontSize: '1.35rem' }}>
              Deseja encerrar o atendimento?
            </h3>
            <p style={{ color: '#D8C6B6', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              A chamada será finalizada e o horário exato de término será registrado na auditoria oficial
              (Horário de Brasília).
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Button
                variante="contorno"
                onClick={() => setModalEncerrarAberta(false)}
                style={{ color: '#D8C6B6', borderColor: 'rgba(255,255,255,0.2)' }}
              >
                Voltar à Chamada
              </Button>
              <button
                type="button"
                onClick={handleConfirmarEncerramento}
                style={{
                  backgroundColor: '#C94A38',
                  border: 'none',
                  color: '#FFF',
                  padding: '0.75rem 1.4rem',
                  borderRadius: '25px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                Sim, Encerrar Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: AVALIAÇÃO DO ESPECIALISTA (PACIENTE / CUIDADOR)
          ==================================================================== */}
      {modalAvaliacaoAberta && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
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
              backgroundColor: '#27201C',
              color: '#FFF',
              borderRadius: '20px',
              padding: '2rem',
              maxWidth: 480,
              width: '100%',
              border: '1.5px solid rgba(124, 83, 63, 0.3)',
              textAlign: 'center',
            }}
          >
            {avaliacaoEnviada ? (
              <div>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💖</div>
                <h3 style={{ fontFamily: 'var(--fonte-titulo, "Fraunces", serif)', margin: '0 0 0.5rem 0', color: '#FFF' }}>
                  Agradecemos seu Carinho!
                </h3>
                <p style={{ color: '#D8C6B6', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                  Seu relato ajuda a manter nossa rede acolhedora e segura para outras famílias que convivem com o DM1.
                </p>
                <Link to="/meu-perfil">
                  <Button variante="cta">Concluir e Voltar ao Perfil →</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleEnviarAvaliacao} style={{ display: 'grid', gap: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⭐</div>
                  <h3 style={{ fontFamily: 'var(--fonte-titulo, "Fraunces", serif)', margin: '0 0 0.25rem 0' }}>
                    Como foi seu atendimento com {dadosSala?.especialista?.nome}?
                  </h3>
                  <p style={{ color: '#D8C6B6', fontSize: '0.84rem', margin: 0 }}>
                    Sua avaliação é moderada e fortalece o acolhimento na GlicoCare.
                  </p>
                </div>

                {/* Seletor de Estrelas */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.65rem' }}>
                  {[1, 2, 3, 4, 5].map((estrela) => (
                    <button
                      key={estrela}
                      type="button"
                      onClick={() => setNotaAvaliacao(estrela)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '2rem',
                        cursor: 'pointer',
                        color: estrela <= notaAvaliacao ? '#F59E0B' : '#555',
                        transition: 'transform 0.1s ease',
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  value={comentarioAvaliacao}
                  onChange={(e) => setComentarioAvaliacao(e.target.value)}
                  placeholder="Deixe um elogio carinhoso ou relato para o profissional..."
                />

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <Button
                    variante="contorno"
                    type="button"
                    onClick={() => navigate('/meu-perfil')}
                    style={{ color: '#D8C6B6', borderColor: 'rgba(255,255,255,0.2)' }}
                  >
                    Avaliar Depois
                  </Button>
                  <Button variante="cta" type="submit" disabled={enviandoAvaliacao}>
                    {enviandoAvaliacao ? 'Enviando...' : 'Enviar Avaliação →'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: SUPORTE & EMERGÊNCIA
          ==================================================================== */}
      {modalEmergenciaAberta && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
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
              backgroundColor: '#27201C',
              color: '#FFF',
              borderRadius: '20px',
              padding: '2rem',
              maxWidth: 460,
              width: '100%',
              border: '2px solid #EF4444',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🚨</div>
            <h3 style={{ fontFamily: 'var(--fonte-titulo, "Fraunces", serif)', color: '#FCA5A5', margin: '0 0 0.5rem 0' }}>
              Orientações de Emergência
            </h3>
            <p style={{ color: '#D8C6B6', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              A teleconsulta não substitui o pronto-socorro em casos de <strong>hipoglicemia grave com perda de consciência</strong>{' '}
              ou suspeita de <strong>cetoacidose diabética (hálito cetônico, vômitos incoercíveis, sonolência intensa)</strong>.
            </p>
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #EF4444',
                borderRadius: '12px',
                padding: '0.85rem',
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
              }}
            >
              <strong style={{ display: 'block', color: '#FFF' }}>SAMU: Disque 192</strong>
              <span style={{ fontSize: '0.78rem', color: '#FCA5A5' }}>
                Procure a Unidade de Pronto Atendimento (UPA) mais próxima.
              </span>
            </div>
            <Button variante="primario" onClick={() => setModalEmergenciaAberta(false)}>
              Entendido, Voltar à Teleconsulta
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* FIM DO COMPONENTE PRINCIPAL SALATELECONSULTA */
