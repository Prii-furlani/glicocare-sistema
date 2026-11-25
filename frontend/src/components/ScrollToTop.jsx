/* ==========================================================================
   ARQUIVO: ScrollToTop.jsx
   LOCALIZAÇÃO: /frontend/src/components/ScrollToTop.jsx
   PROJETO: GlicoCare — Apoio em Diabetes & Cuidado Integrado
   OBJETIVO:
     Componente global de controle e restauração de rolagem de página (ScrollToTop).
     Conectado ao hook useLocation() do react-router-dom, detecta a transição de
     pathname entre rotas e reseta a posição de rolagem da janela rigorosamente
     para o topo (top: 0, left: 0), evitando que uma nova página herde a posição
     de scroll da tela anterior.
   ========================================================================== */

/* INÍCIO DO COMPONENTE GLOBAL SCROLL TO TOP */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Se não houver âncora/hash na URL (ex: #comentarios), reseta o scroll para o topo imediatamente
    if (!hash) {
      try {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant',
        });
      } catch {
        // Fallback para navegadores sem suporte ao options object
        window.scrollTo(0, 0);
      }
    }
  }, [pathname, hash]);

  return null;
}
/* FIM DO COMPONENTE GLOBAL SCROLL TO TOP */
