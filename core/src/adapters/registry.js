import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

let cachedAdaptersDir = null;

export function getAdaptersDir() {
  if (cachedAdaptersDir) return cachedAdaptersDir;
  if (process.env.DOCS_NUMBERING_ADAPTERS_DIR) {
    cachedAdaptersDir = realpathSync(process.env.DOCS_NUMBERING_ADAPTERS_DIR);
    return cachedAdaptersDir;
  }
  const hereReal = realpathSync(HERE);
  cachedAdaptersDir = resolve(hereReal, '..', '..', '..', 'adapters');
  return cachedAdaptersDir;
}

export const MERGE_START = '<!-- docs-numbering:start -->';
export const MERGE_END = '<!-- docs-numbering:end -->';

export const ADAPTERS = {
  'claude-code': {
    name: 'claude-code',
    label: 'Claude Code',
    defaultMode: 'link',
    detect: ['.claude'],
    items: [
      {
        type: 'dir',
        from: 'claude-code/skills/docs-numbering',
        to: '.claude/skills/docs-numbering'
      },
      {
        type: 'glob',
        fromDir: 'claude-code/commands',
        pattern: /\.md$/,
        toDir: '.claude/commands'
      }
    ]
  },
  opencode: {
    name: 'opencode',
    label: 'OpenCode',
    defaultMode: 'copy',
    detect: ['.opencode'],
    items: [
      {
        type: 'glob',
        fromDir: 'opencode/commands',
        pattern: /\.md$/,
        toDir: '.opencode/commands'
      }
    ]
  },
  codex: {
    name: 'codex',
    label: 'Codex / Cursor / Windsurf (AGENTS.md)',
    defaultMode: 'merge',
    detect: ['.cursor', '.codex', '.windsurf', 'AGENTS.md'],
    items: [
      {
        type: 'merge',
        from: 'agents-md/AGENTS.md',
        to: 'AGENTS.md'
      }
    ]
  },
  gemini: {
    name: 'gemini',
    label: 'Gemini CLI',
    defaultMode: 'merge',
    detect: ['.gemini', 'GEMINI.md'],
    items: [
      {
        type: 'merge',
        from: 'gemini/GEMINI.md',
        to: 'GEMINI.md'
      }
    ]
  },
  copilot: {
    name: 'copilot',
    label: 'GitHub Copilot',
    defaultMode: 'merge',
    detect: ['.github'],
    items: [
      {
        type: 'merge',
        from: 'copilot/.github/copilot-instructions.md',
        to: '.github/copilot-instructions.md'
      }
    ]
  }
};

export function listAdapters() {
  return Object.values(ADAPTERS);
}

export function getAdapter(name) {
  return ADAPTERS[name] || null;
}
