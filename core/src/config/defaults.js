export const DEFAULTS = {
  locale: null,
  docs_dir: 'docs/',
  naming_pattern: '{num:03d}-{method}-{phase}-{slug}.md',
  numbering: {
    strategy: 'sequential',
    start: 1,
    padding: 3,
    presets: [],
    phase_validation: 'warn',
    default_method: null
  },
  slug: {
    language: 'preserve',
    separator: '-',
    lowercase: true,
    max_length: 50
  },
  migration: {
    default_order: 'mtime',
    safety: {
      dry_run_default: true,
      backup_dir: '.docs-numbering/backup'
    }
  },
  history: {
    enabled: true,
    max_entries: 100,
    retain_days: 30,
    include_backups: true
  },
  frontmatter: {
    enabled: false,
    template: ''
  }
};
