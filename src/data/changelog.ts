// Histórico de versões do Aurora, da mais nova para a mais antiga.
// Para lançar uma versão: adicione um item no topo de `versions` com o que foi acrescentado.
export interface ChangelogVersion {
  version: string;
  items: string[];
}

export const versions: ChangelogVersion[] = [
  {
    version: 'v2',
    items: [
      'Home now brings your lists and Explore together. Scroll down and the Explore tabs stay pinned under the navbar.',
      'New My lists page with all your lists in one place.',
      'Redesigned title cards with poster, duration, genre and rating.',
      'Title page: trailers that open in an overlay, titles from the same director or creator, and a cleaner 800px layout.',
      'Streaming services are now Netflix, Disney Plus, HBO Max, Apple TV, Crunchyroll, Amazon Prime Video and MUBI, in alphabetical order.',
      'Consistent Add button and checkbox style across the app.',
      'New Changelog page, available from the account menu.',
    ],
  },
  {
    version: 'v1',
    items: [
      'Sign in with a link sent to your email.',
      'To watch, Favorites and Watched lists for movies and TV shows.',
      'Explore with Trending and On Theater tabs, plus search for titles and artists.',
      'Title page with where to watch, synopsis and cast.',
      'My streamings, chosen at onboarding and editable from the account menu.',
      'Export your data.',
    ],
  },
];
