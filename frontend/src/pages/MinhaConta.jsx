/* ==========================================================================
   ARQUIVO: MinhaConta.jsx (Localização: /frontend/src/pages/MinhaConta.jsx)
   OBJETIVO: Área do Paciente / Família DM1 (Perfil 'paciente' — RN-ACC-01).
   RECURSOS DISPONÍVEIS:
     - Dados do perfil familiar (nome, e-mail, contexto com DM1);
     - Lista de consultas agendadas com link da sala de teleconsulta nativa (RN-ATD-04);
     - Acesso facilitado para buscar especialistas e acervo de artigos.
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { agendamentosService } from '../services/api';
import Button from '../components/Button';

/* INÍCIO DO COMPONENTE MINHA CONTA */
export default function MinhaConta() {
  const { usuario, logout } = useAuth();
  const [consultas, setConsultas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Carrega histórico de consultas do usuário
    const carregarAgendamentos = async () => {
      try {
        const res = await agendamentosService.listarHorarios();
        if (res.data && res.data.sucesso && Array.isArray(res.data.dados)) {
          setConsultas(res.data.dados);
        }
      } catch (err) {
        console.warn('Não foi possível carregar consultas do servidor:', err);
        // Mock demonstrativo
        setConsultas([
          {
            id: 1,
            data_hora_consulta: '2026-11-20 14:00:00',
            especialista_nome: 'Dra. Helena Vasconcelos',
            especialidade: 'Endocrinologia Pediátrica',
            status_agendamento: 'confirmado',
            link_video_integrado: '/atendimento-nativo/SALA-NATIVA-GC-HELENA-THEO',
            valor_transacao_interna: 320.00,
          },
        ]);
      } finally {
        setCarregando(false);
      }
    };

    carregarAgendamentos();
  }, []);

  return (
    <div style={{ backgroundColor: 'var(--cor-fundo)', minHeight: '80vh', padding: '3rem 1.25rem' }}>
      <div className="container" style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Cabeçalho de Boas-Vindas */}
        <div
          style={{
            backgroundColor: 'var(--cor-superficie)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            border: '1px solid rgba(124, 83, 63, 0.15)',
            boxShadow: '0 8px 24px rgba(46, 40, 36, 0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#3B7E48', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
              — Espaço da Família DM1
            </div>
            <h1 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.85rem', color: 'var(--cor-texto)', margin: 0 }}>
              Olá, {usuario?.nome_completo || 'Familiar'}
            </h1>
            <p style={{ fontSize: '0.92rem', color: '#5A5049', margin: '0.4rem 0 0 0' }}>
              {usuario?.contexto_dm1 || 'Família que acolhe e cuida com serenidade'} • {usuario?.email}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/especialistas">
              <Button variante="primario" style={{ fontSize: '0.88rem' }}>
                Agendar nova consulta →
              </Button>
            </Link>
            <Button variante="secundario" onClick={logout} style={{ fontSize: '0.88rem' }}>
              Sair
            </Button>
          </div>
        </div>

        {/* Grade com Consultas e Atalhos Rápidos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Card: Próximas Consultas */}
          <div
            style={{
              backgroundColor: 'var(--cor-superficie)',
              borderRadius: '14px',
              padding: '1.75rem',
              border: '1px solid rgba(124, 83, 63, 0.12)',
            }}
          >
            <h2 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.35rem', color: 'var(--cor-texto)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🩺</span>
              <span>Minhas Teleconsultas</span>
            </h2>

            {carregando ? (
              <p style={{ color: '#5A5049', fontSize: '0.9rem' }}>Carregando seus atendimentos...</p>
            ) : consultas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#5A5049' }}>
                <p style={{ fontSize: '0.92rem', marginBottom: '1rem' }}>Você ainda não tem consultas agendadas.</p>
                <Link to="/especialistas">
                  <Button variante="secundario" style={{ fontSize: '0.85rem' }}>
                    Conhecer especialistas credenciados →
                  </Button>
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {consultas.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '10px',
                      padding: '1.15rem',
                      border: '1px solid rgba(124, 83, 63, 0.12)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--cor-texto)', fontSize: '0.95rem' }}>
                        {c.especialista_nome || 'Consulta GlicoCare'}
                      </span>
                      <span
                        style={{
                          backgroundColor: '#EDF7EE',
                          color: '#1E4620',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '12px',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                        }}
                      >
                        {c.status_agendamento || 'confirmado'}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.84rem', color: '#5A5049', margin: '0 0 0.85rem 0' }}>
                      📅 {new Date(c.data_hora_consulta).toLocaleString('pt-BR')} • {c.especialidade || 'Consulta clínica'}
                    </p>

                    {c.link_video_integrado && (
                      <Link
                        to={c.link_video_integrado}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.82rem',
                          color: '#3B7E48',
                          fontWeight: 600,
                          textDecoration: 'underline',
                        }}
                      >
                        🎥 Entrar na sala de vídeo nativa →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Recursos do Porto Seguro */}
          <div
            style={{
              backgroundColor: 'var(--cor-superficie)',
              borderRadius: '14px',
              padding: '1.75rem',
              border: '1px solid rgba(124, 83, 63, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h2 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.35rem', color: 'var(--cor-texto)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📖</span>
                <span>Seus Recursos e Acolhimento</span>
              </h2>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <li style={{ fontSize: '0.9rem', color: '#5A5049', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span>✓</span>
                  <span>Acesso ilimitado a todos os artigos e guias da Biblioteca</span>
                </li>
                <li style={{ fontSize: '0.9rem', color: '#5A5049', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span>✓</span>
                  <span>Envio de depoimentos com curadoria acolhedora (RN-MOD-01)</span>
                </li>
                <li style={{ fontSize: '0.9rem', color: '#5A5049', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span>✓</span>
                  <span>Teleconsultas com pagamento 100% interno e protegido (RN-FIN-03)</span>
                </li>
                <li style={{ fontSize: '0.9rem', color: '#5A5049', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span>✓</span>
                  <span>Triagem rápida com o mascote Lufy 24h</span>
                </li>
              </ul>
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(124, 83, 63, 0.12)' }}>
              <Link to="/biblioteca">
                <Button variante="secundario" style={{ width: '100%', fontSize: '0.88rem' }}>
                  Ir para a Biblioteca de Conteúdos →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
/* FIM DO COMPONENTE MINHA CONTA */
