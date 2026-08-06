/**
 * Decide which layers a run applies to, in one place.
 *
 * Three sources can answer that question — an explicit flag, the detection a
 * previous `--detect` wrote, and the fallback of every layer — and the rules
 * for choosing between them are small but easy to get subtly different. The
 * layer contract already drifted across 25 `SKILL.md` files once (#1807 /
 * #1809 / #1810), so the resolution lives here and every caller asks rather
 * than re-deriving it.
 *
 * The central constraint is that **detection is a partial index**. It can speak
 * about 10 of the 30 layers: `docs/stack-signals.json` carries four Rust
 * signals and four Go ones and nothing for TypeScript, while 19 of the layers
 * are TypeScript. JS detection was left out of #1812 deliberately — the corpus
 * to measure it against does not exist — so the gap is a standing property, not
 * a temporary one.
 *
 * That makes "keep only what was detected" wrong. A monorepo with a Next.js
 * frontend beside a Rust service would lose all 19 TypeScript layers, silently,
 * because nothing can detect them. Absence of a signal is not evidence of
 * absence.
 *
 * So narrowing happens per runtime, and only where the answer is knowable:
 *
 * | 条件 | 扱い |
 * |---|---|
 * | reader が無い runtime | 全部残す (語れない) |
 * | project に manifest が無い | 除く (不在の証拠) |
 * | manifest はあるが読んでいない | 全部残す (問うていない) |
 * | 読んだが signal が無い | 全部残す (語れない) |
 * | 読んで signal もある | 検出した layer に絞る |
 *
 * The detection is advisory throughout. It is written to `.kiwa/`, which is
 * gitignored, so its absence is the normal state on a fresh checkout.
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { SignalTable } from './detect.js';
import { presentManifests, type ManifestPresence } from './scan.js';

const HERE = dirname(fileURLToPath(import.meta.url));

/** One layer as `docs/layers.json` declares it. */
export interface LayerRecord {
  id: string;
  consumer_skill: string | null;
  mode: string | null;
  spec_path: string | null;
  runtime: string | null;
}

interface RawLayer {
  id?: unknown;
  consumer_skill?: unknown;
  mode?: unknown;
  spec_path?: unknown;
  runtime?: unknown;
}

export type LayerSource = 'flag' | 'detected' | 'all';

