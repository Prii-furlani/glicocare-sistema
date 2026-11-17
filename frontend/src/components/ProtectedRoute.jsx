/* ==========================================================================
   ARQUIVO: ProtectedRoute.jsx (Localização: /frontend/src/components/ProtectedRoute.jsx)
   OBJETIVO: Guarda de rotas protegidas por autenticação e perfil (RBAC — RN-ACC-01).
   REGRAS DE NEGÓCIO ATENDIDAS:
     - RN-ACC-01: Bloqueia acesso a rotas não autorizadas com base no tipo de perfil.
     - RN-ESP-01: Para rotas de especialistas, verifica se o registro profissional
       está ativo e verificado antes de liberar o painel de agenda.
     - Tom de Voz ("Porto Seguro"): Mensagens acolhedoras e sem rispidez.
   ========================================================================== */

import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

/* INÍCIO DO COMPONENTE PROTECTEDROUTE */
export default function ProtectedRoute({
  allowedRoles = [],                  // Lista de papéis permitidos (ex: ['admin'], ['especialista'], ['paciente'])
  requerEspecialistaVerificado = false,// Se verdadeiro, exige que especialista tenha registro_verificado === 1
  children,
}) {
  const { usuario, perfil, especialista, estaAutenticado, carregando, temPermissao } = useAuth();
  const location = useLocation();

  // 1. Enquanto restaura a sessão do storage, exibe um indicador sereno
  if (carregando) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--cor-fundo)',
          color: 'var(--cor-texto)',
          padding: '2rem',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🩺</div>
        <p style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.2rem', color: '#7C533F' }}>
          Preparando seu espaço seguro...
        </p>
      </div>
    );
  }

  // 2. Visitante não autenticado: Redireciona para o Login
  if (!estaAutenticado) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
          mensagem: 'Para acessar este conteúdo, por favor entre no seu espaço seguro.',
        }}
        replace
      />
    );
  }

  // 3. Usuário autenticado, mas com perfil não autorizado para esta rota (RN-ACC-01)
  if (allowedRoles.length > 0 && !temPermissao(allowedRoles)) {
    return (
      <div
        style={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--cor-fundo)',
          padding: '3rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '540px',
            backgroundColor: 'var(--cor-superficie)',
            borderRadius: '16px',
            padding: '2.5rem',
            textAlign: 'center',
            boxShadow: '0 12px 32px rgba(46, 40, 36, 0.08)',
            border: '1px solid rgba(124, 83, 63, 0.15)',
          }}
        >
          <div style={{ fontSize: '2.4rem', marginBottom: '1rem' }}>🛡️</div>

          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#7C533F',
              marginBottom: '0.5rem',
            }}
          >
            — Área Reservada (RN-ACC-01)
          </div>

          <h2
            style={{
              fontFamily: 'var(--fonte-titulo)',
              fontSize: '1.6rem',
              color: 'var(--cor-texto)',
              marginBottom: '0.85rem',
            }}
          >
            Este espaço é reservado a outros papéis do sistema
          </h2>

          <p
            style={{
              fontSize: '0.94rem',
              color: '#5A5049',
              lineHeight: 1.6,
              marginBottom: '1.75rem',
            }}
          >
            Você está conectado como <strong>{usuario.nome_completo}</strong> (Perfil: <em>{perfil}</em>).
            Esta rota específica exige autorização dos papéis: {allowedRoles.join(', ')}.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/">
              <Button variante="secundario">← Voltar à página inicial</Button>
            </Link>
            <Link to={(perfil === 'paciente' || perfil === 'diabetico' || perfil === 'cuidador') ? '/meu-perfil' : (perfil === 'especialista' ? '/painel-especialista' : '/painel-admin')}>
              <Button variante="primario">Ir para o meu painel →</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Especialista autenticado, mas com credenciamento em análise (RN-ESP-01)
  if (
    perfil === 'especialista' &&
    requerEspecialistaVerificado &&
    especialista &&
    (intOuZero(especialista.registro_verificado) !== 1 && especialista.status_credenciamento !== 'aprovado')
  ) {
    return (
      <div
        style={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--cor-fundo)',
          padding: '3rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '560px',
            backgroundColor: 'var(--cor-superficie)',
            borderRadius: '16px',
            padding: '2.75rem 2.25rem',
            textAlign: 'center',
            boxShadow: '0 12px 32px rgba(46, 40, 36, 0.08)',
            border: '1px solid #F5DCA3',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              backgroundColor: '#FFF8E6',
              border: '2px solid #E8B958',
              fontSize: '2rem',
              marginBottom: '1.25rem',
            }}
          >
            ⏳
          </div>

          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#7C533F',
              marginBottom: '0.5rem',
            }}
          >
            — Validação em Andamento (RN-ESP-01)
          </div>

          <h2
            style={{
              fontFamily: 'var(--fonte-titulo)',
              fontSize: '1.65rem',
              color: 'var(--cor-texto)',
              marginBottom: '0.85rem',
            }}
          >
            Seu credenciamento está em análise acolhedora
          </h2>

          <p
            style={{
              fontSize: '0.94rem',
              color: '#5A5049',
              lineHeight: 1.6,
              marginBottom: '1.25rem',
            }}
          >
            Olá, <strong>{usuario.nome_completo}</strong>! Nosso time de curadoria médica está validando o seu registro ativo
            no conselho ({especialista.tipo_conselho || 'CRM/CRN/CREF/CRP'} {especialista.numero_conselho || ''}).
          </p>

          <div
            style={{
              backgroundColor: '#FFF8E6',
              borderRadius: '10px',
              padding: '1rem',
              marginBottom: '1.75rem',
              fontSize: '0.86rem',
              color: '#7C533F',
              textAlign: 'left',
              border: '1px solid #F5DCA3',
            }}
          >
            <strong>Por que esse processo é essencial?</strong>
            <p style={{ margin: '0.35rem 0 0 0', lineHeight: 1.5 }}>
              Para manter o ecossistema GlicoCare como um verdadeiro <em>Porto Seguro</em> para famílias com Diabetes Tipo 1,
              todas as agendas e teleconsultas só são liberadas após a confirmação rigorosa de conselho ativo.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/credenciamento">
              <Button variante="secundario">Revisar meus dados →</Button>
            </Link>
            <Link to="/biblioteca">
              <Button variante="primario">Conhecer a Biblioteca</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 5. Autorizado com sucesso: Renderiza os componentes filhos
  return <>{children}</>;
}

/**
 * Função utilitária para conversão segura de valores inteiros
 */
function intOuZero(val) {
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
}
/* FIM DO COMPONENTE PROTECTEDROUTE */
