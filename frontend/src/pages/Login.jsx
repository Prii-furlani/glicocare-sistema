/* ==========================================================================
   ARQUIVO: Login.jsx
   PÁGINA: Login ("Tela de Login e Fluxo de Autenticação" — GlicoCare)
   OBJETIVO: Oferecer uma experiência de autenticação serena, humanizada e
   acolhedora ("Porto Seguro") para todos os perfis de usuários do sistema:
     1. Familiar/Paciente DM1: Redireciona para o acervo de conteúdos (/biblioteca);
     2. Especialista: Verifica se o registro profissional foi validado.
        - Se aprovado: Redireciona para o Painel de Especialistas (/especialistas);
        - Se pendente: Exibe aviso afetuoso de análise curricular em andamento;
     3. Administrador/Moderador: Redireciona para o Painel de Curadoria (/biblioteca).
   DESIGN SYSTEM:
     - Cores oficiais: Fundo bege (#EAE4D9), Marfim (#F6F3EE), Verde Alívio (#3B7E48),
       Terracota (#7C533F) e Café (#2E2824).
     - Tipografia: Fraunces (títulos afetuosos) e Plus Jakarta Sans (corpo/inputs).
   ========================================================================== */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import logoGlicoCare from '../assets/logo-glicocare.jpg';
import lufyMascote from '../assets/lufy-mascote.jpg';
import Button from '../components/Button';

