/* ==========================================================================
   ARQUIVO: frontend/src/components/ui/Dialog.jsx
   OBJETIVO: Primitivo de Modal / Dialog no padrão shadcn/ui com backdrop blur,
   suporte a tecla Esc e fechamento seguro.
   ========================================================================== */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { X } from 'lucide-react';

const DialogContext = createContext(null);

/* INÍCIO DO COMPONENTE: DIALOG ROOT */
export function Dialog({ open, onOpenChange, children }) {
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
    <DialogContext.Provider value={{ isOpen, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

/* INÍCIO DO COMPONENTE: DIALOG TRIGGER */
export function DialogTrigger({ asChild = false, children, ...props }) {
  const { setOpen } = useContext(DialogContext);

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

/* INÍCIO DO COMPONENTE: DIALOG CONTENT */
export function DialogContent({
  className = '',
  style = {},
  children,
  maxWidth = '560px',
  ...props
}) {
  const { isOpen, setOpen } = useContext(DialogContext);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      {/* Backdrop com blur */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(24, 21, 19, 0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
        aria-hidden="true"
      />

      {/* Caixa do Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className={`gc-dialog-content ${className}`}
        style={{
          position: 'relative',
          zIndex: 10000,
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          backgroundColor: 'var(--cor-superficie-elevada, #FFFFFF)',
          borderRadius: '16px',
          border: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.15))',
          boxShadow: '0 20px 48px rgba(46, 40, 36, 0.16)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          animation: 'gc-dialog-fade 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          ...style,
        }}
        {...props}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fechar diálogo"
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

/* INÍCIO DO COMPONENTE: DIALOG HEADER */
export function DialogHeader({ className = '', style = {}, children, ...props }) {
  return (
    <div
      className={`gc-dialog-header ${className}`}
      style={{
        padding: '1.5rem 1.75rem 0.75rem 1.75rem',
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

/* INÍCIO DO COMPONENTE: DIALOG TITLE */
export function DialogTitle({ className = '', style = {}, children, ...props }) {
  return (
    <h2
      className={`gc-dialog-title ${className}`}
      style={{
        fontFamily: 'var(--fonte-titulo, Fraunces)',
        fontSize: '1.3rem',
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

/* INÍCIO DO COMPONENTE: DIALOG DESCRIPTION */
export function DialogDescription({ className = '', style = {}, children, ...props }) {
  return (
    <p
      className={`gc-dialog-description ${className}`}
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

/* INÍCIO DO COMPONENTE: DIALOG FOOTER */
export function DialogFooter({ className = '', style = {}, children, ...props }) {
  return (
    <div
      className={`gc-dialog-footer ${className}`}
      style={{
        padding: '1rem 1.75rem 1.5rem 1.75rem',
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
/* FIM DO COMPONENTE DIALOG */
