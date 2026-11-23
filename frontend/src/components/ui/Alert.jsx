/* ==========================================================================
   ARQUIVO: Alert.jsx (Localização: frontend/src/components/ui/Alert.jsx)
   PROJETO: GlicoCare — Sistema Integrado de Apoio ao DM1
   OBJETIVO: Componente de alerta inline inspirado no padrão shadcn/ui,
             fiel ao Design System "Porto Seguro" (Claro e Dark Mode).
   VARIANTES:
     - 'default': Acolhedor / Lufy (superfície marfim e acento terracota).
     - 'success': Confirmações, metas atingidas e TCLE ativo (Verde Alívio #3B7E48).
     - 'warning': Atenção clínica, Insulina Ativa (IOB) e queda de glicose (Âmbar #C88D2A).
     - 'destructive': Hipoglicemia (< 70 mg/dL), risco anafilático e erros críticos (Terracota/Vermelho #C94A38).
   ========================================================================== */

import React from 'react';

// Mapeamento de ícones padrão por variante
const ICONES_PADRAO = {
  default: '🌿',
  success: '✓',
  warning: '⚠️',
  destructive: '🚨',
};

/* INÍCIO DO COMPONENTE ALERT */
export function Alert({
  variant = 'default',
  variante,                  // Suporte a sinonímia em português
  title,                     // Título como prop direta (opcional)
  titulo,                    // Título em português
  description,               // Descrição como prop direta (opcional)
  descricao,                 // Descrição em português
  icon,                      // Ícone customizado
  icone,                     // Ícone em português
  children,
  onClose,
  className = '',
  style = {},
  role = 'alert',
}) {
  const varianteFinal = variante || variant || 'default';
  const iconeFinal = icone || icon || ICONES_PADRAO[varianteFinal] || 'ℹ️';
  const tituloFinal = titulo || title;
  const descricaoFinal = descricao || description;

  return (
    <div
      role={role}
      className={`glico-alert glico-alert--${varianteFinal} ${className}`.trim()}
      style={style}
    >
      {/* Ícone lateral */}
      {iconeFinal && (
        <span className="glico-alert__icon" aria-hidden="true">
          {iconeFinal}
        </span>
      )}

      {/* Conteúdo do Alerta */}
      <div className="glico-alert__content">
        {tituloFinal && <AlertTitle>{tituloFinal}</AlertTitle>}
        {descricaoFinal && <AlertDescription>{descricaoFinal}</AlertDescription>}
        {children}
      </div>

      {/* Botão de Fechar opcional */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="glico-alert__close"
          aria-label="Fechar alerta"
        >
          ×
        </button>
      )}
    </div>
  );
}

/* SUB-COMPONENTE ALERTTITLE */
export function AlertTitle({ children, className = '', style = {} }) {
  if (!children) return null;
  return (
    <h5 className={`glico-alert__title ${className}`.trim()} style={style}>
      {children}
    </h5>
  );
}

/* SUB-COMPONENTE ALERTDESCRIPTION */
export function AlertDescription({ children, className = '', style = {} }) {
  if (!children) return null;
  return (
    <div className={`glico-alert__description ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

export default Alert;
/* FIM DO COMPONENTE ALERT */
