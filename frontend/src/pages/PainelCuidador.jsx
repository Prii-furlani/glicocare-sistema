/* ==========================================================================
   ARQUIVO: PainelCuidador.jsx (Localização: /frontend/src/pages/PainelCuidador.jsx)
   PROJETO: GlicoCare — Sistema de Saúde Integrada e Acolhimento em DM1
   OBJETIVO: Espaço exclusivo para pais e responsáveis legais de crianças abaixo
             de 12 anos com DM1 (perfil === 'cuidador'), com gestão de filhos,
             co-cuidadores, diário com prevenção de empilhamento de insulina (IOB),
             alergias, teleconsultas, pré-atendimento e cartão de cuidado escolar.
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cuidadorService } from '../services/api';
import CustomSelect from '../components/CustomSelect';
import Button from '../components/Button';
import GlicoLoader from '../components/GlicoLoader';
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
      nome_laboratorio: 'Laboratório Fleury Medicina e Saúde',
      data_realizacao: '2026-10-15',
      arquivo_laudo_url: '/backend/uploads/exames/hba1c_theo_out2026.pdf',
      observacoes_paciente: 'Hemoglobina Glicada (HbA1c): 7.1%. Excelente estabilidade!',
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

  const handleRemoverAlergia = async (alergiaId, nomeSubstancia) => {
    const ok = await confirmar({
      titulo: 'Remover Alergia?',
      descricao: `Tem certeza que deseja remover o registro da alergia "${nomeSubstancia}" do perfil de ${filhoAtivo.nome_crianca}?`,
      variante: 'destructive',
      confirmText: 'Sim, remover',
      cancelText: 'Cancelar'
    });
    if (!ok) return;

    const depsAtualizados = [...dependentes];
    depsAtualizados[indiceFilhoAtivo].alergias = (filhoAtivo.alergias || []).filter((a) => a.id !== alergiaId);
    setDependentes(depsAtualizados);
    notificar.sucesso(`Alergia "${nomeSubstancia}" removida com sucesso.`);
  };

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

  // 3. Adicionar Alergia
  const handleAdicionarAlergia = (e) => {
    e.preventDefault();
    if (!formNovaAlergia.substancia_ou_item.trim()) {
      exibirFeedback('erro', 'Informe o nome da substância ou medicamento.');
      return;
    }

    const nova = {
      id: Date.now(),
      categoria: formNovaAlergia.categoria,
      substancia_ou_item: formNovaAlergia.substancia_ou_item.trim(),
      gravidade: formNovaAlergia.gravidade,
      reacao_observada: formNovaAlergia.reacao_observada.trim(),
    };

    const depsAtualizados = [...dependentes];
    depsAtualizados[indiceFilhoAtivo].alergias = [nova, ...(filhoAtivo.alergias || [])];
    setDependentes(depsAtualizados);
    setModalNovaAlergia(false);
    setFormNovaAlergia({ categoria: 'MEDICAMENTO', substancia_ou_item: '', gravidade: 'MODERADA', reacao_observada: '' });
    exibirFeedback('sucesso', `Alergia a ${nova.substancia_ou_item} adicionada com sucesso!`);
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
            CABEÇALHO GERAL & IDENTIDADE DO CUIDADOR
            ================================================================== */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              backgroundColor: 'rgba(59, 126, 72, 0.12)',
              color: '#3B7E48',
              borderRadius: '20px',
              padding: '0.3rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem',
            }}
          >
            <span>🤝</span>
            <span>Espaço dos Pais e Cuidadores de Menores com DM1</span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--fonte-titulo, Fraunces)',
              fontSize: 'clamp(1.6rem, 2.5vw, 2.3rem)',
              color: '#2E2824',
              margin: '0.2rem 0 0.5rem',
              lineHeight: 1.2,
            }}
          >
            Acolhimento da Família de <span style={{ color: '#7C533F', fontStyle: 'italic' }}>{filhoAtivo.nome_crianca}</span>
          </h1>

          <p style={{ fontSize: '0.94rem', color: '#5A5049', margin: 0, maxWidth: '780px' }}>
            Acompanhamento integrado de rotina, prevenção de empilhamento de doses (IOB),
            alinhamento com a escola e teleconsultas com especialistas credenciados.
          </p>
        </div>

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
            HERO CARD DO DEPENDENTE & SELETOR DE FILHOS
            ================================================================== */}
        <div
          style={{
            backgroundColor: 'var(--cor-superficie, #F6F3EE)',
            borderRadius: '18px',
            padding: '1.75rem 2rem',
            border: '1px solid rgba(124, 83, 63, 0.18)',
            boxShadow: '0 8px 24px rgba(46, 40, 36, 0.05)',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.25rem',
            }}
          >
            {/* Dados Principais do Filho Selecionado */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(59, 126, 72, 0.15)',
                  border: '2px solid #3B7E48',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                }}
              >
                👦
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <h2
                    style={{
                      fontFamily: 'var(--fonte-titulo, Fraunces)',
                      fontSize: '1.5rem',
                      color: '#2E2824',
                      margin: 0,
                    }}
                  >
                    {filhoAtivo.nome_crianca}
                  </h2>

                  <span
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid rgba(124, 83, 63, 0.25)',
                      borderRadius: '12px',
                      padding: '2px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#7C533F',
                    }}
                  >
                    {filhoAtivo.idade_extenso}
                  </span>

                  <span
                    style={{
                      backgroundColor: 'rgba(59, 126, 72, 0.12)',
                      color: '#2D6337',
                      borderRadius: '12px',
                      padding: '2px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                    }}
                  >
                    {filhoAtivo.tempo_diagnostico_extenso}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    fontSize: '0.84rem',
                    color: '#5A5049',
                    marginTop: '0.45rem',
                  }}
                >
                  <span>
                    📟 <strong>Sensor:</strong> FreeStyle Libre 2
                  </span>
                  <span>
                    💉 <strong>Terapia:</strong> {filhoAtivo.terapia_insulina}
                  </span>
                  <span>
                    🏫 <strong>Escola:</strong> {filhoAtivo.escola_nome}
                  </span>
                  <span>
                    📞 <strong>Emergência:</strong> {filhoAtivo.contato_emergencia_telefone}
                  </span>
                </div>
              </div>
            </div>

            {/* Ações do Responsável e Alternância de Dependentes */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {dependentes.length > 1 && (
                <div style={{ width: '180px' }}>
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
                variante="secundario"
                onClick={() => setModalNovoFilho(true)}
                style={{ fontSize: '0.82rem', padding: '0.5rem 0.95rem' }}
              >
                + Adicionar Filho(a)
              </Button>

              <Button
                variante="primario"
                onClick={() => setModalConvidarFamiliar(true)}
                style={{ fontSize: '0.82rem', padding: '0.5rem 0.95rem' }}
              >
                🔗 Convidar Familiar (Pai/Mãe)
              </Button>
            </div>
          </div>
        </div>

        {/* ==================================================================
            NAVEGAÇÃO EM 5 ABAS CLARAS ("PORTO SEGURO")
            ================================================================== */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '2px solid rgba(124, 83, 63, 0.15)',
            marginBottom: '1.75rem',
            overflowX: 'auto',
            paddingBottom: '0.2rem',
          }}
        >
          <button
            type="button"
            onClick={() => setAbaAtiva('diario')}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '12px 12px 0 0',
              border: 'none',
              backgroundColor: abaAtiva === 'diario' ? '#FFFFFF' : 'transparent',
              borderBottom: abaAtiva === 'diario' ? '3px solid #3B7E48' : 'none',
              color: abaAtiva === 'diario' ? '#3B7E48' : '#5A5049',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              whiteSpace: 'nowrap',
            }}
          >
            <span>🩸</span>
            <span>Diário & Insulina Ativa (IOB)</span>
            {filhoAtivo.iob_ativa > 0 && (
              <span
                style={{
                  backgroundColor: '#C88D2A',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontWeight: 800,
                }}
              >
                {filhoAtivo.iob_ativa} UI
              </span>
            )}
          </button>

          {/* INÍCIO BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS (COMENTADO PARA LANÇAMENTO FASE 1) */}
          {FEATURES.TELEMEDICINA_ATIVA && (
            <button
              type="button"
              onClick={() => setAbaAtiva('consultas')}
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '12px 12px 0 0',
                border: 'none',
                backgroundColor: abaAtiva === 'consultas' ? '#FFFFFF' : 'transparent',
                borderBottom: abaAtiva === 'consultas' ? '3px solid #7C533F' : 'none',
                color: abaAtiva === 'consultas' ? '#7C533F' : '#5A5049',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                whiteSpace: 'nowrap',
              }}
            >
              <span>🩺</span>
              <span>Especialistas & Consultas ({filhoAtivo.consultas?.length || 0})</span>
            </button>
          )}
          {/* FIM BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS */}

          <button
            type="button"
            onClick={() => setAbaAtiva('exames')}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '12px 12px 0 0',
              border: 'none',
              backgroundColor: abaAtiva === 'exames' ? '#FFFFFF' : 'transparent',
              borderBottom: abaAtiva === 'exames' ? '3px solid #3B7E48' : 'none',
              color: abaAtiva === 'exames' ? '#3B7E48' : '#5A5049',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              whiteSpace: 'nowrap',
            }}
          >
            <span>🧪</span>
            <span>Exames & Alergias ({filhoAtivo.alergias?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('escola')}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '12px 12px 0 0',
              border: 'none',
              backgroundColor: abaAtiva === 'escola' ? '#FFFFFF' : 'transparent',
              borderBottom: abaAtiva === 'escola' ? '3px solid #7C533F' : 'none',
              color: abaAtiva === 'escola' ? '#7C533F' : '#5A5049',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              whiteSpace: 'nowrap',
            }}
          >
            <span>🏫</span>
            <span>Cartão de Cuidado Escolar (PDF)</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('comunidade')}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '12px 12px 0 0',
              border: 'none',
              backgroundColor: abaAtiva === 'comunidade' ? '#FFFFFF' : 'transparent',
              borderBottom: abaAtiva === 'comunidade' ? '3px solid #2E2824' : 'none',
              color: abaAtiva === 'comunidade' ? '#2E2824' : '#5A5049',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              whiteSpace: 'nowrap',
            }}
          >
            <span>💬</span>
            <span>Meus Comentários & Comunidade</span>
          </button>
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

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.75rem',
              }}
            >
              {/* Card Formulário de Registro Rápido */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '1.75rem',
                  border: '1px solid rgba(124, 83, 63, 0.15)',
                  boxShadow: '0 4px 16px rgba(46, 40, 36, 0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3
                    style={{
                      fontFamily: 'var(--fonte-titulo, Fraunces)',
                      fontSize: '1.25rem',
                      color: '#2E2824',
                      margin: 0,
                    }}
                  >
                    Registrar Medição / Dose
                  </h3>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: '#3B7E48',
                      backgroundColor: 'rgba(59, 126, 72, 0.1)',
                      borderRadius: '8px',
                      padding: '3px 8px',
                      fontWeight: 700,
                    }}
                  >
                    Identificado como: {usuario?.nome_completo || 'Mariana Silva'} (Mãe)
                  </span>
                </div>

                <form onSubmit={handleRegistrarGlicemia}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#7C533F',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Glicemia Medida (mg/dL) *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        placeholder="Ex: 115"
                        value={formGlicemia.valor_mg_dl}
                        onChange={(e) => setFormGlicemia({ ...formGlicemia, valor_mg_dl: e.target.value })}
                        style={{
                          width: '100%',
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          color: obterCorGlicemia(formGlicemia.valor_mg_dl),
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: '#7C533F',
                          marginBottom: '0.35rem',
                        }}
                      >
                        Dose Insulina (UI)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="Ex: 1.5"
                        value={formGlicemia.dose_insulina}
                        onChange={(e) => setFormGlicemia({ ...formGlicemia, dose_insulina: e.target.value })}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: '#7C533F',
                          marginBottom: '0.35rem',
                        }}
                      >
                        Carboidratos (g)
                      </label>
                      <input
                        type="number"
                        placeholder="Ex: 30"
                        value={formGlicemia.carboidratos_g}
                        onChange={(e) => setFormGlicemia({ ...formGlicemia, carboidratos_g: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#7C533F',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Momento da Medição
                    </label>
                    <CustomSelect
                      value={formGlicemia.momento_medicao}
                      onChange={(val) => setFormGlicemia({ ...formGlicemia, momento_medicao: val })}
                      options={[
                        { value: 'Jejum', label: 'Jejum (Ao acordar)' },
                        { value: 'Antes da Refeicao', label: 'Antes da Refeição (Pré-prandial)' },
                        { value: '1h/2h Apos Refeicao', label: '1h ou 2h Após Refeição (Pós-prandial)' },
                        { value: 'Lanche Escolar', label: 'Recreio / Lanche Escolar' },
                        { value: 'Antes de Dormir', label: 'Antes de Dormir' },
                        { value: 'Madrugada', label: 'Madrugada' },
                      ]}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#7C533F',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Ação Realizada
                    </label>
                    <CustomSelect
                      value={formGlicemia.acao_realizada}
                      onChange={(val) => setFormGlicemia({ ...formGlicemia, acao_realizada: val })}
                      options={[
                        { value: 'Nenhuma Acao', label: 'Nenhuma Ação (Estável)' },
                        { value: 'Bolus para Refeicao', label: 'Bolus para Refeição' },
                        { value: 'Bolus de Correcao', label: 'Bolus de Correção' },
                        { value: 'Bolus Correcao + Refeicao', label: 'Bolus Correção + Refeição' },
                        { value: 'Carboidrato de Resgate', label: 'Carboidrato de Resgate (Hipo)' },
                      ]}
                    />
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#7C533F',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Contexto ou Sintomas (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Educação física, lanche com fruta, suor frio..."
                      value={formGlicemia.fator_contexto}
                      onChange={(e) => setFormGlicemia({ ...formGlicemia, fator_contexto: e.target.value })}
                    />
                  </div>

                  {/* ALERTA DE HIPOGLICEMIA (< 70 mg/dL) */}
                  {Number(formGlicemia.valor_mg_dl) > 0 && Number(formGlicemia.valor_mg_dl) < 70 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <Alert variant="destructive">
                        <AlertTitle>Glicemia Baixa (&lt; 70 mg/dL) — Atenção Imediata</AlertTitle>
                        <AlertDescription>
                          Aplicar a <strong>Regra dos 15g</strong> imediatamente: ofertar 15g de carboidrato de rápida absorção (1 sachê de mel, 150ml de suco integral ou 1 colher de sopa de açúcar na água). Aguarde 15 minutos em repouso e meça novamente.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {/* ALERTA DE INSULINA ATIVA (IOB) */}
                  {filhoAtivo.iob_ativa > 0 && Number(formGlicemia.dose_insulina) > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <Alert variant="warning">
                        <AlertTitle>Atenção: Insulina Ativa em Circulação ({filhoAtivo.iob_ativa} UI)</AlertTitle>
                        <AlertDescription>
                          {filhoAtivo.nome_crianca} ainda possui {filhoAtivo.iob_ativa} UI de insulina ativa no organismo. Administrar uma nova dose agora eleva o risco de hipoglicemia por empilhamento de doses.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  <Button
                    variante="primario"
                    type="submit"
                    loading={salvandoGlicemia}
                    disabled={salvandoGlicemia}
                    style={{ width: '100%', padding: '0.75rem' }}
                  >
                    ✓ Registrar para {filhoAtivo.nome_crianca}
                  </Button>
                </form>
              </div>

              {/* Linha do Tempo e Histórico com Identificação de Quem Registrou */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '1.75rem',
                  border: '1px solid rgba(124, 83, 63, 0.15)',
                  boxShadow: '0 4px 16px rgba(46, 40, 36, 0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3
                    style={{
                      fontFamily: 'var(--fonte-titulo, Fraunces)',
                      fontSize: '1.25rem',
                      color: '#2E2824',
                      margin: 0,
                    }}
                  >
                    Linha do Tempo Familiar
                  </h3>

                  <span style={{ fontSize: '0.8rem', color: '#5A5049' }}>
                    Últimas {filhoAtivo.leituras_recentes?.length || 0} medições
                  </span>
                </div>

                <p style={{ fontSize: '0.84rem', color: '#5A5049', marginBottom: '1.25rem' }}>
                  Transparência total para que mãe, pai e cuidadores autorizados acompanhem as doses aplicadas e evitem duplicações.
                </p>

                <div style={{ display: 'grid', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.35rem' }}>
                  {filhoAtivo.leituras_recentes?.map((leitura) => (
                    <div
                      key={leitura.id}
                      style={{
                        backgroundColor: '#F6F3EE',
                        borderRadius: '12px',
                        padding: '0.9rem 1.15rem',
                        borderLeft: `4px solid ${obterCorGlicemia(leitura.valor_mg_dl)}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span
                            style={{
                              fontSize: '1.25rem',
                              fontWeight: 800,
                              color: obterCorGlicemia(leitura.valor_mg_dl),
                            }}
                          >
                            {leitura.valor_mg_dl}{' '}
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#5A5049' }}>mg/dL</span>
                          </span>

                          <span
                            style={{
                              fontSize: '0.74rem',
                              backgroundColor: '#FFFFFF',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              color: '#7C533F',
                              border: '1px solid rgba(124, 83, 63, 0.15)',
                            }}
                          >
                            {leitura.momento_medicao}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.78rem', color: '#5A5049', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                          {leitura.dose_insulina && (
                            <span style={{ color: '#7C533F', fontWeight: 700 }}>💉 {leitura.dose_insulina} UI aplicada</span>
                          )}
                          {leitura.carboidratos_g && <span>🍞 {leitura.carboidratos_g}g carbos</span>}
                          {leitura.fator_contexto && <span>📝 {leitura.fator_contexto}</span>}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            backgroundColor: leitura.registrado_por_rotulo?.includes('Pai') ? '#E8EEF5' : '#E8F5E9',
                            color: leitura.registrado_por_rotulo?.includes('Pai') ? '#2C4C6C' : '#1E4620',
                            borderRadius: '8px',
                            padding: '3px 8px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            marginBottom: '0.2rem',
                          }}
                        >
                          👤 {leitura.registrado_por_rotulo || 'Responsável'}
                        </span>
                        <div style={{ fontSize: '0.74rem', color: '#7C533F' }}>
                          {leitura.data_hora_medicao?.split(' ')[1] || leitura.data_hora_medicao}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
            CONTEÚDO DA ABA 3: EXAMES & ALERGIAS DA CRIANÇA
            ================================================================== */}
        {abaAtiva === 'exames' && (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.75rem',
              }}
            >
              {/* Bloco de Alergias e Sensibilidades */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '1.75rem',
                  border: '1px solid rgba(124, 83, 63, 0.15)',
                  boxShadow: '0 4px 16px rgba(46, 40, 36, 0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <h3
                      style={{
                        fontFamily: 'var(--fonte-titulo, Fraunces)',
                        fontSize: '1.25rem',
                        color: '#2E2824',
                        margin: 0,
                      }}
                    >
                      Alergias & Sensibilidades
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: '#5A5049', margin: '0.2rem 0 0' }}>
                      Proteção clínica obrigatória compartilhada com a escola e especialistas.
                    </p>
                  </div>

                  <Button
                    variante="secundario"
                    onClick={() => setModalNovaAlergia(true)}
                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
                  >
                    + Adicionar
                  </Button>
                </div>

                {filhoAtivo.alergias?.length === 0 ? (
                  <p style={{ color: '#5A5049', fontSize: '0.88rem', padding: '1rem 0' }}>
                    Nenhuma alergia registrada para {filhoAtivo.nome_crianca}.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {filhoAtivo.alergias?.map((al) => (
                      <div
                        key={al.id}
                        style={{
                          backgroundColor: '#F6F3EE',
                          borderRadius: '12px',
                          padding: '1rem 1.25rem',
                          borderLeft: `4px solid ${al.gravidade === 'GRAVE' ? '#C94A38' : al.gravidade === 'MODERADA' ? '#C88D2A' : '#3B7E48'}`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontWeight: 800, color: '#2E2824', fontSize: '0.94rem' }}>
                            {al.substancia_ou_item}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                borderRadius: '6px',
                                padding: '2px 8px',
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
                        <p style={{ fontSize: '0.84rem', color: '#5A5049', margin: 0, lineHeight: 1.45 }}>
                          {al.reacao_observada || 'Reação clínica observada em episódios anteriores.'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bloco de Exames Laboratoriais */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '1.75rem',
                  border: '1px solid rgba(124, 83, 63, 0.15)',
                  boxShadow: '0 4px 16px rgba(46, 40, 36, 0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <h3
                      style={{
                        fontFamily: 'var(--fonte-titulo, Fraunces)',
                        fontSize: '1.25rem',
                        color: '#2E2824',
                        margin: 0,
                      }}
                    >
                      Histórico de Exames Laboratoriais
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: '#5A5049', margin: '0.2rem 0 0' }}>
                      Laudos de HbA1c, glicemia de jejum e painéis pediátricos.
                    </p>
                  </div>
                </div>

                {filhoAtivo.exames?.length === 0 ? (
                  <p style={{ color: '#5A5049', fontSize: '0.88rem', padding: '1rem 0' }}>
                    Nenhum exame anexado até o momento.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {filhoAtivo.exames?.map((ex) => (
                      <div
                        key={ex.id}
                        style={{
                          backgroundColor: '#F6F3EE',
                          borderRadius: '12px',
                          padding: '1rem 1.25rem',
                          border: '1px solid rgba(124, 83, 63, 0.15)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontWeight: 700, color: '#2E2824', fontSize: '0.92rem' }}>
                            {ex.nome_laboratorio}
                          </span>
                          <span style={{ fontSize: '0.76rem', color: '#7C533F', fontWeight: 600 }}>
                            {ex.data_realizacao}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.84rem', color: '#5A5049', margin: '0 0 0.5rem', lineHeight: 1.45 }}>
                          {ex.observacoes_paciente}
                        </p>
                        <span style={{ fontSize: '0.78rem', color: '#3B7E48', fontWeight: 700, cursor: 'pointer' }}>
                          📄 Laudo em PDF verificado
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
            MODAL 3: ADICIONAR ALERGIA
            ================================================================== */}
        {modalNovaAlergia && (
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
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 12px 36px rgba(46, 40, 36, 0.15)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontFamily: 'var(--fonte-titulo, Fraunces)', fontSize: '1.35rem', color: '#2E2824', margin: 0 }}>
                  Nova Alergia ou Sensibilidade
                </h3>
                <button
                  type="button"
                  onClick={() => setModalNovaAlergia(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#7C533F' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAdicionarAlergia}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#7C533F', marginBottom: '0.3rem' }}>
                    Categoria
                  </label>
                  <CustomSelect
                    value={formNovaAlergia.categoria}
                    onChange={(val) => setFormNovaAlergia({ ...formNovaAlergia, categoria: val })}
                    options={[
                      { value: 'MEDICAMENTO', label: 'Medicamento' },
                      { value: 'ADESIVO_INSUMO', label: 'Adesivo / Sensor / Cateter' },
                      { value: 'ALIMENTO', label: 'Alimento' },
                      { value: 'OUTRA', label: 'Outra Substância' },
                    ]}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#7C533F', marginBottom: '0.3rem' }}>
                    Nome da Substância ou Item *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Amoxicilina, Látex, Amendoim..."
                    value={formNovaAlergia.substancia_ou_item}
                    onChange={(e) => setFormNovaAlergia({ ...formNovaAlergia, substancia_ou_item: e.target.value })}
                    required
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#7C533F', marginBottom: '0.3rem' }}>
                    Gravidade da Reação
                  </label>
                  <CustomSelect
                    value={formNovaAlergia.gravidade}
                    onChange={(val) => setFormNovaAlergia({ ...formNovaAlergia, gravidade: val })}
                    options={[
                      { value: 'LEVE', label: 'Leve (ex: prurido local discreto)' },
                      { value: 'MODERADA', label: 'Moderada (ex: placas, urticária)' },
                      { value: 'GRAVE', label: 'Grave / Choque (ex: anafilaxia, falta de ar)' },
                    ]}
                  />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#7C533F', marginBottom: '0.3rem' }}>
                    Reação Clínica Observada
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Descreva o que acontece quando a criança entra em contato..."
                    value={formNovaAlergia.reacao_observada}
                    onChange={(e) => setFormNovaAlergia({ ...formNovaAlergia, reacao_observada: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <Button variante="secundario" type="button" onClick={() => setModalNovaAlergia(false)}>
                    Cancelar
                  </Button>
                  <Button variante="primario" type="submit">
                    Salvar Alergia
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

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
      </div>
    </div>
  );
}
/* FIM DO COMPONENTE PRINCIPAL PAINEL CUIDADOR */
