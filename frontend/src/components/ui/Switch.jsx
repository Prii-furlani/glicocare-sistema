/* INÍCIO DO COMPONENTE SWITCH (ESTILO SHADCN/UI - PORTO SEGURO) */
import React, { useState, useEffect } from 'react';

/**
 * Switch
 * Interruptor acessível para configurações booleanas e parâmetros clínicos.
 *
 * @param {boolean} checked - Estado controlado
 * @param {boolean} defaultChecked - Estado inicial não controlado
 * @param {function} onCheckedChange - Callback disparado ao alternar (checked: boolean)
 * @param {boolean} disabled - Se está desabilitado
 * @param {string} label - Rótulo de texto associado
 * @param {string} description - Descrição de apoio
 * @param {string} id - Identificador HTML
 * @param {string} className - Classes CSS extras
 */
export function Switch({
  checked: controlledChecked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  label,
  description,
  id,
  className = '',
  style = {},
  ...props
}) {
  const isControlled = controlledChecked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isChecked = isControlled ? controlledChecked : internalChecked;

  const toggle = () => {
    if (disabled) return;
    const next = !isChecked;
    if (!isControlled) {
      setInternalChecked(next);
    }
    if (onCheckedChange) {
      onCheckedChange(next);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggle();
    }
  };

  const switchElement = (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      disabled={disabled}
      id={id}
      onClick={toggle}
      onKeyDown={handleKeyDown}
      className={`glico-switch ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        width: '42px',
        height: '24px',
        borderRadius: '999px',
        padding: '2px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        backgroundColor: isChecked ? 'var(--cor-cta, #3B7E48)' : 'var(--cor-borda)',
        border: '1px solid transparent',
        transition: 'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none',
        flexShrink: 0,
        ...style,
      }}
      {...props}
    >
      <span
        style={{
          display: 'block',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
          transform: isChecked ? 'translateX(18px)' : 'translateX(0px)',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </button>
  );

  if (label || description) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: description ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: '12px',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        onClick={toggle}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {label && (
            <label
              htmlFor={id}
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--cor-texto)',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              {label}
            </label>
          )}
          {description && (
            <span
              style={{
                fontSize: '11px',
                color: 'var(--cor-texto-suave)',
                lineHeight: 1.4,
              }}
            >
              {description}
            </span>
          )}
        </div>
        {switchElement}
      </div>
    );
  }

  return switchElement;
}

export default Switch;
/* FIM DO COMPONENTE SWITCH */
