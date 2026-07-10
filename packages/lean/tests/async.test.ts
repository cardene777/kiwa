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
import { join, resolve } from 'node:path';
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

/**
 * Where `lean` really is, so a wrapper script can hand its arguments on.
 *
 * `command -v` prints the name rather than a path when the name is a shell
 * function or a builtin, and `sh` will define functions from `$ENV` before it
 * runs anything. Handing `PATH` alone leaves nothing for it to read, and the
 * result is checked rather than trusted.
 */
export function resolveLeanPath(found: string): string {
  // A bare name is a function or a builtin. A relative path is a `PATH` entry
  // like `bin/lean`, which is a real installation and only needs resolving.
  if (!found.includes('/')) throw new Error(`lean did not resolve to a path: ${found}`);
  return resolve(found);
}

function leanPath(): string {
  return resolveLeanPath(
    execFileSync('sh', ['-c', 'command -v lean'], {
      encoding: 'utf-8',
      env: { PATH: process.env.PATH ?? '' },
    }).trim(),
  );
}

/** `text` as one `sh` word, whatever it contains. */
function shellQuote(text: string): string {
  return `'${text.replaceAll("'", `'\\''`)}'`;
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

  // Every path is one quoted `sh` word. A `TMPDIR` holding a `$`, a backtick or
  // a quote would otherwise be read as shell source.
  const lean = shellQuote(leanPath());
  const liveDir = shellQuote(live);
  const peakPath = shellQuote(peakFile);

  const leanBin = join(scratch, 'lean-wrapper');
  writeFileSync(
    leanBin,
    [
      '#!/bin/sh',
      'for arg in "$@"; do',
      `  [ "$arg" = "--version" ] && exec ${lean} "$@"`,
      'done',
      `mkdir ${liveDir}/"$$" || exit 97`,
      `ls ${liveDir} | wc -l >> ${peakPath}`,
      `${lean} "$@"`,
      'code=$?',
      `rmdir ${liveDir}/"$$"`,
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

describe('the probe resolves the binary it wraps', () => {
  it('T-ASYNC-034 a bare name is a shell function, not an installation', () => {
    // `command -v` prints the name for a function or a builtin. Embedding that
    // in the wrapper would have it call itself, or a builtin, or nothing.
    expect(() => resolveLeanPath('lean')).toThrow(/did not resolve to a path/);
    expect(() => resolveLeanPath('echo')).toThrow(/did not resolve to a path/);
  });

  it('T-ASYNC-035 a relative path is an installation, and is made absolute', () => {
    // A `PATH` entry like `bin` finds `bin/lean`. That is real, and only needs
    // resolving. Rejecting it would fail on a machine where Lean works.
    expect(resolveLeanPath('bin/lean')).toBe(resolve('bin/lean'));
    expect(resolveLeanPath('/opt/homebrew/bin/lean')).toBe('/opt/homebrew/bin/lean');
  });
});

describe('the reason for the async path', () => {
  it.skipIf(!HAS_LEAN)('T-ASYNC-030 the event loop keeps running while Lean runs', async () => {
    // No duration is asserted. `elapsed > 50` used to be here, on the argument
    // that load can only make Lean slower. True, and beside the point: a faster
    // machine or a quicker Lean makes it smaller, and the test fails while
    // nothing is wrong.
    //
    // Nor is a queued callback enough on its own. `runLeanSourceAsync` awaits
    // `detectLeanBinaryAsync` before it runs anything, so the event loop turns
    // once no matter what the run does afterwards. A `setTimeout(0)` fires
    // there and proves nothing.
    //
    // So make the run itself depend on the event loop, and only after it has
    // started. The wrapper announces that it is running and then waits for the
    // test to answer. The test can only answer from a timer callback, which a
    // synchronous call does not let run. Then the wrapper gives up after ten
    // seconds and exits non-zero, and the report is not `ok`.
    //
    // Announcing first is the point. A callback armed before the run cannot
    // tell the two apart: it fires during the `await` on the version check,
    // whatever happens next.
    const scratch = mkdtempSync(join(tmpdir(), 'lean-eventloop-'));
    scratches.push(scratch);
    const started = join(scratch, 'started');
    const go = join(scratch, 'go');
    const wrapper = join(scratch, 'lean-wrapper');
    const lean = shellQuote(leanPath());
    writeFileSync(
      wrapper,
      [
        '#!/bin/sh',
        'for arg in "$@"; do',
        `  [ "$arg" = "--version" ] && exec ${lean} "$@"`,
        'done',
        `: > ${shellQuote(started)}`,
        'waited=0',
        `while [ ! -f ${shellQuote(go)} ]; do`,
        '  sleep 0.05',
        '  waited=$((waited + 1))',
        '  [ "$waited" -gt 200 ] && exit 98',
        'done',
        `exec ${lean} "$@"`,
      ].join('\n'),
    );
    chmodSync(wrapper, 0o755);

    const pending = checkLeanTableAsync(SPEC, { leanBin: wrapper });
    const answer = setInterval(() => {
      if (existsSync(started)) {
        writeFileSync(go, '');
        clearInterval(answer);
      }
    }, 10);
    const report = await pending;
    clearInterval(answer);

    expect(report.status).toBe('ok');
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
