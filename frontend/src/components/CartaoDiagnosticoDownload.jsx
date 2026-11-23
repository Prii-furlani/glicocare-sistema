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
import logoGlicoCare from '../assets/logo-glicocare.jpg';

export default function CartaoDiagnosticoDownload({
  paciente = {},
  cuidador = null,
  alergias = [],
  medicamentos = [],
  isCuidador = false,
  tituloSecao = 'Cartão de Diagnóstico & Identificação Médica',
  descricaoSecao = 'Mantenha este documento salvo no seu celular ou impresso na carteira para emergências e identificação clínica rápida.',
}) {
  const cardRef = useRef(null);
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

  // 1. Download do Card em PNG (html2canvas)
  const handleBaixarPNG = async () => {
    if (!cardRef.current) return;
    setGerandoImagem(true);

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // 2x para nitidez em telas retina e celulares
        useCORS: true,
        backgroundColor: '#F6F3EE', // Garante o fundo marfim acolhedor no PNG
        logging: false,
        windowWidth: 1200,
      });

      const imagemData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const nomeLimpo = nomePaciente.toLowerCase().replace(/[^a-z0-9]/g, '-');
      link.download = `cartao-diagnostico-glicocare-${nomeLimpo}.png`;
      link.href = imagemData;
      link.click();

      notificar.sucesso('Cartão de diagnóstico pronto!');
    } catch (err) {
      console.error('Erro ao gerar PNG do cartão:', err);
      notificar.erro('Não foi possível gerar a imagem do cartão. Tente novamente.');
    } finally {
      setGerandoImagem(false);
    }
  };

  // 2. Impressão / Salvar em PDF nativo via window.print()
  const handleImprimirPDF = () => {
    window.print();
  };

  return (
    <div style={{ marginTop: '2rem', marginBottom: '2.5rem' }}>
      {/* ESTILOS DE IMPRESSÃO DEDICADOS (@media print) */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .cartao-diagnostico-print-area,
          .cartao-diagnostico-print-area * {
            visibility: visible !important;
          }
          .cartao-diagnostico-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: 2px solid #2E2824 !important;
            background-color: #FFFFFF !important;
            margin: 0 !important;
            padding: 1.5rem !important;
          }
          .cartao-no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* CABEÇALHO DA SEÇÃO DE APRESENTAÇÃO */}
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

      {/* PREVIEW DO CARD OFICIAL (ALVO DE CAPTURA DO HTML2CANVAS E IMPRESSÃO) */}
      <div
        ref={cardRef}
        className="cartao-diagnostico-print-area"
        style={{
          backgroundColor: '#F6F3EE',
          borderRadius: '18px',
          border: '1.5px solid rgba(124, 83, 63, 0.25)',
          padding: '1.75rem',
          maxWidth: '680px',
          boxShadow: '0 8px 24px rgba(46, 40, 36, 0.08)',
          color: '#2E2824',
          fontFamily: 'var(--fonte-corpo, "Plus Jakarta Sans", sans-serif)',
          position: 'relative',
          overflow: 'hidden',
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

        {/* GRADE CLÍNICA: TIPO DE DIABETES, TERAPIA E MONITORAMENTO */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#2E2824', marginTop: '0.15rem' }}>
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

        {/* ORIENTAÇÃO EMERGENCIAL DE SEGURANÇA: REGRA DOS 15G */}
        <div
          style={{
            backgroundColor: '#FFF4E5',
            border: '1.5px solid #C88D2A',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            fontSize: '0.82rem',
            lineHeight: 1.45,
            color: '#8A5D10',
          }}
        >
          <strong>🚨 EM CASO DE HIPOGLICEMIA (&lt; 70 mg/dL, tremores, sudorese fria ou sonolência):</strong>
          <div style={{ marginTop: '0.2rem', color: '#2E2824' }}>
            Aplicar a <strong>Regra dos 15g</strong> imediatamente: ingerir 15g de carboidrato simples (1 sachê de mel, 150ml de suco integral ou 1 colher de sopa de açúcar diluído em água). Aguardar 15 minutos em repouso e medir novamente. <strong>NUNCA aplique insulina durante um episódio de hipoglicemia.</strong>
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

      {/* BOTÕES DE AÇÃO: BAIXAR PNG E SALVAR PDF / IMPRIMIR */}
      <div
        className="cartao-no-print"
        style={{
          display: 'flex',
          gap: '0.85rem',
          marginTop: '1.25rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <Button
          variante="primario"
          onClick={handleBaixarPNG}
          loading={gerandoImagem}
          disabled={gerandoImagem}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.4rem',
            fontWeight: 700,
          }}
        >
          <span>🖼️</span>
          <span>{gerandoImagem ? 'Gerando Imagem...' : 'Baixar Card (PNG)'}</span>
        </Button>

        <Button
          variante="secundario"
          onClick={handleImprimirPDF}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.4rem',
            fontWeight: 700,
          }}
        >
          <span>🖨️</span>
          <span>Salvar PDF / Imprimir</span>
        </Button>

        <span style={{ fontSize: '0.8rem', color: '#6A5E57' }}>
          💡 Ideal para salvar no álbum do celular ou na tela bloqueada para emergências.
        </span>
      </div>
    </div>
  );
}

/* FIM DO COMPONENTE CARTÃO DE DIAGNÓSTICO PARA DOWNLOAD */
