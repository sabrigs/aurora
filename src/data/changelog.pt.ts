// Tradução do changelog para português (Brasil). As chaves são as versões de `changelog.ts`; as seções e os
// itens seguem a mesma ordem do original, então ao lançar uma versão nova, traduza na mesma ordem.
export interface ChangelogTranslation {
  headline: string;
  intro: string;
  sections: { items: { title: string; text: string }[] }[];
}

export const changelogPt: Record<string, ChangelogTranslation> = {
  v4: {
    headline: 'Feito para onde você está',
    intro:
      'O Aurora agora fala português, encontra o que está em streaming no seu país e ganhou um visual mais limpo e cinematográfico, da navbar à página do título.',
    sections: [
      {
        items: [
          {
            title: 'Idioma',
            text: 'Escolha English ou Português no menu da conta. A interface, e também os títulos, pôsteres e sinopses, mudam junto quando há tradução disponível.',
          },
          {
            title: 'Streaming onde você está',
            text: 'Com a sua permissão, o Aurora usa a sua localização para mostrar os serviços, os cinemas e as datas de estreia do seu país. Os serviços que você já escolheu sempre ficam.',
          },
          {
            title: 'Filtros na busca',
            text: 'Um botão de filtro ao lado da busca: filmes ou séries, só os seus streamings e esconder o que já está nas suas listas (ligado por padrão).',
          },
          {
            title: 'Chips de filtro nas listas',
            text: 'Toque nos seus streamings ou em Em exibição / Finalizada para filtrar uma lista. Os chips ficam fixos sob a navbar enquanto você rola.',
          },
          {
            title: 'Logos de streaming em cada card',
            text: 'Veja de relance quais serviços têm um título, direto no card.',
          },
          {
            title: 'Um botão Adicionar mais esperto',
            text: 'O Adicionar aparece quando você passa o mouse no card. Depois de adicionado, o check verde mostra em qual lista o título está.',
          },
          {
            title: 'Anos de lançamento',
            text: 'Os cards mostram o ano de lançamento de um filme ou o período de anos de uma série.',
          },
          {
            title: 'Botão de voltar',
            text: 'Um único botão de voltar na navbar, em toda página interna.',
          },
          {
            title: 'Prévia das listas',
            text: 'Cada lista mostra uma grade 2×2 com os últimos pôsteres, com a quantidade de títulos ao lado.',
          },
        ],
      },
      {
        items: [
          {
            title: 'Página do título mais cinematográfica',
            text: 'O backdrop agora chega ao topo da tela, com um brilho suave das cores dele escorrendo para a página.',
          },
          {
            title: 'Cards mais limpos',
            text: 'Sem bordas, com backdrops mais suaves, sombra atrás do pôster e as informações em duas linhas claras. As séries mostram as temporadas em vez da duração do episódio.',
          },
          {
            title: 'Imagens mais rápidas',
            text: 'Backdrops e pôsteres carregam mais cedo e ficam guardados, então as telas não recarregam o que você já viu.',
          },
          {
            title: 'Episódios mais simples',
            text: 'Miniaturas maiores, texto mais suave e um único check para marcar um episódio.',
          },
          {
            title: 'Fotos do elenco maiores',
            text: 'Fotos em retrato, na mesma proporção dos pôsteres.',
          },
          {
            title: 'Visual consistente',
            text: 'Os botões da navbar, o verde e os campos de texto agora têm a mesma aparência em todo lugar.',
          },
          {
            title: 'No celular',
            text: 'O botão Adicionar fica sempre visível em telas de toque, e o carrossel de listas pode ser arrastado com o mouse.',
          },
          {
            title: 'Mais serviços',
            text: 'O Globoplay agora é uma opção para os seus streamings.',
          },
        ],
      },
      {
        items: [
          {
            title: 'Chega de pulos',
            text: 'A página do título não se mexe mais enquanto o botão Adicionar carrega, e a piscada ao abrir um título acabou.',
          },
          {
            title: 'Cards estáveis',
            text: 'Os backdrops não mudam mais depois que o card aparece, e o desfoque surge junto com a imagem.',
          },
          {
            title: 'Carrossel em telas estreitas',
            text: 'As listas da Início agora podem ser roladas com o mouse.',
          },
        ],
      },
    ],
  },
  v3: {
    headline: 'Acompanhe suas séries',
    intro:
      'O Aurora agora acompanha as séries episódio por episódio, com uma nova lista Assistindo, e pode ser instalado na tela inicial como um app.',
    sections: [
      {
        items: [
          {
            title: 'Assistindo',
            text: 'Uma nova lista entre Para assistir e Assistidos, para filmes e séries que você está no meio. Use “Marcar como assistindo” em qualquer menu do Adicionar.',
          },
          {
            title: 'Acompanhamento de episódios',
            text: 'As páginas de série têm uma seção Episódios com o progresso geral, um acordeão de temporadas e um checkbox por episódio. Marque uma temporada inteira, ou tudo até um episódio, com um toque.',
          },
          {
            title: 'Status automático',
            text: 'As séries mudam sozinhas entre Para assistir, Assistindo e Assistidos conforme você marca os episódios.',
          },
          {
            title: 'Progresso nos cards',
            text: 'Os cards em Assistindo mostram quantos episódios você já viu e qual é o próximo.',
          },
          {
            title: 'Situação e temporadas das séries',
            text: 'As séries mostram uma tag Em exibição, Finalizada ou Cancelada e o número de temporadas, nos cards e na página do título.',
          },
          {
            title: 'Instale o Aurora',
            text: 'Adicione o Aurora à tela inicial e abra como um app. Você também pode entrar com o código do e-mail, já que o link abre no navegador.',
          },
          {
            title: 'Busca em qualquer lugar',
            text: 'A busca fica na navbar no desktop e em uma nova barra de abas na base no celular.',
          },
          {
            title: 'Elenco completo',
            text: 'As páginas de título mostram a primeira fileira do elenco, e “Ver todos” carrega o resto.',
          },
        ],
      },
      {
        items: [
          {
            title: 'Confirmação para séries',
            text: 'Marcar uma série como assistida ou favorita pergunta antes e salva todos os episódios lançados de uma vez. Remover uma série com progresso pergunta antes de apagá-lo.',
          },
          {
            title: 'Progresso real para séries antigas em Assistidos',
            text: 'As séries que você já tinha marcado como assistidas ganham o progresso dos episódios quando você as abre.',
          },
          {
            title: 'Cards refinados',
            text: 'Pôsteres maiores de 120×160, um desfoque mais suave embaixo, linhas de informação mais limpas, sem marcadores, e uma grade que agora cabe 4 colunas.',
          },
          {
            title: 'Botão Adicionar e menus',
            text: 'Ícones em todas as opções, áreas de toque de 48px, resposta tátil no sucesso e uma folha modal na base no celular que dá para arrastar para fechar.',
          },
          {
            title: 'Navbar',
            text: 'Uma navbar mais alta, com Início e Minhas listas coladas nela.',
          },
          {
            title: 'Mais segurança por padrão',
            text: 'Agora é preciso entrar para toda requisição do app, com limites de uso, cabeçalhos de segurança mais rígidos e regras de banco de dados mais firmes.',
          },
        ],
      },
      {
        items: [
          {
            title: 'Estados de carregamento',
            text: 'Os esqueletos só aparecem enquanto algo está de fato carregando.',
          },
          {
            title: 'Títulos longos',
            text: 'Os títulos quebram para uma nova linha em vez de serem cortados com reticências.',
          },
        ],
      },
    ],
  },
  v2: {
    headline: 'Tudo em um só lugar',
    intro:
      'Suas listas e o Explore agora vivem juntos na Início, os títulos ganharam uma página própria com trailers, e o app todo ficou um pouco mais polido.',
    sections: [
      {
        items: [
          {
            title: 'Início, reimaginada',
            text: 'Suas listas e o Explore agora dividem a página Início. Role para baixo e as abas do Explore ficam fixas logo abaixo da navbar.',
          },
          {
            title: 'Minhas listas',
            text: 'Uma nova página com todas as suas listas em um só lugar.',
          },
          {
            title: 'Trailers',
            text: 'Assista aos trailers em uma sobreposição, sem sair da página do título.',
          },
          {
            title: 'Mais do mesmo diretor',
            text: 'As páginas de título sugerem outros trabalhos do mesmo diretor (ou criador, no caso de séries).',
          },
          {
            title: 'Disponibilidade, de forma clara',
            text: 'Veja se um título está em cartaz, quais serviços o transmitem, quando estreia no Brasil, ou se ele não está disponível em streaming.',
          },
          {
            title: 'Changelog',
            text: 'É este que você está vendo. Encontre-o a qualquer momento no menu da conta.',
          },
        ],
      },
      {
        items: [
          {
            title: 'Cards de título redesenhados',
            text: 'Pôster, duração, gênero e nota de relance.',
          },
          {
            title: 'Página do título mais limpa',
            text: 'Um novo topo com o pôster e um layout de 800px mais organizado.',
          },
          {
            title: 'Serviços de streaming',
            text: 'Netflix, Disney Plus, HBO Max, Apple TV, Crunchyroll, Amazon Prime Video e MUBI, em ordem alfabética.',
          },
          {
            title: 'Controles consistentes',
            text: 'O botão Adicionar e os checkboxes têm a mesma aparência em todo lugar.',
          },
          {
            title: 'Continue conectado',
            text: 'Agora você fica conectado por 30 dias, e a piscada rápida antes da tela de login acabou.',
          },
          {
            title: 'Exportar dados',
            text: 'Sempre disponível no menu da conta, mesmo quando você ainda não tem nada para exportar.',
          },
        ],
      },
      {
        items: [
          {
            title: 'Posição da rolagem',
            text: 'Ao voltar de um título, você retorna exatamente onde estava no Explore.',
          },
          {
            title: 'Menu da conta',
            text: 'Removemos a rolagem horizontal indevida no dropdown.',
          },
        ],
      },
    ],
  },
  v1: {
    headline: 'Olá, Aurora',
    intro:
      'A primeira versão do Aurora: acompanhe o que você quer assistir, descubra o que ver em seguida e saiba onde assistir.',
    sections: [
      {
        items: [
          {
            title: 'Login sem senha',
            text: 'Receba um link por e-mail e pronto, você entrou. Um onboarding rápido define o seu nome e os seus serviços de streaming.',
          },
          {
            title: 'Suas listas',
            text: 'Para assistir, Favoritos e Assistidos, para filmes e séries, com filtros.',
          },
          {
            title: 'Explore',
            text: 'Navegue pelos Em alta e Em cartaz, ou busque títulos e artistas. A rolagem não acaba.',
          },
          {
            title: 'Páginas de título',
            text: 'Onde assistir, sinopse e elenco, com a opção de adicionar um título a qualquer lista.',
          },
          {
            title: 'Meus streamings',
            text: 'Escolha seus serviços no onboarding e mude quando quiser pelo menu da conta.',
          },
          {
            title: 'Exporte seus dados',
            text: 'Baixe tudo o que você salvou em JSON.',
          },
        ],
      },
      {
        items: [
          {
            title: 'Navegação rápida',
            text: 'Trocar de página não recarrega mais o app, e a navbar fica no lugar.',
          },
          {
            title: 'Feito para todas as telas',
            text: 'Os cards se organizam em 3, 2 ou 1 coluna, com uma barra flutuante e uma folha na base no celular.',
          },
        ],
      },
    ],
  },
};
