/* ==========================================================================
   ARQUIVO: frontend/src/components/ui/Badge.jsx
   OBJETIVO: Primitivo de Badge no padrão shadcn/ui com paleta "Porto Seguro".
   Pílulas compactas (font-size: 12px, font-weight: 500, padding: 2px 10px).
   ========================================================================== */

import React from 'react';

const BADGE_VARIANTS = {
  default: {
    backgroundColor: 'var(--cor-cta, #3B7E48)',
    color: '#FFFFFF',
    border: '1px solid transparent',
  },
  secondary: {
    backgroundColor: 'rgba(124, 83, 63, 0.1)',
    color: 'var(--cor-primaria, #7C533F)',
    border: '1px solid transparent',
  },
  outline: {
    backgroundColor: 'transparent',
    color: 'var(--cor-texto, #2E2824)',
    border: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.2))',
  },
  success: {
    backgroundColor: 'rgba(59, 126, 72, 0.12)',
    color: 'var(--cor-cta, #3B7E48)',
    border: '1px solid rgba(59, 126, 72, 0.2)',
  },
  destructive: {
    backgroundColor: 'rgba(201, 74, 56, 0.12)',
    color: '#C94A38',
    border: '1px solid rgba(201, 74, 56, 0.2)',
  },
  warning: {
    backgroundColor: 'rgba(200, 141, 42, 0.12)',
    color: '#C88D2A',
    border: '1px solid rgba(200, 141, 42, 0.2)',
  },
};

/* INÍCIO DO COMPONENTE: BADGE */
export function Badge({ variant = 'default', className = '', style = {}, children, ...props }) {
  const variantStyles = BADGE_VARIANTS[variant] || BADGE_VARIANTS.default;

  return (
    <span
      className={`gc-badge gc-badge--${variant} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        borderRadius: '999px',
        padding: '2px 10px',
        fontSize: '12px',
        fontWeight: 500,
        lineHeight: 1.5,
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        transition: 'background-color 0.15s ease, color 0.15s ease',
        ...variantStyles,
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
/* FIM DO COMPONENTE BADGE */
