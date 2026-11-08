import type { APIRoute } from 'astro';
import { requireUser } from '../../lib/auth/require-user';
import { getOnTheater, getTitleDetails, getTrending, searchTitles, type TitlePage } from '../../lib/tmdb/titles';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

// Tabs do Explore e busca, paginados para o scroll infinito.
export const GET: APIRoute = async ({ request, url }) => {
  const denied = await requireUser(request);
  if (denied) return denied;

  const tab = url.searchParams.get('tab');
  const page = Math.min(Math.max(Number(url.searchParams.get('page') ?? '1') || 1, 1), 500);

  let result: TitlePage;
  try {
    switch (tab) {
      case 'trending':
        result = await getTrending(page);
        break;
      case 'theater': {
        const region = url.searchParams.get('region') ?? '';
        if (!/^[A-Z]{2}$/.test(region)) {
          return json({ error: 'invalid_region' }, 400);
        }
        result = await getOnTheater(region, page);
        break;
      }
      case 'search': {
        const query = (url.searchParams.get('q') ?? '').trim();
        if (query.length === 0 || query.length > 100) {
          return json({ error: 'invalid_query' }, 400);
        }
        result = await searchTitles(query, page);
        break;
      }
      default:
        return json({ error: 'invalid_tab' }, 400);
    }
  } catch (error) {
    console.error(error);
    return json({ error: 'upstream_error' }, 502);
  }

  // Duração e gênero não vêm nas listagens: busca nos detalhes (cacheados). Se falhar, o card segue sem eles.
  const items = await Promise.all(
    result.items.map(async (item) => {
      try {
        const details = await getTitleDetails(item.mediaType, item.id);
        return { ...item, runtime: details.runtime, genre: details.genres[0] ?? null, status: details.status, seasons: details.seasons };
      } catch {
        return { ...item, runtime: null, genre: null, status: '', seasons: 0 };
      }
    }),
  );

  return json({ ...result, items });
};
