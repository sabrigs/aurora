import type { APIRoute } from 'astro';
import { requireUser } from '../../../../../lib/auth/require-user';
import { getFullCast } from '../../../../../lib/tmdb/titles';
import type { MediaType } from '../../../../../lib/tmdb/client';

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

// Elenco completo do título (botão "Show all" da seção Cast). Cacheado pela TMDB client.
export const GET: APIRoute = async ({ request, params }) => {
  const denied = await requireUser(request);
  if (denied) return denied;

  const mediaType = params.mediaType;
  const id = Number(params.id);
  if ((mediaType !== 'movie' && mediaType !== 'tv') || !Number.isInteger(id) || id < 1) {
    return json({ error: 'invalid_title' }, 400);
  }

  try {
    const cast = await getFullCast(mediaType as MediaType, id);
    return json({ cast }, 200, { 'cache-control': 'private, max-age=3600' });
  } catch (error) {
    console.error(error);
    return json({ error: 'upstream_error' }, 502);
  }
};
