import readline from 'node:readline';
import { t } from '../i18n/index.js';

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

export function parsePickerInput(raw, { pool, detected }) {
  const cleaned = String(raw ?? '').trim().toLowerCase();

  if (cleaned === '' || cleaned === 'd' || cleaned === 'default') {
    return pool.filter((a) => detected.has(a.name)).map((a) => a.name);
  }
  if (cleaned === 'a' || cleaned === 'all') {
    return pool.map((a) => a.name);
  }
  if (cleaned === 'q' || cleaned === 'quit' || cleaned === 'cancel') {
    return [];
  }

  const tokens = cleaned.split(/[,\s]+/).filter(Boolean);
  const selected = [];
  for (const tok of tokens) {
    if (/^\d+$/.test(tok)) {
      const a = pool[parseInt(tok, 10) - 1];
      if (a) selected.push(a.name);
    } else {
      const a = pool.find((x) => x.name === tok);
      if (a) selected.push(a.name);
    }
  }
  return [...new Set(selected)];
}

export function renderPickerTable({ pool, detected }) {
  const lines = [t('install.picker_title')];
  pool.forEach((a, i) => {
    const isDetected = detected.has(a.name);
    const mark = isDetected ? '*' : ' ';
    const num = String(i + 1).padStart(2, ' ');
    const tag = isDetected ? ` ${t('install.picker_detected_tag')}` : '';
    lines.push(`  [${num}] ${mark} ${a.name.padEnd(12)} ${a.label}${tag}`);
  });
  return lines.join('\n');
}

export async function promptAgentSelection({ pool, detected }) {
  const out = process.stdout;
  out.write('\n' + renderPickerTable({ pool, detected }) + '\n\n');

  const rl = readline.createInterface({ input: process.stdin, output: out });
  try {
    const raw = await ask(rl, t('install.picker_prompt'));
    return parsePickerInput(raw, { pool, detected });
  } finally {
    rl.close();
  }
}
