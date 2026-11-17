/* ==========================================================================
   ARQUIVO: CustomSelect.jsx
   COMPONENTE: CustomSelect (Seletor Personalizado "Porto Seguro")
   OBJETIVO:
     Substituir os elementos <select> nativos do navegador, eliminando o
     azul padrão do Windows/Chrome/Safari e assegurando a identidade visual
     acolhedora da GlicoCare (--cor-fundo, --cor-superficie, --cor-cta, --cor-primaria).
   RECURSOS:
     - Botão gatilho com seta SVG animada e truncamento com reticências;
     - Dropdown flutuante com sombra suave, bordas arredondadas e scroll fino;
     - Hover bege acolhedor (#F6F3EE) e seleção verde suave (rgba(59, 126, 72, 0.12));
     - Ícone de check (✓) Verde Alívio na opção selecionada;
     - Suporte a navegação por teclado (Enter, Espaço, Esc, Setas) e clique fora;
     - Compatível tanto com handlers (e) => e.target.value quanto (val) => val.
   ========================================================================== */

import React, { useState, useRef, useEffect, useId } from 'react';

/* INÍCIO DO COMPONENTE CUSTOMSELECT */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Selecione uma opção...',
  disabled = false,
  name,
  id,
  className = '',
  style = {},
  triggerStyle = {},
  dropdownStyle = {},
  required = false,
  children,
  'aria-label': ariaLabel,
}) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const uniqueId = useId();
  const selectId = id || name || uniqueId;

  // Normaliza lista de opções a partir de `options` (array de strings ou objetos) ou de `children` (<option>)
  const normalizarOpcoes = () => {
    if (Array.isArray(options) && options.length > 0) {
      return options.map((opt) => {
        if (typeof opt === 'string' || typeof opt === 'number') {
          return { value: opt, label: String(opt) };
        }
        return {
          value: opt.value !== undefined ? opt.value : opt.valor,
          label: opt.label !== undefined ? opt.label : (opt.rotulo || String(opt.value)),
          subtexto: opt.subtexto || opt.descricao,
          icone: opt.icone,
          disabled: Boolean(opt.disabled),
        };
      });
    }

    // Suporte caso o desenvolvedor passe <option value="...">...</option> como children
    if (children) {
      const parsed = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.type === 'option') {
          parsed.push({
            value: child.props.value !== undefined ? child.props.value : child.props.children,
            label: child.props.children || String(child.props.value),
            disabled: Boolean(child.props.disabled),
          });
        }
      });
      return parsed;
    }

    return [];
  };

  const listaOpcoes = normalizarOpcoes();

  // Encontra a opção atualmente selecionada
  const opcaoSelecionada = listaOpcoes.find(
    (opt) => String(opt.value) === String(value)
  );

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    if (!aberto) return;

    const handleClickFora = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setAberto(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setAberto(false);
        if (triggerRef.current) triggerRef.current.focus();
      }
    };

    document.addEventListener('mousedown', handleClickFora);
    document.addEventListener('touchstart', handleClickFora);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickFora);
      document.removeEventListener('touchstart', handleClickFora);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [aberto]);

  // Dispara seleção garantindo compatibilidade sintética
  const handleSelecionar = (opt) => {
    if (opt.disabled || disabled) return;
    setAberto(false);

    if (onChange) {
      // Cria evento sintético compatível com (e) => setVal(e.target.value)
      const syntheticEvent = {
        target: { value: opt.value, name: name || selectId },
        currentTarget: { value: opt.value, name: name || selectId },
        value: opt.value,
      };
      onChange(syntheticEvent, opt.value);
    }

    if (triggerRef.current) {
      triggerRef.current.focus();
    }
  };

  // Navegação por teclado no gatilho
  const handleTriggerKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setAberto((prev) => !prev);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`gc-custom-select-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {/* Botão Gatilho (Trigger) com mesmo visual dos inputs oficiais GlicoCare */}
      <button
        ref={triggerRef}
        type="button"
        id={selectId}
        disabled={disabled}
        onClick={() => !disabled && setAberto((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-label={ariaLabel || placeholder}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.65rem',
          backgroundColor: '#FFFFFF',
          border: aberto
            ? '1px solid var(--cor-cta, #3B7E48)'
            : '1px solid rgba(124, 83, 63, 0.22)',
          borderRadius: '12px',
          padding: '11px 14px',
          fontFamily: 'var(--fonte-corpo, "Plus Jakarta Sans", sans-serif)',
          fontSize: '14.5px',
          color: opcaoSelecionada ? 'var(--cor-texto, #2E2824)' : 'rgba(46, 40, 36, 0.45)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          boxShadow: aberto ? '0 0 0 3px rgba(59, 126, 72, 0.14)' : 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          outline: 'none',
          boxSizing: 'border-box',
          textAlign: 'left',
          ...triggerStyle,
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            flex: 1,
          }}
        >
          {opcaoSelecionada?.icone && <span>{opcaoSelecionada.icone}</span>}
          <span>{opcaoSelecionada ? opcaoSelecionada.label : placeholder}</span>
        </span>

        {/* Seta SVG Minimalista com rotação suave ao abrir */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: aberto ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.22s ease',
            color: 'var(--cor-primaria, #7C533F)',
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {/* Menu Suspenso (Dropdown) com Cores Oficiais GlicoCare */}
      {aberto && (
        <div
          ref={dropdownRef}
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: '100%',
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(124, 83, 63, 0.18)',
            borderRadius: '14px',
            boxShadow: '0 12px 30px rgba(46, 40, 36, 0.12)',
            zIndex: 9999,
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '6px',
            boxSizing: 'border-box',
            animation: 'gcFadeInDown 0.18s ease-out',
            ...dropdownStyle,
          }}
        >
          {listaOpcoes.length === 0 ? (
            <div
              style={{
                padding: '10px 12px',
                fontSize: '0.85rem',
                color: 'var(--cor-texto-suave, #5C534C)',
                textAlign: 'center',
              }}
            >
              Nenhuma opção disponível
            </div>
          ) : (
            listaOpcoes.map((opt) => {
              const estaSelecionado = String(opt.value) === String(value);

              return (
                <div
                  key={String(opt.value)}
                  role="option"
                  aria-selected={estaSelecionado}
                  onClick={() => handleSelecionar(opt)}
                  onMouseEnter={(e) => {
                    if (!estaSelecionado && !opt.disabled) {
                      e.currentTarget.style.backgroundColor = 'var(--cor-superficie, #F6F3EE)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!estaSelecionado) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '9px',
                    fontSize: '14px',
                    lineHeight: 1.4,
                    cursor: opt.disabled ? 'not-allowed' : 'pointer',
                    opacity: opt.disabled ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.65rem',
                    backgroundColor: estaSelecionado
                      ? 'rgba(59, 126, 72, 0.12)' // Fundo Verde Alívio suave
                      : 'transparent',
                    color: estaSelecionado
                      ? '#2D6337' // Verde Alívio escuro legível
                      : 'var(--cor-texto, #2E2824)',
                    fontWeight: estaSelecionado ? 600 : 400,
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      {opt.icone && <span>{opt.icone}</span>}
                      <span>{opt.label}</span>
                    </div>
                    {opt.subtexto && (
                      <span
                        style={{
                          fontSize: '0.78rem',
                          color: estaSelecionado ? '#2D6337' : '#7A6E65',
                          opacity: 0.85,
                        }}
                      >
                        {opt.subtexto}
                      </span>
                    )}
                  </div>

                  {/* Ícone de Check Verde Alívio na Opção Selecionada (Elimina Azul do Navegador) */}
                  {estaSelecionado && (
                    <span
                      style={{
                        color: 'var(--cor-cta, #3B7E48)',
                        fontWeight: 700,
                        fontSize: '13px',
                        lineHeight: 1,
                      }}
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
/* FIM DO COMPONENTE CUSTOMSELECT */
