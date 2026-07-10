// Behaviour tests for test-all.mjs helpers.
// Runs with Node's built-in test runner (no vitest dependency at repo root):
//   node --test scripts/test-all.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  TOOL_SIGNATURES,
  classifyFailure,
  dirtiedPaths,
  discoverPackages,
  failureLines,
  parsePorcelain,
  runCommand,
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

test('every signature is a string some tool actually prints', () => {
  for (const { tool, install, evidence } of TOOL_SIGNATURES) {
    assert.ok(tool.length > 0, 'tool has a name');
    assert.ok(install.length > 0, `${tool} says how to install it`);
    assert.ok(evidence.length > 0, `${tool} has at least one signature`);
    for (const needle of evidence) {
      assert.equal(classifyFailure(`prefix ${needle} suffix`).tool, tool);
    }
  }
});

test('parsePorcelain reads modified, added, deleted and untracked paths', () => {
  const text = [' M packages/core/src/index.ts', 'A  scripts/new.mjs', ' D docs/old.md', '?? out.json'].join('\n');
  assert.deepEqual(parsePorcelain(text), [
    'packages/core/src/index.ts',
    'scripts/new.mjs',
    'docs/old.md',
    'out.json',
  ]);
});

test('parsePorcelain counts both sides of a rename', () => {
  assert.deepEqual(parsePorcelain('R  old.ts -> new.ts'), ['old.ts', 'new.ts']);
});

test('parsePorcelain returns nothing for a clean tree', () => {
  assert.deepEqual(parsePorcelain(''), []);
  assert.deepEqual(parsePorcelain('\n'), []);
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

test('failureLines picks out the lines that look like failures', () => {
  const output = ['building...', '  × adds two numbers', 'FAIL tests/x.test.ts', 'done'].join('\n');
  assert.deepEqual(failureLines(output), ['× adds two numbers', 'FAIL tests/x.test.ts']);
});

// A red package with nothing printed under it is not evidence of anything.
test('failureLines falls back to the tail when nothing matches', () => {
  const output = ['one', 'two', 'three', 'four'].join('\n');
  assert.deepEqual(failureLines(output), ['two', 'three', 'four']);
});
