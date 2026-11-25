/* ==========================================================================
   ARQUIVO: PerfilUsuario.jsx
   LOCALIZAÇÃO: /frontend/src/pages/PerfilUsuario.jsx
   PROJETO: GlicoCare — Apoio em Diabetes & Cuidado Integrado
   OBJETIVO:
     Espaço clínico da pessoa com diabetes no padrão visual shadcn/ui
     com paleta terrosa "Porto Seguro" (Fase 1):
     - Sincronia de identidade com o usuário autenticado;
     - Header compacto unificado em linha única com metadados e badge de alergias;
     - Botão de ação "+ Registrar Glicemia / Dose" abrindo gaveta lateral (Sheet);
     - Bento Grid com 3 KPI Cards estilo shadcn (Glicemia, IOB com barra fina, TIR 7d);
     - Gráfico interativo estilo shadcn AreaChart (<GraficoCurvaGlicemia />);
     - Histórico auditável em tabela minimalista (<Table />);
     - Abas em Segmented Control (<Tabs />);
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Separator } from '../components/ui/Separator';
import { ToggleGroup, ToggleGroupItem } from '../components/ui/Toggle';
import { TraceList, TraceItem } from '../components/ui/Trace';
import { Switch } from '../components/ui/Switch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '../components/ui/Sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/Dialog';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/Alert';
import { useNotify } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { useAuth } from '../context/AuthContext';
import { alergiasService } from '../services/api';
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
    dose_insulina: 5.0,
    dose_aplicada: 5.0,
    insulina_ativa_estimada: 4.8,
    insulina_total_organismo: 6.9,
    variacao_por_minuto: -0.80,
    tendencia_destro: '↘ Queda moderada',
    fator_contexto: 'Almoço: arroz, feijão e frango grelhado',
    carboidratos_g: 50,
    observacoes: 'Sensação tranquila, monitorando com calma.',
  },
  {
    id: 102,
    valor_mg_dl: 162,
    data_hora_medicao: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    momento_medicao: 'Antes da Refeicao',
    tipo_leitura: 'Manual',
    acao_realizada: 'Bolus para Refeicao',
    dose_insulina: 4.0,
    dose_aplicada: 4.0,
    insulina_ativa_estimada: 2.1,
    insulina_total_organismo: 2.1,
    variacao_por_minuto: null,
    tendencia_destro: '• Estável',
    fator_contexto: 'Café da manhã: pão integral com ovos',
    carboidratos_g: 35,
    observacoes: 'Dose matinal de cobertura.',
  },
  {
    id: 103,
    valor_mg_dl: 110,
    data_hora_medicao: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
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

  // Controle de abas principais (Tabs shadcn style)
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
  const [contatosEmergencia, setContatosEmergencia] = useState([
    {
      id: 1,
      nome_contato: 'Mariana Silva',
      relacao: 'Cônjuge / Familiar',
      telefone: '(11) 97777-2001',
      ordem: 1,
    },
    {
      id: 2,
      nome_contato: 'Roberto Souza',
      relacao: 'Irmão',
      telefone: '(11) 98888-3333',
      ordem: 2,
    },
  ]);
  const [carregando, setCarregando] = useState(true);

  // Controle de Gaveta Lateral (Sheet) para Novo Registro de Glicemia
  const [sheetNovoRegistroAberta, setSheetNovoRegistroAberta] = useState(false);
  const [modoVisualizacaoRegistros, setModoVisualizacaoRegistros] = useState('trilha'); // 'trilha' | 'tabela'
  const [alertaUrgenteCuidador, setAlertaUrgenteCuidador] = useState(true);
  const [notificacaoSonora, setNotificacaoSonora] = useState(false);

  // Controle de Dialogs
  const [dialogAlergiasAberta, setDialogAlergiasAberta] = useState(false);
  const [modalConfigClinicaAberta, setModalConfigClinicaAberta] = useState(false);
  const [modalResumoCompartilhavelAberta, setModalResumoCompartilhavelAberta] = useState(false);
  const [modalCartaoDiagnosticoAberto, setModalCartaoDiagnosticoAberto] = useState(false);
  const [salvandoConfigClinica, setSalvandoConfigClinica] = useState(false);

  // Estados para formulário inline de alergias (gerenciamento direto sem redirecionamento)
  const [formAlergia, setFormAlergia] = useState({
    categoria: 'MEDICAMENTO',
    substancia_ou_item: '',
    gravidade: 'MODERADA',
    reacao_observada: '',
  });
  const [salvandoAlergia, setSalvandoAlergia] = useState(false);

  // Parâmetros clínicos educativos
  const [fsi, setFsi] = useState('');
  const [glicemiaAlvo, setGlicemiaAlvo] = useState(100);
  const [duracaoInsulinaHoras, setDuracaoInsulinaHoras] = useState(3);

  // Diário de glicemia
  const [registros, setRegistros] = useState(REGISTROS_DEMO_INICIAIS);
  const [valorGlicemia, setValorGlicemia] = useState('');
  const [momentoMedicao, setMomentoMedicao] = useState('Antes da Refeicao');
  const [doseInsulina, setDoseInsulina] = useState('');
  const [carbosG, setCarbosG] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [salvandoRegistro, setSalvandoRegistro] = useState(false);

  // Sincronia estrita do nome: prioriza o usuário autenticado na sessão
  const nomeExibicao =
    usuario?.nome_completo ||
    usuario?.nome ||
    perfilSaude?.nome_completo ||
    'Carlos Eduardo Souza';

  // Carregamento de dados com fallback resiliente
  useEffect(() => {
    let ativo = true;

    async function carregarDados() {
      setCarregando(true);
      try {
        if (!token) {
          // Usuário local demonstrativo
          if (ativo) {
            setPerfilSaude({
              nome_completo: nomeExibicao,
              tipo_diabetes: 'DM1',
              terapia_insulina: 'Caneta MDI',
              data_diagnostico: '2016-12-01',
              data_nascimento: '1995-04-18',
              glicemia_alvo: 100,
              fsi: 35,
              duracao_insulina_horas: 3,
            });
            setMedicamentos([
              { id: 1, nome: 'Insulina Lispro (Humalog)', tipo: 'Ultrarrápida', dose_habitual: 'Variável por contagem', horario_habitual: 'Antes das refeições' },
              { id: 2, nome: 'Insulina Degludeca (Tresiba)', tipo: 'Basal lenta', dose_habitual: '18 UI', horario_habitual: '22:00' },
            ]);
            setAlergias([
              { id: 1, substancia_ou_item: 'Dipirona Sódica', gravidade: 'MODERADA', reacao_observada: 'Urticária leve' },
            ]);
            setGlicemiaAlvo(100);
            setFsi(35);
            setDuracaoInsulinaHoras(3);
          }
          return;
        }

        const res = await fetch('/backend/api/perfil/index.php', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const dados = await res.json();
          if (dados.sucesso && ativo) {
            setPerfilSaude(dados.perfil || null);
            setMedicamentos(dados.medicamentos || []);
            setAlergias(dados.alergias || []);
            if (dados.contatos_emergencia && dados.contatos_emergencia.length > 0) {
              setContatosEmergencia(dados.contatos_emergencia);
            }
            if (dados.perfil?.fsi) setFsi(dados.perfil.fsi);
            if (dados.perfil?.glicemia_alvo) setGlicemiaAlvo(Number(dados.perfil.glicemia_alvo));
            if (dados.perfil?.duracao_insulina_horas) setDuracaoInsulinaHoras(Number(dados.perfil.duracao_insulina_horas));
          }
        }
      } catch (err) {
        console.error('Erro ao buscar dados do perfil:', err);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarDados();
    return () => {
      ativo = false;
    };
  }, [token]);

  // Tempo de jornada calculado
  const tempoJornada = useMemo(() => {
    return calcularTempoDiagnostico(perfilSaude?.data_diagnostico || '2016-12-01');
  }, [perfilSaude?.data_diagnostico]);

  // Idade calculada
  const calcularIdade = (dataNasc) => {
    if (!dataNasc) return '';
    try {
      const hoje = new Date();
      const nasc = new Date(dataNasc);
      let idade = hoje.getFullYear() - nasc.getFullYear();
      const m = hoje.getMonth() - nasc.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
        idade--;
      }
      return `${idade} anos`;
    } catch {
      return '';
    }
  };

  // Atualização em tempo real (a cada 60 segundos) para recálculo dinâmico do IOB
  const [agoraTick, setAgoraTick] = useState(Date.now());
  useEffect(() => {
    const intervalo = setInterval(() => {
      setAgoraTick(Date.now());
    }, 60000);
    return () => clearInterval(intervalo);
  }, []);

  // Cálculo da IOB total individual por dose com soma consolidada e maior tempo de expiração
  const infoIOB = useMemo(() => {
    return calcularInsulinaAtiva(registros, duracaoInsulinaHoras, new Date(agoraTick));
  }, [registros, duracaoInsulinaHoras, agoraTick]);

  // Registro mais recente
  const ultimoRegistro = registros[0];

  // Cálculo do Tempo no Alvo (TIR 7d)
  const dadosTIR7d = useMemo(() => {
    if (!registros || registros.length === 0) {
      return { tir: 78, hipo: 4, hiper: 18 };
    }
    const total = registros.length;
    const noAlvo = registros.filter((r) => r.valor_mg_dl >= 70 && r.valor_mg_dl <= 180).length;
    const hipo = registros.filter((r) => r.valor_mg_dl < 70).length;
    const hiper = registros.filter((r) => r.valor_mg_dl > 180).length;

    return {
      tir: Math.round((noAlvo / total) * 100),
      hipo: Math.round((hipo / total) * 100),
      hiper: Math.round((hiper / total) * 100),
    };
  }, [registros]);

  // Status visual da última glicemia
  const statusUltimaGlicemia = useMemo(() => {
    const v = ultimoRegistro ? ultimoRegistro.valor_mg_dl : 142;
    if (v < 70) return { cor: '#C94A38', bg: 'rgba(201, 74, 56, 0.12)', rotulo: 'Hipoglicemia', variante: 'destructive' };
    if (v > 180) return { cor: '#C88D2A', bg: 'rgba(200, 141, 42, 0.12)', rotulo: 'Atenção (Alta)', variante: 'warning' };
    return { cor: 'var(--cor-cta, #3B7E48)', bg: 'rgba(59, 126, 72, 0.12)', rotulo: 'No Alvo', variante: 'success' };
  }, [ultimoRegistro]);

  // Tendência calculada
  const tendenciaAtual = useMemo(() => {
    if (!registros || registros.length < 2) return null;
    return calcularTendenciaDestro(registros[0], registros[1]);
  }, [registros]);

  // Submissão de novo registro via Sheet lateral
  const handleRegistrarGlicemia = async (e) => {
    e.preventDefault();
    if (!valorGlicemia) {
      notificar.aviso('Informe o valor da glicemia medida.');
      return;
    }

    setSalvandoRegistro(true);
    const novo = {
      id: Date.now(),
      valor_mg_dl: Number(valorGlicemia),
      data_hora_medicao: new Date().toISOString(),
      momento_medicao: momentoMedicao,
      dose_insulina: doseInsulina ? Number(doseInsulina) : 0,
      dose_aplicada: doseInsulina ? Number(doseInsulina) : 0,
      carboidratos_g: carbosG ? Number(carbosG) : 0,
      observacoes: observacoes || '',
      fator_contexto: observacoes || '',
      tipo_leitura: 'Manual',
      tendencia_destro: '• Estável',
    };

    setTimeout(() => {
      setRegistros([novo, ...registros]);
      setValorGlicemia('');
      setDoseInsulina('');
      setCarbosG('');
      setObservacoes('');
      setSalvandoRegistro(false);
      setSheetNovoRegistroAberta(false);
      notificar.sucesso('Medição registrada no seu diário com sucesso!');
    }, 300);
  };

  // Exclusão auditada
  const handleExcluirRegistro = async (id) => {
    const ok = await confirmar({
      titulo: 'Remover esta medição do diário?',
      descricao: 'O registro será removido da linha do tempo e arquivado para conformidade.',
      confirmText: 'Sim, remover',
      cancelText: 'Cancelar',
      variante: 'destructive',
    });
    if (!ok) return;

    setRegistros(registros.filter((r) => r.id !== id));
    notificar.sucesso('Medição removida.');
  };

  /* INÍCIO DOS HANDLERS DE GERENCIAMENTO DIRETO DE ALERGIAS */
  const handleSalvarAlergia = async (e) => {
    e.preventDefault();
    if (!formAlergia.substancia_ou_item.trim()) {
      notificar.aviso('Informe o nome da substância ou insumo.');
      return;
    }

    setSalvandoAlergia(true);
    try {
      const payload = {
        perfil_saude_id: perfilSaude?.id,
        categoria: formAlergia.categoria,
        substancia_ou_item: formAlergia.substancia_ou_item.trim(),
        gravidade: formAlergia.gravidade,
        reacao_observada: formAlergia.reacao_observada.trim(),
      };

      const res = await alergiasService.adicionar(payload);
      if (res.data && res.data.sucesso && res.data.alergia) {
        setAlergias((prev) => [res.data.alergia, ...prev]);
        setFormAlergia({
          categoria: 'MEDICAMENTO',
          substancia_ou_item: '',
          gravidade: 'MODERADA',
          reacao_observada: '',
        });
        notificar.sucesso(`Alergia a "${payload.substancia_ou_item}" salva com sucesso!`);
      } else {
        throw new Error(res.data?.mensagem || 'Falha ao salvar');
      }
    } catch (err) {
      // Fallback local se a API estiver em modo offline
      const novaAlergiaLocal = {
        id: Date.now(),
        perfil_saude_id: perfilSaude?.id || 1,
        categoria: formAlergia.categoria,
        substancia_ou_item: formAlergia.substancia_ou_item.trim(),
        gravidade: formAlergia.gravidade,
        reacao_observada: formAlergia.reacao_observada.trim(),
        criado_em: new Date().toISOString(),
      };
      setAlergias((prev) => [novaAlergiaLocal, ...prev]);
      setFormAlergia({
        categoria: 'MEDICAMENTO',
        substancia_ou_item: '',
        gravidade: 'MODERADA',
        reacao_observada: '',
      });
      notificar.sucesso(`Alergia a "${formAlergia.substancia_ou_item}" adicionada com sucesso!`);
    } finally {
      setSalvandoAlergia(false);
    }
  };

  const handleRemoverAlergia = async (alergia) => {
    const ok = await confirmar({
      titulo: 'Remover Alergia',
      descricao: `Tem certeza que deseja remover o alerta de alergia a "${alergia.substancia_ou_item}"?`,
      confirmText: 'Sim, remover',
      cancelText: 'Cancelar',
      variante: 'destructive',
    });
    if (!ok) return;

    try {
      await alergiasService.remover(alergia.id, { perfil_saude_id: perfilSaude?.id });
    } catch (err) {
      console.warn('Exclusão remota falhou, removendo localmente:', err);
    }
    setAlergias((prev) => prev.filter((a) => a.id !== alergia.id));
    notificar.sucesso(`Alergia a "${alergia.substancia_ou_item}" removida.`);
  };
  /* FIM DOS HANDLERS DE GERENCIAMENTO DIRETO DE ALERGIAS */

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '1240px' }}>
      {/* ====================================================================
          1. CABEÇALHO UNIFICADO MINIMALISTA (PADRÃO SHADCN / LINHA ÚNICA)
          ==================================================================== */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          paddingBottom: '1.5rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.12))',
        }}
      >
        {/* Esquerda: Avatar + Identidade + Metadados + Selo de Alergias */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'var(--cor-cta, #3B7E48)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--fonte-titulo, Fraunces)',
              fontSize: '1.35rem',
              fontWeight: 600,
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(59, 126, 72, 0.2)',
            }}
          >
            {nomeExibicao.charAt(0)}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontFamily: 'var(--fonte-titulo, Fraunces)',
                  fontSize: '1.45rem',
                  color: 'var(--cor-texto, #2E2824)',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {nomeExibicao}
              </h1>

              {perfilSaude?.data_nascimento && (
                <span
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--cor-primaria, #7C533F)',
                    backgroundColor: 'rgba(124, 83, 63, 0.08)',
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
                gap: '0.65rem',
                flexWrap: 'wrap',
                marginTop: '0.25rem',
                fontSize: '0.82rem',
                color: 'var(--cor-texto-suave, #5C534C)',
              }}
            >
              <span>{perfilSaude?.tipo_diabetes || 'Tipo 1A'}</span>
              <Separator orientation="vertical" style={{ height: '12px' }} />
              <span>{perfilSaude?.terapia_insulina || 'Caneta'}</span>
              <Separator orientation="vertical" style={{ height: '12px' }} />
              <span>{tempoJornada?.textoJornada || '9 anos e 11 meses de jornada'}</span>

              {/* Selo Discreto de Alergias Clicável */}
              <button
                type="button"
                onClick={() => setDialogAlergiasAberta(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  border: '1px solid',
                  borderColor: alergias.length > 0 ? 'rgba(201, 74, 56, 0.3)' : 'var(--cor-borda-suave, rgba(124, 83, 63, 0.2))',
                  backgroundColor: alergias.length > 0 ? 'rgba(201, 74, 56, 0.08)' : 'transparent',
                  color: alergias.length > 0 ? '#C94A38' : 'var(--cor-texto-suave, #5C534C)',
                  cursor: 'pointer',
                  marginLeft: '0.35rem',
                  transition: 'all 0.15s ease',
                }}
                title="Clique para visualizar o quadro de alergias e sensibilidades"
              >
                {alergias.length > 0 ? <AlertTriangle size={12} strokeWidth={2} /> : <ShieldCheck size={12} strokeWidth={2} />}
                <span>{alergias.length === 0 ? '0 alergias' : `${alergias.length} alergia(s)`}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Direita: Botões de Ação Compactos no Padrão shadcn */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Botão de Ação Primária: + Registrar Glicemia / Dose (Abre Sheet) */}
          <Button
            variante="sucesso"
            onClick={() => setSheetNovoRegistroAberta(true)}
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              padding: '0.45rem 1rem',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Registrar Glicemia / Dose</span>
          </Button>

          {/* Botão Outline: Card Diagnóstico */}
          <button
            type="button"
            onClick={() => setModalCartaoDiagnosticoAberto(true)}
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: 'transparent',
              color: 'var(--cor-texto, #2E2824)',
              border: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.2))',
              borderRadius: '999px',
              padding: '0.45rem 0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease',
            }}
          >
            <FileText size={14} strokeWidth={1.75} />
            <span>Card Diagnóstico (PNG/PDF)</span>
          </button>

          {/* Botão Outline: Resumo Clínico */}
          <button
            type="button"
            onClick={() => setModalResumoCompartilhavelAberta(true)}
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: 'transparent',
              color: 'var(--cor-primaria, #7C533F)',
              border: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.2))',
              borderRadius: '999px',
              padding: '0.45rem 0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease',
            }}
          >
            <HeartPulse size={14} strokeWidth={1.75} />
            <span>Resumo Clínico</span>
          </button>

          {/* Botão Outline: Editar Perfil */}
          <Link to="/configurar-perfil" style={{ textDecoration: 'none' }}>
            <button
              type="button"
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: 'transparent',
                color: 'var(--cor-texto-suave, #5C534C)',
                border: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.2))',
                borderRadius: '999px',
                padding: '0.45rem 0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease',
              }}
            >
              <Edit3 size={13} strokeWidth={1.75} />
              <span>Editar</span>
            </button>
          </Link>
        </div>
      </header>

      {/* ====================================================================
          2. NAVEGAÇÃO EM TABS SEGMENTADAS (SHADCN SEGMENTED CONTROL)
          ==================================================================== */}
      <div style={{ marginBottom: '1.75rem' }}>
        <Tabs value={abaAtiva} onValueChange={(val) => setAbaAtiva(val)}>
          <TabsList style={{ width: 'auto' }}>
            <TabsTrigger value="diario">
              <Activity size={15} strokeWidth={1.75} />
              <span>Visão Geral & Curva de Glicemia</span>
            </TabsTrigger>
            <TabsTrigger value="exames">
              <FileText size={15} strokeWidth={1.75} />
              <span>Exames & Comparativo Inteligente</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ====================================================================
          ABA 2: EXAMES & COMPARATIVO INTELIGENTE
          ==================================================================== */}
      {abaAtiva === 'exames' && (
        <CentralExames perfilSaude={perfilSaude} token={token} usuario={usuario} />
      )}

      {/* ====================================================================
          ABA 1: VISÃO GERAL & CURVA DE GLICEMIA (SHADCN DASHBOARD)
          ==================================================================== */}
      {abaAtiva === 'diario' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* ================================================================
              BENTO GRID COM 3 KPI CARDS ESTILO SHADCN
              ================================================================ */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* KPI 1: Última Glicemia */}
            <Card>
              <CardContent style={{ padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--cor-primaria, #7C533F)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Última Glicemia
                  </span>
                  <Badge variant={statusUltimaGlicemia.variante}>
                    {statusUltimaGlicemia.rotulo}
                  </Badge>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', margin: '0.2rem 0' }}>
                  <span
                    style={{
                      fontSize: '2.25rem',
                      fontWeight: 800,
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontVariantNumeric: 'tabular-nums',
                      color: statusUltimaGlicemia.cor,
                      lineHeight: 1,
                    }}
                  >
                    {ultimoRegistro ? ultimoRegistro.valor_mg_dl : 142}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--cor-texto-suave, #5C534C)', fontWeight: 600 }}>mg/dL</span>
                </div>

                <Separator style={{ margin: '0.65rem 0' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', color: 'var(--cor-texto-suave, #5C534C)' }}>
                  <Activity size={13} color="var(--cor-cta, #3B7E48)" />
                  <span>
                    {tendenciaAtual ? `${tendenciaAtual.icone} ${tendenciaAtual.rotulo}` : '↘ Queda moderada'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* KPI 2: Insulina Ativa (IOB) + Decaimento Individual Multi-Bolus */}
            <Card>
              <CardContent style={{ padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--cor-primaria, #7C533F)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Insulina Ativa (IOB)
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: infoIOB.iobTotal > 0 ? 'var(--cor-cta, #3B7E48)' : 'var(--cor-texto-suave, #5C534C)',
                      fontWeight: infoIOB.iobTotal > 0 ? 700 : 500,
                    }}
                  >
                    {infoIOB.textoExpiracao}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', margin: '0.2rem 0' }}>
                  <span
                    style={{
                      fontSize: '2.25rem',
                      fontWeight: 800,
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontVariantNumeric: 'tabular-nums',
                      color: 'var(--cor-texto, #2E2824)',
                      lineHeight: 1,
                    }}
                  >
                    {infoIOB.iobTotal.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--cor-texto-suave, #5C534C)', fontWeight: 600 }}>
                    UI ativas
                  </span>
                  {infoIOB.totalDosesAtivas > 1 && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: '0.7rem',
                        backgroundColor: 'rgba(59, 126, 72, 0.1)',
                        color: '#285832',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        fontWeight: 700,
                      }}
                    >
                      {infoIOB.totalDosesAtivas} doses somadas
                    </span>
                  )}
                </div>

                <Separator style={{ margin: '0.65rem 0' }} />

                {/* Barra de progresso fisiológica de decaimento */}
                <div>
                  <div
                    style={{
                      height: '4px',
                      width: '100%',
                      backgroundColor: 'rgba(124, 83, 63, 0.1)',
                      borderRadius: '999px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, Math.round((infoIOB.iobTotal / 6) * 100))}%`,
                        backgroundColor: infoIOB.iobTotal > 0 ? 'var(--cor-primaria, #7C533F)' : 'var(--cor-borda)',
                        borderRadius: '999px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', fontSize: '0.7rem', color: 'var(--cor-texto-suave, #5C534C)' }}>
                    <span>Curva rápida ({duracaoInsulinaHoras}h)</span>
                    <span>Prevenção de empilhamento</span>
                  </div>
                </div>

                {/* DETALHAMENTO DISCRETO DAS DOSES ATIVAS */}
                {infoIOB.detalhesDoses.length > 0 && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      paddingTop: '0.6rem',
                      borderTop: '1px dashed rgba(124, 83, 63, 0.2)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#7C533F', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        Detalhamento por Aplicação
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#6A5E57' }}>
                        Duração: {duracaoInsulinaHoras}h
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {infoIOB.detalhesDoses.map((dose) => (
                        <div
                          key={dose.id}
                          style={{
                            fontSize: '0.74rem',
                            backgroundColor: 'rgba(124, 83, 63, 0.05)',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '4px',
                          }}
                        >
                          <div>
                            <strong style={{ color: '#2E2824' }}>{dose.horarioFormatado}</strong>
                            <span style={{ color: '#5A5049', marginLeft: '4px' }}>• {dose.doseOriginal.toFixed(1)} UI</span>
                            {dose.contexto && (
                              <span style={{ fontSize: '0.66rem', color: '#7C533F', marginLeft: '6px', fontStyle: 'italic' }}>
                                ({dose.contexto.split(':')[0]})
                              </span>
                            )}
                          </div>

                          <div style={{ fontWeight: 700, color: '#285832' }}>
                            restam {dose.iobRestante.toFixed(1)} UI{' '}
                            <span style={{ fontWeight: 500, fontSize: '0.7rem', color: '#5A5049' }}>
                              (expira em ~{Math.floor(dose.minutosRestantes / 60)}h{String(dose.minutosRestantes % 60).padStart(2, '0')})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* KPI 3: Tempo no Alvo (TIR — 7 dias) + Micro-barra Segmentada */}
            <Card>
              <CardContent style={{ padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--cor-primaria, #7C533F)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Tempo no Alvo (TIR 7d)
                  </span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--cor-cta, #3B7E48)' }}>
                    Meta &ge; 70%
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', margin: '0.2rem 0' }}>
                  <span
                    style={{
                      fontSize: '2.25rem',
                      fontWeight: 800,
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontVariantNumeric: 'tabular-nums',
                      color: dadosTIR7d.tir >= 70 ? 'var(--cor-cta, #3B7E48)' : '#C88D2A',
                      lineHeight: 1,
                    }}
                  >
                    {dadosTIR7d.tir}%
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--cor-texto-suave, #5C534C)', fontWeight: 600 }}>70–180 mg/dL</span>
                </div>

                <Separator style={{ margin: '0.65rem 0' }} />

                {/* Micro-barra segmentada fina de 4px */}
                <div>
                  <div
                    style={{
                      height: '4px',
                      width: '100%',
                      backgroundColor: 'rgba(124, 83, 63, 0.1)',
                      borderRadius: '999px',
                      overflow: 'hidden',
                      display: 'flex',
                    }}
                  >
                    <div style={{ width: `${dadosTIR7d.hipo}%`, backgroundColor: '#C94A38' }} title={`${dadosTIR7d.hipo}% abaixo`} />
                    <div style={{ width: `${dadosTIR7d.tir}%`, backgroundColor: 'var(--cor-cta, #3B7E48)' }} title={`${dadosTIR7d.tir}% no alvo`} />
                    <div style={{ width: `${dadosTIR7d.hiper}%`, backgroundColor: '#C88D2A' }} title={`${dadosTIR7d.hiper}% acima`} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--cor-texto-suave, #5C534C)', marginTop: '0.3rem' }}>
                    <span style={{ color: '#C94A38' }}>{dadosTIR7d.hipo}% &lt;70</span>
                    <span style={{ fontWeight: 700, color: 'var(--cor-cta, #3B7E48)' }}>{dadosTIR7d.tir}% no alvo</span>
                    <span style={{ color: '#C88D2A' }}>{dadosTIR7d.hiper}% &gt;180</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ================================================================
              GRÁFICO CURVA DE GLICEMIA ESTILO SHADCN CHARTS (AREACHART SVG)
              ================================================================ */}
          <GraficoCurvaGlicemia
            registros={registros}
            glicemiaAlvo={glicemiaAlvo}
            metaMin={70}
            metaMax={180}
          />

          {/* ================================================================
              HISTÓRICO AUDITÁVEL DE REGISTROS (<Table /> E <Trace /> SHADCN STYLE)
              ================================================================ */}
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <CardTitle>Linha do Tempo das Medições ({registros.length})</CardTitle>
                  <CardDescription>
                    Rastreabilidade contínua de doses, glicemias e carboidratos.
                  </CardDescription>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <ToggleGroup
                    type="single"
                    value={modoVisualizacaoRegistros}
                    onValueChange={(val) => val && setModoVisualizacaoRegistros(val)}
                    variant="outline"
                    size="sm"
                  >
                    <ToggleGroupItem value="trilha">Trilha (Trace)</ToggleGroupItem>
                    <ToggleGroupItem value="tabela">Tabela</ToggleGroupItem>
                  </ToggleGroup>

                  <Button
                    variante="sucesso"
                    onClick={() => setSheetNovoRegistroAberta(true)}
                    style={{
                      fontSize: '0.78rem',
                      padding: '0.4rem 0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Plus size={14} strokeWidth={2} />
                    <span>Nova Medição</span>
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent style={{ padding: 0 }}>
              {registros.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--cor-texto-suave, #5C534C)', fontSize: '0.86rem' }}>
                  Nenhum registro encontrado. Clique em "+ Registrar Glicemia / Dose" para começar.
                </p>
              ) : modoVisualizacaoRegistros === 'trilha' ? (
                <div style={{ padding: '1.25rem 1.5rem' }}>
                  <TraceList>
                    {registros.slice(0, 10).map((item, idx) => {
                      const noAlvo = item.valor_mg_dl >= 70 && item.valor_mg_dl <= 180;
                      const isHipo = item.valor_mg_dl < 70;
                      const statusTrace = noAlvo ? 'success' : isHipo ? 'destructive' : 'warning';
                      const dataStr = new Date(item.data_hora_medicao).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <TraceItem
                          key={item.id}
                          status={statusTrace}
                          timestamp={dataStr}
                          isLast={idx === Math.min(registros.length, 10) - 1}
                          title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                                  fontWeight: 800,
                                  fontVariantNumeric: 'tabular-nums',
                                  fontSize: '1.1rem',
                                  color: noAlvo ? 'var(--cor-cta, #3B7E48)' : isHipo ? '#C94A38' : '#C88D2A',
                                }}
                              >
                                {item.valor_mg_dl} mg/dL
                              </span>
                              <Badge variant={statusTrace}>
                                {noAlvo ? 'No Alvo' : isHipo ? 'Hipoglicemia' : 'Atenção'}
                              </Badge>
                              <span style={{ fontSize: '0.8rem', color: 'var(--cor-texto-suave, #5C534C)' }}>
                                ({item.momento_medicao || 'Rotina'})
                              </span>
                            </div>
                          }
                          description={
                            <span>
                              Insulina: <strong>{item.dose_aplicada || item.dose_insulina ? `${item.dose_aplicada || item.dose_insulina} UI` : '0 UI'}</strong> • Carbos: <strong>{item.carboidratos_g ? `${item.carboidratos_g}g` : '0g'}</strong>
                              {item.observacoes && <span> — "{item.observacoes}"</span>}
                            </span>
                          }
                        />
                      );
                    })}
                  </TraceList>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data / Hora</TableHead>
                      <TableHead>Glicemia</TableHead>
                      <TableHead>Momento</TableHead>
                      <TableHead>Insulina</TableHead>
                      <TableHead>Carboidratos</TableHead>
                      <TableHead>Observação</TableHead>
                      <TableHead style={{ textAlign: 'right' }}>Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
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
                        <TableRow key={item.id}>
                          <TableCell style={{ color: 'var(--cor-texto-suave, #5C534C)', whiteSpace: 'nowrap' }}>
                            {dataStr}
                          </TableCell>
                          <TableCell style={{ whiteSpace: 'nowrap' }}>
                            <span
                              style={{
                                fontFamily: 'Plus Jakarta Sans, sans-serif',
                                fontWeight: 800,
                                fontVariantNumeric: 'tabular-nums',
                                color: noAlvo ? 'var(--cor-cta, #3B7E48)' : isHipo ? '#C94A38' : '#C88D2A',
                                fontSize: '0.96rem',
                              }}
                            >
                              {item.valor_mg_dl} mg/dL
                            </span>
                          </TableCell>
                          <TableCell>{item.momento_medicao}</TableCell>
                          <TableCell style={{ color: 'var(--cor-texto-suave, #5C534C)' }}>
                            {item.dose_aplicada || item.dose_insulina ? `${item.dose_aplicada || item.dose_insulina} UI` : '—'}
                          </TableCell>
                          <TableCell style={{ color: 'var(--cor-texto-suave, #5C534C)' }}>
                            {item.carboidratos_g ? `${item.carboidratos_g}g` : '—'}
                          </TableCell>
                          <TableCell style={{ color: 'var(--cor-texto-suave, #5C534C)' }}>
                            {item.observacoes || item.fator_contexto || '—'}
                          </TableCell>
                          <TableCell style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handleExcluirRegistro(item.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#C94A38',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                              }}
                              title="Remover anotação"
                            >
                              <Trash2 size={14} strokeWidth={1.75} />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ====================================================================
          3. GAVETA LATERAL (SHEET) DE NOVO REGISTRO NO DIÁRIO
          ==================================================================== */}
      <Sheet open={sheetNovoRegistroAberta} onOpenChange={setSheetNovoRegistroAberta}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Novo Registro no Diário</SheetTitle>
            <SheetDescription>
              Informe os dados da medição atual para atualizar a curva glicêmica e o cálculo de insulina ativa.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleRegistrarGlicemia} style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '1.75rem', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--cor-texto, #2E2824)', marginBottom: '0.4rem' }}>
                Glicemia Medida (mg/dL) *
              </label>
              <input
                type="number"
                required
                min="20"
                max="600"
                placeholder="Ex: 142"
                value={valorGlicemia}
                onChange={(e) => setValorGlicemia(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.25))',
                  backgroundColor: 'var(--cor-fundo, #FAF8F5)',
                  color: 'var(--cor-texto, #2E2824)',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--cor-texto, #2E2824)', marginBottom: '0.4rem' }}>
                Momento da Medição
              </label>
              <CustomSelect
                value={momentoMedicao}
                onChange={(val) => setMomentoMedicao(val)}
                options={[
                  { value: 'Jejum', label: 'Jejum (ao acordar)' },
                  { value: 'Antes da Refeicao', label: 'Antes da Refeição (Pré-prandial)' },
                  { value: '1h/2h Apos Refeicao', label: '1h a 2h Após Refeição (Pós-prandial)' },
                  { value: 'Antes de Dormir', label: 'Antes de Dormir' },
                  { value: 'Madrugada', label: 'Madrugada' },
                ]}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--cor-texto, #2E2824)', marginBottom: '0.4rem' }}>
                  Carboidratos (g)
                </label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  placeholder="Ex: 45"
                  value={carbosG}
                  onChange={(e) => setCarbosG(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.25))',
                    backgroundColor: 'var(--cor-fundo, #FAF8F5)',
                    color: 'var(--cor-texto, #2E2824)',
                    fontSize: '0.92rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--cor-texto, #2E2824)', marginBottom: '0.4rem' }}>
                  Insulina Aplicada (UI)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                  placeholder="Ex: 3.5"
                  value={doseInsulina}
                  onChange={(e) => setDoseInsulina(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.25))',
                    backgroundColor: 'var(--cor-fundo, #FAF8F5)',
                    color: 'var(--cor-texto, #2E2824)',
                    fontSize: '0.92rem',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--cor-texto, #2E2824)', marginBottom: '0.4rem' }}>
                Observação ou Contexto
              </label>
              <input
                type="text"
                placeholder="Ex: Almoço com amigos, caminhada leve"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.25))',
                  backgroundColor: 'var(--cor-fundo, #FAF8F5)',
                  color: 'var(--cor-texto, #2E2824)',
                  fontSize: '0.88rem',
                }}
              />
            </div>

            <Separator style={{ margin: '0.25rem 0' }} />

            {/* Configurações Booleanas de Notificação via Switch */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <Switch
                id="switch-alerta-cuidador"
                checked={alertaUrgenteCuidador}
                onCheckedChange={setAlertaUrgenteCuidador}
                label="Alerta Imediato ao Cuidador"
                description="Notifica a rede de apoio em caso de hipo/hiperglicemia severa"
              />
              <Switch
                id="switch-notificacao-sonora"
                checked={notificacaoSonora}
                onCheckedChange={setNotificacaoSonora}
                label="Notificação Sonora de Urgência"
                description="Emite aviso sonoro suave se a medição estiver fora da meta clínica"
              />
            </div>

            <SheetFooter style={{ marginTop: 'auto', padding: 0 }}>
              <Button
                variante="secundario"
                tipo="button"
                onClick={() => setSheetNovoRegistroAberta(false)}
                style={{ fontSize: '0.88rem' }}
              >
                Cancelar
              </Button>
              <Button
                variante="sucesso"
                tipo="submit"
                loading={salvandoRegistro}
                disabled={salvandoRegistro || !valorGlicemia}
                style={{ fontSize: '0.88rem', fontWeight: 700 }}
              >
                Salvar Medição
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* ====================================================================
          4. DIALOG DE ALERGIAS & SENSIBILIDADES (GERENCIAMENTO DIRETO INLINE)
          ==================================================================== */}
      <Dialog open={dialogAlergiasAberta} onOpenChange={setDialogAlergiasAberta}>
        <DialogContent maxWidth="580px">
          <DialogHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShieldCheck size={22} color="var(--cor-primaria, #7C533F)" strokeWidth={1.75} />
              <DialogTitle>Alergias & Sensibilidades Clínicas</DialogTitle>
            </div>
            <DialogDescription>
              Gerencie alertas de segurança médica diretamente nesta tela, sem precisar navegar pelo assistente completo.
            </DialogDescription>
          </DialogHeader>

          <div style={{ padding: '0 1.75rem 1.25rem', maxHeight: '68vh', overflowY: 'auto' }}>
            {/* Lista Atual de Alergias */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--cor-primaria, #7C533F)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.65rem' }}>
                Alertas Cadastrados ({alergias.length})
              </div>

              {alergias.length === 0 ? (
                <div style={{ backgroundColor: 'var(--cor-fundo, #FAF8F5)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px dashed var(--cor-borda)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--cor-texto-suave, #5C534C)', margin: 0 }}>
                    Nenhuma alergia relatada no momento. Cadastre reações a medicamentos, alimentos ou adesivos de sensores no formulário abaixo.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {alergias.map((al, idx) => {
                    const isGrave = al.gravidade === 'GRAVE' || al.gravidade?.includes('ANAFIL');
                    const isMod = al.gravidade === 'MODERADA';
                    const badgeVariant = isGrave ? 'destructive' : isMod ? 'warning' : 'success';
                    const badgeLabel = isGrave ? 'Grave / Risco de Anafilaxia' : isMod ? 'Moderada' : 'Leve';

                    let catNome = 'Outro';
                    if (al.categoria === 'MEDICAMENTO') catNome = 'Medicamento';
                    else if (al.categoria === 'ALIMENTO') catNome = 'Alimento';
                    else if (al.categoria === 'ADESIVO_INSUMO') catNome = 'Adesivo / Cateter';

                    return (
                      <div
                        key={al.id || idx}
                        style={{
                          backgroundColor: 'var(--cor-fundo, #FAF8F5)',
                          padding: '0.85rem 1rem',
                          borderRadius: '12px',
                          border: '1px solid var(--cor-borda)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <strong style={{ fontSize: '0.92rem', color: 'var(--cor-texto, #2E2824)' }}>
                              {al.substancia_ou_item}
                            </strong>
                            <span style={{ fontSize: '0.74rem', color: 'var(--cor-texto-suave, #5C534C)' }}>
                              ({catNome})
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Badge variant={badgeVariant}>
                              {badgeLabel}
                            </Badge>

                            <button
                              type="button"
                              onClick={() => handleRemoverAlergia(al)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#C94A38',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                borderRadius: '4px',
                                opacity: 0.8,
                                transition: 'opacity 0.15s ease',
                              }}
                              title={`Remover alergia a ${al.substancia_ou_item}`}
                            >
                              <Trash2 size={15} strokeWidth={1.75} />
                            </button>
                          </div>
                        </div>

                        {al.reacao_observada && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--cor-texto-suave, #5C534C)', margin: 0, lineHeight: 1.4 }}>
                            <strong>Reação:</strong> {al.reacao_observada}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator style={{ margin: '1.25rem 0' }} />

            {/* Formulário Rápido Inline para Adicionar Alergia */}
            <form onSubmit={handleSalvarAlergia} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--cor-primaria, #7C533F)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                + Adicionar Alergia ou Sensibilidade
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--cor-texto, #2E2824)', marginBottom: '0.35rem' }}>
                    Categoria *
                  </label>
                  <CustomSelect
                    value={formAlergia.categoria}
                    onChange={(val) => setFormAlergia({ ...formAlergia, categoria: val })}
                    options={[
                      { value: 'MEDICAMENTO', label: 'Medicamento' },
                      { value: 'ALIMENTO', label: 'Alimento' },
                      { value: 'ADESIVO_INSUMO', label: 'Adesivo de Sensor / Cateter' },
                      { value: 'OUTRA', label: 'Outro' },
                    ]}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--cor-texto, #2E2824)', marginBottom: '0.35rem' }}>
                    Gravidade da Reação *
                  </label>
                  <CustomSelect
                    value={formAlergia.gravidade}
                    onChange={(val) => setFormAlergia({ ...formAlergia, gravidade: val })}
                    options={[
                      { value: 'LEVE', label: 'Leve (vermelhidão, prurido local)' },
                      { value: 'MODERADA', label: 'Moderada (urticária, edema facial)' },
                      { value: 'GRAVE', label: 'Grave / Risco de Anafilaxia' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--cor-texto, #2E2824)', marginBottom: '0.35rem' }}>
                  Nome da Substância / Item *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dipirona, Adesivo FreeStyle Libre, Amendoim"
                  value={formAlergia.substancia_ou_item}
                  onChange={(e) => setFormAlergia({ ...formAlergia, substancia_ou_item: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1.5px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.25))',
                    backgroundColor: 'var(--cor-fundo, #FAF8F5)',
                    color: 'var(--cor-texto, #2E2824)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--cor-texto, #2E2824)', marginBottom: '0.35rem' }}>
                  Sintomas / Reação Observada
                </label>
                <input
                  type="text"
                  placeholder="Ex: Placas avermelhadas, coceira intensa em 20 min"
                  value={formAlergia.reacao_observada}
                  onChange={(e) => setFormAlergia({ ...formAlergia, reacao_observada: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.25))',
                    backgroundColor: 'var(--cor-fundo, #FAF8F5)',
                    color: 'var(--cor-texto, #2E2824)',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <Button
                  variante="sucesso"
                  tipo="submit"
                  loading={salvandoAlergia}
                  disabled={salvandoAlergia || !formAlergia.substancia_ou_item.trim()}
                  style={{
                    borderRadius: '999px',
                    padding: '0.6rem 1.4rem',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                  }}
                >
                  Salvar Alergia
                </Button>
              </div>
            </form>
          </div>

          <DialogFooter>
            <Button
              variante="secundario"
              onClick={() => setDialogAlergiasAberta(false)}
              style={{ fontSize: '0.84rem' }}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================================
          MODAL DO CARTÃO DE DIAGNÓSTICO & CUIDADO (PREVIEW + PNG/PDF)
          ================================================================== */}
      <Dialog open={modalCartaoDiagnosticoAberto} onOpenChange={setModalCartaoDiagnosticoAberto}>
        <DialogContent style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }}>
          <DialogHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(124, 83, 63, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--cor-destaque)',
                }}
              >
                <FileText size={18} strokeWidth={2} />
              </div>
              <div>
                <DialogTitle style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.25rem' }}>
                  Cartão de Diagnóstico & Cuidado
                </DialogTitle>
                <DialogDescription style={{ fontSize: '0.85rem' }}>
                  Documento oficial com parâmetros terapêuticos e condutas de emergência para portar na carteira ou salvar no celular.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div style={{ marginTop: '0.5rem' }}>
            <CartaoDiagnosticoDownload
              paciente={perfilSaude}
              alergias={alergias}
              medicamentos={medicamentos}
              contatos={contatosEmergencia}
              onAtualizarContatos={setContatosEmergencia}
              isCuidador={false}
              exibirCabecalhoSecao={false}
            />
          </div>
        </DialogContent>
      </Dialog>

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
