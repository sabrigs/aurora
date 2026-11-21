import { redDark, blueDark, amberDark } from '@radix-ui/colors';
import { primitiveTokens } from './primitives';

// Tokens semânticos da Aurora (só dark). Neutros e destaque (gray, indigo, white) apontam para os
// primitivos de primitives.ts via var(); as demais escalas vêm direto do Radix Colors.
// Os passos seguem as regras de acessibilidade do Radix:
//   1–2  fundos · 3–5 superfícies e estados · 6–8 bordas e foco
//   9    cor sólida · 11 texto de baixo contraste · 12 texto principal

export type Palette = Record<string, string>;

// Escalas auxiliares.
const danger = redDark;
const info = blueDark;
const warning = amberDark;

// Referências aos primitivos.
const gray = (step: number) => `var(--gray-${step})`;
const indigo = (step: number) => `var(--indigo-${step})`;

export const semanticTokens = (): Record<string, string> => {
  const d: Palette = danger;
  const i: Palette = info;
  const w: Palette = warning;

  return {
    // Superfícies
    '--color-bg': gray(1),
    '--color-surface': gray(2),
    '--color-surface-raised': gray(3),
    '--color-surface-hover': gray(4),
    '--color-border': gray(6),
    '--color-border-strong': gray(7),
    '--color-focus': gray(8),

    // Texto
    '--color-text': gray(12),
    '--color-text-muted': gray(11),
    // Um degrau abaixo do muted: sinopses e datas, para não competir com o título.
    '--color-text-subtle': gray(10),

    // Ação primária (ex.: "Continue with email"): indigo com texto branco
    '--color-solid': indigo(9),
    '--color-solid-hover': indigo(10),
    '--color-on-solid': 'var(--white)',

    // O verde da Aurora: único para tudo que é positivo (badge de "adicionado", checks de episódio,
    // barra de progresso, situação "Ongoing", chips de status). Os demais tokens derivam dele.
    '--color-added': '#346d3f',
    '--color-success-solid': 'var(--color-added)',
    '--color-success-bg': 'color-mix(in srgb, var(--color-added) 30%, transparent)',
    '--color-success-border': 'color-mix(in srgb, var(--color-added) 70%, transparent)',
    // Texto verde sobre fundo escuro: o mesmo tom, clareado para manter a leitura.
    '--color-success-text': 'color-mix(in srgb, var(--color-added) 50%, white)',

    // Seleção (checkboxes marcados)
    '--color-selected': indigo(9),

    // Erro (ex.: mensagem abaixo do campo de e-mail)
    '--color-danger-bg': d.red3,
    '--color-danger-border': d.red6,
    '--color-danger-text': d.red11,

    // Informação, aviso e acento (reservados para uso futuro)
    '--color-info-text': i.blue11,
    '--color-warning-text': w.amber11,
    '--color-accent-solid': indigo(9),
    '--color-accent-text': indigo(11),
  };
};

const toCss = (selector: string, tokens: Record<string, string>) =>
  `${selector} {\n${Object.entries(tokens)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n')}\n}`;

// Fontes: Source Serif 4 para títulos e Inter para o corpo (Google Fonts, carregadas no Layout).
const fontTokens = {
  '--font-serif': "'Source Serif 4', Georgia, serif",
  '--font-sans': "'Inter', system-ui, -apple-system, sans-serif",
};

// CSS completo dos tokens (a plataforma é só dark).
export const themeCss = () =>
  toCss(':root', {
    'color-scheme': 'dark',
    ...fontTokens,
    ...primitiveTokens,
    ...semanticTokens(),
  });
