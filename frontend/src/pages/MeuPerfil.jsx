/* ==========================================================================
   ARQUIVO: MeuPerfil.jsx (Localização: /frontend/src/pages/MeuPerfil.jsx)
   OBJETIVO: Página Pessoal de Perfil e Histórico para pessoas com diabetes
             e cuidadores, contendo cabeçalho pessoal, resumo de saúde,
             diário rápido de glicemia com feedback imediato por cores
             e linha do tempo auditável (RN-ACC-01 / RN-AUD-01).
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { calcularTempoDiagnostico } from '../utils/dateUtils';

/* INÍCIO DO COMPONENTE MEUPERFIL */
export default function MeuPerfil() {
  const navigate = useNavigate();
  const { usuario, token } = useAuth();

  // Estados de dados do perfil e medicamentos
  const [perfilSaude, setPerfilSaude] = useState(null);
  const [medicamentos, setMedicamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Estados do diário de glicemia
  const [registros, setRegistros] = useState([]);
  const [salvandoRegistro, setSalvandoRegistro] = useState(false);
  const [feedbackMedicao, setFeedbackMedicao] = useState(null);

  // Campos do formulário rápido de glicemia
  const [valorGlicemia, setValorGlicemia] = useState('');
  const [momentoMedicao, setMomentoMedicao] = useState('Antes da Refeicao');
  const [tipoLeitura, setTipoLeitura] = useState('Manual');
  const [acaoRealizada, setAcaoRealizada] = useState('Nenhuma Acao');
  const [doseInsulina, setDoseInsulina] = useState('');
  const [carbosG, setCarbosG] = useState('');
  const [fatorContexto, setFatorContexto] = useState('');
  const [dataHoraCustom, setDataHoraCustom] = useState('');
  const [observacoes, setObservacoes] = useState('');

  /**
   * Calcula a idade a partir da data de nascimento
   */
  const calcularIdade = (dataNasc) => {
    if (!dataNasc) return null;
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let anos = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      anos--;
    }
    return anos > 0 ? `${anos} anos` : 'Menos de 1 ano';
  };

  /**
   * Carrega perfil de saúde e histórico de glicemia via API ou fallback local seguro
   */
  const carregarDadosCompletos = async () => {
    setCarregando(true);
    let dadosCarregadosAPI = false;

    if (token) {
      try {
        // 1. Tenta carregar Perfil da API
        const resPerfil = await fetch('/backend/api/perfil/index.php', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resPerfil.ok) {
          const dataPerfil = await resPerfil.json();
          if (dataPerfil.sucesso && dataPerfil.dados.perfil_saude) {
            setPerfilSaude(dataPerfil.dados.perfil_saude);
            setMedicamentos(dataPerfil.dados.medicamentos || []);
            dadosCarregadosAPI = true;
          }
        }

        // 2. Tenta carregar Registros de Glicemia
        const resGlicemia = await fetch('/backend/api/glicemia/index.php', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resGlicemia.ok) {
          const dataGlicemia = await resGlicemia.json();
          if (dataGlicemia.sucesso && Array.isArray(dataGlicemia.dados) && dataGlicemia.dados.length > 0) {
            setRegistros(dataGlicemia.dados);
          }
        }
      } catch (err) {
        // Prossegue para fallback local em desenvolvimento
      }
    }

    // Fallback de desenvolvimento local via localStorage
    if (!dadosCarregadosAPI) {
      try {
        const perfilLocal = localStorage.getItem('glicocare_perfil_saude');
        if (perfilLocal) {
          setPerfilSaude(JSON.parse(perfilLocal));
        } else if (usuario) {
          // Perfil básico derivado do login
          setPerfilSaude({
            nome_completo: usuario.nome_completo || 'Lucas Mendes',
            tipo_diabetes: 'Tipo 1A',
            terapia_insulina: 'Caneta',
            data_nascimento: '2000-01-01',
            sexo: 'masculino',
            altura_cm: 175,
            peso_kg: 72,
            fatores_glicemia: { estresse: 'Sobe drasticamente', calor: 'Cai', exercicio: 'Cai' },
          });
        }

        const medsLocal = localStorage.getItem('glicocare_medicamentos');
        if (medsLocal) {
          setMedicamentos(JSON.parse(medsLocal));
        }

        const glicemiaLocal = localStorage.getItem('glicocare_glicemia_registros');
        if (glicemiaLocal) {
          setRegistros(JSON.parse(glicemiaLocal));
        }
      } catch (e) {}
    }

    setCarregando(false);
  };

  useEffect(() => {
    carregarDadosCompletos();
  }, [token]);

  /**
   * Avalia a glicemia e retorna o feedback acolhedor por cor
   */
  const obterClassificacaoGlicemica = (valor) => {
    const v = parseInt(valor, 10);
    if (isNaN(v) || v <= 0) return null;

    if (v < 70) {
      return {
        tipo: 'hipo',
        corFundo: '#FDF2F0',
        corBorda: '#E06A55',
        corTexto: '#A23B2A',
        icone: '⚠️',
        rotulo: 'Hipoglicemia (< 70 mg/dL)',
        orientacao: 'Respire com calma. Siga a regra dos 15g de carboidrato de ação rápida (ex: 150ml de suco ou água com açúcar) e meça novamente em 15 minutos.',
      };
    }
    if (v <= 140) {
      return {
        tipo: 'alvo',
        corFundo: '#EFF7F1',
        corBorda: '#3B7E48',
        corTexto: '#285832',
        icone: '🌱',
        rotulo: 'No Alvo Seguro (70 - 140 mg/dL)',
        orientacao: 'Excelente estabilidade! Glicemia perfeitamente equilibrada para seu bem-estar.',
      };
    }
    if (v <= 180) {
      return {
        tipo: 'atencao',
        corFundo: '#FFFDF0',
        corBorda: '#D4A338',
        corTexto: '#8C6818',
        icone: '☀️',
        rotulo: 'Leve Elevação Pós-Prandial (141 - 180 mg/dL)',
        orientacao: 'Comum após refeições. Acompanhe a curva de absorção com tranquilidade.',
      };
    }
    return {
      tipo: 'hiper',
      corFundo: '#FAF4EF',
      corBorda: '#C47451',
      corTexto: '#7C533F',
      icone: '💧',
      rotulo: 'Hiperglicemia (> 180 mg/dL)',
      orientacao: 'Lembre-se de beber bastante água para hidratação. Avalie junto ao seu plano médico a necessidade de um bolus de correção.',
    };
  };

  /**
   * Submete uma nova medição para o diário glicêmico
   */
  const handleRegistrarGlicemia = async (e) => {
    e.preventDefault();
    const v = parseInt(valorGlicemia, 10);
    if (!v || v <= 0) return;

    setSalvandoRegistro(true);

    const novaMedicao = {
      id: Date.now(),
      valor_mg_dl: v,
      momento_medicao: momentoMedicao,
      tipo_leitura: tipoLeitura,
      acao_realizada: acaoRealizada,
      dose_insulina: doseInsulina ? parseFloat(doseInsulina) : null,
      carboidratos_g: carbosG ? parseInt(carbosG, 10) : null,
      fator_contexto: fatorContexto || null,
      data_hora_medicao: dataHoraCustom ? new Date(dataHoraCustom).toISOString() : new Date().toISOString(),
      observacoes: observacoes || null,
    };

    try {
      try {
        const res = await fetch('/backend/api/glicemia/index.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(novaMedicao),
        });
        if (res.ok) {
          await res.json();
        }
      } catch (e) {
        // Prossegue com atualização local
      }

      setFeedbackMedicao(obterClassificacaoGlicemica(v));
      setValorGlicemia('');
      setDoseInsulina('');
      setCarbosG('');
      setFatorContexto('');
      setObservacoes('');
      setDataHoraCustom('');

      // Adiciona na lista local imediatamente
      setRegistros((prev) => {
        const atualizados = [novaMedicao, ...prev];
        localStorage.setItem('glicocare_glicemia_registros', JSON.stringify(atualizados));
        return atualizados;
      });
    } catch (err) {
      alert(err.message || 'Erro ao registrar medição.');
    } finally {
      setSalvandoRegistro(false);
    }
  };

  /**
   * Exclui um registro do histórico
   */
  const handleExcluirRegistro = async (id) => {
    if (!window.confirm('Tem certeza de que deseja remover esta anotação do seu diário?')) return;
    try {
      try {
        await fetch(`/backend/api/glicemia/index.php?id=${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {}

      setRegistros((prev) => {
        const filtrados = prev.filter((r) => r.id !== id);
        localStorage.setItem('glicocare_glicemia_registros', JSON.stringify(filtrados));
        return filtrados;
      });
    } catch (e) {
      alert('Erro ao excluir anotação.');
    }
  };

  // Preview dinâmico enquanto digita o valor de glicemia
  const classificacaoAoDigitar = valorGlicemia ? obterClassificacaoGlicemica(valorGlicemia) : null;

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 140px)',
        backgroundColor: 'var(--cor-fundo)',
        padding: '2.5rem 1.5rem',
      }}
    >
      <div style={{ maxWidth: '1040px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Banner discreto para quem optou por "Configurar depois" */}
        {(!usuario?.perfil_configurado && !perfilSaude?.tipo_diabetes) && (
          <div
            style={{
              backgroundColor: '#F6F3EE',
              border: '1px solid #7C533F',
              borderRadius: '14px',
              padding: '1rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.4rem' }}>🌿</span>
              <div>
                <strong style={{ fontSize: '0.94rem', color: '#2E2824' }}>
                  Quer deixar sua experiência ainda mais personalizada?
                </strong>
                <p style={{ margin: 0, fontSize: '0.86rem', color: '#5A5049' }}>
                  Você pode preencher seus fatores de sensibilidade, insulinas e dados de saúde quando quiser.
                </p>
              </div>
            </div>
            <Link to="/configurar-perfil" style={{ textDecoration: 'none' }}>
              <Button variante="primario" style={{ padding: '0.55rem 1.15rem', fontSize: '0.86rem' }}>
                Configurar agora →
              </Button>
            </Link>
          </div>
        )}

        {/* ==================================================================
            1. CABEÇALHO PESSOAL DO USUÁRIO
            ================================================================== */}
        <div
          style={{
            backgroundColor: 'var(--cor-superficie)',
            borderRadius: '20px',
            padding: '2rem 2.25rem',
            border: '1px solid rgba(124, 83, 63, 0.15)',
            boxShadow: '0 8px 24px rgba(46, 40, 36, 0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                backgroundColor: '#EAE4D9',
                border: '2px solid #3B7E48',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
              }}
            >
              {usuario?.tipo_usuario === 'cuidador' ? '🤝' : '🌱'}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                <h1 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.75rem', color: 'var(--cor-texto)', margin: 0 }}>
                  {perfilSaude?.nome_completo || usuario?.nome_completo}
                </h1>
                {perfilSaude?.data_nascimento && (
                  <span
                    style={{
                      fontSize: '0.8rem',
                      backgroundColor: '#EAE4D9',
                      color: '#7C533F',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {calcularIdade(perfilSaude.data_nascimento)}
                  </span>
                )}
              </div>

              {/* Badges e Vínculo */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    backgroundColor: 'var(--cor-cta-suave)',
                    color: 'var(--cor-cta)',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '8px',
                  }}
                >
                  {perfilSaude?.tipo_diabetes || 'Diabetes Tipo 1'}
                </span>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    backgroundColor: '#FFF',
                    color: '#6A5E57',
                    border: '1px solid rgba(124, 83, 63, 0.2)',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '8px',
                  }}
                >
                  💉 Terapia: {perfilSaude?.terapia_insulina || 'Caneta'}
                </span>

                {/* Badge Elegante de Tempo de Diagnóstico / Jornada (Cálculo Automático) */}
                {perfilSaude?.data_diagnostico && calcularTempoDiagnostico(perfilSaude.data_diagnostico) && (() => {
                  const tempoJornada = calcularTempoDiagnostico(perfilSaude.data_diagnostico);
                  return (
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        backgroundColor: '#EFF7F1',
                        color: '#285832',
                        border: '1px solid rgba(59, 126, 72, 0.35)',
                        padding: '0.2rem 0.65rem',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                      title={tempoJornada.mensagemAcolhedora}
                    >
                      <span>{tempoJornada.badgeIcone}</span>
                      <span>{tempoJornada.textoJornada}</span>
                    </span>
                  );
                })()}

                {usuario?.tipo_usuario === 'cuidador' && (
                  <span style={{ fontSize: '0.82rem', color: '#7C533F', fontWeight: 600 }}>
                    • Acompanhado por {usuario.nome_completo} (Cuidador)
                  </span>
                )}
              </div>
            </div>
          </div>

          <Link to="/configurar-perfil" style={{ textDecoration: 'none' }}>
            <Button variante="secundario" style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}>
              Editar informações de saúde ✏️
            </Button>
          </Link>
        </div>

        {/* ==================================================================
            2. RESUMO DO PERFIL COMPLEMENTAR (CARDS DE INFORMAÇÕES)
            ================================================================== */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {/* Card A: Medidas & Terapia */}
          <div
            style={{
              backgroundColor: 'var(--cor-superficie)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid rgba(124, 83, 63, 0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.2rem' }}>⚖️</span>
              <strong style={{ fontSize: '0.96rem', color: '#2E2824' }}>Medidas & Diagnóstico</strong>
            </div>
            <div style={{ fontSize: '0.88rem', color: '#5A5049', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div>
                <strong>Altura:</strong> {perfilSaude?.altura_cm ? `${perfilSaude.altura_cm} cm` : 'Não informada (opcional)'}
              </div>
              <div>
                <strong>Peso:</strong> {perfilSaude?.peso_kg ? `${perfilSaude.peso_kg} kg` : 'Não informado (opcional)'}
              </div>
              <div>
                <strong>Data de Diagnóstico:</strong>{' '}
                {perfilSaude?.data_diagnostico || 'Data não registrada'}
              </div>
              {/* Resumo da Jornada e Fase do Diagnóstico para Anamnese Clínica */}
              {perfilSaude?.data_diagnostico && calcularTempoDiagnostico(perfilSaude.data_diagnostico) && (() => {
                const tempoInfo = calcularTempoDiagnostico(perfilSaude.data_diagnostico);
                return (
                  <div
                    style={{
                      marginTop: '0.35rem',
                      backgroundColor: '#EFF7F1',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(59, 126, 72, 0.25)',
                    }}
                  >
                    <div style={{ color: '#285832', fontWeight: 700, fontSize: '0.82rem' }}>
                      {tempoInfo.badgeIcone} {tempoInfo.rotuloFase}: {tempoInfo.textoJornada}
                    </div>
                    <div style={{ color: '#3A6B42', fontSize: '0.78rem', marginTop: '0.15rem' }}>
                      {tempoInfo.mensagemAcolhedora}
                    </div>
                  </div>
                );
              })()}
              <div>
                <strong>Sexo Biológico:</strong> {perfilSaude?.sexo === 'feminino' ? 'Feminino' : (perfilSaude?.sexo === 'masculino' ? 'Masculino' : 'Geral')}
              </div>
            </div>
          </div>

          {/* Card B: Medicamentos Ativos */}
          <div
            style={{
              backgroundColor: 'var(--cor-superficie)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid rgba(124, 83, 63, 0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>💊</span>
                <strong style={{ fontSize: '0.96rem', color: '#2E2824' }}>Medicamentos & Insulinas</strong>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#7C533F', fontWeight: 600 }}>
                {medicamentos.length} ativo(s)
              </span>
            </div>

            {medicamentos.length === 0 ? (
              <p style={{ fontSize: '0.86rem', color: '#888', margin: 0 }}>
                Nenhum medicamento registrado ainda.{' '}
                <Link to="/configurar-perfil" style={{ color: '#3B7E48' }}>Adicionar</Link>
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '140px', overflowY: 'auto' }}>
                {medicamentos.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#FFF',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong style={{ color: '#2E2824' }}>{m.nome_medicamento}</strong>
                      <span style={{ color: '#6A5E57', fontSize: '0.78rem', marginLeft: '0.35rem' }}>
                        ({m.tipo})
                      </span>
                    </div>
                    <span style={{ color: '#3B7E48', fontWeight: 700 }}>
                      {m.dose} {m.unidade_medida} {m.horario ? `às ${m.horario.substring(0, 5)}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card C: Fatores de Sensibilidade */}
          <div
            style={{
              backgroundColor: 'var(--cor-superficie)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid rgba(124, 83, 63, 0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.2rem' }}>⚡</span>
              <strong style={{ fontSize: '0.96rem', color: '#2E2824' }}>Sensibilidade Glicêmica</strong>
            </div>

            <div style={{ fontSize: '0.84rem', color: '#5A5049', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div>
                <strong>Estresse:</strong> {perfilSaude?.fatores_glicemia?.estresse || 'Em observação'}
              </div>
              <div>
                <strong>Calor intenso:</strong> {perfilSaude?.fatores_glicemia?.calor || 'Em observação'}
              </div>
              <div>
                <strong>Infecções:</strong> {perfilSaude?.fatores_glicemia?.infeccao || 'Em observação'}
              </div>
              <div>
                <strong>Exercício:</strong> {perfilSaude?.fatores_glicemia?.exercicio || 'Em observação'}
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================
            3. DIÁRIO PESSOAL DE GLICEMIA (REGISTRO RÁPIDO COM FEEDBACK POR COR)
            ================================================================== */}
        <div
          style={{
            backgroundColor: 'var(--cor-superficie)',
            borderRadius: '20px',
            padding: '2rem 2.25rem',
            border: '1px solid rgba(124, 83, 63, 0.15)',
            boxShadow: '0 8px 24px rgba(46, 40, 36, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🩸</span>
            <h2 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.5rem', color: 'var(--cor-texto)', margin: 0 }}>
              Meu Diário de Glicemia
            </h2>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#5A5049', margin: '0 0 1.5rem' }}>
            Registre as medições ao longo do dia para identificar padrões e compartilhar com seu especialista.
          </p>

          {/* Feedback Visual Dinâmico ao Digitar a Glicemia */}
          {classificacaoAoDigitar && (
            <div
              style={{
                backgroundColor: classificacaoAoDigitar.corFundo,
                border: `1.5px solid ${classificacaoAoDigitar.corBorda}`,
                color: classificacaoAoDigitar.corTexto,
                padding: '0.85rem 1.25rem',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '1.2rem' }}>{classificacaoAoDigitar.icone}</span>
                <strong>{classificacaoAoDigitar.rotulo}</strong>
              </div>
              <div>{classificacaoAoDigitar.orientacao}</div>
            </div>
          )}

          {/* Formulário Rápido de Registro */}
          <form onSubmit={handleRegistrarGlicemia} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
              {/* Valor em mg/dL */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Glicemia (mg/dL) *
                </label>
                <input
                  type="number"
                  required
                  value={valorGlicemia}
                  onChange={(e) => setValorGlicemia(e.target.value)}
                  placeholder="Ex: 110"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '2px solid rgba(124, 83, 63, 0.3)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#2E2824',
                    backgroundColor: '#FFF',
                  }}
                />
              </div>

              {/* Momento da Medição */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Momento do dia
                </label>
                <select
                  value={momentoMedicao}
                  onChange={(e) => setMomentoMedicao(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #DDD', backgroundColor: '#FFF', fontSize: '0.9rem' }}
                >
                  <option value="Jejum">Jejum (ao acordar)</option>
                  <option value="Antes da Refeicao">Antes da Refeição</option>
                  <option value="1h/2h Apos Refeicao">1h a 2h Após Refeição</option>
                  <option value="Antes de Dormir">Antes de Dormir</option>
                  <option value="Padrao">Medição Avulsa / Madrugada</option>
                </select>
              </div>

              {/* Tipo de Leitura */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Tipo de leitura
                </label>
                <select
                  value={tipoLeitura}
                  onChange={(e) => setTipoLeitura(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #DDD', backgroundColor: '#FFF', fontSize: '0.9rem' }}
                >
                  <option value="Manual">Glicosímetro (Ponta de dedo)</option>
                  <option value="Sensor/CGM">Sensor Contínuo (FreeStyle/Dexcom)</option>
                </select>
              </div>

              {/* Ação Realizada */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Conduta adotada
                </label>
                <select
                  value={acaoRealizada}
                  onChange={(e) => setAcaoRealizada(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid #DDD', backgroundColor: '#FFF', fontSize: '0.9rem' }}
                >
                  <option value="Nenhuma Acao">Apenas monitoramento</option>
                  <option value="Bolus para Refeicao">Bolus para refeição</option>
                  <option value="Bolus de Correcao">Bolus de correção</option>
                  <option value="Bolus Correcao + Refeicao">Correção + Refeição</option>
                  <option value="Ajuste na Basal">Ajuste na basal</option>
                </select>
              </div>
            </div>

            {/* Doses, Carbos e Fatores de Contexto */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Insulina aplicada (UI)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={doseInsulina}
                  onChange={(e) => setDoseInsulina(e.target.value)}
                  placeholder="Ex: 2.5"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #DDD', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Carboidratos ingeridos (g)
                </label>
                <input
                  type="number"
                  value={carbosG}
                  onChange={(e) => setCarbosG(e.target.value)}
                  placeholder="Ex: 40"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #DDD', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Contexto / Fator externo
                </label>
                <input
                  type="text"
                  value={fatorContexto}
                  onChange={(e) => setFatorContexto(e.target.value)}
                  placeholder="Ex: Estresse, Aula de Ed. Física, Pizza"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #DDD', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Data/Hora retroativa <span style={{ color: '#888' }}>(Opcional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={dataHoraCustom}
                  onChange={(e) => setDataHoraCustom(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #DDD', fontSize: '0.84rem' }}
                />
              </div>
            </div>

            {/* Observações */}
            <div>
              <input
                type="text"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações complementares (ex: acabei de trocar o sensor, noite calma)"
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #DDD', fontSize: '0.88rem' }}
              />
            </div>

            <Button
              variante="primario"
              tipo="submit"
              disabled={salvandoRegistro || !valorGlicemia}
              style={{ alignSelf: 'flex-start', padding: '0.75rem 1.6rem', fontSize: '0.94rem' }}
            >
              {salvandoRegistro ? 'Salvando medição...' : 'Registrar medição no diário →'}
            </Button>
          </form>
        </div>

        {/* ==================================================================
            4. HISTÓRICO CRONOLÓGICO DE LEITURAS (LINHA DO TEMPO)
            ================================================================== */}
        <div
          style={{
            backgroundColor: 'var(--cor-superficie)',
            borderRadius: '20px',
            padding: '2rem 2.25rem',
            border: '1px solid rgba(124, 83, 63, 0.15)',
            boxShadow: '0 8px 24px rgba(46, 40, 36, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.35rem', color: 'var(--cor-texto)', margin: 0 }}>
              Linha do Tempo das Medições ({registros.length})
            </h3>
            <span style={{ fontSize: '0.84rem', color: '#6A5E57' }}>
              Ordenado da medição mais recente para a mais antiga
            </span>
          </div>

          {carregando ? (
            <p style={{ color: '#7C533F', fontSize: '0.95rem' }}>Carregando histórico do seu espaço...</p>
          ) : registros.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', backgroundColor: '#FFF', borderRadius: '12px', border: '1px dashed #CCC' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>🌱</span>
              <strong style={{ color: '#2E2824', fontSize: '1rem', display: 'block', marginBottom: '0.25rem' }}>
                Seu diário glicêmico está pronto para começar!
              </strong>
              <p style={{ color: '#6A5E57', fontSize: '0.88rem', margin: 0 }}>
                Faça o seu primeiro registro acima para acompanhar sua curva com serenidade.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {registros.map((item) => {
                const badge = obterClassificacaoGlicemica(item.valor_mg_dl);
                const dataFormatada = new Date(item.data_hora_medicao).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: '#FFF',
                      borderRadius: '12px',
                      padding: '1rem 1.25rem',
                      borderLeft: `6px solid ${badge ? badge.corBorda : '#DDD'}`,
                      borderTop: '1px solid rgba(124, 83, 63, 0.1)',
                      borderRight: '1px solid rgba(124, 83, 63, 0.1)',
                      borderBottom: '1px solid rgba(124, 83, 63, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    {/* Esquerda: Valor e Momento */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div
                        style={{
                          fontSize: '1.45rem',
                          fontFamily: 'var(--fonte-titulo)',
                          fontWeight: 700,
                          color: badge ? badge.corTexto : '#2E2824',
                          minWidth: '90px',
                        }}
                      >
                        {item.valor_mg_dl}{' '}
                        <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#6A5E57' }}>mg/dL</span>
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '0.9rem', color: '#2E2824' }}>
                            {item.momento_medicao}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: '#888' }}>
                            ({item.tipo_leitura})
                          </span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#6A5E57' }}>
                          📅 {dataFormatada}
                        </span>
                      </div>
                    </div>

                    {/* Centro: Conduta, Doses e Fator */}
                    <div style={{ fontSize: '0.84rem', color: '#5A5049', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {item.dose_insulina && (
                        <span style={{ backgroundColor: '#EFF7F1', color: '#285832', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>
                          💉 {item.dose_insulina} UI
                        </span>
                      )}
                      {item.carboidratos_g && (
                        <span style={{ backgroundColor: '#FAF4EF', color: '#7C533F', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>
                          🍞 {item.carboidratos_g}g carbo
                        </span>
                      )}
                      {item.fator_contexto && (
                        <span style={{ backgroundColor: '#F6F3EE', color: '#6A5E57', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                          🏷️ {item.fator_contexto}
                        </span>
                      )}
                      {item.observacoes && (
                        <span style={{ fontStyle: 'italic', color: '#777', maxWidth: '200px' }}>
                          "{item.observacoes}"
                        </span>
                      )}
                    </div>

                    {/* Direita: Ação de Excluir */}
                    <button
                      type="button"
                      onClick={() => handleExcluirRegistro(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#A23B2A',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        padding: '0.25rem 0.5rem',
                      }}
                      title="Excluir medição"
                    >
                      🗑️ Excluir
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
/* FIM DO COMPONENTE MEUPERFIL */
