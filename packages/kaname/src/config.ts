/**
 * Configuration for kaname.
 *
 * Four sources feed a single resolved config, in descending precedence:
 *
 *   1. explicit arguments  — a caller passing values programmatically
 *   2. environment         — KANAME_TRACKER, KANAME_SPEC_DIR, KANAME_LEAN_VERIFY
 *   3. kaname.config.json  — checked into the repository
 *   4. defaults            — every field has one, so no configuration is required
 *
 * Nothing here touches the filesystem. `loadConfigFile` is the only reader, and
 * it is separate so `resolveConfig` stays pure and directly testable.
 */

/** Where issues live. `none` keeps everything in local files. */
export type TrackerKind = 'none' | 'github' | 'linear';

/**
 * When to run `lean --check` against generated formal specs.
 *
 * - `auto`   run it when a Lean toolchain is on PATH, skip otherwise
 * - `always` run it, and fail when Lean is missing
 * - `never`  do not run it, even when Lean is available
 */
export type LeanVerifyMode = 'auto' | 'always' | 'never';

export interface KanameConfig {
  tracker: TrackerKind;
  /** Directory holding one subdirectory per feature, each with its spec files. */
  specDir: string;
  lean: { verify: LeanVerifyMode };
}

export type PartialKanameConfig = {
  tracker?: TrackerKind;
  specDir?: string;
  lean?: { verify?: LeanVerifyMode };
};

export const DEFAULT_CONFIG: KanameConfig = {
  tracker: 'none',
  specDir: 'docs/spec',
  lean: { verify: 'auto' },
};

export const CONFIG_FILENAME = 'kaname.config.json';

const TRACKERS: readonly TrackerKind[] = ['none', 'github', 'linear'];
const LEAN_MODES: readonly LeanVerifyMode[] = ['auto', 'always', 'never'];

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

function asTracker(value: string, origin: string): TrackerKind {
  if (!TRACKERS.includes(value as TrackerKind)) {
    throw new ConfigError(
      `${origin} has an unknown tracker "${value}"; expected one of ${TRACKERS.join(', ')}`,
    );
  }
  return value as TrackerKind;
}

function asLeanMode(value: string, origin: string): LeanVerifyMode {
  if (!LEAN_MODES.includes(value as LeanVerifyMode)) {
    throw new ConfigError(
      `${origin} has an unknown lean.verify "${value}"; expected one of ${LEAN_MODES.join(', ')}`,
    );
  }
  return value as LeanVerifyMode;
}

function asSpecDir(value: string, origin: string): string {
  const trimmed = value.trim();
  if (trimmed === '') {
    throw new ConfigError(`${origin} has an empty specDir`);
  }
  if (trimmed.startsWith('/') || /^[A-Za-z]:/.test(trimmed)) {
    throw new ConfigError(
      `${origin} has an absolute specDir "${trimmed}"; it must be relative to the project root`,
    );
  }
  if (trimmed.split(/[\\/]/).includes('..')) {
    throw new ConfigError(
      `${origin} has a specDir that escapes the project root: "${trimmed}"`,
    );
  }
  return trimmed;
}

/**
 * Read the environment layer. Unset variables contribute nothing, so an empty
 * environment yields an empty object rather than a config full of undefined.
 */
export function configFromEnv(env: NodeJS.ProcessEnv = process.env): PartialKanameConfig {
  const out: PartialKanameConfig = {};
  const tracker = env.KANAME_TRACKER;
  if (tracker !== undefined && tracker !== '') {
    out.tracker = asTracker(tracker, 'KANAME_TRACKER');
  }
  const specDir = env.KANAME_SPEC_DIR;
  if (specDir !== undefined && specDir !== '') {
    out.specDir = asSpecDir(specDir, 'KANAME_SPEC_DIR');
  }
  const leanVerify = env.KANAME_LEAN_VERIFY;
  if (leanVerify !== undefined && leanVerify !== '') {
    out.lean = { verify: asLeanMode(leanVerify, 'KANAME_LEAN_VERIFY') };
  }
  return out;
}

/**
 * Validate an already-parsed `kaname.config.json` body. Unknown keys are
 * rejected rather than ignored: a typo in a config file is a mistake the author
 * wants to hear about, not silently discard.
 */
export function parseConfigFile(raw: unknown, origin = CONFIG_FILENAME): PartialKanameConfig {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ConfigError(`${origin} must contain a JSON object`);
  }
  const body = raw as Record<string, unknown>;
  const known = new Set(['tracker', 'specDir', 'lean']);
  const unknown = Object.keys(body).filter((k) => !known.has(k));
  if (unknown.length > 0) {
    throw new ConfigError(
      `${origin} has unknown key(s): ${unknown.join(', ')}; expected ${[...known].join(', ')}`,
    );
  }

  const out: PartialKanameConfig = {};
  if (body.tracker !== undefined) {
    if (typeof body.tracker !== 'string') {
      throw new ConfigError(`${origin} tracker must be a string`);
    }
    out.tracker = asTracker(body.tracker, origin);
  }
  if (body.specDir !== undefined) {
    if (typeof body.specDir !== 'string') {
      throw new ConfigError(`${origin} specDir must be a string`);
    }
    out.specDir = asSpecDir(body.specDir, origin);
  }
  if (body.lean !== undefined) {
    if (body.lean === null || typeof body.lean !== 'object' || Array.isArray(body.lean)) {
      throw new ConfigError(`${origin} lean must be an object`);
    }
    const lean = body.lean as Record<string, unknown>;
    const leanUnknown = Object.keys(lean).filter((k) => k !== 'verify');
    if (leanUnknown.length > 0) {
      throw new ConfigError(`${origin} lean has unknown key(s): ${leanUnknown.join(', ')}`);
    }
    if (lean.verify !== undefined) {
      if (typeof lean.verify !== 'string') {
        throw new ConfigError(`${origin} lean.verify must be a string`);
      }
      out.lean = { verify: asLeanMode(lean.verify, origin) };
    }
  }
  return out;
}

/**
 * Merge every layer into a complete config. Later arguments win.
 *
 * `lean` is merged field by field so that setting only `KANAME_LEAN_VERIFY`
 * does not erase a `specDir` coming from the config file.
 */
export function resolveConfig(...layers: readonly PartialKanameConfig[]): KanameConfig {
  const resolved: KanameConfig = {
    tracker: DEFAULT_CONFIG.tracker,
    specDir: DEFAULT_CONFIG.specDir,
    lean: { verify: DEFAULT_CONFIG.lean.verify },
  };
  for (const layer of layers) {
    if (layer.tracker !== undefined) resolved.tracker = layer.tracker;
    if (layer.specDir !== undefined) resolved.specDir = layer.specDir;
    if (layer.lean?.verify !== undefined) resolved.lean.verify = layer.lean.verify;
  }
  return resolved;
}
