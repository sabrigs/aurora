import type { APIRoute } from 'astro';
import { requireUser } from '../../lib/auth/require-user';
import { getOnTheater, getTitleDetails, getTrending, searchTitles, type TitlePage } from '../../lib/tmdb/titles';
import { getCardProviders, getTitleStreamingProviders } from '../../lib/streaming/availability';

const json = (body: unknown, status = 200, cacheControl = 'no-store') =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': cacheControl },
  });

// Feed do Explore (trending) e busca, paginados para o scroll infinito.
// Filtros opcionais: `category` (movie | tv) e `providers` (marcas de streaming, separadas por vírgula):
// com `providers`, só voltam títulos disponíveis em algum deles no Brasil.
export const GET: APIRoute = async ({ request, url }) => {
  const denied = await requireUser(request);
  if (denied) return denied;

  const tab = url.searchParams.get('tab');
  const page = Math.min(Math.max(Number(url.searchParams.get('page') ?? '1') || 1, 1), 500);

  const categoryParam = url.searchParams.get('category');
  const category = categoryParam === 'movie' || categoryParam === 'tv' ? categoryParam : undefined;

  const providersParam = url.searchParams.get('providers');
  // Compara pela marca (ex.: "HBO Max"), não pelo id: a TMDB tem ids diferentes para a mesma marca.
  const providerBrands = providersParam
    ? new Set(
        providersParam
          .split(',')
          .map((name) => name.trim())
          .filter((name) => name.length > 0 && name.length <= 40)
          .slice(0, 30),
      )
    : null;

  let result: TitlePage;
  try {
    switch (tab) {
      case 'trending':
        result = await getTrending(page, category);
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
        result = await searchTitles(query, page, category);
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
  const enriched = await Promise.all(
    result.items.map(async (item) => {
      // Filtro "Just mine": descarta o título se nenhum dos streamings do usuário o oferece.
      if (providerBrands) {
        const available = await getTitleStreamingProviders(item.mediaType, item.id).catch(() => []);
        if (!available.some((provider) => providerBrands.has(provider.name))) return null;
      }

      const providers = await getCardProviders(item.mediaType, item.id);

      try {
        const details = await getTitleDetails(item.mediaType, item.id);
        return { ...item, providers, runtime: details.runtime, genre: details.genres[0] ?? null, status: details.status, seasons: details.seasons, year: details.year, lastSeasonYear: details.lastSeasonYear };
      } catch {
        return { ...item, providers, runtime: null, genre: null, status: '', seasons: 0, year: null, lastSeasonYear: null };
      }
    }),
  );

  const items = enriched.filter((item) => item !== null);

  // Catálogo muda devagar: o navegador reaproveita a resposta por 5 minutos (evita refazer tudo ao atualizar a página).
  return json({ ...result, items }, 200, 'private, max-age=300');
};
