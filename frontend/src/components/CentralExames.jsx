/* ==========================================================================
   ARQUIVO: CentralExames.jsx (Localização: /frontend/src/components/CentralExames.jsx)
   PROJETO: GlicoCare — Central de Exames e Upload de Laudos Laboratoriais (RN-EXA-01)
   OBJETIVO:
     Módulo completo de exames para a página pessoal do paciente e cuidador:
     1. Bloco 1: Guias Solicitadas pelos Especialistas (status, download PDF, anexar laudo);
     2. Bloco 2: Modal "+ Registrar Novo Exame" (Laboratório, data, upload até 10MB, construtor de marcadores 1:N);
     3. Bloco 3: Linha do Tempo Histórica (chips de resultados, link do laudo, filtro por marcador com evolução).
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import Button from './Button';
import CustomSelect from './CustomSelect';
import GlicoLoader from './GlicoLoader';

// Dados demonstrativos padrão (espelhados com o seed do banco de dados TiDB)
export const EXAMES_DEMO_INICIAIS = [
  {
    id: 1,
    perfil_saude_id: 1,
    solicitacao_id: 1,
    solicitacao_titulo: 'Rotina Trimestral DM1 + Vitaminas e Função Renal',
    laboratorio: 'Delboni Auriemo',
    data_realizacao: '2026-10-25',
    data_registro_app: '2026-10-26 09:15:00',
    arquivo_anexo_path: '/backend/uploads/exames/delboni_laudo_outubro_theo.pdf',
    arquivo_nome_original: 'Laudo_Completo_Theo_Outubro_2026.pdf',
    observacoes_paciente: 'Coleta feita em jejum de 8h sem choro na punção. Dra. Helena já visualizou na consulta.',
    marcadores: [
      { id: 1, nome_marcador: 'Hemoglobina Glicada (HbA1c)', valor_resultado: '6.8', unidade: '%', valor_referencia: '< 7,0% para DM1 pediátrico' },
      { id: 2, nome_marcador: 'Glicemia em Jejum', valor_resultado: '104', unidade: 'mg/dL', valor_referencia: '70 a 99 mg/dL' },
      { id: 3, nome_marcador: 'Vitamina D (25-OH)', valor_resultado: '36.5', unidade: 'ng/mL', valor_referencia: 'Desejável acima de 30 ng/mL' },
      { id: 4, nome_marcador: 'Creatinina', valor_resultado: '0.52', unidade: 'mg/dL', valor_referencia: '0,30 a 0,70 mg/dL' },
      { id: 5, nome_marcador: 'TSH', valor_resultado: '2.1', unidade: 'mUI/L', valor_referencia: '0,4 a 4,5 mUI/L' },
    ],
  },
  {
    id: 2,
    perfil_saude_id: 1,
    solicitacao_id: null,
    solicitacao_titulo: null,
    laboratorio: 'Lavoisier',
    data_realizacao: '2026-07-20',
    data_registro_app: '2026-07-22 16:00:00',
    arquivo_anexo_path: '/backend/uploads/exames/lavoisier_laudo_julho_theo.pdf',
    arquivo_nome_original: 'Exames_Theo_Julho_2026.pdf',
    observacoes_paciente: 'Exame de rotina de 3 meses após ajuste de insulina basal.',
    marcadores: [
      { id: 6, nome_marcador: 'Hemoglobina Glicada (HbA1c)', valor_resultado: '7.4', unidade: '%', valor_referencia: '< 7,0% para DM1 pediátrico' },
      { id: 7, nome_marcador: 'Glicemia em Jejum', valor_resultado: '118', unidade: 'mg/dL', valor_referencia: '70 a 99 mg/dL' },
      { id: 8, nome_marcador: 'Vitamina D (25-OH)', valor_resultado: '24.0', unidade: 'ng/mL', valor_referencia: 'Desejável acima de 30 ng/mL' },
    ],
  },
];

export const SOLICITACOES_DEMO_INICIAIS = [
  {
    id: 1,
    agendamento_id: 1,
    especialista_id: 1,
    especialista_nome: 'Dra. Helena Vasconcelos',
    especialidade: 'Endocrinologia Pediátrica',
    tipo_conselho: 'CRM',
    numero_conselho: '148290',
    uf_conselho: 'SP',
    titulo_pedido: 'Rotina Trimestral DM1 + Vitaminas e Função Renal',
    lista_exames_solicitados: [
      'Hemoglobina Glicada (HbA1c)',
      'Glicemia em Jejum',
      'Vitamina D (25-OH)',
      'Microalbuminúria em Amostra Isolada',
      'TSH',
      'Creatinina',
    ],
    guia_pdf_path: '/backend/api/exames/gerar_guia_pdf.php?id=1',
    status: 'REALIZADO',
    data_solicitacao: '2026-10-15 14:30:00',
  },
  {
    id: 2,
    agendamento_id: 1,
    especialista_id: 1,
    especialista_nome: 'Dra. Helena Vasconcelos',
    especialidade: 'Endocrinologia Pediátrica',
    tipo_conselho: 'CRM',
    numero_conselho: '148290',
    uf_conselho: 'SP',
    titulo_pedido: 'Controle Semestral: HbA1c + Perfil Lipídico e Função Tireoidiana',
    lista_exames_solicitados: [
      'Hemoglobina Glicada (HbA1c)',
      'Colesterol Total e Frações',
      'Triglicerídeos',
      'T4 Livre',
      'TSH',
    ],
    guia_pdf_path: '/backend/api/exames/gerar_guia_pdf.php?id=2',
    status: 'PENDENTE',
    data_solicitacao: '2026-11-15 10:00:00',
  },
];

// Sugestões rápidas de marcadores clínicos frequentes para diabetes e saúde metabólica
const SUGESTOES_MARCADORES = [
  { nome: 'Hemoglobina Glicada (HbA1c)', unidade: '%', ref: '< 7,0% para DM1' },
  { nome: 'Glicemia em Jejum', unidade: 'mg/dL', ref: '70 a 99 mg/dL' },
  { nome: 'Vitamina D (25-OH)', unidade: 'ng/mL', ref: '> 30 ng/mL' },
  { nome: 'Vitamina B12', unidade: 'pg/mL', ref: '200 a 900 pg/mL' },
  { nome: 'Creatinina', unidade: 'mg/dL', ref: '0,3 a 0,7 mg/dL' },
  { nome: 'Microalbuminúria', unidade: 'mg/g', ref: '< 30 mg/g' },
  { nome: 'TSH', unidade: 'mUI/L', ref: '0,4 a 4,5 mUI/L' },
  { nome: 'Colesterol Total', unidade: 'mg/dL', ref: '< 150 mg/dL' },
];

export default function CentralExames({ perfilSaude, token, usuario }) {
  const [exames, setExames] = useState([]);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Filtro por marcador para acompanhar evolução histórica
  const [filtroMarcador, setFiltroMarcador] = useState('');

  // Controle do modal de cadastro de novo exame
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState('');
  const [sucessoMsg, setSucessoMsg] = useState('');

  // Formulário do novo exame
  const [formLaboratorio, setFormLaboratorio] = useState('');
  const [formDataRealizacao, setFormDataRealizacao] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [formSolicitacaoId, setFormSolicitacaoId] = useState('');
  const [formObservacoes, setFormObservacoes] = useState('');
  const [formArquivo, setFormArquivo] = useState(null);
  const [formMarcadores, setFormMarcadores] = useState([
    { nome_marcador: 'Hemoglobina Glicada (HbA1c)', valor_resultado: '', unidade: '%', valor_referencia: '< 7,0%' },
  ]);

  /**
   * Carrega histórico de exames e solicitações médicas
   */
  const carregarExames = async () => {
    setCarregando(true);
    let carregouApi = false;

    if (token) {
      try {
        const perfilIdParam = perfilSaude?.id ? `?perfil_saude_id=${perfilSaude.id}` : '';
        const res = await fetch(`/backend/api/exames/listar_exames.php${perfilIdParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.sucesso) {
            if (Array.isArray(data.exames) && data.exames.length > 0) {
              setExames(data.exames);
            }
            if (Array.isArray(data.solicitacoes) && data.solicitacoes.length > 0) {
              setSolicitacoes(data.solicitacoes);
            }
            carregouApi = true;
          }
        }
      } catch (err) {
        // Prossegue para o fallback local
      }
    }

    if (!carregouApi) {
      try {
        const localExames = localStorage.getItem('glicocare_exames_lista');
        const localSolic = localStorage.getItem('glicocare_solicitacoes_lista');

        if (localExames) {
          setExames(JSON.parse(localExames));
        } else {
          setExames(EXAMES_DEMO_INICIAIS);
        }

        if (localSolic) {
          setSolicitacoes(JSON.parse(localSolic));
        } else {
          setSolicitacoes(SOLICITACOES_DEMO_INICIAIS);
        }
      } catch (e) {
        setExames(EXAMES_DEMO_INICIAIS);
        setSolicitacoes(SOLICITACOES_DEMO_INICIAIS);
      }
    }

    setCarregando(false);
  };

  useEffect(() => {
    carregarExames();
  }, [token, perfilSaude?.id]);

  /**
   * Adiciona um novo marcador no construtor dinâmico
   */
  const handleAdicionarMarcador = (sugestao = null) => {
    if (sugestao) {
      // Evita duplicar se já existir
      const jaExiste = formMarcadores.some((m) => m.nome_marcador.toLowerCase() === sugestao.nome.toLowerCase());
      if (jaExiste) return;

      setFormMarcadores((prev) => [
        ...prev,
        {
          nome_marcador: sugestao.nome,
          valor_resultado: '',
          unidade: sugestao.unidade,
          valor_referencia: sugestao.ref,
        },
      ]);
    } else {
      setFormMarcadores((prev) => [
        ...prev,
        { nome_marcador: '', valor_resultado: '', unidade: '', valor_referencia: '' },
      ]);
    }
  };

  /**
   * Atualiza campo de um marcador dinâmico
   */
  const handleAlterarMarcador = (index, campo, valor) => {
    setFormMarcadores((prev) => {
      const atualizados = [...prev];
      atualizados[index] = { ...atualizados[index], [campo]: valor };
      return atualizados;
    });
  };

  /**
   * Remove uma linha de marcador do construtor
   */
  const handleRemoverMarcador = (index) => {
    setFormMarcadores((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Abre o modal já vinculado a uma solicitação pendente
   */
  const handleAbrirParaSolicitacao = (guia) => {
    setFormSolicitacaoId(String(guia.id));
    setFormObservacoes(`Resultado referente à guia médica #${guia.id} emitida por ${guia.especialista_nome}.`);

    // Pré-preenche os marcadores com base nos exames solicitados na guia
    if (Array.isArray(guia.lista_exames_solicitados) && guia.lista_exames_solicitados.length > 0) {
      const preenchidos = guia.lista_exames_solicitados.map((nomeExame) => {
        const match = SUGESTOES_MARCADORES.find((s) => s.nome.toLowerCase().includes(nomeExame.toLowerCase()) || nomeExame.toLowerCase().includes(s.nome.toLowerCase()));
        return {
          nome_marcador: nomeExame,
          valor_resultado: '',
          unidade: match ? match.unidade : '',
          valor_referencia: match ? match.ref : '',
        };
      });
      setFormMarcadores(preenchidos);
    }

    setModalAberto(true);
  };

  /**
   * Submete o cadastro do exame com laudo e itens
   */
  const handleSalvarExame = async (e) => {
    e.preventDefault();
    setErroForm('');
    setSucessoMsg('');

    if (!formLaboratorio.trim()) {
      setErroForm('Por favor, informe o laboratório ou unidade de saúde da coleta.');
      return;
    }

    if (!formDataRealizacao) {
      setErroForm('Por favor, selecione a data em que o exame foi realizado.');
      return;
    }

    // Valida arquivo se fornecido
    if (formArquivo) {
      const extsValidas = ['pdf', 'jpg', 'jpeg', 'png'];
      const ext = formArquivo.name.split('.').pop().toLowerCase();
      if (!extsValidas.includes(ext)) {
        setErroForm('Formato de arquivo inválido. Permitidos: PDF, JPG, JPEG ou PNG.');
        return;
      }
      if (formArquivo.size > 10 * 1024 * 1024) {
        setErroForm('O laudo excede o limite máximo de 10 MB.');
        return;
      }
    }

    setSalvando(true);

    try {
      const formData = new FormData();
      formData.append('laboratorio', formLaboratorio.trim());
      formData.append('data_realizacao', formDataRealizacao);
      if (formSolicitacaoId) {
        formData.append('solicitacao_id', formSolicitacaoId);
      }
      if (formObservacoes.trim()) {
        formData.append('observacoes_paciente', formObservacoes.trim());
      }
      if (perfilSaude?.id) {
        formData.append('perfil_saude_id', perfilSaude.id);
      }
      if (formArquivo) {
        formData.append('arquivo_laudo', formArquivo);
      }

      // Filtra marcadores válidos
      const marcadoresValidos = formMarcadores.filter(
        (m) => m.nome_marcador.trim() !== '' && m.valor_resultado.trim() !== ''
      );
      formData.append('itens_marcadores', JSON.stringify(marcadoresValidos));

      let salvouViaApi = false;

      if (token) {
        try {
          const res = await fetch('/backend/api/exames/cadastrar_exame.php', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          if (res.ok) {
            const dataRes = await res.json();
            if (dataRes.sucesso) {
              salvouViaApi = true;
            }
          }
        } catch (err) {
          // Prossegue com atualização local
        }
      }

      // Objeto representativo para feedback e atualização imediata na interface
      const novoExameLocal = {
        id: Date.now(),
        perfil_saude_id: perfilSaude?.id || 1,
        solicitacao_id: formSolicitacaoId ? parseInt(formSolicitacaoId, 10) : null,
        solicitacao_titulo: formSolicitacaoId
          ? solicitacoes.find((s) => s.id === parseInt(formSolicitacaoId, 10))?.titulo_pedido || 'Pedido Médico'
          : null,
        laboratorio: formLaboratorio.trim(),
        data_realizacao: formDataRealizacao,
        data_registro_app: new Date().toISOString(),
        arquivo_anexo_path: formArquivo ? URL.createObjectURL(formArquivo) : null,
        arquivo_nome_original: formArquivo ? formArquivo.name : null,
        observacoes_paciente: formObservacoes.trim() || null,
        marcadores: marcadoresValidos.map((m, idx) => ({
          id: Date.now() + idx,
          nome_marcador: m.nome_marcador,
          valor_resultado: m.valor_resultado,
          unidade: m.unidade || '-',
          valor_referencia: m.valor_referencia || null,
        })),
      };

      // Atualiza lista de exames
      const listaAtualizada = [novoExameLocal, ...exames];
      setExames(listaAtualizada);
      localStorage.setItem('glicocare_exames_lista', JSON.stringify(listaAtualizada));

      // Se vinculado a guia, atualiza o status dela para REALIZADO
      if (formSolicitacaoId) {
        const idNum = parseInt(formSolicitacaoId, 10);
        const solicAtualizadas = solicitacoes.map((s) => (s.id === idNum ? { ...s, status: 'REALIZADO' } : s));
        setSolicitacoes(solicAtualizadas);
        localStorage.setItem('glicocare_solicitacoes_lista', JSON.stringify(solicAtualizadas));
      }

      setSucessoMsg('Exame e laudo registrados com sucesso no seu histórico!');
      setTimeout(() => {
        setModalAberto(false);
        setSucessoMsg('');
        // Reseta formulário
        setFormLaboratorio('');
        setFormSolicitacaoId('');
        setFormObservacoes('');
        setFormArquivo(null);
        setFormMarcadores([
          { nome_marcador: 'Hemoglobina Glicada (HbA1c)', valor_resultado: '', unidade: '%', valor_referencia: '< 7,0%' },
        ]);
      }, 1200);
    } catch (err) {
      setErroForm(err.message || 'Erro ao registrar exame.');
    } finally {
      setSalvando(false);
    }
  };

  // Formatação de data acolhedora
  const formatarData = (dataStr) => {
    if (!dataStr) return '—';
    const datePart = dataStr.split(/[\sT]/)[0];
    const partes = datePart.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataStr;
  };

  // Avaliação visual de cores para a HbA1c
  const obterEstiloHbA1c = (valorStr) => {
    const num = parseFloat(valorStr.replace(',', '.'));
    if (isNaN(num)) return { bg: '#EFF7F1', cor: '#285832', texto: 'Registrado' };
    if (num <= 7.0) return { bg: '#EFF7F1', cor: '#285832', texto: 'Meta Atingida (<= 7.0%)' };
    if (num <= 8.0) return { bg: '#FFF8E6', cor: '#B87A00', texto: 'Ajuste Suave (7.1% - 8.0%)' };
    return { bg: '#FDF2F0', cor: '#A23B2A', texto: 'Atenção Clínica (> 8.0%)' };
  };

  // Lista única de marcadores encontrados para os botões de filtro
  const todosMarcadoresUnicos = Array.from(
    new Set(exames.flatMap((e) => (e.marcadores || []).map((m) => m.nome_marcador)))
  );

  // Filtra exames se houver filtro selecionado
  const examesFiltrados = filtroMarcador
    ? exames.filter((e) =>
        (e.marcadores || []).some(
          (m) => m.nome_marcador.toLowerCase() === filtroMarcador.toLowerCase()
        )
      )
    : exames;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* ==================================================================
          CABEÇALHO DA SEÇÃO DE EXAMES
          ================================================================== */}
      <div
        style={{
          backgroundColor: 'var(--cor-superficie)',
          borderRadius: '16px',
          padding: '1.75rem 2rem',
          border: '1px solid rgba(124, 83, 63, 0.15)',
          boxShadow: '0 4px 16px rgba(46, 40, 36, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📑</span>
            <h2 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.6rem', color: 'var(--cor-texto)', margin: 0 }}>
              Central de Exames & Laudos
            </h2>
          </div>
          <p style={{ fontSize: '0.92rem', color: '#5A5049', margin: 0, maxWidth: '680px', lineHeight: 1.5 }}>
            Acompanhe o histórico de exames laboratoriais, acesse as guias emitidas pelos especialistas e anexe laudos
            digitais para manter o cuidado médico totalmente integrado.
          </p>
        </div>

        <Button
          variante="primario"
          onClick={() => {
            setFormSolicitacaoId('');
            setModalAberto(true);
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.92rem' }}
        >
          <span>+</span>
          <span>Registrar Novo Exame</span>
        </Button>
      </div>

      {/* ==================================================================
          BLOCO 1: GUIAS SOLICITADAS PELOS ESPECIALISTAS (RN-EXA-01)
          ================================================================== */}
      <div
        style={{
          backgroundColor: 'var(--cor-superficie)',
          borderRadius: '16px',
          padding: '1.75rem 2rem',
          border: '1px solid rgba(124, 83, 63, 0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.3rem' }}>🩺</span>
            <h3 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.35rem', color: 'var(--cor-texto)', margin: 0 }}>
              Guias Solicitadas pelos Especialistas
            </h3>
          </div>
          <span style={{ fontSize: '0.82rem', color: '#6C625A' }}>
            {solicitacoes.filter((s) => s.status === 'PENDENTE').length} guia(s) aguardando realização
          </span>
        </div>

        {solicitacoes.length === 0 ? (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              backgroundColor: '#FAF8F5',
              borderRadius: '12px',
              border: '1px dashed rgba(124, 83, 63, 0.2)',
              color: '#6A5E57',
            }}
          >
            <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '0.5rem' }}>📋</span>
            <strong>Nenhuma guia médica solicitada no momento.</strong>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.86rem' }}>
              Quando seu médico ou especialista emitir um pedido em teleconsulta, ele aparecerá aqui com opção de download em PDF.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {solicitacoes.map((guia) => {
              const isPendente = guia.status === 'PENDENTE';
              return (
                <div
                  key={guia.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    padding: '1.4rem',
                    border: isPendente ? '1.5px solid #F0C9B6' : '1px solid #D5E8D8',
                    boxShadow: '0 2px 10px rgba(46, 40, 36, 0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div>
                    {/* Status Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '0.25rem 0.65rem',
                          borderRadius: '999px',
                          backgroundColor: isPendente ? '#FFF5F0' : '#EFF7F1',
                          color: isPendente ? '#B84E14' : '#285832',
                          border: isPendente ? '1px solid #F8D2C0' : '1px solid #B8E2BE',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <span>{isPendente ? '⏳' : '✓'}</span>
                        <span>{isPendente ? 'Aguardando Coleta / Laudo' : 'Exame Realizado & Anexado'}</span>
                      </span>

                      <span style={{ fontSize: '0.78rem', color: '#6A5E57' }}>
                        {formatarData(guia.data_solicitacao)}
                      </span>
                    </div>

                    {/* Título do Pedido */}
                    <h4 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.15rem', color: 'var(--cor-primaria)', margin: '0 0 0.35rem 0' }}>
                      {guia.titulo_pedido}
                    </h4>

                    {/* Dados do Especialista */}
                    <p style={{ fontSize: '0.84rem', color: '#5A5049', margin: '0 0 0.85rem 0' }}>
                      👨‍⚕️ <strong>{guia.especialista_nome}</strong> • {guia.especialidade} ({guia.tipo_conselho} {guia.numero_conselho}/{guia.uf_conselho})
                    </p>

                    {/* Lista de Exames Solicitados */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
                      {(guia.lista_exames_solicitados || []).map((nomeExame, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.76rem',
                            backgroundColor: '#F6F3EE',
                            color: '#4A4039',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(124, 83, 63, 0.1)',
                          }}
                        >
                          {nomeExame}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Ações da Guia */}
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', borderTop: '1px solid #F0EAE1', paddingTop: '0.85rem' }}>
                    <a
                      href={`/backend/api/exames/gerar_guia_pdf.php?id=${guia.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none', flex: 1 }}
                    >
                      <Button
                        variante="secundario"
                        style={{ width: '100%', fontSize: '0.82rem', padding: '0.5rem 0.75rem', justifyContent: 'center' }}
                      >
                        📄 Baixar Guia (PDF)
                      </Button>
                    </a>

                    {isPendente && (
                      <Button
                        variante="primario"
                        onClick={() => handleAbrirParaSolicitacao(guia)}
                        style={{ flex: 1, fontSize: '0.82rem', padding: '0.5rem 0.75rem', justifyContent: 'center' }}
                      >
                        📎 Anexar Resultado
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================================================================
          BLOCO 3: LINHA DO TEMPO HISTÓRICA DE EXAMES & EVOLUÇÃO (RN-EXA-01)
          ================================================================== */}
      <div
        style={{
          backgroundColor: 'var(--cor-superficie)',
          borderRadius: '16px',
          padding: '1.75rem 2rem',
          border: '1px solid rgba(124, 83, 63, 0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.35rem', color: 'var(--cor-texto)', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📈</span>
              <span>Linha do Tempo dos Exames Realizados</span>
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#5A5049', margin: 0 }}>
              Acompanhe a curva dos seus marcadores laboratoriais ao longo do tempo.
            </p>
          </div>

          <span style={{ fontSize: '0.82rem', color: '#6C625A' }}>
            {examesFiltrados.length} coleta(s) encontrada(s)
          </span>
        </div>

        {/* Barra de Filtros Rápidos por Marcador Clínico */}
        {todosMarcadoresUnicos.length > 0 && (
          <div
            style={{
              backgroundColor: '#FAF8F5',
              padding: '0.85rem 1.15rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              border: '1px solid #ECE7E0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#5A5049', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              🔍 Filtrar por Marcador:
            </span>

            <button
              type="button"
              onClick={() => setFiltroMarcador('')}
              style={{
                backgroundColor: filtroMarcador === '' ? '#3B7E48' : '#FFFFFF',
                color: filtroMarcador === '' ? '#FFFFFF' : '#4A4039',
                border: '1px solid #D8D0C5',
                padding: '0.3rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Todos os Exames ({exames.length})
            </button>

            {todosMarcadoresUnicos.map((marcador, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setFiltroMarcador(marcador)}
                style={{
                  backgroundColor: filtroMarcador === marcador ? '#7C533F' : '#FFFFFF',
                  color: filtroMarcador === marcador ? '#FFFFFF' : '#4A4039',
                  border: '1px solid #D8D0C5',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {marcador}
              </button>
            ))}
          </div>
        )}

        {/* Linha do Tempo: Cards de Exames com GlicoLoader Skeleton */}
        {carregando ? (
          <GlicoLoader variant="skeleton" tipo="exame" quantidade={2} />
        ) : examesFiltrados.length === 0 ? (
          <div
            style={{
              padding: '2.5rem',
              textAlign: 'center',
              backgroundColor: '#FAF8F5',
              borderRadius: '12px',
              border: '1px dashed rgba(124, 83, 63, 0.2)',
              color: '#6A5E57',
            }}
          >
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>🧪</span>
            <strong>Nenhum exame encontrado com o filtro selecionado.</strong>
            <p style={{ margin: '0.35rem 0 1rem 0', fontSize: '0.88rem' }}>
              Registre sua primeira bateria de exames para começar a acompanhar seu histórico clínico.
            </p>
            <Button
              variante="primario"
              onClick={() => setModalAberto(true)}
              style={{ fontSize: '0.86rem' }}
            >
              + Registrar Exame Agora
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {examesFiltrados.map((exame) => {
              const hbItem = (exame.marcadores || []).find((m) =>
                m.nome_marcador.toLowerCase().includes('hba1c') || m.nome_marcador.toLowerCase().includes('glicada')
              );
              const estiloHb = hbItem ? obterEstiloHbA1c(hbItem.valor_resultado) : null;

              return (
                <div
                  key={exame.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    padding: '1.5rem',
                    border: '1px solid rgba(124, 83, 63, 0.15)',
                    boxShadow: '0 2px 8px rgba(46, 40, 36, 0.03)',
                  }}
                >
                  {/* Cabeçalho do Exame */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid #F0EAE1', paddingBottom: '0.85rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>🔬</span>
                        <h4 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.25rem', color: 'var(--cor-texto)', margin: 0 }}>
                          {exame.laboratorio}
                        </h4>
                        {exame.solicitacao_titulo && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              backgroundColor: '#EFF7F1',
                              color: '#285832',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '6px',
                              fontWeight: 600,
                            }}
                          >
                            Vinculado a: {exame.solicitacao_titulo}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.84rem', color: '#6A5E57' }}>
                        📅 Coleta realizada em <strong>{formatarData(exame.data_realizacao)}</strong>
                      </span>
                    </div>

                    {/* Ação de download do laudo original anexado */}
                    {exame.arquivo_anexo_path ? (
                      <a
                        href={exame.arquivo_anexo_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: 'none' }}
                      >
                        <Button
                          variante="secundario"
                          style={{
                            fontSize: '0.82rem',
                            padding: '0.45rem 0.85rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                          }}
                        >
                          <span>📄</span>
                          <span>Ver Laudo Digital Anexado</span>
                        </Button>
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: '#999', fontStyle: 'italic' }}>
                        Sem anexo digital (registro manual)
                      </span>
                    )}
                  </div>

                  {/* Observações da Família */}
                  {exame.observacoes_paciente && (
                    <div
                      style={{
                        backgroundColor: '#FAF8F5',
                        borderRadius: '8px',
                        padding: '0.75rem 1rem',
                        marginBottom: '1rem',
                        fontSize: '0.86rem',
                        color: '#5A5049',
                        fontStyle: 'italic',
                        borderLeft: '3px solid #7C533F',
                      }}
                    >
                      "{exame.observacoes_paciente}"
                    </div>
                  )}

                  {/* Marcadores e Resultados Clínicos */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    {(exame.marcadores || []).map((m) => {
                      const isFoco = filtroMarcador && m.nome_marcador.toLowerCase() === filtroMarcador.toLowerCase();
                      const isGlicada = m.nome_marcador.toLowerCase().includes('hba1c') || m.nome_marcador.toLowerCase().includes('glicada');

                      return (
                        <div
                          key={m.id}
                          style={{
                            backgroundColor: isFoco ? '#F4EDE3' : '#FAF8F5',
                            border: isFoco ? '1.5px solid #7C533F' : '1px solid #ECE7E0',
                            borderRadius: '10px',
                            padding: '0.85rem 1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.2rem',
                          }}
                        >
                          <span style={{ fontSize: '0.78rem', color: '#6A5E57', fontWeight: 600 }}>
                            {m.nome_marcador}
                          </span>

                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                            <strong style={{ fontSize: '1.25rem', color: isGlicada && estiloHb ? estiloHb.cor : 'var(--cor-texto)' }}>
                              {m.valor_resultado}
                            </strong>
                            <span style={{ fontSize: '0.84rem', color: '#6A5E57' }}>
                              {m.unidade}
                            </span>
                          </div>

                          {m.valor_referencia && (
                            <span style={{ fontSize: '0.72rem', color: '#888', marginTop: '0.15rem' }}>
                              Ref: {m.valor_referencia}
                            </span>
                          )}

                          {isGlicada && estiloHb && (
                            <span
                              style={{
                                marginTop: '0.35rem',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: estiloHb.cor,
                                backgroundColor: estiloHb.bg,
                                padding: '0.15rem 0.45rem',
                                borderRadius: '6px',
                                alignSelf: 'flex-start',
                              }}
                            >
                              {estiloHb.texto}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================================================================
          BLOCO 2: MODAL "+ REGISTRAR NOVO EXAME" (RN-EXA-01)
          ================================================================== */}
      {modalAberto && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(46, 40, 36, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 9999,
            boxSizing: 'border-box',
          }}
          onClick={() => {
            if (!salvando) setModalAberto(false);
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--cor-superficie)',
              borderRadius: '20px',
              padding: 'clamp(1.25rem, 3.5vw, 2.25rem)',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              overflowX: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid rgba(124, 83, 63, 0.2)',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🔬</span>
                <h3 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.5rem', color: 'var(--cor-texto)', margin: 0 }}>
                  Registrar Exame Laboratorial
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                disabled={salvando}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6A5E57',
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#5A5049', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
              Preencha os dados do laboratório, anexe o arquivo PDF ou foto do laudo e insira os principais marcadores
              para que a equipe médica acompanhe seu histórico com tranquilidade.
            </p>

            {/* Mensagem de Erro ou Sucesso */}
            {erroForm && (
              <div
                style={{
                  backgroundColor: '#FDF2F0',
                  border: '1px solid #E06A55',
                  color: '#A23B2A',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.88rem',
                }}
              >
                ⚠️ {erroForm}
              </div>
            )}

            {sucessoMsg && (
              <div
                style={{
                  backgroundColor: '#EFF7F1',
                  border: '1px solid #B8E2BE',
                  color: '#285832',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.88rem',
                }}
              >
                ✓ {sucessoMsg}
              </div>
            )}

            <form onSubmit={handleSalvarExame} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {/* Laboratório */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Laboratório ou Unidade de Saúde *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Delboni, Fleury, Lavoisier ou UBS Central"
                    value={formLaboratorio}
                    onChange={(e) => setFormLaboratorio(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '8px',
                      border: '1px solid #D8D0C5',
                      fontSize: '0.92rem',
                    }}
                  />
                </div>

                {/* Data de Realização */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Data da Coleta / Realização *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDataRealizacao}
                    onChange={(e) => setFormDataRealizacao(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '8px',
                      border: '1px solid #D8D0C5',
                      fontSize: '0.92rem',
                    }}
                  />
                </div>
              </div>

              {/* Vinculação a uma Guia Médica */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Vincular a uma Guia Médica Solicitada (Opcional)
                </label>
                <CustomSelect
                  value={formSolicitacaoId}
                  onChange={(e) => setFormSolicitacaoId(e.target.value)}
                  placeholder="Exame avulso / Sem vínculo com guia específica"
                  options={[
                    { value: '', label: 'Exame avulso / Sem vínculo com guia específica' },
                    ...solicitacoes.map((s) => ({
                      value: s.id,
                      label: `Guia #${s.id}: ${s.titulo_pedido} (${s.especialista_nome} - ${s.status})`,
                      icone: '📋',
                    })),
                  ]}
                />
              </div>

              {/* Upload de Laudo Digital */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Anexar Laudo Digital (PDF, JPG, PNG — até 10 MB)
                </label>
                <div
                  style={{
                    border: '2px dashed #D8D0C5',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    textAlign: 'center',
                    backgroundColor: '#FAF8F5',
                    position: 'relative',
                  }}
                >
                  <input
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/jpg"
                    onChange={(e) => setFormArquivo(e.target.files[0] || null)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.25rem' }}>📎</span>
                  {formArquivo ? (
                    <div>
                      <strong style={{ color: '#3B7E48', fontSize: '0.9rem' }}>
                        Arquivo selecionado: {formArquivo.name}
                      </strong>
                      <span style={{ display: 'block', fontSize: '0.78rem', color: '#6A5E57' }}>
                        {(formArquivo.size / 1024 / 1024).toFixed(2)} MB • Clique para trocar
                      </span>
                    </div>
                  ) : (
                    <div>
                      <strong style={{ color: '#2E2824', fontSize: '0.9rem' }}>
                        Clique ou arraste o arquivo do laudo aqui
                      </strong>
                      <span style={{ display: 'block', fontSize: '0.78rem', color: '#6A5E57' }}>
                        Suporta laudos em PDF emitidos pelos laboratórios ou fotos nítidas dos resultados
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Construtor Dinâmico de Marcadores Clínicos (1:N) */}
              <div
                style={{
                  backgroundColor: '#FAF8F5',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid #ECE7E0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--cor-texto)', display: 'block' }}>
                      Marcadores Clínicos & Resultados
                    </label>
                    <span style={{ fontSize: '0.78rem', color: '#6A5E57' }}>
                      Adicione os valores dos exames para que o sistema gere a linha de evolução histórica.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAdicionarMarcador()}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #3B7E48',
                      color: '#3B7E48',
                      borderRadius: '8px',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    + Novo Marcador
                  </button>
                </div>

                {/* Chips de Sugestão Rápida em 1 Clique */}
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.76rem', color: '#6A5E57', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                    Sugestões rápidas para DM1 (clique para incluir):
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {SUGESTOES_MARCADORES.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAdicionarMarcador(sug)}
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #D8D0C5',
                          borderRadius: '999px',
                          padding: '0.25rem 0.65rem',
                          fontSize: '0.76rem',
                          color: '#4A4039',
                          cursor: 'pointer',
                        }}
                      >
                        + {sug.nome} ({sug.unidade})
                      </button>
                    ))}
                  </div>
                </div>

                {/* ==================================================================
                    INÍCIO DA LISTA DE MARCADORES CLÍNICOS RESPONSIVOS (FLEX-WRAP ANTI-OVERFLOW)
                    Campos adaptáveis (Nome, Valor, Unidade, Referência e Exclusão)
                    com quebra de linha inteligente para eliminar qualquer rolagem horizontal
                    ================================================================== */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%', boxSizing: 'border-box' }}>
                  {formMarcadores.map((item, idx) => (
                    <div
                      key={idx}
                      className="marcador-linha-responsiva"
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        alignItems: 'center',
                        backgroundColor: '#FFFFFF',
                        padding: '0.65rem 0.75rem',
                        borderRadius: '10px',
                        border: '1px solid #E2DBD0',
                        boxSizing: 'border-box',
                        width: '100%',
                      }}
                    >
                      {/* Campo 1: Nome do Marcador (flex-grow generoso para acomodar títulos clínicos) */}
                      <div style={{ flex: '2 1 140px', minWidth: '120px' }}>
                        <input
                          type="text"
                          placeholder="Nome (ex: HbA1c)"
                          value={item.nome_marcador}
                          onChange={(e) => handleAlterarMarcador(idx, 'nome_marcador', e.target.value)}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '0.48rem 0.6rem',
                            borderRadius: '6px',
                            border: '1px solid #D8D0C5',
                            fontSize: '0.84rem',
                          }}
                          aria-label="Nome do marcador clínico"
                        />
                      </div>

                      {/* Campo 2: Valor do Resultado Clínico */}
                      <div style={{ flex: '1 1 80px', minWidth: '70px' }}>
                        <input
                          type="text"
                          placeholder="Valor (ex: 6.8)"
                          value={item.valor_resultado}
                          onChange={(e) => handleAlterarMarcador(idx, 'valor_resultado', e.target.value)}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '0.48rem 0.6rem',
                            borderRadius: '6px',
                            border: '1px solid #D8D0C5',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                          }}
                          aria-label="Valor do resultado"
                        />
                      </div>

                      {/* Campo 3: Unidade de Medida */}
                      <div style={{ flex: '1 1 75px', minWidth: '65px' }}>
                        <input
                          type="text"
                          placeholder="Unid. (%)"
                          value={item.unidade}
                          onChange={(e) => handleAlterarMarcador(idx, 'unidade', e.target.value)}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '0.48rem 0.6rem',
                            borderRadius: '6px',
                            border: '1px solid #D8D0C5',
                            fontSize: '0.84rem',
                          }}
                          aria-label="Unidade de medida"
                        />
                      </div>

                      {/* Campo 4: Valor de Referência Laboratorial */}
                      <div style={{ flex: '1.5 1 110px', minWidth: '95px' }}>
                        <input
                          type="text"
                          placeholder="Ref. (< 7.0%)"
                          value={item.valor_referencia}
                          onChange={(e) => handleAlterarMarcador(idx, 'valor_referencia', e.target.value)}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '0.48rem 0.6rem',
                            borderRadius: '6px',
                            border: '1px solid #D8D0C5',
                            fontSize: '0.84rem',
                          }}
                          aria-label="Valor de referência laboratorial"
                        />
                      </div>

                      {/* Botão de Exclusão do Marcador (Lixeira) */}
                      <button
                        type="button"
                        onClick={() => handleRemoverMarcador(idx)}
                        disabled={formMarcadores.length === 1}
                        style={{
                          flex: '0 0 auto',
                          marginLeft: 'auto',
                          background: 'none',
                          border: 'none',
                          color: '#A23B2A',
                          cursor: formMarcadores.length === 1 ? 'not-allowed' : 'pointer',
                          fontSize: '1.1rem',
                          padding: '0.35rem 0.5rem',
                          opacity: formMarcadores.length === 1 ? 0.35 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title={formMarcadores.length === 1 ? 'Mínimo de 1 marcador obrigatório' : 'Remover este marcador'}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
                {/* FIM DA LISTA DE MARCADORES CLÍNICOS RESPONSIVOS */}
              </div>

              {/* Observações da Coleta */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Observações ou Contexto da Coleta (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Coleta em jejum de 8h sem choro na punção; aplicada dose normal de insulina basal na noite anterior."
                  value={formObservacoes}
                  onChange={(e) => setFormObservacoes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '8px',
                    border: '1px solid #D8D0C5',
                    fontSize: '0.88rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Botões do Rodapé do Modal */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button
                  type="button"
                  variante="secundario"
                  onClick={() => setModalAberto(false)}
                  disabled={salvando}
                  style={{ fontSize: '0.9rem' }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variante="primario"
                  loading={salvando}
                  disabled={salvando}
                  style={{ fontSize: '0.9rem' }}
                >
                  {salvando ? 'Salvando Exame...' : 'Salvar e Anexar Exame'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
