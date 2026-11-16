/* ==========================================================================
   ARQUIVO: SugerirConteudoCTA.jsx
   COMPONENTE: SugerirConteudoCTA (CTA Secundário em Barra/Pílula Larga)
   OBJETIVO: Renderizar o botão de chamada para ação (CTA secundário) em
   formato de barra/pílula horizontal larga ("Sugerir um conteúdo ↗"),
   posicionado de forma centralizada logo abaixo da grade de cards da
   biblioteca de conteúdos para engajamento comunitário das famílias DM1.
   ========================================================================== */

import React, { useState } from 'react';
import Button from './Button';
import FormInput from './FormInput';
import { analisarMensagemModerador } from '../utils/moderadorGlicoCare';

/* INÍCIO DO COMPONENTE SUGERIR CONTEÚDO CTA */
export default function SugerirConteudoCTA({
  texto = 'Sugerir um conteúdo',
  varianteCor = 'verde',       // 'verde' (#3B7E48) | 'terracota' (#7C533F / #2E2824)
  fundoTransparente = false,   // false = Branco Acolhedor (#F6F3EE) | true = Transparente
}) {
  // Controla a abertura do painel de envio de ideias comunitárias
  const [painelAberto, setPainelAberto] = useState(false);

  // Estados do formulário rápido de sugestão de novos guias/temas
  const [temaIdeia, setTemaIdeia] = useState('');
  const [categoriaSugerida, setCategoriaSugerida] = useState('Com o Lufy');
  const [nomeFamiliar, setNomeFamiliar] = useState('');
  const [enviadoComSucesso, setEnviadoComSucesso] = useState(false);
  const [parecerModeracao, setParecerModeracao] = useState(null);

  // Manipula o envio da sugestão de conteúdo passando pelo Moderador Oficial
  const handleEnviarIdeia = (e) => {
    e.preventDefault();
    if (!temaIdeia.trim()) return;

    const resultado = analisarMensagemModerador(temaIdeia);
    setParecerModeracao(resultado);

    if (!resultado.aprovada) {
      return;
    }

    setEnviadoComSucesso(true);
    setTemaIdeia('');
    setNomeFamiliar('');
  };

  // Monta as classes CSS da pílula larga conforme as props de estilo
  const classesPilula = [
    'cta-pilula-sugerir',
    varianteCor === 'terracota' ? 'cta-pilula-sugerir--terracota' : '',
    fundoTransparente ? 'cta-pilula-sugerir--transparente' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="cta-sugerir-conteudo-wrapper">
      {/* ====================================================================
          INÍCIO DO BOTÃO EM PÍLULA LARGA ("Sugerir um conteúdo ↗")
          ==================================================================== */}
      <button
        type="button"
        className={classesPilula}
        aria-expanded={painelAberto}
        onClick={() => {
          setPainelAberto(!painelAberto);
          if (enviadoComSucesso) setEnviadoComSucesso(false);
        }}
      >
        <span>{texto}</span>
        <span className="cta-pilula-sugerir-icone" aria-hidden="true">
          ↗
        </span>
      </button>
      {/* FIM DO BOTÃO EM PÍLULA LARGA */}

      {/* ====================================================================
          INÍCIO DO PAINEL DE ENGAJAMENTO COMUNITÁRIO (EXPANSÍVEL)
          ==================================================================== */}
      {painelAberto && (
        <div
          className="cta-sugerir-painel-comunidade"
          role="region"
          aria-label="Formulário para sugerir novo conteúdo à Biblioteca GlicoCare"
        >
          {enviadoComSucesso ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
                <div>
                  <strong
                    style={{
                      display: 'block',
                      color: 'var(--cor-cta)',
                      fontSize: '1rem',
                      marginBottom: '0.25rem',
                    }}
                  >
                    ✓ {parecerModeracao?.saidaFormatada || '[APROVADA]: Ideia recebida com muito carinho pela curadoria GlicoCare!'}
                  </strong>
                  <span
                    style={{
                      fontSize: '0.9rem',
                      color: 'var(--cor-texto-suave)',
                    }}
                  >
                    Nossa equipe pedagógica e o Lufy vão preparar esse guia para
                    apoiar toda a comunidade.
                  </span>
                </div>
              <button
                type="button"
                onClick={() => {
                  setEnviadoComSucesso(false);
                  setPainelAberto(false);
                }}
                style={{
                  background: 'none',
                  border: '1px solid var(--cor-borda)',
                  borderRadius: 'var(--raio-pilula)',
                  padding: '0.45rem 1rem',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: 'var(--cor-texto)',
                }}
              >
                Fechar
              </button>
            </div>
          ) : (
            <form onSubmit={handleEnviarIdeia}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
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
                  🐾 CONSTRUÇÃO COMUNITÁRIA GLICOCARE
                </span>
                <button
                  type="button"
                  aria-label="Fechar caixa de sugestão"
                  onClick={() => setPainelAberto(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--cor-texto-suave)',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                  }}
                >
                  ✕
                </button>
              </div>

              <h3
                style={{
                  fontFamily: 'var(--fonte-titulo)',
                  fontSize: '1.3rem',
                  color: 'var(--cor-texto)',
                  marginBottom: '0.35rem',
                }}
              >
                Qual dúvida ou situação da rotina você gostaria de ver em um
                próximo guia?
              </h3>
              <p
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--cor-texto-suave)',
                  marginBottom: '1.25rem',
                }}
              >
                Os conteúdos da nossa Biblioteca nascem das necessidades reais
                das famílias que vivem o Diabetes Tipo 1.
              </p>

              {parecerModeracao && !parecerModeracao.aprovada && (
                <div
                  style={{
                    backgroundColor: '#F9E6E3',
                    color: '#9E3328',
                    border: '1px solid #C86D63',
                    padding: '0.85rem 1.1rem',
                    borderRadius: '12px',
                    marginBottom: '1rem',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                  }}
                >
                  {parecerModeracao.saidaFormatada}
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '0.85rem',
                }}
              >
                <FormInput
                  name="nomeFamiliar"
                  label="Seu Nome (opcional)"
                  placeholder="Ex: Juliana, mãe da Alice"
                  value={nomeFamiliar}
                  onChange={(e) => setNomeFamiliar(e.target.value)}
                />

                <FormInput
                  name="categoriaSugerida"
                  tipo="select"
                  label="Trilha sugerida"
                  value={categoriaSugerida}
                  onChange={(e) => setCategoriaSugerida(e.target.value)}
                  opcoes={[
                    { valor: 'Com o Lufy', rotulo: '🐾 Com o Lufy' },
                    { valor: 'Rotina Escolar', rotulo: '🏫 Rotina Escolar' },
                    {
                      valor: 'Tecnologia & Autonomia',
                      rotulo: '💡 Tecnologia & Autonomia',
                    },
                  ]}
                />
              </div>

              <FormInput
                name="temaIdeia"
                label="Tema ou ideia de guia"
                placeholder="Ex: Como lidar com festas de aniversário na escola sem exclusão..."
                value={temaIdeia}
                onChange={(e) => setTemaIdeia(e.target.value)}
                obrigatorio
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  marginTop: '0.35rem',
                }}
              >
                <Button type="submit" variante="primario">
                  Enviar sugestão para a curadoria ↗
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
      {/* FIM DO PAINEL DE ENGAJAMENTO COMUNITÁRIO */}
    </div>
  );
}
/* FIM DO COMPONENTE SUGERIR CONTEÚDO CTA */
