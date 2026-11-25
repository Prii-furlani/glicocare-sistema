import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost/glicocare/backend/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('glicocare_token') || sessionStorage.getItem('glicocare_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard_geral.php'),
  getHomeConfig: () => api.get('/admin/salvar_home.php'),
  salvarHomeConfig: (dados) => {
    if (dados instanceof FormData) {
      return api.post('/admin/salvar_home.php', dados, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/admin/salvar_home.php', dados);
  },
  listarArtigos: (params) => api.get('/admin/gerenciar_artigos.php', { params }),
  obterArtigo: (id) => api.get(`/admin/gerenciar_artigos.php?id=${id}`),
  salvarArtigo: (dados) => {
    if (dados instanceof FormData) {
      return api.post('/admin/gerenciar_artigos.php', dados, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/admin/gerenciar_artigos.php', dados);
  },
  excluirArtigo: (id) => api.delete(`/admin/gerenciar_artigos.php?id=${id}`),
  listarEspecialistas: () => api.get('/admin/curadoria_especialistas.php'),
  atualizarEspecialista: (dados) => api.post('/admin/curadoria_especialistas.php', dados),
  listarDepoimentos: (params) => api.get('/admin/moderar_depoimentos.php', { params }),
  moderarDepoimento: (dados) => api.post('/admin/moderar_depoimentos.php', dados),
  listarUsuarios: (params) => api.get('/admin/usuarios.php', { params }),
  alternarStatusUsuario: (dados) => api.post('/admin/usuarios.php', dados),
};

export const cuidadorService = {
  getMeusDependentes: () => api.get('/cuidadores/meus_dependentes.php'),
  cadastrarDependente: (dados) => api.post('/cuidadores/cadastrar_dependente.php', dados),
  gerarConviteFamilia: (dados) => api.post('/cuidadores/gerar_convite_familia.php', dados),
  registrarGlicemiaCuidador: (dados) => api.post('/cuidadores/registrar_glicemia_cuidador.php', dados),
};

export const alergiasService = {
  listar: (params) => api.get('/perfil/gerenciar_alergias.php', { params }),
  adicionar: (dados) => api.post('/perfil/gerenciar_alergias.php', dados),
  remover: (id, params) => api.delete(`/perfil/gerenciar_alergias.php?id=${id}`, { params }),
};

export default api;
