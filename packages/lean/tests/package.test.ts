/**
 * What a consumer gets, checked against the tarball rather than the source tree.
 *
 * `pnpm test` reads `src`. A published package is `dist`, an exports map, and a
 * set of type declarations, and each of those can be wrong while every other test
 * passes: a type that names an internal module, a `require` that resolves to
 * nothing, a dependency the consumer did not ask for.
 *
 * These build the package and use it the way someone else's build would. They are
 * slow, so they are skipped unless `KIWA_LEAN_PACKAGE_TEST=1` — but a skip is not
 * a pass, and the release checks run them.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const RUN = process.env.KIWA_LEAN_PACKAGE_TEST === '1';
const PACKAGE_ROOT = process.cwd();

let consumer: string;

/**
 * The environment a plain shell would have.
 *
 * These run from `prepublishOnly`, where the package manager has filled the
 * environment with `npm_config_*` — including `pack_destination`, which sends
 * `npm pack` somewhere other than where it was told. A consumer's build has none
 * of that, and neither should the run that pretends to be one.
 */
function cleanEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('npm_') || key.startsWith('PNPM_')) continue;
    env[key] = value;
  }
  return env;
}

/** Build, pack, and install the package into a throwaway project. */
function installPackedPackage(): string {
  const dir = mkdtempSync(join(tmpdir(), 'kiwa-lean-consumer-'));
  const env = cleanEnv();

  execFileSync('pnpm', ['build'], { cwd: PACKAGE_ROOT, stdio: 'ignore', env });
  const tarball = execFileSync(
    'npm',
    ['pack', '--silent', '--pack-destination', dir],
    { cwd: PACKAGE_ROOT, encoding: 'utf-8', env },
  )
    .trim()
    .split('\n')
    .pop() as string;

  const packed = resolve(dir, tarball);
  write(dir, 'package.json', '{"name":"consumer","version":"1.0.0","type":"module","private":true}');
  execFileSync('npm', ['install', packed, '--silent', '--no-audit', '--no-fund'], {
    cwd: dir,
    stdio: 'ignore',
    env,
  });
  return dir;
}

function write(dir: string, rel: string, body: string): void {
  const abs = resolve(dir, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, body, 'utf-8');
}

function run(script: string, body: string): string {
  write(consumer, script, body);
  return execFileSync('node', [script], { cwd: consumer, encoding: 'utf-8' }).trim();
}

const SPEC = `{
  moduleName: 'Session', namespace: 'Session',
  states: ['init', 'authed'], events: ['go'],
  unspecified: 'invalid',
  transitions: [{ from: 'init', event: 'go', to: 'authed' }],
}`;

