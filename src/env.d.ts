/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    // Idioma da interface (cookie aurora_lang).
    lang: import('./lib/i18n').Lang;
    // País da pessoa (cookie aurora_region, vindo da geolocalização).
    region: string;
  }
}
