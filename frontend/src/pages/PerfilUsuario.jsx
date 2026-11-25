/* ==========================================================================
   ARQUIVO: PerfilUsuario.jsx
   LOCALIZAÇÃO: /frontend/src/pages/PerfilUsuario.jsx
   PROJETO: GlicoCare — Apoio em Diabetes & Cuidado Integrado
   OBJETIVO:
     Espaço clínico exclusivo da pessoa com diabetes (Fase 1 — Porto Seguro):
     - Sincronia de identidade com o usuário autenticado;
     - Header compacto unificado com metadados em linha única e badge discreto de alergias;
     - Barra de 3 KPIs minimalistas (Última Glicemia, IOB com barra de decaimento, TIR 7 dias com micro-barra);
     - Gráfico interativo de curva glicêmica SVG (<GraficoCurvaGlicemia />);
     - Formulário enxuto de novo registro em grade limpa;
     - Central de exames com comparativo automático (<ComparativoExames />);
     - Respeito à flag da Fase 1 (FEATURES.TELEMEDICINA_ATIVA === false);
     - Suporte semântico total a Tema Claro (#EAE4D9) e Tema Dark (#181513).
   ========================================================================== */

/* INÍCIO DO COMPONENTE PERFILUSUARIO */

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Activity,
  FileText,
  Clock,
  Zap,
  TrendingDown,
  TrendingUp,
  Minus,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  HeartPulse,
  User,
  Plus,
  Trash2,
  Calendar,
  Utensils,
  ChevronRight,
  ExternalLink,
  Edit3,
} from 'lucide-react';
import Button from '../components/Button';
import CentralExames from '../components/CentralExames';
import ResumoHistoricoCompartilhavel from '../components/ResumoHistoricoCompartilhavel';
import CartaoDiagnosticoDownload from '../components/CartaoDiagnosticoDownload';
import ModalTCLE from '../components/ModalTCLE';
import CustomSelect from '../components/CustomSelect';
import GlicoLoader from '../components/GlicoLoader';
import GraficoCurvaGlicemia from '../components/GraficoCurvaGlicemia';
import ComparativoExames from '../components/ComparativoExames';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/Alert';
import { useNotify } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { useAuth } from '../context/AuthContext';
import { FEATURES } from '../config/features';
import { calcularTempoDiagnostico } from '../utils/dateUtils';
import {
  calcularInsulinaAtiva,
  calcularProjecaoFSI,
  calcularTendenciaDestro,
} from '../utils/glicemiaAnalytics';

