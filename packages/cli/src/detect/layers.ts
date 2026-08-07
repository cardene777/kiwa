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
 * The central constraint is that **detection is a partial index**. It speaks
 * about 15 of the 30 layers: `docs/stack-signals.json` names all five Rust
 * layers, all five Go ones, and five of the nineteen TypeScript ones (the
 * `nextjs-*` set, through `next`). The gap is a standing property, not a
 * temporary one — most TypeScript layers are not framework-shaped and no single
 * dependency implies them.
 *
 * That makes "keep only what was detected" wrong. A monorepo with a Next.js
 * frontend beside a Rust service would lose every TypeScript layer, silently,
 * because nothing can detect most of them. Absence of a signal is not evidence
 * of absence.
 *
 * So narrowing happens only where the answer is knowable. Which runtimes exist
 * is asked per runtime; whether a layer can be ruled out is asked **per layer**,
 * because signal coverage is uneven within a language:
 *
 * | 条件 | 扱い |
 * |---|---|
 * | reader が無い runtime | 全部残す (語れない) |
 * | project に manifest が無い | 除く (不在の証拠) |
 * | manifest はあるが読んでいない | 全部残す (問うていない) |
 * | どの signal も名指ししない layer | 残す (語れない) |
 * | signal が名指しする layer | 検出されたものだけ残す |
 *
 * A recording also has to come from the same signal table that is being read
 * against, which the staleness check cannot see — it compares the recording to
 * the project, not to the table. A recording taken before a signal existed
 * carries no verdict on the layer that signal names.
 *
 * The detection is advisory throughout. It is written to `.kiwa/`, which is
 * gitignored, so its absence is the normal state on a fresh checkout.
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { signalsFingerprint, type SignalTable } from './detect.js';
import { presentManifests, type ManifestPresence } from './scan.js';

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * One layer as `docs/layers.json` declares it, field for field.
 *
 * Mirrors the file rather than selecting from it. Projecting a subset makes a
 * second, narrower contract over the same SSOT: the file declares what a layer
 * needs and the only programmatic reader answers with less, so a caller cannot
 * ask what is written down. `auth` declares five `providers` and says they are
 * chosen by `kiwa-auth --provider`; with those fields dropped, a caller has no
 * way to narrow and falls back to generating all five.
 *
 * Choosing which fields to pass is itself the drift: the decision has to be
 * remade every time a field is added, and until it is, the declaration exists
 * and does not arrive. `every field in layers.json survives the projection`
 * fails when the two diverge.
 */
export interface LayerRecord {
  id: string;
  spec_dir: string | null;
  spec_path: string | null;
  runtime: string | null;
  consumer_skill: string | null;
  /** Skills that consume this layer besides `consumer_skill`. */
  also_consumed_by: string[];
  backing_package: string | null;
  backing_runtime_package: string | null;
  /** Interchangeable implementations of the same subject (`auth` has five). */
  providers: string[];
  /** Values the consuming skill accepts for `--target`. */
  targets: string[];
  /** Like providers, but where the choice shows in the test rather than a flag. */
  variants: string[];
  /** How a provider or variant gets chosen, in prose. Null when there is no choice. */
  selected_by: string | null;
  mode: string | null;
  /** Where each consuming skill writes, keyed by skill. */
  test_outputs: Record<string, string[]>;
}

type RawLayer = Record<string, unknown>;

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
 * A list field, with anything unusable dropped rather than carried.
 *
 * Absent and empty are the same answer here — `providers: []` and no
 * `providers` key both mean "no choice to make" — so both become `[]` and the
 * caller has one shape to handle. Scalars keep `null` because absent and empty
 * string are also the same answer, and `null` says so more plainly than `''`.
 */
export function strList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string' && entry !== '');
}

/** `test_outputs`, which maps a consuming skill to the paths it writes. */
export function outputMap(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([skill, paths]) => [
      skill,
      strList(paths),
    ]),
  );
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
      spec_dir: str(row.spec_dir),
      spec_path: str(row.spec_path),
      runtime: str(row.runtime),
      consumer_skill: str(row.consumer_skill),
      also_consumed_by: strList(row.also_consumed_by),
      backing_package: str(row.backing_package),
      backing_runtime_package: str(row.backing_runtime_package),
      providers: strList(row.providers),
      targets: strList(row.targets),
      variants: strList(row.variants),
      selected_by: str(row.selected_by),
      mode: str(row.mode),
      test_outputs: outputMap(row.test_outputs),
    }));
}

/**
 * A document language code, as `/kiwa-design --lang` accepts it.
 *
 * `en` is the default and carries no suffix, so the two ways of asking for
 * English (`--lang en` and omitting the flag) resolve to the same path.
 */
export type DocLang = string | undefined;

/**
 * ISO 639-1: exactly two lowercase letters.
 *
 * The value lands in a path that skills then open, so anything permissive is a
 * traversal. `--lang ../../etc/passwd` produced
 * `test-spec-{module}.api.../../etc/passwd.md` before this check (measured).
 *
 * Region subtags (`zh-CN`) are refused too. The convention this implements
 * (`/kiwa-design` § lang suffix 規約) says ISO 639-1, every code in the repo is
 * two letters, and widening it later is a decision someone can make against a
 * real need rather than a hole left open in advance.
 */
const DOC_LANG_PATTERN = /^[a-z]{2}$/;

/** Whether a code is one the suffix may be built from. */
export function isValidDocLang(lang: string): boolean {
  return DOC_LANG_PATTERN.test(lang);
}

