// Behaviour tests for test-all.mjs helpers.
// Runs with Node's built-in test runner (no vitest dependency at repo root):
//   node --test scripts/test-all.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  TOOL_SIGNATURES,
  argValue,
  classifyFailure,
  dirtiedPaths,
  discoverPackages,
  failureLines,
  groupAlive,
  killGroup,
  parsePorcelain,
  parseProjectList,
  runCommand,
  verdictOf,
} from './test-all.mjs';

const sh = (script, timeoutMs = 5000) =>
  runCommand({ command: 'sh', args: ['-c', script], cwd: process.cwd(), timeoutMs });

// Importing this module must not run the sweep. If it did, this file would
// take an hour and the assertions below would never be reached.
test('importing the script does not run it', () => {
  assert.ok(Array.isArray(TOOL_SIGNATURES));
});

test('classifyFailure names the tool a Playwright failure blames', () => {
  const output = [
    'browserType.launch: Executable doesn\'t exist at /Users/x/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-mac/headless_shell',
    'Looks like Playwright Test or Playwright was just installed or updated.',
  ].join('\n');
  const cause = classifyFailure(output);
  assert.equal(cause?.tool, 'Playwright Chromium');
  assert.equal(cause?.install, 'pnpm exec playwright install chromium');
  assert.match(cause.line, /Executable doesn't exist at/);
});

// The exact string `packages/dapp/src/anvil.ts:119` throws. Not `spawn anvil
// ENOENT`, which is what this table guessed first and what it never sees.
test('classifyFailure names Foundry by the message dapp actually throws', () => {
  assert.equal(classifyFailure('Error: anvil not found in PATH').tool, 'Foundry (anvil)');
  assert.equal(classifyFailure('Error: spawn anvil ENOENT'), null);
});

// Twenty-six examples depend on testcontainers and every one of them passes
// with `DOCKER_HOST` pointed at nothing: containers only start in the `real`
// adapters, which `pnpm test` does not reach. A Docker signature here would
// classify nothing, forever.
test('classifyFailure has no Docker signature, because nothing needs Docker', () => {
  assert.equal(classifyFailure('Cannot connect to the Docker daemon'), null);
  assert.equal(TOOL_SIGNATURES.some((s) => /docker/i.test(s.tool)), false);
});

// The assertion the whole script rests on. Without it, a classifier that
// returns a tool for every failure turns every red package into "not run",
// which reads as "passed", which is the bug this script exists to prevent.
test('classifyFailure says no to a failure that blames no tool', () => {
  assert.equal(classifyFailure('AssertionError: expected 3 to be 4'), null);
  assert.equal(classifyFailure('FAIL tests/foo.test.ts > adds two numbers'), null);
  assert.equal(classifyFailure(''), null);
});

test('classifyFailure does not match a tool named in passing prose', () => {
  // A test whose *name* mentions docker must not be excused as blocked.
  assert.equal(classifyFailure('✓ starts a docker container when configured (mocked)'), null);
});

// Pinning the strings, not restating the table. Asserting that
// `classifyFailure(evidence)` matches `evidence` would pass for any invented
// string; that is how `spawn anvil ENOENT` survived a first draft. Each of
// these was copied out of a failure produced by hiding the tool.
test('the signatures are the exact strings the tools print', () => {
  assert.deepEqual(
    TOOL_SIGNATURES.map((s) => [s.tool, s.evidence]),
    [
      ['Playwright Chromium', ["Executable doesn't exist at"]],
      ['Foundry (anvil)', ['anvil not found in PATH']],
    ],
  );
  for (const { install } of TOOL_SIGNATURES) assert.ok(install.length > 0, 'says how to install it');
});

test('classifyFailure says no to a plausible string no tool prints', () => {
  assert.equal(classifyFailure('Error: chromium is not installed'), null);
  assert.equal(classifyFailure('Error: could not find anvil'), null);
});

// The first signature found wins, so a failure that mentions a tool AND fails
// on its own is classified blocked. That is why blocked counts as a failure by
// default: the classification is a hint about what to install, never a reason
// to call the sweep green.
test('a failure that also mentions a missing tool is classified blocked', () => {
  const output = ['AssertionError: expected 3 to be 4', "Executable doesn't exist at /x"].join('\n');
  assert.equal(classifyFailure(output)?.tool, 'Playwright Chromium');
});

/** `git status --porcelain -z`: NUL after every record, nothing quoted. */
const z = (...records) => records.map((record) => `${record}\0`).join('');

test('parsePorcelain reads modified, added, deleted and untracked paths', () => {
  const text = z(' M packages/core/src/index.ts', 'A  scripts/new.mjs', ' D docs/old.md', '?? out.json');
  assert.deepEqual(parsePorcelain(text), [
    'packages/core/src/index.ts',
    'scripts/new.mjs',
    'docs/old.md',
    'out.json',
  ]);
});

test('parsePorcelain counts both sides of a rename', () => {
  assert.deepEqual(parsePorcelain(z('R  new.ts', 'old.ts')), ['new.ts', 'old.ts']);
});

// The human format writes `R  old -> new` and quotes anything with a space, so
// a file named `a -> b.ts` came back as three mangled fragments. `-z` has no
// separator to collide with and no quoting to undo.
test('parsePorcelain survives a path that contains the rename separator', () => {
  assert.deepEqual(parsePorcelain(z('R  c d.ts', 'a -> b.ts')), ['c d.ts', 'a -> b.ts']);
});

test('parsePorcelain reads a path with a space, unquoted', () => {
  assert.deepEqual(parsePorcelain(z('?? weird name.ts')), ['weird name.ts']);
});

test('parsePorcelain reads an unmerged entry', () => {
  assert.deepEqual(parsePorcelain(z('UU src/conflict.ts')), ['src/conflict.ts']);
});

test('parsePorcelain returns nothing for a clean tree', () => {
  assert.deepEqual(parsePorcelain(''), []);
  assert.deepEqual(parsePorcelain('\0'), []);
});

test('dirtiedPaths reports only what a package added', () => {
  const before = ['a.ts', 'b.ts'];
  const after = ['a.ts', 'b.ts', 'report.json'];
  assert.deepEqual(dirtiedPaths(before, after), ['report.json']);
});

// A tree that was already dirty before the sweep started must not be blamed on
// the first package that happens to run.
test('dirtiedPaths ignores dirt that was already there', () => {
  assert.deepEqual(dirtiedPaths(['a.ts'], ['a.ts']), []);
  assert.deepEqual(dirtiedPaths(['a.ts'], []), []);
});

// A package that failed AND dirtied the tree was pushed into both buckets, so
// `green + red + dirty + not run` could exceed the number of packages. One
// verdict each.
test('verdictOf gives exactly one verdict per package', () => {
  assert.equal(verdictOf({ ok: true, cause: null, dirty: false }), 'green');
  assert.equal(verdictOf({ ok: true, cause: null, dirty: true }), 'dirty');
  assert.equal(verdictOf({ ok: false, cause: null, dirty: false }), 'red');
  assert.equal(verdictOf({ ok: false, cause: null, dirty: true }), 'red');
  assert.equal(verdictOf({ ok: false, cause: { tool: 'x' }, dirty: false }), 'blocked');
  assert.equal(verdictOf({ ok: false, cause: { tool: 'x' }, dirty: true }), 'blocked');
});

test('verdictOf never calls a failing package green or dirty', () => {
  for (const cause of [null, { tool: 'x' }]) {
    for (const dirty of [true, false]) {
      const verdict = verdictOf({ ok: false, cause, dirty });
      assert.notEqual(verdict, 'green');
      assert.notEqual(verdict, 'dirty', 'a failure is not merely untidy');
    }
  }
});

// A package that prints a megabyte and then `anvil not found in PATH` is
// blocked, not red. Dropping everything past the cap threw that line away.
test('runCommand keeps the tail of an overflowing output', async () => {
  const result = await runCommand({
    command: 'sh',
    args: ['-c', 'head -c 20000 /dev/zero | tr "\\0" "x"; echo; echo "anvil not found in PATH"'],
    cwd: process.cwd(),
    timeoutMs: 10_000,
    maxBytes: 1024,
    tailBytes: 512,
  });
  assert.equal(result.overflowed, true);
  assert.equal(result.ok, false, 'truncated output is not evidence the tests passed');
  assert.match(result.output, /output truncated/);
  assert.equal(
    classifyFailure(result.output)?.tool,
    'Foundry (anvil)',
    'the evidence survived the truncation',
  );
});

/** A stand-in for reading `package.json` off disk. */
function manifests(byPath) {
  return (path) => byPath[path] ?? null;
}

test('discoverPackages takes only projects that declare a test script', () => {
  const projects = [
    { path: '/repo/packages/alpha' },
    { path: '/repo/packages/beta' },
  ];
  const read = manifests({
    '/repo/packages/alpha/package.json': { name: 'alpha', scripts: { test: 'x' } },
    '/repo/packages/beta/package.json': { name: 'beta', scripts: { build: 'x' } },
  });
  assert.deepEqual(discoverPackages(projects, '/repo', read).map((p) => p.name), ['alpha']);
});

// The root's `test` is `pnpm -r test`. Running it inside the sweep would run
// the sweep's job again, from inside one of its own steps.
test('discoverPackages excludes the repository root', () => {
  const projects = [{ path: '/repo' }, { path: '/repo/packages/alpha' }];
  const read = manifests({
    '/repo/package.json': { name: 'kiwa', scripts: { test: 'pnpm -r test' } },
    '/repo/packages/alpha/package.json': { name: 'alpha', scripts: { test: 'x' } },
  });
  assert.deepEqual(discoverPackages(projects, '/repo', read).map((p) => p.name), ['alpha']);
});

// A directory walk with a hand-kept list of top directories would miss this.
// pnpm knows about it because `pnpm-workspace.yaml` says so.
test('discoverPackages finds a project outside the usual directories', () => {
  const projects = [{ path: '/repo/somewhere/else/gamma' }];
  const read = manifests({
    '/repo/somewhere/else/gamma/package.json': { name: 'gamma', scripts: { test: 'x' } },
  });
  assert.deepEqual(discoverPackages(projects, '/repo', read).map((p) => p.name), ['gamma']);
});

test('discoverPackages survives a project whose manifest cannot be read', () => {
  const projects = [{ path: '/repo/packages/alpha' }, { path: '/repo/packages/gone' }];
  const read = manifests({
    '/repo/packages/alpha/package.json': { name: 'alpha', scripts: { test: 'x' } },
  });
  assert.deepEqual(discoverPackages(projects, '/repo', read).map((p) => p.name), ['alpha']);
});

test('discoverPackages returns packages in a stable order', () => {
  const projects = [{ path: '/repo/z' }, { path: '/repo/a' }];
  const read = manifests({
    '/repo/z/package.json': { name: 'z', scripts: { test: 'x' } },
    '/repo/a/package.json': { name: 'a', scripts: { test: 'x' } },
  });
  assert.deepEqual(discoverPackages(projects, '/repo', read).map((p) => p.name), ['a', 'z']);
});

test('runCommand reports a command that succeeds', async () => {
  const r = await sh('exit 0');
  assert.equal(r.ok, true);
  assert.equal(r.timedOut, false);
});

test('runCommand reports a command that fails', async () => {
  const r = await sh('exit 3');
  assert.equal(r.ok, false);
  assert.equal(r.timedOut, false);
});

test('runCommand captures both stdout and stderr', async () => {
  const r = await sh('echo out; echo err >&2');
  assert.match(r.output, /out/);
  assert.match(r.output, /err/);
});

test('runCommand kills a command that runs past its limit', async () => {
  const started = Date.now();
  const r = await sh('sleep 30', 400);
  assert.equal(r.timedOut, true);
  assert.equal(r.ok, false);
  assert.ok(Date.now() - started < 5000, 'returns without waiting for the sleep');
});

// The bug this replaced `execFile`'s `timeout` for. `pnpm` catches `SIGTERM`
// and exits 0, so `execFile` reported `error: null` and the sweep counted a
// package it had just killed as green. Here the timer decides, not the child.
test('runCommand is not fooled by a child that exits 0 when asked to stop', async () => {
  const r = await sh('trap "exit 0" TERM; sleep 30', 400);
  assert.equal(r.timedOut, true);
  assert.equal(r.ok, false, 'a killed command never counts as green');
});

// `next build` and dev servers outlive the shell that started them and hold the
// pipes open. Killing the process group is what makes `close` fire at all.
test('runCommand kills a child that ignores SIGTERM', async () => {
  const started = Date.now();
  const r = await sh('trap "" TERM; sleep 30', 400);
  assert.equal(r.timedOut, true);
  assert.equal(r.ok, false);
  assert.ok(Date.now() - started < 5000, 'SIGKILL to the process group, not SIGTERM to the leader');
});

// `close` fires when the stdio pipes close, not when the child exits. A
// background grandchild inherits the pipes and holds them open. Waiting for
// `close` reported this command — which exits 0 immediately — as a hang, and
// burned the whole per-package limit doing it.
test('runCommand does not wait for a grandchild that outlives a passing command', async () => {
  const started = Date.now();
  const r = await sh('sleep 5 & exit 0', 1500);
  assert.equal(r.ok, true, 'exited 0, so it passed');
  assert.equal(r.timedOut, false);
  assert.ok(Date.now() - started < 2500, `settled in ${Date.now() - started}ms, not after the sleep`);
});

// The same shape, but the command really does hang. It must still settle
// promptly once killed, rather than waiting on pipes a grandchild holds.
test('runCommand settles after killing a command whose grandchild holds the pipes', async () => {
  const started = Date.now();
  const r = await sh('sleep 20 & sleep 20', 600);
  assert.equal(r.timedOut, true);
  assert.equal(r.ok, false);
  assert.ok(Date.now() - started < 4000, `settled in ${Date.now() - started}ms`);
});

// The kill is what makes a timeout mean something. Removing it from `settle`
// must not remove it from the timeout path.
test('runCommand really does kill the group it timed out on', async () => {
  const marker = join(tmpdir(), `test-all-kill-${process.pid}-${Math.random()}`);
  // The child's own child writes the marker two seconds from now, if it lives.
  await sh(`( sleep 2; : > ${marker} ) & sleep 30`, 400);
  await new Promise((r) => setTimeout(r, 2500));
  assert.equal(existsSync(marker), false, 'the group was killed, so nothing wrote the marker');
});

/** Record every signal actually sent, ignoring signal 0, which only asks. */
async function withSignalsRecorded(body) {
  const sent = [];
  const real = process.kill.bind(process);
  process.kill = (pid, signal) => {
    if (signal !== 0) sent.push([pid, signal]);
    return real(pid, signal);
  };
  try {
    return { result: await body(), sent };
  } finally {
    process.kill = real;
  }
}

/** Hold the event loop for `ms`, the way a synchronous build step would. */
function stallTheLoop(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // Busy on purpose.
  }
}

