/* ==========================================================================
   ARQUIVO: App.jsx
   COMPONENTE: App (Estrutura Raiz e Roteador de Páginas)
   OBJETIVO: Orquestrar o layout global (Navbar no topo, área principal de
   rotas flexível, Chatbot flutuante do Lufy e Footer na base) conectando
   todas as páginas da aplicação GlicoCare.
   ========================================================================== */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LufyChatbot from './components/LufyChatbot';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import Home from './pages/Home';
import Biblioteca from './pages/Biblioteca';
import ArtigoDetalhe from './pages/ArtigoDetalhe';
import Especialistas from './pages/Especialistas';
import PerfilEspecialista from './pages/PerfilEspecialista';
import Credenciamento from './pages/Credenciamento';
import ComoFuncionaAtendimentos from './pages/ComoFuncionaAtendimentos';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import BoasVindas from './pages/BoasVindas';
import ConfigurarPerfil from './pages/ConfigurarPerfil';
import MeuPerfil from './pages/MeuPerfil';
import MinhaConta from './pages/MinhaConta';
import PainelEspecialista from './pages/PainelEspecialista';
import PainelAdmin from './pages/PainelAdmin';
import PainelCuidador from './pages/PainelCuidador';
import SalaTeleconsulta from './pages/SalaTeleconsulta';
import { FEATURES } from './config/features';
import EmPreparacaoLufy from './components/EmPreparacaoLufy';

/* INÍCIO DO COMPONENTE PRINCIPAL APP */
export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <div
            style={{
              minHeight: '100vh',      // Garante que o layout ocupe toda a altura da tela
              display: 'flex',
              flexDirection: 'column', // Mantém o Footer empurrado para a base da janela
            }}
          >
            {/* Barra de navegação adaptativa (horizontal, hambúrguer ou modo leitura) */}
            <Navbar />

            {/* INÍCIO DO MAPEAMENTO DE ROTAS DAS PÁGINAS */}
            <main style={{ flex: 1 }}>
              <Routes>
                {/* 1. Rotas Públicas (Acesso Visitante e Todos os Perfis) */}
            <Route path="/" element={<Home />} />
            <Route path="/biblioteca" element={<Biblioteca />} />
            <Route path="/conteudos" element={<Biblioteca />} />
            <Route path="/artigo/:slugOrId" element={<ArtigoDetalhe />} />
            <Route path="/artigo/:slug" element={<ArtigoDetalhe />} />
            <Route path="/conteudo/:slugOrId" element={<ArtigoDetalhe />} />
            <Route path="/conteudo/:id" element={<ArtigoDetalhe />} />

            {/* INÍCIO BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS (COMENTADO PARA LANÇAMENTO FASE 1) */}
            {/* Enquanto FEATURES.TELEMEDICINA_ATIVA === false, exibe tela acolhedora do Lufy */}
            <Route
              path="/especialistas"
              element={FEATURES.TELEMEDICINA_ATIVA ? <Especialistas /> : <EmPreparacaoLufy />}
            />
            <Route
              path="/especialistas/:id"
              element={FEATURES.TELEMEDICINA_ATIVA ? <PerfilEspecialista /> : <EmPreparacaoLufy />}
            />
            <Route
              path="/como-funciona"
              element={FEATURES.TELEMEDICINA_ATIVA ? <ComoFuncionaAtendimentos /> : <EmPreparacaoLufy />}
            />
            <Route
              path="/como-funciona-atendimentos"
              element={FEATURES.TELEMEDICINA_ATIVA ? <ComoFuncionaAtendimentos /> : <EmPreparacaoLufy />}
            />
            <Route
              path="/credenciamento"
              element={FEATURES.TELEMEDICINA_ATIVA ? <Credenciamento /> : <EmPreparacaoLufy />}
            />
            <Route
              path="/sala-consulta/:token"
              element={FEATURES.TELEMEDICINA_ATIVA ? <SalaTeleconsulta /> : <EmPreparacaoLufy />}
            />
            <Route
              path="/atendimento-nativo/:token"
              element={FEATURES.TELEMEDICINA_ATIVA ? <SalaTeleconsulta /> : <EmPreparacaoLufy />}
            />
            {/* FIM BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS */}

            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />

            {/* 2. Rotas Protegidas por Perfil (RBAC - RN-ACC-01) */}
            {/* Boas-Vindas Pós-Cadastro (Etapa 2: Configurar Agora vs Depois) */}
            <Route
              path="/boas-vindas"
              element={
                <ProtectedRoute>
                  <BoasVindas />
                </ProtectedRoute>
              }
            />

            {/* Stepper de Configuração Personalizada do Perfil de Cuidados */}
            <Route
              path="/configurar-perfil"
              element={
                <ProtectedRoute allowedRoles={['diabetico', 'cuidador', 'paciente']}>
                  <ConfigurarPerfil />
                </ProtectedRoute>
              }
            />

            {/* Página Pessoal do Usuário: Meu Espaço & Histórico Glicêmico */}
            <Route
              path="/meu-perfil"
              element={
                <ProtectedRoute allowedRoles={['diabetico', 'cuidador', 'paciente']}>
                  <MeuPerfil />
                </ProtectedRoute>
              }
            />
            <Route
              path="/minha-jornada"
              element={
                <ProtectedRoute allowedRoles={['diabetico', 'cuidador', 'paciente']}>
                  <MeuPerfil />
                </ProtectedRoute>
              }
            />

            {/* Área da Família DM1 (Perfil 'paciente' legado / atalhos) */}
            <Route
              path="/minha-conta"
              element={
                <ProtectedRoute allowedRoles={['paciente', 'diabetico', 'cuidador']}>
                  <MeuPerfil />
                </ProtectedRoute>
              }
            />

            {/* Painel do Especialista Credenciado (Perfil 'especialista' com RN-ESP-01) */}
            <Route
              path="/painel-especialista"
              element={
                <ProtectedRoute
                  allowedRoles={['especialista']}
                  requerEspecialistaVerificado={true}
                >
                  <PainelEspecialista />
                </ProtectedRoute>
              }
            />

            {/* Painel Exclusivo do Cuidador de Crianças com DM1 (< 12 anos) */}
            <Route
              path="/painel-cuidador"
              element={
                <ProtectedRoute allowedRoles={['cuidador', 'admin']}>
                  <PainelCuidador />
                </ProtectedRoute>
              }
            />

            {/* Painel Administrativo Completo e CMS (Perfil 'admin' — Exclusivo Priscila) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PainelAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/painel-admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PainelAdmin />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        {/* FIM DO MAPEAMENTO DE ROTAS DAS PÁGINAS */}

        {/* Guia empático e bot flutuante de triagem por cenários */}
        <LufyChatbot />

        {/* Rodapé institucional com aviso médico */}
        <Footer />
      </div>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
/* FIM DO COMPONENTE PRINCIPAL APP */
