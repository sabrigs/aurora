import { createClient } from '@supabase/supabase-js'
import { enforceIdleLimit, sessionStorageKey, touchActivity } from './auth/gate'

// Acesso guardado por 30 dias: quem não usa o Aurora neste navegador nesse período volta ao login.
// Precisa rodar antes de o cliente ler a sessão guardada.
enforceIdleLimit()

export const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: true, autoRefreshToken: true } }
)

// Sessão que não se perde por causa da rede.
// No iPhone (principalmente no app instalado na tela inicial), ao voltar para o Aurora depois de um tempo, a
// rede ainda está "acordando" e a renovação do acesso falha uma vez. O supabase-js mantém a sessão guardada, mas
// devolve `session: null` e guarda a falha por ~60s; sem tratamento, toda tela entendia isso como "deslogado" e
// mandava para o login. Aqui, se há sessão guardada e a falha foi só de rede, o Aurora renova por conta própria,
// com novas tentativas, e só considera deslogado quando o servidor recusa a renovação de verdade.
const storageKey = sessionStorageKey(import.meta.env.PUBLIC_SUPABASE_URL)
// O supabase-js já tentou por ~30s antes de falhar; aqui são só mais algumas tentativas rápidas.
const RETRY_DELAYS_MS = [0, 2000, 5000]

const readStoredSession = () => {
  try {
    return JSON.parse(localStorage.getItem(storageKey) ?? 'null')
  } catch {
    return null
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Devolve { session } renovada, { session: stored } se a rede segue fora (a pessoa continua "logada" e as
// chamadas é que falham, mostrando o erro da tela), ou null quando o servidor recusou (sessão realmente acabou).
async function recoverSession() {
  for (const delay of RETRY_DELAYS_MS) {
    if (delay) await sleep(delay)

    const stored = readStoredSession()
    if (!stored?.refresh_token) return null

    try {
      const response = await fetch(`${import.meta.env.PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { apikey: import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY, 'content-type': 'application/json' },
        body: JSON.stringify({ refresh_token: stored.refresh_token }),
      })

      if (response.ok) {
        const tokens = await response.json()
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
          })
          if (!error && data.session) return { session: data.session }
        } catch {
          // O cliente pode estar com a trava de sessão presa (acontece ao voltar de uma suspensão no iOS).
        }

        // Os tokens novos já foram emitidos (e o antigo ficou gasto): grava direto, para não perdê-los.
        const session = { ...tokens, expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in }
        localStorage.setItem(storageKey, JSON.stringify(session))
        return { session }
      } else if (response.status === 400 || response.status === 401 || response.status === 403) {
        return null
      }
    } catch {
      // Rede ainda indisponível: tenta de novo.
    }
  }

  const stored = readStoredSession()
  return stored?.refresh_token ? { session: stored } : null
}

const loadSession = supabase.auth.getSession.bind(supabase.auth)
let recovering = null

supabase.auth.getSession = async () => {
  const result = await loadSession()
  if (result.data.session || !result.error || !readStoredSession()?.refresh_token) return result

  recovering ??= recoverSession().finally(() => {
    recovering = null
  })
  const recovered = await recovering
  if (recovered) return { data: { session: recovered.session }, error: null }

  // O servidor recusou a renovação: a sessão acabou de verdade.
  await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
  return { data: { session: null }, error: null }
}

// Quem deixa a aba aberta também conta como uso: renova o prazo ao voltar para ela.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') touchActivity()
})
document.addEventListener('astro:page-load', touchActivity)

// Somente em desenvolvimento: entra sozinho com um usuário de teste, sem passar pela tela de login.
// Defina PUBLIC_DEV_EMAIL e PUBLIC_DEV_PASSWORD no .env.local. Sem eles, o login segue normal.
const devEmail = import.meta.env.PUBLIC_DEV_EMAIL
const devPassword = import.meta.env.PUBLIC_DEV_PASSWORD

if (import.meta.env.DEV && devEmail && devPassword) {
  const getSession = supabase.auth.getSession.bind(supabase.auth)
  let ready = null

  supabase.auth.getSession = async () => {
    ready ??= (async () => {
      const { data } = await getSession()
      if (!data.session) {
        const { error } = await supabase.auth.signInWithPassword({ email: devEmail, password: devPassword })
        if (error) console.error('Login automático de dev falhou:', error.message)
      }
    })()
    await ready
    return getSession()
  }
}
