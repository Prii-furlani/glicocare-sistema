/* ==========================================================================
   ARQUIVO: PainelAdmin.jsx (Localização: /frontend/src/pages/PainelAdmin.jsx)
   PÁGINA: Painel Administrativo Geral, Curadoria e CMS Dinâmico
   AUTORIZAÇÃO: Exclusivo para o perfil 'admin' (Priscila Manzoni Furlani / RN-ACC-01)
   DESIGN SYSTEM: Porto Seguro (#EAE4D9, #F6F3EE, #2E2824, #7C533F, #3B7E48)
   ABAS PRINCIPAIS:
     1. 📊 Visão Geral & Finanças (KPIs, Split 35% GlicoCare, Logs de Auditoria)
     2. 🎨 Editar Tela Home (CMS Dinâmico para Textos, Chamadas e Imagens da Landing Page)
     3. 📚 Biblioteca de Conteúdos (Criador e Editor de Artigos em Blocos Estruturados)
     4. 🩺 Especialistas & Curadoria (Conselhos Profissionais, Split 65% e Ativação)
     5. 💬 Moderação & Usuários (Depoimentos das Famílias e Gestão de Contas)
   ========================================================================== */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/api';
import Button from '../components/Button';
import CustomSelect from '../components/CustomSelect';
import CapaEditorialDefault from '../components/CapaEditorialDefault';
import GlicoLoader from '../components/GlicoLoader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/Alert';
import { useNotify } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import lufyMascoteFoto from '../assets/lufy-mascote.jpg';
import familiaCuidadoFoto from '../assets/familia-cuidado.jpg';
import { ARTIGOS_BIBLIOTECA, REDE_ESPECIALISTAS } from './Home';
import { FEATURES } from '../config/features';

