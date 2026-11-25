/* ==========================================================================
   ARQUIVO: frontend/src/components/ui/Table.jsx
   OBJETIVO: Primitivo de Tabela no padrão shadcn/ui com paleta "Porto Seguro".
   Tabela minimalista sem bordas verticais, cabeçalho discreto e hover suave.
   ========================================================================== */

import React from 'react';

/* INÍCIO DO COMPONENTE: TABLE */
export function Table({ className = '', style = {}, children, ...props }) {
  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table
        className={`gc-table ${className}`}
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.88rem',
          captionSide: 'bottom',
          textAlign: 'left',
          ...style,
        }}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

/* INÍCIO DO COMPONENTE: TABLE HEADER */
export function TableHeader({ className = '', style = {}, children, ...props }) {
  return (
    <thead
      className={`gc-table-header ${className}`}
      style={{
        borderBottom: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.12))',
        ...style,
      }}
      {...props}
    >
      {children}
    </thead>
  );
}

/* INÍCIO DO COMPONENTE: TABLE BODY */
export function TableBody({ className = '', style = {}, children, ...props }) {
  return (
    <tbody className={`gc-table-body ${className}`} style={{ ...style }} {...props}>
      {children}
    </tbody>
  );
}

/* INÍCIO DO COMPONENTE: TABLE ROW */
export function TableRow({ className = '', style = {}, children, ...props }) {
  return (
    <tr
      className={`gc-table-row ${className}`}
      style={{
        borderBottom: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.08))',
        transition: 'background-color 0.15s ease',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(124, 83, 63, 0.03)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      {...props}
    >
      {children}
    </tr>
  );
}

/* INÍCIO DO COMPONENTE: TABLE HEAD */
export function TableHead({ className = '', style = {}, children, ...props }) {
  return (
    <th
      className={`gc-table-head ${className}`}
      style={{
        padding: '0.75rem 1rem',
        fontSize: '12px',
        fontWeight: 600,
        color: 'var(--cor-texto-suave, #5C534C)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        verticalAlign: 'middle',
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...props}
    >
      {children}
    </th>
  );
}

/* INÍCIO DO COMPONENTE: TABLE CELL */
export function TableCell({ className = '', style = {}, children, ...props }) {
  return (
    <td
      className={`gc-table-cell ${className}`}
      style={{
        padding: '0.85rem 1rem',
        verticalAlign: 'middle',
        color: 'var(--cor-texto, #2E2824)',
        fontVariantNumeric: 'tabular-nums',
        ...style,
      }}
      {...props}
    >
      {children}
    </td>
  );
}
/* FIM DO COMPONENTE TABLE */
