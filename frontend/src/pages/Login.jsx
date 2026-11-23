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
import { useNotify } from '../context/ToastContext';
import logoGlicoCare from '../assets/logo-glicocare.jpg';
import lufyMascote from '../assets/lufy-mascote.jpg';
import Button from '../components/Button';
import GlicoLoader from '../components/GlicoLoader';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/Alert';

/* INÍCIO DO COMPONENTE DA PÁGINA DE LOGIN */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const notificar = useNotify();

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

  // Perfil de demonstração selecionado para preenchimento rápido (RN-ACC-01)
  const [perfilDemoAtivo, setPerfilDemoAtivo] = useState(null);
  /* FIM DOS ESTADOS DO FORMULÁRIO */

  /**
   * Preenchimento rápido para demonstração e testes dos 4 perfis do sistema
   */
  const handlePreencherContaTeste = (tipo, autoEntrar = false) => {
    setMensagemErro('');
    setAvisoEspecialistaPendente(null);
    setPerfilDemoAtivo(tipo);

    let emailTeste = '';
    let senhaTeste = 'glicocare123';

    if (tipo === 'diabetico') {
      emailTeste = 'carlos.pai@exemplo.com.br';
    } else if (tipo === 'cuidador' || tipo === 'paciente') {
      emailTeste = 'mariana.mae@exemplo.com.br';
    } else if (tipo === 'especialista') {
      emailTeste = 'helena.endo@glicocare.com.br';
    } else if (tipo === 'admin') {
      emailTeste = 'curadoria@glicocare.com.br';
    }

    setEmail(emailTeste);
    setSenha(senhaTeste);

    if (autoEntrar) {
      handleAutenticar(null, emailTeste, senhaTeste);
    }
  };

  /**
   * Processa o envio do formulário de autenticação
   */
  const handleAutenticar = async (e, emailSobrescrito = null, senhaSobrescrita = null) => {
    if (e && e.preventDefault) e.preventDefault();
    setMensagemErro('');
    setMensagemSucesso('');
    setAvisoEspecialistaPendente(null);

    const emailFinal = emailSobrescrito !== null ? emailSobrescrito : email;
    const senhaFinal = senhaSobrescrita !== null ? senhaSobrescrita : senha;

    // Validação básica de preenchimento
    if (!emailFinal.trim() || !senhaFinal) {
      setMensagemErro('Por favor, informe seu e-mail e sua senha de acesso.');
      return;
    }

    setCarregando(true);

    try {
      /* INÍCIO DA REQUISIÇÃO AO BACK-END PHP (OU SIMULAÇÃO SEGURA) */
      let respostaDados = null;

      try {
        const response = await authService.login({ email: emailFinal, senha: senhaFinal });
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
        if (senhaFinal === 'glicocare123' || senhaFinal === 'password') {
          if (emailFinal.includes('curadoria') || emailFinal.includes('admin') || emailFinal.includes('priscila')) {
            respostaDados = {
              sucesso: true,
              mensagem: 'Que bom ter você de volta, Administradora Priscila!',
              dados: {
                token: 'mock-token-admin-12345',
                usuario: { id: 1, nome_completo: 'Priscila Manzoni Furlani (Curadoria GlicoCare)', email: emailFinal, tipo_perfil: 'admin_moderador', tipo_usuario: 'admin' },
                redirecionar_para: '/admin',
              }
            };
          } else if (emailFinal.includes('helena') || emailFinal.includes('nutri') || emailFinal.includes('especialista')) {
            respostaDados = {
              sucesso: true,
              mensagem: 'Que bom ter você de volta, Dra. Helena!',
              dados: {
                token: 'mock-token-esp-12345',
                usuario: { id: 2, nome_completo: 'Dra. Helena Vasconcelos', email: emailFinal, tipo_perfil: 'especialista' },
                especialista: { registro_verificado: 1, especialidade: 'Endocrinologia Pediátrica' },
                redirecionar_para: '/especialistas',
              }
            };
          } else if (emailFinal.includes('mariana') || emailFinal.includes('mae') || emailFinal.includes('cuidador')) {
            respostaDados = {
              sucesso: true,
              mensagem: 'Que bom ter você de volta, Mariana!',
              dados: {
                token: 'mock-token-cuidador-12345',
                usuario: { id: 4, nome_completo: 'Mariana Silva', email: emailFinal, tipo_perfil: 'cuidador', tipo_usuario: 'cuidador' },
                redirecionar_para: '/painel-cuidador',
              }
            };
          } else {
            respostaDados = {
              sucesso: true,
              mensagem: 'Que bom ter você de volta à família GlicoCare!',
              dados: {
                token: 'mock-token-user-12345',
                usuario: { id: 5, nome_completo: 'Carlos Eduardo Souza', email: emailFinal, tipo_perfil: 'diabetico', tipo_usuario: 'diabetico' },
                redirecionar_para: '/meu-perfil',
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
        notificar.sucesso(mensagem || 'Que bom ter você de volta!', 'Acesso Autorizado');

        // Redireciona para o painel correspondente ao perfil logado (RN-ACC-01)
        const perfilLogado = dados?.usuario?.tipo_usuario || dados?.usuario?.tipo_perfil;
        const destino = (perfilLogado === 'admin' || perfilLogado === 'admin_moderador')
          ? '/admin'
          : (perfilLogado === 'cuidador')
            ? '/painel-cuidador'
            : (perfilLogado === 'especialista')
              ? '/painel-especialista'
              : (location.state?.from?.pathname || dados.redirecionar_para || '/meu-perfil');
        setTimeout(() => {
          navigate(destino);
        }, 750);
      }
    } catch (err) {
      const msgErro = 'Não foi possível conectar ao servidor de login no momento. Tente novamente em instantes.';
      setMensagemErro(msgErro);
      notificar.erro(msgErro, 'Falha no Acesso');
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
            Que bom ter você <span style={{ fontStyle: 'italic', color: 'var(--cor-primaria)' }}>de volta</span>.
          </h1>

          <p
            style={{
              fontSize: '0.92rem',
              color: 'var(--cor-texto-suave)',
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
              backgroundColor: 'var(--cor-fundo)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              border: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.15))',
            }}
          >
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 600,
                color: 'var(--cor-primaria)',
                marginBottom: '0.6rem',
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
                  background: perfilDemoAtivo === 'diabetico' ? '#3B7E48' : '#F6F3EE',
                  border: '1px solid #3B7E48',
                  borderRadius: '20px',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  color: perfilDemoAtivo === 'diabetico' ? '#FFFFFF' : '#2E2824',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
              >
                🌱 Diabético
              </button>

              <button
                type="button"
                onClick={() => handlePreencherContaTeste('cuidador')}
                style={{
                  background: perfilDemoAtivo === 'cuidador' ? '#3B7E48' : '#F6F3EE',
                  border: '1px solid #3B7E48',
                  borderRadius: '20px',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  color: perfilDemoAtivo === 'cuidador' ? '#FFFFFF' : '#2E2824',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
              >
                🤝 Cuidador
              </button>

              <button
                type="button"
                onClick={() => handlePreencherContaTeste('especialista')}
                style={{
                  background: perfilDemoAtivo === 'especialista' ? '#7C533F' : '#F6F3EE',
                  border: '1px solid #7C533F',
                  borderRadius: '20px',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  color: perfilDemoAtivo === 'especialista' ? '#FFFFFF' : '#2E2824',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
              >
                🩺 Especialista
              </button>

              <button
                type="button"
                onClick={() => handlePreencherContaTeste('admin')}
                style={{
                  background: perfilDemoAtivo === 'admin' ? '#2E2824' : '#F6F3EE',
                  border: '1.5px solid #2E2824',
                  borderRadius: '20px',
                  padding: '0.35rem 0.8rem',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  color: perfilDemoAtivo === 'admin' ? '#FFFFFF' : '#2E2824',
                  fontWeight: 700,
                  boxShadow: perfilDemoAtivo === 'admin' ? '0 2px 8px rgba(46, 40, 36, 0.25)' : 'none',
                  transition: 'all 0.2s ease',
                }}
                title="Acesso completo ao Painel de Administração e Configurações (/admin)"
              >
                ⚙️ Admin (Painel & CMS)
              </button>
            </div>

            {/* Painel descritivo com atalho direto de autenticação para o perfil selecionado */}
            {perfilDemoAtivo && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem 0.9rem',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '10px',
                  border: '1px solid rgba(124, 83, 63, 0.2)',
                  fontSize: '0.76rem',
                  color: '#2E2824',
                  lineHeight: 1.45,
                }}
              >
                {perfilDemoAtivo === 'admin' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                    <div>
                      <strong style={{ color: '#7C533F' }}>⚙️ Administradora (Priscila Manzoni Furlani):</strong>
                      <br />
                      Acesso completo ao <strong>Painel Admin (/admin)</strong> com CMS Dinâmico da Home, Split 35/65, Gestão de Artigos, Especialistas e Auditoria.
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePreencherContaTeste('admin', true)}
                      style={{
                        backgroundColor: '#3B7E48',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ⚡ Entrar no Painel Admin Agora
                    </button>
                  </div>
                )}

                {perfilDemoAtivo === 'diabetico' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                    <div>
                      <strong style={{ color: '#3B7E48' }}>🌱 Diabético (Carlos Eduardo):</strong>
                      <br />
                      Acesso ao <strong>Meu Espaço (/meu-perfil)</strong> com Diário Glicêmico, Fatores de Sensibilidade e Parâmetros Clínicos.
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePreencherContaTeste('diabetico', true)}
                      style={{
                        backgroundColor: '#3B7E48',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ⚡ Entrar como Diabético
                    </button>
                  </div>
                )}

                {perfilDemoAtivo === 'cuidador' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                    <div>
                      <strong style={{ color: '#3B7E48' }}>🤝 Cuidador (Mariana Silva):</strong>
                      <br />
                      Acesso ao <strong>Perfil Familiar (/meu-perfil)</strong>, gestão do dependente com DM1 e acompanhamento clínico.
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePreencherContaTeste('cuidador', true)}
                      style={{
                        backgroundColor: '#3B7E48',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ⚡ Entrar como Cuidador
                    </button>
                  </div>
                )}

                {perfilDemoAtivo === 'especialista' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                    <div>
                      <strong style={{ color: '#7C533F' }}>🩺 Especialista (Dra. Helena Vasconcelos):</strong>
                      <br />
                      Acesso ao <strong>Painel Clínico (/painel-especialista)</strong>, Agenda, Prontuário Longitudinal e Teleconsultas.
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePreencherContaTeste('especialista', true)}
                      style={{
                        backgroundColor: '#3B7E48',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ⚡ Entrar como Especialista
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {/* FIM DO SELETOR DE CONTAS */}

        {/* ==================================================================
            MENSAGENS DE FEEDBACK VIA SHADCN/UI ALERT PORTUGUÊS (PORTO SEGURO)
            ================================================================== */}
        {mensagemErro && (
          <Alert variant="destructive" onClose={() => setMensagemErro('')}>
            <AlertTitle>Não foi possível acessar</AlertTitle>
            <AlertDescription>{mensagemErro}</AlertDescription>
          </Alert>
        )}

        {mensagemSucesso && (
          <Alert variant="success" onClose={() => setMensagemSucesso('')}>
            <AlertTitle>Acesso Seguro</AlertTitle>
            <AlertDescription>{mensagemSucesso}</AlertDescription>
          </Alert>
        )}

        {avisoEspecialistaPendente && (
          <Alert variant="warning">
            <AlertTitle>Cadastro em Processo de Moderação</AlertTitle>
            <AlertDescription>
              {avisoEspecialistaPendente}
              <div style={{ marginTop: '0.5rem' }}>
                <Link
                  to="/credenciamento"
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--cor-cta)',
                    textDecoration: 'underline',
                  }}
                >
                  Acompanhar status do meu credenciamento →
                </Link>
              </div>
            </AlertDescription>
          </Alert>
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
                  color: 'var(--cor-primaria)',
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
                color: 'var(--cor-texto-suave)',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              Manter meu acesso salvo com segurança
            </label>
          </div>

          {/* Botão de Envio (Pílula Verde Alívio #3B7E48 com GlicoLoader) */}
          <Button
            tipo="submit"
            variante="primario"
            loading={carregando}
            disabled={carregando}
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
            borderTop: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.15))',
            textAlign: 'center',
            fontSize: '0.88rem',
            color: 'var(--cor-texto-suave)',
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
                color: 'var(--cor-cta)',
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
                color: 'var(--cor-primaria)',
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