export interface ResolvedLayers {
  /** The layers to act on, in the order `docs/layers.json` declares them. */
  layers: LayerRecord[];
  /** Which of the three sources decided it, for the caller to report. */
  source: LayerSource;
  /** Reasons a detection was ignored. Empty when nothing was discarded. */
  warnings: string[];
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

/**
 * A JSON file beside the build or up the tree, whichever turns up first.
 *
 * Three layouts have to work: the source tree (`src/detect/`), the build output
 * (`dist/detect/`, one level shallower because `src` collapses), and the
 * published package, which carries its own copy beside the build rather than
 * reaching for a `docs/` directory that is not shipped.
 */
export function loadJson<T>(name: string, from: string = HERE): T | null {
  /** Parse a candidate that exists. A corrupt one is an error, not a miss. */
  const read = (path: string): T => {
    let raw: string;
    try {
      raw = readFileSync(path, 'utf-8');
    } catch {
      throw new Error(`${path} could not be read`);
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      throw new Error(`${path} is not valid JSON`);
    }
  };

  // The copy the build puts beside itself, which is what a published install
  // has. If it is there it is the answer — climbing past it could only find
  // something that is not ours.
  const beside = resolve(from, '..', name);
  if (existsSync(beside)) return read(beside);

  let dir = from;
  for (let up = 0; up < 8; up += 1) {
    // Under `node_modules` means installed, and the build copy was the only
    // legitimate candidate. Anything above belongs to whoever installed us:
    // their own `layers.json` would be adopted as ours and answer with their
    // layers, consumer skills and spec paths.
    if (basename(dir) === 'node_modules') return null;
    for (const rel of [name, join('docs', name)]) {
      const candidate = resolve(dir, rel);
      if (existsSync(candidate)) return read(candidate);
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/** Every layer `docs/layers.json` declares. */
export function loadLayerTable(): LayerRecord[] {
  const parsed = loadJson<{ layers?: unknown }>('layers.json');
  if (!parsed) throw new Error('layers.json not found');
  const rows = Array.isArray(parsed.layers) ? (parsed.layers as RawLayer[]) : [];
  return rows
    .filter((row) => str(row.id))
    .map((row) => ({
      id: str(row.id)!,
      consumer_skill: str(row.consumer_skill),
      mode: str(row.mode),
      spec_path: str(row.spec_path),
      runtime: str(row.runtime),
    }));
}

/** The languages the signal table can actually say something about. */
function languagesWithSignals(): Set<string> {
  const table = loadJson<SignalTable>('stack-signals.json');
  const out = new Set<string>();
  if (!table) return out;
  for (const [language, signals] of Object.entries(table.signals ?? {})) {
    if (Array.isArray(signals) && signals.length) out.add(language);
  }
  return out;
}

/** The languages a manifest reader exists for, whether or not it has signals. */
function readableLanguages(): Set<string> {
  const table = loadJson<SignalTable>('stack-signals.json');
  return new Set(Object.values(table?.manifests ?? {}));
}

interface StackFile {
  generated_at?: unknown;
  scanned?: unknown;
  detected?: unknown;
}

interface StackEntry {
  layer?: unknown;
  manifest?: unknown;
}

interface ScannedEntry {
  manifest?: unknown;
  language?: unknown;
}

/**
 * What a previous `--detect` recorded.
 *
 * Anything unreadable reads as no detection at all. A malformed file should
 * send the caller to the fallback, not abort a command the user ran to do
 * something else — the same posture the manifest readers take.
 */
function readStackFile(cwd: string): StackFile | null {
  try {
    return JSON.parse(readFileSync(join(cwd, '.kiwa', 'stack.json'), 'utf-8')) as StackFile;
  } catch {
    return null;
  }
}

/**
 * Whether the recording can be acted on at all.
 *
 * Returns the reason it cannot, or `null` when every part of it holds. The
 * checks are deliberately in one place and applied together: a snapshot is one
 * statement about one moment, so a part of it being wrong says the statement is
 * wrong, not that the rest can be trusted.
 *
 * That is why an unknown layer id discards the whole recording rather than the
 * one entry. The writer knew a layer this build does not, which means the two
 * were built from different tables — and the entries that happen to be
 * recognised are recognised by coincidence, not by agreement.
 */
function validate(cwd: string, file: StackFile, table: LayerRecord[]): string | null {
  const takenAt = str(file.generated_at);
  const taken = takenAt ? Date.parse(takenAt) : Number.NaN;
  if (!Number.isFinite(taken)) return 'it carries no usable timestamp';

  if (!Array.isArray(file.scanned) || !file.scanned.length) {
    return 'it does not record which manifests were read';
  }

  for (const entry of file.scanned as ScannedEntry[]) {
    const manifest = str(entry.manifest);
    const language = str(entry.language);
    if (!manifest || !language) return 'a scanned entry is missing its manifest or language';

    const full = join(cwd, manifest);
    if (!existsSync(full)) return `${manifest} no longer exists`;
    try {
      if (statSync(full).mtimeMs > taken) return `${manifest} changed after the detection was taken`;
    } catch {
      return `${manifest} could not be read`;
    }
  }

  if (file.detected !== undefined && !Array.isArray(file.detected)) {
    return 'its detected list is not a list';
  }
  for (const entry of ((file.detected ?? []) as StackEntry[])) {
    const id = str(entry.layer);
    if (!id) return 'a detected entry is missing its layer';
    if (!table.some((layer) => layer.id === id)) {
      return `it names "${id}", which this build's layer table does not declare`;
    }
  }

  return null;
}

/**
 * Which layers to act on.
 *
 * An explicit choice wins outright — detection supplies a default, never an
 * override.
 */
export function resolveLayers(options: {
  cwd: string;
  explicit?: string | undefined;
  /** Injectable so a test can exhaust the search budget without 20000 directories. */
  presence?: ManifestPresence | undefined;
}): ResolvedLayers {
  const table = loadLayerTable();
  const warnings: string[] = [];

  if (options.explicit && options.explicit !== 'all') {
    const known = table.find((layer) => layer.id === options.explicit);
    if (!known) throw new Error(`unknown layer: ${options.explicit}`);
    return { layers: [known], source: 'flag', warnings };
  }
  if (options.explicit === 'all') return { layers: table, source: 'all', warnings };

  const file = readStackFile(options.cwd);
  if (!file) return { layers: table, source: 'all', warnings };

  // Validation happens before any narrowing, and it is all-or-nothing. Judging
  // the parts separately lets a recording fail one check, get patched up, and
  // still decide the answer — which is how a snapshot from a different version
  // of the tables ends up narrowing a runtime down to nothing.
  const rejected = validate(options.cwd, file, table);
  if (rejected) {
    warnings.push(`ignored the detection: ${rejected}`);
    return { layers: table, source: 'all', warnings };
  }

  // Which languages the project contains is asked now rather than read from the
  // recording. A recording answers for the moment it was taken, and a `go.mod`
  // added since would be missing from it while being present in the project —
  // the staleness check cannot see that, because it only knows the manifests
  // the recording already named.
  //
  // This is a different question from `scanned`, which is what detection
  // actually opened and honours the workspace definition. A Go module in an
  // undeclared directory is present and unread, and "nothing detected for Go"
  // is not evidence when Go was never opened.
  const found = options.presence ?? presentManifests(options.cwd);

  // An unfinished search can say what it found and nothing about what it did
  // not, so it cannot support narrowing at all — not the exclusions, which rest
  // on absence, and not the within-language narrowing either, since the crate
  // that would have widened it may be in the part that went unseen.
  if (!found.complete) {
    warnings.push('kept every layer: the search for project manifests did not finish');
    return { layers: table, source: 'all', warnings };
  }
  const present = new Set(found.manifests.map((m) => m.language));
  const scanned = file.scanned as ScannedEntry[];
  const read = new Set(scanned.map((e) => str(e.language)!));
  const readPaths = new Set(scanned.map((e) => str(e.manifest)!));

  // A language being read is not the same as all of its manifests being read.
  // `scan` follows the workspace definition, so a second Rust crate in an
  // undeclared directory leaves the language set unchanged while carrying a
  // framework nobody looked at — and narrowing to what was detected would drop
  // the layer that crate actually needs.
  const foundPaths = new Set(found.manifests.map((m) => m.path));
  const partiallyRead = new Set([
    // Found but never opened. The undeclared crate case.
    ...found.manifests.filter((m) => !readPaths.has(m.path)).map((m) => m.language),
    // Opened but not found — the reverse, and it means the same thing. `scan`
    // follows the workspace definition into places the search declines to go
    // (`dist`, `vendor`, anything dot-prefixed), so the two sets can disagree
    // in both directions and neither disagreement leaves a complete picture.
    ...scanned.filter((e) => !foundPaths.has(str(e.manifest)!)).map((e) => str(e.language)!),
  ]);
  const detected = new Set(
    ((file.detected ?? []) as StackEntry[]).map((entry) => str(entry.layer)!),
  );

  const readable = readableLanguages();
  const speakable = languagesWithSignals();

  const excluded = new Set<string>();
  const unread = new Set<string>();
  const kept = table.filter((layer) => {
    const runtime = layer.runtime;
    // No reader for this runtime, so nothing was looked for and nothing can be
    // concluded. `contract` sits here: `foundry.toml` is not read.
    if (!runtime || !readable.has(runtime)) return true;
    // A reader exists and found nothing of that language. That is the one case
    // where absence is evidence — but only as strong as the search was. `scan`
    // reads the working directory and one level of declared workspace members,
    // so a Go service in an undeclared subdirectory is absent to it and present
    // to the project. The exclusion is still the better default; what it must
    // not be is silent, because the layers simply stop being offered and
    // nothing says why.
    // The two passes disagreeing comes first. When a runtime's only manifest
    // sits somewhere the search does not enter, it is absent from `present`
    // entirely — so testing absence before disagreement excluded the runtime
    // on a search that had already been shown not to cover it.
    if (partiallyRead.has(runtime)) {
      unread.add(runtime);
      return true;
    }
    if (!present.has(runtime)) {
      excluded.add(runtime);
      return false;
    }
    // Present but never opened, so nothing was asked and nothing was answered.
    if (!read.has(runtime)) return true;
    // Opened, but the table has no signals for the language, so "nothing
    // detected" carries no information. TypeScript is here today.
    if (!speakable.has(runtime)) return true;
    return detected.has(layer.id);
  });

  for (const runtime of [...excluded].sort()) {
    warnings.push(`excluded ${runtime}: no ${runtime} manifest in the scanned directories`);
  }
  for (const runtime of [...unread].sort()) {
    const disagreeing = [
      ...found.manifests.filter((m) => m.language === runtime && !readPaths.has(m.path)).map((m) => m.path),
      ...scanned
        .filter((e) => str(e.language) === runtime && !foundPaths.has(str(e.manifest)!))
        .map((e) => str(e.manifest)!),
    ].sort();
    warnings.push(`kept every ${runtime} layer: ${disagreeing.join(', ')} was not read by both passes`);
  }

  // Keeping everything means the detection changed nothing, and saying
  // `detected` would overstate what happened.
  const narrowed = kept.length !== table.length;
  return { layers: kept, source: narrowed ? 'detected' : 'all', warnings };
}
