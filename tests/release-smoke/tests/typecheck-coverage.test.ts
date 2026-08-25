// Every test file is typechecked by some script (#2218).
//
// `scripts/typecheck-coverage.mjs` answers this, and until now nothing ran it.
// It sat red for weeks: #2205 and #2207 took the compile step out of `test` for
// speed, and for 11 packages that compile was the only thing that ever looked at
// a type in their tests — vitest transforms with esbuild and never does. A sweep
// stayed green the whole time because the sweep never asked.
//
// So the check runs here, where every sweep and every `pnpm test` reaches it.
// Being able to answer the question is not the same as asking it.
import { execFile } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { afterAll, describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const execFileAsync = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const SCRIPT = resolve(REPO_ROOT, 'scripts/typecheck-coverage.mjs');

/** The script's own output and exit code, as a shell would see them. */
async function run(script = SCRIPT, cwd = REPO_ROOT): Promise<{ code: number; stdout: string }> {
  try {
    const { stdout } = await execFileAsync(process.execPath, [script], { cwd, maxBuffer: 32 * 1024 * 1024 });
    return { code: 0, stdout };
  } catch (err) {
    const e = err as { code?: number; stdout?: string };
    return { code: e.code ?? -1, stdout: e.stdout ?? '' };
  }
}

const fixtures: string[] = [];

/**
 * A workspace holding one package with a test file, and the script beside it.
 *
 * The script finds its own root from `import.meta.url`, so a copy in a temporary
 * directory judges that directory. That is the only way to reach the branch for
 * a config it cannot read: this repository has none, and a branch no input
 * reaches is a branch no check is holding.
 *
 * `typescript` decides which half is exercised. Linked, `tsc` answers and the
 * broken config is the unreadable one. Absent, nothing resolves and every config
 * is unreadable.
 */
function makeFixture(opts: { linkTypescript: boolean; brokenConfig: boolean }): string {
  const root = mkdtempSync(join(tmpdir(), 'typecheck-coverage-'));
  fixtures.push(root);
  mkdirSync(join(root, 'scripts'), { recursive: true });
  cpSync(SCRIPT, join(root, 'scripts/typecheck-coverage.mjs'));

  if (opts.linkTypescript) {
    mkdirSync(join(root, 'node_modules'), { recursive: true });
    symlinkSync(resolve(REPO_ROOT, 'node_modules/typescript'), join(root, 'node_modules/typescript'), 'dir');
  }
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'fixture-root', private: true }));

  const pkg = join(root, 'packages/a');
  mkdirSync(join(pkg, 'tests'), { recursive: true });
  writeFileSync(join(pkg, 'tests/a.test.ts'), 'export const a = 1;\n');
  writeFileSync(join(pkg, 'tsconfig.json'), JSON.stringify({ include: ['tests/**/*'] }));
  // `--showConfig` refuses this one, which is what "unreadable" means here.
  if (opts.brokenConfig) writeFileSync(join(pkg, 'tsconfig.broken.json'), '{ this is not json');
  writeFileSync(
    join(pkg, 'package.json'),
    JSON.stringify({
      name: 'fixture-a',
      scripts: {
        typecheck: opts.brokenConfig
          ? 'tsc --noEmit && tsc --noEmit -p tsconfig.broken.json'
          : 'tsc --noEmit',
      },
    }),
  );
  return root;
}

afterAll(() => {
  for (const f of fixtures) rmSync(f, { recursive: true, force: true });
});

function counter(stdout: string, label: string): number {
  const line = stdout.split('\n').find((l) => l.startsWith(label));
  if (!line) throw new Error(`"${label}" が出力に無い:\n${stdout}`);
  const n = Number(line.slice(label.length).trim());
  if (!Number.isInteger(n)) throw new Error(`"${line}" から件数を読めない`);
  return n;
}

describe('test file を型検査する script が必ずある (#2218)', () => {
  it('T-TCC-001 どの script も compile しない test file が 0 件', async () => {
    const { code, stdout } = await run();

    // 走査した package 数を先に見る。 0 件なら「見つからなかった」 のではなく
    // 「探していない」 なので、下の 0 件判定は何も確かめていないことになる。
    const scanned = counter(stdout, 'packages with test files:');
    expect(scanned, 'test file を持つ package を 1 件も拾えていない (検査が空振り)').toBeGreaterThan(100);

    const gaps = counter(stdout, 'packages whose tests nothing compiles:');
    expect(gaps, `型検査されない test を持つ package がある:\n${stdout}`).toBe(0);

    // 「読めなかった」 を 0 件と一緒に数えない。 config を読めなかった package は
    // 判定できていないので、gaps が 0 でも「全部覆われている」 とは言えない。
    const unreadable = counter(stdout, 'tsconfigs that could not be read:');
    expect(unreadable, `判定できなかった config がある:\n${stdout}`).toBe(0);

    expect(code, 'script の exit code が件数と食い違っている').toBe(0);
  }, 300_000);
});

describe('読めなかった config を「覆われている」 と読まない (#2218)', () => {
  it('T-TCC-002 読めない config は gaps と別に数え、exit 1 にする', async () => {
    const root = makeFixture({ linkTypescript: true, brokenConfig: true });
    const { code, stdout } = await run(join(root, 'scripts/typecheck-coverage.mjs'), root);

    expect(counter(stdout, 'packages with test files:'), 'fixture の package を拾えていない').toBe(1);
    // 読める方の config が test を覆うので gaps は 0。 それでも判定できなかった
    // config があるため通してはいけない = この 2 つが別物であることの検査。
    expect(counter(stdout, 'packages whose tests nothing compiles:')).toBe(0);
    expect(counter(stdout, 'tsconfigs that could not be read:')).toBe(1);
    expect(code, 'gaps が 0 でも判定できていない config があれば止める').toBe(1);
    expect(stdout).toContain('tsconfig.broken.json');
  }, 300_000);

  it('T-TCC-003 tsc を引けない時は「覆っている」 に倒さない', async () => {
    const root = makeFixture({ linkTypescript: false, brokenConfig: false });
    const { code, stdout } = await run(join(root, 'scripts/typecheck-coverage.mjs'), root);

    // tsc が無いので config を 1 つも読めない。 これを「読んだが 0 件」 に潰すと
    // 覆われていない test を覆っていることにできてしまう。
    expect(counter(stdout, 'tsconfigs that could not be read:')).toBeGreaterThan(0);
    expect(code).toBe(1);
  }, 300_000);
});