describe.skipIf(!RUN)('the published package, installed as a consumer installs it', () => {
  let setupError: unknown;

  beforeAll(() => {
    // A `beforeAll` that throws marks its tests skipped, and a skipped check is
    // indistinguishable from a passing one. Catch it here and fail a test with
    // it instead: the install failing is itself a thing worth knowing.
    try {
      consumer = installPackedPackage();
    } catch (error) {
      setupError = error;
    }
  }, 300_000);

  afterAll(() => {
    if (consumer) rmSync(consumer, { recursive: true, force: true });
  });

  it('T-PKG-000 the package builds, packs, and installs', () => {
    expect(setupError).toBeUndefined();
    expect(consumer).toBeTruthy();
  });

  it('T-PKG-001 brings nothing else with it', () => {
    // A dependency the consumer never asked for is a dependency they have to
    // audit. `@kiwa-lab/core` was one, and `src` never imported it.
    const installed = execFileSync('ls', ['node_modules'], { cwd: consumer, encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter((name) => name !== '.package-lock.json' && name !== '.bin');

    expect(installed).toEqual(['@kiwa-lab']);
  });

  it('T-PKG-002 works from ESM', () => {
    const out = run(
      'use.mjs',
      `import { generateLeanSpec, SpecError } from '@kiwa-lab/lean';
       const out = generateLeanSpec(${SPEC});
       let typed = 'no';
       try { generateLeanSpec({ ...${SPEC}, namespace: '' }); } catch (e) { typed = e instanceof SpecError ? 'yes' : 'wrong'; }
       console.log(out.meta.cellCount, typed);`,
    );

    expect(out).toBe('2 yes');
  });

  it('T-PKG-003 works from CommonJS, and the error types survive require', () => {
    const out = run(
      'use.cjs',
      `const { generateLeanSpec, SpecError, LeanError } = require('@kiwa-lab/lean');
       const out = generateLeanSpec(${SPEC});
       let typed = 'no';
       try { generateLeanSpec({ ...${SPEC}, namespace: '' }); } catch (e) {
         typed = (e instanceof SpecError && e instanceof LeanError) ? 'yes' : 'wrong';
       }
       console.log(out.meta.cellCount, typed);`,
    );

    expect(out).toBe('2 yes');
  });

  it('T-PKG-004 exposes what the README names, and nothing internal', () => {
    const out = run(
      'surface.mjs',
      `import * as lean from '@kiwa-lab/lean';
       console.log(Object.keys(lean).sort().join(' '));`,
    );

    expect(out.split(' ')).toEqual([
      'LeanError',
      'SpecError',
      'UsageError',
      'checkConformance',
      'checkLeanTable',
      'extractLeanTable',
      'formatConformance',
      'generateLakeProject',
      'generateLeanSpec',
      'isInvalid',
      'verifyLeanSpec',
    ]);
  });

  it('T-PKG-005 typechecks against a strict consumer, without skipLibCheck', () => {
    // `skipLibCheck: false` is what catches a declaration file that refers to a
    // module the package does not ship.
    write(
      consumer,
      'tsconfig.json',
      JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          strict: true,
          noEmit: true,
          skipLibCheck: false,
        },
        include: ['typed.ts'],
      }),
    );
    write(
      consumer,
      'typed.ts',
      `import { generateLeanSpec, verifyLeanSpec, type OrchestratorSpec, type VerifyStatus } from '@kiwa-lab/lean';
       const spec: OrchestratorSpec = ${SPEC};
       const status: VerifyStatus = verifyLeanSpec([generateLeanSpec(spec)], { skip: true }).status;
       // @ts-expect-error a transition needs a target or an explicit rejection
       const bad: OrchestratorSpec = { ...spec, transitions: [{ from: 'init', event: 'go' }] };
       // @ts-expect-error the policy has two values
       const worse: OrchestratorSpec = { ...spec, unspecified: 'maybe' };
       console.log(status, bad, worse);`,
    );
    execFileSync('npm', ['install', 'typescript@5', '--silent', '--no-save'], {
      cwd: consumer,
      stdio: 'ignore',
      env: cleanEnv(),
    });

    // The installed compiler, not whatever `npx` decides to resolve. `tsc` exits
    // non-zero if either @ts-expect-error above is unused, so the two misuses are
    // asserted to be type errors.
    const tsc = resolve(consumer, 'node_modules/.bin/tsc');
    let output = '';
    try {
      execFileSync(tsc, ['-p', 'tsconfig.json'], { cwd: consumer, stdio: 'pipe', env: cleanEnv() });
    } catch (error) {
      const e = error as { stdout?: Buffer; stderr?: Buffer };
      output = `${e.stdout?.toString('utf-8') ?? ''}${e.stderr?.toString('utf-8') ?? ''}`;
    }

    expect(output).toBe('');
  }, 300_000);

  it('T-PKG-006 ships the changelog that explains the breaking changes', () => {
    const manifest = JSON.parse(
      readFileSync(resolve(PACKAGE_ROOT, 'package.json'), 'utf-8'),
    ) as { files: string[]; sideEffects: boolean; dependencies?: unknown };

    expect(manifest.files).toContain('CHANGELOG.md');
    expect(manifest.sideEffects).toBe(false);
    expect(manifest.dependencies).toBeUndefined();
  });
});
