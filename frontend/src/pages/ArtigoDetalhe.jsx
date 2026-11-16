/* ==========================================================================
   ARQUIVO: ArtigoDetalhe.jsx
   PÁGINA: ArtigoDetalhe (Página de Leitura Completa — Artigo / Guia)
   OBJETIVO: Exibir a página de leitura completa dos artigos e guias da
   plataforma GlicoCare para famílias que lidam com o Diabetes Tipo 1 (DM1),
   priorizando uma experiência extremamente calma, acolhedora, espaçada (18px,
   line-height 1.7) e livre de poluição visual, com blocos ilustrativos,
   caixas "Respiro do Guardião", card de encerramento do Lufy e a seção
   interativa "Comentários e Acolhimento em Família" (com moderação RN-MOD-01).
   ========================================================================== */

import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { depoimentosService } from '../services/api';
import { analisarMensagemModerador } from '../utils/moderadorGlicoCare';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import { ARTIGOS_BIBLIOTECA } from './Home';
import lufyMascoteImg from '../assets/lufy-mascote.jpg';
import familiaCuidadoImg from '../assets/familia-cuidado.jpg';
import logoGlicoCareImg from '../assets/logo-glicocare.jpg';

/* INÍCIO DO CONTEÚDO ESTRUTURADO COMPLETO DOS 6 ARTIGOS / GUIAS */
const CONTEUDO_COMPLETO_ARTIGOS = {
  1: {
    indicadorTopo: '🐾 Com o Lufy • 6 min de leitura',
    subtituloIntrodutorio:
      'Respire fundo: ver o número baixar no leitor assusta no começo, mas ter um roteiro calmo e combinado em casa transforma a pressa em cuidado seguro.',
    paragrafosIniciais: [
      'A primeira vez que o alarme do sensor toca avisando uma queda glicêmica costuma acelerar o coração de qualquer mãe ou pai. É perfeitamente natural sentir um frio na barriga — afinal, você ama seu filho e quer protegê-lo a cada instante. Mas a boa notícia é que a hipoglicemia, quando conduzida com um plano claro, deixa de ser um momento de pânico e passa a ser apenas um passo técnico de cuidado.',
      'O segredo das famílias que conquistam serenidade não é nunca ter uma hipoglicemia, e sim saber exatamente o que fazer, sem correria e sem gritos, para que a criança se sinta segura e amparada durante todo o processo.',
    ],
    respiroVerde: {
      selo: '🐾 Respiro do Guardião • Verde Alívio',
      frase:
        '“Sua calma é o primeiro remédio que seu filho recebe. Antes de olhar o número no visor, olhe nos olhos dele e lembre: vocês sabem exatamente o que fazer juntos.”',
    },
    subtituloMeio: 'A Regra dos 15: simplicidade que protege',
    paragrafosMeio: [
      'Na rotina prática orientada pela equipe médica, o protocolo mais acolhedor é a famosa Regra dos 15: ao identificar a glicemia abaixo da meta combinada com seu endocrinologista, ofereça imediatamente o carboidrato simples de absorção rápida (como um sachê de glicose líquida, meio copo de suco natural ou a medida exata prescrita) e aguarde 15 minutos em repouso antes de fazer uma nova leitura.',
      'Esse tempo de espera de 15 minutos é fundamental. Muitas vezes, movidos pela ansiedade, os familiares oferecem mais comida antes de o açúcar inicial chegar ao sangue, o que acaba gerando uma hiperglicemia de rebote logo depois.',
    ],
    imagemSecundaria: {
      src: familiaCuidadoImg,
      legenda:
        'O momento de corrigir a glicemia pode e deve ser tranquilo: sentar junto à mesa, conversar baixo e aguardar os 15 minutos com afeto.',
    },
    respiroTerracota: {
      selo: '🌿 Respiro do Guardião • Apoio Emocional',
      frase:
        '“Com o Lufy, ensinamos as crianças a reconhecerem os sinais do próprio corpo sem vergonha de pedir ajuda — seja na sala de casa ou no pátio da escola.”',
    },
    paragrafosFinais: [
      'Depois que a glicemia retornar à faixa segura, verifique com calma se a próxima refeição está próxima ou se vale oferecer um pequeno lanche complementar conforme o plano alimentar da criança. Anote o episódio sem culpa: cada registro é um aprendizado valioso para a próxima consulta.',
    ],
    mensagemLufyFinal:
      'Ei, você mandou muito bem chegando até o final deste guia! Que tal deixar um kit de ação rápida sempre no mesmo cantinho da cozinha e outro na mochila? Pequenos combinados trazem uma paz imensa para toda a casa.',
  },
  2: {
    indicadorTopo: '🏫 Rotina Escolar • 6 min de leitura',
    subtituloIntrodutorio:
      'A escola é o segundo lar do seu filho. Veja como construir uma ponte de empatia, clareza e confiança com professores e coordenadores desde o primeiro dia.',
    paragrafosIniciais: [
      'Deixar um filho com Diabetes Tipo 1 no portão da escola pela primeira vez após o diagnóstico é um dos maiores atos de coragem de uma família. Surge o medo de que os professores não saibam agir ou de que a criança se sinta diferente dos colegas na hora do lanche.',
      'A experiência pedagógica mostra que a insegurança da escola quase sempre vem do desconhecido — e não da falta de vontade de ajudar. Quando substituímos termos médicos assustadores por orientações visuais e humanas, a equipe escolar se torna nossa maior aliada.',
    ],
    respiroVerde: {
      selo: '🐾 Respiro do Guardião • Verde Alívio',
      frase:
        '“Educar a escola não é entregar um manual hospitalar; é apresentar quem seu filho é, seus sonhos e como pequenos gestos garantem que ele brinque e aprenda em segurança.”',
    },
    subtituloMeio: 'O que levar na primeira conversa com a coordenação',
    paragrafosMeio: [
      'Agende uma reunião tranquila de 20 minutos antes do início das aulas. Leve uma cartinha afetuosa de uma página com a foto da criança, explicando de forma simples o que é o sensor no bracinho (que lê a glicose sem picadas) e quando a família deve ser avisada.',
      'Entregue também a "Caixa Porto Seguro" da sala de aula: um estojo identificado contendo sachês de glicose ou suco já porcionados para correção rápida, além de um cartão plastificado com três passos claros para hipoglicemia.',
    ],
    imagemSecundaria: {
      src: lufyMascoteImg,
      legenda:
        'O coala Lufy também usa seu sensor no bracinho com orgulho, ajudando a explicar para os coleguinhas de turma que tecnologia é sinônimo de cuidado e autonomia.',
    },
    respiroTerracota: {
      selo: '🌿 Respiro do Guardião • Apoio Emocional',
      frase:
        '“Quando a professora entende que não está sozinha e tem um roteiro simples em mãos, o medo dá lugar ao acolhimento em toda a sala de aula.”',
    },
    paragrafosFinais: [
      'Lembre-se de agradecer cada gesto de parceria da equipe pedagógica. Uma relação construída com escuta, gentileza e instruções claras faz com que seu filho viva a escola em sua plenitude.',
    ],
    mensagemLufyFinal:
      'Eu adoro ir para a escola! Quando os adultos conversam com calma e combinam tudo direitinho, a hora do recreio fica leve e cheia de brincadeiras seguras.',
  },
  3: {
    indicadorTopo: '💡 Tecnologia & Autonomia • 5 min de leitura',
    subtituloIntrodutorio:
      'Sensores contínuos vieram para libertar a infância — e não para prender a família a cada atualização de tela. Descubra como construir uma relação saudável com os dados.',
    paragrafosIniciais: [
      'Quem convive com o Diabetes Tipo 1 sabe a bênção que os sensores de monitoramento contínuo representam: menos picadas nos dedinhos, gráficos claros e setas de tendência que ajudam a antecipar decisões com muito mais segurança.',
      'No entanto, ter acesso à glicemia 24 horas por dia também pode gerar uma armadilha silenciosa para pais e mães: a hipervigilância. Olhar o aplicativo a cada cinco minutos aumenta a exaustão mental e transmite tensão para a criança.',
    ],
    respiroVerde: {
      selo: '🐾 Respiro do Guardião • Verde Alívio',
      frase:
        '“A tecnologia foi criada para devolver a paz ao seu dia. As setas de tendência são bússolas de apoio, nunca um julgamento sobre o seu cuidado.”',
    },
    subtituloMeio: 'Envolvendo a criança passo a passo',
    paragrafosMeio: [
      'A verdadeira autonomia nasce aos poucos. Para crianças pequenas, o sensor pode ser apresentado de forma lúdica — exatamente como o sensor que o Lufy usa no bracinho. Conforme crescem, vale ensinar o significado das setas de forma serena: "Olha, a setinha está reta, nosso barquinho está navegando em águas calmas!".',
      'Evite reagir com expressões de susto ou frustração diante do visor. Quando a criança percebe que qualquer número é recebido com equilíbrio pelos pais, ela desenvolve confiança para participar do próprio cuidado na adolescência.',
    ],
    imagemSecundaria: {
      src: familiaCuidadoImg,
      legenda:
        'Olhar os dados juntos, com um sorriso tranquilo e sem cobranças, ensina que o monitoramento faz parte de uma rotina leve.',
    },
    respiroTerracota: {
      selo: '🌿 Respiro do Guardião • Apoio Emocional',
      frase:
        '“Autonomia não é deixar fazer sozinho antes da hora; é caminhar ao lado até que a segurança floresça naturalmente.”',
    },
    paragrafosFinais: [
      'Combine horários de checagem e ajuste os alarmes junto ao seu médico para que toquem quando uma ação real for necessária. Seu descanso também faz parte do tratamento da família.',
    ],
    mensagemLufyFinal:
      'Meu sensorzinho no braço é meu melhor amigo de aventuras! Ele me avisa quando preciso parar um pouquinho para lanchar e continuar brincando com energia.',
  },
  4: {
    indicadorTopo: '🐾 Com o Lufy • 6 min de leitura',
    subtituloIntrodutorio:
      'Como preservar a leveza da infância, o brilho nos olhos e os diálogos em família para que o cuidado com o DM1 caminhe junto com a vida — sem ocupar todo o espaço.',
    paragrafosIniciais: [
      'Nos primeiros meses após o diagnóstico, é comum que quase todas as conversas da casa girem em torno de contagem de carboidratos, doses de insulina e leituras do sensor. Esse foco inicial faz parte da curva de aprendizado, mas aos poucos precisamos abrir espaço novamente para tudo aquilo que faz seu filho único.',
      'Uma criança que vive com Diabetes Tipo 1 continua sendo, antes de qualquer condição, uma criança cheia de imaginação, gostos musicais, piadas favoritas e sonhos para o futuro.',
    ],
    respiroVerde: {
      selo: '🐾 Respiro do Guardião • Verde Alívio',
      frase:
        '“Ao receber seu filho da escola, pergunte primeiro qual foi a brincadeira mais divertida do dia — e só depois pergunte como esteve a glicemia.”',
    },
    subtituloMeio: 'Pequenos rituais que protegem a autoestima',
    paragrafosMeio: [
      'Quando perguntamos primeiro sobre a pessoa e depois sobre o diabetes, enviamos uma mensagem poderosa ao coração da criança: "Eu vejo você inteiro, e você é muito maior do que qualquer rotina de saúde".',
      'Crie momentos em família totalmente livres do tema clínico — uma sessão de cinema no sofá, uma pintura ou um passeio no parque onde o cuidado acontece de forma discreta e natural nos bastidores.',
    ],
    imagemSecundaria: {
      src: lufyMascoteImg,
      legenda:
        'A infância pede espaço para sonhar, brincar e descobrir o mundo com acolhimento em cada etapa.',
    },
    respiroTerracota: {
      selo: '🌿 Respiro do Guardião • Apoio Emocional',
      frase:
        '“O cuidado sustenta a vida, mas é o afeto, o riso e a presença que dão sentido a cada dia em família.”',
    },
    paragrafosFinais: [
      'Sempre que sentir que o cansaço está deixando o clima pesado, faça uma pausa. Respire, abrace seu filho demoradamente e lembre-se do quanto vocês já avançaram desde o primeiro dia.',
    ],
    mensagemLufyFinal:
      'Sabia que minha parte favorita do dia é ouvir histórias antes de dormir? Cuidar da saúde é superimportante, mas dar boas risadas em família deixa tudo mais docinho e seguro!',
  },
  5: {
    indicadorTopo: '🏫 Rotina Escolar • 5 min de leitura',
    subtituloIntrodutorio:
      'Um checklist prático, sereno e descomplicado para organizar a mochila na noite anterior e garantir manhãs tranquilas para toda a família.',
    paragrafosIniciais: [
      'Manhãs de dias letivos já costumam ser movimentadas em qualquer casa. Para famílias que convivem com o DM1, deixar para separar insumos e lanches nos últimos minutos antes de sair pode gerar esquecimentos e estresse desnecessário.',
      'Transformar a preparação da mochila em um pequeno ritual tranquilo na noite anterior — de preferência junto com a criança — traz previsibilidade e reduz a carga mental materna e paterna.',
    ],
    respiroVerde: {
      selo: '🐾 Respiro do Guardião • Verde Alívio',
      frase:
        '“Organização não é rigidez; é um gesto de carinho com o seu "eu" de amanhã cedo e com a tranquilidade do seu filho na escola.”',
    },
    subtituloMeio: 'Os 4 itens essenciais da Mochila Segura',
    paragrafosMeio: [
      '1. Kit de Ação Rápida (Hipoglicemia): 2 a 3 porções medidas de carboidrato rápido (sachês de glicose líquida, jujubas contadas ou caixinha de suco) dentro de uma nécessaire fácil de abrir.',
      '2. Lanche com Carboidratos Identificados: Etiquete o potinho da lancheira com um bilhete carinhoso informando a quantidade de carboidratos para facilitar a conferência na hora do recreio.',
      '3. Leitor ou Celular Carregado + Glicosímetro Reserva: Deixe o cabo carregador perto da mochila e mantenha tiras reservas para qualquer imprevisto técnico.',
      '4. Cartão do Guardião: Um cartão plastificado com os telefones dos pais, nome do médico e o passo a passo resumido de emergência.',
    ],
    imagemSecundaria: {
      src: familiaCuidadoImg,
      legenda:
        'Preparar o dia seguinte em família cria senso de parceria e mostra que o cuidado pode ser organizado sem pressa.',
    },
    respiroTerracota: {
      selo: '🌿 Respiro do Guardião • Apoio Emocional',
      frase:
        '“Cada item colocado na mochila com calma é um abraço de segurança que acompanha seu filho durante toda a aula.”',
    },
    paragrafosFinais: [
      'Uma vez por semana, às sextas-feiras ou domingos, revise a validade e reponha os sachês utilizados. Assim, a segunda-feira começa sempre em paz.',
    ],
    mensagemLufyFinal:
      'Mochila pronta, coração tranquilo! Eu sempre guardo meu sachê de energia no bolsinho da frente para encontrar rapidinho quando preciso.',
  },
  6: {
    indicadorTopo: '💡 Tecnologia & Autonomia • 6 min de leitura',
    subtituloIntrodutorio:
      ' Mais de 40 fatores influenciam a glicemia além da comida e da insulina. Aprenda a substituir a cobrança por uma leitura gentil e construtiva dos números.',
    paragrafosIniciais: [
      'Quantas vezes você já olhou para um número alto no leitor e se perguntou imediatamente: "O que eu fiz de errado hoje?". Essa culpa silenciosa é um dos pesos mais injustos que mães, pais e pessoas com Diabetes Tipo 1 carregam.',
      'A ciência mostra que mais de 40 variáveis biológicas — como fase de crescimento, qualidade do sono, emoções, calor, resfriados e até a adrenalina de uma brincadeira — alteram a glicemia no dia a dia.',
    ],
    respiroVerde: {
      selo: '🐾 Respiro do Guardião • Verde Alívio',
      frase:
        '“Um número no visor do sensor é apenas uma informação para o próximo passo — nunca uma nota sobre o seu amor ou a sua dedicação.”',
    },
    subtituloMeio: 'Trocando o julgamento pela pergunta certa',
    paragrafosMeio: [
      'Na pedagogia do cuidado GlicoCare, propomos uma mudança simples de vocabulário dentro de casa: evite chamar a glicemia de "boa" ou "ruim". Quando dizemos que um número foi "ruim", a criança sente que ela mesma falhou.',
      'Experimente substituir "Por que subiu desse jeito?" por "O que esse número nos pede agora?". Essa pequena virada retira o peso emocional do momento e foca toda a família na solução prática: hidratar, corrigir conforme orientação médica e seguir o dia.',
    ],
    imagemSecundaria: {
      src: lufyMascoteImg,
      legenda:
        'Com acolhimento e informação clara, cada leitura se transforma em aprendizado gentil para toda a família.',
    },
    respiroTerracota: {
      selo: '🌿 Respiro do Guardião • Apoio Emocional',
      frase:
        '“Dias fora da meta também acontecem nas famílias mais dedicadas do mundo. Seja tão gentil com você mesmo quanto você é com seu filho.”',
    },
    paragrafosFinais: [
      'Sempre que um dia parecer mais desafiador, lembre-se de que a jornada do DM1 é uma maratona feita de constância e afeto, e não uma prova de perfeição.',
    ],
    mensagemLufyFinal:
      'Números sobem e descem como ondas no mar, mas o amor da sua família é o farol firme que mantém tudo seguro. Respire fundo, você está fazendo um trabalho lindo!',
  },
};

