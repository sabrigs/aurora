// Seção "Episodes" da página da série: acordeão por temporada, checkbox por episódio e ações em lote.
// O progresso fica em episode_progress; o status da série (To watch / Watching / Watched) acompanha via syncSeriesStatus.
import { apiFetch } from '../api';
import { posterUrl } from '../tmdb/images';
import { formatRuntime } from '../tmdb/format';
import {
  episodeKey,
  getWatchedEpisodes,
  markEpisodesWatched,
  unmarkEpisodes,
  type EpisodeRef,
} from './progress';
import { getTitleStatus, LISTS_CHANGED_EVENT, syncSeriesStatus, type TitleRef } from './store';

interface Episode {
  episodeNumber: number;
  name: string;
  overview: string;
  airDate: string | null;
  runtime: number | null;
  stillPath: string | null;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

const formatDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

const isAired = (episode: Episode) => Boolean(episode.airDate) && episode.airDate! <= todayIso();

const CHECK_ICON =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>';
const UP_TO_HERE_ICON =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12.5l4.5 4.5L16 8M11 16.5l1 1L21.5 8" /></svg>';

export function initEpisodes(root: HTMLElement) {
  const ref: TitleRef = {
    tmdbId: Number(root.dataset.tmdbId),
    mediaType: 'tv',
    title: root.dataset.title ?? '',
    posterPath: root.dataset.posterPath || null,
  };
  const airedTotal = Number(root.dataset.airedTotal);
  const ended = root.dataset.ended === 'true';

  const progressLabel = root.querySelector<HTMLElement>('[data-progress-label]')!;
  const progressBar = root.querySelector<HTMLElement>('[data-progress-bar]')!;
  const progressFill = root.querySelector<HTMLElement>('[data-progress-fill]')!;
  const note = root.querySelector<HTMLElement>('[data-note]')!;
  const seasonEls = [...root.querySelectorAll<HTMLDetailsElement>('[data-season]')];

  let watched = new Set<string>();
  // Série marcada como Watched sem progresso por episódio: todos aparecem marcados, sem edição.
  let implicitAll = false;
  const loaded = new Map<number, Episode[]>();
  const loading = new Map<number, Promise<Episode[]>>();

  // Alterações são aplicadas uma de cada vez, para o status da série nunca ser calculado com dados pela metade.
  let queue: Promise<unknown> = Promise.resolve();
  const enqueue = <T>(task: () => Promise<T>): Promise<T> => {
    const run = queue.then(task, task);
    queue = run.catch(() => {});
    return run;
  };

  const showNote = (text: string | null) => {
    note.hidden = !text;
    note.textContent = text ?? '';
  };

  const loadSeason = (seasonNumber: number): Promise<Episode[]> => {
    const done = loaded.get(seasonNumber);
    if (done) return Promise.resolve(done);
    let pending = loading.get(seasonNumber);
    if (!pending) {
      pending = apiFetch(`/api/titles/tv/${ref.tmdbId}/season/${seasonNumber}`)
        .then((response) => {
          if (!response.ok) throw new Error(`season_${response.status}`);
          return response.json() as Promise<{ episodes: Episode[] }>;
        })
        .then((data) => {
          loaded.set(seasonNumber, data.episodes);
          return data.episodes;
        })
        .finally(() => loading.delete(seasonNumber));
      loading.set(seasonNumber, pending);
    }
    return pending;
  };

  const isWatched = (seasonNumber: number, episodeNumber: number) =>
    implicitAll || watched.has(episodeKey({ seasonNumber, episodeNumber }));

  const watchedInSeason = (seasonNumber: number) => {
    const prefix = `${seasonNumber}:`;
    let count = 0;
    for (const key of watched) if (key.startsWith(prefix)) count += 1;
    return count;
  };

  // --- Renderização -------------------------------------------------------

  const renderProgress = () => {
    const count = implicitAll ? airedTotal : Math.min(watched.size, airedTotal);
    const percent = airedTotal > 0 ? Math.round((count / airedTotal) * 100) : 0;
    const complete = count >= airedTotal;

    progressLabel.textContent = complete
      ? ended || implicitAll
        ? 'All watched'
        : 'Up to date'
      : `${count} of ${airedTotal} watched`;
    progressFill.style.width = `${percent}%`;
    progressBar.setAttribute('aria-valuenow', String(percent));
  };

  const renderSeasonSummary = (details: HTMLDetailsElement) => {
    const seasonNumber = Number(details.dataset.season);
    const total = Number(details.dataset.episodeCount);
    const count = implicitAll ? total : Math.min(watchedInSeason(seasonNumber), total);
    details.querySelector<HTMLElement>('[data-season-progress]')!.textContent = `${count}/${total}`;
    details.classList.toggle('is-complete', count >= total && total > 0);
  };

  const renderSeasonBody = (details: HTMLDetailsElement) => {
    const seasonNumber = Number(details.dataset.season);
    const episodes = loaded.get(seasonNumber);
    if (!episodes) return;

    const list = details.querySelector<HTMLElement>('[data-list]')!;
    details.querySelector<HTMLElement>('[data-loading]')!.hidden = true;

    const aired = episodes.filter(isAired);
    const allWatched = aired.length > 0 && aired.every((episode) => isWatched(seasonNumber, episode.episodeNumber));

    const seasonButton = details.querySelector<HTMLButtonElement>('[data-mark-season]')!;
    seasonButton.hidden = implicitAll || aired.length === 0;
    seasonButton.textContent = allWatched ? 'Unmark season' : 'Mark season as watched';

    list.replaceChildren(
      ...episodes.map((episode) => {
        const available = isAired(episode);
        const checked = isWatched(seasonNumber, episode.episodeNumber);

        const item = document.createElement('li');
        item.className = `episode${checked ? ' is-watched' : ''}${available ? '' : ' is-upcoming'}`;

        const label = document.createElement('label');
        label.className = 'episode-check';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = checked;
        input.disabled = implicitAll || !available;
        input.setAttribute('aria-label', `Season ${seasonNumber}, episode ${episode.episodeNumber}: ${episode.name}`);
        input.addEventListener('change', () => {
          void toggleEpisode(seasonNumber, episode.episodeNumber, input.checked);
        });
        const box = document.createElement('span');
        box.className = 'episode-box';
        box.innerHTML = CHECK_ICON;
        label.append(input, box);

        const still = document.createElement('div');
        still.className = 'episode-still';
        const stillSrc = posterUrl(episode.stillPath, 'w300');
        if (stillSrc) {
          const img = document.createElement('img');
          img.src = stillSrc;
          img.alt = '';
          img.loading = 'lazy';
          still.append(img);
        }

        const text = document.createElement('div');
        text.className = 'episode-text';
        const title = document.createElement('p');
        title.className = 'episode-title';
        title.textContent = `E${episode.episodeNumber} · ${episode.name}`;
        const meta = document.createElement('p');
        meta.className = 'episode-meta';
        meta.textContent = [
          episode.airDate ? (available ? formatDate(episode.airDate) : `Airs ${formatDate(episode.airDate)}`) : 'Date to be announced',
          formatRuntime(episode.runtime),
        ]
          .filter(Boolean)
          .join(' • ');
        text.append(title, meta);
        if (episode.overview) {
          const overview = document.createElement('p');
          overview.className = 'episode-overview';
          overview.textContent = episode.overview;
          text.append(overview);
        }

        item.append(label, still, text);

        if (available && !implicitAll && !checked) {
          const upTo = document.createElement('button');
          upTo.type = 'button';
          upTo.className = 'episode-upto';
          upTo.innerHTML = UP_TO_HERE_ICON;
          upTo.title = 'Mark all up to here';
          upTo.setAttribute(
            'aria-label',
            `Mark all episodes up to season ${seasonNumber}, episode ${episode.episodeNumber} as watched`,
          );
          upTo.addEventListener('click', () => void markUpTo(seasonNumber, episode.episodeNumber));
          item.append(upTo);
        }
        return item;
      }),
    );
  };

  const renderAll = () => {
    renderProgress();
    for (const details of seasonEls) {
      renderSeasonSummary(details);
      renderSeasonBody(details);
    }
  };

  // --- Alterações ---------------------------------------------------------

  // Aplica a mudança na tela primeiro e grava depois; se a gravação falhar, volta ao que está no banco.
  const apply = (episodes: EpisodeRef[], mark: boolean) =>
    enqueue(async () => {
      for (const episode of episodes) {
        const key = episodeKey(episode);
        if (mark) watched.add(key);
        else watched.delete(key);
      }
      renderAll();
      showNote(null);

      try {
        if (mark) await markEpisodesWatched(ref.tmdbId, episodes);
        else await unmarkEpisodes(ref.tmdbId, episodes);
        await syncSeriesStatus(ref, { airedTotal, ended });
      } catch (error) {
        console.error(error);
        watched = new Set(await getWatchedEpisodes(ref.tmdbId).catch(() => watched));
        renderAll();
        showNote("Couldn't save your progress. Try again.");
      }
    });

  const toggleEpisode = (seasonNumber: number, episodeNumber: number, mark: boolean) =>
    apply([{ seasonNumber, episodeNumber }], mark);

  const toggleSeason = async (details: HTMLDetailsElement) => {
    const seasonNumber = Number(details.dataset.season);
    const episodes = (await loadSeason(seasonNumber)).filter(isAired);
    const unmark = episodes.length > 0 && episodes.every((episode) => isWatched(seasonNumber, episode.episodeNumber));
    const refs = episodes.map((episode) => ({ seasonNumber, episodeNumber: episode.episodeNumber }));
    await apply(refs, !unmark);
  };

  // Marca tudo o que já foi lançado até o episódio escolhido, incluindo as temporadas anteriores.
  const markUpTo = async (seasonNumber: number, episodeNumber: number) => {
    try {
      const upTo = seasonEls.map((details) => Number(details.dataset.season)).filter((number) => number <= seasonNumber);
      const seasons = await Promise.all(upTo.map(async (number) => ({ number, episodes: await loadSeason(number) })));
      const refs: EpisodeRef[] = [];
      for (const season of seasons) {
        for (const episode of season.episodes) {
          if (!isAired(episode)) continue;
          if (season.number === seasonNumber && episode.episodeNumber > episodeNumber) continue;
          refs.push({ seasonNumber: season.number, episodeNumber: episode.episodeNumber });
        }
      }
      await apply(refs, true);
    } catch (error) {
      console.error(error);
      showNote("Couldn't load the episodes. Try again.");
    }
  };

  // --- Eventos ------------------------------------------------------------

  for (const details of seasonEls) {
    details.addEventListener('toggle', () => {
      if (!details.open) return;
      const seasonNumber = Number(details.dataset.season);
      if (loaded.has(seasonNumber)) {
        renderSeasonBody(details);
        return;
      }
      const status = details.querySelector<HTMLElement>('[data-loading]')!;
      status.hidden = false;
      status.textContent = 'Loading episodes…';
      loadSeason(seasonNumber).then(
        () => renderSeasonBody(details),
        (error) => {
          console.error(error);
          status.textContent = "Couldn't load the episodes. Close and open the season to try again.";
        },
      );
    });
    details.querySelector<HTMLButtonElement>('[data-mark-season]')!.addEventListener('click', (event) => {
      const button = event.currentTarget as HTMLButtonElement;
      button.disabled = true;
      toggleSeason(details)
        .catch((error) => {
          console.error(error);
          showNote("Couldn't load the episodes. Try again.");
        })
        .finally(() => (button.disabled = false));
    });
  }

  // O status pode mudar por fora (dropdown de status, sincronização): reavalia o modo da tela.
  const loadState = async () => {
    const [set, status] = await Promise.all([getWatchedEpisodes(ref.tmdbId), getTitleStatus(ref)]);
    watched = new Set(set);
    implicitAll = watched.size === 0 && status.has('watched');
    root.classList.toggle('is-readonly', implicitAll);
    showNote(implicitAll ? 'You marked this series as watched.' : null);
    renderAll();
  };

  const onListsChanged = () => {
    if (!root.isConnected) {
      window.removeEventListener(LISTS_CHANGED_EVENT, onListsChanged);
      return;
    }
    void enqueue(loadState).catch(console.error);
  };
  window.addEventListener(LISTS_CHANGED_EVENT, onListsChanged);

  loadState().catch((error) => {
    // Sem sessão ou sem rede: as temporadas continuam visíveis, sem estado de progresso.
    console.error(error);
    progressLabel.textContent = '';
  });
}
