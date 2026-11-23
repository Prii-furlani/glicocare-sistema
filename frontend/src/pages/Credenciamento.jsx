/* ==========================================================================
   ARQUIVO: Credenciamento.jsx
   PÁGINA: Credenciamento ("Módulo de Credenciamento de Profissionais e
   Especialistas GlicoCare" — RN-MOD-MKT)
   OBJETIVO: Desenvolver o design e a estrutura funcional completa do sistema
   de credenciamento de especialistas no ecossistema de saúde integrada DM1:
   1. Diretrizes de Design: Paleta oficial (#EAE4D9, #F6F3EE, #2E2824, #7C533F,
      #3B7E48) e tipografia Fraunces + Plus Jakarta Sans;
   2. Pré-requisitos Obrigatórios: Validação de Conselho Ativo com upload de
      comprovante, Foco em DM1 e Aceite de Exclusividade Financeira Interna;
   3. Formulário "Seja um Especialista GlicoCare" dividido nas 4 Seções:
      - Seção 1: Dados Pessoais e Contato (Nome, E-mail, WhatsApp, Upload Foto);
      - Seção 2: Habilitação e Registro (Especialidade, Conselho + UF, Anexo);
      - Seção 3: Posicionamento e Vitrine (Tags DM1, Resumo do Card, Sobre o Método);
      - Seção 4: Configuração Comercial e Agenda (Valor R$, Duração 30/50/60 min,
        Disponibilidade Inicial de Horários);
   4. Workflow Interativo das 4 Etapas (Etapa 1: Submissão -> Etapa 2: Moderação
      Back-Office -> Etapa 3: Aprovação "Registro Verificado = True" + Slug/ID
      -> Etapa 4: Painel de Gestão de Agenda em Tempo Real).
   ========================================================================== */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { especialistasService } from '../services/api';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import { FEATURES } from '../config/features';
import EmPreparacaoLufy from '../components/EmPreparacaoLufy';

/* INÍCIO DAS OPÇÕES DE CONSELHOS, ESPECIALIDADES, FOCOS E HORÁRIOS */
const OPCOES_ESPECIALIDADE_DM1 = [
  {
    valor: 'Endocrinologia',
    rotulo: 'Endocrinologia e Metabologia (Adulto e Pediátrica)',
  },
  {
    valor: 'Nutrição Esportiva e Clínica',
    rotulo: 'Nutrição Clínica, Pediátrica e Esportiva em DM1',
  },
  {
    valor: 'Psicologia Comportamental',
    rotulo: 'Psicologia Comportamental e Acolhimento Familiar em DM1',
  },
  {
    valor: 'Educação Física no DM1',
    rotulo: 'Educação Física e Fisiologia do Exercício no DM1',
  },
  {
    valor: 'Pediatria e Adaptação Escolar',
    rotulo: 'Pediatria & Pedagogia de Inclusão Escolar em DM1',
  },
];

const OPCOES_CONSELHO = [
  { valor: 'CRM', rotulo: 'CRM — Conselho Regional de Medicina' },
  { valor: 'CRN', rotulo: 'CRN — Conselho Regional de Nutrição' },
  { valor: 'CRP', rotulo: 'CRP — Conselho Regional de Psicologia' },
  { valor: 'CREF', rotulo: 'CREF — Conselho Regional de Educação Física' },
];

const TAGS_FOCO_DM1 = [
  'Infância e Adolescência',
  'Ajuste de Insulina',
  'Contagem de Carboidratos',
  'Nutrição Esportiva',
  'Psicologia Comportamental',
  'Emagrecimento',
  'Esporte',
  'Sensores Contínuos & Bombas',
  'Adaptação Escolar',
];

const DIAS_DISPONIBILIDADE_INICIAL = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

const SLOTS_HORARIOS_PADRAO = [
  '08:30',
  '09:30',
  '10:30',
  '14:00',
  '15:30',
  '17:00',
  '18:30',
];

/**
 * Gera o Slug público amigável a partir do nome do especialista (Etapa 3)
 */
