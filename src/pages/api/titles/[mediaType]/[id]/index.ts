import type { APIRoute } from 'astro';
import { requireUser } from '../../../../../lib/auth/require-user';
import { getTitleDetails } from '../../../../../lib/tmdb/titles';
import { getCardProviders } from '../../../../../lib/streaming/availability';
import type { MediaType } from '../../../../../lib/tmdb/client';

// Dados resumidos de um título para os cards (backdrop, pôster, nota, duração e gênero). Cacheado pela TMDB client.
export const GET: APIRoute = async ({ request, params }) => {
  const denied = await requireUser(request);
  if (denied) return denied;

  const mediaType = params.mediaType;
  const id = Number(params.id);

  if ((mediaType !== 'movie' && mediaType !== 'tv') || !Number.isInteger(id)) {
    return new Response(JSON.stringify({ error: 'invalid_title' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const [details, providers] = await Promise.all([
      getTitleDetails(mediaType as MediaType, id),
      getCardProviders(mediaType as MediaType, id),
    ]);
    return new Response(
      JSON.stringify({
        // Título e pôster já no idioma da interface (quando a TMDB tem tradução).
        title: details.title,
        backdropPath: details.backdropPath,
        posterPath: details.posterPath,
        voteAverage: details.voteAverage,
        runtime: details.runtime,
        genre: details.genres[0] ?? null,
        status: details.status,
        seasons: details.seasons,
        year: details.year,
        lastSeasonYear: details.lastSeasonYear,
        providers,
      }),
      {
        headers: {
          'content-type': 'application/json',
          'cache-control': 'private, max-age=600',
          vary: 'cookie',
        },
      },
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'upstream_error' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
};
