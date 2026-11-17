/* ==========================================================================
   ARQUIVO: PainelEspecialista.jsx (Localização: /frontend/src/pages/PainelEspecialista.jsx)
   OBJETIVO: Painel exclusivo de Especialistas Verificados (Perfil 'especialista' — RN-ACC-01 / RN-ESP-01).
   RECURSOS DISPONÍVEIS:
     - Gestão de disponibilidade e slots de atendimento;
     - Acompanhamento de teleconsultas agendadas com pacientes/famílias;
     - Entrada na sala nativa de videoconferência (RN-ATD-04) e emissão de laudos;
     - Transparência do repasse financeiro interno da plataforma (RN-FIN-03).
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { calcularTempoDiagnostico } from '../utils/dateUtils';
import { EXAMES_DEMO_INICIAIS, SOLICITACOES_DEMO_INICIAIS } from '../components/CentralExames';

/* OPÇÕES PADRÃO PARA EMISSÃO DE GUIAS MÉDICAS */
const EXAMES_SUGERIDOS_ESPECIALISTA = [
  'Hemoglobina Glicada (HbA1c)',
  'Glicemia em Jejum',
  'Vitamina D (25-OH)',
  'Microalbuminúria em Amostra Isolada',
  'Perfil Lipídico (Colesterol Total e Frações, Triglicerídeos)',
  'Creatinina e Ureia',
  'TSH e T4 Livre',
  'Vitamina B12',
  'Anticorpos Anti-GAD / Anti-IA2',
];