// After a child has exited and been reaped, its pid belongs to whoever the
// operating system gives it to next. `settle` used to signal it anyway.
test('runCommand sends no signal after a command exits on its own', async () => {
  const { result, sent } = await withSignalsRecorded(() => sh('exit 0', 5000));
  assert.equal(result.ok, true);
  assert.deepEqual(sent, [], 'a clean exit signals nothing');
});

// `exitCode === null` means our `exit` handler has not run, not that the child
// is alive. A busy loop delivers the timer first. This command finishes in a
// millisecond and used to come back `{ ok: false, timedOut: true }`, having
// SIGKILLed a pid it no longer owned.
test('runCommand does not call a finished command timed out because the loop was busy', async () => {
  const { result, sent } = await withSignalsRecorded(async () => {
    const pending = sh('exit 0', 10);
    stallTheLoop(200);
    return pending;
  });
  assert.equal(result.timedOut, false, 'it exited; it did not run out of time');
  assert.equal(result.ok, true);
  assert.deepEqual(sent, [], 'nothing is signalled at a pid that has been released');
});

// And the same stall must not stop a real hang from being killed.
test('runCommand still kills a real hang when the loop was busy', async () => {
  const pending = sh('sleep 30', 10);
  stallTheLoop(200);
  const r = await pending;
  assert.equal(r.timedOut, true);
  assert.equal(r.ok, false);
});

