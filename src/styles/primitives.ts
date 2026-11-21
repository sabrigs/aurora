import { gray, grayDark, indigo, indigoDark } from '@radix-ui/colors';

// Tokens primitivos da Aurora: valores brutos, sem significado de uso.
// Escalas do Radix Colors (passos 1–12) + branco puro.
//   --gray-1…12    neutro, usado em quase toda a interface
//   --indigo-1…12  cor de destaque (accent)
//   --white        branco puro, igual nos dois temas
// Os tokens semânticos (tokens.ts) referenciam estes primitivos via var().

export type Theme = 'dark' | 'light';

export const white = '#ffffff';

const scales = {
  dark: { gray: grayDark, indigo: indigoDark },
  light: { gray: gray, indigo: indigo },
} as const;

// A API do Radix nomeia os passos "gray1", "indigo9"…; aqui viram "--gray-1", "--indigo-9".
const toPrimitives = (scale: Record<string, string>, name: string) =>
  Object.fromEntries(
    Object.entries(scale).map(([key, value]) => [`--${name}-${key.slice(name.length)}`, value]),
  );

export const primitiveTokens = (theme: Theme): Record<string, string> => ({
  ...toPrimitives(scales[theme].gray, 'gray'),
  ...toPrimitives(scales[theme].indigo, 'indigo'),
  '--white': white,
});
