// Lelang Senja — make.fun entrypoint (Node 22, standard library only).
//
// The game is plain static files in game/ beside this file: index.html plus
// its scripts and styles, no library and no network request. This program
// hands the entry in: it copies game/ and screenshots/ into the output
// directory (MAKEFUN_OUTPUT_DIR outside the grader, /output inside it)
// and writes output/dossier.json with the vendored make.fun library.
//
// Deterministic: the same input files always produce the same output bytes,
// because copying preserves file contents and the dossier is built only
// from those files. Run it twice and compare — the bytes must match.
// Nothing here touches the network; the only inputs are the files beside
// this one, and the only outputs are under the output directory.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps: only text_max_bytes shapes the dossier bytes; the
// rest refuse an entry the scorer would refuse (more than 4 screenshots or
// one over 256 KiB; more than 993 files in game/ or 48 MiB of game files in
// all, or a path under game/ over 1000 bytes).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
