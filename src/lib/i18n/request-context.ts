// Idioma e país da requisição em andamento (só servidor). O middleware define; as chamadas à TMDB leem daqui,
// sem precisar passar os valores por todas as funções.
import { AsyncLocalStorage } from 'node:async_hooks';
import { DEFAULT_LANG, type Lang } from './index';
import { DEFAULT_REGION } from '../region';

interface RequestContext {
  lang: Lang;
  region: string;
}

export const requestStore = new AsyncLocalStorage<RequestContext>();

export const requestLang = (): Lang => requestStore.getStore()?.lang ?? DEFAULT_LANG;
export const requestRegion = (): string => requestStore.getStore()?.region ?? DEFAULT_REGION;
