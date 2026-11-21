// Disponibilidade de títulos por streaming, usando os "watch providers" da TMDB.
// Os dados vêm do JustWatch, que é a fonte de disponibilidade da TMDB.
import { tmdbFetch, type MediaType } from '../tmdb/client';
import { groupByBrand } from './canonical';
import { requestRegion } from '../i18n/request-context';

export interface StreamingProvider {
  id: number;
  name: string;
  logoPath: string | null;
  displayPriority: number;
}

interface RawProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority: number;
  // Só na lista de provedores: a prioridade em cada país (a global, acima, é só um padrão).
  display_priorities?: Record<string, number>;
}

interface ProvidersResponse {
  results: RawProvider[];
}

interface TitleProvidersResponse {
  results: Record<string, { flatrate?: RawProvider[] } | undefined>;
}

const toProvider = (raw: RawProvider, region?: string): StreamingProvider => ({
  id: raw.provider_id,
  name: raw.provider_name,
  logoPath: raw.logo_path,
  // Na lista de um país vale a prioridade daquele país.
  displayPriority: (region && raw.display_priorities?.[region]) ?? raw.display_priority,
});

// Streamings oferecidos no onboarding e no menu "My streamings". Os nomes são os da TMDB.
// Principais serviços: aparecem quando existem no país da pessoa.
const FEATURED_BRANDS = new Set([
  'Amazon Prime Video',
  'Apple TV',
  'Crunchyroll',
  'Disney Plus',
  'Globoplay',
  'HBO Max',
  'MUBI',
  'Netflix',
]);

// Além dos principais, entram os serviços mais relevantes do país (pela prioridade da TMDB), sem lojas de
// aluguel/compra, agregadores e versões gratuitas com anúncios, que não são assinaturas.
const NOT_A_SUBSCRIPTION = /justwatch|\bstore\b|\bfree\b|with ads|amazon video|google play|youtube|\bbeta\b/i;
const MAX_REGIONAL_EXTRAS = 5;

// Os streamings do país da pessoa, em ordem alfabética: os principais que existem lá + os mais relevantes de lá.
// Quem já escolheu outros serviços (ex.: em outro país) os mantém: o menu soma os salvos a esta lista.
export async function getRegionProviders(mediaType: MediaType = 'movie'): Promise<StreamingProvider[]> {
  const region = requestRegion();
  const data = await tmdbFetch<ProvidersResponse>(`/watch/providers/${mediaType}`, { watch_region: region });

  // groupByBrand devolve um por marca, do mais para o menos relevante no país.
  const brands = groupByBrand(data.results.map((raw) => toProvider(raw, region)));
  const featured = brands.filter((provider) => FEATURED_BRANDS.has(provider.name));
  const extras = brands
    .filter((provider) => !FEATURED_BRANDS.has(provider.name) && !NOT_A_SUBSCRIPTION.test(provider.name))
    .slice(0, MAX_REGIONAL_EXTRAS);

  return [...featured, ...extras].sort((a, b) => a.name.localeCompare(b.name));
}

// Detalhes → "Available on" e filtro das listas: streamings com assinatura no país da pessoa.
export async function getTitleStreamingProviders(
  mediaType: MediaType,
  id: number,
): Promise<StreamingProvider[]> {
  const data = await tmdbFetch<TitleProvidersResponse>(`/${mediaType}/${id}/watch/providers`);
  const inRegion = data.results[requestRegion()]?.flatrate ?? [];

  return groupByBrand(inRegion.map(toProvider));
}

// Streamings (marca + logo) em que o título está no país da pessoa, para os cards. Traz até 4: os 3 primeiros
// viram logos e o 4º só indica que há mais ("+"). Sem dados ou com erro, devolve lista vazia.
export interface CardProvider {
  name: string;
  logoPath: string | null;
}

export async function getCardProviders(mediaType: MediaType, id: number): Promise<CardProvider[]> {
  try {
    const providers = await getTitleStreamingProviders(mediaType, id);
    return providers.slice(0, 4).map(({ name, logoPath }) => ({ name, logoPath }));
  } catch {
    return [];
  }
}
