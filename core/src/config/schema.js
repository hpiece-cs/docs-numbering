export function deepMerge(base, override) {
  if (override === undefined || override === null) return base;
  if (typeof base !== 'object' || Array.isArray(base)) return override;
  const out = { ...base };
  for (const k of Object.keys(override)) {
    if (override[k] !== undefined) {
      out[k] = deepMerge(base[k], override[k]);
    }
  }
  return out;
}
