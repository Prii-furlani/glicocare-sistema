/* ==========================================================================
   ARQUIVO: frontend/src/components/ui/Sheet.jsx
   OBJETIVO: Primitivo de Drawer / Gaveta Lateral deslizante no padrão shadcn/ui
   com backdrop blur, suporte a Esc e fechamento suave.
   ========================================================================== */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { X } from 'lucide-react';

const SheetContext = createContext(null);

/* INÍCIO DO COMPONENTE: SHEET ROOT */
export function Sheet({ open, onOpenChange, children }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const setOpen = (val) => {
    if (!isControlled) {
      setInternalOpen(val);
    }
    onOpenChange?.(val);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setOpen(false);
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <SheetContext.Provider value={{ isOpen, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

/* INÍCIO DO COMPONENTE: SHEET TRIGGER */
export function SheetTrigger({ asChild = false, children, ...props }) {
  const { setOpen } = useContext(SheetContext);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e);
        setOpen(true);
      },
      ...props,
    });
  }

  return (
    <button type="button" onClick={() => setOpen(true)} {...props}>
      {children}
    </button>
  );
}

/* INÍCIO DO COMPONENTE: SHEET CONTENT (GAVETA LATERAL DIREITA) */
export function SheetContent({
  side = 'right',
  className = '',
  style = {},
  children,
  ...props
}) {
  const { isOpen, setOpen } = useContext(SheetContext);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: side === 'left' ? 'flex-start' : 'flex-end',
      }}
    >
      {/* Backdrop com blur */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(24, 21, 19, 0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          transition: 'opacity 0.25s ease',
        }}
        aria-hidden="true"
      />

      {/* Painel da Gaveta */}
      <div
        role="dialog"
        aria-modal="true"
        className={`gc-sheet-panel ${className}`}
        style={{
          position: 'relative',
          zIndex: 10000,
          width: '100%',
          maxWidth: '520px',
          height: '100%',
          backgroundColor: 'var(--cor-superficie-elevada, #FFFFFF)',
          boxShadow: '-8px 0 32px rgba(46, 40, 36, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          animation: 'gc-sheet-slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          ...style,
        }}
        {...props}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fechar gaveta"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            color: 'var(--cor-texto-suave, #5C534C)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <X size={20} />
        </button>

        {children}
      </div>
    </div>
  );
}

/* INÍCIO DO COMPONENTE: SHEET HEADER */
export function SheetHeader({ className = '', style = {}, children, ...props }) {
  return (
    <div
      className={`gc-sheet-header ${className}`}
      style={{
        padding: '1.75rem 1.75rem 1rem 1.75rem',
        borderBottom: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.1))',
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

/* INÍCIO DO COMPONENTE: SHEET TITLE */
export function SheetTitle({ className = '', style = {}, children, ...props }) {
  return (
    <h2
      className={`gc-sheet-title ${className}`}
      style={{
        fontFamily: 'var(--fonte-titulo, Fraunces)',
        fontSize: '1.35rem',
        fontWeight: 600,
        color: 'var(--cor-texto, #2E2824)',
        margin: 0,
        ...style,
      }}
      {...props}
    >
      {children}
    </h2>
  );
}

/* INÍCIO DO COMPONENTE: SHEET DESCRIPTION */
export function SheetDescription({ className = '', style = {}, children, ...props }) {
  return (
    <p
      className={`gc-sheet-description ${className}`}
      style={{
        fontSize: '0.85rem',
        color: 'var(--cor-texto-suave, #5C534C)',
        margin: 0,
        lineHeight: 1.45,
        ...style,
      }}
      {...props}
    >
      {children}
    </p>
  );
}

/* INÍCIO DO COMPONENTE: SHEET FOOTER */
export function SheetFooter({ className = '', style = {}, children, ...props }) {
  return (
    <div
      className={`gc-sheet-footer ${className}`}
      style={{
        marginTop: 'auto',
        padding: '1.25rem 1.75rem 1.75rem 1.75rem',
        borderTop: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.1))',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '0.75rem',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
/* FIM DO COMPONENTE SHEET */
