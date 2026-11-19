// Platinum Atlas — the entry's hand-in program (Node 22, standard library only).
//
// The guide itself is the plain static files under app/: app/index.html, its
// JavaScript modules under app/js/, app/style.css and app/data/trophies.json.
// It opens in desktop Chrome with the network off and loads nothing from
// anywhere else. This program hands it in: it copies app/ and screenshots/
// from beside this file into /output (or MAKEFUN_OUTPUT_DIR outside the
// grader) and writes /output/dossier.json with the vendored make.fun library,
// which the scorer rebuilds byte for byte from the same files.
//
// The library lives at vendor/makefun-frontend.ts and is the kit's copy,
// unchanged: do not edit it. The caps below are the scorer's own (see the
// kit's RULES.txt): the dossier text is capped at 160 KiB, at most 4
// screenshots of at most 256 KiB each, app/ at most 993 files and
// directories and 48 MiB in all.
//
// Run it outside the grader with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The dossier is the judge's view of the entry: its screenshots, the first
// load's files and bytes, and the source. buildDossier refuses anything past
// the caps, so a successful run means the entry fits the gate's limits.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
