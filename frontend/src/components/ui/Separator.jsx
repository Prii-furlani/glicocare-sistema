/* INÍCIO DO COMPONENTE SEPARATOR (ESTILO SHADCN/UI - PORTO SEGURO) */
import React from 'react';

/**
 * Separator
 * Divisor ultrafino e discreto para segregar seções e itens em linha ou coluna.
 *
 * @param {'horizontal' | 'vertical'} orientation - Direção do divisor (padrão: 'horizontal')
 * @param {boolean} decorative - Se é meramente decorativo para acessibilidade (padrão: true)
 * @param {string} className - Classes adicionais
 * @param {object} style - Estilos inline
 */
export function Separator({
  orientation = 'horizontal',
  decorative = true,
  className = '',
  style = {},
  ...props
}) {
  const isHorizontal = orientation === 'horizontal';

  const baseStyle = {
    flexShrink: 0,
    backgroundColor: 'var(--cor-borda)',
    border: 'none',
    ...(isHorizontal
      ? {
          height: '1px',
          width: '100%',
          margin: '0',
        }
      : {
          width: '1px',
          height: '100%',
          minHeight: '18px',
          alignSelf: 'stretch',
          margin: '0',
        }),
    ...style,
  };

  return (
    <div
      role={decorative ? 'none' : 'separator'}
      aria-orientation={decorative ? undefined : orientation}
      className={`glico-separator glico-separator-${orientation} ${className}`.trim()}
      style={baseStyle}
      {...props}
    />
  );
}

export default Separator;
/* FIM DO COMPONENTE SEPARATOR */