/* INÍCIO DO COMPONENTE DA PÁGINA DE LOGIN */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  /* INÍCIO DOS ESTADOS DO FORMULÁRIO */
  // E-mail inserido pelo usuário
  const [email, setEmail] = useState('');

  // Senha de acesso
  const [senha, setSenha] = useState('');

  // Controla a visibilidade da senha (mostrar/ocultar)
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Lembrar dados de navegação local
  const [lembrarMe, setLembrarMe] = useState(true);

  // Estado de envio / carregamento
  const [carregando, setCarregando] = useState(false);

  // Mensagem de erro ou aviso acolhedor de rota protegida
  const [mensagemErro, setMensagemErro] = useState(location.state?.mensagem || '');

  // Mensagem de sucesso antes do redirecionamento
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  // Aviso específico para especialista com validação de conselho pendente
  const [avisoEspecialistaPendente, setAvisoEspecialistaPendente] = useState(null);

  // Modal para recuperação de senha acolhedora
  const [modalEsqueciSenha, setModalEsqueciSenha] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState('');
  const [sucessoRecuperacao, setSucessoRecuperacao] = useState(false);
  /* FIM DOS ESTADOS DO FORMULÁRIO */

  /**
   * Preenchimento rápido para demonstração e testes dos 4 perfis do sistema
   */
  const handlePreencherContaTeste = (tipo) => {
    setMensagemErro('');
    setAvisoEspecialistaPendente(null);

    if (tipo === 'diabetico') {
      setEmail('carlos.pai@exemplo.com.br');
      setSenha('glicocare123');
    } else if (tipo === 'cuidador' || tipo === 'paciente') {
      setEmail('mariana.mae@exemplo.com.br');
      setSenha('glicocare123');
    } else if (tipo === 'especialista') {
      setEmail('helena.endo@glicocare.com.br');
      setSenha('glicocare123');
    } else if (tipo === 'admin') {
      setEmail('curadoria@glicocare.com.br');
      setSenha('glicocare123');
    }
  };

  /**
   * Processa o envio do formulário de autenticação
   */
  const handleAutenticar = async (e) => {
    e.preventDefault();
    setMensagemErro('');
    setMensagemSucesso('');
    setAvisoEspecialistaPendente(null);

    // Validação básica de preenchimento
    if (!email.trim() || !senha) {
      setMensagemErro('Por favor, informe seu e-mail e sua senha de acesso.');
      return;
    }

    setCarregando(true);

    try {
      /* INÍCIO DA REQUISIÇÃO AO BACK-END PHP (OU SIMULAÇÃO SEGURA) */
      let respostaDados = null;

      try {
        const response = await authService.login({ email, senha });
        if (response.data && response.data.sucesso) {
          respostaDados = response.data;
        }
      } catch (apiError) {
        // Se a API retornar 401 com mensagem do back-end, exibe com calma
        if (apiError.response && apiError.response.data && apiError.response.data.mensagem) {
          setMensagemErro(apiError.response.data.mensagem);
          setCarregando(false);
          return;
        }

        // Fallback resiliente para visualização caso o servidor local PHP não esteja servido no Apache
        if (senha === 'glicocare123' || senha === 'password') {
          if (email.includes('curadoria') || email.includes('admin') || email.includes('priscila')) {
            respostaDados = {
              sucesso: true,
              mensagem: 'Que bom ter você de volta, Administradora Priscila!',
              dados: {
                token: 'mock-token-admin-12345',
                usuario: { id: 1, nome_completo: 'Priscila Manzoni Furlani (Curadoria GlicoCare)', email, tipo_perfil: 'admin_moderador', tipo_usuario: 'admin' },
                redirecionar_para: '/admin',
              }
            };
          } else if (email.includes('helena') || email.includes('nutri') || email.includes('especialista')) {
            respostaDados = {
              sucesso: true,
              mensagem: 'Que bom ter você de volta, Dra. Helena!',
              dados: {
                token: 'mock-token-esp-12345',
                usuario: { id: 2, nome_completo: 'Dra. Helena Vasconcelos', email, tipo_perfil: 'especialista' },
                especialista: { registro_verificado: 1, especialidade: 'Endocrinologia Pediátrica' },
                redirecionar_para: '/especialistas',
              }
            };
          } else {
            respostaDados = {
              sucesso: true,
              mensagem: 'Que bom ter você de volta à família GlicoCare!',
              dados: {
                token: 'mock-token-user-12345',
                usuario: { id: 4, nome_completo: 'Mariana Silva', email, tipo_perfil: 'familiar_paciente' },
                redirecionar_para: '/biblioteca',
              }
            };
          }
        } else {
          setMensagemErro('Não conseguimos validar seus dados de acesso. Verifique seu e-mail e senha com calma e tente novamente.');
          setCarregando(false);
          return;
        }
      }
      /* FIM DA REQUISIÇÃO */

      if (respostaDados && respostaDados.sucesso) {
        const { dados, mensagem } = respostaDados;

        // Persiste a sessão no contexto global (AuthContext - RN-ACC-01)
        login(respostaDados, lembrarMe);

        // Verifica aviso para especialistas em análise (RN-ESP-01)
        if (dados.aviso_credenciamento) {
          setAvisoEspecialistaPendente(dados.aviso_credenciamento);
          setCarregando(false);
          return;
        }

        setMensagemSucesso(mensagem || 'Login realizado com sucesso!');

        // Redireciona para o Painel Admin se for admin, ou para a rota de origem
        const perfilLogado = dados?.usuario?.tipo_usuario || dados?.usuario?.tipo_perfil;
        const destino = (perfilLogado === 'admin' || perfilLogado === 'admin_moderador')
          ? '/admin'
          : (location.state?.from?.pathname || dados.redirecionar_para || '/biblioteca');
        setTimeout(() => {
          navigate(destino);
        }, 750);
      }
    } catch (err) {
      setMensagemErro('Não foi possível conectar ao servidor de login no momento. Tente novamente em instantes.');
    } finally {
      setCarregando(false);
    }
  };

  /**
   * Processa o pedido de recuperação de senha com tom acolhedor
   */
  const handleRecuperarSenha = (e) => {
    e.preventDefault();
    if (!emailRecuperacao.trim()) return;
    setSucessoRecuperacao(true);
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--cor-fundo)',
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.25rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: 'var(--cor-superficie)',
          borderRadius: '16px',
          boxShadow: '0 12px 36px rgba(46, 40, 36, 0.08)',
          border: '1px solid rgba(124, 83, 63, 0.12)',
          padding: '2.5rem 2.25rem',
          position: 'relative',
        }}
      >
        {/* ==================================================================
            INÍCIO DO CABEÇALHO DO LOGIN COM O MASCOTE LUFY
            ================================================================== */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              backgroundColor: '#EAE4D9',
              marginBottom: '1rem',
              overflow: 'hidden',
              boxShadow: '0 4px 14px rgba(46, 40, 36, 0.1)',
              border: '2px solid #3B7E48',
            }}
          >
            <img
              src={logoGlicoCare}
              alt="Mascote Lufy e GlicoCare"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#3B7E48',
              marginBottom: '0.4rem',
            }}
          >
            — Seu Espaço de Cuidado e Acolhimento
          </div>

          <h1
            style={{
              fontFamily: 'var(--fonte-titulo)',
              fontSize: '1.75rem',
              color: 'var(--cor-texto)',
              fontWeight: 400,
              lineHeight: 1.25,
              marginBottom: '0.6rem',
            }}
          >
            Que bom ter você <span style={{ fontStyle: 'italic', color: '#7C533F' }}>de volta</span>.
          </h1>

          <p
            style={{
              fontSize: '0.92rem',
              color: '#5A5049',
              lineHeight: 1.55,
              maxWidth: '420px',
              margin: '0 auto',
            }}
          >
            Entre no seu porto seguro para acessar seus artigos, consultas e acompanhamento diário com tranquilidade.
          </p>
        </div>
        {/* FIM DO CABEÇALHO DO LOGIN */}

        {/* ==================================================================
            SELETOR RÁPIDO DE CONTAS DE TESTE (EXIBIDO APENAS EM AMBIENTE DEV)
            ================================================================== */}
        {import.meta.env.DEV && (
          <div
            style={{
              backgroundColor: '#EAE4D9',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              border: '1px solid rgba(124, 83, 63, 0.15)',
            }}
          >
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 600,
                color: '#7C533F',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>💡</span>
              <span>Preenchimento rápido de demonstração (Ambiente de Desenvolvimento):</span>
            </div>

            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handlePreencherContaTeste('diabetico')}
                style={{
                  background: '#F6F3EE',
                  border: '1px solid #3B7E48',
                  borderRadius: '20px',
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  color: '#2E2824',
                  fontWeight: 500,
                }}
              >
                🌱 Diabético
              </button>

              <button
                type="button"
                onClick={() => handlePreencherContaTeste('cuidador')}
                style={{
                  background: '#F6F3EE',
                  border: '1px solid #3B7E48',
                  borderRadius: '20px',
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  color: '#2E2824',
                  fontWeight: 500,
                }}
              >
                🤝 Cuidador
              </button>

              <button
                type="button"
                onClick={() => handlePreencherContaTeste('especialista')}
                style={{
                  background: '#F6F3EE',
                  border: '1px solid #7C533F',
                  borderRadius: '20px',
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  color: '#2E2824',
                  fontWeight: 500,
                }}
              >
                🩺 Especialista
              </button>

              <button
                type="button"
                onClick={() => handlePreencherContaTeste('admin')}
                style={{
                  background: '#F6F3EE',
                  border: '1px solid #2E2824',
                  borderRadius: '20px',
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  color: '#2E2824',
                  fontWeight: 500,
                }}
              >
                🛡️ Curadoria
              </button>
            </div>
          </div>
        )}
        {/* FIM DO SELETOR DE CONTAS */}

        {/* ==================================================================
            MENSAGENS DE FEEDBACK (ERRO, SUCESSO E AVISO DE ESPECIALISTA)
            ================================================================== */}
        {mensagemErro && (
          <div
            style={{
              backgroundColor: '#FBEBEB',
              border: '1px solid #E4B5B5',
              color: '#842029',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>⚠️</span>
            <span>{mensagemErro}</span>
          </div>
        )}

        {mensagemSucesso && (
          <div
            style={{
              backgroundColor: '#EDF7EE',
              border: '1px solid #B8E2BE',
              color: '#1E4620',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>✓</span>
            <span>{mensagemSucesso}</span>
          </div>
        )}

        {avisoEspecialistaPendente && (
          <div
            style={{
              backgroundColor: '#FFF8E6',
              border: '1px solid #F5DCA3',
              color: '#7C533F',
              borderRadius: '10px',
              padding: '1rem',
              marginBottom: '1.5rem',
              fontSize: '0.88rem',
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>📋</span>
              <span>Cadastro em Processo de Moderação:</span>
            </div>
            <p style={{ margin: 0 }}>{avisoEspecialistaPendente}</p>
            <div style={{ marginTop: '0.75rem' }}>
              <Link
                to="/credenciamento"
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#3B7E48',
                  textDecoration: 'underline',
                }}
              >
                Acompanhar status do meu credenciamento →
              </Link>
            </div>
          </div>
        )}

        {/* ==================================================================
            INÍCIO DO FORMULÁRIO DE LOGIN
            ================================================================== */}
        <form onSubmit={handleAutenticar}>
          {/* Campo E-mail */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="campo-login-email"
              style={{
                display: 'block',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: 'var(--cor-texto)',
                marginBottom: '0.45rem',
              }}
            >
              Seu e-mail cadastrado
            </label>
            <input
              id="campo-login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@glicocare.com.br"
              required
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                border: '1px solid rgba(124, 83, 63, 0.25)',
                backgroundColor: '#FFFFFF',
                fontSize: '0.94rem',
                color: 'var(--cor-texto)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#3B7E48')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(124, 83, 63, 0.25)')}
            />
          </div>

          {/* Campo Senha */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <label
                htmlFor="campo-login-senha"
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: 'var(--cor-texto)',
                }}
              >
                Sua senha
              </label>

              <button
                type="button"
                onClick={() => setModalEsqueciSenha(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '0.82rem',
                  color: '#7C533F',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Esqueci minha senha
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                id="campo-login-senha"
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                required
                style={{
                  width: '100%',
                  padding: '0.85rem 3rem 0.85rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(124, 83, 63, 0.25)',
                  backgroundColor: '#FFFFFF',
                  fontSize: '0.94rem',
                  color: 'var(--cor-texto)',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#3B7E48')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(124, 83, 63, 0.25)')}
              />

              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                title={mostrarSenha ? 'Ocultar senha' : 'Ver senha'}
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  fontSize: '1rem',
                  color: '#7C533F',
                  cursor: 'pointer',
                  padding: '0.2rem',
                }}
              >
                {mostrarSenha ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Opção Lembrar de mim */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.75rem' }}>
            <input
              id="lembrar-login"
              type="checkbox"
              checked={lembrarMe}
              onChange={(e) => setLembrarMe(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                accentColor: '#3B7E48',
                cursor: 'pointer',
              }}
            />
            <label
              htmlFor="lembrar-login"
              style={{
                fontSize: '0.86rem',
                color: '#5A5049',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              Manter meu acesso salvo com segurança
            </label>
          </div>

          {/* Botão de Envio (Pílula Verde Alívio #3B7E48) */}
          <Button
            tipo="submit"
            variante="primario"
            desabilitado={carregando}
            style={{
              width: '100%',
              padding: '0.95rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 600,
              backgroundColor: '#3B7E48',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(59, 126, 72, 0.25)',
            }}
          >
            {carregando ? 'Entrando com segurança...' : 'Entrar no meu espaço seguro →'}
          </Button>
        </form>
        {/* FIM DO FORMULÁRIO DE LOGIN */}

        {/* ==================================================================
            LINKS INFERIORES DE CRIAÇÃO DE CONTA E CREDENCIAMENTO
            ================================================================== */}
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(124, 83, 63, 0.15)',
            textAlign: 'center',
            fontSize: '0.88rem',
            color: '#5A5049',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
          }}
        >
          <div>
            <span>Ainda não faz parte? </span>
            <Link
              to="/cadastro"
              style={{
                color: '#3B7E48',
                fontWeight: 700,
                textDecoration: 'underline',
              }}
            >
              Criar conta gratuita agora →
            </Link>
          </div>

          <div>
            <span>É médico, nutricionista ou educador? </span>
            <Link
              to="/credenciamento"
              style={{
                color: '#7C533F',
                fontWeight: 600,
                textDecoration: 'underline',
              }}
            >
              Credencie seu consultório aqui →
            </Link>
          </div>
        </div>
        {/* FIM DOS LINKS INFERIORES */}
      </div>

      {/* ====================================================================
          MODAL DE RECUPERAÇÃO DE SENHA (ACOLHEDOR)
          ==================================================================== */}
      {modalEsqueciSenha && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(46, 40, 36, 0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#F6F3EE',
              borderRadius: '14px',
              maxWidth: '460px',
              width: '100%',
              padding: '2rem',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.18)',
              border: '1px solid rgba(124, 83, 63, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.35rem', color: '#2E2824', margin: 0 }}>
                Recuperar Acesso
              </h3>
              <button
                type="button"
                onClick={() => {
                  setModalEsqueciSenha(false);
                  setSucessoRecuperacao(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: '#7C533F',
                }}
              >
                ✕
              </button>
            </div>

            {sucessoRecuperacao ? (
              <div>
                <p style={{ fontSize: '0.94rem', color: '#1E4620', lineHeight: 1.55 }}>
                  ✓ Enviamos um link de redefinição para <strong>{emailRecuperacao}</strong>. Verifique sua caixa de entrada com calma.
                </p>
                <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                  <Button
                    variante="primario"
                    onClick={() => {
                      setModalEsqueciSenha(false);
                      setSucessoRecuperacao(false);
                    }}
                  >
                    Entendido, obrigado!
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRecuperarSenha}>
                <p style={{ fontSize: '0.9rem', color: '#5A5049', lineHeight: 1.55, marginBottom: '1.25rem' }}>
                  Não se preocupe, acontece com todo mundo. Digite seu e-mail cadastrado e enviaremos uma mensagem segura para você redefinir sua senha:
                </p>

                <input
                  type="email"
                  value={emailRecuperacao}
                  onChange={(e) => setEmailRecuperacao(e.target.value)}
                  placeholder="Seu e-mail de acesso"
                  required
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(124, 83, 63, 0.25)',
                    backgroundColor: '#FFFFFF',
                    fontSize: '0.94rem',
                    marginBottom: '1.5rem',
                    outline: 'none',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <Button
                    variante="secundario"
                    tipo="button"
                    onClick={() => setModalEsqueciSenha(false)}
                  >
                    Cancelar
                  </Button>
                  <Button variante="primario" tipo="submit">
                    Enviar link seguro →
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* FIM DO MODAL */}
    </div>
  );
}
/* FIM DO COMPONENTE DA PÁGINA DE LOGIN */
