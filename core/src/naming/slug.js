import slugify from '@sindresorhus/slugify';

const FORBIDDEN = /[\/\\:*?"<>|]/g;

// Revised Romanization of Korean (simplified) — used as a fallback to
// produce ASCII output when slugify drops Hangul syllables entirely.
const INITIALS = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's',
  'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'
];
const MEDIALS = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa',
  'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'
];
const FINALS = [
  '', 'g', 'kk', 'gs', 'n', 'nj', 'nh', 'd', 'l', 'lg',
  'lm', 'lb', 'ls', 'lt', 'lp', 'lh', 'm', 'b', 'bs', 's',
  'ss', 'ng', 'j', 'ch', 'k', 't', 'p', 'h'
];

function romanizeHangul(str) {
  let out = '';
  for (const ch of str) {
    const code = ch.codePointAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const idx = code - 0xac00;
      const i = Math.floor(idx / 588);
      const m = Math.floor((idx % 588) / 28);
      const f = idx % 28;
      out += INITIALS[i] + MEDIALS[m] + FINALS[f];
    } else {
      out += ch;
    }
  }
  return out;
}

export function makeSlug(input, opts = {}) {
  const {
    language = 'preserve',
    separator = '-',
    lowercase = true,
    max_length = 50
  } = opts;

  let s = String(input).replace(FORBIDDEN, '');

  if (language === 'romanize') {
    s = romanizeHangul(s);
    s = slugify(s, { separator, lowercase: true });
  } else {
    s = s.trim().split(/\s+/).join(separator);
    if (lowercase) {
      s = s.replace(/[A-Z]/g, (c) => c.toLowerCase());
    }
  }

  if (s.length > max_length) {
    s = s.slice(0, max_length).replace(new RegExp(`${separator}+$`), '');
  }
  return s;
}
