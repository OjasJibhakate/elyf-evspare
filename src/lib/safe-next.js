/**
 * Sanitises a ?next= parameter before it is used as a redirect target.
 *
 * Without this, /login?next=https://evil.com would drop a customer onto an
 * attacker's page immediately after they sign in — an open redirect. Only
 * same-site absolute paths are allowed through.
 */
export function safeNext(value, fallback = '/') {
  if (typeof value !== 'string') return fallback;

  const trimmed = value.trim();

  if (!trimmed.startsWith('/')) return fallback;
  if (trimmed.startsWith('//')) return fallback;
  if (trimmed.includes('\\')) return fallback;
  if (trimmed.includes('@')) return fallback;

  return trimmed;
}
