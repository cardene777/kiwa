/**
 * The async API, and the one thing that matters about it: it decides nothing of
 * its own.
 *
 * `execFileSync` stops the event loop for as long as Lean works. A build plugin
 * or a watch mode sharing the process stops with it, and a caller with five
 * machines runs Lean five times in a row because a synchronous call gives no
 * other option.
 *
 * The danger in adding a second path is that it learns different things. That has
 * happened here before: `KIWA_LEAN_SKIP_VERIFY` was read by `verifyLeanSpec` and
 * not by `extractLeanTable`, so a build that turned Lean off turned it off for one
 * of the two functions that ran it. So the tests below spend most of their effort
 * on one claim: for every input, the async function answers what the sync one
 * answers.
 */

import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  checkLeanTable,
  checkLeanTableAsync,
  extractLeanTable,
  extractLeanTableAsync,
} from '../src/extract.js';
import { generateLeanSpec } from '../src/generator.js';
import { UsageError } from '../src/errors.js';
import { detectLeanBinaryAsync } from '../src/lean-runner.js';
import { verifyLeanSpec, verifyLeanSpecAsync } from '../src/verify.js';
import type { OrchestratorSpec } from '../src/types.js';

function leanInstalled(): boolean {
  try {
    execFileSync('lean', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const HAS_LEAN = leanInstalled();

/** Where `lean` really is, so a wrapper script can hand its arguments on. */
function leanPath(): string {
  return execFileSync('sh', ['-c', 'command -v lean'], { encoding: 'utf-8' }).trim();
}

/** Scratch directories the concurrency probes create, removed after each test. */
const scratches: string[] = [];

/**
 * A `leanBin` that records how many Lean *runs* are alive at the same time.
 *
 * It ignores `--version`. `runLeanSourceAsync` asks `detectLeanBinaryAsync`
 * whether the binary is Lean before it runs anything, so the wrapper is invoked
 * twice per call. Under `Promise.all` the four detection calls overlap on their
 * own, and a probe that counted them reported a peak of four while the Lean
 * runs it was supposed to be watching went one at a time. Replacing
 * `execFileAsync` with `execFileSync` in `lean-runner.ts` left that probe green.
 *
 * `mkdir` failing is fatal: two live wrappers cannot share a pid, so a
 * collision would mean a stale directory, and a wrapper that shrugged would
 * remove a directory another process is still counted by.
 */
function concurrencyProbe(prefix: string): { leanBin: string; peak: () => number } {
  const scratch = mkdtempSync(join(tmpdir(), prefix));
  scratches.push(scratch);
  const live = join(scratch, 'live');
  const peakFile = join(scratch, 'peak');
  mkdirSync(live);

  const leanBin = join(scratch, 'lean-wrapper');
  writeFileSync(
    leanBin,
    [
      '#!/bin/sh',
      'for arg in "$@"; do',
      `  [ "$arg" = "--version" ] && exec "${leanPath()}" "$@"`,
      'done',
      `mkdir "${live}/$$" || exit 97`,
      `ls "${live}" | wc -l >> "${peakFile}"`,
      `"${leanPath()}" "$@"`,
      'code=$?',
      `rmdir "${live}/$$"`,
      'exit $code',
    ].join('\n'),
  );
  chmodSync(leanBin, 0o755);

  /** The most Lean runs alive at once. Zero when the probe saw nothing. */
  const peak = () => {
    if (!existsSync(peakFile)) return 0;
    const counts = readFileSync(peakFile, 'utf-8')
      .trim()
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line) => Number(line.trim()));
    return counts.length === 0 ? 0 : Math.max(...counts);
  };
  return { leanBin, peak };
}

const SPEC: OrchestratorSpec = {
  moduleName: 'Probe',
  namespace: 'Probe',
  states: ['init', 'authed', 'expired'],
  events: ['auth-succeeded', 'session-expired', 'timeout'],
  unspecified: 'invalid',
  initial: 'init',
  terminal: ['expired'],
  transitions: [
    { from: 'init', event: 'auth-succeeded', to: 'authed' },
    { from: 'init', event: 'timeout', to: 'expired' },
    { from: 'authed', event: 'session-expired', to: 'expired' },
    { from: 'authed', event: 'timeout', to: 'expired' },
  ],
};

const honest = (): string => generateLeanSpec(SPEC).source;

/** `expired` accepts nothing. Claim it moves, and Lean refuses the file. */
const falseTheorem = (): string =>
  honest().replace(
    /theorem expired_absorbing[\s\S]*?rfl\n/,
    'theorem expired_absorbing : ∀ e, dispatch .Expired e = .to .Init := by\n  intro e; cases e <;> rfl\n',
  );

/** Lean accepts this and prints a cell twice, which is not a table. */
const malformed = (): string =>
  honest().replace(
    /^end «Probe»$/m,
    '#eval IO.println "kiwa-lean-cell:init,timeout,invalid"\n\nend «Probe»',
  );

afterEach(() => {
  delete process.env.KIWA_LEAN_SKIP_VERIFY;
  while (scratches.length > 0) rmSync(scratches.pop() as string, { recursive: true, force: true });
});

describe('the async path answers what the sync path answers', () => {
  const CASES: ReadonlyArray<readonly [string, () => string]> = [
    ['a source Lean accepts', honest],
    ['a false theorem', falseTheorem],
    ['a table with a cell twice', malformed],
    ['a source Lean cannot parse', () => 'namespace Probe\ndef bad : Nat := "x"\nend Probe\n'],
  ];

  it.skipIf(!HAS_LEAN).each(CASES)('T-ASYNC-001 checkLeanTable: %s', async (_why, build) => {
    const source = build();
    const sync = checkLeanTable(SPEC, { source });
    const async = await checkLeanTableAsync(SPEC, { source });

    expect(async.status).toBe(sync.status);
    expect(async.ok).toBe(sync.ok);
    expect(async.checked).toBe(sync.checked);
    expect(async.disagreements).toEqual(sync.disagreements);
  }, 120_000);

  it.skipIf(!HAS_LEAN).each(CASES)('T-ASYNC-002 extractLeanTable: %s', async (_why, build) => {
    const source = build();
    const sync = extractLeanTable(source, SPEC);
    const async = await extractLeanTableAsync(source, SPEC);

    expect(async.status).toBe(sync.status);
    expect(async.table === undefined).toBe(sync.table === undefined);
  }, 120_000);

  it.skipIf(!HAS_LEAN)('T-ASYNC-003 verifyLeanSpec: a spec that verifies', async () => {
    const specs = [generateLeanSpec(SPEC)];

    expect((await verifyLeanSpecAsync(specs)).status).toBe(verifyLeanSpec(specs).status);
  }, 120_000);

  it.skipIf(!HAS_LEAN)('T-ASYNC-004 verifyLeanSpec: a spec that does not', async () => {
    const broken = [{ ...generateLeanSpec(SPEC), source: falseTheorem() }];
    const sync = verifyLeanSpec(broken);
    const async = await verifyLeanSpecAsync(broken);

    expect(async.status).toBe('verification-failed');
    expect(async.status).toBe(sync.status);
    // Positions are rewritten to name the module, not the scratch file, and both
    // paths hand `attribute` the same thing.
    expect(async.diagnostics).toContain('KiwaSpecs/Probe.lean');
    expect(async.diagnostics).toContain('error:');
  }, 120_000);

  it('T-ASYNC-005 a bad call is bad either way', async () => {
    expect(() => verifyLeanSpec([])).toThrow(UsageError);
    await expect(verifyLeanSpecAsync([])).rejects.toThrow(UsageError);

    const specs = [generateLeanSpec(SPEC)];
    expect(() => verifyLeanSpec(specs, { rootNamespace: 'a b', skip: true })).toThrow(UsageError);
    await expect(verifyLeanSpecAsync(specs, { rootNamespace: 'a b', skip: true })).rejects.toThrow(
      UsageError,
    );
  });

  it.skipIf(!HAS_LEAN)('T-ASYNC-006 a workDir that is not a directory rejects', async () => {
    await expect(
      checkLeanTableAsync(SPEC, { workDir: '/definitely/not/a/directory/xyz' }),
    ).rejects.toThrow(UsageError);
  }, 60_000);
});

describe('turning Lean off turns it off on the async path too', () => {
  it('T-ASYNC-010 opts.skip', async () => {
    const report = await checkLeanTableAsync(SPEC, { skip: true });

    expect(report.status).toBe('skipped-by-env');
    expect(report.ok).toBe(false);
    expect(report.checked).toBe(0);
  });

  it('T-ASYNC-011 KIWA_LEAN_SKIP_VERIFY', async () => {
    process.env.KIWA_LEAN_SKIP_VERIFY = '1';

    expect((await checkLeanTableAsync(SPEC)).status).toBe('skipped-by-env');
    expect((await verifyLeanSpecAsync([generateLeanSpec(SPEC)])).status).toBe('skipped-by-env');
  });

  it('T-ASYNC-012 a skip never runs Lean, whatever binary it is handed', async () => {
    const result = await extractLeanTableAsync('namespace X\nend X\n', SPEC, {
      skip: true,
      leanBin: '/definitely/not/lean/xyz',
    });

    expect(result.status).toBe('skipped-by-env');
  });

  it('T-ASYNC-013 a program that is not Lean is not Lean', async () => {
    // `/bin/echo --version` exits 0. Only Lean's own banner counts.
    const report = await checkLeanTableAsync(SPEC, { leanBin: '/bin/echo' });

    expect(report.status).toBe('lean-not-installed');
    expect(report.ok).toBe(false);
  }, 60_000);
});

describe('a tool limit is not a verdict, on the async path either', () => {
  it.skipIf(!HAS_LEAN)('T-ASYNC-020 a timeout is timed-out', async () => {
    const report = await checkLeanTableAsync(SPEC, { timeoutMs: 1 });

    expect(report.status).toBe('timed-out');
    expect(report.ok).toBe(false);
    expect(report.diagnostics).toContain('Raise timeoutMs');
  }, 60_000);

  it.skipIf(!HAS_LEAN)('T-ASYNC-021 a full buffer is output-too-large, not timed-out', async () => {
    // `execFile` kills the child when the buffer fills, and killing it is also
    // what a timeout does: `ENOBUFS` and `SIGTERM` arrive together, exactly as
    // they do in `execFileSync`. Reading the signal first calls an overflow a
    // timeout and sends the reader to raise the wrong knob.
    const report = await checkLeanTableAsync(SPEC, { maxOutputBytes: 1 });

    expect(report.status).toBe('output-too-large');
    expect(report.status).not.toBe('timed-out');
    expect(report.status).not.toBe('verification-failed');
    expect(report.diagnostics).toContain('the rest was lost');
  }, 60_000);
});

describe('the reason for the async path', () => {
  it.skipIf(!HAS_LEAN)('T-ASYNC-030 the event loop keeps running', async () => {
    let ticks = 0;
    const timer = setInterval(() => {
      ticks += 1;
    }, 5);

    const started = Date.now();
    const report = await checkLeanTableAsync(SPEC);
    const elapsed = Date.now() - started;
    clearInterval(timer);

    expect(report.status).toBe('ok');
    // A lower bound on elapsed time, not a ratio between two of them. Load can
    // only make Lean take longer, and only makes the timer fire more often, so
    // neither of these gets closer to failing on a busy machine. The assertion
    // that had to go was `parallelMs < serialMs * 0.75`, which needed an idle
    // core to be true. The sync call fires the timer zero times over this work.
    expect(elapsed).toBeGreaterThan(50);
    expect(ticks).toBeGreaterThanOrEqual(5);
  }, 120_000);

  it.skipIf(!HAS_LEAN)('T-ASYNC-031 the same work runs at once, not one after another', async () => {
    // Count the Lean runs that are alive at the same time, rather than timing
    // the two shapes and asserting one is faster. A wall-clock ratio says
    // nothing on a machine with no spare core: this test read
    // `expected 767 to be less than 589.5` during a full workspace sweep,
    // because four Lean processes cannot overlap when nothing is idle. What
    // the async path promises is that it starts them; how fast they finish is
    // the machine's business.
    const { leanBin, peak } = concurrencyProbe('lean-concurrency-');

    const specs = Array.from({ length: 4 }, (_, i) => ({
      ...SPEC,
      moduleName: `Probe${i}`,
      namespace: `Probe${i}`,
    }));
    const reports = await Promise.all(specs.map((spec) => checkLeanTableAsync(spec, { leanBin })));
    expect(reports.every((r) => r.status === 'ok')).toBe(true);

    // Serial execution can never see two of its own processes alive at once.
    expect(peak()).toBeGreaterThanOrEqual(2);
  }, 300_000);

  it.skipIf(!HAS_LEAN)('T-ASYNC-032 the same probe reports one when the calls are serial', async () => {
    // Without this, T-ASYNC-031 passes against a counter that always says 4.
    const { leanBin, peak } = concurrencyProbe('lean-serial-');

    for (let i = 0; i < 3; i += 1) {
      const spec = { ...SPEC, moduleName: `Serial${i}`, namespace: `Serial${i}` };
      expect((await checkLeanTableAsync(spec, { leanBin })).status).toBe('ok');
    }

    expect(peak()).toBe(1);
  }, 300_000);

  it.skipIf(!HAS_LEAN)('T-ASYNC-033 the probe watches the run, not the version check', async () => {
    // `runLeanSourceAsync` asks the binary whether it is Lean before running
    // anything, so the wrapper is invoked twice per call. Four of those
    // detection calls overlap under `Promise.all` all by themselves. A probe
    // that counted them reported a peak of four while the Lean runs went one at
    // a time, and stayed green when `execFileAsync` was replaced with
    // `execFileSync` in `lean-runner.ts`.
    const { leanBin, peak } = concurrencyProbe('lean-version-');

    // Four detection calls at once. They overlap; the probe must not count them.
    const found = await Promise.all([0, 1, 2, 3].map(() => detectLeanBinaryAsync(leanBin)));
    expect(found.every((bin) => bin !== null)).toBe(true);

    expect(peak()).toBe(0);
  }, 300_000);
});

describe('the scratch directory is removed, on every async path', () => {
  let workDir: string;

  const scratchCount = (): number =>
    readdirSync(workDir).filter((e) => e.startsWith('kiwa-lean-')).length;

  it.skipIf(!HAS_LEAN)('T-ASYNC-040 nothing is left behind, on success or failure', async () => {
    workDir = mkdtempSync(join(tmpdir(), 'kiwa-async-work-'));
    try {
      await checkLeanTableAsync(SPEC, { workDir });
      expect(scratchCount()).toBe(0);

      await checkLeanTableAsync(SPEC, { workDir, source: falseTheorem() });
      expect(scratchCount()).toBe(0);

      await checkLeanTableAsync(SPEC, { workDir, timeoutMs: 1 });
      expect(scratchCount()).toBe(0);

      await checkLeanTableAsync(SPEC, { workDir, maxOutputBytes: 1 });
      expect(scratchCount()).toBe(0);
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  }, 300_000);

  it.skipIf(!HAS_LEAN)('T-ASYNC-041 ten at once leave nothing behind', async () => {
    workDir = mkdtempSync(join(tmpdir(), 'kiwa-async-work-'));
    try {
      const reports = await Promise.all(
        Array.from({ length: 10 }, () => checkLeanTableAsync(SPEC, { workDir })),
      );

      expect(reports.every((r) => r.status === 'ok')).toBe(true);
      expect(scratchCount()).toBe(0);
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  }, 300_000);
});
