// País da pessoa (código ISO de 2 letras, ex.: BR, US). Vem da geolocalização do navegador (ver locate.ts),
// fica num cookie lido no servidor e decide streamings, cinemas e datas de estreia.
import { localeOf, type Lang } from '../i18n';

export const REGION_COOKIE = 'aurora_region';
// Usado quando ainda não sabemos onde a pessoa está (sem permissão, sem cookie).
export const DEFAULT_REGION = 'BR';

export const isRegion = (value: unknown): value is string => typeof value === 'string' && /^[A-Z]{2}$/.test(value);
export const toRegion = (value: unknown): string => (isRegion(value) ? value : DEFAULT_REGION);

// Nome do país no idioma da interface (ex.: "Brazil" / "Brasil").
export const countryName = (region: string, lang: Lang): string => {
  try {
    return new Intl.DisplayNames([localeOf(lang)], { type: 'region' }).of(region) ?? region;
  } catch {
    return region;
  }
};

// No cliente, o país renderizado pelo servidor vem no <html data-region>.
export const currentRegion = (): string =>
  typeof document !== 'undefined' ? toRegion(document.documentElement.dataset.region) : DEFAULT_REGION;
