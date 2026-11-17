/* ==========================================================================
   ARQUIVO: AuthContext.jsx (Localização: /frontend/src/context/AuthContext.jsx)
   OBJETIVO: Provedor global de estado de autenticação e controle de permissões (RBAC).
   REGRAS DE NEGÓCIO ATENDIDAS:
     - RN-ACC-01: Controle de acesso por perfis (Visitante, Paciente, Especialista, Admin).
     - RN-ESP-01: Verificação de credenciamento ativo para especialistas de saúde.
     - Persistência segura em localStorage ou sessionStorage conforme escolha do usuário.
   ========================================================================== */

import React, { createContext, useContext, useState, useEffect } from 'react';

// Criação do Contexto de Autenticação
const AuthContext = createContext(null);

/* INÍCIO DO COMPONENTE AUTHPROVIDER */
export function AuthProvider({ children }) {
  // Estado do usuário autenticado
  const [usuario, setUsuario] = useState(null);

  // Token Bearer da sessão
  const [token, setToken] = useState(null);

  // Dados complementares do perfil profissional (quando especialista)
  const [especialista, setEspecialista] = useState(null);

  // Estado de carregamento da checagem inicial da sessão
  const [carregando, setCarregando] = useState(true);

  /**
   * Normaliza o tipo de perfil para os 4 perfis oficiais da plataforma GlicoCare:
   * 'diabetico'   -> 'diabetico'
   * 'cuidador'    -> 'cuidador'
   * 'especialista'-> 'especialista'
   * 'admin'       -> 'admin'
   * (Compatibilidade: 'familiar_paciente' -> 'diabetico', 'admin_moderador' -> 'admin')
   */
  const obterPerfilNormalizado = (tipoOriginal) => {
    if (!tipoOriginal) return 'visitante';
    if (tipoOriginal === 'admin_moderador' || tipoOriginal === 'admin') return 'admin';
    if (tipoOriginal === 'especialista') return 'especialista';
    if (tipoOriginal === 'cuidador') return 'cuidador';
    if (tipoOriginal === 'diabetico' || tipoOriginal === 'familiar_paciente' || tipoOriginal === 'paciente') return 'diabetico';
    return tipoOriginal;
  };

  /**
   * Inicializa a sessão recuperando do localStorage ou sessionStorage
   */
  useEffect(() => {
    try {
      const tokenLocal = localStorage.getItem('glicocare_token') || sessionStorage.getItem('glicocare_token');
      const usuarioLocal = localStorage.getItem('glicocare_usuario') || sessionStorage.getItem('glicocare_usuario');
      const especialistaLocal = localStorage.getItem('glicocare_especialista') || sessionStorage.getItem('glicocare_especialista');

      if (tokenLocal && usuarioLocal) {
        setToken(tokenLocal);
        setUsuario(JSON.parse(usuarioLocal));
        if (especialistaLocal) {
          setEspecialista(JSON.parse(especialistaLocal));
        }
      }
    } catch (err) {
      console.warn('Sessão prévia não pôde ser restaurada:', err);
    } finally {
      setCarregando(false);
    }
  }, []);

  /**
   * Executa o login registrando os dados no estado e no armazenamento selecionado
   *
   * @param {Object} dadosResposta Dados retornados pelo endpoint /backend/api/auth/login.php
   * @param {boolean} lembrarMe Define se os dados persistirão em localStorage (true) ou sessionStorage (false)
   */
  const login = (dadosResposta, lembrarMe = true) => {
    const { token: novoToken, usuario: novoUsuario, especialista: novoEsp } = dadosResposta.dados || dadosResposta;

    setToken(novoToken);
    setUsuario(novoUsuario);
    setEspecialista(novoEsp || null);

    const storage = lembrarMe ? localStorage : sessionStorage;
    const outroStorage = lembrarMe ? sessionStorage : localStorage;

    // Limpa o outro armazenamento para evitar duplicação
    outroStorage.removeItem('glicocare_token');
    outroStorage.removeItem('glicocare_usuario');
    outroStorage.removeItem('glicocare_especialista');

    storage.setItem('glicocare_token', novoToken);
    storage.setItem('glicocare_usuario', JSON.stringify(novoUsuario));
    if (novoEsp) {
      storage.setItem('glicocare_especialista', JSON.stringify(novoEsp));
    }
  };

  /**
   * Encerra a sessão com segurança, limpando o armazenamento
   */
  const logout = () => {
    setToken(null);
    setUsuario(null);
    setEspecialista(null);

    localStorage.removeItem('glicocare_token');
    localStorage.removeItem('glicocare_usuario');
    localStorage.removeItem('glicocare_especialista');

    sessionStorage.removeItem('glicocare_token');
    sessionStorage.removeItem('glicocare_usuario');
    sessionStorage.removeItem('glicocare_especialista');
  };

  /**
   * Atualiza dados do usuário logado (ex: após configurar perfil ou salvar alterações)
   */
  const atualizarUsuario = (dadosAtualizados) => {
    setUsuario((prev) => {
      const merged = { ...prev, ...dadosAtualizados };
      if (localStorage.getItem('glicocare_token')) {
        localStorage.setItem('glicocare_usuario', JSON.stringify(merged));
      } else {
        sessionStorage.setItem('glicocare_usuario', JSON.stringify(merged));
      }
      return merged;
    });
  };

  /**
   * Atualiza os dados de especialista (ex: após aprovação ou edição de agenda)
   */
  const atualizarEspecialista = (dadosAtualizados) => {
    setEspecialista((prev) => {
      const merged = { ...prev, ...dadosAtualizados };
      if (localStorage.getItem('glicocare_token')) {
        localStorage.setItem('glicocare_especialista', JSON.stringify(merged));
      } else {
        sessionStorage.setItem('glicocare_especialista', JSON.stringify(merged));
      }
      return merged;
    });
  };

  /**
   * Verifica se o usuário atual possui um dos papéis requeridos (RBAC - RN-ACC-01)
   */
  const temPermissao = (rolesPermitidos = []) => {
    if (!rolesPermitidos || rolesPermitidos.length === 0) return true;
    if (!usuario) return false;
    const perfilAtual = obterPerfilNormalizado(usuario.tipo_usuario || usuario.tipo_perfil);

    return rolesPermitidos.some((role) => {
      const normalizado = obterPerfilNormalizado(role);
      // 'paciente' abrange tanto diabéticos quanto seus cuidadores
      if (role === 'paciente' && (perfilAtual === 'diabetico' || perfilAtual === 'cuidador')) {
        return true;
      }
      return normalizado === perfilAtual;
    });
  };

  const perfilNormalizado = usuario ? obterPerfilNormalizado(usuario.tipo_usuario || usuario.tipo_perfil) : 'visitante';
  const estaAutenticado = Boolean(token && usuario);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        especialista,
        perfil: perfilNormalizado,
        estaAutenticado,
        carregando,
        login,
        logout,
        atualizarUsuario,
        atualizarEspecialista,
        temPermissao,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
/* FIM DO COMPONENTE AUTHPROVIDER */

/**
 * Hook personalizado para consumir o contexto de autenticação
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um <AuthProvider>');
  }
  return context;
}

export default AuthContext;
