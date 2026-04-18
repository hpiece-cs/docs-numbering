#!/usr/bin/env node
import { program } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { runInit } from '../src/commands/init.js';
import { runNew } from '../src/commands/new.js';
import { runList } from '../src/commands/list.js';
import { runMigrate } from '../src/commands/migrate.js';
import { runPhases } from '../src/commands/phases.js';
import { runValidate } from '../src/commands/validate.js';
import { runHistory } from '../src/commands/history.js';
import { runRollback } from '../src/commands/rollback.js';
import { runInstall, runUninstall } from '../src/commands/install.js';
import { t, setLocale, detectLocale } from '../src/i18n/index.js';

setLocale(detectLocale());

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8')
);

const ctx = () => ({ cwd: process.cwd(), homeDir: homedir() });

function output(data, { json }) {
  if (json) process.stdout.write(JSON.stringify(data, null, 2) + '\n');
  else if (data?.path) process.stdout.write(data.path + '\n');
  else process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}

program
  .name('docs-numbering')
  .description('Numbered markdown documentation manager')
  .version(pkg.version)
  .option('--config <path>')
  .option('--docs-dir <path>')
  .option('--json', 'JSON output')
  .option('--locale <locale>', 'override locale (en, ko)');

program.command('init')
  .option('--global')
  .option('--force')
  .action(async (opts) => {
    const g = program.opts();
    const r = await runInit({ ...ctx(), flags: { ...g, ...opts } });
    output(r, g);
  });

program.command('new <title>')
  .option('--method <m>')
  .option('--phase <p>')
  .option('--content <c>')
  .option('--stdin', 'read body from stdin')
  .option('--dry-run')
  .option('--date <d>')
  .action(async (title, opts) => {
    const g = program.opts();
    let content = opts.content || '';
    if (opts.stdin) content = readFileSync(0, 'utf8');
    const r = await runNew({ ...ctx(), flags: { ...g, ...opts }, args: { title, content } });
    output(r, g);
  });

program.command('list')
  .option('--method <m>')
  .option('--phase <p>')
  .option('--range <r>')
  .action(async (opts) => {
    const g = program.opts();
    const r = await runList({ ...ctx(), flags: { ...g, ...opts } });
    output(r, g);
  });

program.command('migrate')
  .option('--order <o>')
  .option('--apply')
  .option('--no-backup')
  .action(async (opts) => {
    const g = program.opts();
    const r = await runMigrate({ ...ctx(), flags: { ...g, ...opts } });
    output(r, g);
  });

program.command('phases')
  .option('--method <m>')
  .action(async (opts) => {
    const g = program.opts();
    const r = await runPhases({ ...ctx(), flags: { ...g, ...opts } });
    output(r, g);
  });

program.command('validate')
  .action(async () => {
    const g = program.opts();
    const r = await runValidate({ ...ctx(), flags: g });
    output(r, g);
    if (r.issues.length) process.exit(3);
  });

program.command('history')
  .option('--limit <n>', '', parseInt)
  .action(async (opts) => {
    const g = program.opts();
    const r = await runHistory({ ...ctx(), flags: { ...g, ...opts } });
    output(r, g);
  });

program.command('rollback [id]')
  .option('--last')
  .option('--to <id>')
  .option('--apply')
  .option('--force')
  .action(async (id, opts) => {
    const g = program.opts();
    const flags = { ...g, ...opts };
    if (id && !flags.to) flags.to = id;
    const r = await runRollback({ ...ctx(), flags });
    output(r, g);
  });

program.command('install')
  .option('--agent <name>', 'claude-code | opencode | codex | gemini | copilot')
  .option('--all', 'install for all adapters')
  .option('--mode <mode>', 'link | copy | merge (auto when omitted)')
  .option('--force', 'overwrite existing files')
  .option('--no-init', 'skip auto-creating .docs-numbering.yaml when missing')
  .option('--dry-run')
  .action(async (opts) => {
    const g = program.opts();
    const r = await runInstall({ ...ctx(), flags: { ...g, ...opts } });
    output(r, g);
  });

program.command('uninstall')
  .option('--agent <name>')
  .option('--all')
  .option('--dry-run')
  .action(async (opts) => {
    const g = program.opts();
    const r = await runUninstall({ ...ctx(), flags: { ...g, ...opts } });
    output(r, g);
  });

program.parseAsync(process.argv).catch((e) => {
  process.stderr.write(t('cli.error_prefix', { message: e.message }) + '\n');
  process.exit(1);
});
