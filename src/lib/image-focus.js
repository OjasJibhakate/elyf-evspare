/**
 * Image framing shared by the admin editor and every place that renders a
 * category photo.
 *
 * A focal point rather than a fixed crop, because the same photo is displayed at
 * several aspect ratios — a square admin thumbnail, a wide home-page tile — and
 * a hard crop that looks right in one looks wrong in the other. `object-position`
 * adapts to whatever shape the container happens to be.
 *
 * x and y are percentages (0–100), so they map straight onto CSS.
 */

export const DEFAULT_FOCUS = { x: 50, y: 50, zoom: 1 };

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function normaliseFocus(value) {
  if (!value || typeof value !== 'object') return { ...DEFAULT_FOCUS };
  return {
    x: clamp(value.x, 0, 100, 50),
    y: clamp(value.y, 0, 100, 50),
    zoom: clamp(value.zoom, 1, 3, 1),
  };
}

export function isDefaultFocus(value) {
  const f = normaliseFocus(value);
  return f.x === 50 && f.y === 50 && f.zoom === 1;
}

/** Inline style for an <img> that already uses object-cover. */
export function focusStyle(value) {
  if (isDefaultFocus(value)) return undefined;
  const f = normaliseFocus(value);
  const style = { objectPosition: `${f.x}% ${f.y}%` };
  if (f.zoom !== 1) {
    style.transform = `scale(${f.zoom})`;
    style.transformOrigin = `${f.x}% ${f.y}%`;
  }
  return style;
}

/** What to put in a hidden form field. Empty string means "no adjustment". */
export function focusToField(value) {
  return isDefaultFocus(value) ? '' : JSON.stringify(normaliseFocus(value));
}

/** Parses whatever came back from the database or a form field. */
export function parseFocus(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return normaliseFocus(raw);
  try {
    return normaliseFocus(JSON.parse(raw));
  } catch {
    return null;
  }
}
