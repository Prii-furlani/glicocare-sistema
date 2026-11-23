/* ==========================================================================
   ARQUIVO: ConfirmContext.jsx (Localização: frontend/src/context/ConfirmContext.jsx)
   PROJETO: GlicoCare — Sistema Integrado de Apoio ao DM1
   OBJETIVO: Provedor global e hook useConfirm() para confirmações assíncronas limpas,
             substituindo definitivamente qualquer window.confirm() nativo.
   ========================================================================== */

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '../components/ui/AlertDialog';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    variant: 'default',
  });

  const resolverRef = useRef(null);

  const confirmar = useCallback((options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogState({
        isOpen: true,
        title: options.titulo || options.title || 'Confirmar ação?',
        description: options.descricao || options.description || 'Tem certeza de que deseja continuar?',
        confirmText: options.confirmText || options.textoConfirmar || 'Confirmar',
        cancelText: options.cancelText || options.textoCancelar || 'Cancelar',
        variant: options.variante || options.variant || 'default',
      });
    });
  }, []);

  const handleConfirm = () => {
    if (resolverRef.current) resolverRef.current(true);
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    if (resolverRef.current) resolverRef.current(false);
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <ConfirmContext.Provider value={{ confirmar }}>
      {children}

      <AlertDialog open={dialogState.isOpen} onClose={handleCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogState.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogState.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {dialogState.cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              variant={dialogState.variant}
              onClick={handleConfirm}
            >
              {dialogState.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm deve ser utilizado dentro de um ConfirmProvider.');
  }
  return context;
}

export default ConfirmContext;
