import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export function sha256OfString(s) {
  return 'sha256:' + createHash('sha256').update(s).digest('hex');
}

export function sha256OfFile(path) {
  return sha256OfString(readFileSync(path));
}
