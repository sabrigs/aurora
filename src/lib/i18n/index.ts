// Idiomas da plataforma. O idioma escolhido fica num cookie (lido no servidor, para a TMDB e o HTML) e o
// <html lang> da página carrega o valor para o código do cliente. Trocar o idioma recarrega a página.
import { messages } from './messages';

export type Lang = 'en' | 'pt-BR';

export const DEFAULT_LANG: Lang = 'en';
export const LANG_COOKIE = 'aurora_lang';
export const LANGS: Lang[] = ['en', 'pt-BR'];

export const isLang = (value: unknown): value is Lang => value === 'en' || value === 'pt-BR';
export const toLang = (value: unknown): Lang => (isLang(value) ? value : DEFAULT_LANG);

// Código de idioma da TMDB: traz título, sinopse, pôster e gêneros traduzidos quando existem.
export const tmdbLanguage = (lang: Lang) => (lang === 'pt-BR' ? 'pt-BR' : 'en-US');

// Locale para datas e números.
export const localeOf = (lang: Lang) => (lang === 'pt-BR' ? 'pt-BR' : 'en-US');

type Params = Record<string, string | number>;

// Texto da interface em um idioma. `{nome}` é trocado pelos parâmetros. Sem tradução, cai no inglês.
export function translate(lang: Lang, key: string, params?: Params): string {
  const template = messages[lang][key] ?? messages.en[key] ?? key;
  return params ? template.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`)) : template;
}

// No cliente, o idioma vem do <html lang> renderizado pelo servidor.
export const currentLang = (): Lang =>
  typeof document !== 'undefined' ? toLang(document.documentElement.lang) : DEFAULT_LANG;

export const t = (key: string, params?: Params, lang: Lang = currentLang()) => translate(lang, key, params);

// No servidor (páginas e componentes): const tr = serverT(Astro.locals); tr('chave').
export const serverT = (locals: { lang?: Lang }) => {
  const lang = toLang(locals.lang);
  return (key: string, params?: Params) => translate(lang, key, params);
};

// Grava o idioma e recarrega: o conteúdo (títulos, pôsteres, textos) vem do servidor no idioma novo.
export function setLang(lang: Lang) {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  window.location.reload();
}
