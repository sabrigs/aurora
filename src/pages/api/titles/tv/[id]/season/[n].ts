import type { APIRoute } from 'astro';
import { requireUser } from '../../../../../../lib/auth/require-user';
import { getSeasonEpisodes } from '../../../../../../lib/tmdb/episodes';

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

// Episódios de uma temporada de série (usado pela seção "Episodes" da tela de detalhes). Cacheado pela TMDB client.
export const GET: APIRoute = async ({ request, params }) => {
  const denied = await requireUser(request);
  if (denied) return denied;

  const id = Number(params.id);
  const seasonNumber = Number(params.n);
  if (!Number.isInteger(id) || id < 1 || !Number.isInteger(seasonNumber) || seasonNumber < 1 || seasonNumber > 1000) {
    return json({ error: 'invalid_season' }, 400);
  }

  try {
    const episodes = await getSeasonEpisodes(id, seasonNumber);
    return json({ episodes }, 200, { 'cache-control': 'private, max-age=3600' });
  } catch (error) {
    // A TMDB responde 404 para série ou temporada que não existe.
    if (error instanceof Error && error.message.startsWith('TMDB 404')) {
      return json({ error: 'not_found' }, 404);
    }
    console.error(error);
    return json({ error: 'upstream_error' }, 502);
  }
};
