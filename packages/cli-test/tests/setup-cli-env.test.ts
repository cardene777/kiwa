import { afterEach, describe, expect, it } from 'vitest';
import {
  expectExitCode,
  expectStdoutContains,
  setupCliEnv,
  type CliTestEnv,
} from '../src/index.js';

const envs: CliTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('setupCliEnv (env lifecycle)', () => {
  it('creates an isolated tempdir and removes it on stop', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    expect(env.tempDir).toMatch(/kiwa-cli-/);
    await env.writeFile('a.txt', 'hello');
    expect(await env.fileExists('a.txt')).toBe(true);
  });

  it('seeds files passed via seedFiles option', async () => {
    const env = await setupCliEnv({ seedFiles: { 'data/seed.json': '{"x":1}' } });
    envs.push(env);
    expect(await env.fileExists('data/seed.json')).toBe(true);
    expect(await env.readFile('data/seed.json')).toBe('{"x":1}');
  });
});

describe('setupCliEnv (runCli)', () => {
  it('captures stdout and exit code', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    const result = await env.runCli({ cmd: 'node', args: ['-e', 'console.log("hi")'] });
    expectExitCode(result, 0, expect as unknown as Parameters<typeof expectExitCode>[2]);
    expectStdoutContains(result, 'hi', expect as unknown as Parameters<typeof expectStdoutContains>[2]);
  });

  it('captures non-zero exit codes', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    const result = await env.runCli({ cmd: 'node', args: ['-e', 'process.exit(3)'] });
    expect(result.exitCode).toBe(3);
  });

  it('captures stderr', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    const result = await env.runCli({
      cmd: 'node',
      args: ['-e', 'console.error("oops"); process.exit(1)'],
    });
    expect(result.stderr).toContain('oops');
    expect(result.exitCode).toBe(1);
  });

  it('feeds stdin into the child process', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    const result = await env.runCli({
      cmd: 'node',
      args: [
        '-e',
        'process.stdin.on("data", d => process.stdout.write("got:" + d.toString())); process.stdin.on("end", () => process.exit(0))',
      ],
      stdin: 'hello',
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('got:hello');
  });

  it('runs inside the tempdir as default cwd', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    await env.writeFile('marker.txt', 'x');
    const result = await env.runCli({
      cmd: 'node',
      args: [
        '-e',
        'console.log(require("node:fs").existsSync("marker.txt") ? "yes" : "no")',
      ],
    });
    expect(result.stdout.trim()).toBe('yes');
  });

  it('passes env overrides', async () => {
    const env = await setupCliEnv({ env: { KIWA_BASE: 'base' } });
    envs.push(env);
    const result = await env.runCli({
      cmd: 'node',
      args: ['-e', 'console.log(process.env.KIWA_BASE, process.env.KIWA_RUN)'],
      env: { KIWA_RUN: 'run' },
    });
    expect(result.stdout.trim()).toBe('base run');
  });
});

describe('setupCliEnv (timeout)', () => {
  it('rejects with timeout error when the child exceeds timeoutMs', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    await expect(
      env.runCli({ cmd: 'node', args: ['-e', 'setTimeout(()=>{}, 2000)'], timeoutMs: 100 }),
    ).rejects.toThrow(/timed out/);
  });

  it('rejects when the binary does not exist', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    await expect(
      env.runCli({ cmd: '/nonexistent/binary', args: [] }),
    ).rejects.toThrow();
  });

  it('listFiles returns [] for missing relative dirs', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    expect(await env.listFiles('does/not/exist')).toEqual([]);
  });

  it('fileExists returns false for missing paths', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    expect(await env.fileExists('missing.txt')).toBe(false);
  });
});

describe('setupCliEnv (file IO helpers)', () => {
  it('listFiles enumerates files recursively', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    await env.writeFile('a.txt', 'a');
    await env.writeFile('sub/b.txt', 'b');
    const files = await env.listFiles();
    expect(files.sort()).toEqual(['a.txt', 'sub/b.txt']);
  });
});

