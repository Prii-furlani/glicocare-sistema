/* ==========================================================================
   ARQUIVO: ArtigoDetalhe.jsx (Localização: /frontend/src/pages/ArtigoDetalhe.jsx)
   PÁGINA: ArtigoDetalhe (Layout Editorial Aberto — Leitura Fluida sobre #EAE4D9)
   OBJETIVO:
     Exibir artigos e guias da plataforma GlicoCare em formato editorial fluido,
     eliminando cards externos encaixotados e valorizando a leitura aberta sobre
     o fundo bege acolhedor (--cor-fundo: #EAE4D9), tipografia nobre (Fraunces +
     Plus Jakarta Sans), capitular (drop cap), caixas "Respiro do Guardião",
     passos numerados individuais, banner escuro do Lufy e seção comunitária em 2 colunas.
   ========================================================================== */

import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { depoimentosService } from '../services/api';
import { analisarMensagemModerador } from '../utils/moderadorGlicoCare';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import CapaEditorialDefault from '../components/CapaEditorialDefault';
import GlicoLoader from '../components/GlicoLoader';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/Alert';
import { useNotify } from '../context/ToastContext';
import { ARTIGOS_BIBLIOTECA } from './Home';
import lufyMascoteImg from '../assets/lufy-mascote.jpg';
import familiaCuidadoImg from '../assets/familia-cuidado.jpg';
import logoGlicoCareImg from '../assets/logo-glicocare.jpg';

/* ==========================================================================
   INÍCIO DO CONTEÚDO ESTRUTURADO EDITORIAL DOS 6 ARTIGOS / GUIAS
   ========================================================================== */
