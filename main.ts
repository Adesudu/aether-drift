// Aether Drift — entrypoint for make.fun best-game-01.
//
// Builds the submission bundle: copies the playable game and its
// screenshots into the output directory, then writes dossier.json
// from buildDossier (vendor/makefun-game.ts, vendored unchanged).
// Run with: MAKEFUN_OUTPUT_DIR=out node main.ts
// (no flags, no build step, no install — Node 22 runs this as-is).

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The caps buildDossier is held to, from the bounty gate (gate.json):
// text_max_bytes shapes the dossier text; the rest only refuse.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
} as const;

// Where the bundle goes: MAKEFUN_OUTPUT_DIR, else /output.
function outputDir(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  return fromEnv !== undefined && fromEnv !== '' ? fromEnv : '/output';
}

// The directory this file lives in (the repository root).
function repoRoot(): string {
  return fileURLToPath(new URL('.', import.meta.url));
}

// Copy one directory tree, but only when the source exists.
function copyTree(src: string, dest: string): void {
  if (!existsSync(src)) return;
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest, { recursive: true });
}

// The entrypoint: stage game/ + screenshots/, then write the dossier.
function buildEntry(): void {
  const root = repoRoot();
  const out = outputDir();

  mkdirSync(out, { recursive: true });
  copyTree(join(root, 'game'), join(out, 'game'));
  copyTree(join(root, 'screenshots'), join(out, 'screenshots'));

  // Fail early with a clear message when the game did not stage:
  // buildDossier would refuse it anyway, but a missing index.html
  // here means the copy itself went wrong, not the dossier caps.
  const stagedIndex = join(out, 'game', 'index.html');
  if (!existsSync(stagedIndex)) {
    throw new Error(`Aether Drift: ${stagedIndex} missing after copy — game/ did not stage`);
  }

  const dossier = buildDossier(out, DOSSIER_CAPS);
  writeFileSync(join(out, 'dossier.json'), dossier);

  const shots = existsSync(join(out, 'screenshots'))
    ? readdirSync(join(out, 'screenshots')).filter((n) => !n.startsWith('.'))
    : [];
  console.log(`Aether Drift bundle ready: ${out} (dossier.json, ${shots.length} screenshot(s))`);
}

buildEntry();