/* Comentários anteriores aprovados de outras mães e famílias (RN-MOD-01) */
const COMENTARIOS_FAMILIAS_APROVADOS = [
  {
    id: 201,
    nome: 'Mariana Souza (mãe do Theo, 6 anos)',
    cidade: 'Campinas, SP',
    tempo: 'Há 2 dias',
    mensagem:
      'Ler este guia tirou um peso enorme do meu peito! No começo eu chorava toda vez que o alarme tocava à noite. Hoje seguimos a Regra dos 15 com calma, conversando baixinho com o Theo, e tudo passa muito mais rápido e sem susto.',
  },
  {
    id: 202,
    nome: 'Patrícia & Eduardo (pais da Helena, 8 anos)',
    cidade: 'Belo Horizonte, MG',
    tempo: 'Há 5 dias',
    mensagem:
      'Imprimimos as dicas da GlicoCare para levar na reunião da escola da Helena. A professora ficou tão emocionada e segura com o passo a passo que montou um cantinho especial do Lufy na sala de aula!',
  },
  {
    id: 203,
    nome: 'Cláudia Albuquerque (mãe do Davi, 10 anos)',
    cidade: 'Curitiba, PR',
    tempo: 'Há 1 semana',
    mensagem:
      'A caixa "Respiro do Guardião" me fez respirar fundo aqui em casa. Parar de tratar o número do sensor como um boletim de notas mudou completamente a autoestima do meu filho. Gratidão por este porto seguro!',
  },
];
/* FIM DO CONTEÚDO ESTRUTURADO COMPLETO DOS ARTIGOS */

