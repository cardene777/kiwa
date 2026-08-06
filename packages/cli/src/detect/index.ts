/**
 * The detection entry points the CLI uses.
 *
 * Loading the signal table and writing the result live here rather than in the
 * command so that both are testable without a CLI harness, and so the command
 * stays a matter of printing.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Detection, SignalTable } from './detect.js';

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * `docs/stack-signals.json`, found relative to this file.
 *
 * Three layouts have to work: the source tree (`src/detect/`), the build output
 * (`dist/detect/`, one level shallower because `src` collapses), and the
 * published package, which carries its own copy beside the build rather than
 * reaching for a `docs/` directory that is not shipped.
 *
 * Walking up rather than listing fixed depths means adding a build step that
 * changes the nesting does not silently break detection.
 */
export function loadSignalTable(): SignalTable {
  const relatives = ['stack-signals.json', join('docs', 'stack-signals.json')];
  let dir = HERE;
  for (let up = 0; up < 8; up += 1) {
    for (const rel of relatives) {
      try {
        return JSON.parse(readFileSync(resolve(dir, rel), 'utf-8')) as SignalTable;
      } catch {
        // Not here; keep climbing.
      }
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('stack-signals.json not found');
}

/**
 * Where the detection is recorded, so `doctor` and the skills read one answer.
 *
 * This overwrites without asking, unlike the rest of `init`, which refuses to
 * clobber and tells you to pass `--force`. The difference is what the file is:
 * scaffolded files are a starting point the user then edits, while this one is
 * derived entirely from the manifests and is meant to be replaced whenever they
 * change. Prompting to overwrite a cache would make re-detection a chore, and
 * keeping a stale one is the failure this file exists to prevent.
 */
/**
 * Whether a previous run left an answer here.
 *
 * The path is defined in this module, so the question is asked here too rather
 * than rebuilt at the call site where the two could drift apart.
 */
export function stackFileExists(cwd: string): boolean {
  return existsSync(join(cwd, '.kiwa', 'stack.json'));
}

export function writeStackFile(
  cwd: string,
  layers: Detection[],
  scanned: { path: string; language: string }[] = [],
  presence: { languages: string[]; complete: boolean } = { languages: [], complete: false },
  now: Date = new Date(),
): string {
  const dir = join(cwd, '.kiwa');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'stack.json');
  const body = {
    // When the answer was taken. A reader compares it against the manifests to
    // tell a current detection from one that predates an edit — without it,
    // adding `axum` to Cargo.toml and not re-running leaves the file claiming
    // the unit layer, and a reader narrowing on that picks the wrong one.
    generated_at: now.toISOString(),
    // Which manifests were read, not just which ones matched. "We read
    // package.json and nothing matched" and "there is no package.json" lead to
    // opposite conclusions, and recording only hits cannot tell them apart.
    scanned: scanned.map((m) => ({ manifest: m.path, language: m.language })),
    // Which languages the project contains at all, which is a wider question
    // than which manifests were read: the read set honours the workspace
    // definition, and a service in an undeclared directory is absent from it
    // while being present in the project. A reader excluding layers on absence
    // needs the wider answer.
    languages: presence.languages,
    // And whether the search that produced it finished. An unfinished search
    // can only say what it found, never what is not there, so a reader must not
    // exclude anything on the strength of it.
    languages_complete: presence.complete,
    // Recording the signal and the manifest, not just the layer, so a wrong
    // detection can be traced to the dependency that caused it.
    detected: layers.map((d) => ({
      layer: d.layer,
      signal: d.signal,
      manifest: d.manifest,
      strength: d.strength,
    })),
  };
  writeFileSync(file, `${JSON.stringify(body, null, 2)}\n`, 'utf-8');
  return join('.kiwa', 'stack.json');
}

export { detectFrom, resolve as resolveDetections } from './detect.js';
export { loadLayerTable, resolveLayers, type LayerRecord, type ResolvedLayers } from './layers.js';
export { presentLanguages, scan as scanManifests, type LanguagePresence } from './scan.js';
export type { Detection, SignalTable } from './detect.js';
