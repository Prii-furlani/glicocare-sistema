/* ==========================================================================
   ARQUIVO: PainelEspecialista.jsx (Localização: /frontend/src/pages/PainelEspecialista.jsx)
   OBJETIVO: Painel exclusivo de Especialistas Verificados (Perfil 'especialista' — RN-ACC-01 / RN-ESP-01).
   RECURSOS DISPONÍVEIS:
     - Gestão de disponibilidade e slots de atendimento;
     - Acompanhamento de teleconsultas agendadas com pacientes/famílias;
     - Entrada na sala nativa de videoconferência (RN-ATD-04) e emissão de laudos;
     - Transparência do repasse financeiro interno da plataforma (RN-FIN-03).
   ========================================================================== */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { calcularTempoDiagnostico } from '../utils/dateUtils';

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
      link_video: '/atendimento-nativo/SALA-NATIVA-GC-HELENA-THEO',
      observacoes: 'Deseja revisar as curvas da madrugada no sensor FreeStyle Libre e orientações escolares.',
      valor_repasse: 281.60,
    }
  ]);

  const [salvoComSucesso, setSalvoComSucesso] = useState(false);

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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(124, 83, 63, 0.1)', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.82rem', color: '#1E4620', fontWeight: 600 }}>
                    Repasse líquido (88%): R$ {c.valor_repasse.toFixed(2)}
                  </span>
                  <Link
                    to={c.link_video}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      color: '#3B7E48',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      textDecoration: 'underline',
                    }}
                  >
                    Entrar na sala de vídeo →
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
      </div>
    </div>
  );
}
/* FIM DO COMPONENTE PAINEL ESPECIALISTA */
