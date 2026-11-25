/* INÍCIO DO COMPONENTE SKELETON (ESTILO SHADCN/UI - PORTO SEGURO) */
import React from 'react';

/**
 * Skeleton
 * Espaço reservado com animação de pulso/shimmer para estados de carregamento.
 *
 * @param {string} className - Classes CSS extras
 * @param {object} style - Estilos inline (width, height, borderRadius, etc.)
 */
export function Skeleton({ className = '', style = {}, ...props }) {
  return (
    <>
      <style>{`
        @keyframes glico-skeleton-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.45;
          }
        }
        .glico-skeleton {
          display: block;
          background-color: var(--cor-borda);
          border-radius: 8px;
          animation: glico-skeleton-pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          user-select: none;
          pointer-events: none;
        }
      `}</style>
      <div
        className={`glico-skeleton ${className}`.trim()}
        style={{
          minHeight: '16px',
          ...style,
        }}
        aria-hidden="true"
        {...props}
      />
    </>
  );
}

export default Skeleton;
/* FIM DO COMPONENTE SKELETON */
