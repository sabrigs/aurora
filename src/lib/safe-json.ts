// JSON para embutir em <script type="application/json">: escapa "<" e separadores de linha,
// para que nenhum texto vindo de fora (ex.: nome de provedor da TMDB) feche a tag ou injete HTML.
const LINE_SEPARATORS = new RegExp('[\\u2028\\u2029]', 'g');

export const safeJson = (value: unknown) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(LINE_SEPARATORS, (char) => `\\u${char.charCodeAt(0).toString(16)}`);
