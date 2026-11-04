import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY
)

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