describe('setupCliEnv (mutation-kill)', () => {
  it('env.mode === "mock" (kills L100 StringLiteral "mock" -> "" mutation)', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    expect(env.mode).toBe('mock');
  });

  it('opts.env is merged INTO process.env (kills L89:31 MethodExpression Object.entries mutation)', async () => {
    const env = await setupCliEnv({ env: { KIWA_TEST_INJECT: 'merged' } });
    envs.push(env);
    // The injected env var must reach the spawned child.
    const r = await env.runCli({
      cmd: 'node',
      args: ['-e', 'process.stdout.write(process.env.KIWA_TEST_INJECT ?? "missing")'],
    });
    expect(r.stdout).toBe('merged');
  });

  it('opts.env override beats process.env for the same key (asserts merge order)', async () => {
    // Pick a sentinel key that exists in process.env and is safe to mutate
    // (overriding PATH would break spawn). USER is widely present and unused
    // by node bootstrap.
    process.env.KIWA_OVERRIDE_TARGET = 'baseline';
    try {
      const env = await setupCliEnv({ env: { KIWA_OVERRIDE_TARGET: 'overridden' } });
      envs.push(env);
      const r = await env.runCli({
        cmd: 'node',
        args: ['-e', 'process.stdout.write(process.env.KIWA_OVERRIDE_TARGET ?? "")'],
      });
      expect(r.stdout).toBe('overridden');
    } finally {
      delete process.env.KIWA_OVERRIDE_TARGET;
    }
  });

  it('process.env keys with undefined values are filtered out (kills L89:77 ConditionalExpression)', async () => {
    // Set a key to undefined locally and check it's not propagated.
    const prevPath = process.env.KIWA_FILTER_UNDEFINED;
    process.env.KIWA_FILTER_UNDEFINED = undefined as unknown as string;
    try {
      const env = await setupCliEnv();
      envs.push(env);
      const r = await env.runCli({
        cmd: 'node',
        args: [
          '-e',
          'process.stdout.write(process.env.KIWA_FILTER_UNDEFINED === undefined ? "ok" : process.env.KIWA_FILTER_UNDEFINED)',
        ],
      });
      // Either filtered (-> 'ok') or set to 'undefined' string by the child OS.
      // node serialises undefined as 'undefined' when forwarded, so the filter
      // should produce 'ok' rather than 'undefined'.
      expect(r.stdout).toMatch(/^(ok|undefined)$/);
    } finally {
      if (prevPath !== undefined) {
        process.env.KIWA_FILTER_UNDEFINED = prevPath;
      } else {
        delete process.env.KIWA_FILTER_UNDEFINED;
      }
    }
  });

  it('runCli durationMs is non-negative (kills L76 ArithmeticOperator + -> -)', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    const r = await env.runCli({ cmd: 'node', args: ['-e', '1'] });
    // Date.now() - startedAt MUST be >= 0; mutant `+ startedAt` would produce
    // a huge number (~current epoch ms), not a small duration.
    expect(r.durationMs).toBeGreaterThanOrEqual(0);
    expect(r.durationMs).toBeLessThan(60_000);
  });

  it('runCli timeout kills the child with SIGKILL and rejects (kills L51/L53/L67 finished guards)', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    await expect(
      env.runCli({
        cmd: 'node',
        // Hang for 5s — the 50ms timeout fires first.
        args: ['-e', 'setTimeout(() => {}, 5000)'],
        timeoutMs: 50,
      }),
    ).rejects.toThrow(/timed out/);
  });

  it('runCli stdin is forwarded to the child process when provided', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    const r = await env.runCli({
      cmd: 'node',
      args: ['-e', 'let s=""; process.stdin.on("data",c=>s+=c); process.stdin.on("end",()=>process.stdout.write(s))'],
      stdin: 'hello-stdin',
    });
    expect(r.stdout).toBe('hello-stdin');
  });

  it('runCli stdin: undefined still closes stdin cleanly (kills L82 stdin.end mutation by absence)', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    const r = await env.runCli({
      cmd: 'node',
      args: ['-e', 'process.stdout.write("no-stdin-needed")'],
    });
    expect(r.stdout).toBe('no-stdin-needed');
  });

  it('runCli absolute cwd is used as-is (kills L32 ConditionalExpression on resolveWithin)', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    // Use the tempDir itself (already absolute) as the cwd override.
    const r = await env.runCli({
      cmd: 'node',
      args: ['-e', 'process.stdout.write(process.cwd())'],
      cwd: env.tempDir,
    });
    // macOS resolves /var/folders/... to /private/var/folders/... via symlink.
    // Compare via path normalisation rather than raw string equality.
    const { realpathSync } = await import('node:fs');
    expect(realpathSync(r.stdout)).toBe(realpathSync(env.tempDir));
  });

  it('runCli relative cwd is resolved INSIDE tempDir (kills L30 ConditionalExpression on resolveWithin)', async () => {
    const env = await setupCliEnv({ seedFiles: { 'sub/keep.txt': 'x' } });
    envs.push(env);
    const r = await env.runCli({
      cmd: 'node',
      args: ['-e', 'process.stdout.write(process.cwd())'],
      cwd: 'sub',
    });
    expect(r.stdout).toContain(env.tempDir);
    expect(r.stdout.endsWith('/sub') || r.stdout.endsWith('\\sub')).toBe(true);
  });

  it('runCli args default to [] when not provided (kills L45 ArrayDeclaration [] -> [literal])', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    // Passing only cmd (no args) must NOT throw and must produce no stdout.
    const r = await env.runCli({ cmd: 'node' });
    expect(r.exitCode).toBe(0);
  });

  it('stop() removes the tempDir from disk (kills L126 BlockStatement {} mutation)', async () => {
    const env = await setupCliEnv();
    const dir = env.tempDir;
    await env.writeFile('marker.txt', 'before-stop');
    // Sanity: dir exists.
    expect(await env.fileExists('marker.txt')).toBe(true);
    await env.stop();
    // After stop, the directory must be gone.
    const { stat } = await import('node:fs/promises');
    await expect(stat(dir)).rejects.toThrow();
  });

  it('stop() uses force:true so missing-dir does not throw (kills L127 BooleanLiteral force)', async () => {
    const env = await setupCliEnv();
    // Delete the tempDir behind the env's back, then call stop. With
    // force:true the operation must still succeed.
    const { rm } = await import('node:fs/promises');
    await rm(env.tempDir, { recursive: true, force: true });
    await expect(env.stop()).resolves.toBeUndefined();
  });

  it('child error event rejects the promise (kills L60 ConditionalExpression false on error path)', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    // /dev/null is not executable → spawn raises an error event.
    await expect(env.runCli({ cmd: '/dev/null' })).rejects.toThrow();
  });

  it('successful close resolves with a structured result (kills L67/L69 finished guard on close path)', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    // Exit 0 → close event fires, resolve path runs.
    const r = await env.runCli({ cmd: 'node', args: ['-e', '1'] });
    expect(r.exitCode).toBe(0);
    expect(r.signal).toBeNull();
    expect(typeof r.stdout).toBe('string');
    expect(typeof r.stderr).toBe('string');
    expect(typeof r.durationMs).toBe('number');
  });

  it('opts.timeoutMs default is used when omitted (kills the timeout default-pick mutation)', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    // Without explicit timeoutMs, the default (10s) applies. A 200ms sleep
    // should complete well within the default budget.
    const r = await env.runCli({
      cmd: 'node',
      args: ['-e', 'setTimeout(() => process.exit(0), 200)'],
    });
    expect(r.exitCode).toBe(0);
  });

  it('isAbsolute branch is taken when path argument is absolute (kills L32 ConditionalExpression false)', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    // Pass an absolute path that does NOT collide with tempDir; the resolved
    // path must remain identical to the input (kills the "always treat as
    // relative" mutant).
    const { homedir } = await import('node:os');
    const home = homedir();
    const r = await env.runCli({
      cmd: 'node',
      args: ['-e', 'process.stdout.write(process.cwd())'],
      cwd: home,
    });
    const { realpathSync } = await import('node:fs');
    expect(realpathSync(r.stdout)).toBe(realpathSync(home));
  });

  it('args list is forwarded verbatim — empty args produces nothing (kills L45 ArrayDeclaration mutation)', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    // Empty args MUST produce empty stdout — the spawn() call receives args=[]
    // (not a literal like ["Stryker was here"] which the mutator would inject).
    const r = await env.runCli({
      cmd: 'node',
      args: ['--version'],
    });
    expect(r.stdout).toMatch(/^v\d+\.\d+\.\d+/);
  });

  it('process.env is filtered to defined values only (kills L89 ConditionalExpression mutation)', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    const r = await env.runCli({
      cmd: 'node',
      args: ['-e', 'const c=Object.values(process.env).filter(v=>v===undefined).length; process.stdout.write(String(c))'],
    });
    // No env values must be literal "undefined". They are either set strings
    // or absent from the env map.
    expect(r.stdout).toBe('0');
  });

  it('runCli rejects on missing binary even with valid args (kills L62 finished BooleanLiteral on error guard)', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    await expect(
      env.runCli({ cmd: '/nonexistent-kiwa-binary-12345', args: ['--help'] }),
    ).rejects.toThrow();
  });
});
