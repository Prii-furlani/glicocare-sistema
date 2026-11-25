/* ==========================================================================
   ARQUIVO: CartaoDiagnosticoDownload.jsx
   LOCALIZAÇÃO: /frontend/src/components/CartaoDiagnosticoDownload.jsx
   PROJETO: GlicoCare — Apoio em Diabetes & Cuidado Integrado
   OBJETIVO: Card oficial de identificação médica, diagnóstico clínico e cuidado
             para pessoas com DM1 e cuidadores. Suporta preview ao vivo em tela,
             download em imagem de alta resolução (PNG via html2canvas) e
             impressão/salvamento em PDF em conformidade com o Design System
             "Porto Seguro" (#EAE4D9, #F6F3EE, #2E2824, #7C533F, #3B7E48).
   ========================================================================== */

/* INÍCIO DO COMPONENTE CARTÃO DE DIAGNÓSTICO PARA DOWNLOAD */

import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { useNotify } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { calcularTempoDiagnostico } from '../utils/dateUtils';
import Button from './Button';
import CustomSelect from './CustomSelect';
import { Tabs, TabsList, TabsTrigger } from './ui/Tabs';
import { contatosEmergenciaService } from '../services/api';
import logoGlicoCare from '../assets/logo-glicocare.jpg';