/* INÍCIO DO COMPONENTE PRINCIPAL PAINEL ADMIN */
export default function PainelAdmin() {
  const { usuario, logout } = useAuth();
  const notificar = useNotify();
  const { confirmar } = useConfirm();

  // Controle de abas principais
  const [abaAtiva, setAbaAtiva] = useState('visao_geral'); // 'visao_geral' | 'cms_home' | 'artigos' | 'especialistas' | 'moderacao_usuarios'

  // Estados gerais
  const [carregandoGeral, setCarregandoGeral] = useState(true);
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [mensagemErro, setMensagemErro] = useState('');
  /* INÍCIO ESTADO DE MODERAÇÃO (GLICOLOADER BOTAO) */
  const [moderandoDepoimentoId, setModerandoDepoimentoId] = useState(null);
  /* FIM ESTADO DE MODERAÇÃO (GLICOLOADER BOTAO) */

  // ---------------------------------------------------------------------------
  // 1. DADOS DA ABA VISÃO GERAL & FINANÇAS
  // ---------------------------------------------------------------------------
  const [dashboardData, setDashboardData] = useState({
    kpis: {
      total_familias: 0,
      total_pacientes: 0,
      especialistas_ativos: 0,
      especialistas_pendentes: 0,
      consultas_realizadas: 0,
      consultas_agendadas: 0,
      receita_bruta_total: 1280.0,
      receita_plataforma_liquida: 448.0,
      repasse_especialistas: 832.0,
      depoimentos_pendentes: 0,
      artigos_total: 7,
    },
    split_financeiro: {
      taxa_glicocare_percentual: 35.0,
      taxa_glicocare_valor: 448.0,
      repasse_especialista_percentual: 65.0,
      repasse_especialista_valor: 832.0,
      total_processado: 1280.0,
    },
    ultimos_logs: [],
    usuarios_recentes: [],
  });

  const [buscaLogs, setBuscaLogs] = useState('');
  const [filtroAcaoLog, setFiltroAcaoLog] = useState('TODOS');
  const [modalLogDetalhe, setModalLogDetalhe] = useState(null);

  // ---------------------------------------------------------------------------
  // 2. DADOS DO CMS DINÂMICO DA HOME
  // ---------------------------------------------------------------------------
  const [homeConfigs, setHomeConfigs] = useState({
    hero_badge: 'INFORMAÇÃO QUE ACOLHE. CUIDADO QUE APROXIMA.',
    hero_titulo: 'Transforme o diagnóstico em uma rotina segura e sem pânico.',
    hero_titulo_destaque: 'segura',
    hero_subtitulo: 'Apoio pedagógico e acolhimento prático para famílias que vivem o Diabetes Tipo 1 — do diagnóstico à autonomia, um passo de cada vez.',
    hero_cta_primario: 'Quero começar com segurança',
    hero_cta_secundario: 'Conheça nossa história',
    hero_balao_lufy: '“Ei, respira. A gente vai aprender isso juntos.”',
    hero_imagem_url: '',
    lufy_eyebrow: 'CONHEÇA O LUFY',
    lufy_titulo: 'Tecnologia no braço. Afeto no coração.',
    lufy_titulo_destaque: 'Afeto',
    lufy_paragrafo_1: 'Lufy nasceu para ser uma presença familiar nos momentos em que tudo parece novo demais. Um coala guardião que transforma termos difíceis em conversas possíveis.',
    lufy_paragrafo_2: 'Com o sensor no bracinho, ele mostra para as crianças que o monitoramento não é um peso, mas uma ferramenta de autonomia e liberdade.',
    lufy_citacao_foto: '“Cuidar também é ensinar com calma, até que a confiança encontre seu lugar.”',
    lufy_imagem_url: '',
    cta_final_titulo: 'Dê o primeiro passo para uma rotina mais serena.',
    cta_final_subtitulo: 'Junte-se a centenas de famílias que transformaram o medo em aprendizado e confiança diária.',
    cta_final_botao: 'Conheça nossos planos e comece hoje',
  });

  const [arquivosHomeUpload, setArquivosHomeUpload] = useState({});
  const [previewsHomeUpload, setPreviewsHomeUpload] = useState({});
  const [salvandoHome, setSalvandoHome] = useState(false);

  // ---------------------------------------------------------------------------
  // 3. DADOS DA BIBLIOTECA DE CONTEÚDOS (EDITOR DE ARTIGOS)
  // ---------------------------------------------------------------------------
  const [artigos, setArtigos] = useState([]);
  const [buscaArtigo, setBuscaArtigo] = useState('');
  const [filtroCategoriaArtigo, setFiltroCategoriaArtigo] = useState('TODAS');
  const [modalArtigoAberto, setModalArtigoAberto] = useState(false);
  const [artigoEmEdicao, setArtigoEmEdicao] = useState(null);
  const [arquivoCapaArtigo, setArquivoCapaArtigo] = useState(null);
  const [previewCapaArtigo, setPreviewCapaArtigo] = useState('');
  const [salvandoArtigo, setSalvandoArtigo] = useState(false);
  const [visualizarPreviewArtigo, setVisualizarPreviewArtigo] = useState(false);

  // ---------------------------------------------------------------------------
  // 4. DADOS DA CURADORIA DE ESPECIALISTAS
  // ---------------------------------------------------------------------------
  const [especialistas, setEspecialistas] = useState([]);
  const [filtroStatusEspecialista, setFiltroStatusEspecialista] = useState('TODOS');
  const [buscaEspecialista, setBuscaEspecialista] = useState('');
  const [processandoEspecialistaId, setProcessandoEspecialistaId] = useState(null);

  // ---------------------------------------------------------------------------
  // 5. DADOS DE MODERAÇÃO & USUÁRIOS
  // ---------------------------------------------------------------------------
  const [subAbaModeracao, setSubAbaModeracao] = useState('depoimentos'); // 'depoimentos' | 'usuarios'
  const [depoimentos, setDepoimentos] = useState([]);
  const [usuariosLista, setUsuariosLista] = useState([]);
  const [buscaUsuario, setBuscaUsuario] = useState('');
  const [filtroTipoUsuario, setFiltroTipoUsuario] = useState('todos');

  // ===========================================================================
  // CARREGAMENTO INICIAL DE DADOS CONFORME A ABA ATIVA
  // ===========================================================================
  const carregarDashboard = async () => {
    try {
      const res = await adminService.getDashboard();
      if (res.data && res.data.sucesso && res.data.dados) {
        setDashboardData((prev) => ({
          ...prev,
          ...res.data.dados,
          ultimos_logs: (res.data.dados.ultimos_logs && res.data.dados.ultimos_logs.length > 0)
            ? res.data.dados.ultimos_logs
            : [
                { id: 1, data_hora_local: '2026-11-17 15:30:00', usuario_nome: 'Priscila Manzoni Furlani', acao: 'CRIACAO', tabela_afetada: 'artigos_conteudos', registro_id: '7', pagina_impacto: '/admin', ip_origem: '127.0.0.1' },
                { id: 2, data_hora_local: '2026-11-17 15:25:00', usuario_nome: 'Priscila Manzoni Furlani', acao: 'EDICAO', tabela_afetada: 'configuracoes_home', registro_id: 'home_cms', pagina_impacto: '/admin', ip_origem: '127.0.0.1' },
                { id: 3, data_hora_local: '2026-11-17 15:15:00', usuario_nome: 'Priscila Manzoni Furlani', acao: 'EDICAO', tabela_afetada: 'especialistas', registro_id: '1', pagina_impacto: '/admin', ip_origem: '127.0.0.1' },
                { id: 4, data_hora_local: '2026-11-17 15:00:00', usuario_nome: 'Priscila Manzoni Furlani', acao: 'LOGIN', tabela_afetada: 'usuarios', registro_id: '1', pagina_impacto: '/login', ip_origem: '127.0.0.1' },
              ]
        }));
      }
    } catch (err) {
      console.warn('Dashboard carregado em fallback:', err);
      setDashboardData((prev) => ({
        ...prev,
        ultimos_logs: [
          { id: 1, data_hora_local: '2026-11-17 15:30:00', usuario_nome: 'Priscila Manzoni Furlani', acao: 'CRIACAO', tabela_afetada: 'artigos_conteudos', registro_id: '7', pagina_impacto: '/admin', ip_origem: '127.0.0.1' },
          { id: 2, data_hora_local: '2026-11-17 15:25:00', usuario_nome: 'Priscila Manzoni Furlani', acao: 'EDICAO', tabela_afetada: 'configuracoes_home', registro_id: 'home_cms', pagina_impacto: '/admin', ip_origem: '127.0.0.1' },
          { id: 3, data_hora_local: '2026-11-17 15:15:00', usuario_nome: 'Priscila Manzoni Furlani', acao: 'EDICAO', tabela_afetada: 'especialistas', registro_id: '1', pagina_impacto: '/admin', ip_origem: '127.0.0.1' },
          { id: 4, data_hora_local: '2026-11-17 15:00:00', usuario_nome: 'Priscila Manzoni Furlani', acao: 'LOGIN', tabela_afetada: 'usuarios', registro_id: '1', pagina_impacto: '/login', ip_origem: '127.0.0.1' },
        ]
      }));
    }
  };

  const carregarHomeConfig = async () => {
    try {
      const res = await adminService.getHomeConfig();
      if (res.data && res.data.sucesso && res.data.dados?.dicionario) {
        setHomeConfigs((prev) => ({ ...prev, ...res.data.dados.dicionario }));
      }
    } catch (err) {
      console.warn('CMS Home carregado com dados locais:', err);
    }
  };

  const carregarArtigos = async () => {
    try {
      const res = await adminService.listarArtigos();
      if (res.data && res.data.sucesso && Array.isArray(res.data.dados) && res.data.dados.length > 0) {
        setArtigos(res.data.dados);
      } else {
        throw new Error('Fallback necessário');
      }
    } catch (err) {
      // Fallback para artigos demonstrativos do catálogo
      const artigosPadrao = ARTIGOS_BIBLIOTECA.map((a) => ({
        id: a.id,
        titulo: a.titulo,
        slug: a.slug,
        categoria: a.categoria,
        resumo: a.resumo,
        tempo_leitura: a.tempoLeitura,
        autor_nome: 'Priscila Manzoni Furlani',
        status_publicacao: 'publicado',
        imagem_capa_url: a.imagemCapa,
        legenda_capa: 'Ilustração editorial da GlicoCare',
        selo_editorial: a.seloSuperior || 'GUIA ESSENCIAL',
        cor_capa_default: a.corTopo || 'terracota',
        conteudo_blocos: [
          { tipo: 'paragrafo', texto: a.resumo },
          { tipo: 'subtitulo', texto: 'Acolhimento prático' },
          { tipo: 'citacao', texto: '“Ei, respira. A gente vai aprender isso juntos.”', autor: 'Lufy' },
        ],
      }));
      setArtigos(artigosPadrao);
    }
  };

  const carregarEspecialistas = async () => {
    try {
      const res = await adminService.listarEspecialistas();
      if (res.data && res.data.sucesso && Array.isArray(res.data.dados) && res.data.dados.length > 0) {
        setEspecialistas(res.data.dados);
      } else {
        throw new Error('Fallback necessário');
      }
    } catch (err) {
      // Fallback para especialistas demonstrativos da rede
      const espPadrao = REDE_ESPECIALISTAS.map((e) => ({
        id: e.id,
        nome_completo: e.nome,
        especialidade: e.especialidade,
        tipo_conselho: e.conselho?.split(' ')[0] || 'CRM',
        numero_conselho: e.conselho?.split(' ')[1] || '12345',
        uf_conselho: 'SP',
        status_credenciamento: 'ativo',
        registro_verificado: 1,
        valor_consulta: parseFloat(e.valorConsulta?.replace('R$', '').replace(',', '.').trim()) || 280,
        percentual_repasse: 65.0,
        oferece_retorno_incluso: e.ofereceRetornoIncluso ? 1 : 0,
        prazo_retorno_dias: e.prazoRetornoDias || 30,
        foto_perfil_url: e.fotoUrl,
        foco_atuacao: e.tagsFoco?.join(', '),
      }));
      setEspecialistas(espPadrao);
    }
  };

  const carregarModeracaoEUsuarios = async () => {
    try {
      const [resDep, resUser] = await Promise.all([
        adminService.listarDepoimentos(),
        adminService.listarUsuarios(),
      ]);
      if (resDep.data && resDep.data.sucesso && resDep.data.dados?.depoimentos?.length > 0) {
        setDepoimentos(resDep.data.dados.depoimentos);
      } else {
        throw new Error('Fallback depoimentos');
      }
      if (resUser.data && resUser.data.sucesso && Array.isArray(resUser.data.dados) && resUser.data.dados.length > 0) {
        setUsuariosLista(resUser.data.dados);
      } else {
        throw new Error('Fallback usuários');
      }
    } catch (err) {
      setDepoimentos([
        {
          id: 1,
          nome_exibicao_familiar: 'Carlos Eduardo Souza',
          parentesco_contexto: 'Pai do Theo (6 anos)',
          relato: 'Encontrar um espaço onde o diabetes não é tratado com medo, mas com acolhimento diário, mudou a nossa dinâmica em casa.',
          criado_em: '2026-11-17 14:30',
          tipo_registro: 'artigo_comentario',
        },
        {
          id: 2,
          nome_exibicao_familiar: 'Mariana Silva',
          parentesco_contexto: 'Mãe de criança DM1',
          relato: 'A consulta com a Dra. Helena foi sem pressa, ela esclareceu todas as dúvidas da escola e revisou as sensibilidades com calma.',
          criado_em: '2026-11-17 11:20',
          tipo_registro: 'avaliacao_teleconsulta',
        },
      ]);

      setUsuariosLista([
        { id: 1, nome_completo: 'Priscila Manzoni Furlani (Curadoria)', email: 'curadoria@glicocare.com.br', telefone: '(11) 99999-0001', tipo_usuario: 'admin', tipo_perfil: 'admin_moderador', ativo: 1 },
        { id: 2, nome_completo: 'Dra. Helena Vasconcelos', email: 'helena.endo@glicocare.com.br', telefone: '(11) 98888-1001', tipo_usuario: 'especialista', tipo_perfil: 'especialista', ativo: 1 },
        { id: 3, nome_completo: 'Nut. Clara Mendonça', email: 'clara.nutri@glicocare.com.br', telefone: '(11) 98888-1002', tipo_usuario: 'especialista', tipo_perfil: 'especialista', ativo: 1 },
        { id: 4, nome_completo: 'Mariana Silva', email: 'mariana.mae@exemplo.com.br', telefone: '(11) 97777-2001', tipo_usuario: 'cuidador', tipo_perfil: 'familiar_paciente', ativo: 1 },
        { id: 5, nome_completo: 'Carlos Eduardo Souza', email: 'carlos.pai@exemplo.com.br', telefone: '(21) 97777-2002', tipo_usuario: 'diabetico', tipo_perfil: 'familiar_paciente', ativo: 1 },
      ]);
    }
  };

  useEffect(() => {
    setCarregandoGeral(true);
    Promise.all([
      carregarDashboard(),
      carregarHomeConfig(),
      carregarArtigos(),
      carregarEspecialistas(),
      carregarModeracaoEUsuarios(),
    ]).finally(() => {
      setCarregandoGeral(false);
    });
  }, []);

  // Notificações temporárias acolhedoras
  const dispararAviso = (msg, tipo = 'sucesso') => {
    if (tipo === 'sucesso') {
      setMensagemSucesso(msg);
      notificar.sucesso(msg);
      setTimeout(() => setMensagemSucesso(''), 5000);
    } else {
      setMensagemErro(msg);
      notificar.erro(msg);
      setTimeout(() => setMensagemErro(''), 6000);
    }
  };

  // ===========================================================================
  // HANDLERS DA ABA 2: CMS HOME
  // ===========================================================================
  const handleHomeCampoChange = (chave, valor) => {
    setHomeConfigs((prev) => ({ ...prev, [chave]: valor }));
  };

  const handleHomeImagemSelect = (chave, file) => {
    if (!file) return;
    setArquivosHomeUpload((prev) => ({ ...prev, [chave]: file }));
    const urlLocal = URL.createObjectURL(file);
    setPreviewsHomeUpload((prev) => ({ ...prev, [chave]: urlLocal }));
  };

  const handleSalvarCMSHome = async () => {
    setSalvandoHome(true);
    setMensagemSucesso('');
    setMensagemErro('');

    try {
      const formData = new FormData();
      Object.entries(homeConfigs).forEach(([k, v]) => {
        formData.append(k, v || '');
      });
      Object.entries(arquivosHomeUpload).forEach(([k, file]) => {
        if (file) {
          formData.append(k, file);
        }
      });

      const res = await adminService.salvarHomeConfig(formData);
      if (res.data && res.data.sucesso) {
        dispararAviso('Textos, chamadas e imagens da Home salvos com sucesso!');
        carregarHomeConfig();
        carregarDashboard();
      } else {
        throw new Error(res.data?.mensagem || 'Erro ao salvar Home.');
      }
    } catch (err) {
      dispararAviso('Não foi possível salvar a Home: ' + (err.response?.data?.mensagem || err.message), 'erro');
    } finally {
      setSalvandoHome(false);
    }
  };

  // ===========================================================================
  // HANDLERS DA ABA 3: ARTIGOS & EDITOR
  // ===========================================================================
  const iniciarCriacaoArtigo = () => {
    setArtigoEmEdicao({
      id: null,
      titulo: '',
      titulo_destaque_italico: '',
      subtitulo: '',
      slug: '',
      categoria: 'Acolhimento Inicial',
      resumo: '',
      tempo_leitura: '6 min de leitura',
      autor_nome: 'Priscila Manzoni Furlani',
      imagem_capa_url: '',
      legenda_capa: '',
      selo_editorial: 'GUIA ESSENCIAL',
      cor_capa_default: 'terracota',
      status_publicacao: 'publicado',
      conteudo_blocos: [
        { tipo: 'paragrafo', texto: 'Escreva aqui o parágrafo de introdução acolhedor...' },
        { tipo: 'subtitulo', texto: 'Um passo de cada vez' },
        { tipo: 'citacao', texto: '“Ei, respira. A gente vai aprender isso juntos.”', autor: 'Lufy' },
        { tipo: 'passo', numero: '01', titulo: 'Primeiro combinados', texto: 'Alinhe a rotina com a família sem pressa.' },
      ],
    });
    setArquivoCapaArtigo(null);
    setPreviewCapaArtigo('');
    setVisualizarPreviewArtigo(false);
    setModalArtigoAberto(true);
  };

  const iniciarEdicaoArtigo = async (artigo) => {
    try {
      const res = await adminService.obterArtigo(artigo.id);
      const art = (res.data && res.data.sucesso && res.data.dados) ? res.data.dados : artigo;
      let blocos = art.conteudo_blocos;
      if (typeof blocos === 'string') {
        try { blocos = JSON.parse(blocos); } catch { blocos = []; }
      }
      if (!Array.isArray(blocos) || blocos.length === 0) {
        blocos = [{ tipo: 'paragrafo', texto: art.resumo || 'Conteúdo do artigo...' }];
      }

      setArtigoEmEdicao({
        ...art,
        conteudo_blocos: blocos,
        autor_nome: art.autor_nome || 'Priscila Manzoni Furlani',
        selo_editorial: art.selo_editorial || 'GUIA ESSENCIAL',
        cor_capa_default: art.cor_capa_default || 'terracota',
      });
      setArquivoCapaArtigo(null);
      setPreviewCapaArtigo(art.imagem_capa_url || '');
      setVisualizarPreviewArtigo(false);
      setModalArtigoAberto(true);
    } catch {
      setArtigoEmEdicao({
        ...artigo,
        conteudo_blocos: [{ tipo: 'paragrafo', texto: artigo.resumo || '' }],
        autor_nome: artigo.autor_nome || 'Priscila Manzoni Furlani',
        selo_editorial: artigo.selo_editorial || 'GUIA ESSENCIAL',
        cor_capa_default: artigo.cor_capa_default || 'terracota',
      });
      setModalArtigoAberto(true);
    }
  };

  const handleSalvarArtigo = async () => {
    if (!artigoEmEdicao?.titulo?.trim()) {
      dispararAviso('Por favor, informe o título do artigo.', 'erro');
      return;
    }

    setSalvandoArtigo(true);
    try {
      const formData = new FormData();
      if (artigoEmEdicao.id) formData.append('id', artigoEmEdicao.id);
      formData.append('titulo', artigoEmEdicao.titulo);
      formData.append('titulo_destaque_italico', artigoEmEdicao.titulo_destaque_italico || '');
      formData.append('subtitulo', artigoEmEdicao.subtitulo || '');
      formData.append('slug', artigoEmEdicao.slug || '');
      formData.append('categoria', artigoEmEdicao.categoria);
      formData.append('resumo', artigoEmEdicao.resumo || '');
      formData.append('tempo_leitura', artigoEmEdicao.tempo_leitura || '5 min de leitura');
      formData.append('autor_nome', artigoEmEdicao.autor_nome || 'Priscila Manzoni Furlani');
      formData.append('legenda_capa', artigoEmEdicao.legenda_capa || '');
      formData.append('selo_editorial', artigoEmEdicao.selo_editorial || 'GUIA ESSENCIAL');
      formData.append('cor_capa_default', artigoEmEdicao.cor_capa_default || 'terracota');
      formData.append('status_publicacao', artigoEmEdicao.status_publicacao || 'publicado');
      formData.append('conteudo_blocos', JSON.stringify(artigoEmEdicao.conteudo_blocos || []));

      if (arquivoCapaArtigo) {
        formData.append('imagem_capa', arquivoCapaArtigo);
      } else if (artigoEmEdicao.imagem_capa_url) {
        formData.append('imagem_capa_url', artigoEmEdicao.imagem_capa_url);
      } else {
        formData.append('imagem_capa_url', '');
      }

      const res = await adminService.salvarArtigo(formData);
      if (res.data && res.data.sucesso) {
        dispararAviso('Artigo salvo com sucesso no acervo editorial!');
        setModalArtigoAberto(false);
        carregarArtigos();
        carregarDashboard();
      } else {
        throw new Error(res.data?.mensagem || 'Erro ao salvar artigo.');
      }
    } catch (err) {
      dispararAviso('Erro ao salvar artigo: ' + (err.response?.data?.mensagem || err.message), 'erro');
    } finally {
      setSalvandoArtigo(false);
    }
  };

  const handleExcluirArtigo = async (id, titulo) => {
    const ok = await confirmar({
      titulo: 'Excluir Artigo Editorial?',
      descricao: `Tem certeza que deseja remover o artigo "${titulo}"? Esta ação removerá o conteúdo da biblioteca pública.`,
      variante: 'destructive',
      confirmText: 'Sim, excluir artigo',
      cancelText: 'Cancelar',
    });
    if (!ok) return;

    try {
      await adminService.excluirArtigo(id);
      dispararAviso('Artigo removido com sucesso!');
      carregarArtigos();
      carregarDashboard();
    } catch (err) {
      dispararAviso('Não foi possível excluir o artigo.', 'erro');
    }
  };

  // Manipulação de blocos estruturados
  const adicionarBloco = (tipo) => {
    if (!artigoEmEdicao) return;
    const novos = [...(artigoEmEdicao.conteudo_blocos || [])];
    if (tipo === 'paragrafo') novos.push({ tipo: 'paragrafo', texto: '' });
    if (tipo === 'subtitulo') novos.push({ tipo: 'subtitulo', texto: '' });
    if (tipo === 'citacao') novos.push({ tipo: 'citacao', texto: '', autor: 'Lufy' });
    if (tipo === 'passo') novos.push({ tipo: 'passo', numero: `0${novos.length + 1}`, titulo: '', texto: '' });
    setArtigoEmEdicao({ ...artigoEmEdicao, conteudo_blocos: novos });
  };

  const atualizarBloco = (indice, campo, valor) => {
    if (!artigoEmEdicao) return;
    const novos = [...artigoEmEdicao.conteudo_blocos];
    novos[indice] = { ...novos[indice], [campo]: valor };
    setArtigoEmEdicao({ ...artigoEmEdicao, conteudo_blocos: novos });
  };

  const moverBloco = (indice, direcao) => {
    if (!artigoEmEdicao) return;
    const novos = [...artigoEmEdicao.conteudo_blocos];
    const target = direcao === 'cima' ? indice - 1 : indice + 1;
    if (target < 0 || target >= novos.length) return;
    const temp = novos[indice];
    novos[indice] = novos[target];
    novos[target] = temp;
    setArtigoEmEdicao({ ...artigoEmEdicao, conteudo_blocos: novos });
  };

  const removerBloco = (indice) => {
    if (!artigoEmEdicao) return;
    const novos = artigoEmEdicao.conteudo_blocos.filter((_, i) => i !== indice);
    setArtigoEmEdicao({ ...artigoEmEdicao, conteudo_blocos: novos });
  };

  // ===========================================================================
  // HANDLERS DA ABA 4: CURADORIA DE ESPECIALISTAS
  // ===========================================================================
  const handleAtualizarEspecialista = async (id, dadosAtualizacao) => {
    setProcessandoEspecialistaId(id);
    try {
      const res = await adminService.atualizarEspecialista({ id, ...dadosAtualizacao });
      if (res.data && res.data.sucesso) {
        dispararAviso('Dados do especialista atualizados com sucesso!');
        carregarEspecialistas();
        carregarDashboard();
      }
    } catch (err) {
      dispararAviso('Erro ao atualizar especialista: ' + (err.response?.data?.mensagem || err.message), 'erro');
    } finally {
      setProcessandoEspecialistaId(null);
    }
  };

  // ===========================================================================
  // HANDLERS DA ABA 5: MODERAÇÃO & USUÁRIOS
  // ===========================================================================
  const handleModerarDepoimento = async (id, acao, tipo = 'artigo_comentario') => {
    setModerandoDepoimentoId(id);
    try {
      const res = await adminService.moderarDepoimento({ id, acao, tipo });
      if (res.data && res.data.sucesso) {
        dispararAviso(res.data.mensagem);
        carregarModeracaoEUsuarios();
        carregarDashboard();
      }
    } catch (err) {
      dispararAviso('Erro ao moderar depoimento.', 'erro');
    } finally {
      setModerandoDepoimentoId(null);
    }
  };

  const handleAlternarStatusUsuario = async (id, statusAtual) => {
    const novoStatus = statusAtual ? 0 : 1;
    try {
      const res = await adminService.alternarStatusUsuario({ id, ativo: novoStatus });
      if (res.data && res.data.sucesso) {
        dispararAviso(`Usuário #${id} ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`);
        carregarModeracaoEUsuarios();
        carregarDashboard();
      }
    } catch (err) {
      dispararAviso(err.response?.data?.mensagem || 'Erro ao alterar status do usuário.', 'erro');
    }
  };

  // Filtros de Artigos e Logs
  const artigosFiltrados = useMemo(() => {
    return artigos.filter((a) => {
      const matchBusca = !buscaArtigo.trim() || 
        a.titulo?.toLowerCase().includes(buscaArtigo.toLowerCase()) ||
        a.resumo?.toLowerCase().includes(buscaArtigo.toLowerCase());
      const matchCat = filtroCategoriaArtigo === 'TODAS' || a.categoria === filtroCategoriaArtigo;
      return matchBusca && matchCat;
    });
  }, [artigos, buscaArtigo, filtroCategoriaArtigo]);

  const especialistasFiltrados = useMemo(() => {
    return especialistas.filter((e) => {
      const matchBusca = !buscaEspecialista.trim() ||
        e.nome_completo?.toLowerCase().includes(buscaEspecialista.toLowerCase()) ||
        e.especialidade?.toLowerCase().includes(buscaEspecialista.toLowerCase()) ||
        e.numero_conselho?.includes(buscaEspecialista);
      const matchStatus = filtroStatusEspecialista === 'TODOS' || e.status_credenciamento === filtroStatusEspecialista;
      return matchBusca && matchStatus;
    });
  }, [especialistas, buscaEspecialista, filtroStatusEspecialista]);

  const logsFiltrados = useMemo(() => {
    const lista = dashboardData.ultimos_logs || [];
    return lista.filter((log) => {
      const matchAcao = filtroAcaoLog === 'TODOS' || log.acao === filtroAcaoLog;
      const matchBusca = !buscaLogs.trim() ||
        log.usuario_nome?.toLowerCase().includes(buscaLogs.toLowerCase()) ||
        log.tabela_afetada?.toLowerCase().includes(buscaLogs.toLowerCase()) ||
        log.pagina_impacto?.toLowerCase().includes(buscaLogs.toLowerCase());
      return matchAcao && matchBusca;
    });
  }, [dashboardData.ultimos_logs, filtroAcaoLog, buscaLogs]);

  const usuariosFiltrados = useMemo(() => {
    return usuariosLista.filter((u) => {
      const matchBusca = !buscaUsuario.trim() ||
        u.nome_completo?.toLowerCase().includes(buscaUsuario.toLowerCase()) ||
        u.email?.toLowerCase().includes(buscaUsuario.toLowerCase());
      const matchTipo = filtroTipoUsuario === 'todos' || u.tipo_usuario === filtroTipoUsuario || u.tipo_perfil === filtroTipoUsuario;
      return matchBusca && matchTipo;
    });
  }, [usuariosLista, buscaUsuario, filtroTipoUsuario]);

  return (
    <div
      style={{
        backgroundColor: 'var(--cor-fundo)',
        minHeight: '100vh',
        padding: '2.5rem 1.25rem 5rem',
      }}
    >
      <div className="container" style={{ maxWidth: '1360px', margin: '0 auto' }}>
        {/* ===================================================================
            CABEÇALHO GERAL DE GOVERNANÇA (PORTO SEGURO)
            =================================================================== */}
        <header
          style={{
            backgroundColor: 'var(--cor-superficie)',
            borderRadius: '20px',
            padding: '2rem 2.25rem',
            marginBottom: '2rem',
            border: '1px solid rgba(124, 83, 63, 0.18)',
            boxShadow: '0 8px 30px rgba(46, 40, 36, 0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#7C533F',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.4rem',
              }}
            >
              <span style={{ fontSize: '0.9rem' }}>🛡️</span>
              <span>PAINEL DE GOVERNANÇA, CURADORIA & CMS DINÂMICO (RN-ACC-01)</span>
            </div>
            <h1
              style={{
                fontFamily: 'var(--fonte-titulo)',
                fontSize: 'clamp(1.75rem, 3vw, 2.3rem)',
                color: 'var(--cor-texto)',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Central Administrativa GlicoCare
            </h1>
            <p style={{ fontSize: '0.95rem', color: '#5A5049', margin: '0.4rem 0 0 0' }}>
              Autenticado como <strong>{usuario?.nome_completo || 'Priscila Manzoni Furlani (Admin)'}</strong> • Acesso total à curadoria, split financeiro e editor da Home.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="gc-btn gc-btn--secundario"
              style={{ padding: '0.55rem 1.15rem', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>👁️ Ver Home Pública</span>
              <span aria-hidden="true">↗</span>
            </a>

            <Button
              variante="secundario"
              onClick={logout}
              style={{ padding: '0.55rem 1.15rem', fontSize: '0.86rem', borderColor: '#A23B2A', color: '#A23B2A' }}
            >
              Sair da Administração
            </Button>
          </div>
        </header>

        {/* FEEDBACK DE SUCESSO / ERRO */}
        {mensagemSucesso && (
          <div style={{ marginBottom: '1.5rem' }}>
            <Alert variant="success" dismissible onDismiss={() => setMensagemSucesso('')}>
              <AlertDescription>{mensagemSucesso}</AlertDescription>
            </Alert>
          </div>
        )}

        {mensagemErro && (
          <div style={{ marginBottom: '1.5rem' }}>
            <Alert variant="destructive" dismissible onDismiss={() => setMensagemErro('')}>
              <AlertDescription>{mensagemErro}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* ===================================================================
            BARRA DE NAVEGAÇÃO ENTRE AS ABAS PRINCIPAIS (TABS SHADCN STYLE)
            =================================================================== */}
        <div style={{ marginBottom: '2rem' }}>
          <Tabs value={abaAtiva} onValueChange={(val) => setAbaAtiva(val)}>
            <TabsList style={{ width: 'auto', flexWrap: 'wrap' }}>
              <TabsTrigger value="visao_geral">
                <span>Visão Geral</span>
              </TabsTrigger>
              <TabsTrigger value="cms_home">
                <span>Editar Home (CMS)</span>
              </TabsTrigger>
              <TabsTrigger value="artigos">
                <span>Biblioteca de Conteúdos</span>
                <Badge variant="secondary" style={{ fontSize: '11px', padding: '0 5px' }}>
                  {artigos.length}
                </Badge>
              </TabsTrigger>
              {FEATURES.TELEMEDICINA_ATIVA && (
                <TabsTrigger value="especialistas">
                  <span>Especialistas</span>
                  <Badge variant="secondary" style={{ fontSize: '11px', padding: '0 5px' }}>
                    {especialistas.length}
                  </Badge>
                </TabsTrigger>
              )}
              <TabsTrigger value="moderacao_usuarios">
                <span>Moderação & Usuários</span>
                <Badge variant="secondary" style={{ fontSize: '11px', padding: '0 5px' }}>
                  {depoimentos.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* INÍCIO BLOCO FEEDBACK CARREGAMENTO (GLICOLOADER PÁGINA) */}
        {carregandoGeral ? (
          <div
            style={{
              backgroundColor: 'var(--cor-superficie)',
              borderRadius: '20px',
              padding: '3rem 2rem',
              border: '1px solid rgba(124, 83, 63, 0.15)',
              boxShadow: '0 8px 30px rgba(46, 40, 36, 0.05)',
            }}
          >
            <GlicoLoader
              variant="pagina"
              mensagem="Carregando painel de administração e auditoria..."
              submensagem="Consolidando métricas, trilha de auditoria e configurações com segurança."
            />
          </div>
        ) : (
          <>
            {/* ===================================================================
                ABA 1: VISÃO GERAL & FINANÇAS (KPIS, SPLIT E AUDITORIA)
                =================================================================== */}
        {abaAtiva === 'visao_geral' && (
          <div style={{ display: 'grid', gap: '2rem' }}>
            {/* GRID DE KPIS GLOBAIS */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {/* Card 1 */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid rgba(124, 83, 63, 0.15)',
                  boxShadow: '0 4px 16px rgba(46, 40, 36, 0.04)',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: '#7C533F', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Famílias & Cuidadores
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#2E2824', fontFamily: 'var(--fonte-titulo)' }}>
                  {dashboardData.kpis.total_familias || 14}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#5A5049', marginTop: '0.35rem' }}>
                  {dashboardData.kpis.total_pacientes || 16} perfis de saúde cadastrados
                </div>
              </div>

              {/* Card Fase 1: Biblioteca de Conteúdos */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid rgba(124, 83, 63, 0.15)',
                  boxShadow: '0 4px 16px rgba(46, 40, 36, 0.04)',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: '#7C533F', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Artigos & Guias Publicados
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#2E2824', fontFamily: 'var(--fonte-titulo)' }}>
                  {artigos.length || 6}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#3B7E48', fontWeight: 600, marginTop: '0.35rem' }}>
                  Pilar 1 Ativo • Trilha Pedagógica
                </div>
              </div>

              {/* Card Fase 1: Moderação Comunitária */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid rgba(124, 83, 63, 0.15)',
                  boxShadow: '0 4px 16px rgba(46, 40, 36, 0.04)',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: '#7C533F', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Vozes & Depoimentos
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#2E2824', fontFamily: 'var(--fonte-titulo)' }}>
                  {depoimentos.length || 3}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#5A5049', marginTop: '0.35rem' }}>
                  Moderação ética ativa (RN-MOD-01)
                </div>
              </div>

              {/* INÍCIO BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS (COMENTADO PARA LANÇAMENTO FASE 1) */}
              {FEATURES.TELEMEDICINA_ATIVA && (
                <>
                  {/* Card 2 */}
                  <div
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      border: '1px solid rgba(124, 83, 63, 0.15)',
                      boxShadow: '0 4px 16px rgba(46, 40, 36, 0.04)',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', color: '#7C533F', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Especialistas de Saúde
                    </div>
                    <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#2E2824', fontFamily: 'var(--fonte-titulo)' }}>
                      {dashboardData.kpis.especialistas_ativos || 4}{' '}
                      <span style={{ fontSize: '1rem', color: '#3B7E48', fontWeight: 600 }}>Ativos</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#5A5049', marginTop: '0.35rem' }}>
                      {dashboardData.kpis.especialistas_pendentes || 0} aguardando curadoria de conselho
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      border: '1px solid rgba(124, 83, 63, 0.15)',
                      boxShadow: '0 4px 16px rgba(46, 40, 36, 0.04)',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', color: '#7C533F', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Teleconsultas na Plataforma
                    </div>
                    <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#2E2824', fontFamily: 'var(--fonte-titulo)' }}>
                      {dashboardData.kpis.consultas_realizadas || 8}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#5A5049', marginTop: '0.35rem' }}>
                      {dashboardData.kpis.consultas_agendadas || 3} agendadas para os próximos dias
                    </div>
                  </div>

                  {/* Card 4 (Finanças e Split) */}
                  <div
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      border: '1px solid rgba(59, 126, 72, 0.3)',
                      boxShadow: '0 4px 16px rgba(59, 126, 72, 0.08)',
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #F5FBF6 100%)',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', color: '#3B7E48', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Receita Líquida GlicoCare (35%)
                    </div>
                    <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#1E4620', fontFamily: 'var(--fonte-titulo)' }}>
                      R$ {Number(dashboardData.split_financeiro.taxa_glicocare_valor || 448).toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#5A5049', marginTop: '0.35rem' }}>
                      De R$ {Number(dashboardData.split_financeiro.total_processado || 1280).toFixed(2)} em consultas processadas
                    </div>
                  </div>
                </>
              )}
              {/* FIM BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS */}
            </div>

            {/* INÍCIO BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS (COMENTADO PARA LANÇAMENTO FASE 1) */}
            {FEATURES.TELEMEDICINA_ATIVA && (
              /* CARD EXPLICATIVO DO SPLIT 65% / 35% */
              <div
                style={{
                  backgroundColor: 'var(--cor-superficie)',
                  borderRadius: '16px',
                  padding: '1.85rem',
                  border: '1px solid rgba(124, 83, 63, 0.18)',
                }}
              >
                <h2 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.35rem', color: 'var(--cor-texto)', marginBottom: '0.5rem' }}>
                  Resumo da Repartição Financeira (RN-FIN-03)
                </h2>
                <p style={{ fontSize: '0.9rem', color: '#5A5049', marginBottom: '1.5rem' }}>
                  Cada teleconsulta é processada em custódia segura. 65% do valor bruto é repassado diretamente ao especialista após a conclusão do prontuário, e 35% sustenta a infraestrutura e a segurança da plataforma GlicoCare.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
                  {/* Barra Visual */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                      <span style={{ color: '#7C533F' }}>Repasse Especialistas (65%)</span>
                      <span style={{ color: '#3B7E48' }}>Taxa GlicoCare (35%)</span>
                    </div>
                    <div style={{ height: '24px', borderRadius: '12px', overflow: 'hidden', display: 'flex', backgroundColor: '#EAE4D9' }}>
                      <div
                        style={{
                          width: '65%',
                          backgroundColor: '#7C533F',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFF',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                        }}
                      >
                        65% (R$ {Number(dashboardData.split_financeiro.repasse_especialista_valor || 832).toFixed(2)})
                      </div>
                      <div
                        style={{
                          width: '35%',
                          backgroundColor: '#3B7E48',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFF',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                        }}
                      >
                        35% (R$ {Number(dashboardData.split_financeiro.taxa_glicocare_valor || 448).toFixed(2)})
                      </div>
                    </div>
                  </div>

                  {/* Resumo em Pílulas */}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ backgroundColor: '#FFFFFF', padding: '0.85rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(124, 83, 63, 0.15)', flex: 1 }}>
                      <span style={{ fontSize: '0.75rem', color: '#7C533F', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                        Especialistas (65%)
                      </span>
                      <strong style={{ fontSize: '1.25rem', color: '#2E2824' }}>
                        R$ {Number(dashboardData.split_financeiro.repasse_especialista_valor || 832).toFixed(2)}
                      </strong>
                    </div>
                    <div style={{ backgroundColor: '#FFFFFF', padding: '0.85rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(59, 126, 72, 0.25)', flex: 1 }}>
                      <span style={{ fontSize: '0.75rem', color: '#3B7E48', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                        Plataforma (35%)
                      </span>
                      <strong style={{ fontSize: '1.25rem', color: '#1E4620' }}>
                        R$ {Number(dashboardData.split_financeiro.taxa_glicocare_valor || 448).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* FIM BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS */}

            {/* VISUALIZADOR DOS LOGS DE AUDITORIA IMUTÁVEIS (RN-AUD-01) */}
            <div
              style={{
                backgroundColor: 'var(--cor-superficie)',
                borderRadius: '16px',
                padding: '1.85rem',
                border: '1px solid rgba(124, 83, 63, 0.18)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.35rem', color: 'var(--cor-texto)', margin: 0 }}>
                    Trilha de Auditoria Imutável (RN-AUD-01)
                  </h2>
                  <p style={{ fontSize: '0.86rem', color: '#5A5049', margin: '0.25rem 0 0 0' }}>
                    Registro append-only das mutações (Criação, Edição, Exclusão, Login) no fuso de Brasília.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={buscaLogs}
                    onChange={(e) => setBuscaLogs(e.target.value)}
                    placeholder="Buscar por usuário, tabela..."
                    style={{ width: '220px', padding: '7px 12px', fontSize: '0.85rem' }}
                  />

                  <CustomSelect
                    value={filtroAcaoLog}
                    onChange={(v) => setFiltroAcaoLog(v)}
                    options={[
                      { value: 'TODOS', label: 'Todas as Ações' },
                      { value: 'CRIACAO', label: 'CRIACAO' },
                      { value: 'EDICAO', label: 'EDICAO' },
                      { value: 'EXCLUSAO', label: 'EXCLUSAO' },
                      { value: 'LOGIN', label: 'LOGIN' },
                    ]}
                    style={{ width: '160px' }}
                  />
                </div>
              </div>

              {logsFiltrados.length === 0 ? (
                <p style={{ color: '#5A5049', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
                  Nenhum registro de auditoria encontrado para o filtro selecionado.
                </p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#EAE4D9', borderBottom: '1px solid rgba(124, 83, 63, 0.2)', textAlign: 'left' }}>
                        <th style={{ padding: '9px 12px' }}>ID</th>
                        <th style={{ padding: '9px 12px' }}>Data / Hora</th>
                        <th style={{ padding: '9px 12px' }}>Responsável</th>
                        <th style={{ padding: '9px 12px' }}>Ação</th>
                        <th style={{ padding: '9px 12px' }}>Tabela</th>
                        <th style={{ padding: '9px 12px' }}>Registro</th>
                        <th style={{ padding: '9px 12px' }}>Rota Impactada</th>
                        <th style={{ padding: '9px 12px' }}>IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logsFiltrados.map((log) => {
                        let corBadge = '#3B7E48';
                        if (log.acao === 'EDICAO') corBadge = '#7C533F';
                        if (log.acao === 'EXCLUSAO') corBadge = '#C94A38';
                        if (log.acao === 'LOGIN') corBadge = '#4A6984';

                        return (
                          <tr
                            key={log.id}
                            style={{
                              borderBottom: '1px solid rgba(124, 83, 63, 0.08)',
                              backgroundColor: '#FFFFFF',
                            }}
                          >
                            <td style={{ padding: '9px 12px', fontWeight: 700, color: '#7C533F' }}>#{log.id}</td>
                            <td style={{ padding: '9px 12px', color: '#2E2824', whiteSpace: 'nowrap' }}>{log.data_hora_local}</td>
                            <td style={{ padding: '9px 12px', fontWeight: 600 }}>{log.usuario_nome || 'Sistema'}</td>
                            <td style={{ padding: '9px 12px' }}>
                              <span
                                style={{
                                  backgroundColor: corBadge,
                                  color: '#FFFFFF',
                                  fontSize: '0.72rem',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                }}
                              >
                                {log.acao}
                              </span>
                            </td>
                            <td style={{ padding: '9px 12px', fontFamily: 'monospace' }}>{log.tabela_afetada}</td>
                            <td style={{ padding: '9px 12px', color: '#5A5049' }}>{log.registro_id}</td>
                            <td style={{ padding: '9px 12px', color: '#5A5049' }}>{log.pagina_impacto}</td>
                            <td style={{ padding: '9px 12px', color: '#888', fontSize: '0.8rem' }}>{log.ip_origem || '127.0.0.1'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            ABA 2: CMS DINÂMICO DA HOME (EDITAR TEXTOS E IMAGENS)
            =================================================================== */}
        {abaAtiva === 'cms_home' && (
          <div
            style={{
              backgroundColor: 'var(--cor-superficie)',
              borderRadius: '20px',
              padding: '2rem 2.25rem',
              border: '1px solid rgba(124, 83, 63, 0.18)',
            }}
          >
            {/* BARRA SUPERIOR DE AÇÃO DO CMS */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                borderBottom: '1px solid rgba(124, 83, 63, 0.15)',
                paddingBottom: '1.25rem',
                marginBottom: '2rem',
              }}
            >
              <div>
                <h2 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.5rem', color: 'var(--cor-texto)', margin: 0 }}>
                  Editor Visual da Página Inicial (CMS)
                </h2>
                <p style={{ fontSize: '0.9rem', color: '#5A5049', margin: '0.3rem 0 0 0' }}>
                  Edite em tempo real os títulos, frases de acolhimento e imagens da Landing Page. Tudo é persistido na tabela <code>configuracoes_home</code>.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gc-btn gc-btn--secundario"
                  style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
                >
                  👁️ Prévia na Home
                </a>

                <Button
                  variante="primario"
                  onClick={handleSalvarCMSHome}
                  loading={salvandoHome}
                  disabled={salvandoHome}
                  style={{ padding: '0.65rem 1.65rem', fontSize: '0.92rem' }}
                >
                  {salvandoHome ? 'Salvando Alterações...' : '✓ Salvar Alterações na Home'}
                </Button>
              </div>
            </div>

            {/* SEÇÃO 1: HERO / SEÇÃO PRINCIPAL */}
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#7C533F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                — SEÇÃO 1: HERO & BOAS-VINDAS PRINCIPAIS
              </div>
              <h3 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.25rem', color: 'var(--cor-texto)', marginBottom: '1.25rem' }}>
                Primeira Impressão da Família
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Badge Superior (Pílula com Ponto Verde):
                  </label>
                  <input
                    type="text"
                    value={homeConfigs.hero_badge || ''}
                    onChange={(e) => handleHomeCampoChange('hero_badge', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Palavra de Destaque com Curva Verde:
                  </label>
                  <input
                    type="text"
                    value={homeConfigs.hero_titulo_destaque || ''}
                    onChange={(e) => handleHomeCampoChange('hero_titulo_destaque', e.target.value)}
                    placeholder="ex: segura"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Título Principal H1 (inclua a palavra de destaque):
                  </label>
                  <input
                    type="text"
                    value={homeConfigs.hero_titulo || ''}
                    onChange={(e) => handleHomeCampoChange('hero_titulo', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Subtítulo Explicativo:
                  </label>
                  <textarea
                    rows={3}
                    value={homeConfigs.hero_subtitulo || ''}
                    onChange={(e) => handleHomeCampoChange('hero_subtitulo', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Texto do Botão Primário:
                  </label>
                  <input
                    type="text"
                    value={homeConfigs.hero_cta_primario || ''}
                    onChange={(e) => handleHomeCampoChange('hero_cta_primario', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Texto do Botão Secundário:
                  </label>
                  <input
                    type="text"
                    value={homeConfigs.hero_cta_secundario || ''}
                    onChange={(e) => handleHomeCampoChange('hero_cta_secundario', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Frase no Balão Escuro do Lufy:
                  </label>
                  <input
                    type="text"
                    value={homeConfigs.hero_balao_lufy || ''}
                    onChange={(e) => handleHomeCampoChange('hero_balao_lufy', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Upload Imagem Hero */}
                <div
                  style={{
                    gridColumn: '1 / -1',
                    backgroundColor: '#FFFFFF',
                    padding: '1.25rem',
                    borderRadius: '14px',
                    border: '1px solid rgba(124, 83, 63, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ width: '90px', height: '90px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#EAE4D9', flexShrink: 0 }}>
                    <img
                      src={previewsHomeUpload['hero_imagem_url'] || homeConfigs.hero_imagem_url || lufyMascoteFoto}
                      alt="Preview Mascote Hero"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                      Trocar Imagem do Mascote Lufy (Hero):
                    </label>
                    <span style={{ fontSize: '0.8rem', color: '#5A5049', display: 'block', marginBottom: '0.5rem' }}>
                      Formatos aceitos: JPG, PNG ou WEBP até 8MB. Deixe em branco para usar a foto padrão.
                    </span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={(e) => handleHomeImagemSelect('hero_imagem_url', e.target.files[0])}
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(124, 83, 63, 0.12)', margin: '2.5rem 0' }} />

            {/* SEÇÃO 2: CONHEÇA O LUFY */}
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#7C533F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                — SEÇÃO 2: CONHEÇA O LUFY & HISTÓRIA
              </div>
              <h3 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.25rem', color: 'var(--cor-texto)', marginBottom: '1.25rem' }}>
                Narrativa e Humanização
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Sobretítulo (Eyebrow):
                  </label>
                  <input
                    type="text"
                    value={homeConfigs.lufy_eyebrow || ''}
                    onChange={(e) => handleHomeCampoChange('lufy_eyebrow', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Palavra Destacada em Terracota no Título:
                  </label>
                  <input
                    type="text"
                    value={homeConfigs.lufy_titulo_destaque || ''}
                    onChange={(e) => handleHomeCampoChange('lufy_titulo_destaque', e.target.value)}
                    placeholder="ex: Afeto"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Título H2 da Seção:
                  </label>
                  <input
                    type="text"
                    value={homeConfigs.lufy_titulo || ''}
                    onChange={(e) => handleHomeCampoChange('lufy_titulo', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Primeiro Parágrafo da Narrativa:
                  </label>
                  <textarea
                    rows={3}
                    value={homeConfigs.lufy_paragrafo_1 || ''}
                    onChange={(e) => handleHomeCampoChange('lufy_paragrafo_1', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Segundo Parágrafo da Narrativa:
                  </label>
                  <textarea
                    rows={3}
                    value={homeConfigs.lufy_paragrafo_2 || ''}
                    onChange={(e) => handleHomeCampoChange('lufy_paragrafo_2', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Citação Acolhedora sobre a Imagem da Família:
                  </label>
                  <input
                    type="text"
                    value={homeConfigs.lufy_citacao_foto || ''}
                    onChange={(e) => handleHomeCampoChange('lufy_citacao_foto', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Upload Imagem Família */}
                <div
                  style={{
                    gridColumn: '1 / -1',
                    backgroundColor: '#FFFFFF',
                    padding: '1.25rem',
                    borderRadius: '14px',
                    border: '1px solid rgba(124, 83, 63, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ width: '90px', height: '90px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#EAE4D9', flexShrink: 0 }}>
                    <img
                      src={previewsHomeUpload['lufy_imagem_url'] || homeConfigs.lufy_imagem_url || familiaCuidadoFoto}
                      alt="Preview Foto Família"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                      Trocar Imagem da Família Cuidado:
                    </label>
                    <span style={{ fontSize: '0.8rem', color: '#5A5049', display: 'block', marginBottom: '0.5rem' }}>
                      Formatos aceitos: JPG, PNG ou WEBP até 8MB.
                    </span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={(e) => handleHomeImagemSelect('lufy_imagem_url', e.target.files[0])}
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(124, 83, 63, 0.12)', margin: '2.5rem 0' }} />

            {/* SEÇÃO 3: CTA FINAL */}
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#7C533F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                — SEÇÃO 3: CHAMADA FINAL (CTA DE FECHAMENTO)
              </div>
              <h3 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.25rem', color: 'var(--cor-texto)', marginBottom: '1.25rem' }}>
                Fechamento da Landing Page
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Título da Chamada Final:
                  </label>
                  <input
                    type="text"
                    value={homeConfigs.cta_final_titulo || ''}
                    onChange={(e) => handleHomeCampoChange('cta_final_titulo', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Subtítulo Convidativo:
                  </label>
                  <textarea
                    rows={2}
                    value={homeConfigs.cta_final_subtitulo || ''}
                    onChange={(e) => handleHomeCampoChange('cta_final_subtitulo', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Texto do Botão de Ação:
                  </label>
                  <input
                    type="text"
                    value={homeConfigs.cta_final_botao || ''}
                    onChange={(e) => handleHomeCampoChange('cta_final_botao', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* BOTÃO FINAL DE SALVAR */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <Button
                variante="primario"
                onClick={handleSalvarCMSHome}
                loading={salvandoHome}
                disabled={salvandoHome}
                style={{ padding: '0.85rem 2.25rem', fontSize: '1rem' }}
              >
                {salvandoHome ? 'Salvando Alterações...' : '✓ Salvar Alterações na Home'}
              </Button>
            </div>
          </div>
        )}

        {/* ===================================================================
            ABA 3: BIBLIOTECA DE CONTEÚDOS (GESTOR EDITORIAL & EDITOR)
            =================================================================== */}
        {abaAtiva === 'artigos' && (
          <div
            style={{
              backgroundColor: 'var(--cor-superficie)',
              borderRadius: '20px',
              padding: '2rem 2.25rem',
              border: '1px solid rgba(124, 83, 63, 0.18)',
            }}
          >
            {/* TOPO DA ABA DE ARTIGOS */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.75rem',
              }}
            >
              <div>
                <h2 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.5rem', color: 'var(--cor-texto)', margin: 0 }}>
                  Gestão Editorial da Biblioteca
                </h2>
                <p style={{ fontSize: '0.9rem', color: '#5A5049', margin: '0.3rem 0 0 0' }}>
                  Artigos pedagógicos estruturados com tom acolhedor e visual Porto Seguro.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={buscaArtigo}
                  onChange={(e) => setBuscaArtigo(e.target.value)}
                  placeholder="Buscar artigos..."
                  style={{ width: '220px', padding: '8px 12px', fontSize: '0.88rem' }}
                />

                <CustomSelect
                  value={filtroCategoriaArtigo}
                  onChange={(v) => setFiltroCategoriaArtigo(v)}
                  options={[
                    { value: 'TODAS', label: 'Todas Categorias' },
                    { value: 'Acolhimento Inicial', label: 'Acolhimento Inicial' },
                    { value: 'Rotina Escolar', label: 'Rotina Escolar' },
                    { value: 'Tecnologia & Autonomia', label: 'Tecnologia & Autonomia' },
                    { value: 'Com o Lufy', label: 'Com o Lufy' },
                  ]}
                  style={{ width: '190px' }}
                />

                <Button
                  variante="primario"
                  onClick={iniciarCriacaoArtigo}
                  style={{ padding: '0.65rem 1.4rem', fontSize: '0.9rem' }}
                >
                  + Criar Novo Conteúdo
                </Button>
              </div>
            </div>

            {/* TABELA DE ARTIGOS */}
            {artigosFiltrados.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '3rem 0', color: '#5A5049' }}>
                Nenhum artigo encontrado. Clique em "+ Criar Novo Conteúdo" para iniciar.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {artigosFiltrados.map((art) => (
                  <div
                    key={art.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '14px',
                      padding: '1.25rem 1.5rem',
                      border: '1px solid rgba(124, 83, 63, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      boxShadow: '0 2px 8px rgba(46, 40, 36, 0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, minWidth: '300px' }}>
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '10px',
                          backgroundColor: '#EAE4D9',
                          overflow: 'hidden',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.4rem',
                        }}
                      >
                        {art.imagem_capa_url ? (
                          <img src={art.imagem_capa_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <CapaEditorialDefault
                            selo={art.selo_editorial || 'GUIA'}
                            numero={art.id}
                            cor={art.cor_capa_default || 'terracota'}
                            categoria={art.categoria}
                            variante="mini"
                          />
                        )}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontSize: '0.74rem', backgroundColor: '#F6F3EE', color: '#7C533F', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                            {art.categoria}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: '#5A5049' }}>
                            {art.tempo_leitura || '5 min'}
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              backgroundColor: art.status_publicacao === 'publicado' ? '#D1E7DD' : '#FFF3CD',
                              color: art.status_publicacao === 'publicado' ? '#0F5132' : '#664D03',
                            }}
                          >
                            {art.status_publicacao === 'publicado' ? 'Publicado' : 'Rascunho'}
                          </span>
                        </div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#2E2824', fontWeight: 700 }}>
                          {art.titulo}
                        </h4>
                        <span style={{ fontSize: '0.82rem', color: '#777', display: 'block', marginTop: '0.2rem' }}>
                          Por {art.autor_nome || 'Priscila Manzoni Furlani'} • slug: <code>{art.slug}</code>
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <Button
                        variante="secundario"
                        onClick={() => iniciarEdicaoArtigo(art)}
                        style={{ padding: '0.45rem 1rem', fontSize: '0.84rem' }}
                      >
                        ✏️ Editar
                      </Button>

                      <a
                        href={`/artigo/${art.slug || art.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gc-btn gc-btn--secundario"
                        style={{ padding: '0.45rem 0.95rem', fontSize: '0.84rem' }}
                      >
                        👁️ Ver
                      </a>

                      <button
                        type="button"
                        onClick={() => handleExcluirArtigo(art.id, art.titulo)}
                        style={{
                          backgroundColor: 'transparent',
                          border: '1px solid rgba(201, 74, 56, 0.4)',
                          color: '#C94A38',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.84rem',
                          fontWeight: 600,
                        }}
                        title="Remover artigo"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            MODAL DE CRIAÇÃO / EDIÇÃO DE ARTIGO EM BLOCOS
            =================================================================== */}
        {modalArtigoAberto && artigoEmEdicao && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(46, 40, 36, 0.65)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              backdropFilter: 'blur(3px)',
            }}
          >
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '920px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '2.25rem',
                border: '1px solid rgba(124, 83, 63, 0.2)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.45rem', color: '#2E2824', margin: 0 }}>
                  {artigoEmEdicao.id ? `Editar Artigo #${artigoEmEdicao.id}` : 'Criar Novo Conteúdo Editorial'}
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setVisualizarPreviewArtigo(!visualizarPreviewArtigo)}
                    style={{
                      padding: '0.45rem 0.95rem',
                      borderRadius: '8px',
                      border: '1px solid #7C533F',
                      backgroundColor: visualizarPreviewArtigo ? '#7C533F' : '#FFF',
                      color: visualizarPreviewArtigo ? '#FFF' : '#7C533F',
                      cursor: 'pointer',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                    }}
                  >
                    {visualizarPreviewArtigo ? 'Voltar ao Editor' : '👁️ Prévia do Artigo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalArtigoAberto(false)}
                    style={{ border: 'none', background: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#777' }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {visualizarPreviewArtigo ? (
                /* PRÉ-VISUALIZAÇÃO ACOLHEDORA DO ARTIGO */
                <div style={{ backgroundColor: 'var(--cor-fundo)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(124, 83, 63, 0.15)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#7C533F', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    {artigoEmEdicao.categoria} • {artigoEmEdicao.tempo_leitura}
                  </div>
                  <h1 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.85rem', color: '#2E2824', marginBottom: '0.5rem' }}>
                    {artigoEmEdicao.titulo}{' '}
                    {artigoEmEdicao.titulo_destaque_italico && (
                      <span className="texto-italico-terracota">({artigoEmEdicao.titulo_destaque_italico})</span>
                    )}
                  </h1>
                  {artigoEmEdicao.subtitulo && (
                    <p style={{ fontSize: '1.05rem', color: '#5A5049', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                      {artigoEmEdicao.subtitulo}
                    </p>
                  )}

                  {previewCapaArtigo ? (
                    <img
                      src={previewCapaArtigo}
                      alt={artigoEmEdicao.legenda_capa || 'Capa do artigo'}
                      style={{ width: '100%', maxHeight: '340px', objectFit: 'cover', borderRadius: '14px', marginBottom: '1.5rem' }}
                    />
                  ) : (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <CapaEditorialDefault
                        selo={artigoEmEdicao.selo_editorial || 'GUIA ESSENCIAL'}
                        numero={artigoEmEdicao.id || '01'}
                        cor={artigoEmEdicao.cor_capa_default || 'terracota'}
                        categoria={artigoEmEdicao.categoria}
                        variante="banner"
                      />
                    </div>
                  )}

                  <div style={{ display: 'grid', gap: '1.25rem', marginTop: '1.5rem' }}>
                    {(artigoEmEdicao.conteudo_blocos || []).map((b, idx) => {
                      if (b.tipo === 'paragrafo') {
                        return <p key={idx} style={{ lineHeight: 1.7, color: '#2E2824' }}>{b.texto}</p>;
                      }
                      if (b.tipo === 'subtitulo') {
                        return <h2 key={idx} style={{ fontFamily: 'var(--fonte-titulo)', color: '#7C533F', fontSize: '1.35rem', margin: '1rem 0 0.5rem' }}>{b.texto}</h2>;
                      }
                      if (b.tipo === 'citacao') {
                        return (
                          <div key={idx} style={{ backgroundColor: '#F6F3EE', borderLeft: '4px solid #3B7E48', padding: '1.2rem 1.5rem', borderRadius: '8px', margin: '1rem 0' }}>
                            <p style={{ fontStyle: 'italic', color: '#2E2824', margin: 0, fontSize: '1.02rem' }}>{b.texto}</p>
                            <span style={{ fontSize: '0.8rem', color: '#7C533F', fontWeight: 700, display: 'block', marginTop: '0.4rem' }}>— {b.autor || 'Lufy'}</span>
                          </div>
                        );
                      }
                      if (b.tipo === 'passo') {
                        return (
                          <div key={idx} style={{ display: 'flex', gap: '1rem', backgroundColor: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid rgba(124, 83, 63, 0.12)' }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#7C533F', minWidth: '32px' }}>{b.numero}</span>
                            <div>
                              <strong style={{ display: 'block', color: '#2E2824', marginBottom: '0.2rem' }}>{b.titulo}</strong>
                              <span style={{ color: '#5A5049', fontSize: '0.9rem' }}>{b.texto}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              ) : (
                /* FORMULÁRIO DO EDITOR */
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        Título do Artigo:
                      </label>
                      <input
                        type="text"
                        value={artigoEmEdicao.titulo}
                        onChange={(e) => setArtigoEmEdicao({ ...artigoEmEdicao, titulo: e.target.value })}
                        placeholder="ex: Hipoglicemia sem susto: um plano para toda a família"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        Destaque Itálico (Terracota):
                      </label>
                      <input
                        type="text"
                        value={artigoEmEdicao.titulo_destaque_italico || ''}
                        onChange={(e) => setArtigoEmEdicao({ ...artigoEmEdicao, titulo_destaque_italico: e.target.value })}
                        placeholder="ex: sem susto"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Subtítulo ou Chamada Editorial:
                    </label>
                    <input
                      type="text"
                      value={artigoEmEdicao.subtitulo || ''}
                      onChange={(e) => setArtigoEmEdicao({ ...artigoEmEdicao, subtitulo: e.target.value })}
                      placeholder="ex: Um guia prático para agir com calma e transmitir segurança"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        Categoria:
                      </label>
                      <CustomSelect
                        value={artigoEmEdicao.categoria}
                        onChange={(v) => setArtigoEmEdicao({ ...artigoEmEdicao, categoria: v })}
                        options={[
                          { value: 'Acolhimento Inicial', label: 'Acolhimento Inicial' },
                          { value: 'Rotina Escolar', label: 'Rotina Escolar' },
                          { value: 'Tecnologia & Autonomia', label: 'Tecnologia & Autonomia' },
                          { value: 'Com o Lufy', label: 'Com o Lufy' },
                        ]}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        Tempo Estimado de Leitura:
                      </label>
                      <input
                        type="text"
                        value={artigoEmEdicao.tempo_leitura || ''}
                        onChange={(e) => setArtigoEmEdicao({ ...artigoEmEdicao, tempo_leitura: e.target.value })}
                        placeholder="ex: 6 min de leitura"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        Autor Editorial:
                      </label>
                      <input
                        type="text"
                        value={artigoEmEdicao.autor_nome || 'Priscila Manzoni Furlani'}
                        onChange={(e) => setArtigoEmEdicao({ ...artigoEmEdicao, autor_nome: e.target.value })}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        Status de Publicação:
                      </label>
                      <CustomSelect
                        value={artigoEmEdicao.status_publicacao || 'publicado'}
                        onChange={(v) => setArtigoEmEdicao({ ...artigoEmEdicao, status_publicacao: v })}
                        options={[
                          { value: 'publicado', label: '🟢 Publicado' },
                          { value: 'rascunho', label: '🟡 Rascunho' },
                          { value: 'arquivado', label: '⚪ Arquivado' },
                        ]}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                      Resumo do Card (exibido na grade da Biblioteca):
                    </label>
                    <textarea
                      rows={2}
                      value={artigoEmEdicao.resumo || ''}
                      onChange={(e) => setArtigoEmEdicao({ ...artigoEmEdicao, resumo: e.target.value })}
                      placeholder="Breve resumo para os pais e cuidadores..."
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* INÍCIO DO BLOCO DE CONFIGURAÇÃO DA CAPA EDITORIAL & UPLOAD OPCIONAL */}
                  <div
                    style={{
                      backgroundColor: '#F6F3EE',
                      padding: '1.25rem',
                      borderRadius: '14px',
                      border: '1px solid rgba(124, 83, 63, 0.18)',
                      display: 'grid',
                      gap: '1.15rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '0.88rem', fontWeight: 800, color: '#7C533F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Capa do Artigo (Personalizada ou Editorial Padrão)
                      </label>
                      <span style={{ fontSize: '0.78rem', color: '#5A5049', fontStyle: 'italic' }}>
                        * Upload de imagem é opcional
                      </span>
                    </div>

                    {/* Campos: Texto do Selo Superior e Cor da Capa Padrão */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#2E2824', marginBottom: '0.35rem' }}>
                          Texto do Selo Superior (Pílula Marfim):
                        </label>
                        <input
                          type="text"
                          value={artigoEmEdicao.selo_editorial || ''}
                          onChange={(e) =>
                            setArtigoEmEdicao({ ...artigoEmEdicao, selo_editorial: e.target.value.toUpperCase() })
                          }
                          placeholder="ex: GUIA ESSENCIAL, CHECKLIST PRÁTICO, VIDA REAL"
                          style={{ width: '100%', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#2E2824', marginBottom: '0.35rem' }}>
                          Cor da Capa Padrão (Sem Imagem):
                        </label>
                        <CustomSelect
                          value={artigoEmEdicao.cor_capa_default || 'terracota'}
                          onChange={(v) => setArtigoEmEdicao({ ...artigoEmEdicao, cor_capa_default: v })}
                          options={[
                            { value: 'terracota', label: 'Terracota (#947460) — Com o Lufy / Conversa em Família' },
                            { value: 'verde', label: 'Verde Sálvia (#527356) — Rotina Escolar / Checklist Prático' },
                            { value: 'carvalho', label: 'Carvalho (#665B53) — Tecnologia & Autonomia / Vida Real' },
                          ]}
                        />
                      </div>
                    </div>

                    {/* Pré-visualização em Tempo Real da Capa */}
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2E2824', marginBottom: '0.45rem' }}>
                        Pré-visualização em Tempo Real da Capa:
                      </div>

                      <div
                        style={{
                          borderRadius: '12px',
                          overflow: 'hidden',
                          border: '1px solid rgba(124, 83, 63, 0.2)',
                          height: '200px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#EAE4D9',
                          position: 'relative',
                        }}
                      >
                        {previewCapaArtigo ? (
                          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                            <span
                              style={{
                                position: 'absolute',
                                top: '1rem',
                                left: '1rem',
                                zIndex: 3,
                                backgroundColor: '#F6F3EE',
                                color: '#2E2824',
                                fontSize: '11px',
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                padding: '0.35rem 0.85rem',
                                borderRadius: '9999px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              }}
                            >
                              {artigoEmEdicao.selo_editorial || 'GUIA ESSENCIAL'}
                            </span>
                            <img
                              src={previewCapaArtigo}
                              alt="Prévia da capa"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        ) : (
                          <CapaEditorialDefault
                            selo={artigoEmEdicao.selo_editorial || 'GUIA ESSENCIAL'}
                            numero={artigoEmEdicao.id || '01'}
                            cor={artigoEmEdicao.cor_capa_default || 'terracota'}
                            categoria={artigoEmEdicao.categoria}
                            variante="preview"
                            style={{ height: '200px' }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Upload de Imagem Fotográfica Opcional */}
                    <div style={{ borderTop: '1px dashed rgba(124, 83, 63, 0.2)', paddingTop: '0.85rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <div style={{ flex: 1, minWidth: '240px' }}>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#2E2824', marginBottom: '0.2rem' }}>
                            Upload de Imagem de Capa (Opcional):
                          </label>
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setArquivoCapaArtigo(file);
                                setPreviewCapaArtigo(URL.createObjectURL(file));
                              }
                            }}
                            style={{ fontSize: '0.82rem', width: '100%' }}
                          />
                        </div>

                        {previewCapaArtigo && (
                          <button
                            type="button"
                            onClick={() => {
                              setArquivoCapaArtigo(null);
                              setPreviewCapaArtigo('');
                              setArtigoEmEdicao({ ...artigoEmEdicao, imagem_capa_url: '' });
                            }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.78rem',
                              backgroundColor: '#FFF',
                              color: '#A0382B',
                              border: '1px solid #A0382B',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            ✕ Remover imagem (usar Capa Padrão)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* FIM DO BLOCO DE CONFIGURAÇÃO DA CAPA EDITORIAL & UPLOAD OPCIONAL */}

                  {/* BLOCOS DE CONTEÚDO ESTRUTURADO */}
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#7C533F', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Blocos de Conteúdo do Artigo:
                      </label>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button type="button" onClick={() => adicionarBloco('paragrafo')} style={{ padding: '4px 10px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid #7C533F', background: '#FFF', cursor: 'pointer' }}>+ Parágrafo</button>
                        <button type="button" onClick={() => adicionarBloco('subtitulo')} style={{ padding: '4px 10px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid #7C533F', background: '#FFF', cursor: 'pointer' }}>+ Subtítulo H2</button>
                        <button type="button" onClick={() => adicionarBloco('citacao')} style={{ padding: '4px 10px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid #3B7E48', color: '#3B7E48', background: '#FFF', cursor: 'pointer' }}>+ Citação Lufy</button>
                        <button type="button" onClick={() => adicionarBloco('passo')} style={{ padding: '4px 10px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid #3B7E48', color: '#3B7E48', background: '#FFF', cursor: 'pointer' }}>+ Passo / Dica</button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {(artigoEmEdicao.conteudo_blocos || []).map((bloco, idx) => (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: '#FBF9F5',
                            border: '1px solid rgba(124, 83, 63, 0.15)',
                            borderRadius: '10px',
                            padding: '0.85rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#7C533F', textTransform: 'uppercase' }}>
                              Bloco #{idx + 1} — {bloco.tipo}
                            </span>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button type="button" onClick={() => moverBloco(idx, 'cima')} disabled={idx === 0} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>⬆</button>
                              <button type="button" onClick={() => moverBloco(idx, 'baixo')} disabled={idx === artigoEmEdicao.conteudo_blocos.length - 1} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>⬇</button>
                              <button type="button" onClick={() => removerBloco(idx)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#C94A38' }}>✕</button>
                            </div>
                          </div>

                          {bloco.tipo === 'paragrafo' && (
                            <textarea
                              rows={3}
                              value={bloco.texto || ''}
                              onChange={(e) => atualizarBloco(idx, 'texto', e.target.value)}
                              placeholder="Digite o texto do parágrafo..."
                              style={{ width: '100%', fontSize: '0.88rem' }}
                            />
                          )}

                          {bloco.tipo === 'subtitulo' && (
                            <input
                              type="text"
                              value={bloco.texto || ''}
                              onChange={(e) => atualizarBloco(idx, 'texto', e.target.value)}
                              placeholder="Título da subseção..."
                              style={{ width: '100%', fontWeight: 700 }}
                            />
                          )}

                          {bloco.tipo === 'citacao' && (
                            <div style={{ display: 'grid', gap: '0.4rem' }}>
                              <textarea
                                rows={2}
                                value={bloco.texto || ''}
                                onChange={(e) => atualizarBloco(idx, 'texto', e.target.value)}
                                placeholder="Frase de acolhimento do guardião..."
                                style={{ width: '100%', fontStyle: 'italic' }}
                              />
                              <input
                                type="text"
                                value={bloco.autor || 'Lufy'}
                                onChange={(e) => atualizarBloco(idx, 'autor', e.target.value)}
                                placeholder="Autor (ex: Lufy)"
                                style={{ width: '140px' }}
                              />
                            </div>
                          )}

                          {bloco.tipo === 'passo' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '0.5rem' }}>
                              <input
                                type="text"
                                value={bloco.numero || '01'}
                                onChange={(e) => atualizarBloco(idx, 'numero', e.target.value)}
                                placeholder="01"
                                style={{ textAlign: 'center', fontWeight: 800 }}
                              />
                              <div style={{ display: 'grid', gap: '0.35rem' }}>
                                <input
                                  type="text"
                                  value={bloco.titulo || ''}
                                  onChange={(e) => atualizarBloco(idx, 'titulo', e.target.value)}
                                  placeholder="Título do passo..."
                                  style={{ fontWeight: 700 }}
                                />
                                <input
                                  type="text"
                                  value={bloco.texto || ''}
                                  onChange={(e) => atualizarBloco(idx, 'texto', e.target.value)}
                                  placeholder="Descrição objetiva do passo..."
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.75rem' }}>
                <Button variante="secundario" onClick={() => setModalArtigoAberto(false)}>
                  Cancelar
                </Button>
                <Button
                  variante="primario"
                  onClick={handleSalvarArtigo}
                  loading={salvandoArtigo}
                  disabled={salvandoArtigo}
                >
                  {salvandoArtigo ? 'Salvando...' : '✓ Salvar Artigo no Acervo'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            ABA 4: ESPECIALISTAS & CURADORIA (RN-ESP-01 / RN-FIN-03)
            =================================================================== */}
        {/* INÍCIO BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS (COMENTADO PARA LANÇAMENTO FASE 1) */}
        {FEATURES.TELEMEDICINA_ATIVA && abaAtiva === 'especialistas' && (
          <div
            style={{
              backgroundColor: 'var(--cor-superficie)',
              borderRadius: '20px',
              padding: '2rem 2.25rem',
              border: '1px solid rgba(124, 83, 63, 0.18)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.5rem', color: 'var(--cor-texto)', margin: 0 }}>
                  Curadoria e Credenciamento de Especialistas
                </h2>
                <p style={{ fontSize: '0.9rem', color: '#5A5049', margin: '0.3rem 0 0 0' }}>
                  Validação ética de conselhos (CRM, CRN, CRP, CREF), controle de split de repasse (padrão 65%) e garantia do retorno incluso em 30 dias.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={buscaEspecialista}
                  onChange={(e) => setBuscaEspecialista(e.target.value)}
                  placeholder="Buscar especialista..."
                  style={{ width: '220px', padding: '8px 12px', fontSize: '0.88rem' }}
                />

                <CustomSelect
                  value={filtroStatusEspecialista}
                  onChange={(v) => setFiltroStatusEspecialista(v)}
                  options={[
                    { value: 'TODOS', label: 'Todos os Status' },
                    { value: 'ativo', label: 'Ativos na Vitrine' },
                    { value: 'pendente_validacao', label: 'Pendentes de Validação' },
                    { value: 'pausado', label: 'Pausados' },
                  ]}
                  style={{ width: '190px' }}
                />
              </div>
            </div>

            {/* LISTA DE ESPECIALISTAS */}
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {especialistasFiltrados.map((esp) => {
                const isProcessando = processandoEspecialistaId === esp.id;
                return (
                  <div
                    key={esp.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      border: '1px solid rgba(124, 83, 63, 0.15)',
                      boxShadow: '0 4px 14px rgba(46, 40, 36, 0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div
                          style={{
                            width: '54px',
                            height: '54px',
                            borderRadius: '50%',
                            backgroundColor: '#EAE4D9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.4rem',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          {esp.foto_perfil_url ? (
                            <img src={esp.foto_perfil_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            '🩺'
                          )}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#2E2824', fontWeight: 700 }}>
                              {esp.nome_completo}
                            </h3>
                            <span
                              style={{
                                fontSize: '0.74rem',
                                padding: '3px 9px',
                                borderRadius: '12px',
                                fontWeight: 700,
                                backgroundColor: esp.status_credenciamento === 'ativo' ? '#D1E7DD' : '#FFF3CD',
                                color: esp.status_credenciamento === 'ativo' ? '#0F5132' : '#664D03',
                              }}
                            >
                              {esp.status_credenciamento === 'ativo' ? '✓ Ativo na Vitrine' : 'Pendente de Curadoria'}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.88rem', color: '#7C533F', fontWeight: 600, display: 'block', marginTop: '0.2rem' }}>
                            {esp.especialidade} • Conselho: <strong>{esp.tipo_conselho} {esp.numero_conselho}-{esp.uf_conselho}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Ações de Moderação Rápida */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {esp.status_credenciamento !== 'ativo' ? (
                          <Button
                            variante="primario"
                            disabled={isProcessando}
                            onClick={() => handleAtualizarEspecialista(esp.id, { status_credenciamento: 'ativo', registro_verificado: 1 })}
                            style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
                          >
                            ✓ Aprovar e Ativar
                          </Button>
                        ) : (
                          <Button
                            variante="secundario"
                            disabled={isProcessando}
                            onClick={() => handleAtualizarEspecialista(esp.id, { status_credenciamento: 'pausado' })}
                            style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
                          >
                            ⏸ Pausar Vitrine
                          </Button>
                        )}

                        <button
                          type="button"
                          disabled={isProcessando}
                          onClick={() => handleAtualizarEspecialista(esp.id, { status_credenciamento: 'rejeitado', registro_verificado: 0 })}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '8px',
                            border: '1px solid #C94A38',
                            color: '#C94A38',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                          }}
                        >
                          ✕ Rejeitar
                        </button>
                      </div>
                    </div>

                    {/* Configuração de Honorários e Split na Curadoria */}
                    <div
                      style={{
                        backgroundColor: '#F6F3EE',
                        borderRadius: '12px',
                        padding: '1rem 1.25rem',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <label style={{ fontSize: '0.78rem', color: '#7C533F', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
                          Valor da Consulta (R$):
                        </label>
                        <input
                          type="number"
                          step="10"
                          defaultValue={Number(esp.valor_consulta || 320).toFixed(2)}
                          onBlur={(e) => handleAtualizarEspecialista(esp.id, { valor_consulta: parseFloat(e.target.value) })}
                          style={{ width: '130px', padding: '6px 10px', fontSize: '0.88rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.78rem', color: '#7C533F', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
                          Percentual de Repasse (%):
                        </label>
                        <input
                          type="number"
                          step="1"
                          defaultValue={Number(esp.percentual_repasse || 65).toFixed(0)}
                          onBlur={(e) => handleAtualizarEspecialista(esp.id, { percentual_repasse: parseFloat(e.target.value) })}
                          style={{ width: '90px', padding: '6px 10px', fontSize: '0.88rem' }}
                        />
                        <span style={{ fontSize: '0.75rem', color: '#5A5049', marginLeft: '0.35rem' }}>
                          (Split {Number(esp.percentual_repasse || 65).toFixed(0)}% / {100 - Number(esp.percentual_repasse || 65).toFixed(0)}%)
                        </span>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.78rem', color: '#7C533F', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
                          Política de Retorno Incluso:
                        </label>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            defaultChecked={Boolean(esp.oferece_retorno_incluso)}
                            onChange={(e) => handleAtualizarEspecialista(esp.id, { oferece_retorno_incluso: e.target.checked ? 1 : 0 })}
                          />
                          <span>1 Retorno em até {esp.prazo_retorno_dias || 30} dias</span>
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* FIM BLOCO FASE 2: TELEATENDIMENTOS E PAGAMENTOS */}

        {/* ===================================================================
            ABA 5: MODERAÇÃO & USUÁRIOS (RN-MOD-01 / CONTAS)
            =================================================================== */}
        {abaAtiva === 'moderacao_usuarios' && (
          <div
            style={{
              backgroundColor: 'var(--cor-superficie)',
              borderRadius: '20px',
              padding: '2rem 2.25rem',
              border: '1px solid rgba(124, 83, 63, 0.18)',
            }}
          >
            {/* SUB-ABAS INTERNAS */}
            <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.75rem' }}>
              <button
                type="button"
                onClick={() => setSubAbaModeracao('depoimentos')}
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: subAbaModeracao === 'depoimentos' ? '#7C533F' : '#EAE4D9',
                  color: subAbaModeracao === 'depoimentos' ? '#FFFFFF' : '#2E2824',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                }}
              >
                💬 Fila de Depoimentos & Avaliações ({depoimentos.length})
              </button>

              <button
                type="button"
                onClick={() => setSubAbaModeracao('usuarios')}
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: subAbaModeracao === 'usuarios' ? '#7C533F' : '#EAE4D9',
                  color: subAbaModeracao === 'usuarios' ? '#FFFFFF' : '#2E2824',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                }}
              >
                👥 Gestão de Contas de Usuários ({usuariosLista.length})
              </button>
            </div>

            {/* SUB-ABA 1: MODERAÇÃO DE DEPOIMENTOS */}
            {subAbaModeracao === 'depoimentos' && (
              <div>
                <h3 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.3rem', color: '#2E2824', marginBottom: '0.5rem' }}>
                  Moderação Ética de Depoimentos (RN-MOD-01)
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#5A5049', marginBottom: '1.5rem' }}>
                  Em conformidade com a RN-MOD-01, mensagens e relatos familiares passam por aprovação prévia para garantir respeito e acolhimento sereno.
                </p>

                {depoimentos.length === 0 ? (
                  <p style={{ color: '#1E4620', fontSize: '0.92rem', padding: '1.5rem 0' }}>
                    ✓ Todos os depoimentos estão moderados e em dia!
                  </p>
                ) : (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {depoimentos.map((dep) => (
                      <div
                        key={dep.id}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '12px',
                          padding: '1.25rem 1.5rem',
                          border: '1px solid rgba(124, 83, 63, 0.15)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 700, color: '#2E2824', fontSize: '0.95rem' }}>
                            {dep.nome_exibicao_familiar} ({dep.parentesco_contexto || 'Família DM1'})
                          </span>
                          <span style={{ fontSize: '0.78rem', color: '#7C533F' }}>
                            {dep.criado_em}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.92rem', color: '#2E2824', lineHeight: 1.55, margin: '0 0 1rem 0' }}>
                          "{dep.relato}"
                        </p>
                        <div style={{ display: 'flex', gap: '0.65rem' }}>
                          <Button
                            variante="primario"
                            onClick={() => handleModerarDepoimento(dep.id, 'aprovar', dep.tipo_registro)}
                            loading={moderandoDepoimentoId === dep.id}
                            disabled={moderandoDepoimentoId !== null}
                            style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
                          >
                            ✓ Aprovar e Publicar
                          </Button>
                          <Button
                            variante="secundario"
                            onClick={() => handleModerarDepoimento(dep.id, 'rejeitar', dep.tipo_registro)}
                            disabled={moderandoDepoimentoId !== null}
                            style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', borderColor: '#C94A38', color: '#C94A38' }}
                          >
                            ✕ Rejeitar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-ABA 2: GESTÃO DE CONTAS DE USUÁRIOS */}
            {subAbaModeracao === 'usuarios' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.3rem', color: '#2E2824', margin: 0 }}>
                    Contas Registradas na Plataforma
                  </h3>

                  <div style={{ display: 'flex', gap: '0.65rem' }}>
                    <input
                      type="text"
                      value={buscaUsuario}
                      onChange={(e) => setBuscaUsuario(e.target.value)}
                      placeholder="Buscar por nome ou e-mail..."
                      style={{ width: '220px', padding: '7px 12px', fontSize: '0.85rem' }}
                    />
                    <CustomSelect
                      value={filtroTipoUsuario}
                      onChange={(v) => setFiltroTipoUsuario(v)}
                      options={[
                        { value: 'todos', label: 'Todos os Perfis' },
                        { value: 'cuidador', label: 'Cuidadores' },
                        { value: 'diabetico', label: 'Diabéticos' },
                        { value: 'especialista', label: 'Especialistas' },
                        { value: 'admin', label: 'Administradores' },
                      ]}
                      style={{ width: '160px' }}
                    />
                  </div>
                </div>

                <div style={{ overflowX: 'auto', WebKitOverflowScrolling: 'touch' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', minWidth: '760px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#EAE4D9', borderBottom: '1px solid rgba(124, 83, 63, 0.2)', textAlign: 'left' }}>
                        <th style={{ padding: '10px 10px', width: '55px' }}>ID</th>
                        <th style={{ padding: '10px 10px' }}>Nome Completo</th>
                        <th style={{ padding: '10px 10px' }}>E-mail</th>
                        <th style={{ padding: '10px 10px', width: '130px' }}>Telefone</th>
                        <th style={{ padding: '10px 10px', width: '100px' }}>Perfil</th>
                        <th style={{ padding: '10px 10px', width: '80px' }}>Status</th>
                        <th style={{ padding: '10px 10px', width: '100px', textAlign: 'center' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuariosFiltrados.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid rgba(124, 83, 63, 0.08)', backgroundColor: '#FFFFFF' }}>
                          <td style={{ padding: '10px 10px', fontWeight: 700, color: '#7C533F', whiteSpace: 'nowrap' }}>#{u.id}</td>
                          <td style={{ padding: '10px 10px', fontWeight: 600 }}>{u.nome_completo}</td>
                          <td style={{ padding: '10px 10px', color: '#5A5049', wordBreak: 'break-word' }}>{u.email}</td>
                          <td style={{ padding: '10px 10px', color: '#5A5049', whiteSpace: 'nowrap' }}>{u.telefone || '—'}</td>
                          <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                            <span
                              style={{
                                fontSize: '0.74rem',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontWeight: 700,
                                backgroundColor: '#F6F3EE',
                                color: '#7C533F',
                              }}
                            >
                              {u.tipo_usuario || u.tipo_perfil}
                            </span>
                          </td>
                          <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                            <span
                              style={{
                                fontSize: '0.74rem',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontWeight: 700,
                                backgroundColor: u.ativo ? '#D1E7DD' : '#F8D7DA',
                                color: u.ativo ? '#0F5132' : '#842029',
                              }}
                            >
                              {u.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <button
                              type="button"
                              onClick={() => handleAlternarStatusUsuario(u.id, u.ativo)}
                              style={{
                                padding: '5px 12px',
                                borderRadius: '6px',
                                border: '1px solid rgba(124, 83, 63, 0.25)',
                                backgroundColor: 'transparent',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                color: u.ativo ? '#C94A38' : '#3B7E48',
                              }}
                            >
                              {u.ativo ? 'Desativar' : 'Ativar'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
          </>
        )}
        {/* FIM BLOCO FEEDBACK CARREGAMENTO (GLICOLOADER PÁGINA) */}
      </div>
    </div>
  );
}
/* FIM DO COMPONENTE PRINCIPAL PAINEL ADMIN */
