export default {
  'errors.no_backup': 'no backup for {path} in {id}',
  'errors.entry_not_found': 'entry not found: {id}',
  'errors.project_locked': 'project is locked by another process',
  'errors.cannot_invert': 'cannot invert op: {type}',
  'errors.checksum_mismatch': 'checksum mismatch on {path} (use --force)',
  'errors.no_history': 'no history entries to rollback',
  'errors.range_not_implemented': '--range not implemented in v1; use --last or --to',
  'errors.config_exists': 'config exists: {path} (use --force to overwrite)',
  'errors.unknown_phase': 'unknown phase: {phase}',
  'errors.unknown_preset': 'unknown preset: {name}',
  'errors.file_exists': 'file exists: {path}',
  'errors.unknown_adapter': 'unknown adapter: {name}',
  'errors.unknown_mode': 'unknown install mode: {mode}',
  'warnings.phase_not_in_presets': "warn: phase '{phase}' not in enabled presets",
  'cli.error_prefix': 'error: {message}',
  'install.exists_hint': 'exists at {path} (use --force to overwrite)',
  'install.no_detection': 'no supported agent detected in this project. Use --agent <name> or --all.'
};
