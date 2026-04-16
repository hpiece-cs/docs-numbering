import en from './messages/en.js';
import ko from './messages/ko.js';

const CATALOGS = { en, ko };
const SUPPORTED = Object.keys(CATALOGS);
const FALLBACK = 'en';

let currentLocale = null;

function normalize(raw) {
  if (!raw) return null;
  const code = String(raw).toLowerCase().split(/[._-]/)[0];
  return SUPPORTED.includes(code) ? code : null;
}

export function detectLocale({ override, configLocale } = {}) {
  return (
    normalize(override) ||
    normalize(process.env.DOCS_NUMBERING_LANG) ||
    normalize(configLocale) ||
    normalize(process.env.LC_ALL) ||
    normalize(process.env.LC_MESSAGES) ||
    normalize(process.env.LANG) ||
    FALLBACK
  );
}

export function setLocale(loc) {
  currentLocale = normalize(loc) || FALLBACK;
}

export function getLocale() {
  if (!currentLocale) currentLocale = detectLocale();
  return currentLocale;
}

export function t(key, params = {}) {
  const loc = getLocale();
  const msg = CATALOGS[loc]?.[key] ?? CATALOGS[FALLBACK][key] ?? key;
  return msg.replace(/\{(\w+)\}/g, (_, k) =>
    params[k] !== undefined ? String(params[k]) : `{${k}}`
  );
}

export const SUPPORTED_LOCALES = SUPPORTED;
