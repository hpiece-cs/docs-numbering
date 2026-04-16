const TOKEN = /\{(\w+)(?::([^}]+))?\}/g;
const SENTINEL = '\x00';

function formatValue(value, spec) {
  if (!spec) return String(value);
  const m = spec.match(/^0(\d+)d$/);
  if (m && typeof value === 'number') {
    return String(value).padStart(Number(m[1]), '0');
  }
  return String(value);
}

export function renderPattern(pattern, vars) {
  let out = pattern.replace(TOKEN, (_, key, spec) => {
    const v = vars[key];
    if (v === undefined || v === null || v === '') return '';
    let formatted = formatValue(v, spec);
    if (key === 'filename') {
      formatted = formatted.replace(/-/g, SENTINEL);
    }
    return formatted;
  });
  out = out.replace(/-+/g, '-').replace(/-\./g, '.').replace(/^-/, '');
  out = out.replace(new RegExp(SENTINEL, 'g'), '-');
  return out;
}
