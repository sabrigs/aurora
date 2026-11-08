// fetch para as rotas /api do Aurora: anexa o token da sessão do usuário (as rotas exigem login).
import { supabase } from './supabase.js';

export async function apiFetch(input: string): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return fetch(input, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
}
