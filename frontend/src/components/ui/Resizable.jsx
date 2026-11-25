/* INÍCIO DO COMPONENTE RESIZABLE (ESTILO SHADCN/UI - PORTO SEGURO) */
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const ResizableContext = createContext(null);

/**
 * ResizablePanelGroup
 * Container de layout divisível em dois ou mais painéis interativos com arraste.
 */
export function ResizablePanelGroup({
  direction = 'horizontal', // 'horizontal' | 'vertical'
  children,
  className = '',
  style = {},
  ...props
}) {
  const containerRef = useRef(null);
  const isHorizontal = direction === 'horizontal';

  // Por padrão divide em proporção igual (50 / 50)
  const [sizes, setSizes] = useState([50, 50]);
  const [isDragging, setIsDragging] = useState(false);

  const startDrag = (handleIndex, e) => {
    e.preventDefault();
    setIsDragging(true);

    const onPointerMove = (moveEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let percent;

      if (isHorizontal) {
        const clientX = moveEvent.clientX ?? moveEvent.touches?.[0]?.clientX;
        if (clientX === undefined) return;
        percent = ((clientX - rect.left) / rect.width) * 100;
      } else {
        const clientY = moveEvent.clientY ?? moveEvent.touches?.[0]?.clientY;
        if (clientY === undefined) return;
        percent = ((clientY - rect.top) / rect.height) * 100;
      }

      // Limitações saudáveis entre 20% e 80%
      const clamped = Math.max(20, Math.min(80, percent));
      setSizes([clamped, 100 - clamped]);
    };

    const onPointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('touchmove', onPointerMove);
    window.addEventListener('touchend', onPointerUp);
  };

  return (
    <ResizableContext.Provider value={{ direction, sizes, setSizes, startDrag, isDragging }}>
      <div
        ref={containerRef}
        className={`glico-resizable-group glico-resizable-${direction} ${className}`.trim()}
        style={{
          display: 'flex',
          flexDirection: isHorizontal ? 'row' : 'column',
          width: '100%',
          height: '100%',
          minHeight: isHorizontal ? '380px' : 'auto',
          overflow: 'hidden',
          userSelect: isDragging ? 'none' : 'auto',
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    </ResizableContext.Provider>
  );
}

/**
 * ResizablePanel
 * Painel filho responsivo dentro do ResizablePanelGroup.
 */
export function ResizablePanel({
  order = 0, // 0 para o primeiro, 1 para o segundo
  defaultSize,
  children,
  className = '',
  style = {},
  ...props
}) {
  const context = useContext(ResizableContext);

  if (!context) {
    return <div className={className} style={style} {...props}>{children}</div>;
  }

  const { sizes, direction } = context;
  const isHorizontal = direction === 'horizontal';
  const size = sizes[order] !== undefined ? sizes[order] : 50;

  return (
    <div
      className={`glico-resizable-panel ${className}`.trim()}
      style={{
        flexBasis: `${size}%`,
        flexGrow: 0,
        flexShrink: 0,
        maxWidth: `${size}%`,
        maxHeight: !isHorizontal ? `${size}%` : undefined,
        overflow: 'auto',
        transition: context.isDragging ? 'none' : 'flex-basis 0.1s ease',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * ResizableHandle
 * Alça arrastável divisória com indicador sutil de 3 pontinhos.
 */
export function ResizableHandle({
  withHandle = true,
  disabled = false,
  className = '',
  style = {},
  ...props
}) {
  const context = useContext(ResizableContext);
  const [hovered, setHovered] = useState(false);

  if (!context) return null;

  const { direction, startDrag, isDragging } = context;
  const isHorizontal = direction === 'horizontal';

  return (
    <div
      role="separator"
      tabIndex={0}
      onPointerDown={(e) => !disabled && startDrag(0, e)}
      onTouchStart={(e) => !disabled && startDrag(0, e)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`glico-resizable-handle ${className}`.trim()}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: disabled ? 'default' : isHorizontal ? 'col-resize' : 'row-resize',
        width: isHorizontal ? '9px' : '100%',
        height: isHorizontal ? '100%' : '9px',
        backgroundColor: hovered || isDragging ? 'var(--cor-borda)' : 'transparent',
        transition: 'background-color 0.15s ease',
        userSelect: 'none',
        touchAction: 'none',
        flexShrink: 0,
        zIndex: 10,
        ...style,
      }}
      {...props}
    >
      {/* Linha central sutil */}
      <div
        style={{
          position: 'absolute',
          backgroundColor: 'var(--cor-borda)',
          ...(isHorizontal
            ? { width: '1px', height: '100%', left: '4px' }
            : { height: '1px', width: '100%', top: '4px' }),
        }}
      />

      {/* Alça com 3 pontinhos discretos */}
      {withHandle && (
        <div
          style={{
            zIndex: 11,
            display: 'flex',
            flexDirection: isHorizontal ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            padding: isHorizontal ? '4px 2px' : '2px 4px',
            borderRadius: '4px',
            backgroundColor: 'var(--cor-superficie-elevada)',
            border: '1px solid var(--cor-borda)',
            boxShadow: '0 1px 3px rgba(46, 40, 36, 0.08)',
          }}
        >
          <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: 'var(--cor-texto-suave)' }} />
          <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: 'var(--cor-texto-suave)' }} />
          <span style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: 'var(--cor-texto-suave)' }} />
        </div>
      )}
    </div>
  );
}

export default ResizablePanelGroup;
/* FIM DO COMPONENTE RESIZABLE */