/**
 * `docs/layers.json` declares the English spec path. `/kiwa-design --lang ja`
 * writes `test-spec-{module}.nextjs.ja.md` instead, and until #1855 nothing
 * reconciled the two: the declaration said one thing, the producer wrote
 * another, and the consumers that read `spec_path` looked in the wrong place.
 *
 * Applied here rather than in each skill so that a caller does not have to know
 * the convention. Two of the three consumers did not, and the one that did
 * (`kiwa-review`) carried its own copy.
 *
 * The suffix goes last, after any layer suffix: `test-spec-foo.api.ja.md`.
 */
export function withLangSuffix(path: string, lang: DocLang): string {
  if (lang === undefined || lang === '' || lang === 'en') return path;
  // Refused rather than sanitised. A code that is not a code means the caller
  // passed something it did not mean to, and quietly stripping the bad part
  // would hand back a path nobody wrote.
  if (!isValidDocLang(lang)) {
    throw new Error(`invalid language code: ${JSON.stringify(lang)} (expected ISO 639-1, e.g. ja)`);
  }
  // Inserted before the final extension so the file stays a `.md`. Appending
  // would produce `test-spec-foo.nextjs.md.ja`, which no reader globs for.
  const dot = path.lastIndexOf('.');
  if (dot <= path.lastIndexOf('/')) return `${path}.${lang}`;
  return `${path.slice(0, dot)}.${lang}${path.slice(dot)}`;
}

/**
 * The same layers with their spec paths resolved for a document language.
 *
 * Only `spec_path` moves. `spec_dir` is a directory, and `test_outputs` are
 * generated tests whose paths do not carry the language (`--lang` sets the
 * comment language there, not the file name).
 */
export function applyLang(layers: LayerRecord[], lang: DocLang): LayerRecord[] {
  if (lang === undefined || lang === '' || lang === 'en') return layers;
  return layers.map((layer) => ({
    ...layer,
    spec_path: layer.spec_path === null ? null : withLangSuffix(layer.spec_path, lang),
  }));
}

/**
 * The layers some signal in the table actually names.
 *
 * Asked per layer rather than per language, because signal coverage is uneven
 * within a language. Rust and Go happen to be complete — every one of their
 * five layers is named — so for them the two questions have the same answer.
 * TypeScript is not: one signal (`next`) names five of its nineteen layers.
 *
 * Asking per language would let evidence about those five license dropping the
 * other fourteen, which no signal could have detected. The caller narrows on
 * "detected or not", and that only means something for a layer the table could
 * have detected in the first place.
 *
 * Both halves count. A layer named only by a generated signal is still a layer
 * the table can speak about.
 */
function layersWithSignals(table: SignalTable | null): Set<string> {
  const out = new Set<string>();
  if (!table) return out;
  const lists = [...Object.values(table.signals ?? {}), table.generated?.signals ?? []];
  for (const list of lists) {
    for (const signal of list ?? []) {
      if (signal?.layer) out.add(signal.layer);
      if (signal?.default) out.add(signal.default);
      for (const layer of signal?.also ?? []) out.add(layer);
      for (const layer of Object.values(signal?.features ?? {})) out.add(layer);
    }
  }
  return out;
}

/** The languages a manifest reader exists for, whether or not it has signals. */
function readableLanguages(table: SignalTable | null): Set<string> {
  return new Set(Object.values(table?.manifests ?? {}));
}

interface StackFile {
  generated_at?: unknown;
  scanned?: unknown;
  detected?: unknown;
  /** Fingerprint of the signal table that produced the recording. */
  signals?: unknown;
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
function validate(
  cwd: string,
  file: StackFile,
  table: LayerRecord[],
  signalTable: SignalTable | null,
): string | null {
  // Which table produced the answer, checked before anything reads the answer.
  //
  // The rest of this function compares the recording against the project, which
  // catches "the project changed". It cannot catch "the table changed" — and a
  // recording taken before a signal existed carries no verdict on the layer that
  // signal names. Narrowing on its silence removes exactly the layers the signal
  // was added to find, on a `.kiwa/stack.json` that is otherwise entirely valid.
  //
  // Recordings written before this field existed have none, and are rejected.
  // The file is a cache of a derivation; re-running costs a second.
  const expected = signalsFingerprint(signalTable);
  const recorded = str(file.signals);
  if (!expected) return 'the signal table could not be read';
  if (!recorded) return 'it does not record which signal table produced it';
  if (recorded !== expected) return 'it was taken with a different signal table';

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
  /**
   * Injectable so a test can state which languages the table speaks for.
   *
   * `null` means the table is missing, which is not the same as omitting the
   * option — omitting it loads the real file.
   */
  signalTable?: SignalTable | null | undefined;
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
  // Loaded once and used for three questions: whether the recording came from
  // this table, which languages have a reader, and which layers can be narrowed.
  // The pair only makes sense against one answer.
  const signalTable =
    options.signalTable === undefined
      ? loadJson<SignalTable>('stack-signals.json')
      : options.signalTable;

  const rejected = validate(options.cwd, file, table, signalTable);
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

  const readable = readableLanguages(signalTable);
  const speakable = layersWithSignals(signalTable);

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
    // Opened, but no signal names this layer, so "nothing detected" carries no
    // information about it. Fourteen of the nineteen TypeScript layers are here
    // today: `next` names the five `nextjs-*` ones and nothing names the rest.
    if (!speakable.has(layer.id)) return true;
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
