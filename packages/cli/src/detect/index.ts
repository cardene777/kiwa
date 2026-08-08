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

import { signalsFingerprint, type Detection, type SignalTable } from './detect.js';

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
 * The table if it can be found, rather than throwing.
 *
 * Writing the stack file is the caller's goal; a missing signal table makes the
 * fingerprint unusable but is not a reason to abandon the write. The reader
 * rejects a recording with no fingerprint, so the failure surfaces there.
 */
function loadSignalTableOrNull(): SignalTable | null {
  try {
    return loadSignalTable();
  } catch {
    return null;
  }
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
  scanned: { path: string; language: string; mtimeMs?: number }[] = [],
  now: Date = new Date(),
): string {
  const dir = join(cwd, '.kiwa');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'stack.json');
  const body = {
    // When the answer was taken. A reader compares it against the manifests to
    // tell a current detection from one that predates an edit — without it,
    // adding `next` to package.json and not re-running leaves the file naming
    // none of the `nextjs-*` layers, and a reader narrowing on that drops them.
    generated_at: now.toISOString(),
    // Which manifests were read, not just which ones matched. "We read
    // package.json and nothing matched" and "there is no package.json" lead to
    // opposite conclusions, and recording only hits cannot tell them apart.
    //
    // `mtime_ms` is the mtime each file had when `scan` read it, at full
    // precision, so the reader can ask "is this the same file I read" rather
    // than "was it touched after some moment". The two are not the same
    // question, and the second one cannot be answered here: `generated_at` is
    // an ISO string carrying whole milliseconds while an mtime carries
    // fractions of one (measured: `1786186801940.7078`), so any comparison
    // between them has a one-millisecond band where the writer's own output and
    // an edit made just after it are indistinguishable. Accepting that band
    // makes `kiwa init --detect` reject what it just wrote; rejecting it lets a
    // same-millisecond edit through. Recording the value sidesteps the choice.
    //
    // Written per entry rather than as one timestamp because that is the
    // granularity the question has: each manifest is compared against the value
    // it had, not against a summary of all of them.
    scanned: scanned.map((m) => ({
      manifest: m.path,
      language: m.language,
      ...(m.mtimeMs === undefined ? {} : { mtime_ms: m.mtimeMs }),
    })),
    // Which table produced this answer. The staleness check compares the
    // recording against the manifests, which cannot see that the signal table
    // itself changed — and a recording taken before a signal existed says
    // nothing about the layer that signal names. Reading its silence as absence
    // removes exactly the layers the signal was added to find.
    //
    // Failing to load the table leaves this empty, which the reader treats as
    // unusable. A recording that cannot say which table produced it is not
    // safer than no recording.
    signals: signalsFingerprint(loadSignalTableOrNull()),
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
export {
  applyLang,
  isValidDocLang,
  isValidModule,
  loadLayerTable,
  resolveLayers,
  withLangSuffix,
  withModule,
  type DocLang,
  type LayerRecord,
  type ResolvedLayers,
} from './layers.js';
export { presentManifests, scan as scanManifests, type ManifestPresence } from './scan.js';
export type { Detection, SignalTable } from './detect.js';