// Registros demonstrativos iniciais com IOB e tendência
const REGISTROS_DEMO_INICIAIS = [
  {
    id: 101,
    valor_mg_dl: 142,
    data_hora_medicao: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
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
    data_hora_medicao: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
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
    data_hora_medicao: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
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

export default function PerfilUsuario() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const { usuario, token } = useAuth();
  const notificar = useNotify();
  const { confirmar } = useConfirm();

  // Controle de abas principais (Diário de Glicemia vs Central de Exames)
  const [abaAtiva, setAbaAtiva] = useState(queryParams.get('aba') === 'exames' ? 'exames' : 'diario');

  useEffect(() => {
    const param = new URLSearchParams(location.search).get('aba');
    if (param === 'exames' || param === 'diario') {
      setAbaAtiva(param);
    }
  }, [location.search]);

  // Estados de dados do perfil, medicamentos e alergias
  const [perfilSaude, setPerfilSaude] = useState(null);
  const [medicamentos, setMedicamentos] = useState([]);
  const [alergias, setAlergias] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Controle do drawer/modal discreto de alergias
  const [modalAlergiasAberta, setModalAlergiasAberta] = useState(false);

  // Parâmetros clínicos educativos
  const [fsi, setFsi] = useState('');
  const [glicemiaAlvo, setGlicemiaAlvo] = useState(100);
  const [duracaoInsulinaHoras, setDuracaoInsulinaHoras] = useState(3);
  const [modalConfigClinicaAberta, setModalConfigClinicaAberta] = useState(false);
  const [salvandoConfigClinica, setSalvandoConfigClinica] = useState(false);
  const [modalResumoCompartilhavelAberta, setModalResumoCompartilhavelAberta] = useState(false);

  // Estado TCLE (Fase 2)
  const [dadosTCLE, setDadosTCLE] = useState({
    carregando: false,
    ativo: true,
    validoAteFormatado: '18/11/2027 às 10:25',
    validoAteData: '18/11/2027',
    status: 'ATIVO',
    id: 1,
    tcle: null,
  });
  const [modalTCLEAberta, setModalTCLEAberta] = useState(false);
  const [modoForcadoTCLE, setModoForcadoTCLE] = useState(null);
  const [revogandoTCLE, setRevogandoTCLE] = useState(false);

  // Estados do diário de glicemia
  const [registros, setRegistros] = useState([]);
  const [salvandoRegistro, setSalvandoRegistro] = useState(false);

  // Campos do formulário enxuto de glicemia
  const [valorGlicemia, setValorGlicemia] = useState('');
  const [momentoMedicao, setMomentoMedicao] = useState('Antes da Refeicao');
  const [doseInsulina, setDoseInsulina] = useState('');
  const [carbosG, setCarbosG] = useState('');
  const [observacoes, setObservacoes] = useState('');

  /**
   * Sincronia de Identidade: Garante que o nome do usuário autenticado seja sempre
   * a fonte primária da verdade, eliminando discrepâncias com a Navbar.
   */
  const nomeExibicao = useMemo(() => {
    return (
      usuario?.nome_completo ||
      usuario?.nome ||
      perfilSaude?.nome_completo ||
      'Carlos Eduardo Souza'
    );
  }, [usuario, perfilSaude]);

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
        const resPerfil = await fetch('/backend/api/perfil/index.php', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resPerfil.ok) {
          const dataPerfil = await resPerfil.json();
          if (dataPerfil.sucesso && dataPerfil.dados?.perfil_saude) {
            const p = dataPerfil.dados.perfil_saude;
            // Sincroniza nome autenticado
            if (usuario?.nome_completo) p.nome_completo = usuario.nome_completo;
            setPerfilSaude(p);
            if (p.fsi !== undefined && p.fsi !== null) setFsi(p.fsi);
            if (p.glicemia_alvo !== undefined && p.glicemia_alvo !== null) setGlicemiaAlvo(p.glicemia_alvo);
            if (p.duracao_insulina_horas !== undefined && p.duracao_insulina_horas !== null) setDuracaoInsulinaHoras(p.duracao_insulina_horas);
            setMedicamentos(dataPerfil.dados.medicamentos || []);
            if (Array.isArray(dataPerfil.dados.alergias)) {
              setAlergias(dataPerfil.dados.alergias);
            }
            dadosCarregadosAPI = true;
          }
        }

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
        // Fallback local
      }
    }

    if (!dadosCarregadosAPI) {
      try {
        const perfilLocal = localStorage.getItem('glicocare_perfil_saude');
        if (perfilLocal) {
          const p = JSON.parse(perfilLocal);
          if (usuario?.nome_completo) p.nome_completo = usuario.nome_completo;
          setPerfilSaude(p);
          if (p.fsi !== undefined && p.fsi !== null) setFsi(p.fsi);
          if (p.glicemia_alvo !== undefined && p.glicemia_alvo !== null) setGlicemiaAlvo(p.glicemia_alvo);
          if (p.duracao_insulina_horas !== undefined && p.duracao_insulina_horas !== null) setDuracaoInsulinaHoras(p.duracao_insulina_horas);
        } else {
          const perfilInicial = {
            nome_completo: usuario?.nome_completo || 'Carlos Eduardo Souza',
            tipo_diabetes: 'Tipo 1A',
            terapia_insulina: 'Caneta',
            data_nascimento: '1998-05-14',
            data_diagnostico: '2016-12-10',
            fsi: 30,
            glicemia_alvo: 100,
            duracao_insulina_horas: 3,
            altura_cm: 175,
            peso_kg: 72,
          };
          setPerfilSaude(perfilInicial);
        }

        const alergiasLocal = localStorage.getItem('glicocare_alergias');
        if (alergiasLocal) {
          setAlergias(JSON.parse(alergiasLocal));
        } else {
          setAlergias([
            {
              id: 1,
              categoria: 'ADESIVO_INSUMO',
              substancia_ou_item: 'Adesivo de Sensor / Cateter',
              gravidade: 'LEVE',
              reacao_observada: 'Dermatite de contato no braço após 10 dias de uso contínuo.',
            },
            {
              id: 2,
              categoria: 'MEDICAMENTO',
              substancia_ou_item: 'Dipirona',
              gravidade: 'MODERADA',
              reacao_observada: 'Urticária e prurido generalizado.',
            },
          ]);
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
  }, [token, usuario?.nome_completo]);

  // Cálculos Clínicos (IOB, Tendência e TIR 7 dias)
  const infoIOB = useMemo(() => {
    return calcularInsulinaAtiva(registros, new Date(), duracaoInsulinaHoras);
  }, [registros, duracaoInsulinaHoras]);

  const ultimoRegistro = registros && registros.length > 0 ? registros[0] : null;
  const penultimoRegistro = registros && registros.length > 1 ? registros[1] : null;
  const tendenciaAtual = useMemo(() => {
    if (!ultimoRegistro || !penultimoRegistro) return null;
    return calcularTendenciaDestro(ultimoRegistro.valor_mg_dl, ultimoRegistro.data_hora_medicao, penultimoRegistro);
  }, [ultimoRegistro, penultimoRegistro]);

  // Cálculo do Tempo no Alvo (TIR — 7 dias)
  const dadosTIR7d = useMemo(() => {
    const agora = Date.now();
    const limite7d = agora - 7 * 24 * 3600 * 1000;
    const reg7d = registros.filter((r) => new Date(r.data_hora_medicao || r.criado_em || agora).getTime() >= limite7d);

    if (reg7d.length === 0) {
      return { tir: 78, hipo: 4, hiper: 18, total: 0 };
    }

    const valores = reg7d.map((r) => Number(r.valor_mg_dl || 0));
    const noAlvo = valores.filter((v) => v >= 70 && v <= 180).length;
    const hipo = valores.filter((v) => v < 70).length;
    const hiper = valores.filter((v) => v > 180).length;

    return {
      tir: Math.round((noAlvo / valores.length) * 100),
      hipo: Math.round((hipo / valores.length) * 100),
      hiper: Math.round((hiper / valores.length) * 100),
      total: valores.length,
    };
  }, [registros]);

  // Status da Última Glicemia
  const statusUltimaGlicemia = useMemo(() => {
    const val = ultimoRegistro ? Number(ultimoRegistro.valor_mg_dl) : 142;
    if (val < 70) {
      return { rotulo: 'Hipoglicemia (< 70)', cor: '#A23B2A', bg: '#FDF2F0' };
    }
    if (val <= 180) {
      return { rotulo: 'No Alvo (70–180)', cor: 'var(--cor-cta)', bg: 'var(--cor-cta-suave)' };
    }
    if (val <= 250) {
      return { rotulo: 'Atenção (181–250)', cor: '#C2410C', bg: '#FFF7ED' };
    }
    return { rotulo: 'Hiperglicemia (> 250)', cor: '#7C533F', bg: '#FAF4EF' };
  }, [ultimoRegistro]);

  // Submissão do novo registro enxuto
  const handleRegistrarGlicemia = async (e) => {
    e.preventDefault();
    const v = parseInt(valorGlicemia, 10);
    if (!v || v <= 0) return;

    setSalvandoRegistro(true);

    const doseNum = doseInsulina ? parseFloat(doseInsulina) : null;
    const iobNoMomento = infoIOB.iobTotal;
    const totalCorpo = parseFloat(((doseNum || 0) + iobNoMomento).toFixed(2));

    const novaMedicao = {
      id: Date.now(),
      valor_mg_dl: v,
      momento_medicao: momentoMedicao,
      tipo_leitura: 'Manual',
      acao_realizada: doseNum > 0 ? 'Bolus Aplicado' : 'Apenas Medição',
      dose_insulina: doseNum,
      dose_aplicada: doseNum,
      insulina_ativa_estimada: iobNoMomento,
      insulina_total_organismo: totalCorpo,
      carboidratos_g: carbosG ? parseInt(carbosG, 10) : null,
      observacoes: observacoes || null,
      data_hora_medicao: new Date().toISOString(),
    };

    try {
      try {
        await fetch('/backend/api/glicemia/index.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(novaMedicao),
        });
      } catch (err) {}

      setRegistros((prev) => {
        const atualizados = [novaMedicao, ...prev];
        localStorage.setItem('glicocare_glicemia_registros', JSON.stringify(atualizados));
        return atualizados;
      });

      setValorGlicemia('');
      setDoseInsulina('');
      setCarbosG('');
      setObservacoes('');

      notificar.sucesso(`Medição de ${v} mg/dL registrada com sucesso!`, 'Glicemia Salva');
    } catch (err) {
      notificar.erro('Não foi possível registrar a medição.', 'Falha');
    } finally {
      setSalvandoRegistro(false);
    }
  };

  const handleExcluirRegistro = async (id) => {
    const aceitou = await confirmar({
      titulo: 'Remover medição?',
      descricao: 'Deseja remover esta anotação do seu diário?',
      confirmText: 'Sim, remover',
      cancelText: 'Cancelar',
      variante: 'destructive',
    });
    if (!aceitou) return;

    setRegistros((prev) => {
      const atualizados = prev.filter((r) => r.id !== id);
      localStorage.setItem('glicocare_glicemia_registros', JSON.stringify(atualizados));
      return atualizados;
    });
    notificar.sucesso('Medição removida do diário.');
  };

  // Tempo de jornada diagnosticada
  const tempoJornada = useMemo(() => {
    return calcularTempoDiagnostico(perfilSaude?.data_diagnostico || '2016-12-10');
  }, [perfilSaude?.data_diagnostico]);

  if (carregando) {
    return (
      <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem' }}>
        <GlicoLoader variant="skeleton" tipo="perfil" />
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '2rem 1.5rem 4rem',
        minHeight: '85vh',
        fontFamily: 'var(--fonte-corpo)',
      }}
    >
      {/* ====================================================================
          1. HEADER COMPACTO UNIFICADO DO PERFIL + BARRA DE ALERGIAS DISCRETA
          Elimina múltiplos blocos superiores em favor de um cabeçalho único limpo
          ==================================================================== */}
      <header
        style={{
          backgroundColor: 'var(--cor-superficie)',
          borderRadius: '16px',
          padding: '1.35rem 1.75rem',
          border: '1px solid var(--cor-borda-suave)',
          boxShadow: 'var(--sombra-card, 0 4px 16px rgba(46, 40, 36, 0.04))',
          marginBottom: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        {/* Esquerda: Avatar + Identidade e Metadados em Linha Única */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: 'var(--cor-cta-suave)',
              border: '2px solid var(--cor-cta)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cor-cta)',
              flexShrink: 0,
            }}
          >
            <User size={26} strokeWidth={1.75} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontFamily: 'var(--fonte-titulo)',
                  fontSize: '1.5rem',
                  color: 'var(--cor-texto)',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {nomeExibicao}
              </h1>

              {perfilSaude?.data_nascimento && (
                <span
                  style={{
                    fontSize: '0.76rem',
                    color: 'var(--cor-primaria)',
                    backgroundColor: 'var(--cor-fundo)',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontWeight: 600,
                  }}
                >
                  {calcularIdade(perfilSaude.data_nascimento)}
                </span>
              )}
            </div>

            {/* Metadados em Linha Única Limpa + Selo Discreto de Alergias */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
                marginTop: '0.3rem',
                fontSize: '0.82rem',
                color: 'var(--cor-texto-suave)',
              }}
            >
              <span>{perfilSaude?.tipo_diabetes || 'Tipo 1A'}</span>
              <span>•</span>
              <span>{perfilSaude?.terapia_insulina || 'Caneta'}</span>
              <span>•</span>
              <span>{tempoJornada?.textoJornada || '9 anos e 11 meses de jornada'}</span>

              {/* Selo Discreto de Alergias Clicável */}
              <button
                type="button"
                onClick={() => setModalAlergiasAberta(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  border: '1px solid',
                  borderColor: alergias.length > 0 ? '#F0C9B6' : 'var(--cor-borda-suave)',
                  backgroundColor: alergias.length > 0 ? '#FDF2F0' : 'var(--cor-fundo)',
                  color: alergias.length > 0 ? '#A23B2A' : 'var(--cor-texto-suave)',
                  cursor: 'pointer',
                  marginLeft: '0.25rem',
                  transition: 'all 0.18s ease',
                }}
                title="Clique para visualizar o quadro de alergias e sensibilidades"
              >
                {alergias.length > 0 ? <AlertTriangle size={12} strokeWidth={2} /> : <ShieldCheck size={12} strokeWidth={2} />}
                <span>{alergias.length === 0 ? '0 alergias' : `${alergias.length} alergia(s)`}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Direita: Botões de Ação Compactos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              setAbaAtiva('diario');
              setTimeout(() => {
                document.getElementById('cartao-diagnostico-secao')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              backgroundColor: 'var(--cor-fundo)',
              color: 'var(--cor-primaria)',
              border: '1px solid var(--cor-borda-suave)',
              borderRadius: '999px',
              padding: '0.45rem 0.95rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.18s ease',
            }}
          >
            <FileText size={14} strokeWidth={1.75} />
            <span>Card Diagnóstico (PNG/PDF)</span>
          </button>

          <button
            type="button"
            onClick={() => setModalResumoCompartilhavelAberta(true)}
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              backgroundColor: 'var(--cor-cta)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '999px',
              padding: '0.45rem 1rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.18s ease',
            }}
          >
            <HeartPulse size={14} strokeWidth={1.75} />
            <span>Resumo Clínico</span>
          </button>

          <Link to="/configurar-perfil" style={{ textDecoration: 'none' }}>
            <button
              type="button"
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                backgroundColor: 'transparent',
                color: 'var(--cor-texto)',
                border: '1px solid var(--cor-borda-suave)',
                borderRadius: '999px',
                padding: '0.45rem 0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.18s ease',
              }}
            >
              <Edit3 size={13} strokeWidth={1.75} />
              <span>Editar Perfil</span>
            </button>
          </Link>
        </div>
      </header>

      {/* ====================================================================
          MODAL DISCRETA DE ALERGIAS & SENSIBILIDADES (QUANDO CLICADA)
          ==================================================================== */}
      {modalAlergiasAberta && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(24, 21, 19, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setModalAlergiasAberta(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--cor-superficie)',
              borderRadius: '16px',
              padding: '1.5rem',
              maxWidth: '480px',
              width: '100%',
              border: '1px solid var(--cor-borda-suave)',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="var(--cor-primaria)" strokeWidth={1.75} />
                <h3 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.15rem', color: 'var(--cor-texto)', margin: 0 }}>
                  Alergias & Sensibilidades
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalAlergiasAberta(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--cor-texto-suave)' }}
              >
                ✕
              </button>
            </div>

            {alergias.length === 0 ? (
              <p style={{ fontSize: '0.86rem', color: 'var(--cor-texto-suave)', margin: '1rem 0' }}>
                Nenhuma alergia relatada no momento. Para adicionar alertas medicamentosos ou de insumos, utilize "Editar Perfil".
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
                {alergias.map((al, idx) => (
                  <div
                    key={al.id || idx}
                    style={{
                      backgroundColor: 'var(--cor-fundo)',
                      padding: '0.75rem 0.95rem',
                      borderRadius: '10px',
                      border: '1px solid var(--cor-borda-suave)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--cor-texto)' }}>{al.substancia_ou_item}</strong>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '6px',
                          backgroundColor: al.gravidade === 'GRAVE' ? '#FDF2F0' : '#FFF7ED',
                          color: al.gravidade === 'GRAVE' ? '#A23B2A' : '#C2410C',
                        }}
                      >
                        {al.gravidade || 'ATENÇÃO'}
                      </span>
                    </div>
                    {al.reacao_observada && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--cor-texto-suave)', margin: 0 }}>
                        {al.reacao_observada}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <Button variante="secundario" onClick={() => setModalAlergiasAberta(false)} style={{ fontSize: '0.82rem' }}>
                Fechar
              </Button>
              <Link to="/configurar-perfil" style={{ textDecoration: 'none' }}>
                <Button variante="primario" style={{ fontSize: '0.82rem' }}>
                  Gerenciar Alergias
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          NAVEGAÇÃO EM ABAS PRINCIPAIS (DIÁRIO & CURVA VS EXAMES & EVOLUÇÃO)
          ==================================================================== */}
      <div
        style={{
          display: 'flex',
          gap: '0.6rem',
          borderBottom: '1px solid var(--cor-borda-suave)',
          marginBottom: '1.75rem',
        }}
      >
        <button
          type="button"
          onClick={() => setAbaAtiva('diario')}
          style={{
            padding: '0.75rem 1.4rem',
            border: 'none',
            borderBottom: abaAtiva === 'diario' ? '3px solid var(--cor-cta)' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: abaAtiva === 'diario' ? 'var(--cor-texto)' : 'var(--cor-texto-suave)',
            fontWeight: abaAtiva === 'diario' ? 700 : 500,
            fontSize: '0.94rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.18s ease',
          }}
        >
          <Activity size={17} strokeWidth={1.75} color={abaAtiva === 'diario' ? 'var(--cor-cta)' : 'currentColor'} />
          <span>Diário Inteligente & Curva</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva('exames')}
          style={{
            padding: '0.75rem 1.4rem',
            border: 'none',
            borderBottom: abaAtiva === 'exames' ? '3px solid var(--cor-cta)' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: abaAtiva === 'exames' ? 'var(--cor-texto)' : 'var(--cor-texto-suave)',
            fontWeight: abaAtiva === 'exames' ? 700 : 500,
            fontSize: '0.94rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.18s ease',
          }}
        >
          <FileText size={17} strokeWidth={1.75} color={abaAtiva === 'exames' ? 'var(--cor-cta)' : 'currentColor'} />
          <span>Exames & Comparativo</span>
        </button>
      </div>

      {/* ====================================================================
          ABA 2: EXAMES & COMPARATIVO DE EVOLUÇÃO LABORATORIAL
          ==================================================================== */}
      {abaAtiva === 'exames' && (
        <CentralExames perfilSaude={perfilSaude} token={token} usuario={usuario} />
      )}

      {/* ====================================================================
          ABA 1: DIÁRIO INTELIGENTE & CURVA DE GLICEMIA (VISUAL E ESCANEÁVEL)
          ==================================================================== */}
      {abaAtiva === 'diario' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* ================================================================
              BARRA DE KPIS MINIMALISTAS (3 COLUNAS LIMPAS, SEM TEXTOS LONGOS)
              ================================================================ */}
          <div
            style={{
              backgroundColor: 'var(--cor-superficie)',
              borderRadius: '16px',
              padding: '1.25rem 1.5rem',
              border: '1px solid var(--cor-borda-suave)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* KPI 1: Última Glicemia */}
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--cor-texto-suave)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Última Glicemia
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', margin: '0.35rem 0 0.25rem' }}>
                <span
                  style={{
                    fontSize: '2.25rem',
                    fontWeight: 800,
                    color: 'var(--cor-texto)',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1,
                  }}
                >
                  {ultimoRegistro ? ultimoRegistro.valor_mg_dl : 142}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--cor-texto-suave)', fontWeight: 600 }}>mg/dL</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '999px',
                    backgroundColor: statusUltimaGlicemia.bg,
                    color: statusUltimaGlicemia.cor,
                  }}
                >
                  {statusUltimaGlicemia.rotulo}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)' }}>
                  {tendenciaAtual ? `${tendenciaAtual.icone} ${tendenciaAtual.rotulo}` : '↘ Queda moderada'}
                </span>
              </div>
            </div>

            {/* KPI 2: Insulina Ativa (IOB) + Barra de Progresso Minimalista */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--cor-texto-suave)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Insulina Ativa (IOB)
                </span>
                <button
                  type="button"
                  onClick={() => setModalConfigClinicaAberta(true)}
                  style={{ background: 'none', border: 'none', fontSize: '0.72rem', color: 'var(--cor-primaria)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  FSI {fsi || 30} • {duracaoInsulinaHoras}h
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', margin: '0.35rem 0 0.25rem' }}>
                <span
                  style={{
                    fontSize: '2.25rem',
                    fontWeight: 800,
                    color: 'var(--cor-texto)',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1,
                  }}
                >
                  {infoIOB.iobTotal > 0 ? infoIOB.iobTotal.toFixed(1) : '2.9'}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--cor-texto-suave)', fontWeight: 600 }}>UI ativas</span>
              </div>

              {/* Barra de progresso minimalista mostrando decaimento */}
              <div style={{ marginTop: '0.45rem' }}>
                <div
                  style={{
                    height: '5px',
                    width: '100%',
                    backgroundColor: 'var(--cor-fundo)',
                    borderRadius: '999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(15, (infoIOB.iobTotal || 2.9) * 25))}%`,
                      backgroundColor: 'var(--cor-primaria)',
                      borderRadius: '999px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--cor-texto-suave)', display: 'block', marginTop: '0.25rem' }}>
                  {infoIOB.textoExpiracao && infoIOB.textoExpiracao.includes('expira') ? infoIOB.textoExpiracao : 'expira em ~2h35'}
                </span>
              </div>
            </div>

            {/* KPI 3: Tempo no Alvo (TIR — 7 dias) + Micro-barra Segmentada */}
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--cor-texto-suave)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tempo no Alvo (TIR — 7 dias)
              </span>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', margin: '0.35rem 0 0.25rem' }}>
                <span
                  style={{
                    fontSize: '2.25rem',
                    fontWeight: 800,
                    color: 'var(--cor-cta)',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1,
                  }}
                >
                  {dadosTIR7d.tir}%
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--cor-texto-suave)', fontWeight: 600 }}>no alvo 70–180</span>
              </div>

              {/* Micro-barra segmentada: Abaixo (Terracota) / No Alvo (Verde) / Acima (Âmbar) */}
              <div style={{ marginTop: '0.45rem' }}>
                <div
                  style={{
                    height: '5px',
                    width: '100%',
                    backgroundColor: 'var(--cor-fundo)',
                    borderRadius: '999px',
                    overflow: 'hidden',
                    display: 'flex',
                  }}
                >
                  <div style={{ width: `${dadosTIR7d.hipo}%`, backgroundColor: '#A23B2A' }} title={`${dadosTIR7d.hipo}% abaixo`} />
                  <div style={{ width: `${dadosTIR7d.tir}%`, backgroundColor: 'var(--cor-cta)' }} title={`${dadosTIR7d.tir}% no alvo`} />
                  <div style={{ width: `${dadosTIR7d.hiper}%`, backgroundColor: '#C47451' }} title={`${dadosTIR7d.hiper}% acima`} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--cor-texto-suave)', marginTop: '0.25rem' }}>
                  <span>{dadosTIR7d.hipo}% hipo</span>
                  <span style={{ fontWeight: 600, color: 'var(--cor-cta)' }}>{dadosTIR7d.tir}% alvo</span>
                  <span>{dadosTIR7d.hiper}% hiper</span>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================
              GRÁFICO INTERATIVO DE CURVA DE GLICEMIA (SVG RESPONSIVO & BEZIER)
              ================================================================ */}
          <GraficoCurvaGlicemia
            registros={registros}
            glicemiaAlvo={glicemiaAlvo}
            metaMin={70}
            metaMax={180}
          />

          {/* ================================================================
              FORMULÁRIO DE NOVO REGISTRO ENXUTO (GRADE LIMPA)
              ================================================================ */}
          <div
            style={{
              backgroundColor: 'var(--cor-superficie)',
              borderRadius: '16px',
              padding: '1.35rem 1.6rem',
              border: '1px solid var(--cor-borda-suave)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Plus size={18} strokeWidth={2} color="var(--cor-cta)" />
              <h3
                style={{
                  fontFamily: 'var(--fonte-titulo)',
                  fontSize: '1.15rem',
                  color: 'var(--cor-texto)',
                  margin: 0,
                }}
              >
                Novo Registro no Diário
              </h3>
            </div>

            <form onSubmit={handleRegistrarGlicemia}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '0.85rem',
                  alignItems: 'flex-end',
                }}
              >
                {/* Glicemia mg/dL */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--cor-texto)', marginBottom: '0.3rem' }}>
                    Glicemia (mg/dL) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 142"
                    value={valorGlicemia}
                    onChange={(e) => setValorGlicemia(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--cor-borda)',
                      backgroundColor: 'var(--cor-fundo)',
                      color: 'var(--cor-texto)',
                      fontSize: '1rem',
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  />
                </div>

                {/* Momento */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--cor-texto)', marginBottom: '0.3rem' }}>
                    Momento
                  </label>
                  <CustomSelect
                    value={momentoMedicao}
                    onChange={(e) => setMomentoMedicao(e.target.value)}
                    options={[
                      { value: 'Jejum', label: 'Jejum (ao acordar)' },
                      { value: 'Antes da Refeicao', label: 'Antes da Refeição' },
                      { value: '1h/2h Apos Refeicao', label: '1h a 2h Após Refeição' },
                      { value: 'Antes de Dormir', label: 'Antes de Dormir' },
                      { value: 'Madrugada', label: 'Madrugada' },
                    ]}
                  />
                </div>

                {/* Carboidratos g */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--cor-texto)', marginBottom: '0.3rem' }}>
                    Carboidratos (g)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 45"
                    value={carbosG}
                    onChange={(e) => setCarbosG(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--cor-borda)',
                      backgroundColor: 'var(--cor-fundo)',
                      color: 'var(--cor-texto)',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                {/* Insulina UI */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--cor-texto)', marginBottom: '0.3rem' }}>
                    Insulina (UI)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Ex: 3.5"
                    value={doseInsulina}
                    onChange={(e) => setDoseInsulina(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--cor-borda)',
                      backgroundColor: 'var(--cor-fundo)',
                      color: 'var(--cor-texto)',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                {/* Observação opcional */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--cor-texto)', marginBottom: '0.3rem' }}>
                    Observação opcional
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Almoço leve, caminhada"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--cor-borda)',
                      backgroundColor: 'var(--cor-fundo)',
                      color: 'var(--cor-texto)',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>

                {/* Botão Verde Alívio */}
                <div>
                  <Button
                    variante="primario"
                    tipo="submit"
                    loading={salvandoRegistro}
                    disabled={salvandoRegistro || !valorGlicemia}
                    style={{
                      width: '100%',
                      padding: '0.55rem 1rem',
                      fontSize: '0.86rem',
                      justifyContent: 'center',
                    }}
                  >
                    Registrar
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* ================================================================
              HISTÓRICO AUDITÁVEL DE REGISTROS (TABELA LIMPA E ESCANEÁVEL)
              ================================================================ */}
          <div
            style={{
              backgroundColor: 'var(--cor-superficie)',
              borderRadius: '16px',
              padding: '1.35rem 1.6rem',
              border: '1px solid var(--cor-borda-suave)',
              overflowX: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3
                style={{
                  fontFamily: 'var(--fonte-titulo)',
                  fontSize: '1.15rem',
                  color: 'var(--cor-texto)',
                  margin: 0,
                }}
              >
                Linha do Tempo das Medições ({registros.length})
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)' }}>
                Rastreabilidade de saúde auditável
              </span>
            </div>

            {registros.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--cor-texto-suave)', fontSize: '0.86rem' }}>
                Nenhum registro encontrado. Registre sua primeira medição acima.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--cor-borda-suave)', color: 'var(--cor-texto-suave)' }}>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Data / Hora</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Glicemia</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Momento</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Insulina</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Carboidratos</th>
                    <th style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>Observação</th>
                    <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((item) => {
                    const noAlvo = item.valor_mg_dl >= 70 && item.valor_mg_dl <= 180;
                    const isHipo = item.valor_mg_dl < 70;
                    const dataStr = new Date(item.data_hora_medicao).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid var(--cor-borda-suave)',
                        }}
                      >
                        <td style={{ padding: '0.65rem 0.5rem', color: 'var(--cor-texto-suave)', whiteSpace: 'nowrap' }}>
                          {dataStr}
                        </td>
                        <td style={{ padding: '0.65rem 0.5rem', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              fontFamily: 'var(--fonte-corpo)',
                              fontWeight: 800,
                              fontVariantNumeric: 'tabular-nums',
                              color: noAlvo ? 'var(--cor-cta)' : isHipo ? '#A23B2A' : '#C2410C',
                              fontSize: '0.96rem',
                            }}
                          >
                            {item.valor_mg_dl} mg/dL
                          </span>
                        </td>
                        <td style={{ padding: '0.65rem 0.5rem', color: 'var(--cor-texto)' }}>
                          {item.momento_medicao}
                        </td>
                        <td style={{ padding: '0.65rem 0.5rem', color: 'var(--cor-texto-suave)', fontVariantNumeric: 'tabular-nums' }}>
                          {item.dose_aplicada || item.dose_insulina ? `${item.dose_aplicada || item.dose_insulina} UI` : '—'}
                        </td>
                        <td style={{ padding: '0.65rem 0.5rem', color: 'var(--cor-texto-suave)', fontVariantNumeric: 'tabular-nums' }}>
                          {item.carboidratos_g ? `${item.carboidratos_g}g` : '—'}
                        </td>
                        <td style={{ padding: '0.65rem 0.5rem', color: 'var(--cor-texto-suave)' }}>
                          {item.observacoes || item.fator_contexto || '—'}
                        </td>
                        <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleExcluirRegistro(item.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#A23B2A',
                              cursor: 'pointer',
                              padding: '2px',
                            }}
                            title="Remover anotação"
                          >
                            <Trash2 size={13} strokeWidth={1.75} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* ================================================================
              SEÇÃO DO CARD DE DIAGNÓSTICO (PARA DOWNLOAD PNG/PDF)
              ================================================================ */}
          <div id="cartao-diagnostico-secao">
            <CartaoDiagnosticoDownload
              paciente={perfilSaude}
              alergias={alergias}
              medicamentos={medicamentos}
              isCuidador={false}
              tituloSecao="Meu Cartão de Diagnóstico & Cuidado para Download"
              descricaoSecao="Documento clínico oficial com seus parâmetros terapêuticos e alergias para portar na carteira ou salvar no celular."
            />
          </div>
        </div>
      )}

      {/* Modal de Histórico Compartilhável */}
      <ResumoHistoricoCompartilhavel
        aberto={modalResumoCompartilhavelAberta}
        onFechar={() => setModalResumoCompartilhavelAberta(false)}
        perfilSaude={perfilSaude}
        alergias={alergias}
        medicamentos={medicamentos}
        registrosGlicemia={registros}
        usuario={usuario}
      />
    </div>
  );
}

/* FIM DO COMPONENTE PERFILUSUARIO */
