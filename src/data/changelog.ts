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
    version: 'v4',
    date: '2026-11-21',
    model: 'Claude Sonnet 5.5',
    cost: '~US$ 40',
    headline: 'Made for where you are',
    intro:
      'Aurora now speaks Portuguese, finds what’s streaming in your country, and has a cleaner, more cinematic look from the navbar to the title page.',
    sections: [
      {
        kind: 'New',
        items: [
          {
            title: 'Language',
            text: 'Pick English or Português from the account menu. The interface, and the titles, posters and synopses, switch too when a translation is available.',
          },
          {
            title: 'Streaming where you are',
            text: 'With your permission, Aurora uses your location to show the services, theaters and release dates for your country. The services you already picked always stay.',
          },
          {
            title: 'Search filters',
            text: 'A filter button next to the search: movies or series, only your streamings, and hide what’s already in your lists (on by default).',
          },
          {
            title: 'Filter chips in your lists',
            text: 'Tap your streamings or Ongoing / Ended to filter a list. The chips stay pinned under the navbar as you scroll.',
          },
          {
            title: 'Streaming logos on every card',
            text: 'See at a glance which services have a title, right on its card.',
          },
          {
            title: 'A smarter Add button',
            text: 'Add shows up when you hover a card. Once added, the green check tells you which list the title is in.',
          },
          {
            title: 'Release years',
            text: 'Cards show when a movie came out, or the span of years for a series.',
          },
          {
            title: 'Back button',
            text: 'One back button in the navbar, on every inner page.',
          },
          {
            title: 'List previews',
            text: 'Each list shows a 2×2 of its latest posters, with the number of titles next to it.',
          },
        ],
      },
      {
        kind: 'Improved',
        items: [
          {
            title: 'A more cinematic title page',
            text: 'The backdrop now reaches the top of the screen, with a soft glow of its colors flowing into the page.',
          },
          {
            title: 'Cleaner cards',
            text: 'No borders, softer backdrops, a shadow behind the poster, and the info on two clear lines. Series show their seasons instead of the episode length.',
          },
          {
            title: 'Faster images',
            text: 'Backdrops and posters load sooner and are remembered, so screens don’t reload what you’ve already seen.',
          },
          {
            title: 'Simpler episodes',
            text: 'Bigger thumbnails, softer text, and a single check to mark an episode.',
          },
          {
            title: 'Bigger cast photos',
            text: 'Portrait photos, in the same proportion as posters.',
          },
          {
            title: 'Consistent look',
            text: 'The navbar buttons, the green and the inputs now look the same everywhere.',
          },
          {
            title: 'On your phone',
            text: 'The Add button is always visible on touch screens, and the lists carousel can be dragged with a mouse.',
          },
          {
            title: 'More services',
            text: 'Globoplay is now an option for your streamings.',
          },
        ],
      },
      {
        kind: 'Fixed',
        items: [
          {
            title: 'No more jumping',
            text: 'The title page no longer shifts while the Add button loads, and the flash when opening a title is gone.',
          },
          {
            title: 'Steady cards',
            text: 'Backdrops no longer change after a card appears, and the blur shows up together with the image.',
          },
          {
            title: 'Carousel on narrow screens',
            text: 'The lists on Home can now be scrolled with a mouse.',
          },
        ],
      },
    ],
  },
  {
    version: 'v3',
    date: '2026-11-08',
    model: 'Claude Sonnet 5.5',
    cost: '~US$ 10',
    headline: 'Keep up with your shows',
    intro:
      'Aurora now tracks TV series episode by episode, with a new Watching list, and installs on your home screen like an app.',
    sections: [
      {
        kind: 'New',
        items: [
          {
            title: 'Watching',
            text: 'A new list between To watch and Watched, for movies and series you’re in the middle of. Use “Mark as watching” from any Add menu.',
          },
          {
            title: 'Episode tracking',
            text: 'Series pages have an Episodes section with overall progress, a season accordion and a checkbox per episode. Mark a whole season, or everything up to a given episode, in one tap.',
          },
          {
            title: 'Automatic status',
            text: 'Series move between To watch, Watching and Watched on their own as you check off episodes.',
          },
          {
            title: 'Progress on cards',
            text: 'Cards in Watching show how many episodes you’ve seen and which one is next.',
          },
          {
            title: 'Series status and seasons',
            text: 'Series show an Ongoing, Ended or Canceled tag and their number of seasons, on cards and on the title page.',
          },
          {
            title: 'Install Aurora',
            text: 'Add Aurora to your home screen and open it like an app. You can sign in with the code from the email too, since the link opens in the browser.',
          },
          {
            title: 'Search anywhere',
            text: 'Search lives in the navbar on desktop, and in a new tab bar at the bottom on mobile.',
          },
          {
            title: 'Full cast',
            text: 'Title pages show the first row of the cast, and “Show all” loads the rest.',
          },
        ],
      },
      {
        kind: 'Improved',
        items: [
          {
            title: 'Confirmation for series',
            text: 'Marking a series as watched or favorite asks first and saves every released episode at once. Removing a series with progress asks before clearing it.',
          },
          {
            title: 'Real progress for old Watched series',
            text: 'Series you had already marked as Watched get their episode progress when you open them.',
          },
          {
            title: 'Cards, refined',
            text: 'Larger 120×160 posters, a softer blur at the bottom, cleaner info lines without bullets, and a grid that now fits 4 columns.',
          },
          {
            title: 'Add button and menus',
            text: 'Icons in every option, 48px targets, haptic feedback on success, and a modal bottom sheet on mobile you can drag to close.',
          },
          {
            title: 'Navbar',
            text: 'A taller navbar, with Home and My lists sitting right against it.',
          },
          {
            title: 'Safer by default',
            text: 'Sign-in is now required for every request the app makes, with rate limits, stricter security headers and tighter database rules.',
          },
        ],
      },
      {
        kind: 'Fixed',
        items: [
          {
            title: 'Loading states',
            text: 'Skeletons only appear while something is actually loading.',
          },
          {
            title: 'Long titles',
            text: 'Titles wrap onto a new line instead of being cut off with an ellipsis.',
          },
        ],
      },
    ],
  },
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
