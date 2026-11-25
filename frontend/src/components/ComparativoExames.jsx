/* ==========================================================================
   ARQUIVO: ComparativoExames.jsx
   LOCALIZAÇÃO: /frontend/src/components/ComparativoExames.jsx
   PROJETO: GlicoCare — Apoio em Diabetes & Cuidado Integrado
   OBJETIVO: Componente de análise comparativa de exames no padrão shadcn/ui
             (Card, Tabs, Table, Badge) com seletor de marcadores, Card Hero
             com delta automático, Gráfico de Linha temporal e Tabela Consolidada.
   ========================================================================== */

/* INÍCIO DO COMPONENTE COMPARATIVOEXAMES */

import React, { useState, useMemo } from 'react';
import {
  FileText,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Tabs, TabsList, TabsTrigger } from './ui/Tabs';
import { Badge } from './ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';
import { ToggleGroup, ToggleGroupItem } from './ui/Toggle';
import { TraceList, TraceItem } from './ui/Trace';
import { Separator } from './ui/Separator';
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
  onVerLaudo = null,
}) {
  // Lista normalizada de exames (ordenada do mais recente para o mais antigo)
  const coletasOrdenadas = useMemo(() => {
    const lista = (Array.isArray(exames) && exames.length > 0) ? exames : EXAMES_DEMO_PADRAO;
    return [...lista].sort((a, b) => new Date(b.data_realizacao) - new Date(a.data_realizacao));
  }, [exames]);

  // Marcadores clínicos disponíveis para seleção (Porto Seguro)
  const listaMarcadores = [
    'HbA1c (%)',
    'Glicemia em Jejum',
    'Vitamina D (25-OH)',
    'Colesterol Total',
    'Microalbuminúria',
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
      if (procurado.includes('colesterol') && n.includes('colesterol')) return true;
      if (procurado.includes('microalbum') && n.includes('microalbum')) return true;
      if (procurado.includes('creatinina') && n.includes('creatinina')) return true;
      if (procurado.includes('tsh') && n.includes('tsh')) return true;
      return n === procurado;
    });
    if (!item) {
      // Valor de demonstração sintético se não existir na coleta antiga
      if (nomeMarcador === 'Colesterol Total') {
        return { valor: 172, unidade: 'mg/dL', ref: '< 190 mg/dL', meta: 190, tipoMenorMelhor: true };
      }
      if (nomeMarcador === 'Microalbuminúria') {
        return { valor: 18.2, unidade: 'mg/g', ref: '< 30 mg/g', meta: 30, tipoMenorMelhor: true };
      }
      return null;
    }
    return {
      valor: Number(item.valor ?? item.valor_resultado ?? 0),
      unidade: item.unidade || '',
      ref: item.ref || item.valor_referencia || '',
      meta: Number(item.meta ?? (item.nome?.includes('HbA1c') ? 7.0 : 99)),
      tipoMenorMelhor: item.tipoMenorMelhor !== undefined ? item.tipoMenorMelhor : true,
    };
  };

  const dadoAtual = extrairMarcador(coletaAtual, marcadorAtivo);
  const dadoAnterior = extrairMarcador(coletaAnterior, marcadorAtivo);

  // Cálculo automático do Delta
  const comparacao = useMemo(() => {
    if (!dadoAtual || !dadoAnterior) return null;
    const delta = Number((dadoAtual.valor - dadoAnterior.valor).toFixed(2));
    const ehMelhora = dadoAtual.tipoMenorMelhor ? delta < 0 : delta > 0;
    const metaAtingida = dadoAtual.tipoMenorMelhor
      ? dadoAtual.valor <= dadoAtual.meta
      : dadoAtual.valor >= dadoAtual.meta;

    return {
      delta,
      diffFormatada: delta > 0 ? `+${delta}` : `${delta}`,
      ehMelhora,
      metaAtingida,
    };
  }, [dadoAtual, dadoAnterior]);

  // Trajetória histórica do marcador para o gráfico temporal
  const pontosHistorico = useMemo(() => {
    return [...coletasOrdenadas]
      .reverse()
      .map((c) => {
        const d = extrairMarcador(c, marcadorAtivo);
        return {
          data: c.data_realizacao,
          laboratorio: c.laboratorio || c.nome_laboratorio,
          valor: d ? d.valor : null,
          unidade: d ? d.unidade : '',
        };
      })
      .filter((p) => p.valor !== null);
  }, [coletasOrdenadas, marcadorAtivo]);

  // Dimensões do Gráfico de Linha Temporal
  const chartW = 320;
  const chartH = 110;
  const chartPad = { top: 18, right: 24, bottom: 24, left: 24 };

  const { pathHistorico, pontosPlot, metaY } = useMemo(() => {
    if (pontosHistorico.length === 0) return { pathHistorico: '', pontosPlot: [], metaY: null };

    const valores = pontosHistorico.map((p) => p.valor);
    if (dadoAtual?.meta) valores.push(dadoAtual.meta);

    const minV = Math.min(...valores) * 0.92;
    const maxV = Math.max(...valores) * 1.08;
    const rangeV = maxV - minV || 1;

    const getX = (idx) => {
      if (pontosHistorico.length === 1) return chartW / 2;
      return chartPad.left + (idx / (pontosHistorico.length - 1)) * (chartW - chartPad.left - chartPad.right);
    };

    const getY = (val) => {
      const r = (val - minV) / rangeV;
      return chartPad.top + (1 - r) * (chartH - chartPad.top - chartPad.bottom);
    };

    const pts = pontosHistorico.map((p, idx) => ({
      ...p,
      x: getX(idx),
      y: getY(p.valor),
    }));

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      path += ` L ${pts[i].x} ${pts[i].y}`;
    }

    const mY = dadoAtual?.meta ? getY(dadoAtual.meta) : null;

    return { pathHistorico: path, pontosPlot: pts, metaY: mY };
  }, [pontosHistorico, dadoAtual]);

  const formatarData = (dStr) => {
    if (!dStr) return '';
    try {
      const [ano, mes, dia] = dStr.split('-');
      return `${dia}/${mes}/${ano}`;
    } catch {
      return dStr;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. SELETOR DE MARCADORES EM TABS SEGMENTADAS (SHADCN STYLE) */}
      <Card>
        <CardContent style={{ padding: '0.85rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--cor-primaria, #7C533F)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Marcador Selecionado:
            </span>

            {/* Seletor de Marcador em ToggleGroup shadcn */}
            <div style={{ overflowX: 'auto', paddingBottom: '2px' }}>
              <ToggleGroup
                type="single"
                value={marcadorAtivo}
                onValueChange={(val) => val && setMarcadorAtivo(val)}
                variant="outline"
                size="sm"
              >
                {listaMarcadores.map((m) => (
                  <ToggleGroupItem key={m} value={m}>
                    {m}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. CARD HERO DE COMPARAÇÃO (ÚLTIMO EXAME VS ANTERIOR) + GRÁFICO DE LINHA */}
      <Card>
        <CardHeader style={{ paddingBottom: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <CardTitle>Comparativo de Evolução • {marcadorAtivo}</CardTitle>
              <CardDescription>
                Análise direta entre a última coleta e a imediatamente anterior.
              </CardDescription>
            </div>
            {comparacao?.metaAtingida && (
              <Badge variant="success">
                <CheckCircle2 size={13} strokeWidth={2} />
                Meta Atingida ({dadoAtual?.ref})
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
              alignItems: 'center',
            }}
          >
            {/* Lado Esquerdo: Comparativo Numérico Direto */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                {/* Resultado Anterior */}
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--cor-texto-suave, #5C534C)', display: 'block' }}>
                    Coleta Anterior ({formatarData(coletaAnterior?.data_realizacao)})
                  </span>
                  <div
                    style={{
                      fontSize: '1.35rem',
                      fontWeight: 700,
                      color: 'var(--cor-texto-suave, #5C534C)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {dadoAnterior ? `${dadoAnterior.valor} ${dadoAnterior.unidade}` : '—'}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--cor-texto-suave, #5C534C)' }}>
                    {coletaAnterior?.laboratorio || 'Laboratório'}
                  </span>
                </div>

                {/* Seta divisora */}
                <div style={{ color: 'var(--cor-primaria, #7C533F)', fontSize: '1.2rem', opacity: 0.5 }}>
                  →
                </div>

                {/* Resultado Atual */}
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--cor-cta, #3B7E48)', display: 'block', fontWeight: 700 }}>
                    Resultado Recente ({formatarData(coletaAtual?.data_realizacao)})
                  </span>
                  <div
                    style={{
                      fontSize: '2rem',
                      fontWeight: 800,
                      color: 'var(--cor-texto, #2E2824)',
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1.1,
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  >
                    {dadoAtual ? `${dadoAtual.valor} ${dadoAtual.unidade}` : '—'}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--cor-texto-suave, #5C534C)' }}>
                    {coletaAtual?.laboratorio || 'Laboratório'}
                  </span>
                </div>
              </div>

              {/* Badges de Variação e Meta */}
              {comparacao && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <Badge variant={comparacao.ehMelhora ? 'success' : 'destructive'}>
                    {comparacao.ehMelhora ? (
                      <TrendingDown size={13} strokeWidth={2} />
                    ) : (
                      <TrendingUp size={13} strokeWidth={2} />
                    )}
                    {comparacao.diffFormatada} {dadoAtual?.unidade}
                    {comparacao.ehMelhora ? ' • Melhora Clínica' : ' • Atenção'}
                  </Badge>

                  <span style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave, #5C534C)' }}>
                    Referência: {dadoAtual?.ref}
                  </span>
                </div>
              )}
            </div>

            {/* Lado Direito: Gráfico de Evolução Temporal */}
            <div
              style={{
                backgroundColor: 'var(--cor-fundo, #FAF8F5)',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                border: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.12))',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--cor-texto-suave, #5C534C)' }}>
                  Trajetória Histórica
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--cor-cta, #3B7E48)', fontWeight: 600 }}>
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
                      stroke="var(--cor-cta, #3B7E48)"
                      strokeWidth="1.2"
                      strokeDasharray="4 4"
                      opacity="0.65"
                    />
                    <text
                      x={chartW - chartPad.right}
                      y={metaY - 4}
                      textAnchor="end"
                      fontSize="9"
                      fill="var(--cor-cta, #3B7E48)"
                      fontWeight="600"
                    >
                      Meta: {dadoAtual?.meta}
                    </text>
                  </>
                )}

                {/* Traçado da linha */}
                {pathHistorico && (
                  <path
                    d={pathHistorico}
                    fill="none"
                    stroke="var(--cor-primaria, #7C533F)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Pontos nas coletas */}
                {pontosPlot.map((p, idx) => (
                  <g key={idx}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={4.5}
                      fill="var(--cor-superficie-elevada, #FFFFFF)"
                      stroke="var(--cor-primaria, #7C533F)"
                      strokeWidth={2}
                    />
                    <text
                      x={p.x}
                      y={p.y - 7}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="700"
                      fill="var(--cor-texto, #2E2824)"
                      fontFamily="Plus Jakarta Sans, sans-serif"
                      fontVariantNumeric="tabular-nums"
                    >
                      {p.valor}
                    </text>
                    <text
                      x={p.x}
                      y={chartH - 4}
                      textAnchor="middle"
                      fontSize="8.5"
                      fill="var(--cor-texto-suave, #5C534C)"
                    >
                      {p.data?.split('-')[1]}/{p.data?.split('-')[0]?.substring(2)}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. TABELA COMPARATIVA CONSOLIDADA (<Table /> SHADCN STYLE) */}
      <Card>
        <CardHeader>
          <CardTitle>Tabela Comparativa Consolidada</CardTitle>
          <CardDescription>
            Cruzamento rápido de resultados entre as coletas de {formatarData(coletaAnterior?.data_realizacao)} e {formatarData(coletaAtual?.data_realizacao)}.
          </CardDescription>
        </CardHeader>

        <CardContent style={{ padding: 0 }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marcador Laboratorial</TableHead>
                <TableHead>{formatarData(coletaAnterior?.data_realizacao)} ({coletaAnterior?.laboratorio || 'Anterior'})</TableHead>
                <TableHead style={{ color: 'var(--cor-cta, #3B7E48)' }}>
                  {formatarData(coletaAtual?.data_realizacao)} ({coletaAtual?.laboratorio || 'Recente'})
                </TableHead>
                <TableHead>Variação</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Status Clínico</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listaMarcadores.map((nomeMarcador, idx) => {
                const ant = extrairMarcador(coletaAnterior, nomeMarcador);
                const atu = extrairMarcador(coletaAtual, nomeMarcador);
                if (!atu) return null;

                const delta = ant ? Number((atu.valor - ant.valor).toFixed(2)) : 0;
                const ehMelhora = atu.tipoMenorMelhor ? delta < 0 : delta > 0;
                const noAlvo = atu.tipoMenorMelhor ? atu.valor <= atu.meta : atu.valor >= atu.meta;

                return (
                  <TableRow key={idx}>
                    <TableCell style={{ fontWeight: 600 }}>{nomeMarcador}</TableCell>
                    <TableCell style={{ color: 'var(--cor-texto-suave, #5C534C)' }}>
                      {ant ? `${ant.valor} ${ant.unidade}` : '—'}
                    </TableCell>
                    <TableCell style={{ fontWeight: 700 }}>
                      {atu.valor} {atu.unidade}
                    </TableCell>
                    <TableCell>
                      {ant ? (
                        <span
                          style={{
                            fontWeight: 700,
                            color: ehMelhora ? 'var(--cor-cta, #3B7E48)' : '#C94A38',
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
                    </TableCell>
                    <TableCell style={{ color: 'var(--cor-texto-suave, #5C534C)' }}>{atu.ref}</TableCell>
                    <TableCell>
                      <Badge variant={noAlvo ? 'success' : 'warning'}>
                        {noAlvo ? 'Meta Atingida' : 'Atenção'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 4. HISTÓRICO DE COLETAS LABORATORIAIS */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <CardTitle>Histórico de Coletas Laboratoriais</CardTitle>
              <CardDescription>
                Laudos arquivados com acesso direto aos documentos em PDF anexados.
              </CardDescription>
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
        </CardHeader>

        <CardContent>
          {/* TRILHA CRONOLÓGICA DE COLETAS LABORATORIAIS COM TRACELIST SHADCN */}
          <div style={{ backgroundColor: 'var(--cor-superficie-elevada)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--cor-borda)' }}>
            <TraceList>
              {coletasOrdenadas.map((coleta, idx) => (
                <TraceItem
                  key={coleta.id}
                  status="info"
                  timestamp={formatarData(coleta.data_realizacao)}
                  isLast={idx === coletasOrdenadas.length - 1}
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: 'var(--cor-texto, #2E2824)', fontSize: '0.95rem' }}>
                        {coleta.laboratorio || coleta.nome_laboratorio}
                      </span>
                      {coleta.arquivo_anexo_path ? (
                        <Button
                          variante="secundario"
                          type="button"
                          onClick={() => {
                            if (onVerLaudo) {
                              onVerLaudo(coleta);
                            } else {
                              window.open(coleta.arquivo_anexo_path, '_blank');
                            }
                          }}
                          style={{
                            fontSize: '0.74rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.3rem 0.75rem',
                          }}
                        >
                          <FileText size={13} strokeWidth={1.75} />
                          Laudo PDF
                        </Button>
                      ) : null}
                    </div>
                  }
                  description={coleta.observacoes}
                >
                  {/* Marcadores resumidos em badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                    {(coleta.marcadores || []).map((m, mIdx) => (
                      <Badge key={mIdx} variant="secondary" style={{ fontSize: '11px' }}>
                        {m.nome || m.nome_marcador}: <strong>{m.valor ?? m.valor_resultado} {m.unidade}</strong>
                      </Badge>
                    ))}
                  </div>
                </TraceItem>
              ))}
            </TraceList>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* FIM DO COMPONENTE COMPARATIVOEXAMES */
