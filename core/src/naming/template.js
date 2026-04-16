const TOKEN = /\{(\w+)(?::([^}]+))?\}/g;

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
    return formatValue(v, spec);
  });
  out = out.replace(/-+/g, '-').replace(/-\./g, '.').replace(/^-/, '');
  return out;
}
