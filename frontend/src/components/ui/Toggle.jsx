/* INÍCIO DO COMPONENTE TOGGLE & TOGGLEGROUP (ESTILO SHADCN/UI - PORTO SEGURO) */
import React, { createContext, useContext, useState } from 'react';

const ToggleGroupContext = createContext(null);

/**
 * Toggle
 * Botão de alternância com estado pressionado para filtros e marcadores rápidos.
 */
export function Toggle({
  pressed: controlledPressed,
  defaultPressed = false,
  onPressedChange,
  variant = 'default', // 'default' | 'outline' | 'terracota' | 'alivio'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  children,
  className = '',
  style = {},
  ...props
}) {
  const isControlled = controlledPressed !== undefined;
  const [internalPressed, setInternalPressed] = useState(defaultPressed);
  const isPressed = isControlled ? controlledPressed : internalPressed;

  const handleClick = (e) => {
    if (disabled) return;
    const next = !isPressed;
    if (!isControlled) setInternalPressed(next);
    if (onPressedChange) onPressedChange(next, e);
  };

  // Tamanhos
  const sizeStyles = {
    sm: { padding: '4px 10px', fontSize: '11px', height: '28px' },
    md: { padding: '6px 14px', fontSize: '12px', height: '32px' },
    lg: { padding: '8px 18px', fontSize: '14px', height: '38px' },
  }[size] || { padding: '6px 14px', fontSize: '12px', height: '32px' };

  // Variantes
  let bg = 'transparent';
  let color = 'var(--cor-texto-suave)';
  let border = '1px solid transparent';
  let shadow = 'none';

  if (isPressed) {
    if (variant === 'terracota') {
      bg = 'rgba(124, 83, 63, 0.12)';
      color = 'var(--cor-primaria, #7C533F)';
      border = '1px solid rgba(124, 83, 63, 0.3)';
    } else if (variant === 'alivio') {
      bg = 'rgba(59, 126, 72, 0.12)';
      color = 'var(--cor-cta, #3B7E48)';
      border = '1px solid rgba(59, 126, 72, 0.3)';
    } else if (variant === 'outline') {
      bg = 'var(--cor-superficie-elevada)';
      color = 'var(--cor-texto)';
      border = '1px solid var(--cor-primaria)';
      shadow = '0 1px 2px rgba(46, 40, 36, 0.05)';
    } else {
      // default
      bg = 'var(--cor-superficie-elevada)';
      color = 'var(--cor-texto)';
      border = '1px solid var(--cor-borda)';
      shadow = '0 1px 3px rgba(46, 40, 36, 0.06)';
    }
  } else {
    if (variant === 'outline') {
      border = '1px solid var(--cor-borda)';
    }
  }

  return (
    <button
      type="button"
      aria-pressed={isPressed}
      disabled={disabled}
      onClick={handleClick}
      className={`glico-toggle ${isPressed ? 'is-pressed' : ''} ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        borderRadius: '8px',
        fontWeight: isPressed ? 600 : 500,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        backgroundColor: bg,
        color,
        border,
        boxShadow: shadow,
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        ...sizeStyles,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * ToggleGroup
 * Agrupador em estilo Segmented Control para seleções únicas ou múltiplas.
 */
export function ToggleGroup({
  type = 'single', // 'single' | 'multiple'
  value: controlledValue,
  defaultValue,
  onValueChange,
  variant = 'default',
  size = 'md',
  disabled = false,
  children,
  className = '',
  style = {},
  ...props
}) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(
    defaultValue !== undefined ? defaultValue : type === 'multiple' ? [] : ''
  );

  const currentValue = isControlled ? controlledValue : internalValue;

  const handleToggle = (itemValue) => {
    if (disabled) return;
    let nextValue;
    if (type === 'multiple') {
      const arr = Array.isArray(currentValue) ? [...currentValue] : [];
      if (arr.includes(itemValue)) {
        nextValue = arr.filter((v) => v !== itemValue);
      } else {
        nextValue = [...arr, itemValue];
      }
    } else {
      nextValue = currentValue === itemValue ? '' : itemValue;
    }

    if (!isControlled) {
      setInternalValue(nextValue);
    }
    if (onValueChange) {
      onValueChange(nextValue);
    }
  };

  return (
    <ToggleGroupContext.Provider
      value={{
        type,
        value: currentValue,
        onToggle: handleToggle,
        variant,
        size,
        disabled,
      }}
    >
      <div
        role="group"
        className={`glico-toggle-group ${className}`.trim()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px',
          backgroundColor: 'var(--cor-superficie)',
          border: '1px solid var(--cor-borda)',
          borderRadius: '10px',
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    </ToggleGroupContext.Provider>
  );
}

/**
 * ToggleGroupItem
 * Item individual de um ToggleGroup.
 */
export function ToggleGroupItem({
  value,
  children,
  disabled = false,
  className = '',
  style = {},
  ...props
}) {
  const context = useContext(ToggleGroupContext);

  if (!context) {
    throw new Error('ToggleGroupItem deve ser utilizado dentro de um ToggleGroup');
  }

  const isPressed =
    context.type === 'multiple'
      ? Array.isArray(context.value) && context.value.includes(value)
      : context.value === value;

  const isDisabled = disabled || context.disabled;

  return (
    <Toggle
      pressed={isPressed}
      variant={context.variant}
      size={context.size}
      disabled={isDisabled}
      onPressedChange={() => context.onToggle(value)}
      className={className}
      style={{
        border: isPressed ? '1px solid var(--cor-borda)' : '1px solid transparent',
        ...style,
      }}
      {...props}
    >
      {children}
    </Toggle>
  );
}

export default Toggle;
/* FIM DO COMPONENTE TOGGLE & TOGGLEGROUP */
