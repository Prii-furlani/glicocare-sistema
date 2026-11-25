/* INÍCIO DO COMPONENTE TRACE (ESTILO SHADCN/UI - PORTO SEGURO) */
import React from 'react';

/**
 * TraceList
 * Contêiner da trilha cronológica / histórico de eventos médicos e auditoria.
 */
export function TraceList({ children, className = '', style = {}, ...props }) {
  return (
    <div
      className={`glico-trace-list ${className}`.trim()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        paddingLeft: '6px',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * TraceItem
 * Item individual da trilha com nó colorido de status e conector vertical.
 *
 * @param {'default' | 'success' | 'warning' | 'destructive' | 'info'} status - Nível semântico do evento
 * @param {string} timestamp - Horário ou data formatada (ex: "10:35" ou "24/11")
 * @param {string|React.ReactNode} title - Título ou valor em destaque
 * @param {string|React.ReactNode} description - Detalhe contextual
 * @param {React.ReactNode} icon - Ícone opcional no nó
 * @param {boolean} isLast - Se é o último nó para não renderizar a linha abaixo
 */
export function TraceItem({
  status = 'default',
  timestamp,
  title,
  description,
  icon,
  isLast = false,
  children,
  className = '',
  style = {},
  ...props
}) {
  // Paleta de status no estilo Porto Seguro
  const statusStyles = {
    default: {
      dot: 'var(--cor-borda)',
      bg: 'var(--cor-superficie-elevada)',
      color: 'var(--cor-texto-suave)',
    },
    success: {
      dot: 'var(--cor-cta, #3B7E48)',
      bg: 'rgba(59, 126, 72, 0.12)',
      color: 'var(--cor-cta, #3B7E48)',
    },
    warning: {
      dot: '#C28424',
      bg: 'rgba(194, 132, 36, 0.12)',
      color: '#C28424',
    },
    destructive: {
      dot: 'var(--cor-primaria, #7C533F)',
      bg: 'rgba(124, 83, 63, 0.15)',
      color: 'var(--cor-primaria, #7C533F)',
    },
    info: {
      dot: '#4A7C8E',
      bg: 'rgba(74, 124, 142, 0.12)',
      color: '#4A7C8E',
    },
  }[status] || {
    dot: 'var(--cor-borda)',
    bg: 'var(--cor-superficie-elevada)',
    color: 'var(--cor-texto-suave)',
  };

  return (
    <div
      className={`glico-trace-item ${className}`.trim()}
      style={{
        display: 'flex',
        gap: '14px',
        position: 'relative',
        minHeight: '44px',
        ...style,
      }}
      {...props}
    >
      {/* Coluna da Linha e Nó */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '20px',
          flexShrink: 0,
        }}
      >
        {/* Nó Circular */}
        <div
          style={{
            width: icon ? '22px' : '10px',
            height: icon ? '22px' : '10px',
            borderRadius: '50%',
            backgroundColor: statusStyles.bg,
            border: `2px solid ${statusStyles.dot}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: statusStyles.color,
            marginTop: icon ? '2px' : '6px',
            zIndex: 2,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>

        {/* Linha Conectora Vertical */}
        {!isLast && (
          <div
            style={{
              width: '1.5px',
              flexGrow: 1,
              backgroundColor: 'var(--cor-borda)',
              marginTop: '4px',
              marginBottom: '2px',
            }}
          />
        )}
      </div>

      {/* Conteúdo do Evento */}
      <div
        style={{
          flexGrow: 1,
          paddingBottom: isLast ? '6px' : '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          {title && (
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--cor-texto)',
                lineHeight: 1.3,
              }}
            >
              {title}
            </div>
          )}
          {timestamp && (
            <span
              style={{
                fontSize: '11px',
                color: 'var(--cor-texto-suave)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontVariantNumeric: 'tabular-nums',
                flexShrink: 0,
              }}
            >
              {timestamp}
            </span>
          )}
        </div>

        {description && (
          <div
            style={{
              fontSize: '12px',
              color: 'var(--cor-texto-suave)',
              lineHeight: 1.4,
            }}
          >
            {description}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

export default TraceList;
/* FIM DO COMPONENTE TRACE */
