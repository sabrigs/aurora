// Descobre o país da pessoa pela geolocalização do navegador (pede permissão) e o grava no cookie.
// Se o país mudou em relação ao que o servidor renderizou, recarrega a página para mostrar os streamings,
// cinemas e datas do país novo. As coordenadas vão a /api/region, que devolve só o código do país.
import { apiFetch } from '../api';
import { currentRegion, isRegion, REGION_COOKIE } from './index';

const ASKED_KEY = 'aurora:region-asked';
const COOKIE_DAYS = 30;

const hasRegionCookie = () => document.cookie.split('; ').some((entry) => entry.startsWith(`${REGION_COOKIE}=`));

const saveRegion = (region: string) => {
  document.cookie = `${REGION_COOKIE}=${region}; path=/; max-age=${COOKIE_DAYS * 86400}; samesite=lax`;
};

type Located = { status: 'ok'; region: string } | { status: 'failed' } | { status: 'signed-out' };

const locate = () =>
  new Promise<Located>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await apiFetch(
            `/api/region?lat=${position.coords.latitude}&lng=${position.coords.longitude}`,
          );
          if (response.status === 401) return resolve({ status: 'signed-out' });
          const data = (await response.json()) as { region?: string | null };
          resolve(isRegion(data.region) ? { status: 'ok', region: data.region } : { status: 'failed' });
        } catch {
          resolve({ status: 'failed' });
        }
      },
      () => resolve({ status: 'failed' }),
      { maximumAge: 60 * 60 * 1000, timeout: 10_000 },
    );
  });

let running = false;

// Chamado nas telas do app. Sem cookie, pede a permissão; com cookie, só renova (sem perguntar) quando a
// permissão já foi dada, uma vez por sessão. Negada ou indisponível: segue com o país padrão ou o último salvo.
export async function ensureRegion() {
  if (running || !navigator.geolocation) return;
  if (sessionStorage.getItem(ASKED_KEY)) return;

  const permission = await navigator.permissions?.query({ name: 'geolocation' }).catch(() => undefined);
  if (permission?.state === 'denied') return;
  if (hasRegionCookie() && permission?.state !== 'granted') return;

  running = true;
  try {
    const result = await locate();
    if (result.status === 'signed-out') return; // tenta de novo quando houver sessão
    sessionStorage.setItem(ASKED_KEY, '1');
    if (result.status !== 'ok') return;

    saveRegion(result.region);
    if (result.region !== currentRegion()) window.location.reload();
  } finally {
    running = false;
  }
}