/* INÍCIO DA PÁGINA ARTIGO DETALHE (LEITURA COMPLETA) */
export default function ArtigoDetalhe() {
  // Captura o ID do artigo na URL (/artigo/:id)
  const { id } = useParams();
  const idNumerico = Number(id) || 1;

  // Localiza os metadados básicos na lista da Biblioteca e o conteúdo detalhado
  const artigo =
    ARTIGOS_BIBLIOTECA.find((a) => a.id === idNumerico) || ARTIGOS_BIBLIOTECA[0];
  const conteudo =
    CONTEUDO_COMPLETO_ARTIGOS[idNumerico] || CONTEUDO_COMPLETO_ARTIGOS[1];

  // Estados do formulário "Comentários e Acolhimento em Família" (Nome, Cidade e Mensagem)
  const [nome, setNome] = useState('');
  const [cidade, setCidade] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [parecerModeracao, setParecerModeracao] = useState(null);

  // Envia o comentário para análise crítica do Moderador Oficial e fila (RN-MOD-01)
  const handleEnviarComentarioFamilia = async (e) => {
    e.preventDefault();
    if (!nome.trim() || !cidade.trim() || !mensagem.trim()) return;

    // Executa a análise crítica de Tom, Empatia e Segurança Emocional/Clínica
    const resultadoModerador = analisarMensagemModerador(mensagem);
    setParecerModeracao(resultadoModerador);

    if (!resultadoModerador.aprovada) {
      return;
    }

    const autorFormatado = `${nome.trim()} — ${cidade.trim()}`;

    try {
      await depoimentosService.enviarParaModeracao({
        artigo_id: artigo.id,
        nome_autor: autorFormatado,
        conteudo: mensagem.trim(),
      });
    } catch {
      // Fallback demonstrativo local caso o servidor PHP não esteja ativo na porta 8000
    }

    setNome('');
    setCidade('');
    setMensagem('');
  };

  return (
    <div className="pagina-leitura-container">
      {/* ====================================================================
          INÍCIO DA SUPERFÍCIE DE LEITURA DO ARTIGO (#F6F3EE)
          ==================================================================== */}
      <article className="artigo-superficie-leitura">
        {/* 1. TOPO DO ARTIGO: Categoria / Indicador de tempo + Título + Subtítulo */}
        <header>
          <div className="artigo-indicador-topo">
            <span>{conteudo.indicadorTopo}</span>
          </div>

          <h1 className="artigo-titulo-principal">{artigo.titulo}</h1>

          <p className="artigo-subtitulo-acolhedor">
            {conteudo.subtituloIntrodutorio}
          </p>
        </header>

        {/* 2. CORPO DO TEXTO (LEITURA FLUIDA 18PX COM LINE-HEIGHT 1.7) */}
        <div className="artigo-corpo-fluido">
          {/* Bloco de Imagem Principal com border-radius 12px e legenda em itálico */}
          <figure className="artigo-bloco-imagem" style={{ marginTop: 0 }}>
            <img
              src={artigo.imagemCapa || lufyMascoteImg}
              alt={artigo.titulo}
            />
            <figcaption>
              Ilustração GlicoCare: informação clara e acolhimento caminham
              juntos para transformar a rotina familiar em um porto seguro.
            </figcaption>
          </figure>

          {/* Parágrafos iniciais bem espaçados */}
          {conteudo.paragrafosIniciais.map((paragrafo, index) => (
            <p key={`ini-${index}`}>{paragrafo}</p>
          ))}

          {/* Caixa de Destaque 1: "Respiro do Guardião" (Barra lateral Verde Alívio #3B7E48) */}
          <aside
            className="respiro-do-guardiao"
            aria-label="Respiro do Guardião — Apoio Emocional"
          >
            <div className="respiro-guardiao-selo">
              {conteudo.respiroVerde.selo}
            </div>
            <p className="respiro-guardiao-texto">
              {conteudo.respiroVerde.frase}
            </p>
          </aside>

          {/* Subtítulo intermediário em Fraunces e parágrafos práticos */}
          <h2>{conteudo.subtituloMeio}</h2>

          {conteudo.paragrafosMeio.map((paragrafo, index) => (
            <p key={`meio-${index}`}>{paragrafo}</p>
          ))}

          {/* Segundo Bloco de Imagem Ilustrativa com cantos 12px e legenda sutil em itálico */}
          <figure className="artigo-bloco-imagem">
            <img
              src={conteudo.imagemSecundaria.src}
              alt={conteudo.imagemSecundaria.legenda}
            />
            <figcaption>{conteudo.imagemSecundaria.legenda}</figcaption>
          </figure>

          {/* Caixa de Destaque 2: "Respiro do Guardião" (Barra lateral Terracota #7C533F) */}
          <aside
            className="respiro-do-guardiao variante-terracota"
            aria-label="Respiro do Guardião — Reflexão em Família"
          >
            <div className="respiro-guardiao-selo">
              {conteudo.respiroTerracota.selo}
            </div>
            <p className="respiro-guardiao-texto">
              {conteudo.respiroTerracota.frase}
            </p>
          </aside>

          {/* Parágrafos finais de fechamento */}
          {conteudo.paragrafosFinais.map((paragrafo, index) => (
            <p key={`fim-${index}`}>{paragrafo}</p>
          ))}
        </div>

        {/* 3. FINAL DO ARTIGO: CARD DE ENCERRAMENTO ACOLHEDOR DO MASCOTE LUFY */}
        <div className="artigo-card-encerramento-lufy">
          <img
            src={logoGlicoCareImg}
            alt="Mascote Lufy — Guardião GlicoCare"
            className="artigo-card-encerramento-avatar"
          />
          <div>
            <span
              style={{
                display: 'inline-block',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--cor-cta)',
                marginBottom: '0.35rem',
              }}
            >
              🐾 Mensagem de Encerramento do Lufy
            </span>
            <h3
              style={{
                fontFamily: 'var(--fonte-titulo)',
                fontSize: '1.28rem',
                color: 'var(--cor-texto)',
                marginBottom: '0.45rem',
              }}
            >
              Você não precisa dar conta de tudo sozinho hoje.
            </h3>
            <p
              style={{
                fontSize: '0.98rem',
                lineHeight: 1.6,
                color: 'var(--cor-texto-suave)',
                marginBottom: '0.85rem',
              }}
            >
              {conteudo.mensagemLufyFinal}
            </p>
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
              <Link
                to="/biblioteca"
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: 'var(--cor-primaria)',
                }}
              >
                ← Explorar outros guias da biblioteca
              </Link>
              <Link
                to="/especialistas"
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: 'var(--cor-cta)',
                }}
              >
                Conhecer especialistas parceiros ↗
              </Link>
            </div>
          </div>
        </div>
      </article>
      {/* FIM DA SUPERFÍCIE DE LEITURA DO ARTIGO */}

      {/* ====================================================================
          INÍCIO DA SEÇÃO INTERATIVA: "COMENTÁRIOS E ACOLHIMENTO EM FAMÍLIA"
          ==================================================================== */}
      <section
        className="artigo-secao-comentarios"
        aria-labelledby="titulo-comentarios-familia"
      >
        <div className="section-line-eyebrow">ESPAÇO DE CONEXÃO E APOIO MÚTUO</div>
        <h2
          id="titulo-comentarios-familia"
          style={{
            fontFamily: 'var(--fonte-titulo)',
            fontSize: 'clamp(1.65rem, 2.8vw, 2.15rem)',
            color: 'var(--cor-texto)',
            marginBottom: '0.55rem',
          }}
        >
          Comentários e Acolhimento{' '}
          <span className="texto-italico-terracota">em Família</span>
        </h2>
        <p
          style={{
            fontSize: '0.98rem',
            color: 'var(--cor-texto-suave)',
            lineHeight: 1.6,
            marginBottom: '2rem',
          }}
        >
          Este é um espaço seguro para compartilhar vivências reais, dúvidas e
          palavras de carinho com outras mães, pais e familiares. Para manter a
          serenidade da nossa comunidade, todas as mensagens passam por curadoria
          gentil antes da publicação (RN-MOD-01).
        </p>

        {/* FORMULÁRIO LIMPO PARA ENVIO DE MENSAGENS/DEPOIMENTOS (Nome, Cidade e Mensagem) */}
        <form
          onSubmit={handleEnviarComentarioFamilia}
          style={{
            backgroundColor: 'var(--cor-fundo)', // Bege neutro suave #EAE4D9
            padding: '1.85rem 2rem',
            borderRadius: '18px',
            border: '1px solid var(--cor-borda)',
            marginBottom: '2.5rem',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--fonte-titulo)',
              fontSize: '1.25rem',
              color: 'var(--cor-primaria)', // Terracota Executivo #7C533F
              marginBottom: '0.35rem',
            }}
          >
            Deixe sua mensagem de acolhimento
          </h3>
          <p
            style={{
              fontSize: '0.88rem',
              color: 'var(--cor-texto-suave)',
              marginBottom: '1.35rem',
            }}
          >
            Sua história pode ser o abraço que outra família precisa ler hoje.
          </p>

          {/* Parecer do Moderador Oficial ([APROVADA] ou [REJEITADA]) */}
          {parecerModeracao && (
            <div
              style={{
                backgroundColor: parecerModeracao.aprovada
                  ? 'var(--cor-cta-suave)'
                  : '#F9E6E3',
                color: parecerModeracao.aprovada ? 'var(--cor-cta)' : '#9E3328',
                border: `1px solid ${
                  parecerModeracao.aprovada ? 'var(--cor-cta)' : '#C86D63'
                }`,
                padding: '1rem 1.25rem',
                borderRadius: '12px',
                marginBottom: '1.25rem',
                fontSize: '0.92rem',
                fontWeight: 600,
              }}
            >
              {parecerModeracao.saidaFormatada}
            </div>
          )}

          {/* Grade com Nome e Cidade lado a lado no Desktop */}
          <div
            className="form-grid-nome-cidade"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}
          >
            <FormInput
              name="nome"
              label="Seu Nome (e parentesco)"
              placeholder="Ex: Fernanda, mãe do Bento (7 anos)"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              obrigatorio
            />

            <FormInput
              name="cidade"
              label="Sua Cidade / Estado"
              placeholder="Ex: São Paulo, SP"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              obrigatorio
            />
          </div>

          <FormInput
            name="mensagem"
            tipo="textarea"
            label="Sua Mensagem ou Depoimento"
            placeholder="Escreva aqui como este conteúdo ajudou sua rotina ou deixe uma palavra de apoio para outras famílias..."
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            obrigatorio
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginTop: '0.5rem',
            }}
          >
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--cor-texto-suave)',
              }}
            >
              🔒 Ambiente protegido pela curadoria GlicoCare
            </span>

            {/* Botão de envio em Verde Alívio (#3B7E48) */}
            <Button type="submit" variante="primario">
              Enviar mensagem de acolhimento →
            </Button>
          </div>
        </form>

        {/* LISTA DE COMENTÁRIOS ANTERIORES DE OUTRAS MÃES E FAMÍLIAS */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--fonte-titulo)',
                fontSize: '1.3rem',
                color: 'var(--cor-texto)',
              }}
            >
              Vozes que já passaram por aqui ({COMENTARIOS_FAMILIAS_APROVADOS.length})
            </h3>
            <span className="gc-badge">
              ✓ Relatos verificados pela equipe GlicoCare
            </span>
          </div>

          <div style={{ display: 'grid', gap: '1.15rem' }}>
            {COMENTARIOS_FAMILIAS_APROVADOS.map((comentario) => (
              <div key={comentario.id} className="comentario-familia-card">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginBottom: '0.6rem',
                  }}
                >
                  <div>
                    <strong
                      style={{
                        color: 'var(--cor-texto)',
                        fontSize: '0.96rem',
                      }}
                    >
                      {comentario.nome}
                    </strong>
                    <span
                      style={{
                        fontSize: '0.84rem',
                        color: 'var(--cor-primaria)',
                        fontWeight: 600,
                        marginLeft: '0.5rem',
                      }}
                    >
                      • 📍 {comentario.cidade}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--cor-texto-suave)',
                    }}
                  >
                    {comentario.tempo}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: '0.96rem',
                    lineHeight: 1.65,
                    color: 'var(--cor-texto)',
                    marginBottom: '0.55rem',
                  }}
                >
                  “{comentario.mensagem}”
                </p>

                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--cor-cta)',
                  }}
                >
                  ✓ Aprovado pela curadoria acolhedora GlicoCare
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* FIM DA SEÇÃO INTERATIVA: "COMENTÁRIOS E ACOLHIMENTO EM FAMÍLIA" */}
    </div>
  );
}
/* FIM DA PÁGINA ARTIGO DETALHE */