// `groupAlive(pid)` asks about the group whose id is `pid` — that is, the group
// led by the process with that pid. This process is not a group leader, so
// `groupAlive(process.pid)` is correctly false. Its own group's id is a
// different number, and `killGroup` is only ever handed the pid of a child
// spawned `detached`, which is a leader by construction.
test('groupAlive answers for a group that exists and one that does not', () => {
  assert.equal(groupAlive(process.pid), false, 'this process leads no group');
  assert.equal(groupAlive(2 ** 30), false, 'a pid that cannot exist');
  assert.equal(groupAlive(undefined), false, 'no pid at all');
  assert.equal(groupAlive(999999), false);
});

// `killGroup` used to fall back to `child.kill('SIGKILL')` — a *positive* pid —
// when the group kill threw. A positive pid that has been released belongs to
// whoever the operating system gave it to. Losing the group means sending
// nothing.
test('killGroup does not fall back to the child pid when the group is gone', () => {
  let childKilled = false;
  const gone = {
    pid: 2 ** 30, // no such group; `process.kill(-pid)` throws ESRCH
    kill: () => {
      childKilled = true;
      return true;
    },
  };
  assert.equal(killGroup(gone), false, 'it reports that it signalled nothing');
  assert.equal(childKilled, false, 'and it did not reach for the positive pid');
});

