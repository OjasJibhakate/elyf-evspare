/**
 * Shared environment loader for the setup scripts.
 *
 * Reads .env.production.local when it exists, otherwise .env.local — and always
 * prints which database it is about to touch, so production and development can
 * never be confused.
 *
 *   node scripts/seed-db.mjs                # local, no prompt
 *   node scripts/seed-db.mjs --yes          # skip the confirmation for remote
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline/promises';

const here = dirname(fileURLToPath(import.meta.url));
export const root = join(here, '..');

function parseEnvFile(path) {
  const out = {};
  try {
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    }
  } catch (e) {
    /* missing file is fine */
  }
  return out;
}

export function loadEnv() {
  const prodPath = join(root, '.env.production.local');
  const devPath = join(root, '.env.local');
  const usingProductionFile = existsSync(prodPath);

  const fileEnv = usingProductionFile ? parseEnvFile(prodPath) : parseEnvFile(devPath);
  const env = { ...fileEnv, ...process.env };

  const url = env.NEXT_PUBLIC_SUPABASE_URL || '';
  const isLocal = url.includes('127.0.0.1') || url.includes('localhost');

  return {
    env,
    url,
    key: env.SUPABASE_SERVICE_ROLE_KEY || '',
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    source: usingProductionFile ? '.env.production.local' : '.env.local',
    isLocal,
  };
}

/** Prints a banner and, for a remote database, asks before doing anything. */
export async function confirmTarget(loaded, skipPrompt) {
  const label = loaded.isLocal ? 'LOCAL database' : 'REMOTE database';
  const line = '─'.repeat(64);
  console.log(`\n${line}`);
  console.log(`  ${label}`);
  console.log(`  ${loaded.url || '(no URL configured)'}`);
  console.log(`  keys from ${loaded.source}`);
  console.log(`${line}\n`);

  if (loaded.isLocal || skipPrompt || process.argv.includes('--yes')) return true;

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('This is a REMOTE database. Type "yes" to continue: ');
  rl.close();
  return answer.trim().toLowerCase() === 'yes';
}

export function assertConfigured(loaded) {
  if (!loaded.url || !loaded.key) {
    console.error(
      `\nMissing Supabase credentials.\n\n` +
        `Create .env.production.local (for a live project) or .env.local (for local dev) with:\n` +
        `  NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co\n` +
        `  NEXT_PUBLIC_SUPABASE_ANON_KEY=...\n` +
        `  SUPABASE_SERVICE_ROLE_KEY=...\n`,
    );
    process.exit(1);
  }
}
