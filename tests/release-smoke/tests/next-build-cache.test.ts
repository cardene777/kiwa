// `next build` is skipped only when every input is unchanged (#2222).
//
// The `examples/nextjs-*` targets are 532 s of a 1244 s sweep, and each one
// rebuilds Next from scratch on every run. Reusing the previous build is worth
// 15 s per target — and wrong the moment the digest misses an input, because
// then a green run says nothing about the code that is actually there.
//
// So these checks are mostly about what the digest covers. `NEXT_PUBLIC_*` is
// inlined at build time and reaches the build from two places that git cannot
// see: files it ignores (`.env.local`, `.context/*.env`, written by
// `tests/prepare-env.ts`) and the process environment.
import { execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import { afterAll, describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const execFileAsync = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const SCRIPT = resolve(REPO_ROOT, 'scripts/next-build-cached.mjs');

type Decision = { reuse: boolean; reason: string };

const { CACHE_SCHEMA_VERSION, decide, envFilesFor, untrackedInputDigest } = (await import(
  pathToFileURL(SCRIPT).href
)) as {
  CACHE_SCHEMA_VERSION: number;
  decide: (
    opts: { repoRoot: string; exampleDir: string; env: NodeJS.ProcessEnv },
  ) => Decision;
  envFilesFor: (exampleDir: string) => string[] | null;
  untrackedInputDigest: (exampleDir: string, env: NodeJS.ProcessEnv) => string | null;
};

const roots: string[] = [];

/**
 * A one-example workspace with a recorded build, in a real git repository.
 *
 * The digest is half git-derived, so a fixture without git would exercise only
 * the other half — and the half that is missing is the one that decides whether
 * a source change invalidates the build.
 */
async function makeExample(): Promise<{ root: string; example: string }> {
  const root = mkdtempSync(join(tmpdir(), 'next-build-cache-'));
  roots.push(root);
  writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages:\n  - "packages/*"\n');
  // 実 repo と同じく `.next` を ignore する。 ignore しないと build 出力そのものが
  // 入力に数えられ、記録を書いた瞬間に指紋が変わるので cache は永久に当たらない。
  writeFileSync(join(root, '.gitignore'), '.next/\nnode_modules/\n');
  writeFileSync(join(root, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n');
  mkdirSync(join(root, 'packages/core/src'), { recursive: true });
  writeFileSync(join(root, 'packages/core/src/index.ts'), 'export const one = 1;\n');

  const example = join(root, 'examples/demo');
  mkdirSync(join(example, 'app'), { recursive: true });
  writeFileSync(join(example, 'app/page.tsx'), 'export default () => null;\n');
  writeFileSync(join(example, 'package.json'), JSON.stringify({ name: 'demo' }));

  await execFileAsync('git', ['init', '-q', '.'], { cwd: root });
  return { root, example };
}

afterAll(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

describe('指紋が覆う入力', () => {
  it('T-NBC-001 Next が読む env file と prepare-env が書く .context/*.env を集める', async () => {
    const { example } = await makeExample();
    expect(envFilesFor(example), 'env file が無い例で空にならない').toEqual([]);

    writeFileSync(join(example, '.env.local'), 'NEXT_PUBLIC_A=1\n');
    mkdirSync(join(example, '.context'), { recursive: true });
    writeFileSync(join(example, '.context/l2.env'), 'NEXT_PUBLIC_B=2\n');
    writeFileSync(join(example, '.context/anvil.pid'), '123\n');

    const found = envFilesFor(example);
    expect(found, '.context の .env を拾えていない').toEqual(['.context/l2.env', '.env.local']);
    expect(found, 'env ではない .context の file まで拾っている').not.toContain('.context/anvil.pid');
  }, 120_000);

  it('T-NBC-002 env file と process env のどちらが変わっても digest が動く', async () => {
    const { example } = await makeExample();
    const base = untrackedInputDigest(example, {});
    expect(base, 'digest を計算できていない').not.toBeNull();

    // 1. env file の中身
    writeFileSync(join(example, '.env.local'), 'NEXT_PUBLIC_A=1\n');
    const withFile = untrackedInputDigest(example, {});
    expect(withFile).not.toBe(base);

    writeFileSync(join(example, '.env.local'), 'NEXT_PUBLIC_A=2\n');
    expect(untrackedInputDigest(example, {}), 'env file の値を変えても digest が同じ').not.toBe(withFile);

    // 2. process env 経由の NEXT_PUBLIC_*
    const withEnv = untrackedInputDigest(example, { NEXT_PUBLIC_A: '9' });
    expect(withEnv, 'process env の NEXT_PUBLIC が digest に入っていない').not.toBe(
      untrackedInputDigest(example, {}),
    );

    // 3. NEXT_PUBLIC 以外は build に埋め込まれないので digest を動かさない
    expect(untrackedInputDigest(example, { HOME: '/somewhere' })).toBe(
      untrackedInputDigest(example, {}),
    );
  }, 120_000);
});

describe('build するかの判定', () => {
  it('T-NBC-003 前の build が無い / 記録が無い / 記録が読めない時は build する', async () => {
    const { root, example } = await makeExample();
    const opts = { repoRoot: root, exampleDir: example, env: {} };

    expect(decide(opts).reuse, '.next が無いのに再利用しようとしている').toBe(false);
    expect(decide(opts).reason).toContain('no previous build');

    mkdirSync(join(example, '.next'), { recursive: true });
    writeFileSync(join(example, '.next/BUILD_ID'), 'fixture\n');
    expect(decide(opts).reuse, '記録が無いのに再利用しようとしている').toBe(false);

    writeFileSync(join(example, '.next/inputs.sha'), 'not json');
    expect(decide(opts).reuse, '読めない記録を一致に倒している').toBe(false);
    expect(decide(opts).reason).toContain('could not be read');

    writeFileSync(
      join(example, '.next/inputs.sha'),
      JSON.stringify({ version: CACHE_SCHEMA_VERSION + 1, digest: 'x' }),
    );
    expect(decide(opts).reuse, '知らない schema を一致に倒している').toBe(false);
    expect(decide(opts).reason).toContain('schema');
  }, 120_000);

  it('T-NBC-004 入力が同じ時だけ再利用する', async () => {
    const { root, example } = await makeExample();
    const env = {};
    mkdirSync(join(example, '.next'), { recursive: true });
    writeFileSync(join(example, '.next/BUILD_ID'), 'fixture\n');

    // 記録は script と同じ digest で手書きする。 fixture は `pnpm build` を持たないので
    // CLI をそのまま回すと build 段で落ちるが、判定は digest の一致だけを見る。
    const { inputDigest } = (await import(pathToFileURL(SCRIPT).href)) as {
      inputDigest: (o: { repoRoot: string; exampleDir: string; env: NodeJS.ProcessEnv }) => string | null;
    };
    const digest = inputDigest({ repoRoot: root, exampleDir: example, env });
    expect(digest, 'digest を計算できていない').not.toBeNull();
    writeFileSync(
      join(example, '.next/inputs.sha'),
      JSON.stringify({ version: CACHE_SCHEMA_VERSION, digest }),
    );

    expect(decide({ repoRoot: root, exampleDir: example, env }).reuse).toBe(true);

    // 例の source
    writeFileSync(join(example, 'app/page.tsx'), 'export default () => null; // changed\n');
    expect(
      decide({ repoRoot: root, exampleDir: example, env }).reuse,
      '例の source が変わったのに再利用している',
    ).toBe(false);
    writeFileSync(join(example, 'app/page.tsx'), 'export default () => null;\n');

    // workspace package の source
    writeFileSync(join(root, 'packages/core/src/index.ts'), 'export const one = 2;\n');
    expect(
      decide({ repoRoot: root, exampleDir: example, env }).reuse,
      'package の source が変わったのに再利用している',
    ).toBe(false);
    writeFileSync(join(root, 'packages/core/src/index.ts'), 'export const one = 1;\n');

    // git が見ない env file
    writeFileSync(join(example, '.env.local'), 'NEXT_PUBLIC_A=1\n');
    expect(
      decide({ repoRoot: root, exampleDir: example, env }).reuse,
      'env file が増えたのに再利用している',
    ).toBe(false);
    rmSync(join(example, '.env.local'));

    // process env 経由の NEXT_PUBLIC
    expect(
      decide({ repoRoot: root, exampleDir: example, env: { NEXT_PUBLIC_A: '1' } }).reuse,
      'process env の NEXT_PUBLIC が変わったのに再利用している',
    ).toBe(false);

    // 全部戻したので再び再利用できる = 上の 4 件が「常に false」 ではないことの確認
    expect(decide({ repoRoot: root, exampleDir: example, env }).reuse).toBe(true);
  }, 120_000);
});

describe('実 repo での配線', () => {
  it('T-NBC-005 nextjs 系の webServer が wrapper を経由する', async () => {
    const { readFileSync, readdirSync } = await import('node:fs');
    const examples = readdirSync(join(REPO_ROOT, 'examples')).filter((n) => n.startsWith('nextjs-'));
    expect(examples.length, 'nextjs 系の例を 1 件も拾えていない (検査が空振り)').toBeGreaterThan(10);

    const direct: string[] = [];
    for (const name of examples) {
      const cfg = join(REPO_ROOT, 'examples', name, 'playwright.config.ts');
      let body = '';
      try {
        body = readFileSync(cfg, 'utf-8');
      } catch {
        continue;
      }
      if (/command:.*\bpnpm build\b/.test(body)) direct.push(name);
    }
    expect(direct, `webServer が直接 pnpm build を呼んでいる: ${direct.join(', ')}`).toEqual([]);
  }, 120_000);
});