test('killGroup signals a group that is there, and says so', async () => {
  const child = spawn('sh', ['-c', 'sleep 5'], { detached: true, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 100));
  assert.equal(killGroup(child), true);
  await new Promise((r) => child.once('exit', r));
  assert.equal(groupAlive(child.pid), false);
});

test('killGroup does nothing without a pid', () => {
  assert.equal(killGroup({ pid: undefined, kill: () => assert.fail('never') }), false);
});

test('groupAlive says yes for a detached child, and no once it is gone', async () => {
  const child = spawn('sh', ['-c', 'sleep 5'], { detached: true, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 100));
  assert.equal(groupAlive(child.pid), true, 'a detached child leads its own group');
  process.kill(-child.pid, 'SIGKILL');
  await new Promise((r) => child.once('exit', r));
  assert.equal(groupAlive(child.pid), false, 'and the group is gone with it');
});

// A child that has exited but has not been reaped is a zombie. Its pid is
// taken, so `kill(-pid, 0)` answers `EPERM` rather than `ESRCH`, and there is
// nothing there to kill. An implementation that reads `EPERM` as "alive" marks
// a package that finished in a millisecond as a hang.
test('groupAlive says no to a zombie, which answers EPERM rather than ESRCH', async () => {
  const child = spawn('sh', ['-c', 'exit 0'], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
  stallTheLoop(200); // it dies; nothing reaps it, because the loop is busy

  let code = null;
  try {
    process.kill(-child.pid, 0);
  } catch (error) {
    code = error.code;
  }
  assert.equal(code, 'EPERM', 'a zombie group leader is neither gone nor killable');
  assert.equal(child.exitCode, null, 'and Node has not reaped it yet');
  assert.equal(groupAlive(child.pid), false, 'so it is not ours to signal');

  await new Promise((r) => child.once('exit', r));
});

// How many turns of the loop it takes for `exit` to arrive is not something to
// assert on. Ten samples said one `setImmediate`; inside this suite it took
// more. So `runCommand` does not wait for the handler at all — it asks the
// operating system whether the group is still there, which is the test above.

// The branch `setImmediate` almost always skips: the child is gone, its `exit`
// has not arrived, and the deadline has passed. Nothing may be signalled.
test('runCommand signals nothing when the group is already gone at the deadline', async () => {
  const { result, sent } = await withSignalsRecorded(() =>
    runCommand({
      command: 'sh',
      args: ['-c', 'sleep 1'],
      cwd: process.cwd(),
      timeoutMs: 100,
      killGraceMs: 4000,
      aliveFn: () => false,
    }),
  );
  assert.equal(result.timedOut, false, 'a group that is gone did not run out of time');
  assert.equal(result.ok, true, 'the real exit code arrives and decides');
  assert.deepEqual(sent, [], 'nothing is signalled at a group we no longer own');
});

test('runCommand reports a command that does not exist', async () => {
  const r = await runCommand({
    command: 'this-command-does-not-exist',
    args: [],
    cwd: process.cwd(),
    timeoutMs: 2000,
  });
  assert.equal(r.ok, false);
  assert.match(r.output, /ENOENT/);
});

test('runCommand refuses output larger than its cap', async () => {
  const r = await runCommand({
    command: 'sh',
    args: ['-c', 'head -c 200000 /dev/zero | tr "\\0" "x"'],
    cwd: process.cwd(),
    timeoutMs: 10_000,
    maxBytes: 1024,
  });
  assert.equal(r.overflowed, true);
  assert.equal(r.ok, false, 'truncated output is not evidence the tests passed');
});

// A sweep that dies before running a package because pnpm printed a version
// banner is a bad way to learn that `JSON.parse` has no tolerance for prose.
test('parseProjectList ignores anything pnpm prints before the JSON', () => {
  assert.deepEqual(parseProjectList('[{"path":"/a"}]'), [{ path: '/a' }]);
  assert.deepEqual(parseProjectList('Update available! 10.0.0 -> 10.1.0\n[{"path":"/a"}]'), [
    { path: '/a' },
  ]);
});

// Taking the first `[` in the stream is not the same as finding the document.
// A bracketed banner would have thrown, and the sweep dies before it runs one
// package.
test('parseProjectList survives a bracket in the banner', () => {
  assert.deepEqual(parseProjectList('warning [pnpm] slow\n[{"path":"/a"}]'), [{ path: '/a' }]);
  assert.deepEqual(parseProjectList('[deprecated] see docs\n[{"path":"/a"},{"path":"/b"}]'), [
    { path: '/a' },
    { path: '/b' },
  ]);
});

test('parseProjectList throws when there is no JSON at all', () => {
  assert.throws(() => parseProjectList('command not found'), /no JSON array/);
  assert.throws(() => parseProjectList('warning [pnpm] nothing follows'), /no JSON array/);
});

test('argValue reads the value after a flag', () => {
  assert.equal(argValue(['node', 'x', '--only', 'lean'], '--only', null), 'lean');
  assert.equal(argValue(['node', 'x'], '--only', null), null);
  assert.equal(argValue(['node', 'x'], '--timeout', '900'), '900');
});

// `--only --verbose` filtered for the string `--verbose`, matched no package,
// and exited 0 having run nothing.
test('argValue refuses a flag with no value, or with another flag after it', () => {
  assert.throws(() => argValue(['node', 'x', '--only'], '--only', null), /needs a value/);
  assert.throws(() => argValue(['node', 'x', '--only', '--verbose'], '--only', null), /needs a value/);
  assert.throws(() => argValue(['node', 'x', '--timeout', '--only', 'lean'], '--timeout', '900'), /needs a value/);
});

test('failureLines picks out the lines that look like failures', () => {
  const output = ['building...', '  × adds two numbers', 'FAIL tests/x.test.ts', 'done'].join('\n');
  assert.deepEqual(failureLines(output), ['× adds two numbers', 'FAIL tests/x.test.ts']);
});

// A red package with nothing printed under it is not evidence of anything.
test('failureLines falls back to the tail when nothing matches', () => {
  const output = ['one', 'two', 'three', 'four'].join('\n');
  assert.deepEqual(failureLines(output), ['two', 'three', 'four']);
});
