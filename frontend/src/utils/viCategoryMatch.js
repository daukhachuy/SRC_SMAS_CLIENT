/**
 * Normalize strings for Vietnamese category name matching (strip diacritics).
 */
export function normalizeViKey(s) {
  if (s == null || s === '') return '';
  return String(s)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** True if two category labels refer to the same bucket (diacritic-insensitive). */
export function categoryLabelsLooselyMatch(a, b) {
  const na = normalizeViKey(a);
  const nb = normalizeViKey(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return na.includes(nb) || nb.includes(na);
}
