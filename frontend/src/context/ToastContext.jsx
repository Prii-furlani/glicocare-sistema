/* ==========================================================================
   ARQUIVO: ToastContext.jsx (Localização: frontend/src/context/ToastContext.jsx)
   PROJETO: GlicoCare — Sistema Integrado de Apoio ao DM1
   OBJETIVO: Provedor global de notificações flutuantes (toasts) e hook useNotify()
             com fechamento automático após 4,5 segundos e suporte a 4 tipos
             na paleta "Porto Seguro" (sucesso, erro, aviso, info).
   ========================================================================== */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ToastContext = createContext(null);

const ICONES_TOAST = {
  success: '✓',
  sucesso: '✓',
  error: '✕',
  erro: '✕',
  warning: '⚠️',
  aviso: '⚠️',
  info: '💡',
};

const TITULOS_PADRAO = {
  success: 'Sucesso',
  sucesso: 'Sucesso',
  error: 'Atenção',
  erro: 'Atenção',
  warning: 'Aviso Importante',
  aviso: 'Aviso Importante',
  info: 'Informação',
};

/* INÍCIO DO PROVEDOR TOASTPROVIDER */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Remove toast pelo ID
  const removerToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Adiciona novo toast
  const adicionarToast = useCallback((tipo, mensagem, titulo, duracaoMs = 4500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const tipoNormalizado =
      tipo === 'erro' ? 'error' : tipo === 'sucesso' ? 'success' : tipo === 'aviso' ? 'warning' : tipo || 'info';

    const novoToast = {
      id,
      tipo: tipoNormalizado,
      mensagem,
      titulo: titulo || TITULOS_PADRAO[tipoNormalizado] || 'GlicoCare',
      icone: ICONES_TOAST[tipoNormalizado] || 'ℹ️',
    };

    setToasts((prev) => [...prev, novoToast]);

    // Timer de auto-fechamento (padrão 4,5s)
    if (duracaoMs > 0) {
      setTimeout(() => {
        removerToast(id);
      }, duracaoMs);
    }

    return id;
  }, [removerToast]);

  // Objeto semântico de métodos
  const notificar = useMemo(() => {
    const fn = (mensagem, tipo = 'info', titulo = null) => adicionarToast(tipo, mensagem, titulo);
    fn.sucesso = (mensagem, titulo = null, duracaoMs) => adicionarToast('success', mensagem, titulo, duracaoMs);
    fn.erro = (mensagem, titulo = null, duracaoMs) => adicionarToast('error', mensagem, titulo, duracaoMs);
    fn.aviso = (mensagem, titulo = null, duracaoMs) => adicionarToast('warning', mensagem, titulo, duracaoMs);
    fn.info = (mensagem, titulo = null, duracaoMs) => adicionarToast('info', mensagem, titulo, duracaoMs);
    return fn;
  }, [adicionarToast]);

  return (
    <ToastContext.Provider value={{ notificar, adicionarToast, removerToast }}>
      {children}

      {/* Portal de Renderização dos Toasts Flutuantes */}
      {toasts.length > 0 && (
        <div className="glico-toast-portal" role="region" aria-live="polite">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`glico-toast glico-toast--${toast.tipo}`}
              role="alert"
            >
              <span className="glico-toast__icon" aria-hidden="true">
                {toast.icone}
              </span>
              <div className="glico-toast__body">
                {toast.titulo && (
                  <div className="glico-toast__title">{toast.titulo}</div>
                )}
                <div className="glico-toast__message">{toast.mensagem}</div>
              </div>
              <button
                type="button"
                onClick={() => removerToast(toast.id)}
                className="glico-toast__close-btn"
                aria-label="Fechar notificação"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

/* HOOK USENOTIFY */
export function useNotify() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useNotify deve ser utilizado dentro de um ToastProvider.');
  }
  return context.notificar;
}

export default ToastContext;
