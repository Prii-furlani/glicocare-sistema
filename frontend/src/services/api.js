import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost/glicocare/backend/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const artigosService = {
  listar: (params) => api.get('/artigos/index.php', { params }),
  buscarPorId: (id) => api.get(`/artigos/index.php?id=${id}`),
  sugerirTema: (dados) => api.post('/artigos/index.php', dados),
};

export const depoimentosService = {
  listarAprovados: (artigoId) =>
    api.get('/moderacao/index.php', { params: { artigo_id: artigoId, status: 'aprovado' } }),
  enviarParaModeracao: (dados) => api.post('/moderacao/index.php', dados),
};

export const especialistasService = {
  listar: (params) => api.get('/especialistas/index.php', { params }),
  buscarPorId: (id) => api.get(`/especialistas/index.php?id=${id}`),
  solicitarCredenciamento: (dados) => api.post('/especialistas/index.php', dados),
};

export const agendamentosService = {
  listarHorarios: (especialistaId) =>
    api.get('/agendamentos/index.php', { params: { especialista_id: especialistaId } }),
  criarAgendamento: (dados) => api.post('/agendamentos/index.php', dados),
};

export const authService = {
  login: (dados) => api.post('/auth/login.php', dados),
};

export default api;
