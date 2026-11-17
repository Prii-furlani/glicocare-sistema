/* ==========================================================================
   ARQUIVO: FormInput.jsx
   COMPONENTE: FormInput (Campo de Formulário Padronizado e Reutilizável)
   OBJETIVO: Unificar a criação de campos de entrada (input, textarea, select
   e checkbox) com rótulos acessíveis, dicas de preenchimento e estilos visuais
   serenos alinhados ao Design System GlicoCare.
   ========================================================================== */

import React from 'react';
import CustomSelect from './CustomSelect';

/* INÍCIO DO COMPONENTE FORM INPUT */
export default function FormInput({
  id,                         // Identificador único para conectar <label> ao campo
  name,                       // Nome do atributo HTML utilizado no estado do formulário
  label,                      // Texto descritivo exibido acima do campo
  tipo = 'text',              // Tipo do campo: 'text', 'email', 'search', 'textarea', 'select', 'checkbox'
  value,                      // Valor controlado pelo estado do React
  checked,                    // Estado booleano específico para campos do tipo 'checkbox'
  onChange,                   // Função manipuladora de alteração de estado
  placeholder = '',           // Texto de exemplo dentro do campo vazio
  obrigatorio = false,        // Define se o preenchimento é obrigatório (required)
  opcoes = [],                // Lista de opções [{ valor, rotulo }] quando tipo === 'select'
  linhas = 4,                 // Quantidade de linhas visíveis quando tipo === 'textarea'
  maxLength,                  // Limite opcional de caracteres (ex: UF com 2 letras)
  textoAjuda = '',            // Explicação complementar suave abaixo do campo
}) {
  // Define um ID automático baseado no 'name' caso não seja passado explicitamente
  const inputId = id || `campo-${name}`;

  /* INÍCIO DA VARIANTE CHECKBOX (CAIXA DE CONFIRMAÇÃO / TERMOS) */
  if (tipo === 'checkbox') {
    return (
      <div className="gc-form-group">
        <label
          htmlFor={inputId}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
            fontSize: '0.9rem',
            backgroundColor: 'var(--cor-fundo)',
            padding: 'var(--espaco-md)',
            borderRadius: 'var(--raio-medio)',
            border: '1px solid var(--cor-borda)',
            cursor: 'pointer',
          }}
        >
          <input
            id={inputId}
            type="checkbox"
            name={name}
            checked={checked}
            onChange={onChange}
            required={obrigatorio}
            style={{ marginTop: '0.25rem', accentColor: 'var(--cor-cta)' }}
          />
          <span>{label}</span>
        </label>
        {textoAjuda && <span className="gc-help-text">{textoAjuda}</span>}
      </div>
    );
  }
  /* FIM DA VARIANTE CHECKBOX */

  /* INÍCIO DAS VARIANTES PADRÃO (TEXT, EMAIL, SEARCH, SELECT, TEXTAREA) */
  return (
    <div className="gc-form-group">
      {/* Renderiza o rótulo superior caso a prop 'label' tenha sido fornecida */}
      {label && (
        <label htmlFor={inputId} className="gc-label">
          {label}{' '}
          {obrigatorio && (
            <span style={{ color: 'var(--cor-primaria)' }} title="Obrigatório">
              *
            </span>
          )}
        </label>
      )}

      {/* Renderização condicional conforme o tipo de controle solicitado */}
      {tipo === 'textarea' ? (
        <textarea
          id={inputId}
          name={name}
          rows={linhas}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={obrigatorio}
          className="gc-textarea"
        />
      ) : tipo === 'select' ? (
        <CustomSelect
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          required={obrigatorio}
          options={opcoes.map((op) => ({
            value: op.valor !== undefined ? op.valor : op.value,
            label: op.rotulo !== undefined ? op.rotulo : op.label,
          }))}
        />
      ) : (
        <input
          id={inputId}
          type={tipo}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={obrigatorio}
          maxLength={maxLength}
          className="gc-input"
        />
      )}

      {/* Exibe nota auxiliar abaixo do campo se informada */}
      {textoAjuda && <span className="gc-help-text">{textoAjuda}</span>}
    </div>
  );
  /* FIM DAS VARIANTES PADRÃO */
}
/* FIM DO COMPONENTE FORM INPUT */
