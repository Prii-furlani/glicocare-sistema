/* ==========================================================================
   ARQUIVO: Button.jsx
   COMPONENTE: Button (Botão Reutilizável)
   OBJETIVO: Renderizar botões padronizados da plataforma GlicoCare em três
   variantes visuais ("primario", "secundario" e "pilula-seta"). Suporta tanto
   ação de clique (<button>) quanto navegação interna (<Link> do React Router)
   alterando apenas as props recebidas.
   ========================================================================== */

import React from 'react';
import { Link } from 'react-router-dom';
import GlicoLoader from './GlicoLoader';

/* INÍCIO DO COMPONENTE BUTTON */
export default function Button({
  children,                   // Conteúdo interno (texto ou elementos filhos) do botão
  variante = 'primario',      // Define o estilo visual: 'primario' | 'secundario' | 'pilula-seta'
  to = null,                  // Se informado, renderiza como um Link de rota em vez de tag <button>
  type = 'button',            // Tipo nativo do botão HTML ('button', 'submit', 'reset')
  tipo = null,                // Suporte a sinonímia em português ('submit', 'button')
  onClick,                    // Função disparada ao clicar no botão
  disabled = false,           // Desabilita interações quando verdadeiro
  desabilitado = false,       // Suporte a sinonímia em português
  loading = false,            // Exibe mini-spinner inline e bloqueia cliques duplicados
  carregando = false,         // Suporte a sinonímia em português
  exibirSeta = false,         // Força a exibição da seta direcional (automático na variante 'pilula-seta')
  className = '',             // Permite injetar classes CSS adicionais se necessário
  style = {},                 // Permite ajustes pontuais de posicionamento via inline style
}) {
  const estaCarregando = Boolean(loading || carregando);
  const estaDesabilitado = Boolean(disabled || desabilitado || estaCarregando);
  const tipoBotaoFinal = tipo || type || 'button';
  // Mapeia a prop 'variante' para a classe CSS correspondente definida em index.css
  const mapaVariantes = {
    primario: 'gc-btn--primario',
    secundario: 'gc-btn--secundario',
    'pilula-seta': 'gc-btn--pilula-seta',
  };

  // Seleciona a classe da variante ou usa a primária como fallback seguro
  const classeVariante = mapaVariantes[variante] || mapaVariantes.primario;

  // Define se a seta direcional deve aparecer ao lado do texto
  const mostrarSeta = !estaCarregando && (variante === 'pilula-seta' || exibirSeta);

  // Concatena todas as classes CSS aplicáveis ao elemento
  const classesFinais = `gc-btn ${classeVariante} ${estaCarregando ? 'gc-btn--carregando' : ''} ${className}`.trim();

  /* INÍCIO DA RENDERIZAÇÃO COMO LINK DE NAVEGAÇÃO */
  if (to && !estaDesabilitado) {
    return (
      <Link to={to} className={classesFinais} style={style} onClick={onClick}>
        <span>{children}</span>
        {/* Renderiza a seta com animação de deslocamento no hover quando aplicável */}
        {mostrarSeta && (
          <span className="gc-btn__seta" aria-hidden="true">
            →
          </span>
        )}
      </Link>
    );
  }
  /* FIM DA RENDERIZAÇÃO COMO LINK DE NAVEGAÇÃO */

  /* INÍCIO DA RENDERIZAÇÃO COMO BOTÃO NATIVO HTML */
  return (
    <button
      type={tipoBotaoFinal}
      onClick={onClick}
      disabled={estaDesabilitado}
      className={classesFinais}
      style={{
        cursor: estaDesabilitado ? 'not-allowed' : 'pointer',
        opacity: estaCarregando ? 0.88 : (estaDesabilitado ? 0.65 : 1),
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        ...style,
      }}
    >
      {estaCarregando && <GlicoLoader variant="botao" />}
      <span>{children}</span>
      {/* Seta indicativa de continuidade ou ação */}
      {mostrarSeta && (
        <span className="gc-btn__seta" aria-hidden="true">
          →
        </span>
      )}
    </button>
  );
  /* FIM DA RENDERIZAÇÃO COMO BOTÃO NATIVO HTML */
}
/* FIM DO COMPONENTE BUTTON */