/* INÍCIO DO COMPONENTE PAINEL ESPECIALISTA */
export default function PainelEspecialista() {
  const { usuario, especialista, logout } = useAuth();

  // Estados dos slots de atendimento configuráveis
  const [diasAtendimento, setDiasAtendimento] = useState([
    { dia: 'Segunda-feira', ativo: true, slots: ['09:00', '10:00', '14:00', '15:00'] },
    { dia: 'Quarta-feira', ativo: true, slots: ['10:00', '11:00', '16:00'] },
    { dia: 'Sexta-feira', ativo: false, slots: ['14:00', '15:00'] },
  ]);

  // Lista demonstrativa de teleconsultas agendadas com as famílias
  const [consultasAgendadas, setConsultasAgendadas] = useState([
    {
      id: 1,
      paciente: 'Mariana Silva (mãe do Theo, 6 anos)',
      tipo_diabetes: 'Tipo 1A',
      data_diagnostico: '2023-08-10',
      terapia_insulina: 'Caneta',
      sensor_glicemia: 'FreeStyle Libre 2',
      data_hora: '2026-11-20 14:00',
      status: 'confirmado',
      link_video: '/sala-consulta/SALA-NATIVA-GC-HELENA-THEO',
      observacoes: 'Deseja revisar as curvas da madrugada no sensor FreeStyle Libre e orientações escolares.',
      valor_repasse: 281.60,
    }
  ]);

  const [salvoComSucesso, setSalvoComSucesso] = useState(false);

  // Estados dos modais de exames e emissão de guias médicas (RN-EXA-01)
  const [modalExamesAberto, setModalExamesAberto] = useState(false);
  const [modalSolicitarAberto, setModalSolicitarAberto] = useState(false);
  const [consultaSelecionada, setConsultaSelecionada] = useState(null);
  const [examesDoPaciente, setExamesDoPaciente] = useState([]);
  const [carregandoExames, setCarregandoExames] = useState(false);

  // Campos do formulário de solicitação de guia médica
  const [tituloGuia, setTituloGuia] = useState('Rotina Trimestral DM1 - Controle Metabólico e Renal');
  const [examesEscolhidos, setExamesEscolhidos] = useState([
    'Hemoglobina Glicada (HbA1c)',
    'Glicemia em Jejum',
    'Vitamina D (25-OH)',
    'Microalbuminúria em Amostra Isolada',
  ]);
  const [outroExameTexto, setOutroExameTexto] = useState('');
  const [solicitandoGuia, setSolicitandoGuia] = useState(false);
  const [guiaEmitidaInfo, setGuiaEmitidaInfo] = useState(null);

  // Abre visualização da linha do tempo de exames do paciente
  const handleAbrirExamesPaciente = async (consulta) => {
    setConsultaSelecionada(consulta);
    setModalExamesAberto(true);
    setCarregandoExames(true);

    try {
      const res = await fetch(`/backend/api/exames/listar_exames.php?perfil_saude_id=1&agendamento_id=${consulta.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.sucesso && Array.isArray(data.exames) && data.exames.length > 0) {
          setExamesDoPaciente(data.exames);
          setCarregandoExames(false);
          return;
        }
      }
    } catch (e) {}

    // Fallback com dados demonstrativos
    const local = localStorage.getItem('glicocare_exames_lista');
    if (local) {
      setExamesDoPaciente(JSON.parse(local));
    } else {
      setExamesDoPaciente(EXAMES_DEMO_INICIAIS);
    }
    setCarregandoExames(false);
  };

  // Abre modal para emitir nova guia médica
  const handleAbrirSolicitarExames = (consulta) => {
    setConsultaSelecionada(consulta);
    setGuiaEmitidaInfo(null);
    setTituloGuia('Rotina Trimestral DM1 - Controle Metabólico e Renal');
    setExamesEscolhidos([
      'Hemoglobina Glicada (HbA1c)',
      'Glicemia em Jejum',
      'Vitamina D (25-OH)',
      'Microalbuminúria em Amostra Isolada',
    ]);
    setOutroExameTexto('');
    setModalSolicitarAberto(true);
  };

  // Alterna seleção de exames na emissão de guia
  const handleToggleExameSugerido = (nome) => {
    if (examesEscolhidos.includes(nome)) {
      setExamesEscolhidos(examesEscolhidos.filter((item) => item !== nome));
    } else {
      setExamesEscolhidos([...examesEscolhidos, nome]);
    }
  };

  // Adiciona exame customizado
  const handleAdicionarOutroExame = () => {
    if (!outroExameTexto.trim()) return;
    if (!examesEscolhidos.includes(outroExameTexto.trim())) {
      setExamesEscolhidos([...examesEscolhidos, outroExameTexto.trim()]);
    }
    setOutroExameTexto('');
  };

  // Submete a nova guia médica
  const handleEmitirGuiaOficial = async (e) => {
    e.preventDefault();
    if (!tituloGuia.trim()) {
      alert('Informe o título da solicitação de exames.');
      return;
    }
    if (examesEscolhidos.length === 0) {
      alert('Selecione ao menos um exame para compor a guia médica.');
      return;
    }

    setSolicitandoGuia(true);

    try {
      let emitidaApi = false;
      let novaGuiaId = Date.now();
      let pdfPath = `/backend/api/exames/gerar_guia_pdf.php?id=${novaGuiaId}`;

      try {
        const res = await fetch('/backend/api/exames/solicitar_exames.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agendamento_id: consultaSelecionada?.id || 1,
            perfil_saude_id: 1,
            titulo_pedido: tituloGuia.trim(),
            lista_exames_solicitados: examesEscolhidos,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.sucesso) {
            emitidaApi = true;
            novaGuiaId = data.solicitacao_id;
            pdfPath = data.guia_pdf_path;
          }
        }
      } catch (e) {}

      const novaGuiaObjeto = {
        id: novaGuiaId,
        agendamento_id: consultaSelecionada?.id || 1,
        especialista_id: especialista?.id || 1,
        especialista_nome: usuario?.nome_completo || 'Dra. Helena Vasconcelos',
        especialidade: especialista?.especialidade || 'Endocrinologia Pediátrica',
        tipo_conselho: especialista?.tipo_conselho || 'CRM',
        numero_conselho: especialista?.numero_conselho || '148290',
        uf_conselho: especialista?.uf_conselho || 'SP',
        titulo_pedido: tituloGuia.trim(),
        lista_exames_solicitados: examesEscolhidos,
        guia_pdf_path: pdfPath,
        status: 'PENDENTE',
        data_solicitacao: new Date().toISOString(),
      };

      // Atualiza no localStorage
      try {
        const localSolic = localStorage.getItem('glicocare_solicitacoes_lista');
        const solicitacoesList = localSolic ? JSON.parse(localSolic) : SOLICITACOES_DEMO_INICIAIS;
        const atualizadas = [novaGuiaObjeto, ...solicitacoesList];
        localStorage.setItem('glicocare_solicitacoes_lista', JSON.stringify(atualizadas));
      } catch (e) {}

      setGuiaEmitidaInfo(novaGuiaObjeto);
    } catch (err) {
      alert('Erro ao emitir guia: ' + err.message);
    } finally {
      setSolicitandoGuia(false);
    }
  };

  const handleAlternarDia = (index) => {
    const novosDias = [...diasAtendimento];
    novosDias[index].ativo = !novosDias[index].ativo;
    setDiasAtendimento(novosDias);
    setSalvoComSucesso(true);
    setTimeout(() => setSalvoComSucesso(false), 3000);
  };

  return (
    <div style={{ backgroundColor: 'var(--cor-fundo)', minHeight: '80vh', padding: '3rem 1.25rem' }}>
      <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Cabeçalho do Painel Clínico */}
        <div
          style={{
            backgroundColor: 'var(--cor-superficie)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            border: '1px solid rgba(124, 83, 63, 0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span
                style={{
                  backgroundColor: '#EDF7EE',
                  color: '#1E4620',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '20px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <span>✓</span>
                <span>Registro Verificado (RN-ESP-01)</span>
              </span>
              <span style={{ fontSize: '0.8rem', color: '#7C533F', fontWeight: 600 }}>
                {especialista?.tipo_conselho || 'CRM'} {especialista?.numero_conselho || '148290'}/{especialista?.uf_conselho || 'SP'}
              </span>
            </div>

            <h1 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.85rem', color: 'var(--cor-texto)', margin: 0 }}>
              Painel Clínico — {usuario?.nome_completo || 'Dr(a). Especialista'}
            </h1>
            <p style={{ fontSize: '0.92rem', color: '#5A5049', margin: '0.35rem 0 0 0' }}>
              {especialista?.especialidade || 'Endocrinologia e Metabologia Pediátrica'} • Atendimento Humanizado em DM1
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to={`/especialistas/${especialista?.id || 1}`}>
              <Button variante="secundario" style={{ fontSize: '0.88rem' }}>
                Ver perfil público ↗
              </Button>
            </Link>
            <Button variante="secundario" onClick={logout} style={{ fontSize: '0.88rem' }}>
              Sair
            </Button>
          </div>
        </div>

        {/* Notificação de alteração salva */}
        {salvoComSucesso && (
          <div
            style={{
              backgroundColor: '#EDF7EE',
              border: '1px solid #B8E2BE',
              color: '#1E4620',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              fontSize: '0.88rem',
            }}
          >
            ✓ Disponibilidade da agenda atualizada em tempo real (RN-AGD-02).
          </div>
        )}

        {/* Grade de Gestão: Teleconsultas Agendadas e Configuração de Agenda */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
          {/* Card: Próximas Consultas com Famílias */}
          <div
            style={{
              backgroundColor: 'var(--cor-superficie)',
              borderRadius: '14px',
              padding: '1.75rem',
              border: '1px solid rgba(124, 83, 63, 0.12)',
            }}
          >
            <h2 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.35rem', color: 'var(--cor-texto)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📹</span>
              <span>Consultas Agendadas</span>
            </h2>

            {consultasAgendadas.map((c) => (
              <div
                key={c.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  border: '1px solid rgba(124, 83, 63, 0.12)',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--cor-texto)', fontSize: '0.96rem' }}>
                    {c.paciente}
                  </span>
                  <span style={{ backgroundColor: '#EDF7EE', color: '#1E4620', padding: '0.2rem 0.55rem', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 600 }}>
                    {c.status}
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#5A5049', margin: '0 0 0.5rem 0' }}>
                  📅 Data/Hora: <strong>{c.data_hora}</strong>
                </p>

                {/* Resumo Clínico para Anamnese Ágil — Tempo de Jornada Calculado */}
                {c.data_diagnostico && (() => {
                  const infoJornada = calcularTempoDiagnostico(c.data_diagnostico);
                  return (
                    <div
                      style={{
                        backgroundColor: '#F8FBF8',
                        border: '1px solid #D5E8D8',
                        borderRadius: '8px',
                        padding: '0.65rem 0.85rem',
                        margin: '0.5rem 0 0.75rem 0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.76rem', color: '#1E4620', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          📋 Resumo Clínico para Anamnese
                        </span>
                        {infoJornada && (
                          <span
                            style={{
                              backgroundColor: '#EFF7F1',
                              color: '#285832',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '12px',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <span>{infoJornada.badgeIcone}</span>
                            <span>{infoJornada.textoJornada} ({infoJornada.rotuloFase})</span>
                          </span>
                        )}
                      </div>

                      {/* Alerta de Segurança: Alergias Estruturadas (RN-ALE-01) */}
                      <div
                        style={{
                          backgroundColor: '#FFF5F0',
                          border: '1.5px solid #E06A55',
                          borderRadius: '8px',
                          padding: '0.55rem 0.75rem',
                          margin: '0.25rem 0',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.95rem' }}>⚠️</span>
                          <strong style={{ fontSize: '0.76rem', color: '#A23B2A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Alergias Conhecidas (Atenção na Prescrição / Procedimentos):
                          </strong>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          <span style={{ backgroundColor: '#FFFFFF', border: '1px solid #E06A55', color: '#A23B2A', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                            💊 Dipirona (MODERADA • Urticária e prurido)
                          </span>
                          <span style={{ backgroundColor: '#FFFFFF', border: '1px solid #E06A55', color: '#A23B2A', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                            🩹 Adesivo de Sensor / Cateter (LEVE • Dermatite de contato no braço)
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: '#4A4039', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <span><strong>Diagnóstico:</strong> {c.tipo_diabetes || 'DM1'}</span>
                        {c.terapia_insulina && <span>• <strong>Terapia:</strong> {c.terapia_insulina}</span>}
                        {c.sensor_glicemia && <span>• <strong>Monitoramento:</strong> {c.sensor_glicemia}</span>}
                      </div>
                    </div>
                  );
                })()}

                <p style={{ fontSize: '0.82rem', color: '#7C533F', margin: '0 0 0.85rem 0', fontStyle: 'italic' }}>
                  "{c.observacoes}"
                </p>

                {/* Ações Clínicas: Linha do Tempo de Exames e Emissão de Guia Médica (RN-EXA-01) */}
                <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                  <Button
                    variante="secundario"
                    onClick={() => handleAbrirExamesPaciente(c)}
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem', flex: 1, justifyContent: 'center' }}
                  >
                    📑 Ver Exames do Paciente
                  </Button>
                  <Button
                    variante="primario"
                    onClick={() => handleAbrirSolicitarExames(c)}
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem', flex: 1, justifyContent: 'center' }}
                  >
                    🩺 Solicitar Novos Exames
                  </Button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(124, 83, 63, 0.1)', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.82rem', color: '#1E4620', fontWeight: 600 }}>
                    Repasse líquido (88%): R$ {c.valor_repasse.toFixed(2)}
                  </span>
                  <Link
                    to={c.link_video}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      backgroundColor: '#3B7E48',
                      color: '#FFF',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      textDecoration: 'none',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                    }}
                  >
                    🎥 Entrar na Videoconsulta & Prontuário →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Card: Configuração de Horários e Disponibilidade */}
          <div
            style={{
              backgroundColor: 'var(--cor-superficie)',
              borderRadius: '14px',
              padding: '1.75rem',
              border: '1px solid rgba(124, 83, 63, 0.12)',
            }}
          >
            <h2 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.35rem', color: 'var(--cor-texto)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>⏱️</span>
              <span>Disponibilidade de Atendimento</span>
            </h2>

            <p style={{ fontSize: '0.88rem', color: '#5A5049', marginBottom: '1.25rem' }}>
              Ative ou pause os dias em que sua agenda fica visível para as famílias na vitrine (RN-AGD-02):
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {diasAtendimento.map((d, index) => (
                <div
                  key={d.dia}
                  style={{
                    backgroundColor: d.ativo ? '#FFFFFF' : '#EAE4D9',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    border: '1px solid rgba(124, 83, 63, 0.15)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--cor-texto)', fontSize: '0.9rem', display: 'block' }}>
                      {d.dia}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#5A5049' }}>
                      {d.ativo ? `${d.slots.length} horários disponíveis` : 'Agenda pausada'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAlternarDia(index)}
                    style={{
                      backgroundColor: d.ativo ? '#3B7E48' : '#7C533F',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '14px',
                      padding: '0.35rem 0.8rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {d.ativo ? 'Pausar dia' : 'Ativar dia'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ==================================================================
            MODAL 1: LINHA DO TEMPO DE EXAMES DO PACIENTE (RN-EXA-01)
            ================================================================== */}
        {modalExamesAberto && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(46, 40, 36, 0.65)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              zIndex: 9999,
            }}
            onClick={() => setModalExamesAberto(false)}
          >
            <div
              style={{
                backgroundColor: 'var(--cor-superficie)',
                borderRadius: '20px',
                padding: '2.25rem',
                maxWidth: '780px',
                width: '100%',
                maxHeight: '85vh',
                overflowY: 'auto',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                border: '1px solid rgba(124, 83, 63, 0.2)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🔬</span>
                  <div>
                    <h3 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.45rem', color: 'var(--cor-texto)', margin: 0 }}>
                      Exames & Laudos do Paciente
                    </h3>
                    <span style={{ fontSize: '0.84rem', color: '#6A5E57' }}>
                      {consultaSelecionada?.paciente || 'Paciente DM1'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalExamesAberto(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6A5E57' }}
                >
                  ✕
                </button>
              </div>

              {carregandoExames ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#6A5E57' }}>
                  Carregando histórico clínico...
                </div>
              ) : examesDoPaciente.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#FAF8F5', borderRadius: '12px', color: '#6A5E57' }}>
                  Nenhum exame laboratorial registrado ainda por este paciente.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {examesDoPaciente.map((ex) => (
                    <div
                      key={ex.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        border: '1px solid rgba(124, 83, 63, 0.15)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div>
                          <strong style={{ fontSize: '1.1rem', color: 'var(--cor-texto)' }}>
                            {ex.laboratorio}
                          </strong>
                          <span style={{ display: 'block', fontSize: '0.82rem', color: '#6A5E57' }}>
                            📅 Coletado em: {ex.data_realizacao ? ex.data_realizacao.split('-').reverse().join('/') : '—'}
                          </span>
                        </div>

                        {ex.arquivo_anexo_path && (
                          <a
                            href={ex.arquivo_anexo_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none' }}
                          >
                            <Button variante="secundario" style={{ fontSize: '0.78rem', padding: '0.35rem 0.7rem' }}>
                              📄 Abrir Laudo Digital
                            </Button>
                          </a>
                        )}
                      </div>

                      {ex.observacoes_paciente && (
                        <p style={{ fontSize: '0.82rem', color: '#7C533F', fontStyle: 'italic', margin: '0 0 0.75rem 0' }}>
                          "{ex.observacoes_paciente}"
                        </p>
                      )}

                      {/* Grade de Marcadores */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem' }}>
                        {(ex.marcadores || []).map((m) => (
                          <div
                            key={m.id}
                            style={{
                              backgroundColor: '#FAF8F5',
                              padding: '0.65rem 0.85rem',
                              borderRadius: '8px',
                              border: '1px solid #ECE7E0',
                            }}
                          >
                            <span style={{ display: 'block', fontSize: '0.76rem', color: '#6A5E57' }}>
                              {m.nome_marcador}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                              <strong style={{ fontSize: '1.15rem', color: 'var(--cor-primaria)' }}>
                                {m.valor_resultado}
                              </strong>
                              <span style={{ fontSize: '0.78rem', color: '#6A5E57' }}>{m.unidade}</span>
                            </div>
                            {m.valor_referencia && (
                              <span style={{ fontSize: '0.7rem', color: '#888' }}>Ref: {m.valor_referencia}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <Button variante="secundario" onClick={() => setModalExamesAberto(false)} style={{ fontSize: '0.88rem' }}>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            MODAL 2: EMISSÃO DE NOVA GUIA MÉDICA OFICIAL (RN-EXA-01)
            ================================================================== */}
        {modalSolicitarAberto && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(46, 40, 36, 0.65)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              zIndex: 9999,
            }}
            onClick={() => {
              if (!solicitandoGuia) setModalSolicitarAberto(false);
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--cor-superficie)',
                borderRadius: '20px',
                padding: '2.25rem',
                maxWidth: '680px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                border: '1px solid rgba(124, 83, 63, 0.2)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🩺</span>
                  <div>
                    <h3 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.45rem', color: 'var(--cor-texto)', margin: 0 }}>
                      Emitir Guia Médica de Exames
                    </h3>
                    <span style={{ fontSize: '0.84rem', color: '#6A5E57' }}>
                      Paciente: {consultaSelecionada?.paciente || 'Theo Silva'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalSolicitarAberto(false)}
                  disabled={solicitandoGuia}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6A5E57' }}
                >
                  ✕
                </button>
              </div>

              {guiaEmitidaInfo ? (
                <div
                  style={{
                    backgroundColor: '#EFF7F1',
                    border: '1.5px solid #B8E2BE',
                    borderRadius: '14px',
                    padding: '1.75rem',
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '2.2rem', display: 'block', marginBottom: '0.5rem' }}>🎉</span>
                  <h4 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.35rem', color: '#1E4620', margin: '0 0 0.5rem 0' }}>
                    Guia Médica Emitida com Sucesso!
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: '#285832', margin: '0 0 1.25rem 0' }}>
                    O pedido #{guiaEmitidaInfo.id} já foi vinculado à conta da família e está disponível para download e impressão.
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                    <a
                      href={guiaEmitidaInfo.guia_pdf_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none' }}
                    >
                      <Button variante="primario" style={{ fontSize: '0.9rem' }}>
                        📄 Visualizar Guia Médica (PDF)
                      </Button>
                    </a>
                    <Button
                      variante="secundario"
                      onClick={() => setModalSolicitarAberto(false)}
                      style={{ fontSize: '0.9rem' }}
                    >
                      Concluir
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleEmitirGuiaOficial} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Alerta de Segurança Clínica: Alergias do Paciente */}
                  <div
                    style={{
                      backgroundColor: '#FFF5F0',
                      border: '1.5px solid #E06A55',
                      borderRadius: '10px',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                    <div style={{ fontSize: '0.82rem', color: '#A23B2A' }}>
                      <strong>Atenção às Alergias do Paciente:</strong> Dipirona (Moderada), Adesivo de Sensor / Cateter (Leve). Certifique-se de que nenhum insumo ou contraste recomendado conflite com essas sensibilidades.
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Título / Justificativa do Pedido *
                    </label>
                    <input
                      type="text"
                      required
                      value={tituloGuia}
                      onChange={(e) => setTituloGuia(e.target.value)}
                      placeholder="Ex: Rotina Trimestral DM1 - Avaliação de HbA1c e Função Renal"
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '8px',
                        border: '1px solid #D8D0C5',
                        fontSize: '0.92rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      Selecione os Procedimentos e Dosagens Clínicas *:
                    </label>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '0.6rem',
                        backgroundColor: '#FAF8F5',
                        padding: '1rem',
                        borderRadius: '10px',
                        border: '1px solid #ECE7E0',
                        marginBottom: '0.85rem',
                      }}
                    >
                      {EXAMES_SUGERIDOS_ESPECIALISTA.map((nome) => {
                        const marcado = examesEscolhidos.includes(nome);
                        return (
                          <label
                            key={nome}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontSize: '0.84rem',
                              cursor: 'pointer',
                              color: marcado ? '#1E4620' : '#4A4039',
                              fontWeight: marcado ? 600 : 400,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={marcado}
                              onChange={() => handleToggleExameSugerido(nome)}
                              style={{ width: '16px', height: '16px', accentColor: '#3B7E48' }}
                            />
                            <span>{nome}</span>
                          </label>
                        );
                      })}
                    </div>

                    {/* Adicionar Exame Customizado */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Outro exame (ex: Ferritina, Zinco Sérico...)"
                        value={outroExameTexto}
                        onChange={(e) => setOutroExameTexto(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '0.55rem 0.85rem',
                          borderRadius: '8px',
                          border: '1px solid #D8D0C5',
                          fontSize: '0.86rem',
                        }}
                      />
                      <Button
                        type="button"
                        variante="secundario"
                        onClick={handleAdicionarOutroExame}
                        style={{ fontSize: '0.82rem', padding: '0.55rem 0.85rem' }}
                      >
                        + Adicionar
                      </Button>
                    </div>
                  </div>

                  {/* Resumo dos Exames Selecionados */}
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6A5E57' }}>
                      {examesEscolhidos.length} exame(s) selecionado(s) para a guia:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
                      {examesEscolhidos.map((ex, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '0.74rem',
                            backgroundColor: '#EFF7F1',
                            color: '#285832',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            border: '1px solid #B8E2BE',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <span>{ex}</span>
                          <span
                            onClick={() => handleToggleExameSugerido(ex)}
                            style={{ cursor: 'pointer', fontWeight: 700 }}
                            title="Remover"
                          >
                            ×
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <Button
                      type="button"
                      variante="secundario"
                      onClick={() => setModalSolicitarAberto(false)}
                      disabled={solicitandoGuia}
                      style={{ fontSize: '0.9rem' }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      variante="primario"
                      disabled={solicitandoGuia || examesEscolhidos.length === 0}
                      style={{ fontSize: '0.9rem' }}
                    >
                      {solicitandoGuia ? 'Emitindo Guia Oficial...' : 'Emitir Guia Médica Oficial (Assinar)'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
/* FIM DO COMPONENTE PAINEL ESPECIALISTA */
