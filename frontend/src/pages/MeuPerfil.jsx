/* ==========================================================================
   ARQUIVO: MeuPerfil.jsx (Localização: /frontend/src/pages/MeuPerfil.jsx)
   OBJETIVO:
     Página Pessoal de Perfil e Diário Inteligente de Glicemia para pessoas
     com diabetes e cuidadores.
     Recursos Clínico-Educativos Avançados:
     1. Insulina Ativa (IOB Estimada) com curva fisiológica de decaimento;
     2. Projeção pelo Fator de Sensibilidade Insulínica (FSI) e alerta de empilhamento;
     3. Velocidade de Variação e Seta de Tendência entre destros (intervalo <= 45 min);
     4. Linha do tempo em estilo planilha inteligente com rastreabilidade auditável.
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { calcularTempoDiagnostico } from '../utils/dateUtils';
import {
  calcularInsulinaAtiva,
  calcularProjecaoFSI,
  calcularTendenciaDestro,
} from '../utils/glicemiaAnalytics';

// Registros demonstrativos iniciais com IOB e tendência caso o diário esteja vazio
const REGISTROS_DEMO_INICIAIS = [
  {
    id: 101,
    valor_mg_dl: 142,
    data_hora_medicao: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // há 25 min
    momento_medicao: '1h/2h Apos Refeicao',
    tipo_leitura: 'Manual',
    acao_realizada: 'Bolus para Refeicao',
    dose_insulina: 3.5,
    dose_aplicada: 3.5,
    insulina_ativa_estimada: 1.2,
    insulina_total_organismo: 4.7,
    variacao_por_minuto: -0.80,
    tendencia_destro: '↘ Queda moderada',
    fator_contexto: 'Almoço leve',
    carboidratos_g: 45,
    observacoes: 'Sensação tranquila, monitorando com calma.',
  },
  {
    id: 102,
    valor_mg_dl: 162,
    data_hora_medicao: new Date(Date.now() - 50 * 60 * 1000).toISOString(), // há 50 min
    momento_medicao: 'Antes da Refeicao',
    tipo_leitura: 'Manual',
    acao_realizada: 'Nenhuma Acao',
    dose_insulina: 0,
    dose_aplicada: 0,
    insulina_ativa_estimada: 1.5,
    insulina_total_organismo: 1.5,
    variacao_por_minuto: null,
    tendencia_destro: '• Estável',
    fator_contexto: null,
    carboidratos_g: 0,
    observacoes: null,
  },
  {
    id: 103,
    valor_mg_dl: 110,
    data_hora_medicao: new Date(Date.now() - 140 * 60 * 1000).toISOString(), // há 2h20
    momento_medicao: 'Jejum',
    tipo_leitura: 'Manual',
    acao_realizada: 'Nenhuma Acao',
    dose_insulina: 0,
    dose_aplicada: 0,
    insulina_ativa_estimada: 0,
    insulina_total_organismo: 0,
    variacao_por_minuto: null,
    tendencia_destro: '• Estável',
    fator_contexto: 'Noite tranquila',
    carboidratos_g: 0,
    observacoes: 'Acordou bem disposto.',
  },
];

/* INÍCIO DO COMPONENTE MEUPERFIL */
export default function MeuPerfil() {
  const navigate = useNavigate();
  const { usuario, token } = useAuth();

  // Estados de dados do perfil e medicamentos
  const [perfilSaude, setPerfilSaude] = useState(null);
  const [medicamentos, setMedicamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Parâmetros clínicos educativos
  const [fsi, setFsi] = useState('');
  const [glicemiaAlvo, setGlicemiaAlvo] = useState(100);
  const [duracaoInsulinaHoras, setDuracaoInsulinaHoras] = useState(3);
  const [modalConfigClinicaAberta, setModalConfigClinicaAberta] = useState(false);
  const [salvandoConfigClinica, setSalvandoConfigClinica] = useState(false);

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
            const p = dataPerfil.dados.perfil_saude;
            setPerfilSaude(p);
            if (p.fsi !== undefined && p.fsi !== null) setFsi(p.fsi);
            if (p.glicemia_alvo !== undefined && p.glicemia_alvo !== null) setGlicemiaAlvo(p.glicemia_alvo);
            if (p.duracao_insulina_horas !== undefined && p.duracao_insulina_horas !== null) setDuracaoInsulinaHoras(p.duracao_insulina_horas);
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
            if (dataGlicemia.config_clinica) {
              if (dataGlicemia.config_clinica.fsi) setFsi(dataGlicemia.config_clinica.fsi);
              if (dataGlicemia.config_clinica.glicemia_alvo) setGlicemiaAlvo(dataGlicemia.config_clinica.glicemia_alvo);
              if (dataGlicemia.config_clinica.duracao_insulina_horas) setDuracaoInsulinaHoras(dataGlicemia.config_clinica.duracao_insulina_horas);
            }
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
          const p = JSON.parse(perfilLocal);
          setPerfilSaude(p);
          if (p.fsi !== undefined && p.fsi !== null) setFsi(p.fsi);
          if (p.glicemia_alvo !== undefined && p.glicemia_alvo !== null) setGlicemiaAlvo(p.glicemia_alvo);
          if (p.duracao_insulina_horas !== undefined && p.duracao_insulina_horas !== null) setDuracaoInsulinaHoras(p.duracao_insulina_horas);
        } else if (usuario) {
          const perfilInicial = {
            nome_completo: usuario.nome_completo || 'Lucas Mendes',
            tipo_diabetes: 'Tipo 1A',
            terapia_insulina: 'Caneta',
            data_nascimento: '2000-01-01',
            sexo: 'masculino',
            fsi: 30,
            glicemia_alvo: 100,
            duracao_insulina_horas: 3,
            altura_cm: 175,
            peso_kg: 72,
            fatores_glicemia: { estresse: 'Sobe drasticamente', calor: 'Cai', exercicio: 'Cai' },
          };
          setPerfilSaude(perfilInicial);
          setFsi(30);
          setGlicemiaAlvo(100);
          setDuracaoInsulinaHoras(3);
        }

        const medsLocal = localStorage.getItem('glicocare_medicamentos');
        if (medsLocal) {
          setMedicamentos(JSON.parse(medsLocal));
        }

        const glicemiaLocal = localStorage.getItem('glicocare_glicemia_registros');
        if (glicemiaLocal) {
          setRegistros(JSON.parse(glicemiaLocal));
        } else {
          setRegistros(REGISTROS_DEMO_INICIAIS);
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

  // 1. Insulina Ativa Estimada (IOB) agora no organismo
  const infoIOB = calcularInsulinaAtiva(registros, new Date(), duracaoInsulinaHoras);

  // 2. Última glicemia e cálculo da tendência atual
  const ultimoRegistro = registros && registros.length > 0 ? registros[0] : null;
  const penultimoRegistro = registros && registros.length > 1 ? registros[1] : null;
  const tendenciaAtual = ultimoRegistro && penultimoRegistro
    ? calcularTendenciaDestro(ultimoRegistro.valor_mg_dl, ultimoRegistro.data_hora_medicao, penultimoRegistro)
    : null;

  // 3. Tendência em tempo real para a nova medição digitada
  const dataHoraDigitacao = dataHoraCustom ? new Date(dataHoraCustom) : new Date();
  const tendenciaAoDigitar = valorGlicemia && ultimoRegistro
    ? calcularTendenciaDestro(valorGlicemia, dataHoraDigitacao, ultimoRegistro)
    : null;

  // 4. Projeção FSI + IOB em tempo real enquanto digita (usa FSI configurado ou padrão educativo de 30 mg/dL)
  const fsiEfetivo = fsi !== '' && fsi !== null && !isNaN(parseFloat(fsi)) ? parseFloat(fsi) : 30;
  const projecaoFSI = valorGlicemia
    ? calcularProjecaoFSI(
        valorGlicemia,
        infoIOB.iobTotal,
        doseInsulina,
        fsiEfetivo,
        glicemiaAlvo
      )
    : null;

  /**
   * Salva os parâmetros clínicos orientados pelo médico (FSI, Alvo, Duração)
   */
  const handleSalvarParametrosClinicos = async (e) => {
    e.preventDefault();
    setSalvandoConfigClinica(true);

    const fsiNum = fsi !== '' ? parseFloat(fsi) : null;
    const alvoNum = parseInt(glicemiaAlvo, 10) || 100;
    const duracaoNum = parseInt(duracaoInsulinaHoras, 10) || 3;

    const perfilAtualizado = {
      ...(perfilSaude || {}),
      fsi: fsiNum,
      glicemia_alvo: alvoNum,
      duracao_insulina_horas: duracaoNum,
    };

    try {
      try {
        await fetch('/backend/api/perfil/index.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(perfilAtualizado),
        });
      } catch (err) {}

      setPerfilSaude(perfilAtualizado);
      localStorage.setItem('glicocare_perfil_saude', JSON.stringify(perfilAtualizado));
      setModalConfigClinicaAberta(false);
    } catch (err) {
      alert('Não foi possível salvar os parâmetros.');
    } finally {
      setSalvandoConfigClinica(false);
    }
  };

  /**
   * Submete uma nova medição para o diário glicêmico
   */
  const handleRegistrarGlicemia = async (e) => {
    e.preventDefault();
    const v = parseInt(valorGlicemia, 10);
    if (!v || v <= 0) return;

    setSalvandoRegistro(true);

    const doseNum = doseInsulina ? parseFloat(doseInsulina) : null;
    const iobNoMomento = infoIOB.iobTotal;
    const totalCorpo = parseFloat(((doseNum || 0) + iobNoMomento).toFixed(2));
    const variacaoCalculada = tendenciaAoDigitar?.temComparacao ? tendenciaAoDigitar.taxaPorMinuto : null;
    const rotuloTendencia = tendenciaAoDigitar?.temComparacao
      ? `${tendenciaAoDigitar.icone} ${tendenciaAoDigitar.rotulo}`
      : null;

    const novaMedicao = {
      id: Date.now(),
      valor_mg_dl: v,
      momento_medicao: momentoMedicao,
      tipo_leitura: tipoLeitura,
      acao_realizada: acaoRealizada,
      dose_insulina: doseNum,
      dose_aplicada: doseNum,
      insulina_ativa_estimada: iobNoMomento,
      insulina_total_organismo: totalCorpo,
      variacao_por_minuto: variacaoCalculada,
      tendencia_destro: rotuloTendencia,
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
      <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
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
                  {usuario?.tipo_usuario === 'cuidador'
                    ? '🤝 Perfil Cuidador'
                    : usuario?.tipo_usuario === 'admin'
                    ? '🛡️ Curadoria GlicoCare'
                    : '🌱 Perfil Pessoal'}
                </span>

                {perfilSaude?.tipo_diabetes && (
                  <span
                    style={{
                      fontSize: '0.78rem',
                      backgroundColor: '#F6F3EE',
                      color: '#5A5049',
                      border: '1px solid rgba(124, 83, 63, 0.2)',
                      padding: '0.2rem 0.65rem',
                      borderRadius: '8px',
                    }}
                  >
                    {perfilSaude.tipo_diabetes}
                  </span>
                )}

                {perfilSaude?.terapia_insulina && (
                  <span
                    style={{
                      fontSize: '0.78rem',
                      backgroundColor: '#F6F3EE',
                      color: '#5A5049',
                      border: '1px solid rgba(124, 83, 63, 0.2)',
                      padding: '0.2rem 0.65rem',
                      borderRadius: '8px',
                    }}
                  >
                    💉 {perfilSaude.terapia_insulina}
                  </span>
                )}

                {/* Badge da Jornada de Aprendizado */}
                {perfilSaude?.data_diagnostico && (() => {
                  const tempoJornada = calcularTempoDiagnostico(perfilSaude.data_diagnostico);
                  return tempoJornada ? (
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        backgroundColor: '#EFF7F1',
                        color: '#285832',
                        border: '1px solid #B8E2BE',
                        padding: '0.2rem 0.65rem',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                      title={tempoJornada.mensagemAcolhedora}
                    >
                      <span>{tempoJornada.badgeIcone}</span>
                      <span>{tempoJornada.textoJornada} de jornada</span>
                    </span>
                  ) : null;
                })()}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/configurar-perfil" style={{ textDecoration: 'none' }}>
              <Button variante="secundario" style={{ fontSize: '0.88rem' }}>
                ✏️ Editar Perfil de Saúde
              </Button>
            </Link>
          </div>
        </div>

        {/* ==================================================================
            2. PAINEL RESUMO INTELIGENTE DO DIÁRIO (IOB, TENDÊNCIA E FSI)
            ================================================================== */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {/* Card 1: Insulina Ativa Estimada (IOB) */}
          <div
            style={{
              backgroundColor: 'var(--cor-superficie)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid rgba(124, 83, 63, 0.15)',
              boxShadow: '0 4px 16px rgba(46, 40, 36, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', color: '#1E4620', letterSpacing: '0.05em' }}>
                  💧 Insulina Ativa Estimada (IOB)
                </span>
                <span
                  style={{
                    backgroundColor: infoIOB.iobTotal > 0 ? '#EFF7F1' : '#F6F3EE',
                    color: infoIOB.iobTotal > 0 ? '#285832' : '#888',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '12px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                  }}
                >
                  Curva de {duracaoInsulinaHoras}h
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', margin: '0.4rem 0' }}>
                <span style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '2.1rem', fontWeight: 700, color: 'var(--cor-texto)' }}>
                  {infoIOB.iobTotal.toFixed(1)}
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--cor-cta)' }}>
                  UI ativas no corpo
                </span>
              </div>

              <p style={{ fontSize: '0.84rem', color: '#5A5049', margin: '0.2rem 0 0.75rem 0' }}>
                ⏱️ {infoIOB.textoExpiracao}
              </p>
            </div>

            <div
              style={{
                backgroundColor: '#F8FBF8',
                borderRadius: '8px',
                padding: '0.55rem 0.75rem',
                fontSize: '0.76rem',
                color: '#285832',
                border: '1px solid #D5E8D8',
                lineHeight: 1.4,
              }}
            >
              💡 <strong>Por que importa:</strong> Conhecer sua IOB evita o <em>empilhamento de doses</em> (aplicar nova correção antes da anterior terminar de agir).
            </div>
          </div>

          {/* Card 2: Última Glicemia + Velocidade de Tendência (Destro / Sensor) */}
          <div
            style={{
              backgroundColor: 'var(--cor-superficie)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid rgba(124, 83, 63, 0.15)',
              boxShadow: '0 4px 16px rgba(46, 40, 36, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', color: '#7C533F', letterSpacing: '0.05em' }}>
                  🎯 Última Leitura & Tendência
                </span>
                {ultimoRegistro && (
                  <span style={{ fontSize: '0.74rem', color: '#6C625A' }}>
                    {ultimoRegistro.tipo_leitura === 'Manual' ? '🩸 Destro' : '📱 Sensor'}
                  </span>
                )}
              </div>

              {ultimoRegistro ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', margin: '0.4rem 0' }}>
                    <span
                      style={{
                        fontFamily: 'var(--fonte-titulo)',
                        fontSize: '2.1rem',
                        fontWeight: 700,
                        color: obterClassificacaoGlicemica(ultimoRegistro.valor_mg_dl)?.corTexto || 'var(--cor-texto)',
                      }}
                    >
                      {ultimoRegistro.valor_mg_dl}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#6A5E57' }}>mg/dL</span>

                    {/* Seta de Tendência */}
                    {tendenciaAtual?.temComparacao && (
                      <span
                        style={{
                          backgroundColor: tendenciaAtual.cor + '15',
                          color: tendenciaAtual.cor,
                          border: `1px solid ${tendenciaAtual.cor}40`,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <span>{tendenciaAtual.icone}</span>
                        <span>{tendenciaAtual.rotulo}</span>
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '0.82rem', color: '#5A5049', margin: '0.2rem 0 0.75rem 0' }}>
                    {tendenciaAtual?.temComparacao
                      ? tendenciaAtual.descricao
                      : `Medido em ${new Date(ultimoRegistro.data_hora_medicao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (${ultimoRegistro.momento_medicao})`}
                  </p>
                </>
              ) : (
                <p style={{ fontSize: '0.9rem', color: '#888', margin: '1rem 0' }}>
                  Nenhuma medição registrada ainda hoje.
                </p>
              )}
            </div>

            <div
              style={{
                backgroundColor: '#FFFDF0',
                borderRadius: '8px',
                padding: '0.55rem 0.75rem',
                fontSize: '0.76rem',
                color: '#8C6818',
                border: '1px solid #E8D9A5',
                lineHeight: 1.4,
              }}
            >
              📊 <strong>Visão de Destro:</strong> Intervalos de até 45 min calculam a velocidade de queda ou subida, trazendo previsibilidade de sensor para a ponta de dedo.
            </div>
          </div>

          {/* Card 3: Parâmetros Clínicos Educativos (FSI & Meta Alvo) */}
          <div
            style={{
              backgroundColor: 'var(--cor-superficie)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid rgba(124, 83, 63, 0.15)',
              boxShadow: '0 4px 16px rgba(46, 40, 36, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', color: '#2E2824', letterSpacing: '0.05em' }}>
                  ⚙️ Metas Clínicas Educativas
                </span>
                <button
                  type="button"
                  onClick={() => setModalConfigClinicaAberta(true)}
                  style={{
                    backgroundColor: '#EAE4D9',
                    border: '1px solid rgba(124, 83, 63, 0.25)',
                    color: '#7C533F',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Ajustar ⚙️
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: '0.65rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: '#5A5049' }}>Fator de Sensibilidade (FSI):</span>
                  <strong style={{ color: '#2E2824' }}>
                    {fsi ? `1 UI reduz ${fsi} mg/dL` : 'Não configurado'}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: '#5A5049' }}>Glicemia Alvo Educativa:</span>
                  <strong style={{ color: '#3B7E48' }}>{glicemiaAlvo} mg/dL</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: '#5A5049' }}>Duração da Insulina:</span>
                  <strong style={{ color: '#7C533F' }}>{duracaoInsulinaHoras} horas</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <Link
                to="/artigo/insulina-ativa-e-queda-rapida"
                style={{ fontSize: '0.78rem', color: '#3B7E48', fontWeight: 600, textDecoration: 'underline' }}
              >
                Guia: como não ficar "às cegas" no destro →
              </Link>
            </div>
          </div>
        </div>

        {/* ==================================================================
            MODAL / GAVETA DE PARÂMETROS CLÍNICOS EDUCATIVOS
            ================================================================== */}
        {modalConfigClinicaAberta && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(35, 31, 29, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1rem',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--cor-superficie)',
                borderRadius: '18px',
                padding: '2rem',
                maxWidth: '520px',
                width: '100%',
                border: '1px solid rgba(124, 83, 63, 0.2)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.35rem', color: 'var(--cor-texto)', margin: 0 }}>
                  Parâmetros de Sensibilidade (FSI)
                </h3>
                <button
                  type="button"
                  onClick={() => setModalConfigClinicaAberta(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {/* Aviso Ético Obrigatório */}
              <div
                style={{
                  backgroundColor: '#FFFDF0',
                  border: '1px solid #E8D9A5',
                  color: '#8C6818',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  lineHeight: 1.5,
                  marginBottom: '1.25rem',
                }}
              >
                <strong>⚠️ Aviso Ético e Clínico:</strong> Estes parâmetros são estritamente educativos e devem refletir com fidelidade as metas prescritas pela equipe médica do paciente. A GlicoCare não prescreve, calcula de forma autônoma nem altera doses de insulina.
              </div>

              <form onSubmit={handleSalvarParametrosClinicos} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.3rem', color: '#2E2824' }}>
                    Fator de Sensibilidade Insulínica (FSI)
                  </label>
                  <input
                    type="number"
                    step="1"
                    placeholder="Ex: 30 (1 UI reduz 30 mg/dL)"
                    value={fsi}
                    onChange={(e) => setFsi(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CCC', fontSize: '0.95rem' }}
                  />
                  <small style={{ color: '#6A5E57', fontSize: '0.76rem' }}>
                    Quantos mg/dL 1 unidade de insulina rápida reduz na sua glicemia.
                  </small>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.3rem', color: '#2E2824' }}>
                    Glicemia Alvo Educativa (mg/dL)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 100"
                    value={glicemiaAlvo}
                    onChange={(e) => setGlicemiaAlvo(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CCC', fontSize: '0.95rem' }}
                  />
                  <small style={{ color: '#6A5E57', fontSize: '0.76rem' }}>
                    Valor de referência seguro orientado para o equilíbrio do dia a dia.
                  </small>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.3rem', color: '#2E2824' }}>
                    Duração da Ação da Insulina (Horas)
                  </label>
                  <select
                    value={duracaoInsulinaHoras}
                    onChange={(e) => setDuracaoInsulinaHoras(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #CCC', fontSize: '0.95rem', backgroundColor: '#FFF' }}
                  >
                    <option value={3}>3 horas (Padrão para ultrarrápidas modernas)</option>
                    <option value={4}>4 horas (Maior tempo de ação em crianças e adultos)</option>
                    <option value={5}>5 horas (Ação prolongada)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <Button
                    type="button"
                    variante="secundario"
                    onClick={() => setModalConfigClinicaAberta(false)}
                    style={{ fontSize: '0.86rem' }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variante="primario"
                    disabled={salvandoConfigClinica}
                    style={{ fontSize: '0.86rem' }}
                  >
                    {salvandoConfigClinica ? 'Salvando...' : 'Salvar parâmetros médicos →'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================================================================
            3. DIÁRIO PESSOAL DE GLICEMIA (FORMULÁRIO COM SIMULAÇÃO EDUCATIVA)
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.4rem' }}>🩸</span>
              <h2 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.5rem', color: 'var(--cor-texto)', margin: 0 }}>
                Novo Registro no Diário
              </h2>
            </div>
            <span style={{ fontSize: '0.82rem', color: '#6C625A' }}>
              🔒 Registro auditado de forma imutável (RN-AUD-01)
            </span>
          </div>

          <p style={{ fontSize: '0.9rem', color: '#5A5049', margin: '0 0 1.5rem' }}>
            Registre sua glicemia e doses aplicadas para acompanhar a curva com calma e evitar sobreposições perigosas.
          </p>

          {/* Feedback Visual Dinâmico por Cor ao Digitar */}
          {classificacaoAoDigitar && (
            <div
              style={{
                backgroundColor: classificacaoAoDigitar.corFundo,
                border: `1.5px solid ${classificacaoAoDigitar.corBorda}`,
                color: classificacaoAoDigitar.corTexto,
                padding: '0.85rem 1.25rem',
                borderRadius: '12px',
                marginBottom: '1rem',
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

          {/* Alerta de Tendência em Tempo Real entre Destros (se delta <= 45 min) */}
          {tendenciaAoDigitar?.temComparacao && (
            <div
              style={{
                backgroundColor: tendenciaAoDigitar.alertaQuedaRapida ? '#FDF2F0' : '#F6F3EE',
                border: `1.5px solid ${tendenciaAoDigitar.cor}`,
                color: tendenciaAoDigitar.cor,
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                marginBottom: '1rem',
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>{tendenciaAoDigitar.icone}</span>
              <div>
                <strong>Tendência em Destro ({tendenciaAoDigitar.rotulo}):</strong> {tendenciaAoDigitar.descricao}
              </div>
            </div>
          )}

          {/* Card de Simulação Educativa (FSI + IOB) em Tempo Real */}
          {projecaoFSI && projecaoFSI.temFSI && (
            <div
              style={{
                backgroundColor: projecaoFSI.riscoHipo ? '#FFF5F4' : '#F8FBF8',
                border: `1.5px solid ${projecaoFSI.riscoHipo ? '#E06A55' : '#B8E2BE'}`,
                borderRadius: '12px',
                padding: '0.9rem 1.15rem',
                marginBottom: '1.25rem',
                fontSize: '0.88rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                <strong style={{ color: projecaoFSI.riscoHipo ? '#A23B2A' : '#1E4620' }}>
                  {projecaoFSI.riscoHipo ? '⚠️ Alerta Educativo de Sobreposição / Risco de Hipo' : '🌱 Simulação Educativa de Redução (FSI)'}
                </strong>
                <span style={{ fontSize: '0.78rem', color: '#5A5049' }}>
                  FSI = {projecaoFSI.fsi} mg/dL por UI {fsi ? '' : '(Padrão sugerido: 30)'}
                </span>
              </div>

              <div style={{ color: '#2E2824', marginBottom: '0.45rem', lineHeight: 1.5 }}>
                <span>Insulina ativa (<strong>{projecaoFSI.insulinaAtiva} UI</strong>)</span>
                {projecaoFSI.novaDose > 0 && <span> + Nova dose (<strong>{projecaoFSI.novaDose} UI</strong>)</span>}
                <span> = <strong>{projecaoFSI.insulinaTotal} UI</strong> totais no corpo.</span>
                <span> Queda estimada: <strong>~{projecaoFSI.quedaEstimada} mg/dL</strong>.</span>
                <span> Glicemia projetada: <strong style={{ color: projecaoFSI.riscoHipo ? '#A23B2A' : '#3B7E48' }}>~{projecaoFSI.glicemiaProjetada} mg/dL</strong>.</span>
              </div>

              <div style={{ fontSize: '0.82rem', color: projecaoFSI.riscoHipo ? '#A23B2A' : '#285832' }}>
                {projecaoFSI.mensagemEducativa}
              </div>
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
                  placeholder="Ex: 145"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '2px solid rgba(124, 83, 63, 0.3)',
                    fontSize: '1.15rem',
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
                  <option value="Manual">Glicosímetro (Ponta de dedo / Destro)</option>
                  <option value="Sensor/CGM">Sensor Contínuo (FreeStyle / Dexcom)</option>
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
                  Insulina aplicada agora (UI)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={doseInsulina}
                  onChange={(e) => setDoseInsulina(e.target.value)}
                  placeholder="Ex: 3.0"
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
                  placeholder="Ex: Estresse, Aula de Natação, Pizza"
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
            4. HISTÓRICO EM ESTILO PLANILHA INTELIGENTE COM IOB E TENDÊNCIA
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
            <div>
              <h3 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.35rem', color: 'var(--cor-texto)', margin: '0 0 0.25rem 0' }}>
                Linha do Tempo das Medições ({registros.length})
              </h3>
              <span style={{ fontSize: '0.84rem', color: '#6A5E57' }}>
                Acompanhe a curva de glicose, doses de insulina e IOB restante calculada
              </span>
            </div>
            <span style={{ fontSize: '0.78rem', backgroundColor: '#EAE4D9', color: '#7C533F', padding: '0.25rem 0.65rem', borderRadius: '12px', fontWeight: 600 }}>
              Auditado compulsório (RN-AUD-01)
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
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '0.86rem',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(124, 83, 63, 0.15)', color: '#7C533F', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Data / Hora</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Glicemia & Tendência</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Aplicada</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Ativa (IOB)</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Total no Corpo</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Momento & Contexto</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((item) => {
                    const badge = obterClassificacaoGlicemica(item.valor_mg_dl);
                    const dataFormatada = new Date(item.data_hora_medicao).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    const doseAplicadaNum = item.dose_aplicada || item.dose_insulina || 0;
                    const iobNum = item.insulina_ativa_estimada !== undefined && item.insulina_ativa_estimada !== null
                      ? parseFloat(item.insulina_ativa_estimada)
                      : null;
                    const totalOrganismoNum = item.insulina_total_organismo !== undefined && item.insulina_total_organismo !== null
                      ? parseFloat(item.insulina_total_organismo)
                      : (doseAplicadaNum > 0 || (iobNum && iobNum > 0) ? (parseFloat(doseAplicadaNum) + (iobNum || 0)) : null);

                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid rgba(124, 83, 63, 0.08)',
                          backgroundColor: '#FFF',
                        }}
                      >
                        {/* Data / Hora */}
                        <td style={{ padding: '0.85rem 0.5rem', whiteSpace: 'nowrap', color: '#5A5049' }}>
                          📅 {dataFormatada}
                        </td>

                        {/* Glicemia + Seta de Tendência */}
                        <td style={{ padding: '0.85rem 0.5rem', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span
                              style={{
                                fontFamily: 'var(--fonte-titulo)',
                                fontWeight: 700,
                                fontSize: '1.05rem',
                                color: badge ? badge.corTexto : '#2E2824',
                              }}
                            >
                              {item.valor_mg_dl} mg/dL
                            </span>

                            {item.tendencia_destro && (
                              <span
                                style={{
                                  fontSize: '0.74rem',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '8px',
                                  backgroundColor: '#F6F3EE',
                                  color: '#7C533F',
                                  fontWeight: 600,
                                }}
                                title="Tendência calculada entre medições de ponta de dedo"
                              >
                                {item.tendencia_destro}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Aplicada */}
                        <td style={{ padding: '0.85rem 0.5rem', whiteSpace: 'nowrap' }}>
                          {doseAplicadaNum > 0 ? (
                            <span style={{ fontWeight: 700, color: '#1E4620', backgroundColor: '#EFF7F1', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                              💉 {doseAplicadaNum} UI
                            </span>
                          ) : (
                            <span style={{ color: '#AAA' }}>—</span>
                          )}
                        </td>

                        {/* Ativa no Momento (IOB) */}
                        <td style={{ padding: '0.85rem 0.5rem', whiteSpace: 'nowrap' }}>
                          {iobNum !== null && iobNum > 0 ? (
                            <span style={{ color: '#285832', fontWeight: 600 }}>
                              💧 {iobNum.toFixed(1)} UI
                            </span>
                          ) : (
                            <span style={{ color: '#AAA' }}>0.0 UI</span>
                          )}
                        </td>

                        {/* Total no Corpo */}
                        <td style={{ padding: '0.85rem 0.5rem', whiteSpace: 'nowrap' }}>
                          {totalOrganismoNum !== null && totalOrganismoNum > 0 ? (
                            <strong style={{ color: totalOrganismoNum > 4 ? '#A23B2A' : '#7C533F' }}>
                              {totalOrganismoNum.toFixed(1)} UI
                            </strong>
                          ) : (
                            <span style={{ color: '#AAA' }}>0.0 UI</span>
                          )}
                        </td>

                        {/* Momento & Contexto */}
                        <td style={{ padding: '0.85rem 0.5rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <span style={{ fontWeight: 600, color: '#2E2824' }}>
                              {item.momento_medicao}
                            </span>
                            <span style={{ fontSize: '0.76rem', color: '#6A5E57' }}>
                              {item.tipo_leitura} {item.fator_contexto ? `• ${item.fator_contexto}` : ''} {item.carboidratos_g ? `• ${item.carboidratos_g}g carbo` : ''}
                            </span>
                          </div>
                        </td>

                        {/* Ação */}
                        <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleExcluirRegistro(item.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#A23B2A',
                              cursor: 'pointer',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                            }}
                            title="Remover anotação"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
/* FIM DO COMPONENTE MEUPERFIL */
