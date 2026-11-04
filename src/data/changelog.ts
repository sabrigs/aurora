// Histórico de versões do Aurora, da mais nova para a mais antiga (estilo notas de versão do Arc).
// Para lançar uma versão: adicione um item no topo de `versions`.
export type ChangeKind = 'New' | 'Improved' | 'Fixed';

export interface ChangelogSection {
  kind: ChangeKind;
  items: { title: string; text: string }[];
}

export interface ChangelogVersion {
  version: string;
  date: string; // ISO (AAAA-MM-DD)
  model: string;
  cost: string; // custo aproximado de API para construir a versão
  headline: string;
  intro: string;
  sections: ChangelogSection[];
}

export const versions: ChangelogVersion[] = [
  {
    version: 'v2',
    date: '2026-11-04',
    model: 'Claude Sonnet 5.5',
    cost: '~US$ 8.50',
    headline: 'Everything in one place',
    intro:
      'Your lists and Explore now live together on Home, titles got a proper page with trailers, and the whole app feels a little more polished.',
    sections: [
      {
        kind: 'New',
        items: [
          {
            title: 'Home, reimagined',
            text: 'Your lists and Explore now share the Home page. Scroll down and the Explore tabs stay pinned right under the navbar.',
          },
          {
            title: 'My lists',
            text: 'A new page with all your lists in one place.',
          },
          {
            title: 'Trailers',
            text: 'Watch trailers in an overlay without leaving the title page.',
          },
          {
            title: 'More from the same director',
            text: 'Title pages suggest other work from the same director (or creator, for TV shows).',
          },
          {
            title: 'Availability, made clear',
            text: 'See if a title is in theaters, which services stream it, when it premieres in Brazil, or if it isn’t available on streaming at all.',
          },
          {
            title: 'Changelog',
            text: 'You’re looking at it. Find it any time in the account menu.',
          },
        ],
      },
      {
        kind: 'Improved',
        items: [
          {
            title: 'Redesigned title cards',
            text: 'Poster, duration, genre and rating at a glance.',
          },
          {
            title: 'Cleaner title page',
            text: 'A new hero with the poster and a tidier 800px layout.',
          },
          {
            title: 'Streaming services',
            text: 'Netflix, Disney Plus, HBO Max, Apple TV, Crunchyroll, Amazon Prime Video and MUBI, in alphabetical order.',
          },
          {
            title: 'Consistent controls',
            text: 'The Add button and checkboxes look the same everywhere.',
          },
          {
            title: 'Stay signed in',
            text: 'You now stay signed in for 30 days, and the brief flash before the login screen is gone.',
          },
          {
            title: 'Export data',
            text: 'Always available from the account menu, even when you have nothing to export yet.',
          },
        ],
      },
      {
        kind: 'Fixed',
        items: [
          {
            title: 'Scroll position',
            text: 'Going back from a title now returns you exactly where you were in Explore.',
          },
          {
            title: 'Account menu',
            text: 'Removed the stray horizontal scroll in the dropdown.',
          },
        ],
      },
    ],
  },
  {
    version: 'v1',
    date: '2026-10-30',
    model: 'Claude Haiku 5.5',
    cost: '~US$ 2',
    headline: 'Hello, Aurora',
    intro:
      'The first version of Aurora: keep track of what you want to watch, find what to watch next, and know where to watch it.',
    sections: [
      {
        kind: 'New',
        items: [
          {
            title: 'Passwordless sign in',
            text: 'Get a link by email and you’re in. A quick onboarding sets your name and streaming services.',
          },
          {
            title: 'Your lists',
            text: 'To watch, Favorites and Watched, for movies and TV shows, with filters.',
          },
          {
            title: 'Explore',
            text: 'Browse Trending and On Theater, or search for titles and artists. It scrolls forever.',
          },
          {
            title: 'Title pages',
            text: 'Where to watch, synopsis and cast, with the option to add a title to any list.',
          },
          {
            title: 'My streamings',
            text: 'Pick your services at onboarding and change them any time from the account menu.',
          },
          {
            title: 'Export your data',
            text: 'Download everything you’ve saved as JSON.',
          },
        ],
      },
      {
        kind: 'Improved',
        items: [
          {
            title: 'Fast navigation',
            text: 'Moving between pages no longer reloads the app, and the navbar stays put.',
          },
          {
            title: 'Built for every screen',
            text: 'Cards flow into 3, 2 or 1 columns, with a floating toolbar and bottom sheet on mobile.',
          },
        ],
      },
    ],
  },
];
