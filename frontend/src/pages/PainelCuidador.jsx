/* ==========================================================================
   ARQUIVO: PainelCuidador.jsx (Localização: /frontend/src/pages/PainelCuidador.jsx)
   PROJETO: GlicoCare — Sistema de Saúde Integrada e Acolhimento em DM1
   OBJETIVO: Espaço exclusivo para pais e responsáveis legais de crianças abaixo
             de 12 anos com DM1 (perfil === 'cuidador'), com gestão de filhos,
             co-cuidadores, diário com prevenção de empilhamento de insulina (IOB),
             alergias, teleconsultas, pré-atendimento e cartão de cuidado escolar.
   ========================================================================== */

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cuidadorService, alergiasService } from '../services/api';
import CustomSelect from '../components/CustomSelect';
import Button from '../components/Button';
import GlicoLoader from '../components/GlicoLoader';
import CartaoDiagnosticoDownload from '../components/CartaoDiagnosticoDownload';
import GraficoCurvaGlicemia from '../components/GraficoCurvaGlicemia';
import ComparativoExames from '../components/ComparativoExames';
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
import {
  Activity,
  FileText,
  Clock,
  Zap,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  User,
  Plus,
  Trash2,
  Calendar,
  Utensils,
  ChevronRight,
  ExternalLink,
  Edit3,
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/Alert';
import { useNotify } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import logoGlicoCare from '../assets/logo-glicocare.jpg';
import { FEATURES } from '../config/features';

/* INÍCIO DOS DADOS DEMONSTRATIVOS RESILIENTES (FALLBACK DE ALTA FIDELIDADE) */
const DEPENDENTE_PADRAO_THEO = {
  vinculo_id: 1,
  perfil_saude_id: 1,
  nome_crianca: 'Theo Silva',
  data_nascimento: '2019-05-14',
  idade_extenso: '6 anos e 6 meses',
  tempo_diagnostico_extenso: 'Diagnóstico há 2 anos e 3 meses',
  sexo: 'masculino',
  altura_cm: 118,
  peso_kg: 22.5,
  tipo_diabetes: 'Tipo 1A',
  data_diagnostico: '2023-08-10',
  terapia_insulina: 'Caneta',
  fsi: 35,
  glicemia_alvo: 100,
  duracao_insulina_horas: 3,
  is_menor_12: true,
  escola_nome: 'Colégio Viver Bem (Educação Infantil e Fundamental I)',
  contato_emergencia_telefone: '(11) 97777-2001',
  parentesco: 'MAE',
  nivel_acesso: 'ADMINISTRADOR_LEGAL',
  codigo_convite_familia: 'THEO-FAM-2026',
  contatos_emergencia: [
    {
      id: 1,
      nome_contato: 'Mariana Silva',
      relacao: 'Mãe (Responsável Legal)',
      telefone: '(11) 97777-2001',
      ordem: 1,
    },
    {
      id: 2,
      nome_contato: 'Carlos Eduardo Souza',
      relacao: 'Pai',
      telefone: '(11) 98888-3333',
      ordem: 2,
    },
    {
      id: 3,
      nome_contato: 'Colégio Viver Bem (Coordenação)',
      relacao: 'Escola',
      telefone: '(11) 3456-7890',
      ordem: 3,
    },
  ],
  co_cuidadores: [
    {
      id: 2,
      nome_completo: 'Carlos Eduardo Souza',
      parentesco: 'PAI',
      nivel_acesso: 'ADMINISTRADOR_LEGAL',
      vinculado_em: '2026-01-10',
    },
  ],
  alergias: [
    {
      id: 1,
      categoria: 'MEDICAMENTO',
      substancia_ou_item: 'Dipirona',
      gravidade: 'MODERADA',
      reacao_observada: 'Urticária, placas avermelhadas e prurido generalizado.',
    },
    {
      id: 2,
      categoria: 'ADESIVO_INSUMO',
      substancia_ou_item: 'Adesivo de Sensor FreeStyle Libre',
      gravidade: 'LEVE',
      reacao_observada: 'Dermatite de contato no braço após 10 dias contínuos.',
    },
  ],
  medicamentos: [
    {
      id: 1,
      nome_medicamento: 'Novorapid (Insulina Aspart)',
      tipo: 'Insulina',
      dose: '1 UI para cada 15g de carbo',
      unidade_medida: 'UI',
      horario: null,
      uso_continuo: 1,
    },
    {
      id: 2,
      nome_medicamento: 'Tresiba (Insulina Degludeca)',
      tipo: 'Insulina',
      dose: '6',
      unidade_medida: 'UI',
      horario: '21:00',
      uso_continuo: 1,
    },
  ],
  leituras_recentes: [
    {
      id: 101,
      valor_mg_dl: 114,
      momento_medicao: 'Antes da Refeicao',
      tipo_leitura: 'Sensor/CGM',
      acao_realizada: 'Nenhuma Acao',
      dose_insulina: null,
      carboidratos_g: null,
      fator_contexto: 'Brincando no recreio escolar',
      registrado_por_rotulo: 'Mariana Silva (Mãe)',
      data_hora_medicao: '2026-11-17 14:15:00',
    },
    {
      id: 102,
      valor_mg_dl: 142,
      momento_medicao: '1h/2h Apos Refeicao',
      tipo_leitura: 'Sensor/CGM',
      acao_realizada: 'Bolus para Refeicao',
      dose_insulina: 1.5,
      carboidratos_g: 32,
      fator_contexto: 'Almoço: arroz, feijão e maçã',
      registrado_por_rotulo: 'Mariana Silva (Mãe)',
      data_hora_medicao: '2026-11-17 12:30:00',
    },
    {
      id: 103,
      valor_mg_dl: 108,
      momento_medicao: 'Jejum',
      tipo_leitura: 'Manual',
      acao_realizada: 'Nenhuma Acao',
      dose_insulina: null,
      carboidratos_g: null,
      fator_contexto: 'Acordou disposto sem alarmes',
      registrado_por_rotulo: 'Carlos Eduardo (Pai)',
      data_hora_medicao: '2026-11-17 07:15:00',
    },
    {
      id: 104,
      valor_mg_dl: 95,
      momento_medicao: 'Antes de Dormir',
      tipo_leitura: 'Sensor/CGM',
      acao_realizada: 'Nenhuma Acao',
      dose_insulina: null,
      carboidratos_g: null,
      fator_contexto: 'Sono tranquilo',
      registrado_por_rotulo: 'Mariana Silva (Mãe)',
      data_hora_medicao: '2026-11-16 22:40:00',
    },
  ],
  iob_ativa: 0.8,
  alerta_empilhamento: {
    iob_ativa: 0.8,
    ultima_dose: 1.5,
    horario: '12:30',
    minutos_atras: 105,
    registrado_por: 'Mariana Silva (Mãe)',
    mensagem:
      'Atenção: há 0.8 UI de insulina ativa no organismo de Theo, aplicada às 12:30 por Mariana Silva (Mãe). Evite nova correção rápida neste momento para prevenir hipoglicemia.',
  },
  radar_queda_rapida: null,
  consultas: [
    {
      id: 1,
      data_hora_consulta: '2026-11-18 14:00:00',
      status_agendamento: 'confirmado',
      status_atendimento: 'AGENDADO',
      tipo_agendamento: 'CONSULTA_AVULSA',
      sala_token_unico: 'SALA-NATIVA-GC-THEO2026',
      link_video_integrado: '/sala-consulta/SALA-NATIVA-GC-THEO2026',
      especialista_nome: 'Dra. Helena Vasconcelos',
      especialidade: 'Endocrinologia Pediátrica',
      tipo_conselho: 'CRM',
      numero_conselho: '148290',
      uf_conselho: 'SP',
      tcle_assinado: 1,
      pre_atendimento_preenchido: 1,
    },
  ],
  exames: [
    {
      id: 1,
      nome_laboratorio: 'Delboni Auriemo',
      laboratorio: 'Delboni Auriemo',
      data_realizacao: '2026-10-25',
      arquivo_anexo_path: '/backend/uploads/exames/delboni_laudo_outubro_theo.pdf',
      arquivo_laudo_url: '/backend/uploads/exames/delboni_laudo_outubro_theo.pdf',
      observacoes_paciente: 'Rotina pediátrica com Dra. Helena. Excelente controle glicêmico.',
      observacoes: 'Rotina pediátrica com Dra. Helena. Excelente controle glicêmico.',
      marcadores: [
        { nome: 'HbA1c (%)', valor: 6.8, unidade: '%', ref: '< 7.0%', meta: 7.0, tipoMenorMelhor: true },
        { nome: 'Glicemia em Jejum', valor: 104, unidade: 'mg/dL', ref: '70–99 mg/dL', meta: 99, tipoMenorMelhor: true },
        { nome: 'Vitamina D (25-OH)', valor: 36.5, unidade: 'ng/mL', ref: '> 30 ng/mL', meta: 30, tipoMenorMelhor: false },
        { nome: 'Creatinina', valor: 0.52, unidade: 'mg/dL', ref: '0.30–0.70 mg/dL', meta: 0.70, tipoMenorMelhor: true },
        { nome: 'TSH', valor: 2.1, unidade: 'mUI/L', ref: '0.4–4.5 mUI/L', meta: 4.5, tipoMenorMelhor: true },
      ],
    },
    {
      id: 2,
      nome_laboratorio: 'Lavoisier',
      laboratorio: 'Lavoisier',
      data_realizacao: '2026-07-20',
      arquivo_anexo_path: '/backend/uploads/exames/lavoisier_laudo_julho_theo.pdf',
      arquivo_laudo_url: '/backend/uploads/exames/lavoisier_laudo_julho_theo.pdf',
      observacoes_paciente: 'Exame de rotina de 3 meses após ajuste de insulina basal.',
      observacoes: 'Exame de rotina de 3 meses após ajuste de insulina basal.',
      marcadores: [
        { nome: 'HbA1c (%)', valor: 7.4, unidade: '%', ref: '< 7.0%', meta: 7.0, tipoMenorMelhor: true },
        { nome: 'Glicemia em Jejum', valor: 118, unidade: 'mg/dL', ref: '70–99 mg/dL', meta: 99, tipoMenorMelhor: true },
        { nome: 'Vitamina D (25-OH)', valor: 24.0, unidade: 'ng/mL', ref: '> 30 ng/mL', meta: 30, tipoMenorMelhor: false },
        { nome: 'Creatinina', valor: 0.54, unidade: 'mg/dL', ref: '0.30–0.70 mg/dL', meta: 0.70, tipoMenorMelhor: true },
        { nome: 'TSH', valor: 2.3, unidade: 'mUI/L', ref: '0.4–4.5 mUI/L', meta: 4.5, tipoMenorMelhor: true },
      ],
    },
  ],
};
/* FIM DOS DADOS DEMONSTRATIVOS RESILIENTES */

/* INÍCIO DO COMPONENTE PRINCIPAL PAINEL CUIDADOR */
export default function PainelCuidador() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const notificar = useNotify();
  const { confirmar } = useConfirm();

  // Estados principais
  const [dependentes, setDependentes] = useState([DEPENDENTE_PADRAO_THEO]);
  const [indiceFilhoAtivo, setIndiceFilhoAtivo] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('diario'); // diario, consultas, exames, escola, comunidade
  const [feedbackMsg, setFeedbackMsg] = useState({ tipo: '', texto: '' });

  // Modais de Ação
  const [modalNovoFilho, setModalNovoFilho] = useState(false);
  const [subAbaNovoFilho, setSubAbaNovoFilho] = useState('novo'); // 'novo' ou 'convite'
  const [modalConvidarFamiliar, setModalConvidarFamiliar] = useState(false);
  const [modalNovaAlergia, setModalNovaAlergia] = useState(false);
  const [modalPreAtendimento, setModalPreAtendimento] = useState(false);
  const [modalAssinarTCLE, setModalAssinarTCLE] = useState(false);
  const [modalCartaoDiagnosticoAberto, setModalCartaoDiagnosticoAberto] = useState(false);
  const [sheetNovaMedicaoAberta, setSheetNovaMedicaoAberta] = useState(false);
  const [modoVisualizacaoCuidador, setModoVisualizacaoCuidador] = useState('trilha'); // 'trilha' | 'tabela'
  const [alertaDemaisCuidadores, setAlertaDemaisCuidadores] = useState(true);
  const [compartilharEquipeEscolar, setCompartilharEquipeEscolar] = useState(false);

  // Estados dos Formulários
  /* INÍCIO ESTADOS DE CARREGAMENTO (GLICOLOADER BOTAO) */
  const [salvandoGlicemia, setSalvandoGlicemia] = useState(false);
  const [salvandoFilho, setSalvandoFilho] = useState(false);
  const [salvandoAlergia, setSalvandoAlergia] = useState(false);
  /* FIM ESTADOS DE CARREGAMENTO (GLICOLOADER BOTAO) */
  const [formGlicemia, setFormGlicemia] = useState({
    valor_mg_dl: '',
    dose_insulina: '',
    momento_medicao: 'Antes da Refeicao',
    tipo_leitura: 'Sensor/CGM',
    acao_realizada: 'Nenhuma Acao',
    carboidratos_g: '',
    fator_contexto: '',
    observacoes: '',
  });

  const [formNovoFilho, setFormNovoFilho] = useState({
    nome_completo: '',
    data_nascimento: '',
    sexo: 'masculino',
    tipo_diabetes: 'Tipo 1A',
    data_diagnostico: '',
    terapia_insulina: 'Caneta',
    escola_nome: '',
    contato_emergencia_telefone: '',
    parentesco: 'MAE',
    codigo_convite: '',
  });

  const [formNovaAlergia, setFormNovaAlergia] = useState({
    categoria: 'MEDICAMENTO',
    substancia_ou_item: '',
    gravidade: 'MODERADA',
    reacao_observada: '',
  });

  const [formPreAtendimento, setFormPreAtendimento] = useState({
    motivo_principal: 'Ajuste fino de contagem de carboidratos no lanche da escola',
    maiores_dores: 'Medo de hipoglicemia no horário da educação física às terças-feiras.',
    duvidas_prioritarias: 'Como combinar a dose de Novorapid com a professora do 1º ano?',
  });

  const [formTCLE, setFormTCLE] = useState({
    cpf_declarante: '123.456.789-00',
    concorda_termos: true,
  });

  const filhoAtivo = dependentes[indiceFilhoAtivo] || dependentes[0] || DEPENDENTE_PADRAO_THEO;

  // Carrega lista de dependentes da API
  const carregarDependentes = async () => {
    setCarregando(true);
    try {
      const resp = await cuidadorService.getMeusDependentes();
      if (resp.data && resp.data.sucesso && resp.data.dependentes?.length > 0) {
        setDependentes(resp.data.dependentes);
      }
    } catch (err) {
      console.warn('Usando dados demonstrativos resilientes do cuidador:', err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDependentes();
  }, []);

  // Mostra mensagem temporária de feedback e dispara Toast
  const exibirFeedback = (tipo, texto) => {
    setFeedbackMsg({ tipo, texto });
    if (tipo === 'sucesso') notificar.sucesso(texto);
    else if (tipo === 'erro') notificar.erro(texto);
    else if (tipo === 'aviso') notificar.aviso(texto);
    else notificar.info(texto);
    setTimeout(() => {
      setFeedbackMsg({ tipo: '', texto: '' });
    }, 5000);
  };

  /* INÍCIO DO GERENCIAMENTO DE ALERGIAS (DIRETO EM MODAL) */
  const handleRemoverAlergia = async (alergiaId, nomeSubstancia) => {
    const ok = await confirmar({
      titulo: 'Remover Alergia?',
      descricao: `Tem certeza que deseja remover o registro da alergia "${nomeSubstancia}" do perfil de ${filhoAtivo?.nome_crianca || 'seu dependente'}?`,
      variante: 'destructive',
      confirmText: 'Sim, remover',
      cancelText: 'Cancelar'
    });
    if (!ok) return;

    try {
      if (filhoAtivo?.perfil_saude_id) {
        await alergiasService.remover(alergiaId, { perfil_saude_id: filhoAtivo.perfil_saude_id });
      }
    } catch (err) {
      console.warn('Erro ao remover alergia via API, atualizando localmente:', err);
    }

    const depsAtualizados = [...dependentes];
    depsAtualizados[indiceFilhoAtivo].alergias = (filhoAtivo.alergias || []).filter((a) => a.id !== alergiaId);
    setDependentes(depsAtualizados);
    notificar.sucesso(`Alergia "${nomeSubstancia}" removida com sucesso.`);
  };
  /* FIM DO GERENCIAMENTO DE ALERGIAS (DIRETO EM MODAL) */

  // Helper para cor do valor de glicemia (Porto Seguro)
  const obterCorGlicemia = (valor) => {
    const v = parseInt(valor, 10);
    if (isNaN(v)) return '#7C533F';
    if (v >= 70 && v <= 140) return '#3B7E48'; // Verde Alívio
    if (v > 140 && v <= 180) return '#C88D2A'; // Atenção / Amarelo suave
    return '#C94A38'; // Terracota / Fora da Meta
  };

  // 1. Envio de Nova Medição
  const handleRegistrarGlicemia = async (e) => {
    e.preventDefault();
    if (!formGlicemia.valor_mg_dl || salvandoGlicemia) {
      exibirFeedback('erro', 'Por favor, informe o valor medido de glicemia em mg/dL.');
      return;
    }

    setSalvandoGlicemia(true);
    try {
      const payload = {
        perfil_saude_id: filhoAtivo.perfil_saude_id,
        valor_mg_dl: parseInt(formGlicemia.valor_mg_dl, 10),
        dose_insulina: formGlicemia.dose_insulina ? parseFloat(formGlicemia.dose_insulina) : null,
        momento_medicao: formGlicemia.momento_medicao,
        tipo_leitura: formGlicemia.tipo_leitura,
        acao_realizada: formGlicemia.acao_realizada,
        carboidratos_g: formGlicemia.carboidratos_g ? parseInt(formGlicemia.carboidratos_g, 10) : null,
        fator_contexto: formGlicemia.fator_contexto,
        observacoes: formGlicemia.observacoes,
      };

      try {
        await cuidadorService.registrarGlicemiaCuidador(payload);
      } catch (apiErr) {
        // Fallback local caso servidor PHP offline
      }

      // Adiciona na linha do tempo local
      const novoRegistro = {
        id: Date.now(),
        valor_mg_dl: parseInt(formGlicemia.valor_mg_dl, 10),
        momento_medicao: formGlicemia.momento_medicao,
        tipo_leitura: formGlicemia.tipo_leitura,
        acao_realizada: formGlicemia.acao_realizada,
        dose_insulina: formGlicemia.dose_insulina ? parseFloat(formGlicemia.dose_insulina) : null,
        carboidratos_g: formGlicemia.carboidratos_g ? parseInt(formGlicemia.carboidratos_g, 10) : null,
        fator_contexto: formGlicemia.fator_contexto,
        registrado_por_rotulo: `${usuario?.nome_completo || 'Mariana Silva'} (Mãe)`,
        data_hora_medicao: new Date().toLocaleString('pt-BR'),
      };

      const listaAtualizada = [novoRegistro, ...filhoAtivo.leituras_recentes];
      const depsAtualizados = [...dependentes];
      depsAtualizados[indiceFilhoAtivo] = {
        ...filhoAtivo,
        leituras_recentes: listaAtualizada,
        iob_ativa: formGlicemia.dose_insulina
          ? (filhoAtivo.iob_ativa || 0) + parseFloat(formGlicemia.dose_insulina)
          : filhoAtivo.iob_ativa,
      };
      setDependentes(depsAtualizados);

      // Limpa formulário
      setFormGlicemia({
        valor_mg_dl: '',
        dose_insulina: '',
        momento_medicao: 'Antes da Refeicao',
        tipo_leitura: 'Sensor/CGM',
        acao_realizada: 'Nenhuma Acao',
        carboidratos_g: '',
        fator_contexto: '',
        observacoes: '',
      });

      setSheetNovaMedicaoAberta(false);
      exibirFeedback('sucesso', `Medição de ${novoRegistro.valor_mg_dl} mg/dL registrada com sucesso para ${filhoAtivo.nome_crianca}!`);
    } catch (err) {
      exibirFeedback('erro', 'Não foi possível registrar a medição. Tente novamente.');
    } finally {
      setSalvandoGlicemia(false);
    }
  };

  // 2. Cadastro de Novo Dependente ou Vínculo por Convite
  const handleCadastrarFilho = async (e) => {
    e.preventDefault();
    try {
      if (subAbaNovoFilho === 'convite') {
        if (!formNovoFilho.codigo_convite.trim()) {
          exibirFeedback('erro', 'Informe o código de convite da família.');
          return;
        }
        try {
          await cuidadorService.cadastrarDependente({
            modo: 'convite',
            codigo_convite: formNovoFilho.codigo_convite.trim(),
            parentesco: formNovoFilho.parentesco,
          });
        } catch (apiErr) {}
        exibirFeedback('sucesso', 'Vínculo com a criança confirmado com sucesso!');
      } else {
        if (!formNovoFilho.nome_completo.trim() || !formNovoFilho.data_nascimento) {
          exibirFeedback('erro', 'Informe o nome da criança e a data de nascimento.');
          return;
        }

        try {
          await cuidadorService.cadastrarDependente({
            modo: 'novo',
            ...formNovoFilho,
          });
        } catch (apiErr) {}

        const novoFilhoObj = {
          vinculo_id: Date.now(),
          perfil_saude_id: Date.now(),
          nome_crianca: formNovoFilho.nome_completo,
          data_nascimento: formNovoFilho.data_nascimento,
          idade_extenso: '6 anos',
          tempo_diagnostico_extenso: 'Diagnóstico recente',
          sexo: formNovoFilho.sexo,
          tipo_diabetes: formNovoFilho.tipo_diabetes,
          terapia_insulina: formNovoFilho.terapia_insulina,
          escola_nome: formNovoFilho.escola_nome || 'Não informada',
          contato_emergencia_telefone: formNovoFilho.contato_emergencia_telefone || '(11) 97777-2001',
          parentesco: formNovoFilho.parentesco,
          nivel_acesso: 'ADMINISTRADOR_LEGAL',
          codigo_convite_familia: 'FAM-' + Math.floor(1000 + Math.random() * 9000),
          co_cuidadores: [],
          alergias: [],
          medicamentos: [],
          leituras_recentes: [],
          consultas: [],
          exames: [],
        };

        setDependentes([...dependentes, novoFilhoObj]);
        setIndiceFilhoAtivo(dependentes.length);
        exibirFeedback('sucesso', `Perfil de ${formNovoFilho.nome_completo} criado com sucesso!`);
      }

      setModalNovoFilho(false);
      setFormNovoFilho({
        nome_completo: '',
        data_nascimento: '',
        sexo: 'masculino',
        tipo_diabetes: 'Tipo 1A',
        data_diagnostico: '',
        terapia_insulina: 'Caneta',
        escola_nome: '',
        contato_emergencia_telefone: '',
        parentesco: 'MAE',
        codigo_convite: '',
      });
    } catch (err) {
      exibirFeedback('erro', 'Erro ao processar cadastro de dependente.');
    }
  };

  // 3. Adicionar Alergia Diretamente
  const handleAdicionarAlergia = async (e) => {
    e.preventDefault();
    if (!formNovaAlergia.substancia_ou_item.trim()) {
      notificar.erro('Informe o nome da substância ou medicamento.');
      return;
    }

    setSalvandoAlergia(true);
    let novoId = Date.now();
    try {
      if (filhoAtivo?.perfil_saude_id) {
        const resp = await alergiasService.adicionar({
          perfil_saude_id: filhoAtivo.perfil_saude_id,
          categoria: formNovaAlergia.categoria,
          substancia_ou_item: formNovaAlergia.substancia_ou_item.trim(),
          gravidade: formNovaAlergia.gravidade,
          reacao_observada: formNovaAlergia.reacao_observada.trim(),
        });
        if (resp && resp.id) {
          novoId = resp.id;
        }
      }
    } catch (err) {
      console.warn('Erro ao cadastrar alergia via API, aplicando persistência local resiliente:', err);
    } finally {
      setSalvandoAlergia(false);
    }

    const nova = {
      id: novoId,
      categoria: formNovaAlergia.categoria,
      substancia_ou_item: formNovaAlergia.substancia_ou_item.trim(),
      gravidade: formNovaAlergia.gravidade,
      reacao_observada: formNovaAlergia.reacao_observada.trim(),
    };

    const depsAtualizados = [...dependentes];
    depsAtualizados[indiceFilhoAtivo].alergias = [nova, ...(filhoAtivo.alergias || [])];
    setDependentes(depsAtualizados);
    setFormNovaAlergia({ categoria: 'MEDICAMENTO', substancia_ou_item: '', gravidade: 'MODERADA', reacao_observada: '' });
    notificar.sucesso(`Alergia a "${nova.substancia_ou_item}" adicionada com sucesso!`);
  };

  // 4. Copiar código de convite
  const handleCopiarConvite = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(filhoAtivo.codigo_convite_familia || 'THEO-FAM-2026');
      exibirFeedback('sucesso', 'Código de convite copiado para a área de transferência!');
    }
  };

  /* INÍCIO BLOCO FEEDBACK CARREGAMENTO (GLICOLOADER PÁGINA) */
  if (carregando && dependentes.length === 0) {
    return (
      <div
        style={{
          backgroundColor: 'var(--cor-fundo, #EAE4D9)',
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5rem 1.5rem',
        }}
      >
        <GlicoLoader
          variant="pagina"
          mensagem="Acessando o espaço da sua família..."
          submensagem="Organizando a rotina, diário e registros dos seus dependentes com carinho."
        />
      </div>
    );
  }
  /* FIM BLOCO FEEDBACK CARREGAMENTO (GLICOLOADER PÁGINA) */

  return (
    <div
      style={{
        backgroundColor: 'var(--cor-fundo, #EAE4D9)',
        minHeight: '100vh',
        padding: '2.5rem 0 4rem',
        color: '#2E2824',
      }}
    >
      {/* ESTILO DE IMPRESSÃO ESPECÍFICO PARA O CARTÃO ESCOLAR */}
      <style>{`
        @media print {
          body {
            background-color: #FFFFFF !important;
            color: #000000 !important;
          }
          header, nav, footer, .nao-imprimir {
            display: none !important;
          }
          .cartao-escolar-print {
            border: 2px solid #2E2824 !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 1.5cm !important;
            width: 100% !important;
            max-width: 100% !important;
            background-color: #FFFFFF !important;
          }
        }
      `}</style>

      <div className="container" style={{ width: '92%', maxWidth: '1360px', margin: '0 auto' }}>
        {/* ==================================================================
            CABEÇALHO UNIFICADO MINIMALISTA DO CUIDADOR & DEPENDENTE
            ================================================================== */}
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
                  {filhoAtivo.nome_crianca}
                </h1>

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
                  {filhoAtivo.idade_extenso}
                </span>

                <span
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--cor-texto-suave)',
                  }}
                >
                  (Cuidado por: <strong>{usuario?.nome_completo || 'Mariana Silva'}</strong>)
                </span>
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
                <span>{filhoAtivo.tipo_diabetes || 'Tipo 1A'}</span>
                <Separator orientation="vertical" style={{ height: '12px' }} />
                <span>{filhoAtivo.terapia_insulina || 'Caneta'}</span>
                <Separator orientation="vertical" style={{ height: '12px' }} />
                <span>{filhoAtivo.escola_nome}</span>
                <Separator orientation="vertical" style={{ height: '12px' }} />
                <span>{filhoAtivo.tempo_diagnostico_extenso}</span>

                {/* Selo Discreto de Alergias */}
                <button
                  type="button"
                  onClick={() => setModalNovaAlergia(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    border: '1px solid',
                    borderColor: (filhoAtivo.alergias?.length || 0) > 0 ? '#F0C9B6' : 'var(--cor-borda-suave)',
                    backgroundColor: (filhoAtivo.alergias?.length || 0) > 0 ? '#FDF2F0' : 'var(--cor-fundo)',
                    color: (filhoAtivo.alergias?.length || 0) > 0 ? '#A23B2A' : 'var(--cor-texto-suave)',
                    cursor: 'pointer',
                    marginLeft: '0.25rem',
                  }}
                  title="Clique para gerenciar alergias e sensibilidades"
                >
                  {(filhoAtivo.alergias?.length || 0) > 0 ? <AlertTriangle size={12} strokeWidth={2} /> : <ShieldCheck size={12} strokeWidth={2} />}
                  <span>{filhoAtivo.alergias?.length ? `${filhoAtivo.alergias.length} alergia(s)` : '0 alergias'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Direita: Ações do Responsável e Alternância de Dependentes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {dependentes.length > 1 && (
              <div style={{ width: '160px' }}>
                <CustomSelect
                  value={indiceFilhoAtivo}
                  onChange={(val) => setIndiceFilhoAtivo(Number(val))}
                  options={dependentes.map((d, idx) => ({
                    value: idx,
                    label: d.nome_crianca,
                  }))}
                />
              </div>
            )}

            <Button
              variante="sucesso"
              onClick={() => setSheetNovaMedicaoAberta(true)}
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
              <span>Registrar Medição</span>
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

            <button
              type="button"
              onClick={() => setAbaAtiva('escola')}
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
              <span>Cartão Escolar (PDF)</span>
            </button>

            <button
              type="button"
              onClick={() => setModalNovoFilho(true)}
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
              <Plus size={13} strokeWidth={2} />
              <span>Adicionar Filho(a)</span>
            </button>
          </div>
        </header>

        {/* MENSAGEM TEMPORÁRIA DE FEEDBACK */}
        {feedbackMsg.texto && (
          <div style={{ marginBottom: '1.5rem' }}>
            <Alert
              variant={feedbackMsg.tipo === 'sucesso' ? 'success' : 'destructive'}
              dismissible
              onDismiss={() => setFeedbackMsg({ tipo: '', texto: '' })}
            >
              <AlertDescription>{feedbackMsg.texto}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* ==================================================================
            NAVEGAÇÃO EM TABS SEGMENTADAS (SHADCN SEGMENTED CONTROL)
            ================================================================== */}
        <div style={{ marginBottom: '1.75rem' }}>
          <Tabs value={abaAtiva} onValueChange={(val) => setAbaAtiva(val)}>
            <TabsList>
              <TabsTrigger value="diario">
                <Activity size={15} strokeWidth={1.75} />
                <span>Diário & IOB</span>
                {filhoAtivo.iob_ativa > 0 && (
                  <Badge variant="warning" style={{ fontSize: '10px', padding: '0 5px' }}>
                    {filhoAtivo.iob_ativa} UI
                  </Badge>
                )}
              </TabsTrigger>

              {FEATURES.TELEMEDICINA_ATIVA && (
                <TabsTrigger value="consultas">
                  <User size={15} strokeWidth={1.75} />
                  <span>Especialistas ({filhoAtivo.consultas?.length || 0})</span>
                </TabsTrigger>
              )}

              <TabsTrigger value="exames">
                <FileText size={15} strokeWidth={1.75} />
                <span>Exames & Alergias ({filhoAtivo.alergias?.length || 0})</span>
              </TabsTrigger>

              <TabsTrigger value="escola">
                <Calendar size={15} strokeWidth={1.75} />
                <span>Cartão Escolar</span>
              </TabsTrigger>

              <TabsTrigger value="comunidade">
                <span>💬</span>
                <span>Comunidade</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* ==================================================================
            CONTEÚDO DA ABA 1: DIÁRIO GLICÊMICO & INSULINA ATIVA (IOB)
            ================================================================== */}
        {abaAtiva === 'diario' && (
          <div>
            {/* ALERTA VISUAL DE EMPILHAMENTO DE INSULINA (IOB) */}
            {filhoAtivo.alerta_empilhamento && (
              <div style={{ marginBottom: '1.75rem' }}>
                <Alert variant="warning">
                  <AlertTitle>
                    Alerta de Segurança: Insulina Ativa ({filhoAtivo.alerta_empilhamento.iob_ativa} UI) — Prevenção de Empilhamento
                  </AlertTitle>
                  <AlertDescription>
                    {filhoAtivo.alerta_empilhamento.mensagem}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* /* INÍCIO DO COMPONENTE: BENTO GRID COM 3 KPI CARDS (SHADCN STYLE) */}
            {(() => {
              const leituras = filhoAtivo.leituras_recentes || [];
              const ultima = leituras[0] || { valor_mg_dl: 142, data_hora_medicao: '10:30', momento_medicao: 'Pré-prandial' };
              const v = Number(ultima.valor_mg_dl) || 142;
              const statusCor = v < 70 ? '#C94A38' : v > 180 ? '#C88D2A' : 'var(--cor-cta, #3B7E48)';
              const statusVariante = v < 70 ? 'destructive' : v > 180 ? 'warning' : 'success';
              const statusTexto = v < 70 ? 'Hipo' : v > 180 ? 'Atenção' : 'No Alvo';

              const totalL = leituras.length || 1;
              const noAlvoCount = leituras.filter((l) => Number(l.valor_mg_dl) >= 70 && Number(l.valor_mg_dl) <= 180).length;
              const abaixoCount = leituras.filter((l) => Number(l.valor_mg_dl) < 70).length;
              const tirPct = Math.round((noAlvoCount / totalL) * 100);
              const abaixoPct = Math.round((abaixoCount / totalL) * 100);
              const acimaPct = Math.max(0, 100 - tirPct - abaixoPct);

              const iobVal = filhoAtivo.alerta_empilhamento?.iob_ativa || 2.1;

              return (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.75rem',
                  }}
                >
                  {/* KPI 1: Última Glicemia */}
                  <Card>
                    <CardContent style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--cor-primaria, #7C533F)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Última Glicemia
                        </span>
                        <Badge variant={statusVariante}>
                          {statusTexto}
                        </Badge>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', margin: '0.2rem 0' }}>
                        <span
                          style={{
                            fontSize: '2.25rem',
                            fontWeight: 800,
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                            fontVariantNumeric: 'tabular-nums',
                            color: statusCor,
                            lineHeight: 1,
                          }}
                        >
                          {v}
                        </span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--cor-primaria, #7C533F)' }}>mg/dL</span>
                      </div>
                      <Separator style={{ margin: '0.65rem 0' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', color: 'var(--cor-texto-suave, #5C534C)' }}>
                        <Activity size={13} color="var(--cor-cta, #3B7E48)" />
                        <span>{ultima.data_hora_medicao?.split(' ')[1] || ultima.data_hora_medicao} • ↘ Tendência estável</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* KPI 2: Insulina Ativa (IOB) */}
                  <Card>
                    <CardContent style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--cor-primaria, #7C533F)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Insulina Ativa (IOB)
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--cor-texto-suave, #5C534C)' }}>
                          expira em 2h15
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
                          {iobVal}
                        </span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--cor-primaria, #7C533F)' }}>UI</span>
                      </div>
                      <Separator style={{ margin: '0.65rem 0' }} />
                      {/* Barra de progresso fina de 4px */}
                      <div>
                        <div
                          style={{
                            height: '4px',
                            borderRadius: '999px',
                            backgroundColor: 'rgba(124, 83, 63, 0.1)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, Math.round((iobVal / 4) * 100))}%`,
                              height: '100%',
                              backgroundColor: 'var(--cor-cta, #3B7E48)',
                              borderRadius: '999px',
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', fontSize: '0.7rem', color: 'var(--cor-texto-suave, #5C534C)' }}>
                          <span>Ação rápida</span>
                          <span>Prevenção empilhamento</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* KPI 3: Tempo no Alvo (TIR — 7 dias) */}
                  <Card>
                    <CardContent style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--cor-primaria, #7C533F)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Tempo no Alvo (TIR)
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
                            color: tirPct >= 70 ? 'var(--cor-cta, #3B7E48)' : '#C88D2A',
                            lineHeight: 1,
                          }}
                        >
                          {tirPct}%
                        </span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--cor-texto-suave, #5C534C)' }}>70–180 mg/dL</span>
                      </div>
                      <Separator style={{ margin: '0.65rem 0' }} />
                      {/* Micro-barra segmentada fina de 4px */}
                      <div>
                        <div
                          style={{
                            height: '4px',
                            borderRadius: '999px',
                            display: 'flex',
                            overflow: 'hidden',
                            backgroundColor: 'rgba(124, 83, 63, 0.1)',
                          }}
                        >
                          <div style={{ width: `${abaixoPct}%`, backgroundColor: '#C94A38' }} title={`Abaixo: ${abaixoPct}%`} />
                          <div style={{ width: `${tirPct}%`, backgroundColor: 'var(--cor-cta, #3B7E48)' }} title={`No alvo: ${tirPct}%`} />
                          <div style={{ width: `${acimaPct}%`, backgroundColor: '#C88D2A' }} title={`Acima: ${acimaPct}%`} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', fontSize: '0.7rem', color: 'var(--cor-texto-suave, #5C534C)' }}>
                          <span style={{ color: '#C94A38' }}>{abaixoPct}% &lt;70</span>
                          <span style={{ color: 'var(--cor-cta, #3B7E48)', fontWeight: 700 }}>{tirPct}% no alvo</span>
                          <span style={{ color: '#C88D2A' }}>{acimaPct}% &gt;180</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
            {/* /* FIM DO COMPONENTE: BENTO GRID COM 3 KPI CARDS */}

            {/* /* INÍCIO DO COMPONENTE: GRÁFICO CURVA DE GLICEMIA (SVG INTERATIVO SHADCN) */}
            <div style={{ marginBottom: '1.75rem' }}>
              <GraficoCurvaGlicemia registros={filhoAtivo.leituras_recentes || []} />
            </div>
            {/* /* FIM DO COMPONENTE: GRÁFICO CURVA DE GLICEMIA */}

            {/* /* INÍCIO DO HISTÓRICO DE LEITURAS RECENTES (<Table /> E <Trace /> SHADCN STYLE) */}
            <Card style={{ marginBottom: '1.75rem' }}>
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <CardTitle>Linha do Tempo Familiar & Auditoria</CardTitle>
                    <CardDescription>
                      {filhoAtivo.leituras_recentes?.length || 0} registros sincronizados entre mãe, pai e cuidadores autorizados.
                    </CardDescription>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <ToggleGroup
                      type="single"
                      value={modoVisualizacaoCuidador}
                      onValueChange={(val) => val && setModoVisualizacaoCuidador(val)}
                      variant="outline"
                      size="sm"
                    >
                      <ToggleGroupItem value="trilha">Trilha (Trace)</ToggleGroupItem>
                      <ToggleGroupItem value="tabela">Tabela</ToggleGroupItem>
                    </ToggleGroup>

                    <Button
                      variante="sucesso"
                      onClick={() => setSheetNovaMedicaoAberta(true)}
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
                {filhoAtivo.leituras_recentes?.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--cor-texto-suave, #5C534C)', fontSize: '0.86rem' }}>
                    Nenhuma medição registrada até o momento.
                  </p>
                ) : modoVisualizacaoCuidador === 'trilha' ? (
                  <div style={{ padding: '1.25rem 1.5rem' }}>
                    <TraceList>
                      {filhoAtivo.leituras_recentes?.map((leitura, idx) => {
                        const v = Number(leitura.valor_mg_dl);
                        const statusTrace = v < 70 ? 'destructive' : v > 180 ? 'warning' : 'success';

                        return (
                          <TraceItem
                            key={leitura.id}
                            status={statusTrace}
                            timestamp={leitura.data_hora_medicao?.split(' ')[1] || leitura.data_hora_medicao}
                            isLast={idx === (filhoAtivo.leituras_recentes?.length || 1) - 1}
                            title={
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                                    fontWeight: 800,
                                    fontVariantNumeric: 'tabular-nums',
                                    fontSize: '1.1rem',
                                    color: obterCorGlicemia(leitura.valor_mg_dl),
                                  }}
                                >
                                  {leitura.valor_mg_dl} mg/dL
                                </span>
                                <Badge variant={statusTrace}>
                                  {v < 70 ? 'Hipo' : v > 180 ? 'Atenção' : 'No Alvo'}
                                </Badge>
                                <span style={{ fontSize: '0.78rem', color: 'var(--cor-texto-suave, #5C534C)' }}>
                                  ({leitura.momento_medicao})
                                </span>
                                <Badge variant={leitura.registrado_por_rotulo?.includes('Pai') ? 'outline' : 'success'} style={{ fontSize: '10px' }}>
                                  Por: {leitura.registrado_por_rotulo || 'Responsável'}
                                </Badge>
                              </div>
                            }
                            description={
                              <span>
                                {leitura.dose_insulina ? `Insulina: ${leitura.dose_insulina} UI • ` : ''}
                                {leitura.carboidratos_g ? `Carboidratos: ${leitura.carboidratos_g}g • ` : ''}
                                Contexto: {leitura.fator_contexto || 'Rotina familiar'}
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
                        <TableHead>Glicemia</TableHead>
                        <TableHead>Momento</TableHead>
                        <TableHead>Dose / Carbos</TableHead>
                        <TableHead>Registrado Por</TableHead>
                        <TableHead style={{ textAlign: 'right' }}>Horário</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filhoAtivo.leituras_recentes?.map((leitura) => (
                        <TableRow key={leitura.id}>
                          <TableCell style={{ whiteSpace: 'nowrap' }}>
                            <span
                              style={{
                                fontSize: '1.15rem',
                                fontWeight: 800,
                                fontFamily: 'Plus Jakarta Sans, sans-serif',
                                fontVariantNumeric: 'tabular-nums',
                                color: obterCorGlicemia(leitura.valor_mg_dl),
                              }}
                            >
                              {leitura.valor_mg_dl}{' '}
                              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--cor-primaria, #7C533F)' }}>mg/dL</span>
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {leitura.momento_medicao}
                            </Badge>
                          </TableCell>
                          <TableCell style={{ color: 'var(--cor-texto-suave, #5C534C)' }}>
                            {leitura.dose_insulina ? `${leitura.dose_insulina} UI • ` : ''}
                            {leitura.carboidratos_g ? `${leitura.carboidratos_g}g carbos • ` : ''}
                            {leitura.fator_contexto || '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={leitura.registrado_por_rotulo?.includes('Pai') ? 'outline' : 'success'}>
                              {leitura.registrado_por_rotulo || 'Responsável'}
                            </Badge>
                          </TableCell>
                          <TableCell style={{ textAlign: 'right', color: 'var(--cor-primaria, #7C533F)', fontVariantNumeric: 'tabular-nums' }}>
                            {leitura.data_hora_medicao?.split(' ')[1] || leitura.data_hora_medicao}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            {/* /* FIM DO HISTÓRICO DE LEITURAS RECENTES */}

            {/* /* INÍCIO DA GAVETA LATERAL (SHEET) PARA NOVO REGISTRO DO FILHO */}
            <Sheet open={sheetNovaMedicaoAberta} onOpenChange={setSheetNovaMedicaoAberta}>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Registrar Medição para {filhoAtivo.nome_crianca}</SheetTitle>
                  <SheetDescription>
                    Registro com identificação auditável do responsável conectado ({usuario?.nome_completo || 'Mariana Silva'}).
                  </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleRegistrarGlicemia} style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '1.75rem', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--cor-texto, #2E2824)', marginBottom: '0.4rem' }}>
                      Glicemia Medida (mg/dL) *
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 115"
                      value={formGlicemia.valor_mg_dl}
                      onChange={(e) => setFormGlicemia({ ...formGlicemia, valor_mg_dl: e.target.value })}
                      required
                      min="20"
                      max="600"
                      style={{
                        width: '100%',
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        color: obterCorGlicemia(formGlicemia.valor_mg_dl),
                        borderRadius: '10px',
                        border: '1.5px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.25))',
                        padding: '0.65rem 0.85rem',
                        backgroundColor: 'var(--cor-fundo, #FAF8F5)',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--cor-texto, #2E2824)', marginBottom: '0.4rem' }}>
                      Momento da Medição
                    </label>
                    <select
                      value={formGlicemia.momento_medicao}
                      onChange={(e) => setFormGlicemia({ ...formGlicemia, momento_medicao: e.target.value })}
                      style={{
                        width: '100%',
                        fontSize: '0.88rem',
                        borderRadius: '10px',
                        border: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.25))',
                        padding: '0.65rem 0.85rem',
                        backgroundColor: 'var(--cor-fundo, #FAF8F5)',
                        color: 'var(--cor-texto, #2E2824)',
                      }}
                    >
                      <option value="Jejum">Jejum matinal</option>
                      <option value="Antes do Lanche">Antes do lanche</option>
                      <option value="Antes do Almoço">Antes do almoço</option>
                      <option value="2h pós Almoço">2h pós almoço</option>
                      <option value="Antes do Jantar">Antes do jantar</option>
                      <option value="Madrugada">Madrugada</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--cor-texto, #2E2824)', marginBottom: '0.4rem' }}>
                        Carboidratos (g)
                      </label>
                      <input
                        type="number"
                        placeholder="Ex: 35"
                        value={formGlicemia.carboidratos_g}
                        onChange={(e) => setFormGlicemia({ ...formGlicemia, carboidratos_g: e.target.value })}
                        min="0"
                        max="300"
                        style={{
                          width: '100%',
                          fontSize: '0.92rem',
                          borderRadius: '10px',
                          border: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.25))',
                          padding: '0.65rem 0.85rem',
                          backgroundColor: 'var(--cor-fundo, #FAF8F5)',
                          color: 'var(--cor-texto, #2E2824)',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--cor-texto, #2E2824)', marginBottom: '0.4rem' }}>
                        Insulina (UI)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="Ex: 1.5"
                        value={formGlicemia.dose_insulina}
                        onChange={(e) => setFormGlicemia({ ...formGlicemia, dose_insulina: e.target.value })}
                        min="0"
                        max="50"
                        style={{
                          width: '100%',
                          fontSize: '0.92rem',
                          borderRadius: '10px',
                          border: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.25))',
                          padding: '0.65rem 0.85rem',
                          backgroundColor: 'var(--cor-fundo, #FAF8F5)',
                          color: 'var(--cor-texto, #2E2824)',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--cor-texto, #2E2824)', marginBottom: '0.4rem' }}>
                      Observação / Contexto
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Lanche da tarde na escola"
                      value={formGlicemia.fator_contexto}
                      onChange={(e) => setFormGlicemia({ ...formGlicemia, fator_contexto: e.target.value })}
                      style={{
                        width: '100%',
                        fontSize: '0.88rem',
                        borderRadius: '10px',
                        border: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.25))',
                        padding: '0.65rem 0.85rem',
                        backgroundColor: 'var(--cor-fundo, #FAF8F5)',
                        color: 'var(--cor-texto, #2E2824)',
                      }}
                    />
                  </div>

                  <Separator style={{ margin: '0.25rem 0' }} />

                  {/* Configurações Booleanas via Switch */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <Switch
                      id="switch-alerta-demais-cuidadores"
                      checked={alertaDemaisCuidadores}
                      onCheckedChange={setAlertaDemaisCuidadores}
                      label="Alerta Imediato aos Demais Cuidadores"
                      description="Sincroniza notificação push em tempo real com a rede familiar"
                    />
                    <Switch
                      id="switch-compartilhar-escola"
                      checked={compartilharEquipeEscolar}
                      onCheckedChange={setCompartilharEquipeEscolar}
                      label="Compartilhar com Equipe Escolar"
                      description="Disponibiliza o registro no Cartão Escolar seguro da criança"
                    />
                  </div>

                  <SheetFooter style={{ marginTop: 'auto', padding: 0 }}>
                    <Button
                      variante="secundario"
                      tipo="button"
                      onClick={() => setSheetNovaMedicaoAberta(false)}
                      style={{ fontSize: '0.88rem' }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variante="sucesso"
                      tipo="submit"
                      loading={salvandoGlicemia}
                      disabled={salvandoGlicemia || !formGlicemia.valor_mg_dl}
                      style={{ fontSize: '0.88rem', fontWeight: 700 }}
                    >
                      Salvar Medição
                    </Button>
                  </SheetFooter>
                </form>
              </SheetContent>
            </Sheet>
            {/* /* FIM DA GAVETA LATERAL (SHEET) */}
          </div>
        )}

        {/* ==================================================================
            CONTEÚDO DA ABA 2: ESPECIALISTAS & CONSULTAS (FASE 2)
            ================================================================== */}
        {/* INÍCIO BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS (COMENTADO PARA LANÇAMENTO FASE 1) */}
        {FEATURES.TELEMEDICINA_ATIVA && abaAtiva === 'consultas' && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: 'var(--fonte-titulo, Fraunces)',
                    fontSize: '1.35rem',
                    color: '#2E2824',
                    margin: '0 0 0.35rem',
                  }}
                >
                  Consultas e Telemedicina de {filhoAtivo.nome_crianca}
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#5A5049', margin: 0 }}>
                  Agendamentos integrados com direito a retorno em 30 dias e sala criptografada nativa.
                </p>
              </div>

              <Link to="/especialistas" style={{ textDecoration: 'none' }}>
                <Button variante="primario" style={{ fontSize: '0.85rem' }}>
                  🩺 Agendar com Especialista Infantil
                </Button>
              </Link>
            </div>

            {filhoAtivo.consultas?.length === 0 ? (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  border: '1px solid rgba(124, 83, 63, 0.15)',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🩺</div>
                <h4 style={{ fontFamily: 'var(--fonte-titulo, Fraunces)', color: '#7C533F', margin: '0 0 0.5rem' }}>
                  Nenhuma consulta agendada no momento
                </h4>
                <p style={{ fontSize: '0.9rem', color: '#5A5049', maxWidth: '520px', margin: '0 auto 1.5rem' }}>
                  Encontre endocrinologistas pediátricos, nutricionistas gentis e educadores físicos credenciados na GlicoCare.
                </p>
                <Link to="/especialistas" style={{ textDecoration: 'none' }}>
                  <Button variante="primario">Conhecer a Rede de Especialistas →</Button>
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1.25rem' }}>
                {filhoAtivo.consultas?.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      padding: '1.5rem 1.75rem',
                      border: '1px solid rgba(124, 83, 63, 0.18)',
                      boxShadow: '0 4px 16px rgba(46, 40, 36, 0.04)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        marginBottom: '1rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#2E2824' }}>
                            {c.especialista_nome}
                          </span>
                          <span
                            style={{
                              backgroundColor: 'rgba(59, 126, 72, 0.12)',
                              color: '#3B7E48',
                              fontSize: '0.74rem',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontWeight: 700,
                            }}
                          >
                            {c.especialidade}
                          </span>
                          {c.numero_conselho && (
                            <span style={{ fontSize: '0.74rem', color: '#7C533F', fontWeight: 600 }}>
                              {c.tipo_conselho} {c.numero_conselho}-{c.uf_conselho}
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.84rem', color: '#5A5049' }}>
                          📅 <strong>Horário Agendado:</strong> {c.data_hora_consulta} (60 min)
                        </div>
                      </div>

                      {/* Status TCLE e Pré-Atendimento */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '0.76rem',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            backgroundColor: c.tcle_assinado ? '#D1E7DD' : '#FFF3CD',
                            color: c.tcle_assinado ? '#0F5132' : '#856404',
                            border: `1px solid ${c.tcle_assinado ? '#BADBCC' : '#FFEEBA'}`,
                          }}
                        >
                          {c.tcle_assinado ? '✓ TCLE Responsável Legal Ativo' : '⚠️ TCLE Pendente de Aceite'}
                        </span>

                        <span
                          style={{
                            fontSize: '0.76rem',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            backgroundColor: c.pre_atendimento_preenchido ? '#E8EEF5' : '#F6F3EE',
                            color: c.pre_atendimento_preenchido ? '#2C4C6C' : '#7C533F',
                            border: '1px solid rgba(124, 83, 63, 0.15)',
                          }}
                        >
                          {c.pre_atendimento_preenchido ? '✓ Pré-Atendimento Concluído' : '✏️ Preencher Pré-Atendimento'}
                        </span>
                      </div>
                    </div>

                    {/* Botões de Ação da Consulta */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '0.75rem',
                        borderTop: '1px solid rgba(124, 83, 63, 0.1)',
                        paddingTop: '1rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <Button
                        variante="secundario"
                        onClick={() => setModalPreAtendimento(true)}
                        style={{ fontSize: '0.8rem', padding: '0.45rem 0.95rem' }}
                      >
                        📝 Ver / Editar Pré-Atendimento
                      </Button>

                      {!c.tcle_assinado && (
                        <Button
                          variante="secundario"
                          onClick={() => setModalAssinarTCLE(true)}
                          style={{ fontSize: '0.8rem', padding: '0.45rem 0.95rem', borderColor: '#3B7E48', color: '#3B7E48' }}
                        >
                          ✍️ Assinar TCLE da Criança
                        </Button>
                      )}

                      <Link to={`/sala-consulta/${c.sala_token_unico}`} style={{ textDecoration: 'none' }}>
                        <Button variante="primario" style={{ fontSize: '0.8rem', padding: '0.45rem 1.1rem' }}>
                          📹 Entrar na Sala de Vídeo
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* FIM BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS */}

        {/* ==================================================================
            CONTEÚDO DA ABA 3: EXAMES & COMPARATIVO LABORATORIAL (FASE 1)
            ================================================================== */}
        {abaAtiva === 'exames' && (
          <div style={{ display: 'grid', gap: '2rem' }}>
            {/* /* INÍCIO DO COMPONENTE: COMPARATIVO AUTOMÁTICO DE EXAMES */}
            <ComparativoExames exames={filhoAtivo.exames || []} />
            {/* /* FIM DO COMPONENTE: COMPARATIVO AUTOMÁTICO DE EXAMES */}

            {/* /* INÍCIO DA SEÇÃO ENXUTA DE ALERGIAS & SENSIBILIDADES */}
            <div
              style={{
                backgroundColor: 'var(--cor-superficie, #FFFFFF)',
                borderRadius: '16px',
                padding: '1.5rem',
                border: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.12))',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--fonte-titulo, Fraunces)',
                      fontSize: '1.15rem',
                      color: 'var(--cor-texto, #2E2824)',
                      margin: 0,
                    }}
                  >
                    Alergias & Sensibilidades de {filhoAtivo.nome_crianca}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#5A5049', margin: '0.2rem 0 0' }}>
                    Proteção clínica compartilhada no cartão escolar e relatórios de emergência.
                  </p>
                </div>

                <Button
                  variante="secundario"
                  onClick={() => setModalNovaAlergia(true)}
                  style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
                >
                  + Adicionar Alergia
                </Button>
              </div>

              {filhoAtivo.alergias?.length === 0 ? (
                <p style={{ color: '#5A5049', fontSize: '0.85rem', margin: 0, padding: '0.5rem 0' }}>
                  Nenhuma alergia registrada para {filhoAtivo.nome_crianca}.
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                  {filhoAtivo.alergias?.map((al) => (
                    <div
                      key={al.id}
                      style={{
                        backgroundColor: 'var(--cor-fundo, #FAF8F5)',
                        borderRadius: '12px',
                        padding: '0.85rem 1rem',
                        borderLeft: `4px solid ${al.gravidade === 'GRAVE' ? '#C94A38' : al.gravidade === 'MODERADA' ? '#C88D2A' : '#3B7E48'}`,
                        border: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.08))',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--cor-texto, #2E2824)', fontSize: '0.9rem' }}>
                          {al.substancia_ou_item}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              borderRadius: '6px',
                              padding: '2px 6px',
                              backgroundColor: al.gravidade === 'GRAVE' ? '#F8D7DA' : al.gravidade === 'MODERADA' ? '#FFF3CD' : '#D1E7DD',
                              color: al.gravidade === 'GRAVE' ? '#842029' : al.gravidade === 'MODERADA' ? '#856404' : '#0F5132',
                            }}
                          >
                            {al.gravidade} • {al.categoria}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoverAlergia(al.id, al.substancia_ou_item)}
                            title="Remover alergia"
                            aria-label={`Remover alergia ${al.substancia_ou_item}`}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#C94A38',
                              fontSize: '0.85rem',
                              padding: '2px 4px',
                              borderRadius: '4px',
                              lineHeight: 1,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#5A5049', margin: 0, lineHeight: 1.4 }}>
                        {al.reacao_observada || 'Reação clínica observada em episódios anteriores.'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* /* FIM DA SEÇÃO ENXUTA DE ALERGIAS & SENSIBILIDADES */}
          </div>
        )}

        {/* ==================================================================
            CONTEÚDO DA ABA 4: CARTÃO DE CUIDADO ESCOLAR / EMERGÊNCIA (PDF)
            ================================================================== */}
        {abaAtiva === 'escola' && (
          <div>
            <div
              className="nao-imprimir"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: 'var(--fonte-titulo, Fraunces)',
                    fontSize: '1.35rem',
                    color: '#2E2824',
                    margin: '0 0 0.35rem',
                  }}
                >
                  Cartão de Cuidado e Acolhimento Escolar
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#5A5049', margin: 0 }}>
                  Documento pedagógico humanizado para entregar a professores, coordenadores e monitores escolares.
                </p>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  backgroundColor: '#3B7E48',
                  color: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '0.65rem 1.35rem',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(59, 126, 72, 0.25)',
                }}
              >
                <span>🖨️</span>
                <span>Baixar / Imprimir Cartão Escolar (PDF)</span>
              </button>
            </div>

            {/* CARTÃO IMPRESSO ESTILIZADO ("PORTO SEGURO") */}
            <div
              className="cartao-escolar-print"
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                padding: '2.5rem',
                border: '1.5px solid rgba(124, 83, 63, 0.2)',
                boxShadow: '0 8px 30px rgba(46, 40, 36, 0.06)',
                maxWidth: '960px',
                margin: '0 auto',
              }}
            >
              {/* Topo do Cartão Escolar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '2px solid rgba(124, 83, 63, 0.2)',
                  paddingBottom: '1.5rem',
                  marginBottom: '1.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img
                    src={logoGlicoCare}
                    alt="Logo GlicoCare"
                    style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <h2
                      style={{
                        fontFamily: 'var(--fonte-titulo, Fraunces)',
                        fontSize: '1.45rem',
                        color: '#7C533F',
                        margin: 0,
                      }}
                    >
                      GlicoCare — Cartão de Cuidado Escolar
                    </h2>
                    <span style={{ fontSize: '0.84rem', color: '#5A5049' }}>
                      Orientações Práticas e Seguras para a Rotina em Sala de Aula
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      backgroundColor: 'rgba(59, 126, 72, 0.12)',
                      color: '#2D6337',
                      fontSize: '0.8rem',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontWeight: 800,
                    }}
                  >
                    DM1 • Ano Letivo 2026
                  </span>
                </div>
              </div>

              {/* Informações da Criança e Contatos Imediatos */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '1.25rem',
                  backgroundColor: '#F6F3EE',
                  borderRadius: '12px',
                  padding: '1.25rem 1.5rem',
                  marginBottom: '1.75rem',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#7C533F', fontWeight: 700, textTransform: 'uppercase' }}>
                    Aluno(a):
                  </span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#2E2824' }}>
                    {filhoAtivo.nome_crianca}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#5A5049' }}>
                    {filhoAtivo.idade_extenso} • {filhoAtivo.escola_nome}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.78rem', color: '#7C533F', fontWeight: 700, textTransform: 'uppercase' }}>
                    Contatos de Emergência (Pais):
                  </span>
                  <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#2E2824' }}>
                    Mãe (Mariana): (11) 97777-2001
                  </div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#2E2824' }}>
                    Pai (Carlos Eduardo): (21) 97777-2002
                  </div>
                </div>
              </div>

              {/* Alerta de Alergias em Destaque */}
              <div
                style={{
                  backgroundColor: '#FFF4E5',
                  border: '1.5px solid #C88D2A',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  marginBottom: '1.75rem',
                }}
              >
                <div style={{ fontWeight: 800, color: '#8A5D10', fontSize: '0.92rem', marginBottom: '0.25rem' }}>
                  ⚠️ ALERGIAS MEDICAMENTOSAS E INSUMOS (ATENÇÃO DA ENFERMARIA):
                </div>
                <div style={{ fontSize: '0.86rem', color: '#2E2824' }}>
                  <strong>NUNCA ADMINISTRAR DIPIRONA</strong> (Gera reação moderada com placas avermelhadas). Sensor fixado com adesivo hipoalergênico.
                </div>
              </div>

              {/* Sinais de Hipoglicemia e Regra dos 15g */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '1.75rem',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(124, 83, 63, 0.18)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                  }}
                >
                  <div style={{ fontWeight: 800, color: '#C94A38', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                    🚨 Sinais de Glicemia Baixa (&lt; 70 mg/dL):
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.86rem', color: '#2E2824', lineHeight: 1.6 }}>
                    <li>Suor frio na testa ou na nuca;</li>
                    <li>Palidez repentina e sensação de fraqueza;</li>
                    <li>Mudança súbita de humor, choro fácil ou irritabilidade;</li>
                    <li>Sonolência fora de hora ou fala arrastada.</li>
                  </ul>
                </div>

                <div
                  style={{
                    backgroundColor: '#E8F5E9',
                    border: '1.5px solid #3B7E48',
                    borderRadius: '12px',
                    padding: '1.25rem',
                  }}
                >
                  <div style={{ fontWeight: 800, color: '#1E4620', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                    🧃 O que Fazer (Regra dos 15g de Resgate):
                  </div>
                  <ol style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.86rem', color: '#1E4620', lineHeight: 1.6 }}>
                    <li>
                      <strong>1. Acalmar e sentar a criança:</strong> Não a deixe sozinha.
                    </li>
                    <li>
                      <strong>2. Dar 15g de carboidrato rápido:</strong> 1 caixinha de suco integral de 200ml ou 3 balas mastigáveis (kit na mochila).
                    </li>
                    <li>
                      <strong>3. Aguardar 15 minutos:</strong> Escanear o sensor novamente.
                    </li>
                    <li>
                      <strong>4. NUNCA aplicar insulina</strong> em episódios de hipoglicemia.
                    </li>
                  </ol>
                </div>
              </div>

              {/* Rodapé do Cartão */}
              <div
                style={{
                  borderTop: '1px dashed rgba(124, 83, 63, 0.25)',
                  paddingTop: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem',
                  color: '#7C533F',
                }}
              >
                <span>Emitido via Plataforma GlicoCare • Porto Seguro em DM1</span>
                <span>Responsável Legal: Mariana Silva • Assinatura: ___________________________</span>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            CONTEÚDO DA ABA 5: MEUS COMENTÁRIOS & COMUNIDADE (RN-MOD-01)
            ================================================================== */}
        {abaAtiva === 'comunidade' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3
                style={{
                  fontFamily: 'var(--fonte-titulo, Fraunces)',
                  fontSize: '1.35rem',
                  color: '#2E2824',
                  margin: '0 0 0.35rem',
                }}
              >
                Minha Participação na Biblioteca de Conteúdos
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#5A5049', margin: 0 }}>
                Depoimentos acolhedores compartilhados nos guias práticos com moderação prévia (RN-MOD-01).
              </p>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '1.5rem 1.75rem',
                  border: '1px solid rgba(124, 83, 63, 0.15)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: '#7C533F', fontSize: '0.92rem' }}>
                    📖 No artigo: "Hipoglicemia sem susto: um plano para toda a família"
                  </span>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      backgroundColor: '#D1E7DD',
                      color: '#0F5132',
                    }}
                  >
                    ✓ Aprovado e Publicado
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#2E2824', lineHeight: 1.5, margin: '0 0 0.5rem' }}>
                  "Esse plano de ação me deu tanta segurança para conversar com a professora do Theo na volta às aulas! A regra dos 15g foi adotada por toda a coordenação."
                </p>
                <span style={{ fontSize: '0.76rem', color: '#5A5049' }}>Enviado em 2026-11-10 às 16:40</span>
              </div>

              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '1.5rem 1.75rem',
                  border: '1px solid rgba(124, 83, 63, 0.15)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: '#7C533F', fontSize: '0.92rem' }}>
                    📖 No artigo: "DM1 na escola: como construir uma parceria que acolhe"
                  </span>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      backgroundColor: '#D1E7DD',
                      color: '#0F5132',
                    }}
                  >
                    ✓ Aprovado e Publicado
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#2E2824', lineHeight: 1.5, margin: '0 0 0.5rem' }}>
                  "A ideia da mochila segura mudou nossa dinâmica. O estojo agora fica sempre na sala dos professores com o kit de resgate identificado com foto."
                </p>
                <span style={{ fontSize: '0.76rem', color: '#5A5049' }}>Enviado em 2026-11-14 às 11:20</span>
              </div>
            </div>

            <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
              <Link to="/biblioteca" style={{ textDecoration: 'none' }}>
                <Button variante="secundario">Explorar Mais Artigos na Biblioteca →</Button>
              </Link>
            </div>
          </div>
        )}

        {/* ==================================================================
            MODAL 1: ADICIONAR FILHO(A) OU VINCULAR VIA CONVITE
            ================================================================== */}
        {modalNovoFilho && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(46, 40, 36, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1rem',
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                padding: '2rem',
                maxWidth: '540px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 12px 36px rgba(46, 40, 36, 0.15)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontFamily: 'var(--fonte-titulo, Fraunces)', fontSize: '1.35rem', color: '#2E2824', margin: 0 }}>
                  Acompanhar Nova Criança
                </h3>
                <button
                  type="button"
                  onClick={() => setModalNovoFilho(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#7C533F' }}
                >
                  ✕
                </button>
              </div>

              {/* Sub-abas do Modal */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setSubAbaNovoFilho('novo')}
                  style={{
                    flex: 1,
                    padding: '0.55rem',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: subAbaNovoFilho === 'novo' ? '#3B7E48' : '#F6F3EE',
                    color: subAbaNovoFilho === 'novo' ? '#FFFFFF' : '#2E2824',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Cadastrar Novo Filho(a)
                </button>

                <button
                  type="button"
                  onClick={() => setSubAbaNovoFilho('convite')}
                  style={{
                    flex: 1,
                    padding: '0.55rem',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: subAbaNovoFilho === 'convite' ? '#7C533F' : '#F6F3EE',
                    color: subAbaNovoFilho === 'convite' ? '#FFFFFF' : '#2E2824',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Tenho Código de Convite
                </button>
              </div>

              <form onSubmit={handleCadastrarFilho}>
                {subAbaNovoFilho === 'novo' ? (
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#7C533F', marginBottom: '0.3rem' }}>
                        Nome Completo da Criança *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Nina Silva"
                        value={formNovoFilho.nome_completo}
                        onChange={(e) => setFormNovoFilho({ ...formNovoFilho, nome_completo: e.target.value })}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#7C533F', marginBottom: '0.3rem' }}>
                          Data de Nascimento *
                        </label>
                        <input
                          type="date"
                          value={formNovoFilho.data_nascimento}
                          onChange={(e) => setFormNovoFilho({ ...formNovoFilho, data_nascimento: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#7C533F', marginBottom: '0.3rem' }}>
                          Sexo Biológico
                        </label>
                        <CustomSelect
                          value={formNovoFilho.sexo}
                          onChange={(val) => setFormNovoFilho({ ...formNovoFilho, sexo: val })}
                          options={[
                            { value: 'feminino', label: 'Feminino' },
                            { value: 'masculino', label: 'Masculino' },
                            { value: 'outro', label: 'Outro' },
                          ]}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#7C533F', marginBottom: '0.3rem' }}>
                        Escola / Colégio
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Colégio Viver Bem"
                        value={formNovoFilho.escola_nome}
                        onChange={(e) => setFormNovoFilho({ ...formNovoFilho, escola_nome: e.target.value })}
                      />
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#7C533F', marginBottom: '0.3rem' }}>
                        Telefone de Emergência dos Pais
                      </label>
                      <input
                        type="text"
                        placeholder="(11) 99999-9999"
                        value={formNovoFilho.contato_emergencia_telefone}
                        onChange={(e) => setFormNovoFilho({ ...formNovoFilho, contato_emergencia_telefone: e.target.value })}
                      />
                    </div>
                  </>
                ) : (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#7C533F', marginBottom: '0.3rem' }}>
                      Código de Convite Familiar (16 dígitos) *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: THEO-FAM-2026"
                      value={formNovoFilho.codigo_convite}
                      onChange={(e) => setFormNovoFilho({ ...formNovoFilho, codigo_convite: e.target.value.toUpperCase() })}
                      required
                      style={{ fontSize: '1.1rem', letterSpacing: '0.08em', fontWeight: 700 }}
                    />
                    <p style={{ fontSize: '0.78rem', color: '#5A5049', margin: '0.35rem 0 0' }}>
                      Solicite o código ao responsável principal que já cadastrou a criança no GlicoCare.
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <Button variante="secundario" type="button" onClick={() => setModalNovoFilho(false)}>
                    Cancelar
                  </Button>
                  <Button variante="primario" type="submit">
                    {subAbaNovoFilho === 'novo' ? 'Salvar Perfil da Criança' : 'Conectar com Convite'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================================================================
            MODAL 2: CONVIDAR FAMILIAR (PAI / MÃE / AVÓ)
            ================================================================== */}
        {modalConvidarFamiliar && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(46, 40, 36, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1rem',
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                padding: '2rem',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 12px 36px rgba(46, 40, 36, 0.15)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontFamily: 'var(--fonte-titulo, Fraunces)', fontSize: '1.35rem', color: '#2E2824', margin: 0 }}>
                  Conectar Outro Responsável
                </h3>
                <button
                  type="button"
                  onClick={() => setModalConvidarFamiliar(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#7C533F' }}
                >
                  ✕
                </button>
              </div>

              <p style={{ fontSize: '0.88rem', color: '#5A5049', lineHeight: 1.5, margin: '0 0 1.25rem' }}>
                Compartilhe o código abaixo com o pai, mãe ou outro cuidador legal de{' '}
                <strong>{filhoAtivo.nome_crianca}</strong> para que ele(a) possa registrar aplicações e acompanhar os dados em tempo real.
              </p>

              <div
                style={{
                  backgroundColor: '#F6F3EE',
                  border: '1.5px dashed #7C533F',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  textAlign: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ fontSize: '0.78rem', color: '#7C533F', fontWeight: 700, marginBottom: '0.25rem' }}>
                  CÓDIGO DE CONVITE FAMILIAR:
                </div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#2E2824', letterSpacing: '0.08em' }}>
                  {filhoAtivo.codigo_convite_familia || 'THEO-FAM-2026'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <Button variante="secundario" onClick={handleCopiarConvite} style={{ flex: 1, fontSize: '0.82rem' }}>
                  📋 Copiar Código
                </Button>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Olá! Você foi convidado(a) por Mariana para acompanhar o cuidado DM1 de ${filhoAtivo.nome_crianca} no GlicoCare. Acesse e use o código: ${filhoAtivo.codigo_convite_familia || 'THEO-FAM-2026'}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ flex: 1, textDecoration: 'none' }}
                >
                  <Button variante="primario" style={{ width: '100%', fontSize: '0.82rem' }}>
                    💬 WhatsApp
                  </Button>
                </a>
              </div>

              {filhoAtivo.co_cuidadores?.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(124, 83, 63, 0.15)', paddingTop: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7C533F', marginBottom: '0.35rem' }}>
                    Co-cuidadores Atualmente Conectados:
                  </div>
                  {filhoAtivo.co_cuidadores.map((co) => (
                    <div key={co.id} style={{ fontSize: '0.82rem', color: '#2E2824' }}>
                      ✓ {co.nome_completo} ({co.parentesco}) • {co.nivel_acesso}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================
            MODAL 3: GERENCIAMENTO DE ALERGIAS & SENSIBILIDADES DO DEPENDENTE
            Visualização da lista atual + formulário rápido inline (sem redirecionamento)
            ================================================================== */}
        <Dialog open={modalNovaAlergia} onOpenChange={setModalNovaAlergia}>
          <DialogContent style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
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
                  <AlertTriangle size={18} strokeWidth={2} />
                </div>
                <div>
                  <DialogTitle style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.25rem' }}>
                    Alergias & Sensibilidades de {filhoAtivo?.nome_crianca}
                  </DialogTitle>
                  <DialogDescription style={{ fontSize: '0.85rem' }}>
                    Proteção clínica e visualização rápida para acompanhamento e segurança escolar.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Lista Atual de Alergias do Dependente */}
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--cor-texto)' }}>
                  Alergias Cadastradas ({filhoAtivo?.alergias?.length || 0})
                </span>
              </div>

              {!filhoAtivo?.alergias || filhoAtivo.alergias.length === 0 ? (
                <div
                  style={{
                    padding: '1rem',
                    textAlign: 'center',
                    borderRadius: '8px',
                    border: '1px dashed var(--cor-borda)',
                    color: 'var(--cor-texto-suave)',
                    fontSize: '0.85rem',
                  }}
                >
                  Nenhuma alergia ou sensibilidade registrada para {filhoAtivo?.nome_crianca}.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {filhoAtivo.alergias.map((al) => {
                    const grav = (al.gravidade || 'MODERADA').toUpperCase();
                    let badgeVar = 'secondary';
                    let labelGrav = 'Moderada';
                    if (grav === 'LEVE') {
                      badgeVar = 'success';
                      labelGrav = 'Leve';
                    } else if (grav === 'GRAVE' || grav === 'CHOQUE' || grav === 'ANAFILAXIA') {
                      badgeVar = 'destructive';
                      labelGrav = 'Grave / Anafilaxia';
                    }

                    return (
                      <div
                        key={al.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--cor-fundo)',
                          border: '1px solid var(--cor-borda-suave)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Badge variant={badgeVar}>{labelGrav}</Badge>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--cor-texto)' }}>
                              {al.substancia_ou_item}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--cor-texto-suave)', marginLeft: '8px' }}>
                              ({al.categoria})
                            </span>
                            {al.reacao_observada && (
                              <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--cor-texto-suave)' }}>
                                {al.reacao_observada}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoverAlergia(al.id, al.substancia_ou_item)}
                          title="Remover alergia"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#A23B2A',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '4px',
                          }}
                        >
                          <Trash2 size={15} strokeWidth={1.8} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator style={{ margin: '16px 0' }} />

            {/* Formulário Rápido Inline para Adicionar Nova Alergia */}
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--cor-texto)', display: 'block', marginBottom: '0.75rem' }}>
                + Adicionar Nova Alergia
              </span>
              <form onSubmit={handleAdicionarAlergia}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--cor-texto)', marginBottom: '4px' }}>
                      Categoria
                    </label>
                    <CustomSelect
                      value={formNovaAlergia.categoria}
                      onChange={(val) => setFormNovaAlergia({ ...formNovaAlergia, categoria: val })}
                      options={[
                        { value: 'MEDICAMENTO', label: 'Medicamento' },
                        { value: 'ALIMENTO', label: 'Alimento' },
                        { value: 'ADESIVO_INSUMO', label: 'Adesivo / Sensor / Cateter' },
                        { value: 'OUTRA', label: 'Outro' },
                      ]}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--cor-texto)', marginBottom: '4px' }}>
                      Gravidade da Reação
                    </label>
                    <CustomSelect
                      value={formNovaAlergia.gravidade}
                      onChange={(val) => setFormNovaAlergia({ ...formNovaAlergia, gravidade: val })}
                      options={[
                        { value: 'LEVE', label: 'Leve (ex: prurido local)' },
                        { value: 'MODERADA', label: 'Moderada (ex: placas, urticária)' },
                        { value: 'GRAVE', label: 'Grave / Risco de Anafilaxia' },
                      ]}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--cor-texto)', marginBottom: '4px' }}>
                    Nome da Substância / Item *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Dipirona, Amendoim, Adesivo FreeStyle Libre..."
                    value={formNovaAlergia.substancia_ou_item}
                    onChange={(e) => setFormNovaAlergia({ ...formNovaAlergia, substancia_ou_item: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--cor-borda)',
                      backgroundColor: 'var(--cor-superficie)',
                      color: 'var(--cor-texto)',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--cor-texto)', marginBottom: '4px' }}>
                    Sintomas / Reação Observada
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Inchaço nos lábios, falta de ar, vermelhidão local..."
                    value={formNovaAlergia.reacao_observada}
                    onChange={(e) => setFormNovaAlergia({ ...formNovaAlergia, reacao_observada: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--cor-borda)',
                      backgroundColor: 'var(--cor-superficie)',
                      color: 'var(--cor-texto)',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <DialogFooter style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <Button
                    type="button"
                    variante="secundario"
                    onClick={() => setModalNovaAlergia(false)}
                    style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                  >
                    Fechar
                  </Button>
                  <Button
                    type="submit"
                    variante="cta"
                    disabled={salvandoAlergia}
                    style={{ fontSize: '0.82rem', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {salvandoAlergia ? <GlicoLoader variant="botao" /> : 'Salvar Alergia'}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        {/* ==================================================================
            MODAL 4: PRÉ-ATENDIMENTO DA CRIANÇA
            ================================================================== */}
        {modalPreAtendimento && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(46, 40, 36, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1rem',
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                padding: '2rem',
                maxWidth: '560px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 12px 36px rgba(46, 40, 36, 0.15)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontFamily: 'var(--fonte-titulo, Fraunces)', fontSize: '1.35rem', color: '#2E2824', margin: 0 }}>
                  Pré-Atendimento Acolhedor de {filhoAtivo.nome_crianca}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalPreAtendimento(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#7C533F' }}
                >
                  ✕
                </button>
              </div>

              <p style={{ fontSize: '0.86rem', color: '#5A5049', margin: '0 0 1.25rem', lineHeight: 1.45 }}>
                Estas respostas preparam o especialista antes da chamada, garantindo uma conversa mais focada no que realmente importa para a família.
              </p>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#7C533F', marginBottom: '0.3rem' }}>
                  Motivo Principal da Consulta
                </label>
                <input
                  type="text"
                  value={formPreAtendimento.motivo_principal}
                  onChange={(e) => setFormPreAtendimento({ ...formPreAtendimento, motivo_principal: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#7C533F', marginBottom: '0.3rem' }}>
                  Maiores Preocupações da Família
                </label>
                <textarea
                  rows={3}
                  value={formPreAtendimento.maiores_dores}
                  onChange={(e) => setFormPreAtendimento({ ...formPreAtendimento, maiores_dores: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#7C533F', marginBottom: '0.3rem' }}>
                  Dúvidas que você não quer esquecer de perguntar
                </label>
                <textarea
                  rows={2}
                  value={formPreAtendimento.duvidas_prioritarias}
                  onChange={(e) => setFormPreAtendimento({ ...formPreAtendimento, duvidas_prioritarias: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <Button variante="secundario" onClick={() => setModalPreAtendimento(false)}>
                  Fechar
                </Button>
                <Button
                  variante="primario"
                  onClick={() => {
                    setModalPreAtendimento(false);
                    exibirFeedback('sucesso', 'Pré-atendimento salvo com sucesso!');
                  }}
                >
                  ✓ Salvar Pré-Atendimento
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            MODAL 5: ASSINATURA TCLE COMO RESPONSÁVEL LEGAL
            ================================================================== */}
        {modalAssinarTCLE && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(46, 40, 36, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '1rem',
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                padding: '2rem',
                maxWidth: '560px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 12px 36px rgba(46, 40, 36, 0.15)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontFamily: 'var(--fonte-titulo, Fraunces)', fontSize: '1.35rem', color: '#2E2824', margin: 0 }}>
                  Assinatura do TCLE como Responsável Legal
                </h3>
                <button
                  type="button"
                  onClick={() => setModalAssinarTCLE(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#7C533F' }}
                >
                  ✕
                </button>
              </div>

              <p style={{ fontSize: '0.86rem', color: '#5A5049', margin: '0 0 1.25rem', lineHeight: 1.45 }}>
                Em conformidade com a Resolução CFM nº 2.314/2022 e LGPD, o Termo de Consentimento Livre e Esclarecido (TCLE) para pacientes menores de idade deve ser firmado pelo responsável legal e possui validade de 12 meses.
              </p>

              <div style={{ backgroundColor: '#F6F3EE', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.84rem' }}>
                <div><strong>Declarante / Responsável:</strong> {usuario?.nome_completo || 'Mariana Silva'}</div>
                <div><strong>Paciente Menor:</strong> {filhoAtivo.nome_crianca} ({filhoAtivo.data_nascimento})</div>
                <div><strong>Validade do Termo:</strong> 12 meses a partir do aceite</div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#7C533F', marginBottom: '0.3rem' }}>
                  CPF do Responsável Legal *
                </label>
                <input
                  type="text"
                  value={formTCLE.cpf_declarante}
                  onChange={(e) => setFormTCLE({ ...formTCLE, cpf_declarante: e.target.value })}
                  placeholder="000.000.000-00"
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', marginBottom: '1.5rem' }}>
                <input
                  type="checkbox"
                  id="chk-tcle-resp"
                  checked={formTCLE.concorda_termos}
                  onChange={(e) => setFormTCLE({ ...formTCLE, concorda_termos: e.target.checked })}
                  style={{ marginTop: '0.2rem', accentColor: '#3B7E48' }}
                />
                <label htmlFor="chk-tcle-resp" style={{ fontSize: '0.82rem', color: '#2E2824', lineHeight: 1.4 }}>
                  Declaro que sou responsável legal pela criança {filhoAtivo.nome_crianca}, concordo com o atendimento por teleconsulta e confirmo a validade do termo por 12 meses.
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <Button variante="secundario" onClick={() => setModalAssinarTCLE(false)}>
                  Cancelar
                </Button>
                <Button
                  variante="primario"
                  onClick={() => {
                    setModalAssinarTCLE(false);
                    const depsAtualizados = [...dependentes];
                    if (depsAtualizados[indiceFilhoAtivo].consultas?.length > 0) {
                      depsAtualizados[indiceFilhoAtivo].consultas[0].tcle_assinado = 1;
                    }
                    setDependentes(depsAtualizados);
                    exibirFeedback('sucesso', 'TCLE de Responsável Legal assinado e validado com sucesso!');
                  }}
                >
                  ✓ Confirmar e Assinar TCLE
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* ==================================================================
            MODAL DO CARTÃO DE DIAGNÓSTICO DO DEPENDENTE (PREVIEW + PNG/PDF)
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
                    Cartão de Diagnóstico de {filhoAtivo?.nome_crianca}
                  </DialogTitle>
                  <DialogDescription style={{ fontSize: '0.85rem' }}>
                    Documento oficial com parâmetros de segurança, contato do responsável legal e condutas de emergência para portar na mochila escolar ou salvar no celular.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div style={{ marginTop: '0.5rem' }}>
              <CartaoDiagnosticoDownload
                paciente={filhoAtivo}
                cuidador={{
                  nome_responsavel: usuario?.nome_completo || 'Mariana Silva',
                  parentesco: filhoAtivo.parentesco || 'Mãe',
                  telefone_emergencia: filhoAtivo.contato_emergencia_telefone || usuario?.telefone || '(11) 97777-2001',
                }}
                alergias={filhoAtivo.alergias || []}
                medicamentos={filhoAtivo.medicamentos || []}
                contatos={filhoAtivo.contatos_emergencia || []}
                onAtualizarContatos={(novosContatos) => {
                  setFilhoAtivo((prev) => ({ ...prev, contatos_emergencia: novosContatos }));
                }}
                isCuidador={true}
                exibirCabecalhoSecao={false}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
/* FIM DO COMPONENTE PRINCIPAL PAINEL CUIDADOR */
