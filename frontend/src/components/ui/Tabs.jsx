/* ==========================================================================
   ARQUIVO: frontend/src/components/ui/Tabs.jsx
   OBJETIVO: Primitivo de Abas / Segmented Control no padrão shadcn/ui
   com container compacto e gatilhos elevados.
   ========================================================================== */

import React, { createContext, useContext, useState } from 'react';

const TabsContext = createContext(null);

/* INÍCIO DO COMPONENTE: TABS ROOT */
export function Tabs({
  value,
  defaultValue,
  onValueChange,
  className = '',
  style = {},
  children,
  ...props
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const activeValue = isControlled ? value : internalValue;

  const handleValueChange = (val) => {
    if (!isControlled) {
      setInternalValue(val);
    }
    onValueChange?.(val);
  };

  return (
    <TabsContext.Provider value={{ activeValue, onValueChange: handleValueChange }}>
      <div className={`gc-tabs ${className}`} style={{ width: '100%', ...style }} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

/* INÍCIO DO COMPONENTE: TABS LIST (SEGMENTED CONTROL CONTAINER) */
export function TabsList({ className = '', style = {}, children, ...props }) {
  return (
    <div
      role="tablist"
      className={`gc-tabs-list ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px',
        borderRadius: '10px',
        backgroundColor: 'rgba(124, 83, 63, 0.08)',
        gap: '4px',
        maxWidth: '100%',
        overflowX: 'auto',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

/* INÍCIO DO COMPONENTE: TABS TRIGGER (GATILHO ELEVADO QUANDO ATIVO) */
export function TabsTrigger({ value, disabled = false, className = '', style = {}, children, ...props }) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabsTrigger must be used within a Tabs component');
  }

  const isActive = context.activeValue === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => !disabled && context.onValueChange(value)}
      className={`gc-tabs-trigger ${isActive ? 'gc-tabs-trigger--active' : ''} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.4rem',
        padding: '6px 14px',
        borderRadius: '8px',
        fontSize: '0.84rem',
        fontWeight: isActive ? 600 : 500,
        lineHeight: 1.25,
        whiteSpace: 'nowrap',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        backgroundColor: isActive ? 'var(--cor-superficie-elevada, #FFFFFF)' : 'transparent',
        color: isActive ? 'var(--cor-texto, #2E2824)' : 'var(--cor-texto-suave, #5C534C)',
        boxShadow: isActive ? '0 1px 3px rgba(46, 40, 36, 0.08)' : 'none',
        transition: 'all 0.18s ease',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

/* INÍCIO DO COMPONENTE: TABS CONTENT */
export function TabsContent({ value, className = '', style = {}, children, ...props }) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('TabsContent must be used within a Tabs component');
  }

  if (context.activeValue !== value) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      className={`gc-tabs-content ${className}`}
      style={{
        marginTop: '1.25rem',
        outline: 'none',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
/* FIM DO COMPONENTE TABS */
