// Proteção das rotas /api: exige um usuário logado (token do Supabase no header Authorization)
// e limita as chamadas por usuário, para que a API não vire um proxy aberto da cota da TMDB.
import { createClient } from '@supabase/supabase-js';

const verifier = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

// Tokens já validados ficam em memória por pouco tempo, para não consultar o Supabase a cada chamada.
const TOKEN_TTL_MS = 60 * 1000;
const TOKEN_CACHE_MAX = 1000;
const verified = new Map<string, { userId: string; expires: number }>();

// Janela fixa de 1 minuto por usuário. Vale por instância do servidor (suficiente contra abuso simples).
const RATE_LIMIT = 240;
const RATE_WINDOW_MS = 60 * 1000;
const hits = new Map<string, { count: number; resetAt: number }>();

const json = (body: unknown, status: number, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers },
  });

function allow(userId: string): number | null {
  const now = Date.now();
  const entry = hits.get(userId);
  if (!entry || entry.resetAt <= now) {
    if (hits.size > TOKEN_CACHE_MAX) hits.clear();
    hits.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return null;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT ? Math.ceil((entry.resetAt - now) / 1000) : null;
}

// Retorna uma Response de erro (401/429) ou null quando a chamada pode seguir.
export async function requireUser(request: Request): Promise<Response | null> {
  const token = /^Bearer (.+)$/i.exec(request.headers.get('authorization') ?? '')?.[1];
  if (!token) return json({ error: 'unauthorized' }, 401);

  const cached = verified.get(token);
  let userId = cached && cached.expires > Date.now() ? cached.userId : null;
  if (!userId) {
    const { data, error } = await verifier.auth.getUser(token);
    if (error || !data.user) return json({ error: 'unauthorized' }, 401);
    userId = data.user.id;
    if (verified.size >= TOKEN_CACHE_MAX) verified.clear();
    verified.set(token, { userId, expires: Date.now() + TOKEN_TTL_MS });
  }

  const retryAfter = allow(userId);
  if (retryAfter !== null) {
    return json({ error: 'rate_limited' }, 429, { 'retry-after': String(retryAfter) });
  }
  return null;
}
