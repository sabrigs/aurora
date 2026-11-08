import type { APIRoute } from 'astro';
import { requireUser } from '../../../../../lib/auth/require-user';
import { getAiredEpisodes } from '../../../../../lib/tmdb/episodes';

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

// Episódios já lançados da série (só temporada e número). Usado ao marcar a série inteira como assistida
// e para calcular o próximo episódio dos cards de "Watching".
export const GET: APIRoute = async ({ request, params }) => {
  const denied = await requireUser(request);
  if (denied) return denied;

  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) {
    return json({ error: 'invalid_title' }, 400);
  }

  try {
    return json(await getAiredEpisodes(id), 200, { 'cache-control': 'private, max-age=3600' });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('TMDB 404')) {
      return json({ error: 'not_found' }, 404);
    }
    console.error(error);
    return json({ error: 'upstream_error' }, 502);
  }
};