/* FUNÇÃO AUXILIAR: MÁSCARA AUTOMÁTICA DE TELEFONE (XX) XXXXX-XXXX */
const formatarTelefone = (valor) => {
  if (!valor) return '';
  const apenasNumeros = valor.replace(/\D/g, '').slice(0, 11);
  if (apenasNumeros.length <= 2) return `(${apenasNumeros}`;
  if (apenasNumeros.length <= 6) return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`;
  if (apenasNumeros.length <= 10) {
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 6)}-${apenasNumeros.slice(6)}`;
  }
  return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7, 11)}`;
};

export default function CartaoDiagnosticoDownload({
  paciente = {},
  cuidador = null,
  alergias = [],
  medicamentos = [],
  contatos = [],
  onAtualizarContatos = null,
  isCuidador = false,
  tituloSecao = 'Cartão de Diagnóstico & Identificação Médica',
  descricaoSecao = 'Mantenha este documento salvo no seu celular ou impresso na carteira para emergências e identificação clínica rápida.',
  exibirCabecalhoSecao = true,
}) {
  const fichaRef = useRef(null);
  const crachaRef = useRef(null);
  const [formatoAtivo, setFormatoAtivo] = useState('ficha'); // 'ficha' | 'cracha'
  const notificar = useNotify();
  const { confirmar } = useConfirm();
  const [gerandoImagem, setGerandoImagem] = useState(false);

  // Normalização de dados do paciente
  const nomePaciente =
    paciente?.nome_completo ||
    paciente?.nome_crianca ||
    paciente?.nome ||
    'Pessoa com Diabetes';

  const dataNascimento = paciente?.data_nascimento || '';
  let idadeFormatada = paciente?.idade_extenso || '';
  if (!idadeFormatada && dataNascimento) {
    const anoNasc = new Date(dataNascimento).getFullYear();
    const anoAtual = new Date().getFullYear();
    if (!isNaN(anoNasc)) {
      idadeFormatada = `${anoAtual - anoNasc} anos`;
    }
  }

  const tipoDiabetes = paciente?.tipo_diabetes || 'Diabetes Tipo 1 (DM1)';
  const dataDiagnostico = paciente?.data_diagnostico || '';
  const tempoJornada = dataDiagnostico ? calcularTempoDiagnostico(dataDiagnostico) : null;
  const tempoDiagnosticoExtenso =
    tempoJornada?.textoFormatado || paciente?.tempo_diagnostico_extenso || 'Em acompanhamento';

  const terapiaInsulina = paciente?.terapia_insulina || 'Múltiplas Doses Diárias (MDI / Caneta)';
  const monitoramento = paciente?.monitoramento || 'Sensor Contínuo (FreeStyle Libre) & Glicosímetro';
  const fsi = paciente?.fsi ? `1 UI para ${paciente.fsi} mg/dL` : '1 UI : 35 mg/dL';
  const metaGlicemica = paciente?.glicemia_alvo
    ? `${paciente.glicemia_alvo} mg/dL (Faixa segura: 70–140 mg/dL)`
    : '100 mg/dL (Faixa segura: 70–140 mg/dL)';

  // Dados de fallback do cuidador / responsável
  const nomeResponsavelPadrao =
    cuidador?.nome_responsavel ||
    cuidador?.nome ||
    paciente?.nome_responsavel ||
    'Mariana Silva';
  const parentescoPadrao =
    cuidador?.parentesco ||
    paciente?.parentesco ||
    'Responsável Legal (Mãe)';
  const telefoneEmergenciaPadrao =
    cuidador?.telefone_emergencia ||
    cuidador?.contato_emergencia_telefone ||
    paciente?.contato_emergencia_telefone ||
    '(11) 97777-2001';

  /* ==========================================================================
     GERENCIAMENTO DE MÚLTIPLOS CONTATOS DE EMERGÊNCIA (MODELO 1:N TELEFONES)
     ========================================================================== */
  const obterTelefonesContato = (contato) => {
    if (!contato) return [];
    if (Array.isArray(contato.telefones) && contato.telefones.length > 0) {
      return contato.telefones.map((t) =>
        typeof t === 'string'
          ? { numero: formatarTelefone(t), tipo: 'Celular' }
          : { numero: formatarTelefone(t.numero || t.telefone || ''), tipo: t.tipo || 'Celular' }
      );
    }
    if (contato.telefone) {
      return [{ numero: formatarTelefone(contato.telefone), tipo: 'Principal' }];
    }
    return [];
  };

  const montarContatosIniciais = () => {
    if (contatos && contatos.length > 0) {
      return contatos.map((c) => ({
        ...c,
        telefones: obterTelefonesContato(c),
      }));
    }
    if (paciente?.contatos_emergencia && paciente.contatos_emergencia.length > 0) {
      return paciente.contatos_emergencia.map((c) => ({
        ...c,
        telefones: obterTelefonesContato(c),
      }));
    }
    // Fallback inicial acolhedor se não houver contatos registrados
    return [
      {
        id: 1,
        nome_contato: nomeResponsavelPadrao,
        relacao: parentescoPadrao,
        telefone: telefoneEmergenciaPadrao,
        telefones: [{ numero: telefoneEmergenciaPadrao, tipo: 'Celular' }],
        ordem: 1,
      },
    ];
  };

  const [listaContatos, setListaContatos] = useState(montarContatosIniciais);
  const [modalContatosAberto, setModalContatosAberto] = useState(false);
  const [salvandoContato, setSalvandoContato] = useState(false);
  const [novoContato, setNovoContato] = useState({
    nome_contato: '',
    relacao: 'Mãe',
    telefones: [{ numero: '', tipo: 'Celular' }],
  });

  useEffect(() => {
    if (contatos && contatos.length > 0) {
      setListaContatos(contatos.map((c) => ({ ...c, telefones: obterTelefonesContato(c) })));
    } else if (paciente?.contatos_emergencia && paciente.contatos_emergencia.length > 0) {
      setListaContatos(paciente.contatos_emergencia.map((c) => ({ ...c, telefones: obterTelefonesContato(c) })));
    }
  }, [contatos, paciente?.contatos_emergencia]);

  // Listener para fechar o modal sobreposto via tecla ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && modalContatosAberto) {
        setModalContatosAberto(false);
      }
    };
    if (modalContatosAberto) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalContatosAberto]);

  // Primeiro contato (Prioritário) e segundo contato (Secundário)
  const contatoPrincipal = listaContatos[0] || null;
  const contatoSecundario = listaContatos[1] || null;
  const contatosAdicionais = listaContatos.slice(1);

  // Manipuladores de múltiplos telefones no formulário
  const handleAdicionarCampoTelefone = () => {
    setNovoContato((prev) => ({
      ...prev,
      telefones: [...prev.telefones, { numero: '', tipo: 'Celular' }],
    }));
  };

  const handleRemoverCampoTelefone = (indexParaRemover) => {
    if (novoContato.telefones.length <= 1) return;
    setNovoContato((prev) => ({
      ...prev,
      telefones: prev.telefones.filter((_, idx) => idx !== indexParaRemover),
    }));
  };

  const handleAlterarCampoTelefone = (index, campo, valor) => {
    setNovoContato((prev) => {
      const novos = [...prev.telefones];
      novos[index] = {
        ...novos[index],
        [campo]: campo === 'numero' ? formatarTelefone(valor) : valor,
      };
      return { ...prev, telefones: novos };
    });
  };

  // Adicionar novo contato de emergência (1 contato para N telefones com mínimo 1 obrigatório)
  const handleAdicionarContato = async (e) => {
    e?.preventDefault();
    if (!novoContato.nome_contato.trim()) {
      notificar.alerta('Informe o nome do contato de emergência.');
      return;
    }

    // Filtra e valida telefones preenchidos
    const telefonesValidados = novoContato.telefones
      .map((t) => ({
        numero: formatarTelefone(t.numero.trim()),
        tipo: t.tipo || 'Celular',
      }))
      .filter((t) => t.numero.replace(/\D/g, '').length >= 10);

    if (telefonesValidados.length === 0) {
      notificar.alerta('Informe pelo menos 1 telefone válido com DDD (mínimo 10 dígitos) para este contato.');
      return;
    }

    setSalvandoContato(true);
    const novoItem = {
      id: Date.now(),
      nome_contato: novoContato.nome_contato.trim(),
      relacao: novoContato.relacao || 'Familiar',
      telefone: telefonesValidados[0].numero,
      telefones: telefonesValidados,
      ordem: listaContatos.length + 1,
    };

    try {
      if (paciente?.id || paciente?.perfil_saude_id) {
        try {
          const res = await contatosEmergenciaService.adicionar({
            perfil_saude_id: paciente?.id || paciente?.perfil_saude_id,
            nome_contato: novoItem.nome_contato,
            relacao: novoItem.relacao,
            telefone: novoItem.telefone,
            telefones: telefonesValidados,
            ordem: novoItem.ordem,
          });

          if (res?.data?.contatos && Array.isArray(res.data.contatos)) {
            const formatados = res.data.contatos.map((c) => ({
              ...c,
              telefones: obterTelefonesContato(c),
            }));
            setListaContatos(formatados);
            if (onAtualizarContatos) onAtualizarContatos(formatados);
            setNovoContato({
              nome_contato: '',
              relacao: 'Mãe',
              telefones: [{ numero: '', tipo: 'Celular' }],
            });
            notificar.sucesso('Contato de emergência adicionado com sucesso!');
            return;
          }

          if (res?.data?.id || res?.dados?.id) {
            novoItem.id = res?.data?.id || res?.dados?.id;
          }
        } catch {
          // Continua em fallback local
        }
      }

      const atualizada = [...listaContatos, novoItem];
      setListaContatos(atualizada);
      if (onAtualizarContatos) onAtualizarContatos(atualizada);
      setNovoContato({
        nome_contato: '',
        relacao: 'Mãe',
        telefones: [{ numero: '', tipo: 'Celular' }],
      });
      notificar.sucesso('Contato de emergência adicionado com sucesso!');
    } catch {
      notificar.erro('Erro ao cadastrar contato de emergência.');
    } finally {
      setSalvandoContato(false);
    }
  };

  // Remover contato de emergência (RN-EMERG-01: Proibido remover se restar apenas 1)
  const handleRemoverContato = async (contatoId) => {
    if (listaContatos.length <= 1) {
      notificar.alerta(
        'Regra de Segurança (RN-EMERG-01): É obrigatório manter no mínimo 1 contato de emergência ativo para sua proteção.'
      );
      return;
    }

    const confirmado = await confirmar({
      titulo: 'Remover Contato de Emergência?',
      mensagem:
        'Tem certeza que deseja remover este contato de emergência? Esta alteração impactará os cartões e crachás de identificação médica.',
      textoConfirmar: 'Sim, remover',
      textoCancelar: 'Manter contato',
      variante: 'perigo',
    });

    if (!confirmado) return;

    try {
      try {
        const res = await contatosEmergenciaService.remover(contatoId);
        if (res?.data?.contatos && Array.isArray(res.data.contatos)) {
          const formatados = res.data.contatos.map((c) => ({
            ...c,
            telefones: obterTelefonesContato(c),
          }));
          setListaContatos(formatados);
          if (onAtualizarContatos) onAtualizarContatos(formatados);
          notificar.sucesso('Contato de emergência removido com sucesso!');
          return;
        }
      } catch {
        // Fallback local
      }

      const atualizada = listaContatos
        .filter((c) => c.id !== contatoId)
        .map((c, idx) => ({ ...c, ordem: idx + 1 }));

      setListaContatos(atualizada);
      if (onAtualizarContatos) onAtualizarContatos(atualizada);
      notificar.sucesso('Contato de emergência removido com sucesso!');
    } catch {
      notificar.erro('Erro ao remover contato de emergência.');
    }
  };

  // Data e hora de emissão oficial (America/Sao_Paulo)
  const dataHoraEmissao = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date());

  /* ==========================================================================
     HANDLERS DE EXPORTAÇÃO (PNG EM ALTA RESOLUÇÃO E PDF / IMPRESSÃO)
     ========================================================================== */

  // 1. Download do Card ou Crachá em PNG (html2canvas)
  const handleBaixarPNG = async () => {
    const alvoRef = formatoAtivo === 'cracha' ? crachaRef.current : fichaRef.current;
    if (!alvoRef) return;
    setGerandoImagem(true);

    try {
      const canvas = await html2canvas(alvoRef, {
        scale: 2, // 2x para nitidez em telas retina e celulares
        useCORS: true,
        backgroundColor: '#F6F3EE', // Garante o fundo marfim acolhedor no PNG
        logging: false,
        windowWidth: formatoAtivo === 'cracha' ? 900 : 1200,
      });

      const imagemData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const nomeLimpo = nomePaciente.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const prefixo = formatoAtivo === 'cracha' ? 'cartao-cracha-frente-verso-glicocare' : 'cartao-diagnostico-glicocare';
      link.download = `${prefixo}-${nomeLimpo}.png`;
      link.href = imagemData;
      link.click();

      notificar.sucesso(
        formatoAtivo === 'cracha'
          ? 'Crachá frente e verso pronto para impressão!'
          : 'Cartão de diagnóstico gerado com sucesso!'
      );
    } catch (err) {
      console.error('Erro ao gerar PNG do documento:', err);
      notificar.erro('Não foi possível gerar a imagem. Tente novamente.');
    } finally {
      setGerandoImagem(false);
    }
  };

  // 2. Impressão / Salvar em PDF nativo via window.print()
  const handleImprimirPDF = () => {
    window.print();
  };

  return (
    <div style={{ marginTop: exibirCabecalhoSecao ? '1.5rem' : '0', marginBottom: '1rem' }}>
      {/* ESTILOS DE IMPRESSÃO DEDICADOS (@media print) E RESPONSIVIDADE */}
      <style>{`
        @media print {
          @page {
            margin: 8mm;
            size: auto;
          }
          body * {
            visibility: hidden !important;
          }
          .cartao-print-active,
          .cartao-print-active * {
            visibility: visible !important;
          }
          .cartao-diagnostico-print-area.cartao-print-active {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: 2px solid #2E2824 !important;
            background-color: #FFFFFF !important;
            margin: 0 !important;
            padding: 1.5rem !important;
            z-index: 999999 !important;
          }
          .cartao-cracha-print-area.cartao-print-active {
            position: fixed !important;
            left: 50% !important;
            top: 15mm !important;
            transform: translateX(-50%) !important;
            display: flex !important;
            flex-direction: row !important;
            gap: 8mm !important;
            justify-content: center !important;
            align-items: flex-start !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            z-index: 999999 !important;
          }
          .cartao-cracha-face {
            width: 54mm !important;
            height: 86mm !important;
            min-width: 54mm !important;
            min-height: 86mm !important;
            max-width: 54mm !important;
            max-height: 86mm !important;
            border: 1px dashed #7C533F !important;
            border-radius: 3mm !important;
            padding: 3mm !important;
            background-color: #FFFFFF !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
          }
          .cartao-no-print {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          .cartao-diagnostico-print-area {
            padding: 20px !important;
          }
          .cartao-grade-parametros {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .cartao-grade-emergencia {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .cartao-cracha-print-area {
            flex-direction: column !important;
            align-items: center !important;
          }
        }
      `}</style>

      {/* CABEÇALHO DA SEÇÃO DE APRESENTAÇÃO */}
      {exibirCabecalhoSecao && (
        <div className="cartao-no-print" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🪪</span>
            <h3
              style={{
                fontFamily: 'var(--fonte-titulo, Fraunces)',
                fontSize: '1.35rem',
                color: '#2E2824',
                margin: 0,
              }}
            >
              {tituloSecao}
            </h3>
            <span
              style={{
                backgroundColor: 'rgba(59, 126, 72, 0.1)',
                color: '#3B7E48',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Fase 1 Oficial
            </span>
          </div>
          <p style={{ fontSize: '0.88rem', color: '#5A5049', margin: 0, maxWidth: '780px', lineHeight: 1.5 }}>
            {descricaoSecao}
          </p>
        </div>
      )}

      {/* SELETOR DE FORMATO DO DOCUMENTO (TABS SHADCN/UI) E GERENCIADOR DE CONTATOS */}
      <div
        className="cartao-no-print"
        style={{
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <Tabs value={formatoAtivo} onValueChange={setFormatoAtivo} style={{ width: 'auto' }}>
          <TabsList style={{ backgroundColor: 'rgba(124, 83, 63, 0.08)', padding: '4px', borderRadius: '10px' }}>
            <TabsTrigger
              value="ficha"
              style={{
                fontSize: '0.84rem',
                fontWeight: 600,
                padding: '6px 16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>📄</span>
              <span>Ficha Completa (Celular / A4)</span>
            </TabsTrigger>
            <TabsTrigger
              value="cracha"
              style={{
                fontSize: '0.84rem',
                fontWeight: 600,
                padding: '6px 16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>🪪</span>
              <span>Crachá Frente & Verso (54×86mm)</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* BOTÃO PARA GERENCIAR CONTATOS DE EMERGÊNCIA (MODAL DEDICADO SOBREPOSTO) */}
        <Button
          tipo="button"
          variante="secundario"
          onClick={() => setModalContatosAberto(true)}
          style={{
            fontSize: '0.82rem',
            padding: '0.45rem 0.95rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontWeight: 700,
          }}
        >
          <span>📞</span>
          <span>
            {`Gerenciar Contatos (${listaContatos.length})`}
          </span>
        </Button>
      </div>

      {/* MODAL SOBREPOSTO DEDICADO DE GERENCIAMENTO DE CONTATOS (DIALOG) */}
      {modalContatosAberto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-contatos-titulo"
          className="cartao-no-print"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalContatosAberto(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            backgroundColor: 'rgba(30, 24, 20, 0.72)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid rgba(124, 83, 63, 0.25)',
              boxShadow: '0 24px 50px rgba(0, 0, 0, 0.3)',
              width: '100%',
              maxWidth: '680px',
              maxHeight: 'calc(100vh - 40px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Cabeçalho do Modal */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid rgba(124, 83, 63, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#FBF9F7',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.25rem' }}>📞</span>
                  <h3
                    id="modal-contatos-titulo"
                    style={{
                      fontFamily: 'var(--fonte-titulo, Fraunces)',
                      fontSize: '1.18rem',
                      fontWeight: 700,
                      margin: 0,
                      color: '#2E2824',
                    }}
                  >
                    Gerenciar Contatos de Emergência
                  </h3>
                  <span
                    style={{
                      backgroundColor: 'rgba(59, 126, 72, 0.12)',
                      color: '#3B7E48',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                    }}
                  >
                    RN-EMERG-01
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#5A5049', lineHeight: 1.35 }}>
                  Mantenha pelo menos 1 contato obrigatório. Cada contato suporta múltiplos números com rótulos (Celular, Trabalho, Recado, etc.).
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalContatosAberto(false)}
                aria-label="Fechar modal"
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  color: '#5A5049',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Conteúdo com Rolagem Interna */}
            <div
              style={{
                padding: '20px 24px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              {/* Seção 1: Lista Atual de Contatos */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#7C533F', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Contatos Cadastrados ({listaContatos.length})
                  </span>
                  <span style={{ fontSize: '0.74rem', color: '#7C533F', fontWeight: 600 }}>
                    1º Contato = Destaque Prioritário no Crachá
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {listaContatos.map((contato, idx) => {
                    const tels = obterTelefonesContato(contato);
                    return (
                      <div
                        key={contato.id || idx}
                        style={{
                          borderRadius: '12px',
                          backgroundColor: idx === 0 ? '#EFF7F1' : '#FBF9F7',
                          border: idx === 0 ? '1.5px solid #3B7E48' : '1px solid rgba(124, 83, 63, 0.18)',
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '12px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <span
                            style={{
                              backgroundColor: idx === 0 ? '#3B7E48' : '#7C533F',
                              color: '#FFFFFF',
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              flexShrink: 0,
                              marginTop: '2px',
                            }}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: '0.94rem', color: '#2E2824' }}>
                                {contato.nome_contato}
                              </strong>
                              <span
                                style={{
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  color: idx === 0 ? '#285832' : '#7C533F',
                                  backgroundColor: '#FFFFFF',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  border: `1px solid ${idx === 0 ? '#3B7E48' : 'rgba(124, 83, 63, 0.3)'}`,
                                }}
                              >
                                {contato.relacao} {idx === 0 ? '• Principal' : ''}
                              </span>
                            </div>

                            {/* Telefones do Contato (1:N) */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                              {tels.map((tel, tIdx) => (
                                <span
                                  key={tIdx}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    color: '#285832',
                                    backgroundColor: '#FFFFFF',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(59, 126, 72, 0.25)',
                                  }}
                                >
                                  <span>📞</span>
                                  <span>{tel.numero}</span>
                                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#7C533F' }}>
                                    ({tel.tipo || 'Celular'})
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Ação de Remoção com Trava RN-EMERG-01 */}
                        <button
                          type="button"
                          onClick={() => handleRemoverContato(contato.id)}
                          disabled={listaContatos.length <= 1}
                          title={
                            listaContatos.length <= 1
                              ? 'Obrigatório manter no mínimo 1 contato de emergência (RN-EMERG-01).'
                              : 'Remover contato'
                          }
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: listaContatos.length <= 1 ? '#A89F91' : '#C94A38',
                            cursor: listaContatos.length <= 1 ? 'not-allowed' : 'pointer',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            padding: '6px 10px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            opacity: listaContatos.length <= 1 ? 0.6 : 1,
                          }}
                        >
                          <span>🗑️</span>
                          <span>Remover</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Seção 2: Formulário para Adicionar Novo Contato com 1:N Telefones */}
              <div
                style={{
                  backgroundColor: '#FBF9F7',
                  borderRadius: '12px',
                  border: '1.5px dashed rgba(124, 83, 63, 0.3)',
                  padding: '16px 18px',
                }}
              >
                <h4
                  style={{
                    fontFamily: 'var(--fonte-titulo, Fraunces)',
                    fontSize: '1rem',
                    margin: '0 0 12px 0',
                    color: '#2E2824',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>➕</span>
                  <span>Adicionar Novo Contato</span>
                </h4>

                <form onSubmit={handleAdicionarContato} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#7C533F', marginBottom: '4px' }}>
                        Nome do Contato *
                      </label>
                      <input
                        type="text"
                        value={novoContato.nome_contato}
                        onChange={(e) => setNovoContato({ ...novoContato, nome_contato: e.target.value })}
                        placeholder="Ex: Carlos Silva"
                        required
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.8rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(124, 83, 63, 0.25)',
                          fontSize: '0.86rem',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#7C533F', marginBottom: '4px' }}>
                        Relação / Vínculo *
                      </label>
                      <CustomSelect
                        value={novoContato.relacao}
                        onChange={(e) => setNovoContato({ ...novoContato, relacao: e.target.value })}
                        options={[
                          { value: 'Mãe', label: 'Mãe' },
                          { value: 'Pai', label: 'Pai' },
                          { value: 'Cônjuge', label: 'Cônjuge / Parceiro(a)' },
                          { value: 'Responsável', label: 'Responsável Legal' },
                          { value: 'Familiar', label: 'Familiar / Parente' },
                          { value: 'Escola', label: 'Escola / Coordenação' },
                          { value: 'Cuidador', label: 'Cuidador / Acompanhante' },
                          { value: 'Médico', label: 'Médico(a) / Endocrinologista' },
                          { value: 'Outro', label: 'Outro' },
                        ]}
                      />
                    </div>
                  </div>

                  {/* Seção Dinâmica de Telefones (1:N) */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7C533F' }}>
                        Telefones do Contato (Mínimo 1 obrigatório com DDD) *
                      </label>
                      <button
                        type="button"
                        onClick={handleAdicionarCampoTelefone}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#3B7E48',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        <span>➕</span>
                        <span>Adicionar outro telefone</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {novoContato.telefones.map((telItem, idxTel) => (
                        <div
                          key={idxTel}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 140px auto',
                            gap: '8px',
                            alignItems: 'center',
                          }}
                        >
                          <input
                            type="tel"
                            value={telItem.numero}
                            onChange={(e) => handleAlterarCampoTelefone(idxTel, 'numero', e.target.value)}
                            placeholder={`Telefone ${idxTel + 1} com DDD (ex: (11) 98888-7777)`}
                            maxLength={15}
                            required={idxTel === 0}
                            style={{
                              width: '100%',
                              padding: '0.55rem 0.75rem',
                              borderRadius: '8px',
                              border: '1px solid rgba(124, 83, 63, 0.25)',
                              fontSize: '0.84rem',
                              boxSizing: 'border-box',
                            }}
                          />

                          <CustomSelect
                            value={telItem.tipo}
                            onChange={(e) => handleAlterarCampoTelefone(idxTel, 'tipo', e.target.value)}
                            options={[
                              { value: 'Celular', label: '📱 Celular' },
                              { value: 'WhatsApp', label: '💬 WhatsApp' },
                              { value: 'Trabalho', label: '💼 Trabalho' },
                              { value: 'Residencial', label: '🏠 Residencial' },
                              { value: 'Recado', label: '📝 Recado' },
                              { value: 'Consultório', label: '🩺 Consultório' },
                            ]}
                          />

                          {novoContato.telefones.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => handleRemoverCampoTelefone(idxTel)}
                              title="Remover este telefone"
                              style={{
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#C94A38',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                padding: '6px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              🗑️
                            </button>
                          ) : (
                            <div style={{ width: '28px' }} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botão Salvar Contato */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <Button
                      tipo="submit"
                      variante="primario"
                      loading={salvandoContato}
                      style={{
                        padding: '0.65rem 1.25rem',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                      }}
                    >
                      Salvar Contato de Emergência
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div
              style={{
                padding: '12px 24px',
                borderTop: '1px solid rgba(124, 83, 63, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                backgroundColor: '#FBF9F7',
              }}
            >
              <Button
                tipo="button"
                variante="secundario"
                onClick={() => setModalContatosAberto(false)}
                style={{
                  padding: '0.55rem 1.25rem',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                }}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AVISO DE SEGURANÇA SE A LISTA DE CONTATOS ESTIVER VAZIA */}
      {listaContatos.length === 0 && (
        <div
          className="cartao-no-print"
          style={{
            backgroundColor: '#FFF4F2',
            border: '1.5px solid #C94A38',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.25rem',
            color: '#842029',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <span>Nenhum contato de emergência cadastrado!</span>
          </div>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.84rem', lineHeight: 1.4 }}>
            Para a segurança clínica e emissão do Cartão e Crachá de Identificação, é obrigatório cadastrar pelo menos 1 contato de emergência com telefone ativo.
          </p>
        </div>
      )}

      {/* VISÃO 1: FICHA COMPLETA (PANORÂMICA DETALHADA COM RESPIRO AMPLO) */}
      {/* INÍCIO DO CARD DE DIAGNÓSTICO (FICHA COMPLETA) */}
      {formatoAtivo === 'ficha' && (
        <div
          ref={fichaRef}
          className="cartao-print-active cartao-diagnostico-print-area"
          style={{
            backgroundColor: '#F6F3EE',
            borderRadius: '20px',
            border: '1.5px solid rgba(124, 83, 63, 0.25)',
            padding: '28px 32px',
            maxWidth: '100%',
            boxShadow: '0 10px 30px rgba(46, 40, 36, 0.08)',
            color: '#2E2824',
            fontFamily: 'var(--fonte-corpo, "Plus Jakarta Sans", sans-serif)',
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
        {/* TOPO: IDENTIDADE GLICOCARE E SELO OFICIAL */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1.5px solid rgba(124, 83, 63, 0.2)',
            paddingBottom: '14px',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <img
              src={logoGlicoCare}
              alt="Logo GlicoCare"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1.5px solid #7C533F',
              }}
            />
            <div>
              <div
                style={{
                  fontFamily: 'var(--fonte-titulo, Fraunces)',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#2E2824',
                  lineHeight: 1.1,
                }}
              >
                GlicoCare
              </div>
              <div style={{ fontSize: '0.74rem', color: '#7C533F', fontWeight: 600, letterSpacing: '0.04em' }}>
                APOIO INTEGRADO EM DIABETES
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#7C533F',
              color: '#FFFFFF',
              padding: '0.4rem 0.95rem',
              borderRadius: '8px',
              fontSize: '0.74rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              boxShadow: '0 2px 6px rgba(124, 83, 63, 0.2)',
            }}
          >
            CARTÃO DE DIAGNÓSTICO & CUIDADO
          </div>
        </div>

        {/* IDENTIFICAÇÃO DO PACIENTE */}
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C533F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Identificação do Paciente
          </div>
          <div
            style={{
              fontFamily: 'var(--fonte-titulo, Fraunces)',
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#2E2824',
              lineHeight: 1.2,
              marginTop: '0.2rem',
            }}
          >
            {nomePaciente}
          </div>
          <div style={{ fontSize: '0.86rem', color: '#5A5049', marginTop: '0.25rem' }}>
            {dataNascimento && (
              <span>
                Nascimento: <strong>{new Date(dataNascimento).toLocaleDateString('pt-BR')}</strong>
              </span>
            )}
            {idadeFormatada && (
              <span> • Idade: <strong>{idadeFormatada}</strong></span>
            )}
            {paciente?.sexo && (
              <span style={{ textTransform: 'capitalize' }}> • Sexo: <strong>{paciente.sexo}</strong></span>
            )}
          </div>
        </div>

        {/* BLOCO DE CONTATOS DE EMERGÊNCIA (DESTAQUE MÚLTIPLOS CONTATOS COM RESPIRO) */}
        {listaContatos && listaContatos.length > 0 ? (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '16px 18px',
              border: '1.5px solid #3B7E48',
              boxShadow: '0 2px 8px rgba(59, 126, 72, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.1rem' }}>📞</span>
                <span style={{ fontSize: '0.8rem', color: '#285832', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Contatos de Emergência ({listaContatos.length})
                </span>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#3B7E48', fontWeight: 700 }}>
                Aviso Imediato em Hipoglicemia / Mal-estar
              </span>
            </div>

            {/* Contato 1 (Prioridade 1 em destaque com 1:N telefones) */}
            {contatoPrincipal && (
              <div
                style={{
                  backgroundColor: '#EFF7F1',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  border: '1px solid #3B7E48',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        backgroundColor: '#3B7E48',
                        color: '#FFFFFF',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                      }}
                    >
                      1º Contato • Principal
                    </span>
                    <strong style={{ fontSize: '0.98rem', color: '#2E2824' }}>
                      {contatoPrincipal.nome_contato}
                    </strong>
                    <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#285832' }}>
                      ({contatoPrincipal.relacao})
                    </span>
                  </div>
                </div>

                {/* Lista de Telefones do 1º Contato */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {obterTelefonesContato(contatoPrincipal).map((tel, telIdx) => (
                    <a
                      key={telIdx}
                      href={`tel:${tel.numero.replace(/\D/g, '')}`}
                      style={{
                        backgroundColor: '#3B7E48',
                        color: '#FFFFFF',
                        padding: '0.45rem 0.85rem',
                        borderRadius: '8px',
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        textDecoration: 'none',
                        letterSpacing: '0.02em',
                      }}
                    >
                      <span>📞</span>
                      <span>{tel.numero}</span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(255, 255, 255, 0.22)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {tel.tipo || 'Celular'}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Contatos Adicionais (2, 3...) em grid limpo com todos os telefones */}
            {contatosAdicionais && contatosAdicionais.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '10px',
                }}
              >
                {contatosAdicionais.map((c, i) => {
                  const tels = obterTelefonesContato(c);
                  return (
                    <div
                      key={c.id || i}
                      style={{
                        backgroundColor: '#F6F3EE',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        border: '1px solid rgba(124, 83, 63, 0.18)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#7C533F', fontWeight: 700 }}>
                          {i + 2}º Contato ({c.relacao})
                        </div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#2E2824' }}>
                          {c.nome_contato}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end' }}>
                        {tels.map((tel, tIdx) => (
                          <a
                            key={tIdx}
                            href={`tel:${tel.numero.replace(/\D/g, '')}`}
                            style={{
                              fontSize: '0.84rem',
                              fontWeight: 800,
                              color: '#285832',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>📞 {tel.numero}</span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#7C533F' }}>
                              ({tel.tipo || 'Celular'})
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              backgroundColor: '#FFF4F2',
              borderRadius: '12px',
              padding: '14px 18px',
              border: '1.5px solid #C94A38',
              color: '#842029',
              fontSize: '0.86rem',
            }}
          >
            ⚠️ Nenhum contato de emergência ativo registrado.
          </div>
        )}

        {/* GRADE CLÍNICA: TIPO DE DIABETES, TERAPIA E MONITORAMENTO (3 COLUNAS UNIFORMES COM RESPIRO) */}
        <div
          className="cartao-grade-parametros"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '14px',
          }}
        >
          {/* Item 1: Tipo & Tempo de Diagnóstico */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '16px 18px',
              borderRadius: '12px',
              border: '1px solid rgba(124, 83, 63, 0.15)',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#7C533F', fontWeight: 700, textTransform: 'uppercase' }}>
              Classificação & Diagnóstico
            </div>
            <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#2E2824', marginTop: '0.2rem' }}>
              {tipoDiabetes}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#3B7E48', fontWeight: 600, marginTop: '0.3rem' }}>
              🌱 {tempoDiagnosticoExtenso}
            </div>
          </div>

          {/* Item 2: Terapia & Monitoramento */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '16px 18px',
              borderRadius: '12px',
              border: '1px solid rgba(124, 83, 63, 0.15)',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#7C533F', fontWeight: 700, textTransform: 'uppercase' }}>
              Terapia & Monitoramento
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#2E2824', marginTop: '0.2rem' }}>
              💉 {terapiaInsulina}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#5A5049', marginTop: '0.3rem' }}>
              📟 {monitoramento}
            </div>
          </div>

          {/* Item 3: Parâmetros Clínicos (FSI e Meta) */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '16px 18px',
              borderRadius: '12px',
              border: '1px solid rgba(124, 83, 63, 0.15)',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#7C533F', fontWeight: 700, textTransform: 'uppercase' }}>
              FSI & Glicemia Alvo
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#2E2824', marginTop: '0.2rem' }}>
              🎯 FSI: {fsi}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#5A5049', marginTop: '0.3rem' }}>
              Alvo: {metaGlicemica}
            </div>
          </div>
        </div>

        {/* BLOCO DE ALERTA: ALERGIAS & SENSIBILIDADES CLÍNICAS COM RESPIRO */}
        <div
          style={{
            backgroundColor: alergias && alergias.length > 0 ? '#FFF5F4' : '#FFFFFF',
            border: `1.5px solid ${alergias && alergias.length > 0 ? '#C94A38' : 'rgba(124, 83, 63, 0.2)'}`,
            borderRadius: '12px',
            padding: '16px 18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.05rem' }}>
              {alergias && alergias.length > 0 ? '⚠️' : '🛡️'}
            </span>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: alergias && alergias.length > 0 ? '#C94A38' : '#7C533F',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Alergias & Sensibilidades ({alergias?.length || 0})
            </span>
          </div>

          {alergias && alergias.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
              {alergias.map((al, idx) => (
                <span
                  key={al.id || idx}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #C94A38',
                    color: '#942217',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                  }}
                >
                  {al.substancia_ou_item || al.nome || al.substancia}
                  {al.gravidade ? ` (${al.gravidade})` : ''}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.84rem', color: '#5A5049', fontStyle: 'italic' }}>
              Nenhuma alergia alimentar, medicamentosa ou a insumos registrada.
            </div>
          )}
        </div>

        {/* MEDICAMENTOS & INSULINAS EM USO COM RESPIRO */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '16px 18px',
            border: '1px solid rgba(124, 83, 63, 0.15)',
          }}
        >
          <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#7C533F', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
            💊 Medicamentos & Insulinas Ativas
          </div>

          {medicamentos && medicamentos.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem' }}>
              {medicamentos.map((med, idx) => (
                <div
                  key={med.id || idx}
                  style={{
                    fontSize: '0.84rem',
                    color: '#2E2824',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#F6F3EE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <strong>{med.nome_medicamento || med.nome}</strong>
                  <span style={{ fontSize: '0.76rem', color: '#5A5049' }}>
                    {med.dosagem ? `${med.dosagem} ${med.unidade_medida || 'UI'}` : (med.horario_administracao || med.frequencia_uso || 'Conforme prescrição')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.84rem', color: '#5A5049', lineHeight: 1.5 }}>
              • Insulina Ultrarrápida (Bolus de Refeição e Correção conforme contagem de carboidratos)
              <br />
              • Insulina Basal Diária (Conforme prescrição médica habitual)
            </div>
          )}
        </div>

        {/* PROTOCOLO COMPLETO DE EMERGÊNCIA: HIPOGLICEMIA & HIPERGLICEMIA (2 COLUNAS COM RESPIRO AMPLO) */}
        <div
          className="cartao-grade-emergencia"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '14px',
          }}
        >
          {/* Card 1: Hipoglicemia (< 70 mg/dL) */}
          <div
            style={{
              backgroundColor: '#FFF9F0',
              border: '1.5px solid #C88D2A',
              borderRadius: '12px',
              padding: '16px 18px',
              fontSize: '0.82rem',
              lineHeight: 1.55,
              color: '#2E2824',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.05rem' }}>🚨</span>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#8A5D10', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Hipoglicemia (&lt; 70 mg/dL)
                </span>
              </div>
              <div style={{ marginBottom: '0.45rem' }}>
                <strong>Sinais:</strong> Tremores, sudorese fria, palidez, tontura ou sonolência.
              </div>
              <div>
                <strong>Conduta:</strong> Aplicar a <strong>Regra dos 15g</strong> (1 sachê de mel, 150 ml de suco integral ou 1 colher de sopa de açúcar diluído em água). Aguardar 15 minutos em repouso e medir novamente.
              </div>
            </div>
            <div
              style={{
                marginTop: '0.65rem',
                paddingTop: '0.5rem',
                borderTop: '1px dashed rgba(200, 141, 42, 0.4)',
                fontSize: '0.76rem',
                fontWeight: 700,
                color: '#A23B2A',
              }}
            >
              ⚠️ NUNCA aplique insulina durante uma hipoglicemia.
            </div>
          </div>

          {/* Card 2: Hiperglicemia (> 250 mg/dL) */}
          <div
            style={{
              backgroundColor: '#FFF4F2',
              border: '1.5px solid #C94A38',
              borderRadius: '12px',
              padding: '16px 18px',
              fontSize: '0.82rem',
              lineHeight: 1.55,
              color: '#2E2824',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.05rem' }}>⚠️</span>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#A23B2A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Hiperglicemia (&gt; 250 mg/dL)
                </span>
              </div>
              <div style={{ marginBottom: '0.45rem' }}>
                <strong>Sinais:</strong> Sede intensa, boca seca, vontade frequente de urinar, cansaço ou visão turva.
              </div>
              <div>
                <strong>Conduta:</strong> Oferecer água pura para hidratação, verificar cetonas (se disponível) e checar cateter/aplicação. Realizar correção apenas conforme o <strong>FSI prescrito</strong> (respeitando a insulina ativa).
              </div>
            </div>
            <div
              style={{
                marginTop: '0.65rem',
                paddingTop: '0.5rem',
                borderTop: '1px dashed rgba(201, 74, 56, 0.4)',
                fontSize: '0.76rem',
                fontWeight: 700,
                color: '#842029',
              }}
            >
              🚨 Buscar pronto-atendimento se houver náuseas, vômitos, dor abdominal ou sonolência excessiva.
            </div>
          </div>
        </div>

        {/* RODAPÉ DO CARD: METADADOS DE EMISSÃO E ASSINATURA */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.74rem',
            color: '#6A5E57',
            borderTop: '1.5px solid rgba(124, 83, 63, 0.2)',
            paddingTop: '14px',
            flexWrap: 'wrap',
            gap: '0.6rem',
          }}
        >
          <div>
            Emissão oficial: <strong>{dataHoraEmissao}</strong> (Brasília)
          </div>
          <div style={{ fontWeight: 600, color: '#3B7E48' }}>
            ✓ Válido para emergência, viagens e ambiente escolar
          </div>
        </div>
      </div>
      )}
      {/* FIM DO CARD DE DIAGNÓSTICO (FICHA COMPLETA) */}

      {/* ====================================================================
          VISÃO 2: CRACHÁ DE PESCOÇO FRENTE & VERSO (54mm × 86mm / PADRÃO CR80)
          ==================================================================== */}
      {formatoAtivo === 'cracha' && (
        <div
          ref={crachaRef}
          className="cartao-print-active cartao-cracha-print-area"
          style={{
            display: 'flex',
            gap: '24px',
            justifyContent: 'center',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            padding: '10px 0',
            backgroundColor: 'transparent',
            boxSizing: 'border-box',
          }}
        >
          {/* ----------------------------------------------------------------
              LADO A — FRENTE DO CRACHÁ (IDENTIFICAÇÃO & CONTATO)
              ---------------------------------------------------------------- */}
          <div
            className="cartao-cracha-face"
            style={{
              width: '260px',
              minWidth: '260px',
              height: '414px',
              backgroundColor: '#F6F3EE',
              borderRadius: '14px',
              border: '1.5px solid rgba(124, 83, 63, 0.3)',
              padding: '12px 14px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 6px 18px rgba(46, 40, 36, 0.08)',
              color: '#2E2824',
              fontFamily: 'var(--fonte-corpo, "Plus Jakarta Sans", sans-serif)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Topo: Logo + Alerta Médico */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1.5px solid rgba(124, 83, 63, 0.2)',
                paddingBottom: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <img
                  src={logoGlicoCare}
                  alt="Logo GlicoCare"
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1px solid #7C533F',
                  }}
                />
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--fonte-titulo, Fraunces)',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      color: '#2E2824',
                      lineHeight: 1,
                    }}
                  >
                    GlicoCare
                  </div>
                  <div style={{ fontSize: '0.58rem', color: '#7C533F', fontWeight: 700, letterSpacing: '0.04em' }}>
                    PORTADOR DE DM1
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#7C533F',
                  color: '#FFFFFF',
                  padding: '2px 6px',
                  borderRadius: '5px',
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                ALERTA MÉDICO
              </div>
            </div>

            {/* Identificação Central */}
            <div style={{ margin: '4px 0' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#7C533F', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Paciente / Portador
              </div>
              <div
                style={{
                  fontFamily: 'var(--fonte-titulo, Fraunces)',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: '#2E2824',
                  lineHeight: 1.15,
                  marginTop: '1px',
                }}
              >
                {nomePaciente}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#5A5049', marginTop: '2px' }}>
                {dataNascimento && (
                  <span>Nasc: <strong>{new Date(dataNascimento).toLocaleDateString('pt-BR')}</strong></span>
                )}
                {idadeFormatada && <span> • <strong>{idadeFormatada}</strong></span>}
              </div>

              {/* Tags: Tipo DM1 e Insulina */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '5px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    backgroundColor: 'rgba(124, 83, 63, 0.1)',
                    color: '#7C533F',
                    padding: '1px 6px',
                    borderRadius: '5px',
                    fontSize: '0.66rem',
                    fontWeight: 700,
                  }}
                >
                  {tipoDiabetes}
                </span>
                <span
                  style={{
                    backgroundColor: 'rgba(59, 126, 72, 0.12)',
                    color: '#285832',
                    border: '1px solid #3B7E48',
                    padding: '1px 6px',
                    borderRadius: '5px',
                    fontSize: '0.66rem',
                    fontWeight: 800,
                  }}
                >
                  💉 Usa Insulina
                </span>
              </div>
            </div>

            {/* Bloco de Segurança: Alergias */}
            <div
              style={{
                backgroundColor: alergias && alergias.length > 0 ? '#FFF4F2' : '#FFFFFF',
                border: `1px solid ${alergias && alergias.length > 0 ? '#C94A38' : 'rgba(124, 83, 63, 0.18)'}`,
                borderRadius: '8px',
                padding: '5px 7px',
                margin: '3px 0',
              }}
            >
              <div
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  color: alergias && alergias.length > 0 ? '#C94A38' : '#7C533F',
                  textTransform: 'uppercase',
                  marginBottom: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <span>{alergias && alergias.length > 0 ? '⚠️' : '🛡️'}</span>
                <span>Alergias & Sensibilidades</span>
              </div>
              {alergias && alergias.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                  {alergias.map((al, idx) => (
                    <span
                      key={al.id || idx}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #C94A38',
                        color: '#942217',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontSize: '0.64rem',
                        fontWeight: 700,
                      }}
                    >
                      {al.substancia_ou_item || al.nome || al.substancia}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.66rem', color: '#5A5049', fontStyle: 'italic' }}>
                  Sem alergias conhecidas registradas.
                </div>
              )}
            </div>

            {/* Contato de Emergência (Crachá Frente) */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1.5px solid #3B7E48',
                padding: '5px 7px',
                marginTop: '3px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1px' }}>
                <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#3B7E48', textTransform: 'uppercase' }}>
                  📞 Emergência • 1º Contato
                </span>
                {contatoPrincipal && (
                  <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#285832' }}>
                    {contatoPrincipal.relacao}
                  </span>
                )}
              </div>

              {contatoPrincipal ? (
                <>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#2E2824', lineHeight: 1.15 }}>
                    {contatoPrincipal.nome_contato}
                  </div>
                  {(() => {
                    const telsP = obterTelefonesContato(contatoPrincipal);
                    const telPrimario = telsP[0] || { numero: contatoPrincipal.telefone, tipo: 'Celular' };
                    const telSecundario = telsP[1] || null;
                    return (
                      <>
                        <div style={{ fontSize: '0.90rem', fontWeight: 900, color: '#285832', letterSpacing: '0.02em', marginTop: '1px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>{telPrimario.numero}</span>
                          <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#3B7E48', backgroundColor: 'rgba(59, 126, 72, 0.1)', padding: '1px 4px', borderRadius: '3px' }}>
                            {telPrimario.tipo || 'Principal'}
                          </span>
                        </div>
                        {telSecundario && (
                          <div style={{ fontSize: '0.62rem', color: '#5A5049', marginTop: '1px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>• {telSecundario.tipo}:</span>
                            <strong style={{ color: '#285832' }}>{telSecundario.numero}</strong>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              ) : (
                <div style={{ fontSize: '0.68rem', color: '#C94A38', fontWeight: 700 }}>
                  Sem contato cadastrado
                </div>
              )}

              {/* 2º Contato de Emergência (se houver) */}
              {contatoSecundario && (
                <div
                  style={{
                    marginTop: '3px',
                    paddingTop: '3px',
                    borderTop: '1px dashed rgba(59, 126, 72, 0.35)',
                    fontSize: '0.64rem',
                    color: '#2E2824',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    <strong>2º:</strong> {contatoSecundario.nome_contato} ({contatoSecundario.relacao})
                  </span>
                  <strong style={{ color: '#285832' }}>
                    {obterTelefonesContato(contatoSecundario)[0]?.numero || contatoSecundario.telefone}
                  </strong>
                </div>
              )}

              {/* Indicador se houver 3 ou mais contatos */}
              {listaContatos.length > 2 && (
                <div style={{ fontSize: '0.55rem', color: '#7C533F', fontWeight: 600, marginTop: '2px', textAlign: 'right' }}>
                  + {listaContatos.length - 2} outro(s) contato(s) no verso/app
                </div>
              )}
            </div>

            {/* Rodapé: Aviso do Verso */}
            <div
              style={{
                textAlign: 'center',
                fontSize: '0.62rem',
                fontWeight: 700,
                color: '#7C533F',
                borderTop: '1px solid rgba(124, 83, 63, 0.15)',
                paddingTop: '3px',
                marginTop: '3px',
              }}
            >
              Conduta de emergência no verso ↻
            </div>
          </div>

          {/* ----------------------------------------------------------------
              LADO B — VERSO DO CRACHÁ (PROTOCOLO RÁPIDO HIPO & HIPER)
              ---------------------------------------------------------------- */}
          <div
            className="cartao-cracha-face"
            style={{
              width: '260px',
              minWidth: '260px',
              height: '414px',
              backgroundColor: '#F6F3EE',
              borderRadius: '14px',
              border: '1.5px solid rgba(124, 83, 63, 0.3)',
              padding: '12px 14px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 6px 18px rgba(46, 40, 36, 0.08)',
              color: '#2E2824',
              fontFamily: 'var(--fonte-corpo, "Plus Jakarta Sans", sans-serif)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Topo do Verso: Terapia e Parâmetros */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid rgba(124, 83, 63, 0.15)',
                padding: '5px 7px',
              }}
            >
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#7C533F', textTransform: 'uppercase' }}>
                Conduta Clínica & Parâmetros
              </div>
              <div style={{ fontSize: '0.66rem', color: '#2E2824', marginTop: '2px', lineHeight: 1.3 }}>
                💉 <strong>{terapiaInsulina.includes('Caneta') ? 'Caneta MDI' : terapiaInsulina}</strong> • 📟 <strong>{monitoramento.includes('Libre') ? 'FreeStyle Libre' : 'Sensor Contínuo'}</strong>
              </div>
              <div style={{ fontSize: '0.66rem', color: '#2E2824', lineHeight: 1.3 }}>
                🎯 FSI: <strong>{fsi}</strong> • Alvo: <strong>70–140 mg/dL</strong>
              </div>
              {medicamentos && medicamentos.length > 0 && (
                <div style={{ fontSize: '0.6rem', color: '#5A5049', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  💊 <strong>Insulinas:</strong> {medicamentos.map((m) => m.nome_medicamento || m.nome).join(', ')}
                </div>
              )}
            </div>

            {/* Card Compacto: Hipoglicemia (< 70 mg/dL) */}
            <div
              style={{
                backgroundColor: '#FFF9F0',
                border: '1.2px solid #C88D2A',
                borderRadius: '8px',
                padding: '6px 8px',
                margin: '2px 0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.72rem' }}>🚨</span>
                  <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#8A5D10', textTransform: 'uppercase' }}>
                    Hipoglicemia (&lt; 70 mg/dL)
                  </span>
                </div>
                <div style={{ fontSize: '0.65rem', color: '#2E2824', lineHeight: 1.25 }}>
                  <strong>Sinais:</strong> Tremores, suor frio, tontura, palidez.
                </div>
                <div style={{ fontSize: '0.65rem', color: '#2E2824', lineHeight: 1.25, marginTop: '2px' }}>
                  <strong>Conduta:</strong> Dar 15g de açúcar, mel ou suco. Aguardar 15 min e medir.
                </div>
              </div>
              <div
                style={{
                  marginTop: '3px',
                  paddingTop: '2px',
                  borderTop: '1px dashed rgba(200, 141, 42, 0.4)',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  color: '#A23B2A',
                }}
              >
                ⚠️ NUNCA aplique insulina durante hipoglicemia.
              </div>
            </div>

            {/* Card Compacto: Hiperglicemia (> 250 mg/dL) */}
            <div
              style={{
                backgroundColor: '#FFF4F2',
                border: '1.2px solid #C94A38',
                borderRadius: '8px',
                padding: '6px 8px',
                margin: '2px 0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.72rem' }}>⚠️</span>
                  <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#A23B2A', textTransform: 'uppercase' }}>
                    Hiperglicemia (&gt; 250 mg/dL)
                  </span>
                </div>
                <div style={{ fontSize: '0.65rem', color: '#2E2824', lineHeight: 1.25 }}>
                  <strong>Sinais:</strong> Sede intensa, boca seca, mal-estar ou cansaço.
                </div>
                <div style={{ fontSize: '0.65rem', color: '#2E2824', lineHeight: 1.25, marginTop: '2px' }}>
                  <strong>Conduta:</strong> Oferecer água pura, checar cetonas/cateter. Corrigir pelo FSI prescrito.
                </div>
              </div>
              <div
                style={{
                  marginTop: '3px',
                  paddingTop: '2px',
                  borderTop: '1px dashed rgba(201, 74, 56, 0.4)',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  color: '#842029',
                }}
              >
                🚨 Buscar médico se houver vômitos ou sonolência.
              </div>
            </div>

            {/* Rodapé do Verso */}
            <div
              style={{
                textAlign: 'center',
                fontSize: '0.58rem',
                color: '#6A5E57',
                borderTop: '1px solid rgba(124, 83, 63, 0.15)',
                paddingTop: '3px',
              }}
            >
              Emissão oficial: <strong>{dataHoraEmissao}</strong> • GlicoCare
            </div>
          </div>
        </div>
      )}

      {/* INÍCIO DA BARRA DE AÇÕES DE DOWNLOAD E IMPRESSÃO COM RESPIRO SEGURO */}
      <div
        className="cartao-no-print"
        style={{
          display: 'flex',
          gap: '12px',
          marginTop: '1.5rem',
          paddingTop: '16px',
          borderTop: '1px solid rgba(124, 83, 63, 0.15)',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <Button
          variante="cta"
          onClick={handleBaixarPNG}
          loading={gerandoImagem}
          disabled={gerandoImagem || listaContatos.length === 0}
          title={listaContatos.length === 0 ? 'Cadastre ao menos 1 contato de emergência para baixar' : ''}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.3rem',
            fontWeight: 700,
            fontSize: '0.88rem',
            opacity: listaContatos.length === 0 ? 0.6 : 1,
            cursor: listaContatos.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <span>🖼️</span>
          <span>
            {gerandoImagem
              ? 'Gerando Imagem...'
              : formatoAtivo === 'cracha'
              ? 'Baixar Crachá (PNG)'
              : 'Baixar Card (PNG)'}
          </span>
        </Button>

        <Button
          variante="secundario"
          onClick={handleImprimirPDF}
          disabled={listaContatos.length === 0}
          title={listaContatos.length === 0 ? 'Cadastre ao menos 1 contato de emergência para imprimir' : ''}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.3rem',
            fontWeight: 700,
            fontSize: '0.88rem',
            opacity: listaContatos.length === 0 ? 0.6 : 1,
            cursor: listaContatos.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <span>🖨️</span>
          <span>
            {formatoAtivo === 'cracha'
              ? 'Imprimir Crachá (Tamanho Real)'
              : 'Salvar PDF / Imprimir'}
          </span>
        </Button>

        <span style={{ fontSize: '0.8rem', color: '#6A5E57', lineHeight: '1.4' }}>
          {listaContatos.length === 0
            ? '⚠️ Emissão bloqueada: adicione pelo menos 1 contato de emergência para desbloquear o download e a impressão.'
            : formatoAtivo === 'cracha'
            ? '💡 Dimensão exata 54×86mm para porta-crachá CR80 de pescoço, mochila ou carteira.'
            : '💡 Ideal para salvar no álbum do celular ou na tela bloqueada para emergências.'}
        </span>
      </div>
      {/* FIM DA BARRA DE AÇÕES DE DOWNLOAD E IMPRESSÃO */}
    </div>
  );
}

/* FIM DO COMPONENTE CARTÃO DE DIAGNÓSTICO PARA DOWNLOAD */