function gerarSlugAmigavel(nome, idGerado) {
  const base = (nome || 'especialista-glicocare')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${base}-${idGerado}`;
}
/* FIM DAS CONSTANTES E UTILITÁRIOS */

/* INÍCIO DA PÁGINA DO MÓDULO DE CREDENCIAMENTO */
export default function Credenciamento() {
  /* INÍCIO BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS (COMENTADO PARA LANÇAMENTO FASE 1) */
  if (!FEATURES.TELEMEDICINA_ATIVA) {
    return (
      <EmPreparacaoLufy
        tituloCustomizado="O credenciamento de profissionais está em preparação com carinho."
      />
    );
  }
  /* FIM BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS */

  // Controla a etapa ativa do Workflow (1 = Submissão, 2 = Back-Office, 3 = Ativação/Slug, 4 = Gestão de Agenda)
  const [etapaWorkflow, setEtapaWorkflow] = useState(1);

  // Estado principal do formulário dividido nas 4 seções obrigatórias
  const [form, setForm] = useState({
    // Seção 1: Dados Pessoais e Contato
    nome_completo: '',
    email: '',
    telefone_whatsapp: '',
    foto_preview_url:
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80',
    nome_arquivo_foto: '',

    // Seção 2: Habilitação e Registro
    especialidade: 'Endocrinologia',
    tipo_conselho: 'CRM',
    numero_conselho: '',
    uf_conselho: 'SP',
    nome_arquivo_comprovante: '',

    // Seção 3: Posicionamento e Vitrine
    resumo_curto_card: '',
    biografia_metodo: '',

    // Seção 4: Configuração Comercial e Agenda
    valor_consulta: '280',
    duracao_minutos: '60',
    aceite_exclusividade: false,
  });

  // Tags selecionáveis de foco no DM1 (Seção 3)
  const [tagsSelecionadas, setTagsSelecionadas] = useState([
    'Infância e Adolescência',
    'Ajuste de Insulina',
  ]);

  // Disponibilidade inicial de dias e horários (Seção 4 e Etapa 4)
  const [diasSelecionados, setDiasSelecionados] = useState([
    'Segunda-feira',
    'Quarta-feira',
    'Sexta-feira',
  ]);
  const [horariosSelecionados, setHorariosSelecionados] = useState([
    '09:30',
    '14:00',
    '15:30',
  ]);

  // Dados gerados nas Etapas 2 e 3 (ID, Slug e Status de Registro Verificado)
  const [registroSubmetido, setRegistroSubmetido] = useState({
    id: 105,
    status: 'Pendente de Verificação',
    registroVerificado: false,
    slug: '',
  });

  // Novo horário customizado adicionado na Etapa 4 (Gestão de Agenda em Tempo Real)
  const [novoHorarioEtapa4, setNovoHorarioEtapa4] = useState('');

  // Manipulador de campos de texto, select e checkbox
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Manipulador de upload de Foto Profissional (Seção 1)
  const handleUploadFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setForm((prev) => ({
      ...prev,
      foto_preview_url: localUrl,
      nome_arquivo_foto: file.name,
    }));
  };

  // Manipulador de upload do Comprovante de Registro no Conselho (Seção 2)
  const handleUploadComprovante = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({
      ...prev,
      nome_arquivo_comprovante: `${file.name} (${Math.max(
        1,
        Math.round(file.size / 1024)
      )} KB)`,
    }));
  };

  // Alterna seleção de Tags de Foco em DM1 (Seção 3)
  const handleToggleTag = (tag) => {
    setTagsSelecionadas((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Alterna seleção de Dias da Semana (Seção 4)
  const handleToggleDia = (dia) => {
    setDiasSelecionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

  // Alterna seleção de Horários Livres (Seção 4 / Etapa 4)
  const handleToggleHorario = (hora) => {
    setHorariosSelecionados((prev) =>
      prev.includes(hora) ? prev.filter((h) => h !== hora) : [...prev, hora]
    );
  };

  // ETAPA 1 -> ETAPA 2: Submete o formulário público "Seja um Especialista GlicoCare"
  const handleSubmeterCredenciamento = async (e) => {
    e.preventDefault();
    if (!form.aceite_exclusividade || tagsSelecionadas.length === 0) return;

    const idGerado = Math.floor(105 + Math.random() * 890);

    try {
      await especialistasService.solicitarCredenciamento({
        ...form,
        focos_atuacao: tagsSelecionadas,
        dias_disponiveis: diasSelecionados,
        horarios_disponiveis: horariosSelecionados,
      });
    } catch {
      // Fluxo demonstrativo local caso o servidor PHP não esteja em execução
    }

    setRegistroSubmetido({
      id: idGerado,
      status: 'Pendente de Verificação',
      registroVerificado: false,
      slug: gerarSlugAmigavel(form.nome_completo, idGerado),
    });

    // Avança para a Etapa 2 (Moderação Administrativa no Back-Office)
    setEtapaWorkflow(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ETAPA 2 -> ETAPA 3: Equipe administrativa aprova o registro no Back-Office
  const handleAprovarNoBackOffice = () => {
    const slugOficial = gerarSlugAmigavel(
      form.nome_completo || 'Dra. Helena Vasconcelos',
      registroSubmetido.id
    );
    setRegistroSubmetido((prev) => ({
      ...prev,
      status: 'Aprovado e Publicado',
      registroVerificado: true,
      slug: slugOficial,
    }));
    setEtapaWorkflow(3);
  };

  // Adiciona novo horário livre em tempo real na Etapa 4
  const handleAdicionarHorarioEtapa4 = (e) => {
    e.preventDefault();
    if (!novoHorarioEtapa4.trim()) return;
    if (!horariosSelecionados.includes(novoHorarioEtapa4.trim())) {
      setHorariosSelecionados((prev) => [...prev, novoHorarioEtapa4.trim()]);
    }
    setNovoHorarioEtapa4('');
  };

  // Cálculo financeiro transparente (Exclusividade Financeira Interna)
  const valorNum = Math.max(0, Number(form.valor_consulta) || 0);
  const taxaGlicoCare = (valorNum * 0.12).toFixed(2);
  const repasseLiquido = (valorNum * 0.88).toFixed(2);

  return (
    <div
      className="container"
      style={{
        paddingTop: 'var(--espaco-xl)',
        paddingBottom: 'var(--espaco-2xl)',
        maxWidth: 1060,
      }}
    >
      {/* Link de retorno para a Rede de Especialistas */}
      <Link
        to="/especialistas"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          marginBottom: '1.25rem',
          fontWeight: 700,
          fontSize: '0.92rem',
          color: 'var(--cor-primaria)',
        }}
      >
        ← Voltar para a vitrine pública da Rede de Especialistas
      </Link>

      {/* ====================================================================
          CABEÇALHO INSTITUCIONAL DO MÓDULO DE CREDENCIAMENTO
          ==================================================================== */}
      <header style={{ marginBottom: '2rem' }}>
        <div className="section-line-eyebrow">
          ECOSSISTEMA DE SAÚDE INTEGRADA • SEJA UM ESPECIALISTA GLICOCARE
        </div>
        <h1 style={{ fontSize: 'var(--tamanho-h2)', marginBottom: '0.75rem' }}>
          Módulo de Credenciamento de{' '}
          <span className="texto-italico-terracota">
            Profissionais e Especialistas.
          </span>
        </h1>
        <p
          style={{
            fontSize: '1.05rem',
            color: 'var(--cor-texto-suave)',
            lineHeight: 1.65,
            maxWidth: 780,
          }}
        >
          Garantimos rigor técnico, segurança jurídica, validação de conselho de
          classe ativo (CRM, CRN, CREF, CRP) e uma experiência acolhedora para
          conectar especialistas em Diabetes Tipo 1 às famílias de todo o Brasil.
        </p>
      </header>

      {/* ====================================================================
          BARRA VISUAL INTERATIVA DO WORKFLOW DE 4 ETAPAS
          ==================================================================== */}
      <nav
        aria-label="Fluxo do Processo de Credenciamento em 4 Etapas"
        style={{
          backgroundColor: 'var(--cor-superficie)', // #F6F3EE
          border: '1px solid var(--cor-borda-suave)',
          borderRadius: '20px',
          padding: '1.35rem 1.5rem',
          marginBottom: '2.25rem',
          boxShadow: 'var(--sombra-card)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--cor-primaria)',
            }}
          >
            FLUXO DO PROCESSO DE CREDENCIAMENTO (WORKFLOW INTERATIVO)
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--cor-texto-suave)' }}>
            Clique nas etapas abaixo para inspecionar cada fase do sistema
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '0.75rem',
          }}
        >
          {[
            {
              num: 1,
              titulo: 'Etapa 1: Submissão',
              sub: 'Formulário público → Status "Pendente de Verificação"',
            },
            {
              num: 2,
              titulo: 'Etapa 2: Moderação Back-Office',
              sub: 'Conferência documental e validação do conselho ativo',
            },
            {
              num: 3,
              titulo: 'Etapa 3: Aprovação e Ativação',
              sub: '"Registro Verificado = True", Slug/ID e publicação',
            },
            {
              num: 4,
              titulo: 'Etapa 4: Gestão de Agenda',
              sub: 'Painel de horários livres em tempo real e vídeo nativo',
            },
          ].map((passo) => {
            const ativo = etapaWorkflow === passo.num;
            const concluido = etapaWorkflow > passo.num;
            return (
              <button
                key={passo.num}
                type="button"
                onClick={() => setEtapaWorkflow(passo.num)}
                style={{
                  textAlign: 'left',
                  padding: '0.9rem 1rem',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  fontFamily: 'var(--fonte-corpo)',
                  border: ativo
                    ? '2px solid var(--cor-cta)'
                    : concluido
                    ? '1.5px solid var(--cor-primaria)'
                    : '1px solid var(--cor-borda)',
                  backgroundColor: ativo
                    ? '#E8F2E8'
                    : concluido
                    ? '#F3EDE4'
                    : 'var(--cor-fundo)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.25rem',
                  }}
                >
                  <strong
                    style={{
                      fontSize: '0.86rem',
                      color: ativo ? 'var(--cor-cta)' : 'var(--cor-texto)',
                    }}
                  >
                    {passo.titulo}
                  </strong>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: ativo
                        ? 'var(--cor-cta)'
                        : concluido
                        ? 'var(--cor-primaria)'
                        : 'var(--cor-texto-suave)',
                    }}
                  >
                    {concluido ? '✓ Concluída' : ativo ? '● Ativa' : `0${passo.num}`}
                  </span>
                </div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.76rem',
                    lineHeight: 1.4,
                    color: 'var(--cor-texto-suave)',
                  }}
                >
                  {passo.sub}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ====================================================================
          ETAPA 1 DO WORKFLOW: FORMULÁRIO PÚBLICO "SEJA UM ESPECIALISTA GLICOCARE"
          (Dividido nas 4 Seções Obrigatórias + Pré-visualização ao Vivo)
          ==================================================================== */}
      {etapaWorkflow === 1 && (
        <form onSubmit={handleSubmeterCredenciamento}>
          {/* SEÇÃO 1: DADOS PESSOAIS E CONTATO */}
          <section
            className="gc-card"
            style={{ padding: '2.25rem', marginBottom: '1.75rem' }}
          >
            <div className="section-line-eyebrow">SEÇÃO 1 DE 4 • IDENTIFICAÇÃO</div>
            <h2 style={{ fontSize: '1.65rem', marginBottom: '0.35rem' }}>
              1. Dados Pessoais e{' '}
              <span className="texto-italico-terracota">Contato</span>
            </h2>
            <p
              style={{
                fontSize: '0.92rem',
                color: 'var(--cor-texto-suave)',
                marginBottom: '1.5rem',
              }}
            >
              Informe seus dados oficiais de identificação e envie sua foto
              profissional para exibição na vitrine da Rede de Especialistas.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.1rem',
              }}
            >
              <FormInput
                name="nome_completo"
                label="Nome Completo do Profissional"
                placeholder="Ex: Dra. Helena Vasconcelos"
                value={form.nome_completo}
                onChange={handleChange}
                obrigatorio
              />

              <FormInput
                name="email"
                tipo="email"
                label="E-mail Profissional"
                placeholder="helena.endo@exemplo.com.br"
                value={form.email}
                onChange={handleChange}
                obrigatorio
              />

              <FormInput
                name="telefone_whatsapp"
                label="Telefone / WhatsApp com DDD"
                placeholder="Ex: (11) 99876-5432"
                value={form.telefone_whatsapp}
                onChange={handleChange}
                obrigatorio
              />
            </div>

            {/* Upload de Foto Profissional com Preview Redondo */}
            <div
              style={{
                marginTop: '0.75rem',
                backgroundColor: 'var(--cor-fundo)',
                border: '1px dashed var(--cor-borda)',
                borderRadius: '16px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1.35rem',
                flexWrap: 'wrap',
              }}
            >
              <img
                src={form.foto_preview_url}
                alt="Prévia da foto profissional"
                style={{
                  width: 78,
                  height: 78,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--cor-superficie)',
                  boxShadow: '0 4px 12px rgba(46, 40, 36, 0.1)',
                }}
              />
              <div style={{ flex: 1, minWidth: 220 }}>
                <label
                  htmlFor="upload-foto-profissional"
                  className="gc-label"
                  style={{ display: 'block', marginBottom: '0.3rem' }}
                >
                  Foto Profissional (Upload JPG ou PNG) *
                </label>
                <p
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--cor-texto-suave)',
                    marginBottom: '0.6rem',
                  }}
                >
                  Escolha uma foto acolhedora, bem iluminada e com fundo neutro.
                </p>
                <input
                  id="upload-foto-profissional"
                  type="file"
                  accept="image/*"
                  onChange={handleUploadFoto}
                  style={{ fontSize: '0.84rem' }}
                />
                {form.nome_arquivo_foto && (
                  <span
                    style={{
                      display: 'block',
                      marginTop: '0.35rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--cor-cta)',
                    }}
                  >
                    ✓ Foto carregada: {form.nome_arquivo_foto}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* SEÇÃO 2: HABILITAÇÃO E REGISTRO PROFISSIONAL ATIVO */}
          <section
            className="gc-card"
            style={{ padding: '2.25rem', marginBottom: '1.75rem' }}
          >
            <div className="section-line-eyebrow">
              SEÇÃO 2 DE 4 • VALIDAÇÃO DE CONSELHO ATIVO
            </div>
            <h2 style={{ fontSize: '1.65rem', marginBottom: '0.35rem' }}>
              2. Habilitação e{' '}
              <span className="texto-italico-terracota">
                Registro Profissional
              </span>
            </h2>
            <p
              style={{
                fontSize: '0.92rem',
                color: 'var(--cor-texto-suave)',
                marginBottom: '1.5rem',
              }}
            >
              Todo especialista passa por validação rigorosa de conselho de
              classe ativo (CRM, CRN, CREF, CRP) antes da publicação na vitrine.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.1rem',
              }}
            >
              <FormInput
                name="especialidade"
                tipo="select"
                label="Especialidade Principal com Foco em DM1"
                value={form.especialidade}
                onChange={handleChange}
                opcoes={OPCOES_ESPECIALIDADE_DM1}
                obrigatorio
              />

              <FormInput
                name="tipo_conselho"
                tipo="select"
                label="Conselho de Classe"
                value={form.tipo_conselho}
                onChange={handleChange}
                opcoes={OPCOES_CONSELHO}
                obrigatorio
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '1.1rem',
              }}
            >
              <FormInput
                name="numero_conselho"
                label="Número do Registro Profissional"
                placeholder="Ex: 184.290"
                value={form.numero_conselho}
                onChange={handleChange}
                obrigatorio
              />

              <FormInput
                name="uf_conselho"
                label="UF do Conselho"
                placeholder="Ex: SP"
                maxLength={2}
                value={form.uf_conselho}
                onChange={handleChange}
                obrigatorio
              />
            </div>

            {/* Anexo do Comprovante de Registro Profissional Ativo */}
            <div
              style={{
                marginTop: '0.5rem',
                backgroundColor: 'var(--cor-fundo)',
                border: '1px dashed var(--cor-primaria)',
                borderRadius: '16px',
                padding: '1.25rem 1.5rem',
              }}
            >
              <label
                htmlFor="upload-comprovante-conselho"
                className="gc-label"
                style={{ display: 'block', marginBottom: '0.3rem' }}
              >
                Anexo do Comprovante de Registro Ativo (Carteira do Conselho ou
                Certidão de Regularidade — PDF, JPG ou PNG) *
              </label>
              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--cor-texto-suave)',
                  marginBottom: '0.65rem',
                }}
              >
                Este documento é conferido exclusivamente pela equipe de
                moderação administrativa da GlicoCare (Etapa 2).
              </p>
              <input
                id="upload-comprovante-conselho"
                type="file"
                accept=".pdf,image/*"
                onChange={handleUploadComprovante}
                style={{ fontSize: '0.84rem' }}
              />
              {form.nome_arquivo_comprovante && (
                <span
                  style={{
                    display: 'block',
                    marginTop: '0.45rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--cor-cta)',
                  }}
                >
                  ✓ Comprovante anexado: {form.nome_arquivo_comprovante}
                </span>
              )}
            </div>
          </section>

          {/* SEÇÃO 3: POSICIONAMENTO E VITRINE */}
          <section
            className="gc-card"
            style={{ padding: '2.25rem', marginBottom: '1.75rem' }}
          >
            <div className="section-line-eyebrow">
              SEÇÃO 3 DE 4 • POSICIONAMENTO & ABORDAGEM HUMANIZADA
            </div>
            <h2 style={{ fontSize: '1.65rem', marginBottom: '0.35rem' }}>
              3. Posicionamento e{' '}
              <span className="texto-italico-terracota">Vitrine</span>
            </h2>
            <p
              style={{
                fontSize: '0.92rem',
                color: 'var(--cor-texto-suave)',
                marginBottom: '1.5rem',
              }}
            >
              Destaque suas subespecialidades no manejo do Diabetes Tipo 1 e
              apresente sua filosofia de acolhimento para as famílias.
            </p>

            {/* Tags selecionáveis de Foco de Atendimento */}
            <div className="gc-form-group" style={{ marginBottom: '1.35rem' }}>
              <span className="gc-label">
                Focos de Atendimento em DM1 (Tags selecionáveis para os filtros
                da vitrine) *
              </span>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginTop: '0.4rem',
                }}
              >
                {TAGS_FOCO_DM1.map((tag) => {
                  const selecionada = tagsSelecionadas.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      style={{
                        borderRadius: 'var(--raio-pilula)',
                        padding: '0.45rem 0.95rem',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: selecionada
                          ? '1.5px solid var(--cor-cta)'
                          : '1px solid var(--cor-borda)',
                        backgroundColor: selecionada
                          ? 'var(--cor-cta)'
                          : 'var(--cor-fundo)',
                        color: selecionada
                          ? 'var(--cor-branco)'
                          : 'var(--cor-texto)',
                      }}
                    >
                      {selecionada ? `✓ #${tag}` : `+ #${tag}`}
                    </button>
                  );
                })}
              </div>
            </div>

            <FormInput
              name="resumo_curto_card"
              label="Resumo Curto para o Card de Listagem (até 160 caracteres)"
              placeholder="Ex: Endocrinologia pediátrica e do adulto com foco em leitura de sensores, ajuste fino de insulina e plano escolar."
              maxLength={160}
              value={form.resumo_curto_card}
              onChange={handleChange}
              obrigatorio
            />

            <FormInput
              name="biografia_metodo"
              tipo="textarea"
              label='Texto Detalhado "Sobre o Método" (Filosofia de Atendimento Humanizado)'
              placeholder="Conte com calma como funciona sua consulta, como você acolhe o momento pós-diagnóstico e apoia a autonomia da família..."
              value={form.biografia_metodo}
              onChange={handleChange}
              obrigatorio
            />
          </section>

          {/* SEÇÃO 4: CONFIGURAÇÃO COMERCIAL, AGENDA E EXCLUSIVIDADE INTERNA */}
          <section
            className="gc-card"
            style={{ padding: '2.25rem', marginBottom: '1.75rem' }}
          >
            <div className="section-line-eyebrow">
              SEÇÃO 4 DE 4 • COMERCIAL, AGENDA & EXCLUSIVIDADE INTERNA
            </div>
            <h2 style={{ fontSize: '1.65rem', marginBottom: '0.35rem' }}>
              4. Configuração Comercial e{' '}
              <span className="texto-italico-terracota">Agenda Inicial</span>
            </h2>
            <p
              style={{
                fontSize: '0.92rem',
                color: 'var(--cor-texto-suave)',
                marginBottom: '1.5rem',
              }}
            >
              Defina o valor da consulta, a duração estimada e seus horários
              iniciais para o calendário integrado da plataforma.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.1rem',
                marginBottom: '1rem',
              }}
            >
              <FormInput
                name="valor_consulta"
                tipo="number"
                label="Valor da Consulta Online em Reais (R$)"
                placeholder="Ex: 280"
                value={form.valor_consulta}
                onChange={handleChange}
                obrigatorio
              />

              <FormInput
                name="duracao_minutos"
                tipo="select"
                label="Duração Estimada da Consulta (em minutos)"
                value={form.duracao_minutos}
                onChange={handleChange}
                opcoes={[
                  { valor: '30', rotulo: '30 minutos (Consulta de retorno / revisão)' },
                  { valor: '50', rotulo: '50 minutos (Sessão clínica padrão)' },
                  {
                    valor: '60',
                    rotulo: '60 minutos (Consulta integral humanizada — Recomendado)',
                  },
                ]}
                obrigatorio
              />
            </div>

            {/* Simulador de Repasse Interno GlicoCare */}
            <div
              style={{
                backgroundColor: 'var(--cor-fundo)',
                border: '1px solid var(--cor-borda)',
                borderRadius: '14px',
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                fontSize: '0.88rem',
              }}
            >
              <span>
                🔒 <strong>Gateway Interno GlicoCare:</strong> Valor ao paciente{' '}
                <strong>R$ {valorNum.toFixed(2)}</strong> ({form.duracao_minutos}{' '}
                min)
              </span>
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                <span>Taxa Plataforma (12%): R$ {taxaGlicoCare}</span>
                <strong style={{ color: 'var(--cor-cta)' }}>
                  Seu Repasse Líquido (88%): R$ {repasseLiquido}
                </strong>
              </div>
            </div>

            {/* Definição Inicial de Disponibilidade de Dias e Horários */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span
                className="gc-label"
                style={{ display: 'block', marginBottom: '0.45rem' }}
              >
                Dias da Semana para Atendimento Online:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {DIAS_DISPONIBILIDADE_INICIAL.map((dia) => {
                  const ativo = diasSelecionados.includes(dia);
                  return (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => handleToggleDia(dia)}
                      style={{
                        borderRadius: '10px',
                        padding: '0.48rem 0.9rem',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: ativo
                          ? '1.5px solid var(--cor-primaria)'
                          : '1px solid var(--cor-borda)',
                        backgroundColor: ativo
                          ? 'var(--cor-primaria)'
                          : 'var(--cor-fundo)',
                        color: ativo ? 'var(--cor-branco)' : 'var(--cor-texto)',
                      }}
                    >
                      📅 {dia}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <span
                className="gc-label"
                style={{ display: 'block', marginBottom: '0.45rem' }}
              >
                Horários Iniciais Disponíveis na Agenda:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {SLOTS_HORARIOS_PADRAO.map((hora) => {
                  const ativo = horariosSelecionados.includes(hora);
                  return (
                    <button
                      key={hora}
                      type="button"
                      onClick={() => handleToggleHorario(hora)}
                      style={{
                        borderRadius: 'var(--raio-pilula)',
                        padding: '0.45rem 0.95rem',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: ativo
                          ? '1.5px solid var(--cor-cta)'
                          : '1px solid var(--cor-borda)',
                        backgroundColor: ativo
                          ? 'var(--cor-cta)'
                          : 'var(--cor-branco)',
                        color: ativo ? 'var(--cor-branco)' : 'var(--cor-texto)',
                      }}
                    >
                      🕒 {hora}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aceite Contratual de Exclusividade Financeira Interna */}
            <div
              style={{
                backgroundColor: '#EFEAE0',
                border: '1px solid var(--cor-borda)',
                borderRadius: '14px',
                padding: '1.1rem 1.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <FormInput
                name="aceite_exclusividade"
                tipo="checkbox"
                checked={form.aceite_exclusividade}
                onChange={handleChange}
                obrigatorio
                label="Cláusula de Exclusividade Financeira Interna e Validação de Conselho (RN-MOD-MKT): Declaro que meu registro profissional está ativo e aceito contratualmente que todas as consultas, agendamentos, videochamadas e transações financeiras ocorram obrigatoriamente por dentro da plataforma GlicoCare, sendo estritamente vetada qualquer cobrança externa."
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <span style={{ fontSize: '0.82rem', color: 'var(--cor-texto-suave)' }}>
                Ao enviar, seu cadastro entrará na <strong>Etapa 2</strong> com
                status <em>"Pendente de Verificação"</em>.
              </span>

              <Button type="submit" variante="primario" exibirSeta>
                Submeter Credenciamento (Ir para Etapa 2)
              </Button>
            </div>
          </section>
        </form>
      )}

      {/* ====================================================================
          ETAPA 2 DO WORKFLOW: MODERAÇÃO ADMINISTRATIVA (BACK-OFFICE GLICOCARE)
          ==================================================================== */}
      {etapaWorkflow === 2 && (
        <section className="gc-card" style={{ padding: '2.5rem' }}>
          <div className="section-line-eyebrow">
            ETAPA 2 DO WORKFLOW • PAINEL BACK-OFFICE DE MODERAÇÃO ADMINISTRATIVA
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <h2 style={{ fontSize: '1.75rem', margin: 0 }}>
              Análise de Credenciamento{' '}
              <span className="texto-italico-terracota">#{registroSubmetido.id}</span>
            </h2>
            <span
              style={{
                backgroundColor: '#F5E6C8',
                color: '#8A5A19',
                border: '1px solid #DEC28E',
                borderRadius: 'var(--raio-pilula)',
                padding: '0.38rem 0.95rem',
                fontSize: '0.78rem',
                fontWeight: 700,
              }}
            >
              ⏳ Status no Banco: Pendente de Verificação
            </span>
          </div>

          <p
            style={{
              fontSize: '0.95rem',
              color: 'var(--cor-texto-suave)',
              marginBottom: '1.75rem',
            }}
          >
            Abaixo está a visão do painel administrativo da equipe GlicoCare
            para conferência do documento comprobatório e situação ativa no
            conselho profissional antes da publicação.
          </p>

          <div
            style={{
              backgroundColor: 'var(--cor-fundo)',
              border: '1px solid var(--cor-borda)',
              borderRadius: '18px',
              padding: '1.65rem',
              marginBottom: '1.75rem',
              display: 'grid',
              gap: '1rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                flexWrap: 'wrap',
              }}
            >
              <img
                src={form.foto_preview_url}
                alt="Candidato"
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--cor-superficie)',
                }}
              />
              <div>
                <h3 style={{ fontSize: '1.35rem', margin: 0 }}>
                  {form.nome_completo || 'Dra. Helena Vasconcelos'}
                </h3>
                <p
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--cor-primaria)',
                    fontWeight: 700,
                    margin: '0.2rem 0',
                  }}
                >
                  {form.especialidade} • Registro:{' '}
                  {form.tipo_conselho}-{form.uf_conselho}{' '}
                  {form.numero_conselho || '184.290'}
                </p>
                <span style={{ fontSize: '0.82rem', color: 'var(--cor-texto-suave)' }}>
                  📄 Comprovante Anexado:{' '}
                  <strong>
                    {form.nome_arquivo_comprovante ||
                      'certidao_regularidade_conselho.pdf (Validado)'}
                  </strong>
                </span>
              </div>
            </div>

            <div
              style={{
                borderTop: '1px solid var(--cor-borda-suave)',
                paddingTop: '0.85rem',
                fontSize: '0.88rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
              }}
            >
              <div>
                <strong>Registro Verificado:</strong>{' '}
                <span style={{ color: '#8A5A19' }}>False (Aguardando aprovação)</span>
              </div>
              <div>
                <strong>Valor / Duração:</strong> R$ {valorNum.toFixed(2)} (
                {form.duracao_minutos} min)
              </div>
              <div>
                <strong>Exclusividade Interna:</strong> ✓ Aceite Assinado
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Button
              variante="primario"
              onClick={handleAprovarNoBackOffice}
            >
              ✓ Validar Conselho e Aprovar Perfil (Ir para Etapa 3)
            </Button>
            <Button
              variante="secundario"
              onClick={() => setEtapaWorkflow(1)}
            >
              ← Voltar ao Formulário (Etapa 1)
            </Button>
          </div>
        </section>
      )}

      {/* ====================================================================
          ETAPA 3 DO WORKFLOW: APROVAÇÃO E ATIVAÇÃO ("Registro Verificado = True",
          Geração de Slug/ID e Publicação Automática na Vitrine)
          ==================================================================== */}
      {etapaWorkflow === 3 && (
        <section className="gc-card" style={{ padding: '2.5rem' }}>
          <div className="section-line-eyebrow">
            ETAPA 3 DO WORKFLOW • APROVAÇÃO E PUBLICAÇÃO AUTOMÁTICA
          </div>
          <div
            style={{
              backgroundColor: 'var(--cor-cta-suave)',
              border: '1.5px solid var(--cor-cta)',
              borderRadius: '18px',
              padding: '1.5rem 1.75rem',
              marginBottom: '2rem',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                backgroundColor: 'var(--cor-cta)',
                color: 'var(--cor-branco)',
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '0.28rem 0.85rem',
                borderRadius: 'var(--raio-pilula)',
                marginBottom: '0.65rem',
              }}
            >
              ✓ REGISTRO VERIFICADO = TRUE • PERFIL ATIVO NA VITRINE
            </span>
            <h2 style={{ fontSize: '1.65rem', marginBottom: '0.45rem' }}>
              Especialista Credenciado e Publicado com Sucesso!
            </h2>
            <p style={{ fontSize: '0.92rem', margin: 0, lineHeight: 1.6 }}>
              O sistema atualizou o status para{' '}
              <code>Registro Verificado = True</code>, gerou o identificador
              único <strong>ID #{registroSubmetido.id}</strong> e o Slug público{' '}
              <code>
                /especialistas/
                {registroSubmetido.slug ||
                  gerarSlugAmigavel(
                    form.nome_completo || 'dra-helena-vasconcelos',
                    registroSubmetido.id
                  )}
              </code>
              .
            </p>
          </div>

          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
            Prévia do Card Publicado Automaticamente na Listagem Pública:
          </h3>

          {/* Card publicado na vitrine com os dados recém-aprovados */}
          <div style={{ maxWidth: 480, marginBottom: '2rem' }}>
            <article
              className="especialista-card"
              style={{ backgroundColor: 'var(--cor-fundo)' }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                  }}
                >
                  <img
                    src={form.foto_preview_url}
                    alt={form.nome_completo || 'Especialista GlicoCare'}
                    style={{
                      width: 82,
                      height: 82,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid var(--cor-superficie)',
                    }}
                  />
                  <span
                    style={{
                      backgroundColor: '#E4EFE4',
                      color: 'var(--cor-cta)',
                      border: '1px solid #BCD5BF',
                      borderRadius: 'var(--raio-pilula)',
                      padding: '0.3rem 0.75rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                    }}
                  >
                    ✓ Conselho Verificado
                  </span>
                </div>

                <span
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--cor-primaria)',
                    marginBottom: '0.25rem',
                  }}
                >
                  {form.especialidade}
                </span>

                <h4 style={{ fontSize: '1.45rem', marginBottom: '0.2rem' }}>
                  {form.nome_completo || 'Dra. Helena Vasconcelos'}
                </h4>

                <p
                  style={{
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: 'var(--cor-texto-suave)',
                    marginBottom: '0.75rem',
                  }}
                >
                  Registro ativo: {form.tipo_conselho}-{form.uf_conselho}{' '}
                  {form.numero_conselho || '184.290'}
                </p>

                <p style={{ fontSize: '0.88rem', marginBottom: '0.85rem' }}>
                  {form.resumo_curto_card ||
                    'Atendimento humanizado e especializado no manejo integrado do Diabetes Tipo 1.'}
                </p>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.35rem',
                    marginBottom: '1rem',
                  }}
                >
                  {tagsSelecionadas.map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        backgroundColor: 'var(--cor-superficie)',
                        color: 'var(--cor-primaria)',
                        border: '1px solid var(--cor-borda)',
                        borderRadius: 'var(--raio-pilula)',
                        padding: '0.2rem 0.65rem',
                      }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--cor-borda-suave)',
                  paddingTop: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>
                  ★ 5.0 (Novo na Rede)
                </span>
                <span
                  style={{
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: 'var(--cor-cta)',
                  }}
                >
                  R$ {valorNum.toFixed(2)} • {form.duracao_minutos} min
                </span>
              </div>
            </article>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Button
              variante="primario"
              onClick={() => setEtapaWorkflow(4)}
            >
              Acessar Painel de Gestão de Agenda (Etapa 4) →
            </Button>
            <Link
              to="/especialistas"
              className="gc-btn gc-btn--secundario"
            >
              Ver Vitrine Pública de Especialistas ↗
            </Link>
          </div>
        </section>
      )}

      {/* ====================================================================
          ETAPA 4 DO WORKFLOW: PAINEL DO ESPECIALISTA — GESTÃO DE AGENDA EM
          TEMPO REAL E TELECONSULTAS INTEGRADAS
          ==================================================================== */}
      {etapaWorkflow === 4 && (
        <section className="gc-card" style={{ padding: '2.5rem' }}>
          <div className="section-line-eyebrow">
            ETAPA 4 DO WORKFLOW • PAINEL EXCLUSIVO DO ESPECIALISTA CREDENCIADO
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
                Gestão de Agenda em{' '}
                <span className="texto-italico-terracota">Tempo Real</span>
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--cor-texto-suave)', margin: 0 }}>
                Profissional:{' '}
                <strong>{form.nome_completo || 'Dra. Helena Vasconcelos'}</strong>{' '}
                ({form.tipo_conselho}-{form.uf_conselho}{' '}
                {form.numero_conselho || '184.290'}) • Duração padrão:{' '}
                <strong>{form.duracao_minutos} min</strong>
              </p>
            </div>

            <span className="gc-badge" style={{ color: 'var(--cor-cta)' }}>
              ● Agenda Sincronizada com a Vitrine GlicoCare
            </span>
          </div>

          {/* Gerenciador interativo de dias e slots de horários */}
          <div
            style={{
              backgroundColor: 'var(--cor-fundo)',
              border: '1px solid var(--cor-borda)',
              borderRadius: '18px',
              padding: '1.5rem',
              marginBottom: '1.75rem',
            }}
          >
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>
              Seus Dias de Atendimento Ativos (clique para ativar/pausar em tempo real):
            </h3>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: '1.35rem',
              }}
            >
              {DIAS_DISPONIBILIDADE_INICIAL.map((dia) => {
                const ativo = diasSelecionados.includes(dia);
                return (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => handleToggleDia(dia)}
                    style={{
                      borderRadius: '10px',
                      padding: '0.5rem 0.95rem',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: ativo
                        ? '1.5px solid var(--cor-primaria)'
                        : '1px solid var(--cor-borda)',
                      backgroundColor: ativo
                        ? 'var(--cor-primaria)'
                        : 'var(--cor-superficie)',
                      color: ativo ? 'var(--cor-branco)' : 'var(--cor-texto-suave)',
                    }}
                  >
                    {ativo ? `✓ ${dia}` : `+ ${dia}`}
                  </button>
                );
              })}
            </div>

            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>
              Horários Livres Publicados ({horariosSelecionados.length} slots por dia):
            </h3>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              {horariosSelecionados.map((hora) => (
                <button
                  key={hora}
                  type="button"
                  title="Clique para remover este horário"
                  onClick={() => handleToggleHorario(hora)}
                  style={{
                    borderRadius: 'var(--raio-pilula)',
                    padding: '0.45rem 0.95rem',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1.5px solid var(--cor-cta)',
                    backgroundColor: 'var(--cor-cta)',
                    color: 'var(--cor-branco)',
                  }}
                >
                  🕒 {hora} ✕
                </button>
              ))}
            </div>

            <form
              onSubmit={handleAdicionarHorarioEtapa4}
              style={{ display: 'flex', gap: '0.6rem', maxWidth: 420 }}
            >
              <input
                type="text"
                className="gc-input"
                placeholder="Adicionar horário (ex: 11:30)"
                value={novoHorarioEtapa4}
                onChange={(e) => setNovoHorarioEtapa4(e.target.value)}
                style={{ borderRadius: 'var(--raio-pilula)' }}
              />
              <Button type="submit" variante="primario">
                + Liberar Horário
              </Button>
            </form>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <Button
              variante="secundario"
              onClick={() => setEtapaWorkflow(1)}
            >
              ← Voltar para Etapa 1 (Formulário de Credenciamento)
            </Button>

            <Link
              to="/especialistas/2"
              className="gc-btn gc-btn--primario"
            >
              Ver Exemplo de Perfil Público com Agenda e Vídeo ↗
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
/* FIM DA PÁGINA DO MÓDULO DE CREDENCIAMENTO */
