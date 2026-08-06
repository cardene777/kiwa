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
 * | reader があり manifest が 1 つも無い | その runtime を除く (不在の証拠) |
 * | reader があり manifest もあり signal もある | 検出した layer に絞る |
 * | reader があり manifest もあるが signal が無い | 全部残す (語れない) |
 * | reader が無い runtime | 全部残す (語れない) |
 *
 * The detection is advisory throughout. It is written to `.kiwa/`, which is
 * gitignored, so its absence is the normal state on a fresh checkout.
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { SignalTable } from './detect.js';

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
function loadJson<T>(names: string[]): T | null {
  let dir = HERE;
  for (let up = 0; up < 8; up += 1) {
    for (const name of names) {
      for (const rel of [name, join('docs', name)]) {
        try {
          return JSON.parse(readFileSync(resolve(dir, rel), 'utf-8')) as T;
        } catch {
          // Not here; keep looking.
        }
      }
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/** Every layer `docs/layers.json` declares. */
export function loadLayerTable(): LayerRecord[] {
  const parsed = loadJson<{ layers?: unknown }>(['layers.json']);
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
  const table = loadJson<SignalTable>(['stack-signals.json']);
  const out = new Set<string>();
  if (!table) return out;
  for (const [language, signals] of Object.entries(table.signals ?? {})) {
    if (Array.isArray(signals) && signals.length) out.add(language);
  }
  return out;
}

/** The languages a manifest reader exists for, whether or not it has signals. */
function readableLanguages(): Set<string> {
  const table = loadJson<SignalTable>(['stack-signals.json']);
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
 * Whether the recording still describes the project.
 *
 * A manifest that has been edited since the detection was taken may name a
 * dependency the recording does not, and narrowing on the older answer picks a
 * layer the project has moved off. A manifest that is gone entirely says the
 * same thing more loudly.
 *
 * Both are judged against the whole file rather than per entry, because a
 * detection is one snapshot: if part of it is out of date, the part that agrees
 * is agreeing by luck.
 */
function stale(cwd: string, file: StackFile, scanned: ScannedEntry[]): string | null {
  const takenAt = str(file.generated_at);
  const taken = takenAt ? Date.parse(takenAt) : Number.NaN;

  for (const entry of scanned) {
    const manifest = str(entry.manifest);
    if (!manifest) continue;
    const full = join(cwd, manifest);
    if (!existsSync(full)) return `${manifest} no longer exists`;
    if (Number.isNaN(taken)) continue;
    try {
      if (statSync(full).mtimeMs > taken) return `${manifest} changed after the detection was taken`;
    } catch {
      return `${manifest} could not be read`;
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

  const scanned = Array.isArray(file.scanned) ? (file.scanned as ScannedEntry[]) : [];
  const reason = stale(options.cwd, file, scanned);
  if (reason) {
    warnings.push(`ignored the detection: ${reason}`);
    return { layers: table, source: 'all', warnings };
  }

  // A recording without `scanned` predates the field, so which languages were
  // looked at is unknown and no runtime can be excluded on evidence.
  if (!scanned.length) return { layers: table, source: 'all', warnings };

  const seen = new Set<string>();
  for (const entry of scanned) {
    const language = str(entry.language);
    if (language) seen.add(language);
  }

  const detected = new Set<string>();
  for (const entry of (Array.isArray(file.detected) ? file.detected : []) as StackEntry[]) {
    const id = str(entry.layer);
    if (!id) continue;
    if (!table.some((layer) => layer.id === id)) {
      // Drop the one entry rather than the whole file: a recording naming a
      // layer this build does not know should cost that layer, not the answer.
      warnings.push(`ignored unknown layer "${id}"`);
      continue;
    }
    detected.add(id);
  }

  const readable = readableLanguages();
  const speakable = languagesWithSignals();

  const kept = table.filter((layer) => {
    const runtime = layer.runtime;
    // No reader for this runtime, so nothing was looked for and nothing can be
    // concluded. `contract` sits here: `foundry.toml` is not read.
    if (!runtime || !readable.has(runtime)) return true;
    // A reader exists and found nothing of that language. That is the one case
    // where absence is evidence.
    if (!seen.has(runtime)) return false;
    // The manifest was read but the table has no signals for the language, so
    // "nothing detected" carries no information. TypeScript is here today.
    if (!speakable.has(runtime)) return true;
    return detected.has(layer.id);
  });

  // Keeping everything means the detection changed nothing, and saying
  // `detected` would overstate what happened.
  const narrowed = kept.length !== table.length;
  return { layers: kept, source: narrowed ? 'detected' : 'all', warnings };
}
