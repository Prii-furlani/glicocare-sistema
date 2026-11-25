/* ==========================================================================
   ARQUIVO: ComparativoExames.jsx
   LOCALIZAÇÃO: /frontend/src/components/ComparativoExames.jsx
   PROJETO: GlicoCare — Apoio em Diabetes & Cuidado Integrado
   OBJETIVO: Componente de análise comparativa de exames laboratoriais,
             com seletor de marcadores em pílulas, Card Hero de comparação
             (Último vs Anterior com delta automático), Gráfico de Evolução
             Temporal em SVG e Tabela Comparativa Consolidada.
   ========================================================================== */

/* INÍCIO DO COMPONENTE COMPARATIVOEXAMES */

import React, { useState, useMemo } from 'react';
import {
  FileText,
  TrendingDown,
  TrendingUp,
  Minus,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ExternalLink,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Button from './Button';

// Dados base de demonstração clínica caso nenhum exame seja passado
export const EXAMES_DEMO_PADRAO = [
  {
    id: 1,
    laboratorio: 'Delboni Auriemo',
    data_realizacao: '2026-10-25',
    arquivo_anexo_path: '/backend/uploads/exames/delboni_laudo_outubro_theo.pdf',
    arquivo_nome_original: 'Laudo_Delboni_Out2026.pdf',
    observacoes: 'Rotina trimestral de controle glicêmico com endocrinologista.',
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
    laboratorio: 'Lavoisier',
    data_realizacao: '2026-07-20',
    arquivo_anexo_path: '/backend/uploads/exames/lavoisier_laudo_julho_theo.pdf',
    arquivo_nome_original: 'Laudo_Lavoisier_Jul2026.pdf',
    observacoes: 'Ajuste de insulina basal após troca de caneta.',
    marcadores: [
      { nome: 'HbA1c (%)', valor: 7.4, unidade: '%', ref: '< 7.0%', meta: 7.0, tipoMenorMelhor: true },
      { nome: 'Glicemia em Jejum', valor: 118, unidade: 'mg/dL', ref: '70–99 mg/dL', meta: 99, tipoMenorMelhor: true },
      { nome: 'Vitamina D (25-OH)', valor: 24.0, unidade: 'ng/mL', ref: '> 30 ng/mL', meta: 30, tipoMenorMelhor: false },
      { nome: 'Creatinina', valor: 0.54, unidade: 'mg/dL', ref: '0.30–0.70 mg/dL', meta: 0.70, tipoMenorMelhor: true },
      { nome: 'TSH', valor: 2.3, unidade: 'mUI/L', ref: '0.4–4.5 mUI/L', meta: 4.5, tipoMenorMelhor: true },
    ],
  },
  {
    id: 3,
    laboratorio: 'Fleury Medicina e Saúde',
    data_realizacao: '2026-04-12',
    arquivo_anexo_path: '/backend/uploads/exames/fleury_abril_2026.pdf',
    arquivo_nome_original: 'Laudo_Fleury_Abr2026.pdf',
    observacoes: 'Checkup inicial do ano.',
    marcadores: [
      { nome: 'HbA1c (%)', valor: 7.9, unidade: '%', ref: '< 7.0%', meta: 7.0, tipoMenorMelhor: true },
      { nome: 'Glicemia em Jejum', valor: 126, unidade: 'mg/dL', ref: '70–99 mg/dL', meta: 99, tipoMenorMelhor: true },
      { nome: 'Vitamina D (25-OH)', valor: 22.0, unidade: 'ng/mL', ref: '> 30 ng/mL', meta: 30, tipoMenorMelhor: false },
      { nome: 'Creatinina', valor: 0.55, unidade: 'mg/dL', ref: '0.30–0.70 mg/dL', meta: 0.70, tipoMenorMelhor: true },
      { nome: 'TSH', valor: 2.4, unidade: 'mUI/L', ref: '0.4–4.5 mUI/L', meta: 4.5, tipoMenorMelhor: true },
    ],
  },
];

export default function ComparativoExames({
  exames = [],
  onNovoExameClick,
}) {
  // Lista normalizada de exames (ordenada do mais recente para o mais antigo)
  const coletasOrdenadas = useMemo(() => {
    const lista = (Array.isArray(exames) && exames.length > 0) ? exames : EXAMES_DEMO_PADRAO;
    return [...lista].sort((a, b) => new Date(b.data_realizacao) - new Date(a.data_realizacao));
  }, [exames]);

  // Marcadores clínicos disponíveis para seleção
  const listaMarcadores = [
    'HbA1c (%)',
    'Glicemia em Jejum',
    'Vitamina D (25-OH)',
    'Creatinina',
    'TSH',
  ];

  const [marcadorAtivo, setMarcadorAtivo] = useState('HbA1c (%)');

  // Coleta mais recente (Atual) e anterior para o comparativo Hero
  const coletaAtual = coletasOrdenadas[0];
  const coletaAnterior = coletasOrdenadas[1] || coletasOrdenadas[0];

  // Extrai dados do marcador ativo em cada coleta
  const extrairMarcador = (coleta, nomeMarcador) => {
    if (!coleta || !Array.isArray(coleta.marcadores)) return null;
    const item = coleta.marcadores.find((m) => {
      const n = (m.nome || m.nome_marcador || '').toLowerCase();
      const procurado = nomeMarcador.toLowerCase();
      if (procurado.includes('hba1c') && n.includes('hba1c')) return true;
      if (procurado.includes('jejum') && n.includes('jejum')) return true;
      if (procurado.includes('vitamina d') && n.includes('vitamina d')) return true;
      if (procurado.includes('creatinina') && n.includes('creatinina')) return true;
      if (procurado.includes('tsh') && n.includes('tsh')) return true;
      return n === procurado;
    });
    if (!item) return null;
    return {
      valor: Number(item.valor ?? item.valor_resultado ?? 0),
      unidade: item.unidade || '',
      ref: item.ref || item.valor_referencia || '',
      meta: item.meta ?? (nomeMarcador.includes('HbA1c') ? 7.0 : nomeMarcador.includes('Jejum') ? 99 : 30),
      tipoMenorMelhor: !nomeMarcador.includes('Vitamina D'),
    };
  };

  const dadoAtual = useMemo(() => extrairMarcador(coletaAtual, marcadorAtivo), [coletaAtual, marcadorAtivo]);
  const dadoAnterior = useMemo(() => extrairMarcador(coletaAnterior, marcadorAtivo), [coletaAnterior, marcadorAtivo]);

  // Cálculo da variação (Delta)
  const comparacao = useMemo(() => {
    if (!dadoAtual || !dadoAnterior) return null;
    const diff = Number((dadoAtual.valor - dadoAnterior.valor).toFixed(2));
    const tipoMenorMelhor = dadoAtual.tipoMenorMelhor;

    // Melhora: se menor é melhor e diminuiu, ou se maior é melhor e aumentou
    const ehMelhora = tipoMenorMelhor ? diff < 0 : diff > 0;
    const estavel = diff === 0;

    let metaAtingida = false;
    if (tipoMenorMelhor) {
      metaAtingida = dadoAtual.valor <= dadoAtual.meta;
    } else {
      metaAtingida = dadoAtual.valor >= dadoAtual.meta;
    }

    return {
      diff,
      diffFormatada: diff > 0 ? `+${diff}` : `${diff}`,
      ehMelhora,
      estavel,
      metaAtingida,
    };
  }, [dadoAtual, dadoAnterior]);

  // Histórico temporal do marcador para desenhar o gráfico SVG
  const pontosHistorico = useMemo(() => {
    return [...coletasOrdenadas]
      .reverse()
      .map((c) => {
        const m = extrairMarcador(c, marcadorAtivo);
        if (!m) return null;
        return {
          data: c.data_realizacao,
          dataFormatada: new Date(c.data_realizacao).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          laboratorio: c.laboratorio || c.nome_laboratorio,
          valor: m.valor,
          unidade: m.unidade,
        };
      })
      .filter(Boolean);
  }, [coletasOrdenadas, marcadorAtivo]);

  // Dimensões do mini-gráfico de evolução
  const chartW = 340;
  const chartH = 130;
  const chartPad = { top: 20, right: 25, bottom: 25, left: 35 };

  const { pathGrafico, pontosSVG, metaY } = useMemo(() => {
    if (pontosHistorico.length === 0) return { pathGrafico: '', pontosSVG: [], metaY: null };

    const valores = pontosHistorico.map((p) => p.valor);
    const metaVal = dadoAtual?.meta ?? 7.0;
    valores.push(metaVal);

    const minVal = Math.min(...valores) * 0.92;
    const maxVal = Math.max(...valores) * 1.08;

    const calcY = (val) => {
      const ratio = (val - minVal) / (maxVal - minVal || 1);
      return chartPad.top + (1 - ratio) * (chartH - chartPad.top - chartPad.bottom);
    };

    const wUtil = chartW - chartPad.left - chartPad.right;
    const calcX = (idx) => {
      if (pontosHistorico.length === 1) return chartPad.left + wUtil / 2;
      return chartPad.left + (idx / (pontosHistorico.length - 1)) * wUtil;
    };

    const pts = pontosHistorico.map((p, idx) => ({
      ...p,
      x: calcX(idx),
      y: calcY(p.valor),
    }));

    let d = '';
    pts.forEach((p, idx) => {
      if (idx === 0) d += `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      else d += ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    });

    return {
      pathGrafico: d,
      pontosSVG: pts,
      metaY: calcY(metaVal),
    };
  }, [pontosHistorico, dadoAtual]);

  // Formatação de data em padrão amigável
  const formatarData = (str) => {
    if (!str) return '';
    try {
      const [ano, mes, dia] = str.split('T')[0].split('-');
      return `${dia}/${mes}/${ano}`;
    } catch {
      return str;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ====================================================================
          1. SELETOR DE MARCADORES EM PÍLULAS
          ==================================================================== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
          backgroundColor: 'var(--cor-superficie)',
          padding: '0.65rem 1rem',
          borderRadius: '12px',
          border: '1px solid var(--cor-borda-suave)',
        }}
      >
        <span
          style={{
            fontSize: '0.76rem',
            fontWeight: 700,
            color: 'var(--cor-primaria)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginRight: '0.25rem',
          }}
        >
          Marcador:
        </span>

        {listaMarcadores.map((m) => {
          const ativo = marcadorAtivo === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMarcadorAtivo(m)}
              style={{
                backgroundColor: ativo ? 'var(--cor-cta)' : 'var(--cor-fundo)',
                color: ativo ? '#FFFFFF' : 'var(--cor-texto)',
                fontWeight: ativo ? 700 : 500,
                fontSize: '0.8rem',
                border: ativo ? '1px solid var(--cor-cta)' : '1px solid var(--cor-borda-suave)',
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              {m}
            </button>
          );
        })}
      </div>

      {/* ====================================================================
          2. CARD HERO DE COMPARAÇÃO (ÚLTIMO EXAME VS ANTERIOR) + MINI GRÁFICO
          ==================================================================== */}
      <div
        style={{
          backgroundColor: 'var(--cor-superficie)',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1px solid var(--cor-borda-suave)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          alignItems: 'center',
        }}
      >
        {/* Lado Esquerdo: Comparativo Numérico Direto */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--cor-primaria)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Comparativo de Evolução • {marcadorAtivo}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            {/* Resultado Anterior */}
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--cor-texto-suave)', display: 'block' }}>
                Coleta Anterior ({formatarData(coletaAnterior?.data_realizacao)})
              </span>
              <div
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  color: 'var(--cor-texto-suave)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {dadoAnterior ? `${dadoAnterior.valor} ${dadoAnterior.unidade}` : '—'}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--cor-texto-suave)' }}>
                {coletaAnterior?.laboratorio || 'Laboratório'}
              </span>
            </div>

            {/* Seta divisora */}
            <div style={{ color: 'var(--cor-primaria)', fontSize: '1.2rem', opacity: 0.5 }}>
              →
            </div>

            {/* Resultado Atual */}
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--cor-cta)', display: 'block', fontWeight: 700 }}>
                Resultado Recente ({formatarData(coletaAtual?.data_realizacao)})
              </span>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: 'var(--cor-texto)',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1.1,
                  fontFamily: 'var(--fonte-corpo)',
                }}
              >
                {dadoAtual ? `${dadoAtual.valor} ${dadoAtual.unidade}` : '—'}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--cor-texto-suave)' }}>
                {coletaAtual?.laboratorio || 'Laboratório'}
              </span>
            </div>
          </div>

          {/* Badge Semântico da Variação e Meta */}
          {comparacao && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.65rem',
                  borderRadius: '999px',
                  backgroundColor: comparacao.ehMelhora ? 'var(--cor-cta-suave)' : '#FDF2F0',
                  color: comparacao.ehMelhora ? 'var(--cor-cta)' : '#A23B2A',
                }}
              >
                {comparacao.ehMelhora ? (
                  <TrendingDown size={14} strokeWidth={2} />
                ) : (
                  <TrendingUp size={14} strokeWidth={2} />
                )}
                {comparacao.diffFormatada} {dadoAtual?.unidade}
                {comparacao.ehMelhora ? ' • Melhora Clínica' : ' • Atenção'}
              </span>

              {comparacao.metaAtingida && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.65rem',
                    borderRadius: '999px',
                    backgroundColor: 'var(--cor-cta-suave)',
                    color: 'var(--cor-cta)',
                  }}
                >
                  <CheckCircle2 size={13} strokeWidth={2} />
                  Meta Atingida ({dadoAtual?.ref})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Lado Direito: Mini Gráfico de Evolução Temporal */}
        <div
          style={{
            backgroundColor: 'var(--cor-fundo)',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            border: '1px solid var(--cor-borda-suave)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--cor-texto-suave)' }}>
              Trajetória Temporal do Marcador
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--cor-cta)', fontWeight: 600 }}>
              Meta: {dadoAtual?.ref}
            </span>
          </div>

          <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            {/* Linha tracejada de referência da Meta */}
            {metaY !== null && (
              <>
                <line
                  x1={chartPad.left}
                  y1={metaY}
                  x2={chartW - chartPad.right}
                  y2={metaY}
                  stroke="var(--cor-cta)"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                  opacity="0.65"
                />
                <text
                  x={chartW - chartPad.right}
                  y={metaY - 4}
                  textAnchor="end"
                  fontSize="9"
                  fill="var(--cor-cta)"
                  fontWeight="600"
                >
                  Meta {dadoAtual?.meta}
                </text>
              </>
            )}

            {/* Linha da trajetória */}
            {pathGrafico && (
              <path
                d={pathGrafico}
                fill="none"
                stroke="var(--cor-primaria)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Pontos nas coletas */}
            {pontosSVG.map((p, idx) => (
              <g key={idx}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="var(--cor-superficie)"
                  stroke="var(--cor-primaria)"
                  strokeWidth="2"
                />
                <text
                  x={p.x}
                  y={p.y - 7}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="700"
                  fill="var(--cor-texto)"
                >
                  {p.valor}
                </text>
                <text
                  x={p.x}
                  y={chartH - 8}
                  textAnchor="middle"
                  fontSize="8.5"
                  fill="var(--cor-texto-suave)"
                >
                  {p.dataFormatada}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* ====================================================================
          3. TABELA COMPARATIVA CONSOLIDADA (CRUZAMENTO DOS MARCADORES)
          ==================================================================== */}
      <div
        style={{
          backgroundColor: 'var(--cor-superficie)',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1px solid var(--cor-borda-suave)',
          overflowX: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h4
              style={{
                fontFamily: 'var(--fonte-titulo)',
                fontSize: '1.15rem',
                color: 'var(--cor-texto)',
                margin: 0,
              }}
            >
              Tabela Comparativa Consolidada
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--cor-texto-suave)', margin: '0.15rem 0 0 0' }}>
              Cruzamento rápido de resultados entre as coletas de {formatarData(coletaAnterior?.data_realizacao)} e {formatarData(coletaAtual?.data_realizacao)}.
            </p>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--cor-borda-suave)', color: 'var(--cor-texto-suave)' }}>
              <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Marcador Laboratorial</th>
              <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>
                {formatarData(coletaAnterior?.data_realizacao)} ({coletaAnterior?.laboratorio || 'Anterior'})
              </th>
              <th style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: 'var(--cor-cta)' }}>
                {formatarData(coletaAtual?.data_realizacao)} ({coletaAtual?.laboratorio || 'Recente'})
              </th>
              <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Variação</th>
              <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Valor de Referência</th>
              <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Status Clínico</th>
            </tr>
          </thead>
          <tbody>
            {listaMarcadores.map((nomeMarcador, idx) => {
              const ant = extrairMarcador(coletaAnterior, nomeMarcador);
              const atu = extrairMarcador(coletaAtual, nomeMarcador);
              if (!atu) return null;

              const delta = ant ? Number((atu.valor - ant.valor).toFixed(2)) : 0;
              const ehMelhora = atu.tipoMenorMelhor ? delta < 0 : delta > 0;
              const noAlvo = atu.tipoMenorMelhor ? atu.valor <= atu.meta : atu.valor >= atu.meta;

              return (
                <tr
                  key={idx}
                  style={{
                    borderBottom: '1px solid var(--cor-borda-suave)',
                    backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(124, 83, 63, 0.02)',
                  }}
                >
                  <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--cor-texto)' }}>
                    {nomeMarcador}
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--cor-texto-suave)', fontVariantNumeric: 'tabular-nums' }}>
                    {ant ? `${ant.valor} ${ant.unidade}` : '—'}
                  </td>
                  <td
                    style={{
                      padding: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--cor-texto)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {atu.valor} {atu.unidade}
                  </td>
                  <td style={{ padding: '0.75rem', fontVariantNumeric: 'tabular-nums' }}>
                    {ant ? (
                      <span
                        style={{
                          fontWeight: 700,
                          color: ehMelhora ? 'var(--cor-cta)' : '#A23B2A',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        {delta > 0 ? `+${delta}` : delta}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--cor-texto-suave)' }}>
                    {atu.ref}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        backgroundColor: noAlvo ? 'var(--cor-cta-suave)' : '#FFF7ED',
                        color: noAlvo ? 'var(--cor-cta)' : '#C2410C',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      {noAlvo ? '✓ No Alvo' : 'Atenção'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ====================================================================
          4. HISTÓRICO DE COLETAS LABORATORIAIS (ACCORDION / CARDS LIMPOS)
          ==================================================================== */}
      <div
        style={{
          backgroundColor: 'var(--cor-superficie)',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1px solid var(--cor-borda-suave)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <h4
              style={{
                fontFamily: 'var(--fonte-titulo)',
                fontSize: '1.2rem',
                color: 'var(--cor-texto)',
                margin: 0,
              }}
            >
              Histórico de Coletas Laboratoriais
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--cor-texto-suave)', margin: '0.2rem 0 0' }}>
              Laudos arquivados com acesso direto aos documentos em PDF anexados.
            </p>
          </div>

          <Button
            variante="primario"
            onClick={onNovoExameClick}
            style={{
              fontSize: '0.82rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
            }}
          >
            <Plus size={15} strokeWidth={2} />
            Registrar Novo Exame
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {coletasOrdenadas.map((coleta) => (
            <div
              key={coleta.id}
              style={{
                backgroundColor: 'var(--cor-fundo)',
                borderRadius: '12px',
                padding: '1.15rem 1.35rem',
                border: '1px solid var(--cor-borda-suave)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--cor-texto)', fontSize: '0.95rem' }}>
                    {coleta.laboratorio || coleta.nome_laboratorio}
                  </span>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      color: 'var(--cor-primaria)',
                      backgroundColor: 'var(--cor-superficie)',
                      padding: '0.15rem 0.55rem',
                      borderRadius: '6px',
                      fontWeight: 600,
                    }}
                  >
                    Coleta em {formatarData(coleta.data_realizacao)}
                  </span>
                </div>

                {coleta.observacoes && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--cor-texto-suave)', margin: '0 0 0.5rem 0' }}>
                    {coleta.observacoes}
                  </p>
                )}

                {/* Marcadores resumidos em badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {(coleta.marcadores || []).map((m, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.72rem',
                        backgroundColor: 'var(--cor-superficie)',
                        color: 'var(--cor-texto)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        border: '1px solid var(--cor-borda-suave)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {m.nome || m.nome_marcador}: <strong>{m.valor ?? m.valor_resultado} {m.unidade}</strong>
                    </span>
                  ))}
                </div>
              </div>

              {/* Botão de Laudo em PDF */}
              {coleta.arquivo_anexo_path ? (
                <a
                  href={coleta.arquivo_anexo_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <Button
                    variante="secundario"
                    style={{
                      fontSize: '0.78rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 0.85rem',
                    }}
                  >
                    <FileText size={14} strokeWidth={1.75} />
                    Laudo em PDF
                  </Button>
                </a>
              ) : (
                <span style={{ fontSize: '0.74rem', color: 'var(--cor-texto-suave)' }}>
                  Sem PDF anexado
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* FIM DO COMPONENTE COMPARATIVOEXAMES */
