#!/usr/bin/env node
/**
 * Record what a gate's artefact was measured against.
 *
 * Run from a package directory, after the command that produced the artefact
 * succeeded:
 *
 *   node ../../scripts/record-artifact-inputs.mjs coverage
 *
 * `test:mutation` does not call this — `scripts/package-mutation.mjs` records
 * from inside its own success path, where it already knows the run finished.
 * `test:cov` is 26 different inline commands, so it appends this instead of
 * being rewritten into a shared runner; the shapes differ per package
 * (`--coverage.exclude`, timeouts) and folding them together is a change to
 * how every package measures, not to when it records.
 *
 * Chained with `&&`, so a failed measurement never reaches it. That ordering is
 * the point: a sidecar written after a failed run would pair this content with
 * an artefact from an earlier one, and the gate would read the stale artefact
 * as current.
 *
 * Exits 0 even when it cannot record. The artefact is valid; only the stronger
 * of the two freshness checks is unavailable, and the gate falls back to
 * comparing timestamps. Failing here would turn "could not record" into "the
 * measurement failed", which is not true and would stop the caller's chain.
 */
import { existsSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isMainModule } from './lib/is-main-module.mjs';
import { recordArtifactInputs } from './lib/input-fingerprint.mjs';
import { COVERAGE_INPUT_DIRS, MUTATION_INPUT_DIRS } from './lib/gate-inputs.mjs';

const REPO_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

/** What each kind produces and depends on. */
export const KINDS = {
  coverage: { artifactRel: 'coverage/coverage-summary.json', inputs: COVERAGE_INPUT_DIRS },
  mutation: { artifactRel: 'mutation-report/mutation.json', inputs: MUTATION_INPUT_DIRS },
};

/**
 * The compiled copy both kinds measure.
 *
 * `test:cov` and `test:mutation` delete it and recompile before running, so
 * its mtimes mark when the compiler last read `src/` and `tests/`. The
 * recorder refuses to pair inputs newer than that with the artefact.
 */
export const BUILD_DIR = '.vitest-dist';

/**
 * Record what a package's artefact was measured against.
 *
 * The single place both kinds resolve their paths: the artefact, the inputs,
 * and the build the run compiled into. `package-mutation.mjs` comes through
 * here too, so the build the recorder compares against cannot be wired one way
 * for coverage and another for mutation.
 *
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function recordForPackage({ kind, cwd, repoRoot, exists = existsSync, record = recordArtifactInputs }) {
  const spec = KINDS[kind];
  if (!spec) {
    return { ok: false, reason: `unknown kind "${kind}" — expected one of ${Object.keys(KINDS).join(' / ')}` };
  }

  const artifactAbs = resolve(cwd, spec.artifactRel);
  if (!exists(artifactAbs)) {
    // Nothing was produced. Recording here would describe inputs for an
    // artefact that is not there, and the next run would find a sidecar
    // without its pair.
    return { ok: false, reason: `no ${spec.artifactRel} in ${cwd} — nothing to record` };
  }

  const pkgRel = relative(repoRoot, cwd).split(/[\\/]/).join('/');
  if (pkgRel === '' || pkgRel.startsWith('..')) {
    return { ok: false, reason: `${cwd} is outside ${repoRoot}` };
  }

  const result = record({
    repoRoot,
    inputRels: spec.inputs.map((suffix) => `${pkgRel}/${suffix}`),
    artifactAbs,
    buildDirAbs: resolve(cwd, BUILD_DIR),
  });
  return result.ok ? { ok: true } : { ok: false, reason: result.reason };
}

if (isMainModule(process.argv[1], import.meta.url)) {
  const kind = process.argv[2];
  const result = recordForPackage({ kind, cwd: process.cwd(), repoRoot: REPO_ROOT });
  if (!result.ok) {
    process.stderr.write(`record-artifact-inputs: ${result.reason}\n`);
  }
  process.exit(0);
}
