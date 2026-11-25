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

import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { useNotify } from '../context/ToastContext';
import { calcularTempoDiagnostico } from '../utils/dateUtils';
import Button from './Button';
import { Tabs, TabsList, TabsTrigger } from './ui/Tabs';
import logoGlicoCare from '../assets/logo-glicocare.jpg';

export default function CartaoDiagnosticoDownload({
  paciente = {},
  cuidador = null,
  alergias = [],
  medicamentos = [],
  isCuidador = false,
  tituloSecao = 'Cartão de Diagnóstico & Identificação Médica',
  descricaoSecao = 'Mantenha este documento salvo no seu celular ou impresso na carteira para emergências e identificação clínica rápida.',
  exibirCabecalhoSecao = true,
}) {
  const fichaRef = useRef(null);
  const crachaRef = useRef(null);
  const [formatoAtivo, setFormatoAtivo] = useState('ficha'); // 'ficha' | 'cracha'
  const notificar = useNotify();
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

  // Dados do responsável legal (quando aplicável)
  const temCuidador = isCuidador || !!cuidador || !!paciente?.is_menor_12;
  const nomeResponsavel =
    cuidador?.nome_responsavel ||
    cuidador?.nome ||
    paciente?.nome_responsavel ||
    'Mariana Silva';
  const parentesco =
    cuidador?.parentesco ||
    paciente?.parentesco ||
    'Responsável Legal (Mãe)';
  const telefoneEmergencia =
    cuidador?.telefone_emergencia ||
    cuidador?.contato_emergencia_telefone ||
    paciente?.contato_emergencia_telefone ||
    '(11) 97777-2001';

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
          .cartao-grade-parametros {
            grid-template-columns: 1fr !important;
          }
          .cartao-grade-emergencia {
            grid-template-columns: 1fr !important;
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

      {/* SELETOR DE FORMATO DO DOCUMENTO (TABS SHADCN/UI) */}
      <div className="cartao-no-print" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'center' }}>
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
      </div>

      {/* VISÃO 1: FICHA COMPLETA (PANORÂMICA DETALHADA) */}
      {formatoAtivo === 'ficha' && (
        <div
          ref={fichaRef}
          className="cartao-print-active cartao-diagnostico-print-area"
          style={{
            backgroundColor: '#F6F3EE',
            borderRadius: '18px',
            border: '1.5px solid rgba(124, 83, 63, 0.25)',
            padding: '1.75rem',
            maxWidth: '100%',
            boxShadow: '0 8px 24px rgba(46, 40, 36, 0.08)',
            color: '#2E2824',
            fontFamily: 'var(--fonte-corpo, "Plus Jakarta Sans", sans-serif)',
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
        {/* TOPO: IDENTIDADE GLICOCARE E SELO OFICIAL */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1.5px solid rgba(124, 83, 63, 0.2)',
            paddingBottom: '1rem',
            marginBottom: '1.25rem',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src={logoGlicoCare}
              alt="Logo GlicoCare"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1.5px solid #7C533F',
              }}
            />
            <div>
              <div
                style={{
                  fontFamily: 'var(--fonte-titulo, Fraunces)',
                  fontSize: '1.2rem',
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
              padding: '0.35rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.72rem',
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
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C533F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Identificação do Paciente
          </div>
          <div
            style={{
              fontFamily: 'var(--fonte-titulo, Fraunces)',
              fontSize: '1.45rem',
              fontWeight: 800,
              color: '#2E2824',
              lineHeight: 1.2,
              marginTop: '0.15rem',
            }}
          >
            {nomePaciente}
          </div>
          <div style={{ fontSize: '0.84rem', color: '#5A5049', marginTop: '0.2rem' }}>
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

        {/* BLOCO CONDICIONAL DO CUIDADOR / RESPONSÁVEL LEGAL (DESTAQUE) */}
        {temCuidador && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              border: '1.5px solid #3B7E48',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: '#3B7E48', fontWeight: 800, textTransform: 'uppercase' }}>
                🛡️ Responsável Legal / Contato de Emergência
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#2E2824' }}>
                {nomeResponsavel} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#5A5049' }}>({parentesco})</span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(59, 126, 72, 0.1)',
                color: '#285832',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span>📞</span>
              <span>{telefoneEmergencia}</span>
            </div>
          </div>
        )}

        {/* GRADE CLÍNICA: TIPO DE DIABETES, TERAPIA E MONITORAMENTO (3 COLUNAS UNIFORMES) */}
        <div
          className="cartao-grade-parametros"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          {/* Item 1: Tipo & Tempo de Diagnóstico */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '0.75rem 0.9rem',
              borderRadius: '10px',
              border: '1px solid rgba(124, 83, 63, 0.15)',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: '#7C533F', fontWeight: 700, textTransform: 'uppercase' }}>
              Classificação & Diagnóstico
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#2E2824', marginTop: '0.15rem' }}>
              {tipoDiabetes}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#3B7E48', fontWeight: 600, marginTop: '0.2rem' }}>
              🌱 {tempoDiagnosticoExtenso}
            </div>
          </div>

          {/* Item 2: Terapia & Monitoramento */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '0.75rem 0.9rem',
              borderRadius: '10px',
              border: '1px solid rgba(124, 83, 63, 0.15)',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: '#7C533F', fontWeight: 700, textTransform: 'uppercase' }}>
              Terapia & Monitoramento
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#2E2824', marginTop: '0.15rem' }}>
              💉 {terapiaInsulina}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#5A5049', marginTop: '0.2rem' }}>
              📟 {monitoramento}
            </div>
          </div>

          {/* Item 3: Parâmetros Clínicos (FSI e Meta) */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '0.75rem 0.9rem',
              borderRadius: '10px',
              border: '1px solid rgba(124, 83, 63, 0.15)',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: '#7C533F', fontWeight: 700, textTransform: 'uppercase' }}>
              FSI & Glicemia Alvo
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#2E2824', marginTop: '0.15rem' }}>
              🎯 FSI: {fsi}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#5A5049', marginTop: '0.2rem' }}>
              Alvo: {metaGlicemica}
            </div>
          </div>
        </div>

        {/* BLOCO DE ALERTA: ALERGIAS & SENSIBILIDADES CLÍNICAS */}
        <div
          style={{
            backgroundColor: alergias && alergias.length > 0 ? '#FFF5F4' : '#FFFFFF',
            border: `1.5px solid ${alergias && alergias.length > 0 ? '#C94A38' : 'rgba(124, 83, 63, 0.2)'}`,
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '1rem' }}>
              {alergias && alergias.length > 0 ? '⚠️' : '🛡️'}
            </span>
            <span
              style={{
                fontSize: '0.76rem',
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {alergias.map((al, idx) => (
                <span
                  key={al.id || idx}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #C94A38',
                    color: '#942217',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  {al.substancia_ou_item || al.nome || al.substancia}
                  {al.gravidade ? ` (${al.gravidade})` : ''}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.82rem', color: '#5A5049', fontStyle: 'italic' }}>
              Nenhuma alergia alimentar, medicamentosa ou a insumos registrada.
            </div>
          )}
        </div>

        {/* MEDICAMENTOS & INSULINAS EM USO */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            border: '1px solid rgba(124, 83, 63, 0.15)',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#7C533F', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            💊 Medicamentos & Insulinas Ativas
          </div>

          {medicamentos && medicamentos.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.45rem' }}>
              {medicamentos.map((med, idx) => (
                <div
                  key={med.id || idx}
                  style={{
                    fontSize: '0.82rem',
                    color: '#2E2824',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#F6F3EE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <strong>{med.nome_medicamento || med.nome}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#5A5049' }}>
                    {med.dosagem ? `${med.dosagem} ${med.unidade_medida || 'UI'}` : (med.horario_administracao || med.frequencia_uso || 'Conforme prescrição')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.82rem', color: '#5A5049' }}>
              • Insulina Ultrarrápida (Bolus de Refeição e Correção conforme contagem de carboidratos)
              <br />
              • Insulina Basal Diária (Conforme prescrição médica habitual)
            </div>
          )}
        </div>

        {/* PROTOCOLO COMPLETO DE EMERGÊNCIA: HIPOGLICEMIA & HIPERGLICEMIA (2 COLUNAS LADO A LADO) */}
        <div
          className="cartao-grade-emergencia"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          {/* Card 1: Hipoglicemia (< 70 mg/dL) */}
          <div
            style={{
              backgroundColor: '#FFF9F0',
              border: '1.5px solid #C88D2A',
              borderRadius: '10px',
              padding: '0.75rem 0.9rem',
              fontSize: '0.8rem',
              lineHeight: 1.45,
              color: '#2E2824',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.95rem' }}>🚨</span>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#8A5D10', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Hipoglicemia (&lt; 70 mg/dL)
                </span>
              </div>
              <div style={{ marginBottom: '0.35rem', fontSize: '0.78rem' }}>
                <strong>Sinais:</strong> Tremores, sudorese fria, palidez, tontura ou sonolência.
              </div>
              <div style={{ fontSize: '0.78rem' }}>
                <strong>Conduta:</strong> Aplicar a <strong>Regra dos 15g</strong> (1 sachê de mel, 150 ml de suco integral ou 1 colher de sopa de açúcar diluído em água). Aguardar 15 minutos em repouso e medir novamente.
              </div>
            </div>
            <div
              style={{
                marginTop: '0.45rem',
                paddingTop: '0.35rem',
                borderTop: '1px dashed rgba(200, 141, 42, 0.4)',
                fontSize: '0.74rem',
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
              borderRadius: '10px',
              padding: '0.75rem 0.9rem',
              fontSize: '0.8rem',
              lineHeight: 1.45,
              color: '#2E2824',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.95rem' }}>⚠️</span>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#A23B2A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Hiperglicemia (&gt; 250 mg/dL)
                </span>
              </div>
              <div style={{ marginBottom: '0.35rem', fontSize: '0.78rem' }}>
                <strong>Sinais:</strong> Sede intensa, boca seca, vontade frequente de urinar, cansaço ou visão turva.
              </div>
              <div style={{ fontSize: '0.78rem' }}>
                <strong>Conduta:</strong> Oferecer água pura para hidratação, verificar cetonas (se disponível) e checar cateter/aplicação. Realizar correção apenas conforme o <strong>FSI prescrito</strong> (respeitando a insulina ativa).
              </div>
            </div>
            <div
              style={{
                marginTop: '0.45rem',
                paddingTop: '0.35rem',
                borderTop: '1px dashed rgba(201, 74, 56, 0.4)',
                fontSize: '0.74rem',
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
            fontSize: '0.72rem',
            color: '#6A5E57',
            borderTop: '1px solid rgba(124, 83, 63, 0.15)',
            paddingTop: '0.65rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
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

            {/* Contato de Emergência */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1.5px solid #3B7E48',
                padding: '6px 8px',
                marginTop: '3px',
              }}
            >
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#3B7E48', textTransform: 'uppercase' }}>
                📞 Contato de Emergência
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2E2824', marginTop: '1px' }}>
                {nomeResponsavel} <span style={{ fontSize: '0.66rem', fontWeight: 500, color: '#5A5049' }}>({parentesco})</span>
              </div>
              <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#285832', letterSpacing: '0.02em', marginTop: '1px' }}>
                {telefoneEmergencia}
              </div>
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

      {/* BOTÕES DE AÇÃO ADAPTADOS AO FORMATO ATIVO */}
      <div
        className="cartao-no-print"
        style={{
          display: 'flex',
          gap: '0.75rem',
          marginTop: '1.25rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <Button
          variante="cta"
          onClick={handleBaixarPNG}
          loading={gerandoImagem}
          disabled={gerandoImagem}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.3rem',
            fontWeight: 700,
            fontSize: '0.88rem',
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
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.3rem',
            fontWeight: 700,
            fontSize: '0.88rem',
          }}
        >
          <span>🖨️</span>
          <span>
            {formatoAtivo === 'cracha'
              ? 'Imprimir Crachá (Tamanho Real)'
              : 'Salvar PDF / Imprimir'}
          </span>
        </Button>

        <span style={{ fontSize: '0.8rem', color: '#6A5E57' }}>
          {formatoAtivo === 'cracha'
            ? '💡 Dimensão exata 54×86mm para porta-crachá CR80 de pescoço, mochila ou carteira.'
            : '💡 Ideal para salvar no álbum do celular ou na tela bloqueada para emergências.'}
        </span>
      </div>
    </div>
  );
}

/* FIM DO COMPONENTE CARTÃO DE DIAGNÓSTICO PARA DOWNLOAD */
