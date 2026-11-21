import { grayDark, indigoDark } from '@radix-ui/colors';

// Tokens primitivos da Aurora: valores brutos, sem significado de uso.
// A plataforma é só dark, então usamos apenas as escalas dark do Radix Colors (passos 1–12).
//   --gray-1…12    neutro, usado em quase toda a interface
//   --indigo-1…12  cor de destaque (accent)
//   --white        branco puro
// Os tokens semânticos (tokens.ts) referenciam estes primitivos via var().

export const white = '#ffffff';

// A API do Radix nomeia os passos "gray1", "indigo9"…; aqui viram "--gray-1", "--indigo-9".
const toPrimitives = (scale: Record<string, string>, name: string) =>
  Object.fromEntries(
    Object.entries(scale).map(([key, value]) => [`--${name}-${key.slice(name.length)}`, value]),
  );

export const primitiveTokens: Record<string, string> = {
  ...toPrimitives(grayDark, 'gray'),
  ...toPrimitives(indigoDark, 'indigo'),
  '--white': white,
};
