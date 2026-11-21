import { defineMiddleware } from 'astro:middleware';
import { LANG_COOKIE, toLang } from './lib/i18n';
import { langStore } from './lib/i18n/request-lang';

// Lê o idioma do cookie, expõe em Astro.locals.lang e o deixa disponível para as chamadas à TMDB.
export const onRequest = defineMiddleware((context, next) => {
  const lang = toLang(context.cookies.get(LANG_COOKIE)?.value);
  context.locals.lang = lang;
  return langStore.run(lang, () => next());
});
