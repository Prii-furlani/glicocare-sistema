/* ==========================================================================
   ARQUIVO: AlertDialog.jsx (Localização: frontend/src/components/ui/AlertDialog.jsx)
   PROJETO: GlicoCare — Sistema Integrado de Apoio ao DM1
   OBJETIVO: Componente de Diálogo de Confirmação Crítica (substitui window.confirm),
             inspirado no padrão shadcn/ui, estilizado na paleta "Porto Seguro".
   RECURSOS:
     - Overlay desfocado (backdrop-filter: blur(4px)).
     - Fechamento acessível via tecla 'Escape' e clique externo.
     - Botões temáticos: Cancelar (superfície neutra) e Confirmar (Verde Alívio
       ou Terracota/Crítico #C94A38 para ações irreversíveis).
   ========================================================================== */

import React, { useEffect, useRef } from 'react';
import Button from '../Button';

/* INÍCIO DO COMPONENTE ALERTDIALOG DECLARATIVO */
export function AlertDialog({
  open = false,
  aberto,                    // Suporte a sinonímia em português
  onClose,
  children,
}) {
  const estaAberto = aberto !== undefined ? aberto : open;
  const overlayRef = useRef(null);

  // Escuta tecla Escape para fechar
  useEffect(() => {
    if (!estaAberto) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [estaAberto, onClose]);

  if (!estaAberto) return null;

  return (
    <div
      ref={overlayRef}
      className="glico-alert-dialog__overlay"
      onClick={(e) => {
        if (e.target === overlayRef.current && onClose) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
}

export function AlertDialogContent({ children, className = '', style = {} }) {
  return (
    <div className={`glico-alert-dialog__content ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

export function AlertDialogHeader({ children, className = '', style = {} }) {
  return (
    <div className={`glico-alert-dialog__header ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

export function AlertDialogTitle({ children, className = '', style = {} }) {
  return (
    <h3 className={`glico-alert-dialog__title ${className}`.trim()} style={style}>
      {children}
    </h3>
  );
}

export function AlertDialogDescription({ children, className = '', style = {} }) {
  return (
    <p className={`glico-alert-dialog__description ${className}`.trim()} style={style}>
      {children}
    </p>
  );
}

export function AlertDialogFooter({ children, className = '', style = {} }) {
  return (
    <div className={`glico-alert-dialog__footer ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

export function AlertDialogCancel({
  children = 'Cancelar',
  onClick,
  className = '',
  style = {},
  disabled = false,
}) {
  return (
    <Button
      variante="secundario"
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{ fontSize: '0.9rem', ...style }}
    >
      {children}
    </Button>
  );
}

export function AlertDialogAction({
  children = 'Confirmar',
  onClick,
  variant = 'default',
  variante,
  className = '',
  style = {},
  disabled = false,
  loading = false,
}) {
  const varianteFinal = variante || variant;
  const isDestructive = varianteFinal === 'destructive' || varianteFinal === 'critico';

  return (
    <Button
      variante="primario"
      type="button"
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      className={className}
      style={{
        backgroundColor: isDestructive ? '#C94A38' : 'var(--cor-cta, #3B7E48)',
        borderColor: isDestructive ? '#C94A38' : 'var(--cor-cta, #3B7E48)',
        fontSize: '0.9rem',
        ...style,
      }}
    >
      {children}
    </Button>
  );
}

export default AlertDialog;
/* FIM DO COMPONENTE ALERTDIALOG */
