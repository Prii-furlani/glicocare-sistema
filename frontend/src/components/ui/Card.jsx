/* ==========================================================================
   ARQUIVO: frontend/src/components/ui/Card.jsx
   OBJETIVO: Primitivo de superfície e container Card no padrão shadcn/ui,
   estilizado com a paleta "Porto Seguro".
   REGRA ESTRITA: Nunca aninhar um Card com borda dentro de outro Card com borda.
   ========================================================================== */

import React from 'react';

/* INÍCIO DO COMPONENTE: CARD */
export function Card({ className = '', style = {}, children, ...props }) {
  return (
    <div
      className={`gc-card ${className}`}
      style={{
        backgroundColor: 'var(--cor-superficie-elevada, #FFFFFF)',
        border: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.12))',
        borderRadius: '12px',
        boxShadow: '0 1px 2px rgba(46, 40, 36, 0.04)',
        color: 'var(--cor-texto, #2E2824)',
        overflow: 'hidden',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

/* INÍCIO DO COMPONENTE: CARD HEADER */
export function CardHeader({ className = '', style = {}, children, ...props }) {
  return (
    <div
      className={`gc-card-header ${className}`}
      style={{
        padding: '1.25rem 1.5rem 0.5rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

/* INÍCIO DO COMPONENTE: CARD TITLE */
export function CardTitle({ className = '', style = {}, children, ...props }) {
  return (
    <h3
      className={`gc-card-title ${className}`}
      style={{
        fontFamily: 'var(--fonte-titulo, Fraunces)',
        fontSize: '1.15rem',
        fontWeight: 600,
        color: 'var(--cor-texto, #2E2824)',
        lineHeight: 1.25,
        letterSpacing: '-0.01em',
        margin: 0,
        ...style,
      }}
      {...props}
    >
      {children}
    </h3>
  );
}

/* INÍCIO DO COMPONENTE: CARD DESCRIPTION */
export function CardDescription({ className = '', style = {}, children, ...props }) {
  return (
    <p
      className={`gc-card-description ${className}`}
      style={{
        fontSize: '0.85rem',
        color: 'var(--cor-texto-suave, #5C534C)',
        lineHeight: 1.45,
        margin: 0,
        ...style,
      }}
      {...props}
    >
      {children}
    </p>
  );
}

/* INÍCIO DO COMPONENTE: CARD CONTENT */
export function CardContent({ className = '', style = {}, children, ...props }) {
  return (
    <div
      className={`gc-card-content ${className}`}
      style={{
        padding: '1.25rem 1.5rem 1.5rem 1.5rem',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

/* INÍCIO DO COMPONENTE: CARD FOOTER */
export function CardFooter({ className = '', style = {}, children, ...props }) {
  return (
    <div
      className={`gc-card-footer ${className}`}
      style={{
        padding: '0.75rem 1.5rem 1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
/* FIM DO COMPONENTE CARD */
