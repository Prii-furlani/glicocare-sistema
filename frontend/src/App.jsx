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
import Home from './pages/Home';
import Biblioteca from './pages/Biblioteca';
import ArtigoDetalhe from './pages/ArtigoDetalhe';
import Especialistas from './pages/Especialistas';
import PerfilEspecialista from './pages/PerfilEspecialista';
import Credenciamento from './pages/Credenciamento';

/* INÍCIO DO COMPONENTE PRINCIPAL APP */
export default function App() {
  return (
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
          <Route path="/" element={<Home />} />
          <Route path="/biblioteca" element={<Biblioteca />} />
          <Route path="/artigo/:id" element={<ArtigoDetalhe />} />
          <Route path="/especialistas" element={<Especialistas />} />
          <Route path="/especialistas/:id" element={<PerfilEspecialista />} />
          <Route path="/credenciamento" element={<Credenciamento />} />
        </Routes>
      </main>
      {/* FIM DO MAPEAMENTO DE ROTAS DAS PÁGINAS */}

      {/* Guia empático e bot flutuante de triagem por cenários */}
      <LufyChatbot />

      {/* Rodapé institucional com aviso médico */}
      <Footer />
    </div>
  );
}
/* FIM DO COMPONENTE PRINCIPAL APP */
