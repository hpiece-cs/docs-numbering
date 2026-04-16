export function parseNumberFromFilename(name) {
  const m = name.match(/^(\d+)(?:[-_.]|$)/);
  return m ? parseInt(m[1], 10) : null;
}

export function nextNumber(filenames, { start = 1 } = {}) {
  const nums = filenames
    .map(parseNumberFromFilename)
    .filter((n) => n !== null);
  const max = nums.length ? Math.max(...nums) : start - 1;
  return Math.max(start, max + 1);
}