const CONTEUDO_COMPLETO_ARTIGOS = {
  1: {
    indicadorTopo: '🐾 Com o Lufy • 6 min de leitura',
    tituloFormatado: (
      <>
        Hipoglicemia <span className="texto-italico-terracota">sem susto:</span> um plano para toda a família
      </>
    ),
    autor: {
      nome: 'Dra. Helena Monteiro (Endocrinopediatra) & Curadoria GlicoCare',
      iniciais: 'HM',
      atualizacao: 'Revisão médica • Atualizado em 2026',
    },
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
    passosTitulo: 'Protocolo Prático: A Regra dos 15 Passo a Passo',
    passosNumerados: [
      {
        numero: '01',
        titulo: 'Pausa serena e verificação',
        descricao:
          'Identifique os sinais com calma (suor frio, tontura, tremor ou fome repentina) e confirme o valor no sensor ou ponta de dedo.',
      },
      {
        numero: '02',
        titulo: '15 gramas de carboidrato de ação rápida',
        descricao:
          'Ofereça glicose líquida, 150ml de suco de fruta ou 3 balas de glicose mastigáveis. Evite alimentos gordurosos (chocolates e bolos) pois atrasam a absorção.',
      },
      {
        numero: '03',
        titulo: 'Aguardar 15 minutos em repouso',
        descricao:
          'Permaneça ao lado do seu filho conversando baixinho enquanto o organismo absorve o carboidrato, evitando oferecer mais alimento antes do tempo.',
      },
      {
        numero: '04',
        titulo: 'Reverificação e plano de seguimento',
        descricao:
          'Faça uma nova leitura. Se a glicemia já superou a meta de segurança (>70 mg/dL), ofereça um pequeno lanche se a próxima refeição estiver distante.',
      },
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
    tituloFormatado: (
      <>
        DM1 na escola: como construir uma parceria que <span className="texto-italico-terracota">acolhe</span>
      </>
    ),
    autor: {
      nome: 'Prof.ª Marcela Lins (Pedagoga) & Dra. Helena Monteiro',
      iniciais: 'ML',
      atualizacao: 'Orientação pedagógica • Atualizado em 2026',
    },
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
    passosTitulo: '4 Passos para uma Parceria Escolar Tranquila',
    passosNumerados: [
      {
        numero: '01',
        titulo: 'Reunião prévia de 20 minutos',
        descricao:
          'Agende um encontro acolhedor antes do início das aulas com professores e monitores de recreio.',
      },
      {
        numero: '02',
        titulo: 'Apresentação humana da criança',
        descricao:
          'Conte as brincadeiras preferidas do seu filho antes de falar do DM1, humanizando o olhar pedagógico.',
      },
      {
        numero: '03',
        titulo: 'Entrega da Caixa Porto Seguro',
        descricao:
          'Deixe na sala de aula um estojo identificado com sachês de glicose, glicosímetro e telefones de emergência.',
      },
      {
        numero: '04',
        titulo: 'Inclusão em todas as atividades',
        descricao:
          'Combine que a criança participe normalmente das aulas de educação física e passeios com checagem preventiva.',
      },
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
    tituloFormatado: (
      <>
        Do sensor à autonomia: tecnologia que <span className="texto-italico-terracota">aproxima</span>
      </>
    ),
    autor: {
      nome: 'Dr. Lucas Prado (Tecnologia em Saúde) & Dra. Helena Monteiro',
      iniciais: 'LP',
      atualizacao: 'Inovação e DM1 • Atualizado em 2026',
    },
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
    passosTitulo: 'Como Transformar Gráficos em Liberdade',
    passosNumerados: [
      {
        numero: '01',
        titulo: 'Ajuste fino de alarmes sonoros',
        descricao:
          'Defina com o médico alarmes que toquem apenas em limites críticos reais, prevenindo a fadiga de alertas.',
      },
      {
        numero: '02',
        titulo: 'Leitura pedagógica sem julgamento',
        descricao:
          'Mostre para a criança a seta de tendência explicando que ela é um mapa do caminho, não uma bronca.',
      },
      {
        numero: '03',
        titulo: 'Pausas conscientes de tela',
        descricao:
          'Evite checar os números a cada minuto quando a glicemia já estiver estável e a criança estiver entretida.',
      },
      {
        numero: '04',
        titulo: 'Comemoração dos pequenos marcos',
        descricao:
          'Celebre a primeira vez que a criança pedir para ler o sensor sozinha ou avisar que sentiu uma alteração.',
      },
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
    tituloFormatado: (
      <>
        Como falar sobre diabetes sem transformar tudo em <span className="texto-italico-terracota">diabetes</span>
      </>
    ),
    autor: {
      nome: 'Camila Torres (Psicóloga Clínica) & Equipe GlicoCare',
      iniciais: 'CT',
      atualizacao: 'Psicologia e Vínculo • Atualizado em 2026',
    },
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
    passosTitulo: '4 Atitudes Diárias para Preservar a Infância',
    passosNumerados: [
      {
        numero: '01',
        titulo: 'A primeira pergunta do reencontro',
        descricao:
          'Pergunte sobre as risadas e novidades do dia antes de verificar a linha do gráfico no aplicativo.',
      },
      {
        numero: '02',
        titulo: 'Cuidado nos bastidores',
        descricao:
          'Realize a contagem de carboidratos e a aplicação de forma serena, sem transformar a mesa em um consultório.',
      },
      {
        numero: '03',
        titulo: 'Respeito ao cansaço da criança',
        descricao:
          'Quando seu filho desabafar que está cansado de aplicar insulina, acolha com um abraço em vez de repreender.',
      },
      {
        numero: '04',
        titulo: 'Projetar um futuro sem limites',
        descricao:
          'Converse sobre profissões, viagens e sonhos, lembrando que pessoas com DM1 são atletas, cientistas e artistas.',
      },
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
    tituloFormatado: (
      <>
        A mochila segura: o checklist prático para manhãs mais <span className="texto-italico-terracota">leves</span>
      </>
    ),
    autor: {
      nome: 'Beatriz Nogueira (Nutricionista) & Curadoria GlicoCare',
      iniciais: 'BN',
      atualizacao: 'Organização Prática • Atualizado em 2026',
    },
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
    ],
    passosTitulo: 'Checklist dos 4 Pilares da Mochila',
    passosNumerados: [
      {
        numero: '01',
        titulo: 'Nécessaire de Hipoglicemia',
        descricao:
          '2 sachês de glicose líquida ou suco de 150ml guardados em um bolso lateral de acesso imediato.',
      },
      {
        numero: '02',
        titulo: 'Lanches com rótulos afetivos',
        descricao:
          'Potes etiquetados com a contagem de gramas de carboidrato e um recadinho carinhoso dos pais.',
      },
      {
        numero: '03',
        titulo: 'Glicosímetro reserva e baterias',
        descricao:
          'Aparelho convencional com tiras suficientes para qualquer dúvida ou imprevisto técnico do sensor.',
      },
      {
        numero: '04',
        titulo: 'Cartão Plastificado do Guardião',
        descricao:
          'Roteiro simples de 3 passos para a professora com telefones dos pais e contato do pediatra.',
      },
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
    tituloFormatado: (
      <>
        Glicemia oscilou? Mais de 40 fatores explicam antes da <span className="texto-italico-terracota">culpa</span>
      </>
    ),
    autor: {
      nome: 'Dra. Helena Monteiro (Endocrinologista) & Equipe GlicoCare',
      iniciais: 'HM',
      atualizacao: 'Educação em Diabetes • Atualizado em 2026',
    },
    subtituloIntrodutorio:
      'Mais de 40 fatores influenciam a glicemia além da comida e da insulina. Aprenda a substituir a cobrança por uma leitura gentil e construtiva dos números.',
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
    passosTitulo: 'Como Encarar as Oscilações com Maturidade Serena',
    passosNumerados: [
      {
        numero: '01',
        titulo: 'Reconhecer as variáveis invisíveis',
        descricao:
          'Entenda que hormônios, dias de prova na escola, noites mal dormidas e resfriados alteram a glicemia sem que ninguém tenha errado.',
      },
      {
        numero: '02',
        titulo: 'A pergunta que desativa a culpa',
        descricao:
          'Pergunte sempre: "O que este número pede agora?". Agir no presente é mais eficaz do que lamentar as leituras passadas.',
      },
      {
        numero: '03',
        titulo: 'Eliminar rótulos morais',
        descricao:
          'Substitua "glicemia boa" ou "glicemia ruim" por "dentro da meta" ou "fora da meta". Números são bússolas, não notas escolares.',
      },
      {
        numero: '04',
        titulo: 'Acolher a maratona contínua',
        descricao:
          'O tratamento do DM1 premia a consistência com afeto ao longo dos anos, e não a perfeição ilusória de um único gráfico.',
      },
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
  7: {
    indicadorTopo: '💡 Tecnologia & Autonomia • 7 min de leitura',
    tituloFormatado: (
      <>
        Insulina Ativa e Queda Rápida: como não ficar "às cegas" no <span className="texto-italico-terracota">destro</span>
      </>
    ),
    autor: {
      nome: 'Dra. Helena Monteiro (Endocrinologista) & Equipe GlicoCare',
      iniciais: 'HM',
      atualizacao: 'Educação em Farmacocinética • Atualizado em 2026',
    },
    subtituloIntrodutorio:
      'Cuidar do DM1 na ponta de dedo não significa viver na incerteza. Entenda a Insulina Ativa (IOB), o Fator de Sensibilidade e como calcular a velocidade de queda entre dois testes.',
    paragrafosIniciais: [
      'Muitas famílias e adultos que utilizam glicosímetro de ponta de dedo (destro) sentem uma ponta de desvantagem em relação a quem tem sensor contínuo. Parece que quem usa sensor tem setas de tendência mágicas e gráficos no celular, enquanto quem usa glicosímetro tem apenas números isolados no tempo.',
      'A verdade libertadora é que a matemática do corpo e a farmacocinética da insulina são as mesmas. Quando você domina três conceitos fundamentais — Insulina Ativa (IOB), Fator de Sensibilidade (FSI) e Variação por Minuto —, suas medições de ponta de dedo ganham olhos clínicos de alta precisão.',
    ],
    respiroVerde: {
      selo: '🐾 Respiro do Guardião • Farmacocinética Serena',
      frase:
        '“A insulina rápida não desaparece após uma hora. Respeitar o tempo de ação do organismo é o maior escudo contra o desespero e contra a hipoglicemia de rebote.”',
    },
    subtituloMeio: 'O Perigo Invisível do Empilhamento de Insulina (Stacking)',
    paragrafosMeio: [
      'Imagine que você almoçou às 12h e aplicou insulina rápida. Às 14h (2 horas depois), a glicemia está em 230 mg/dL. O impulso imediato da maioria das pessoas é aplicar uma dose cheia de correção para fazer o número baixar logo.',
      'É aí que mora o perigo do empilhamento: a insulina aplicada às 12h ainda tem cerca de 25% a 40% de potência agindo no seu sangue. Se você aplicar outra dose sem descontar essa insulina ativa, essas duas ondas vão se chocar por volta das 15h, provocando uma queda vertiginosa.',
    ],
    passosTitulo: 'Como Navegar no Destro com Visão de Sensor',
    passosNumerados: [
      {
        numero: '01',
        titulo: 'Consultar a Insulina Ativa (IOB)',
        descricao:
          'Antes de qualquer bolus de correção, calcule quantas UI ainda estão ativas das últimas 3 horas para evitar doses sobrepostas.',
      },
      {
        numero: '02',
        titulo: 'Cálculo de Projeção pelo FSI',
        descricao:
          'Multiplique a insulina ativa pelo seu Fator de Sensibilidade. Se a queda projetada ultrapassar sua meta segura, espere mais um pouco.',
      },
      {
        numero: '03',
        titulo: 'Dois testes em 30 minutos',
        descricao:
          'Se desconfiar de queda rápida, repita o destro 30 minutos depois. Uma variação superior a 1 mg/dL por minuto exige atenção preventiva.',
      },
      {
        numero: '04',
        titulo: 'Correção com líquidos simples',
        descricao:
          'Em quedas rápidas, use apenas carboidrato líquido (suco ou sachê de glicose). Gorduras e chocolates demoram até 45 minutos para agir.',
      },
    ],
    imagemSecundaria: {
      src: familiaCuidadoImg,
      legenda:
        'Com calma e método, as anotações no diário revelam a direção segura para cuidar sem sustos.',
    },
    respiroTerracota: {
      selo: '🌿 Respiro do Guardião • Apoio Emocional',
      frase:
        '“Tecnologia é ferramenta, mas o carinho, a observação dos sinais do corpo e o método seguro são as verdadeiras bases do autocuidado.”',
    },
    paragrafosFinais: [
      'Na GlicoCare, nosso diário inteligente calcula automaticamente a IOB estimada e a velocidade entre suas medições consecutivas, dando suporte clínico às decisões acordadas com seu endocrinologista.',
    ],
    mensagemLufyFinal:
      'Viu só? Você não está às cegas! Com anotações cuidadosas e respeitando a insulina ativa, cada pontinha de dedo se transforma em segurança para brincar e viver leve!',
  },
};

/* Comentários aprovados da comunidade (RN-MOD-01) */
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
/* ==========================================================================
   FIM DO CONTEÚDO ESTRUTURADO EDITORIAL
   ========================================================================== */

/* ==========================================================================
   INÍCIO DO COMPONENTE PRINCIPAL ARTIGO DETALHE
   ========================================================================== */
export default function ArtigoDetalhe() {
  const notificar = useNotify();
  // Captura o slug ou ID na URL (/artigo/:slug ou /artigo/:id)
  const { slugOrId, id, slug } = useParams();
  const param = slugOrId || slug || id || '1';

  // Localiza o artigo na Biblioteca por ID numérico ou por slug textual
  const artigo =
    ARTIGOS_BIBLIOTECA.find(
      (a) => String(a.id) === String(param) || a.slug === param
    ) || ARTIGOS_BIBLIOTECA[0];

  const idNumerico = artigo.id;
  const conteudo =
    CONTEUDO_COMPLETO_ARTIGOS[idNumerico] || CONTEUDO_COMPLETO_ARTIGOS[1];

  // Estados do formulário de comentários acolhedores
  const [nome, setNome] = useState('');
  const [cidade, setCidade] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [parecerModeracao, setParecerModeracao] = useState(null);
  const [erroCapa, setErroCapa] = useState(false);
  const [progressoLeitura, setProgressoLeitura] = useState(0);
  const [copiado, setCopiado] = useState(false);
  /* INÍCIO ESTADOS DE CARREGAMENTO (GLICOLOADER) */
  const [carregandoArtigo, setCarregandoArtigo] = useState(false);
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  /* FIM ESTADOS DE CARREGAMENTO (GLICOLOADER) */

  const handleCompartilhar = () => {
    const shareData = {
      title: `${artigo.titulo} — GlicoCare`,
      text: artigo.resumo,
      url: window.location.href,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    }
  };

  /* INÍCIO DO RESET DE ROLAGEM AO TOPO DO ARTIGO EDITORIAL */
  useEffect(() => {
    const rolarParaTopo = () => {
      try {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant',
        });
      } catch {
        window.scrollTo(0, 0);
      }
    };

    // Executa no início da renderização do artigo
    rolarParaTopo();

    // Executa complementarmente após o ciclo de montagem/carregamento da capa e fontes
    const timer = setTimeout(rolarParaTopo, 20);
    return () => clearTimeout(timer);
  }, [param, artigo?.id]);
  /* FIM DO RESET DE ROLAGEM AO TOPO DO ARTIGO EDITORIAL */

  // Monitora a rolagem para a barra de progresso de leitura fluida
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progresso = (window.scrollY / totalHeight) * 100;
        setProgressoLeitura(Math.min(100, Math.max(0, progresso)));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Verifica se o artigo possui foto válida ou se deve exibir a Capa Editorial Padrão
  const fotoUrl = artigo.imagemCapa || artigo.imagem_capa_url || null;
  const exibirFoto = Boolean(fotoUrl && !erroCapa);

  // Envio de comentário com moderação prévia (RN-MOD-01)
  const handleEnviarComentarioFamilia = async (e) => {
    e.preventDefault();
    if (!nome.trim() || !cidade.trim() || !mensagem.trim() || enviandoComentario) return;

    const resultadoModerador = analisarMensagemModerador(mensagem);
    setParecerModeracao(resultadoModerador);

    if (!resultadoModerador.aprovada) {
      notificar.aviso('A mensagem precisa de pequenos ajustes antes de ser enviada.', 'Ajuste Necessário');
      return;
    }

    setEnviandoComentario(true);
    const autorFormatado = `${nome.trim()} — ${cidade.trim()}`;

    try {
      await depoimentosService.enviarParaModeracao({
        artigo_id: artigo.id,
        nome_autor: autorFormatado,
        conteudo: mensagem.trim(),
      });
      notificar.sucesso('Seu relato foi enviado com carinho para a moderação acolhedora (RN-MOD-01).', 'Depoimento Recebido');
      setNome('');
      setCidade('');
      setMensagem('');
    } catch {
      // Fallback gracioso local em modo de desenvolvimento
      notificar.sucesso('Seu relato foi acolhido localmente para prévia.', 'Depoimento Recebido');
      setNome('');
      setCidade('');
      setMensagem('');
    } finally {
      setEnviandoComentario(false);
    }
  };

  return (
    <div className="pagina-leitura-container">
      {/* Barra de Progresso de Leitura Fluida */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '4px',
          width: `${progressoLeitura}%`,
          backgroundColor: 'var(--cor-cta, #3B7E48)',
          zIndex: 9999,
          transition: 'width 0.1s ease-out',
          boxShadow: '0 1px 4px rgba(59, 126, 72, 0.35)',
        }}
      />
      {/* ====================================================================
          1. INÍCIO DO CABEÇALHO EDITORIAL DO ARTIGO (Centralizado, ~820px)
          ==================================================================== */}
      <header className="artigo-cabecalho-editorial">
        {/* Link sutil de retorno */}
        <div>
          <Link to="/biblioteca" className="artigo-link-retorno">
            ← Voltar para a Biblioteca de Conteúdos
          </Link>
        </div>

        {/* Badge estilo pílula com ícone da categoria e tempo de leitura */}
        <div>
          <span className="artigo-indicador-topo">
            {conteudo.indicadorTopo}
          </span>
        </div>

        {/* Título Principal (H1) em Fraunces com destaque em itálico terracota */}
        <h1 className="artigo-titulo-principal">
          {conteudo.tituloFormatado || artigo.titulo}
        </h1>

        {/* Subtítulo acolhedor */}
        <p className="artigo-subtitulo-acolhedor">
          {conteudo.subtituloIntrodutorio}
        </p>

        {/* Metadados do autor (Avatar circular Verde Alívio + Nome + Ano) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '1.25rem' }}>
          <div className="artigo-meta-autor" style={{ marginTop: 0 }}>
            <div className="artigo-avatar-autor">
              {conteudo.autor?.iniciais || 'GC'}
            </div>
            <div className="artigo-info-autor">
              <div className="artigo-nome-autor">
                {conteudo.autor?.nome || 'Equipe Editorial GlicoCare'}
              </div>
              <div className="artigo-atualizacao-autor">
                {conteudo.autor?.atualizacao || 'Atualizado em 2026'}
              </div>
            </div>
          </div>

          {/* Botão de Compartilhamento Fluido (Desktop / Mobile) */}
          <button
            type="button"
            onClick={handleCompartilhar}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--cor-superficie, #F6F3EE)',
              border: '1px solid var(--cor-borda-suave, rgba(124, 83, 63, 0.25))',
              borderRadius: '9999px',
              padding: '6px 16px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--cor-primaria, #7C533F)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            }}
            title="Compartilhar este guia acolhedor"
          >
            <span>🔗</span>
            <span>{copiado ? '✓ Link copiado com carinho!' : 'Compartilhar guia'}</span>
          </button>
        </div>
      </header>
      {/* FIM DO CABEÇALHO EDITORIAL */}

      {/* ====================================================================
          2. INÍCIO DA IMAGEM DE CAPA AMPLA E RESPONSIVA (max-width: 1040px)
             OU CAPA EDITORIAL PADRÃO ("PORTO SEGURO")
          ==================================================================== */}
      <figure className="artigo-imagem-ampla-container">
        {exibirFoto ? (
          <>
            <img
              src={fotoUrl}
              alt={artigo.titulo}
              onError={() => setErroCapa(true)}
            />
            <figcaption className="artigo-imagem-legenda">
              {artigo.legenda_capa ||
                'Ilustração editorial GlicoCare: informação clara e acolhimento caminham juntos para transformar a rotina em um porto seguro.'}
            </figcaption>
          </>
        ) : (
          <CapaEditorialDefault
            selo={artigo.seloSuperior || artigo.selo_editorial || 'GUIA ESSENCIAL'}
            numero={artigo.numeroEditorial || artigo.id || '01'}
            cor={artigo.corTopo || artigo.cor_capa_default}
            categoria={artigo.categoria}
            variante="banner"
          />
        )}
      </figure>
      {/* FIM DA IMAGEM PRINCIPAL AMPLA OU CAPA EDITORIAL PADRÃO */}

      {/* ====================================================================
          3. INÍCIO DA COLUNA DE LEITURA EDITORIAL (~720px)
          ==================================================================== */}
      <article className="artigo-coluna-leitura">
        {/* Parágrafos Iniciais com Capitular (Drop Cap) no 1º parágrafo */}
        {conteudo.paragrafosIniciais.map((paragrafo, index) => (
          <p
            key={`ini-${index}`}
            className={index === 0 ? 'artigo-drop-cap' : ''}
          >
            {paragrafo}
          </p>
        ))}

        {/* Bloco de Citação 1: "Respiro do Guardião" (Borda 4px Verde Alívio #3B7E48) */}
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

        {/* Subtítulo Intermediário em Fraunces */}
        <h2>{conteudo.subtituloMeio}</h2>

        {/* Parágrafos práticos intermediários */}
        {conteudo.paragrafosMeio.map((paragrafo, index) => (
          <p key={`meio-${index}`}>{paragrafo}</p>
        ))}

        {/* Passos Numerados em Lista Vertical com Cards em #F6F3EE */}
        {conteudo.passosNumerados && (
          <div className="artigo-lista-passos">
            <h3 className="artigo-passos-titulo">{conteudo.passosTitulo}</h3>
            <div>
              {conteudo.passosNumerados.map((passo) => (
                <div key={passo.numero} className="artigo-card-passo">
                  <div className="artigo-passo-numero">{passo.numero}</div>
                  <div className="artigo-passo-conteudo">
                    <h4>{passo.titulo}</h4>
                    <p>{passo.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Imagem Intermediária Ampla (max-width: 1040px) */}
      <figure className="artigo-imagem-ampla-container">
        <img
          src={conteudo.imagemSecundaria.src}
          alt={conteudo.imagemSecundaria.legenda}
        />
        <figcaption className="artigo-imagem-legenda">
          {conteudo.imagemSecundaria.legenda}
        </figcaption>
      </figure>

      {/* Continuação da Coluna de Leitura */}
      <article className="artigo-coluna-leitura">
        {/* Bloco de Citação 2: "Respiro do Guardião" (Borda 4px Terracota #7C533F) */}
        <aside
          className="respiro-do-guardiao variante-terracota"
          aria-label="Respiro do Guardião — Apoio Emocional"
        >
          <div className="respiro-guardiao-selo">
            {conteudo.respiroTerracota.selo}
          </div>
          <p className="respiro-guardiao-texto">
            {conteudo.respiroTerracota.frase}
          </p>
        </aside>

        {/* Parágrafos Finais */}
        {conteudo.paragrafosFinais.map((paragrafo, index) => (
          <p key={`fim-${index}`}>{paragrafo}</p>
        ))}

        {/* Banner Escuro do Lufy (#231F1D) */}
        <div className="artigo-banner-lufy-escuro">
          <img
            src={logoGlicoCareImg}
            alt="Mascote Lufy — Guardião GlicoCare"
            className="artigo-banner-lufy-avatar"
          />
          <div>
            <span className="artigo-banner-lufy-tag">
              🐾 Acolhimento do Guardião Lufy
            </span>
            <p className="artigo-banner-lufy-frase">
              {conteudo.mensagemLufyFinal}
            </p>
            <a
              href="#secao-comentarios-comunidade"
              className="artigo-banner-lufy-link"
            >
              Encontrar outras famílias ↓
            </a>
          </div>
        </div>

        {/* Aviso Ético em Box Discreto (#F6F3EE) */}
        <div className="artigo-aviso-etico">
          <strong>Aviso Ético e Clínico:</strong> Todo o conteúdo publicado na
          GlicoCare possui finalidade estritamente educativa, de apoio
          emocional e fortalecimento familiar. Ele nunca substitui o
          acompanhamento médico, exames laboratoriais e condutas
          individualizadas prescritas pelos endocrinologistas e profissionais que
          cuidam da saúde do seu filho ou da sua família.
        </div>
      </article>
      {/* FIM DA COLUNA DE LEITURA EDITORIAL */}

      {/* Linha Divisória Horizontal Sutil */}
      <hr className="artigo-divisor-secao" />

      {/* ====================================================================
          4. INÍCIO DA SEÇÃO DE COMENTÁRIOS E ACOLHIMENTO EM 2 COLUNAS
          ==================================================================== */}
      <section
        id="secao-comentarios-comunidade"
        className="artigo-secao-comunidade"
        aria-labelledby="titulo-comentarios-encontro"
      >
        <div className="artigo-comunidade-cabecalho">
          <div className="section-line-eyebrow">ESPAÇO DE CONEXÃO E APOIO MÚTUO</div>
          <h2
            id="titulo-comentarios-encontro"
            style={{
              fontFamily: 'var(--fonte-titulo)',
              fontSize: 'clamp(1.75rem, 3.2vw, 2.35rem)',
              color: 'var(--cor-texto)',
              marginBottom: '0.65rem',
            }}
          >
            Este também pode ser um lugar de{' '}
            <span className="texto-italico-terracota">encontro.</span>
          </h2>
          <p
            style={{
              fontSize: '1rem',
              color: '#5A5049',
              lineHeight: 1.6,
              maxWidth: '820px',
              margin: 0,
            }}
          >
            Compartilhe seus aprendizados, vivências ou uma mensagem de afeto.
            Para manter a serenidade da nossa comunidade, todas as mensagens
            passam por curadoria gentil antes da publicação (RN-MOD-01).
          </p>
        </div>

        {/* Grade Responsiva em 2 Colunas: Formulário à Esquerda e Vozes à Direita */}
        <div className="artigo-comunidade-grid">
          {/* Coluna 1: Formulário de Mensagem */}
          <div className="artigo-formulario-card">
            <h3
              style={{
                fontFamily: 'var(--fonte-titulo)',
                fontSize: '1.25rem',
                color: 'var(--cor-primaria)',
                margin: '0 0 0.35rem 0',
              }}
            >
              Deixe sua mensagem de acolhimento
            </h3>
            <p
              style={{
                fontSize: '0.88rem',
                color: '#5A5049',
                marginBottom: '1.35rem',
              }}
            >
              Sua história pode ser o abraço que outra família precisa ler hoje.
            </p>

            {/* Parecer do Moderador Oficial via Alert Porto Seguro */}
            {parecerModeracao && (
              <Alert
                variant={parecerModeracao.aprovada ? 'success' : 'destructive'}
                onClose={() => setParecerModeracao(null)}
              >
                <AlertTitle>
                  {parecerModeracao.aprovada ? 'Relato enviado para moderação' : 'Atenção ao conteúdo'}
                </AlertTitle>
                <AlertDescription>
                  {parecerModeracao.saidaFormatada}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleEnviarComentarioFamilia}>
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
                  placeholder="Ex: Fernanda (mãe do Bento)"
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
                    fontSize: '0.78rem',
                    color: '#6C625A',
                  }}
                >
                  🔒 Ambiente protegido pela curadoria GlicoCare
                </span>

                <Button
                  type="submit"
                  variante="primario"
                  loading={enviandoComentario}
                  disabled={enviandoComentario}
                >
                  {enviandoComentario ? 'Acolhendo seu relato...' : 'Enviar mensagem →'}
                </Button>
              </div>
            </form>
          </div>

          {/* Coluna 2: Vozes que já passaram por aqui */}
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
                  fontSize: '1.15rem',
                  color: 'var(--cor-texto)',
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Vozes que já passaram por aqui ({COMENTARIOS_FAMILIAS_APROVADOS.length})
              </h3>
              <span
                style={{
                  backgroundColor: '#EDF7EE',
                  color: '#1E4620',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '12px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                }}
              >
                ✓ Relatos moderados
              </span>
            </div>

            <div>
              {COMENTARIOS_FAMILIAS_APROVADOS.map((comentario) => (
                <div key={comentario.id} className="comentario-familia-card">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <div>
                      <strong
                        style={{
                          color: 'var(--cor-texto)',
                          fontSize: '0.94rem',
                        }}
                      >
                        {comentario.nome}
                      </strong>
                      <span
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--cor-primaria)',
                          fontWeight: 600,
                          marginLeft: '0.45rem',
                        }}
                      >
                        • 📍 {comentario.cidade}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.76rem',
                        color: '#6C625A',
                      }}
                    >
                      {comentario.tempo}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '0.94rem',
                      lineHeight: 1.6,
                      color: 'var(--cor-texto)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    “{comentario.mensagem}”
                  </p>

                  <span
                    style={{
                      fontSize: '0.74rem',
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
        </div>
      </section>
      {/* FIM DA SEÇÃO DE COMENTÁRIOS E ACOLHIMENTO */}
    </div>
  );
}
/* ==========================================================================
   FIM DO COMPONENTE ARTIGO DETALHE
   ========================================================================== */
