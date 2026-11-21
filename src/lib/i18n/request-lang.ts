// Idioma da requisição em andamento (só servidor). O middleware define; as chamadas à TMDB leem daqui,
// sem precisar passar o idioma por todas as funções.
import { AsyncLocalStorage } from 'node:async_hooks';
import { DEFAULT_LANG, type Lang } from './index';

export const langStore = new AsyncLocalStorage<Lang>();

export const requestLang = (): Lang => langStore.getStore() ?? DEFAULT_LANG;
