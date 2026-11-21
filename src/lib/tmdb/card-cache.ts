// Cache local (localStorage) dos dados dos cards: backdrop, nota, duração, anos etc. Esses dados mudam
// pouco, então as telas pintam o card na hora, sem esperar a API, e só buscam o que falta.
export interface CardSummary {
  backdropPath: string | null;
  voteAverage: number;
  runtime: number | null;
  genre: string | null;
  status: string;
  seasons: number;
  year: number | null;
  lastSeasonYear: number | null;
  // Streamings do título no Brasil (até 4).
  providers: { name: string; logoPath: string | null }[];
}

const PREFIX = 'aurora:card:v2:';
const TTL_MS = 24 * 60 * 60 * 1000;

const keyFor = (mediaType: string, id: number) => `${PREFIX}${mediaType}:${id}`;

export function readCardSummary(mediaType: string, id: number): CardSummary | null {
  try {
    const raw = localStorage.getItem(keyFor(mediaType, id));
    if (!raw) return null;
    const entry = JSON.parse(raw) as { at: number; summary: CardSummary };
    if (Date.now() - entry.at > TTL_MS) {
      localStorage.removeItem(keyFor(mediaType, id));
      return null;
    }
    // Entrada sem a lista de streamings (gravada por uma resposta antiga): descarta e busca de novo.
    if (!Array.isArray(entry.summary.providers)) return null;
    return entry.summary;
  } catch {
    return null;
  }
}

export function writeCardSummary(mediaType: string, id: number, summary: CardSummary) {
  try {
    localStorage.setItem(keyFor(mediaType, id), JSON.stringify({ at: Date.now(), summary }));
  } catch {
    // Armazenamento cheio ou indisponível: segue sem cache.
  }
}
