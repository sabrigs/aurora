import { defineMiddleware } from 'astro:middleware';
import { LANG_COOKIE, toLang } from './lib/i18n';
import { requestStore } from './lib/i18n/request-context';
import { REGION_COOKIE, toRegion } from './lib/region';

// Lê idioma e país dos cookies, expõe em Astro.locals e os deixa disponíveis para as chamadas à TMDB.
export const onRequest = defineMiddleware((context, next) => {
  const lang = toLang(context.cookies.get(LANG_COOKIE)?.value);
  const region = toRegion(context.cookies.get(REGION_COOKIE)?.value);
  context.locals.lang = lang;
  context.locals.region = region;
  return requestStore.run({ lang, region }, () => next());
});
