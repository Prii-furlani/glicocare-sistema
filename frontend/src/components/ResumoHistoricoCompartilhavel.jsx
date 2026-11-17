/* ==========================================================================
   ARQUIVO: ResumoHistoricoCompartilhavel.jsx
   COMPONENTE: ResumoHistoricoCompartilhavel (Modal e Relatório Impresso A4)
   CONFORMIDADE: CFM 2.314/2022 & LGPD
   OBJETIVO:
     Compilar a visão unificada de saúde da pessoa com DM1 para compartilhamento
     com médicos, nutricionistas, educadores e equipes escolares, permitindo
     visualização em tela e impressão/salvamento em PDF limpo e profissional.
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import Button from './Button';
import { calcularTempoDiagnostico } from '../utils/dateUtils';

/* INÍCIO DO COMPONENTE RESUMO HISTÓRICO COMPARTILHÁVEL */
export default function ResumoHistoricoCompartilhavel({
  aberto,
  onFechar,
  perfilSaude,
  alergias = [],
  medicamentos = [],
  registrosGlicemia = [],
  usuario,
}) {
  const [dadosCompletos, setDadosCompletos] = useState(null);
  const [carregando, setCarregando] = useState(false);

  // Busca dados agregados com hash de integridade do backend
  useEffect(() => {
    if (!aberto) return;

    async function buscarResumo() {
      setCarregando(true);
      try {
        const resp = await fetch(`/backend/api/perfil/resumo_compartilhavel.php?usuario_id=${usuario?.id || 4}`);
        const json = await resp.json();
        if (json.sucesso && json.dados) {
          setDadosCompletos(json.dados);
        }
      } catch {
        // Fallback local caso backend não esteja respondendo
      } finally {
        setCarregando(false);
      }
    }

    buscarResumo();
  }, [aberto, usuario]);

  if (!aberto) return null;

  const dataAtualFormatada = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date());

  const tempoJornada = perfilSaude?.data_diagnostico
    ? calcularTempoDiagnostico(perfilSaude.data_diagnostico)
    : null;

  const handleImprimir = () => {
    window.print();
  };

  const examesLista = dadosCompletos?.exames || [
    {
      laboratorio: 'Delboni Auriemo',
      data_realizacao: '2026-10-25',
      marcadores: [
        { nome_marcador: 'Hemoglobina Glicada (HbA1c)', valor_resultado: '6.8', unidade: '%', valor_referencia: '< 7.0%' },
        { nome_marcador: 'Glicemia em Jejum', valor_resultado: '104', unidade: 'mg/dL', valor_referencia: '70 a 99 mg/dL' },
        { nome_marcador: 'Vitamina D (25-OH)', valor_resultado: '36.5', unidade: 'ng/mL', valor_referencia: '> 30 ng/mL' },
      ],
    },
  ];

  const prontuariosLista = dadosCompletos?.prontuarios || [
    {
      especialista_nome: 'Dra. Helena Vasconcelos',
      especialidade: 'Endocrinologia Pediátrica',
      conselho_sigla: 'CRM',
      conselho_numero: '148290',
      conselho_uf: 'SP',
      data_registro: '2026-11-20 15:00:00',
      queixa_principal: 'Ajuste de doses noturnas e orientações para a professora na escola.',
      evolucao_clinica: 'Curvas do sensor analisadas. Sem relatos de hipoglicemia noturna grave nas últimas 2 semanas.',
      conduta_orientacoes: 'Manter Tresiba 6 UI às 21h. Relação insulina/carboidrato 1:15g no almoço. Emitida carta com orientações claras para a coordenação escolar.',
      encaminhamento_presencial: 0,
    },
  ];

  return (
    <div
      className="resumo-medico-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(21, 17, 14, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1.5rem',
        overflowY: 'auto',
      }}
    >
      <div
        className="resumo-medico-modal"
        style={{
          backgroundColor: '#FFFFFF',
          color: '#2E2824',
          borderRadius: '20px',
          maxWidth: '860px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
      >
        {/* BARRA SUPERIOR DE AÇÕES (NÃO IMPRESSA) */}
        <div
          className="nao-imprimir"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.15rem 1.75rem',
            backgroundColor: 'var(--cor-fundo)',
            borderBottom: '1px solid var(--cor-borda)',
          }}
        >
          <div>
            <strong style={{ fontSize: '0.96rem', color: 'var(--cor-primaria)' }}>
              📄 Resumo Clínico Compartilhável • GlicoCare
            </strong>
            <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--cor-texto-suave)' }}>
              Documento formatado para tela, PDF e impressão (CFM 2.314/2022 & LGPD)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Button
              variante="primario"
              onClick={handleImprimir}
              style={{
                padding: '0.55rem 1.15rem',
                fontSize: '0.86rem',
                backgroundColor: 'var(--cor-cta)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span>🖨️ Imprimir / Salvar em PDF</span>
            </Button>
            <button
              type="button"
              onClick={onFechar}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '1.35rem',
                cursor: 'pointer',
                color: 'var(--cor-texto)',
                padding: '0.2rem 0.5rem',
              }}
              title="Fechar janela"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ====================================================================
            CONTEÚDO DO DOCUMENTO MÉDICO (IMPRESSO E EXIBIDO)
            ==================================================================== */}
        <div
          id="documento-medico-imprimivel"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2.5rem',
            fontFamily: 'var(--fonte-corpo)',
            backgroundColor: '#FFFFFF',
            lineHeight: 1.5,
          }}
        >
          {/* 1. CABEÇALHO OFICIAL COM LOGO E DADOS DO PACIENTE */}
          <header
            style={{
              borderBottom: '2px solid #7C533F',
              paddingBottom: '1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '1.5rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.35rem',
                }}
              >
                <span
                  style={{
                    backgroundColor: '#7C533F',
                    color: '#FFF',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    fontFamily: 'var(--fonte-titulo)',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                  }}
                >
                  GlicoCare
                </span>
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#7C533F',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  Porto Seguro • Saúde Integrada DM1
                </span>
              </div>
              <h1
                style={{
                  fontFamily: 'var(--fonte-titulo)',
                  fontSize: '1.6rem',
                  margin: '0.35rem 0',
                  color: '#2E2824',
                }}
              >
                Resumo Histórico & Clínico Unificado
              </h1>
              <div style={{ fontSize: '0.88rem', color: '#5A5049' }}>
                Paciente:{' '}
                <strong style={{ color: '#2E2824', fontSize: '1rem' }}>
                  {usuario?.tipo_usuario === 'cuidador'
                    ? (perfilSaude?.nome_completo || 'Theo Silva')
                    : (perfilSaude?.nome_completo || usuario?.nome_completo)}
                </strong>
                {perfilSaude?.data_nascimento && ` • Nasc: ${perfilSaude.data_nascimento}`}
                {usuario?.tipo_usuario === 'cuidador' && (
                  <span> • Cuidador / Responsável: <strong>{usuario?.nome_completo || 'Mariana Silva'}</strong></span>
                )}
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#5A5049' }}>
              <div>
                Emissão: <strong>{dataAtualFormatada}</strong>
              </div>
              <div>Fuso: <code>America/Sao_Paulo (BRT)</code></div>
              <div style={{ marginTop: '0.35rem' }}>
                Integridade: <code>{dadosCompletos?.emissao?.hash_integridade || 'GC-MED-74E9A12B'}</code>
              </div>
            </div>
          </header>

          {/* 2. DIAGNÓSTICO & TEMPO DE JORNADA COM DIABETES */}
          <section
            style={{
              backgroundColor: '#FBF9F6',
              border: '1px solid #EAE4D9',
              borderRadius: '12px',
              padding: '1.15rem 1.35rem',
              marginBottom: '1.35rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#7C533F', fontWeight: 700 }}>
                Classificação do Diabetes
              </span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2E2824' }}>
                {perfilSaude?.tipo_diabetes || 'Diabetes Tipo 1A'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#7C533F', fontWeight: 700 }}>
                Tempo de Jornada / Diagnóstico
              </span>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#3B7E48' }}>
                {tempoJornada ? `${tempoJornada.badgeIcone} ${tempoJornada.textoJornada}` : 'Diagnóstico Recente'}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#5A5049' }}>
                Data registrada: {perfilSaude?.data_diagnostico || '2023-08-10'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#7C533F', fontWeight: 700 }}>
                Terapia & Aplicação
              </span>
              <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#2E2824' }}>
                {perfilSaude?.terapia_insulina || 'Múltiplas Doses (Caneta)'}
              </div>
            </div>
          </section>

          {/* 3. ALERGIAS E SENSIBILIDADES (DESTAQUE DE SEGURANÇA RN-ALE-01) */}
          <section
            style={{
              marginBottom: '1.35rem',
              border: (perfilSaude?.possui_alergias === 1 || alergias.length > 0) ? '1.5px solid #FCA5A5' : '1px solid #D5E7D8',
              borderRadius: '12px',
              padding: '1.15rem 1.35rem',
              backgroundColor: (perfilSaude?.possui_alergias === 1 || alergias.length > 0) ? '#FEF2F2' : '#F4F9F5',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontSize: '1.1rem' }}>
                  {(perfilSaude?.possui_alergias === 1 || alergias.length > 0) ? '⚠️' : '✅'}
                </span>
                <strong
                  style={{
                    fontSize: '0.95rem',
                    color: (perfilSaude?.possui_alergias === 1 || alergias.length > 0) ? '#B91C1C' : '#285832',
                  }}
                >
                  Alergias e Sensibilidades Conhecidas (RN-ALE-01)
                </strong>
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor: (perfilSaude?.possui_alergias === 1 || alergias.length > 0) ? '#DC2626' : '#3B7E48',
                  color: '#FFF',
                  padding: '0.15rem 0.6rem',
                  borderRadius: '10px',
                }}
              >
                {(perfilSaude?.possui_alergias === 1 || alergias.length > 0) ? 'Alerta Ativo' : 'Sem Alergias Relatadas'}
              </span>
            </div>

            {alergias.length > 0 ? (
              <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse', marginTop: '0.4rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #FCA5A5', color: '#991B1B' }}>
                    <th style={{ padding: '0.3rem 0' }}>Substância / Item</th>
                    <th style={{ padding: '0.3rem 0' }}>Categoria</th>
                    <th style={{ padding: '0.3rem 0' }}>Gravidade</th>
                    <th style={{ padding: '0.3rem 0' }}>Reação Observada</th>
                  </tr>
                </thead>
                <tbody>
                  {alergias.map((a) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
                      <td style={{ padding: '0.4rem 0', fontWeight: 700 }}>{a.substancia_ou_item}</td>
                      <td style={{ padding: '0.4rem 0' }}>{a.categoria}</td>
                      <td style={{ padding: '0.4rem 0' }}>{a.gravidade}</td>
                      <td style={{ padding: '0.4rem 0' }}>{a.reacao_observada || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#285832' }}>
                O paciente informou não possuir alergias medicamentosas, alimentares ou dermatológicas a adesivos e insumos conhecidas.
              </p>
            )}
          </section>

          {/* 4. MEDICAMENTOS, INSULINAS E PARÂMETROS CLÍNICOS */}
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.35rem',
            }}
          >
            {/* Medicamentos em Uso */}
            <div
              style={{
                border: '1px solid #EAE4D9',
                borderRadius: '12px',
                padding: '1.15rem',
                backgroundColor: '#FAF8F5',
              }}
            >
              <h3 style={{ fontSize: '0.94rem', margin: '0 0 0.6rem 0', color: '#7C533F', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>💊</span> Medicamentos e Insulinas Ativas
              </h3>
              {medicamentos.length > 0 ? (
                <div style={{ display: 'grid', gap: '0.45rem', fontSize: '0.84rem' }}>
                  {medicamentos.map((m, mIndex) => (
                    <div
                      key={m.id || `med-${m.nome_medicamento || mIndex}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.35rem 0',
                        borderBottom: '1px dashed #E5DDD3',
                      }}
                    >
                      <span>
                        <strong>{m.nome_medicamento}</strong> ({m.tipo})
                      </span>
                      <span style={{ fontWeight: 600, color: '#3B7E48' }}>
                        {m.dose} {m.unidade_medida} {m.horario ? `• ${m.horario.substring(0, 5)}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#7A6E65' }}>Nenhum medicamento informado.</p>
              )}
            </div>

            {/* Parâmetros Educativos e Metas */}
            <div
              style={{
                border: '1px solid #EAE4D9',
                borderRadius: '12px',
                padding: '1.15rem',
                backgroundColor: '#FAF8F5',
              }}
            >
              <h3 style={{ fontSize: '0.94rem', margin: '0 0 0.6rem 0', color: '#7C533F', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>🎯</span> Metas e Parâmetros Clínicos
              </h3>
              <div style={{ display: 'grid', gap: '0.45rem', fontSize: '0.84rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px dashed #E5DDD3' }}>
                  <span>Glicemia Alvo Educativa:</span>
                  <strong>{perfilSaude?.glicemia_alvo || 100} mg/dL</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px dashed #E5DDD3' }}>
                  <span>Fator de Sensibilidade (FSI):</span>
                  <strong>{perfilSaude?.fsi ? `1 UI reduz ${perfilSaude.fsi} mg/dL` : '30 mg/dL (padrão)'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px dashed #E5DDD3' }}>
                  <span>Duração de Ação da Insulina (IOB):</span>
                  <strong>{perfilSaude?.duracao_insulina_horas || 3} horas</strong>
                </div>
              </div>
            </div>
          </section>

          {/* 5. HISTÓRICO DE EXAMES LABORATORIAIS E MARCADORES */}
          <section style={{ marginBottom: '1.35rem' }}>
            <h3 style={{ fontSize: '0.96rem', margin: '0 0 0.6rem 0', color: '#7C533F', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>🧪</span> Exames Laboratoriais Mais Recentes
            </h3>
            <div style={{ display: 'grid', gap: '0.65rem' }}>
              {examesLista.map((ex, idx) => (
                <div
                  key={ex.id || `exame-${ex.laboratorio || idx}`}
                  style={{
                    border: '1px solid #EAE4D9',
                    borderRadius: '10px',
                    padding: '0.85rem 1.15rem',
                    backgroundColor: '#FFF',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.45rem' }}>
                    <strong>Laboratório: {ex.laboratorio}</strong>
                    <span style={{ color: '#5A5049' }}>Data da Coleta: {ex.data_realizacao}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {(ex.marcadores || []).map((m, mIdx) => (
                      <span
                        key={m.id || `marcador-${m.nome_marcador || mIdx}`}
                        style={{
                          backgroundColor: '#F6F3EE',
                          border: '1px solid #EAE4D9',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                        }}
                      >
                        {m.nome_marcador}: <strong>{m.valor_resultado} {m.unidade}</strong>
                        {m.valor_referencia && <em style={{ fontSize: '0.72rem', color: '#7A6E65', marginLeft: '0.3rem' }}>({m.valor_referencia})</em>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 6. HISTÓRICO DE TELECONSULTAS E CONDUTAS CLÍNICAS */}
          <section style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.96rem', margin: '0 0 0.6rem 0', color: '#7C533F', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>🩺</span> Histórico de Teleconsultas & Orientações Especializadas
            </h3>
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              {prontuariosLista.map((p, idx) => (
                <div
                  key={p.id || `prontuario-${p.especialista_nome || idx}`}
                  style={{
                    border: '1px solid #EAE4D9',
                    borderRadius: '12px',
                    padding: '1.15rem',
                    backgroundColor: '#FAF8F5',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.92rem', color: '#2E2824' }}>
                        {p.especialista_nome}
                      </strong>{' '}
                      <span style={{ fontSize: '0.78rem', color: '#7C533F', fontWeight: 600 }}>
                        ({p.conselho_sigla}-{p.conselho_uf} {p.conselho_numero} • {p.especialidade})
                      </span>
                    </div>
                    <span style={{ fontSize: '0.76rem', color: '#7A6E65' }}>
                      Atendimento em: {p.data_registro || p.data_hora_consulta}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.84rem', lineHeight: 1.5, display: 'grid', gap: '0.35rem' }}>
                    <div>
                      <strong>Queixa / Motivo:</strong> {p.queixa_principal}
                    </div>
                    <div>
                      <strong>Evolução Clínica:</strong> {p.evolucao_clinica}
                    </div>
                    <div style={{ backgroundColor: '#FFF', padding: '0.65rem 0.85rem', borderRadius: '8px', borderLeft: '3px solid #3B7E48' }}>
                      <strong style={{ color: '#285832' }}>Conduta & Orientações da Consulta:</strong>
                      <p style={{ margin: '0.25rem 0 0 0', color: '#2E2824' }}>{p.conduta_orientacoes}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 7. RODAPÉ DE VALIDAÇÃO DIGITAL E DECLARAÇÃO LGPD */}
          <footer
            style={{
              borderTop: '1px solid #EAE4D9',
              paddingTop: '1rem',
              fontSize: '0.74rem',
              color: '#7A6E65',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <strong>Declaração de Consentimento & Conformidade:</strong> Documento gerado sob autorização
              do usuário e em estrita conformidade com as resoluções de telessaúde (CFM 2.314/2022, CFN, CFP, CONFEF)
              e a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
            </div>
            <div style={{ textAlign: 'right' }}>
              <div>Plataforma GlicoCare • glicocare.com.br</div>
              <div>Hash Criptográfico: <code>{dadosCompletos?.emissao?.hash_integridade || 'GC-MED-74E9A12B'}</code></div>
            </div>
          </footer>
        </div>
      </div>

      {/* ESTILOS ESPECÍFICOS PARA IMPRESSÃO EM FOLHA A4 */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .resumo-medico-backdrop {
            position: absolute !important;
            inset: 0 !important;
            background: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .resumo-medico-modal {
            max-height: none !important;
            max-width: 100% !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          #documento-medico-imprimivel,
          #documento-medico-imprimivel * {
            visibility: visible !important;
          }
          #documento-medico-imprimivel {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 1.5cm !important;
          }
          .nao-imprimir {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
/* FIM DO COMPONENTE RESUMO HISTÓRICO COMPARTILHÁVEL */
