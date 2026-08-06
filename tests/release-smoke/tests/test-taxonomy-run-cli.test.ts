// Q5 = test-taxonomy 分類別実行 chk CLI (scripts/kiwa-taxonomy-run.mjs) の存在 + 起動 shape 確認。
//
// SSOT = docs/concepts/test-taxonomy.md § 5 分類、 CLI = scripts/kiwa-taxonomy-run.mjs。
//
// meta lint (存在 chk) + CLI (実行 chk) の 2 軸で test-taxonomy meta 経路が完成する。
// 本 test は CLI 自体が (1) 実在する (2) --help で正常応答 (3) 未知 category で fail する
// の 3 shape を release-smoke 経路で verify する (CLI 本体の実 run は per-category に
// 委ね、 release-smoke は CLI 存在 + 引数 parse 動作を担保する薄い gate)。

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = repoRoot(HERE);
const CLI_PATH = join(ROOT, 'scripts/kiwa-taxonomy-run.mjs');

/**
 * CLI を起動する `spawnSync` の上限。
 *
 * `spawnSync` は worker を同期 block するため、 vitest の `testTimeout` では中断できない
 * (実測 = `testTimeout: 1000` に対し `spawnSync('sleep', ['5'])` が 5013 ms 走り切り、
 * timeout は終わった後に事後報告されるだけだった)。 CLI が返らない形になると suite ごと
 * 止まるので、 spawn 側で切る (#1780 review)。
 */
const SPAWN_TIMEOUT_MS = 60_000;

/**
 * CLI が非 0 で返った時に、 何が起きたかを assertion message へ残す (#1751)。
 *
 * この CLI は内部で `tsc` と `vitest` を起動する。 release-smoke の他 test と並列に
 * 走る時に稀に非 0 で返るが、 `expect(status).toBe(0)` だけでは
 * `expected 1 to be +0` しか残らず、 原因を追えない。
 *
 * `signal` と `error` も出す。 時間切れで打ち切られた場合は `status` が null で
 * `signal` に出るため、 status だけを見ると「落ちた」 としか判らない。
 */
function describeFailure(result: ReturnType<typeof spawnSync>): string {
  const tail = (text: string | null | undefined, lines: number): string =>
    (text ?? '').split('\n').slice(-lines).join('\n').trim();
  return [
    '',
    `status=${String(result.status)} signal=${String(result.signal)}`,
    result.error ? `error=${result.error.message}` : '',
    '--- stdout (末尾 40 行) ---',
    tail(result.stdout as string | null, 40),
    '--- stderr (末尾 40 行) ---',
    tail(result.stderr as string | null, 40),
  ].filter((line) => line !== '').join('\n');
}

describe('Q5 test-taxonomy CLI shape', () => {
  it('CLI file が実在する', () => {
    expect(existsSync(CLI_PATH)).toBe(true);
  });

  it('--help で Usage 出力 + exit 0', () => {
    const result = spawnSync('node', [CLI_PATH, '--help'], { encoding: 'utf-8' });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/Usage/);
    expect(result.stdout).toMatch(/--category/);
    expect(result.stdout).toMatch(/perf/);
    expect(result.stdout).toMatch(/fidelity/);
    expect(result.stdout).toMatch(/skill/);
    expect(result.stdout).toMatch(/integration/);
  });

  it('引数なし = help 表示 + exit 1', () => {
    const result = spawnSync('node', [CLI_PATH], { encoding: 'utf-8' });
    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/Usage/);
  });

  it('未知 category = stderr にエラー + exit 1', () => {
    const result = spawnSync('node', [CLI_PATH, '--category', 'unknown-cat'], { encoding: 'utf-8' });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/invalid --category/);
  });

  it('--help 出力に --include-real flag 説明が含まれる (Q6-5)', () => {
    const result = spawnSync('node', [CLI_PATH, '--help'], { encoding: 'utf-8' });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/--include-real/);
    expect(result.stdout).toMatch(/KIWA_MODE=real/);
  });

  it('--help 出力に --packages-dir の既定値と制約が含まれる (#1780)', () => {
    // header comment と docs 2 本だけが既定値を持ち、 help が名前しか出さない状態は
    // CLI 利用者から見た SSOT が欠ける。
    const result = spawnSync('node', [CLI_PATH, '--help'], {
      encoding: 'utf-8',
      timeout: SPAWN_TIMEOUT_MS,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/--packages-dir/);
    expect(result.stdout).toMatch(/default = <repo>\/packages/);
    expect(result.stdout).toMatch(/絶対 path 必須/);
  });

  it('config 拡張後は cache が skill の対象に入っている', () => {
    // CAR-fidelity-integration-all-libs (PR #1656) で skillLibs / mockAdapterLibs /
    // integrationLibs を全 lib に拡張。 cache も全 category 対象化された。
    // 元 test は「一部 lib は対象外」 前提だったが obsolete。
    //
    // 対象かどうかは config が決めるので、 config を直接読む。 CLI に `--lib` を
    // 渡すと config を参照せずその lib を実行するため (`kiwa-taxonomy-run.mjs:384`)、
    // matrix に行が出ることは「対象である」 ことを意味しない。
    const config = JSON.parse(
      readFileSync(join(ROOT, 'tests/release-smoke/test-taxonomy.config.json'), 'utf-8'),
    ) as { requireSkill: { skillLibs: string[] } };
    expect(config.requireSkill.skillLibs).toContain('cache');
    // config が指す test file も実在する (一覧だけ増えて file が無い状態を防ぐ)。
    expect(existsSync(join(ROOT, 'packages/cache/tests/skill'))).toBe(true);
  });

  it('.ts + .tsx 両拡張子を accept する', async () => {
    // collectFiles が .ts のみ match だと ui.perf.tsx (JSX を含む component perf test) が
    // no-files 判定されて false-fail する。 meta lint 側 (test-taxonomy-existence.test.ts)
    // は既に .ts + .tsx を両方 accept しており、 CLI 側も揃える。
    //
    // 以前はこれを `--category perf --lib ui` の実行で見ていたが、 その経路は実 perf 計測を
    // 起動する。 perf は時間そのものを測るので機械が混むと閾値を割り、 拡張子とは無関係に
    // 落ちた (#1751 実測 = CPU を埋めた状態で 3 回とも fail)。 見たいのは拡張子を拾うか
    // だけなので、 その 1 点を直接見る。
    // compile 後の相対 path がずれるため、 実 path を URL に変えて読む。
    // `.mjs` に型宣言は無いので、 呼ぶ関数の形だけを宣言する。
    const mod = (await import(
      pathToFileURL(join(ROOT, 'scripts/kiwa-taxonomy-run.mjs')).href
    )) as { collectFiles: (dir: string, suffix: string) => string[] };
    const perfDir = join(ROOT, 'packages/ui/tests/perf');
    const found = mod.collectFiles(perfDir, '.perf.ts').map((f) => f.slice(perfDir.length + 1));
    expect(found, `.tsx を拾えていない: ${found.join(', ')}`).toContain('ui.perf.tsx');
    // `.ts` 側も落とさない (片方だけ拾う形への退行を防ぐ)。 実在する file を名指しする。
    // 「全件が .ts か .tsx で終わる」 だけだと、 空配列でも通ってしまう。
    const skillDir = join(ROOT, 'packages/ui/tests/skill');
    const skill = mod.collectFiles(skillDir, '.skill.test.ts').map((f) =>
      f.slice(skillDir.length + 1),
    );
    expect(skill, `.ts を拾えていない: ${skill.join(', ')}`).toContain('ui.skill.test.ts');
  });

  it('--category all で 4 分類統合 matrix 出力', () => {
    // 実 vitest 起動は時間かかるので、 --help 経路で all support を確認する軽量 verify、
    // + --format json で単一 lib 実 run して all 挙動 shape を確認する。
    const helpResult = spawnSync('node', [CLI_PATH, '--help'], { encoding: 'utf-8' });
    expect(helpResult.stdout).toMatch(/perf\|fidelity\|skill\|integration\|all/);
    expect(helpResult.stdout).toMatch(/--category all/);

    // 実 all run は行わない。 `all` は perf を含み、 perf は時間そのものを測るため
    // 機械の空き具合で落ちる (#1751)。 数値の判定は `pnpm test:perf` の担当。
    //
    // ここで見るのは `all` という値が引数として通り、 4 分類に展開されることまで。
    // `lean` は 4 分類のいずれにも test dir を持たず、 全て `no-files` で即座に返るため、
    // 実行に入らないまま出力の形だけを確かめられる。
    //
    // その前提が崩れたら止める。 `lean` に test dir が足されると、 その分類は実 `tsc` や
    // Vitest に入り、 perf なら実測に入る。 他の分類が `no-files` で exit 1 を保つため、
    // 出力の形だけを見ている本 test は気付かないまま通ってしまう (#1751 review)。
    const withTests = ['perf', 'fidelity', 'skill', 'integration'].filter((category) =>
      existsSync(join(ROOT, 'packages/lean/tests', category)),
    );
    expect(
      withTests,
      `lean に test dir が増えた。 実行に入らない別の lib を選び直す: ${withTests.join(', ')}`,
    ).toEqual([]);
    const shapeResult = spawnSync(
      'node',
      [CLI_PATH, '--category', 'all', '--lib', 'lean', '--format', 'json'],
      { encoding: 'utf-8', timeout: SPAWN_TIMEOUT_MS },
    );
    const output = JSON.parse(shapeResult.stdout);
    expect(output.category).toBe('all');
    expect(output.results).toHaveProperty('perf');
    expect(output.results).toHaveProperty('fidelity');
    expect(output.results).toHaveProperty('skill');
    expect(output.results).toHaveProperty('integration');
    expect(output.summaries).toHaveProperty('fidelity');
    // 4 分類すべてが同じ形で並ぶ (1 つでも欠けると集計が崩れる)。
    for (const category of ['perf', 'fidelity', 'skill', 'integration']) {
      expect(output.results[category], `${category} の行が無い`).toHaveProperty('lean');
    }
  });

  it('中身 chk 3 軸 = minCases 下限 / expect 未呼出 / trivial pattern を検出 (Q7、 CLI 単独 release-worthy 判定)', async () => {
    // CLI の 中身 chk 層 (insufficient-cases / missing-assertion / trivial-assertion の 3 軸) は
    // 「file 揃ってる + 実行 pass」 の構造 gate に加えて「domain-specific 中身が空でない」 の
    // 質 gate を担う。 3 軸それぞれに fixture lib を作り、 CLI が対応する status で fail
    // 判定するかを verify する。
    //
    // fixture は実 workspace の外 (tmpdir) に置き、 CLI へは `--packages-dir` で渡す (#1780)。
    // `packages/` 直下に作ると、 同じ suite で `packages/*` を走査する他 test が fixture を
    // 実 package と誤認する。 vitest は file 間を並列に走らせるので、 fixture が生きている間に
    // 走査側が動いた回だけ落ち、 落ちる test は実行ごとに変わった。
    const { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { relative, sep } = await import('node:path');

    // fidelity の minCases 下限は 5 (config に minCases が無いため CLI の既定値)。
    // insufficient は 2 case、 残り 2 軸は 5 case 置いて下限を先に通す。
    const CASES = [
      {
        lib: 'fixture-insufficient-cases',
        expected: /FAIL \(min-cases 2\)/,
        source: `import { describe, expect, it } from 'vitest';
describe('insufficient', () => {
  it('c1', () => { expect(2 + 2).toBe(4); });
  it('c2', () => { expect('ab'.length).toBe(2); });
});
`,
      },
      {
        lib: 'fixture-missing-assertion',
        expected: /FAIL \(no-expect 1\)/,
        source: `import { describe, expect, it } from 'vitest';
describe('missing assertion', () => {
  it('c1', () => { expect(2 + 2).toBe(4); });
  it('c2', () => { expect(3 + 3).toBe(6); });
  it('c3', () => { expect(4 + 4).toBe(8); });
  it('c4', () => { expect(5 + 5).toBe(10); });
  it('c5', () => { const unused = 1 + 1; void unused; });
});
`,
      },
      {
        lib: 'fixture-trivial-assertion',
        expected: /FAIL \(trivial 5\)/,
        source: `import { describe, expect, it } from 'vitest';
describe('trivial', () => {
  it('c1', () => { expect(true).toBe(true); });
  it('c2', () => { expect(1).toBe(1); });
  it('c3', () => { expect(null).toBeNull(); });
  it('c4', () => { expect(undefined).toBeUndefined(); });
  it('c5', () => { expect([]).toEqual([]); });
});
`,
      },
    ];

    // `mkdtempSync` の直後から try に入れる。 fixture 構築中に投げると finally に届かず
    // sandbox が残る。
    const sandbox = mkdtempSync(join(tmpdir(), 'kiwa-taxonomy-fixture-'));
    try {
      // fixture が repo の中に生えていないことを、 名前ではなく位置で押さえる。
      // 置き場所は `os.tmpdir()` = `TMPDIR` 依存で、 repo 配下を指す環境なら
      // 名前の検査 (下の readdirSync) を素通りしてしまう。
      //
      // 判定は segment 境界で行う。 前置 match だけだと `<repo>/..tmp` のような
      // repo 内の dir が `..tmp/...` を返して repo 外と誤判定される。
      const rel = relative(ROOT, sandbox);
      expect(
        rel === '..' || rel.startsWith(`..${sep}`),
        `fixture が repo 内に作られている: ${sandbox}`,
      ).toBe(true);

      const sandboxPackages = join(sandbox, 'packages');
      for (const testCase of CASES) {
        const fixLib = join(sandboxPackages, testCase.lib);
        const fixDir = join(fixLib, 'tests/fidelity');
        mkdirSync(fixDir, { recursive: true });
        writeFileSync(
          join(fixLib, 'package.json'),
          JSON.stringify({ name: `@kiwa-lab/${testCase.lib}`, version: '0.0.0', private: true }),
        );
        writeFileSync(join(fixDir, 'fixture.fidelity.test.ts'), testCase.source);
      }

      for (const testCase of CASES) {
        const result = spawnSync(
          'node',
          [
            CLI_PATH, '--category', 'fidelity', '--lib', testCase.lib,
            '--packages-dir', sandboxPackages,
          ],
          { encoding: 'utf-8', timeout: SPAWN_TIMEOUT_MS },
        );
        expect(result.status, describeFailure(result)).toBe(1);
        expect(result.stdout, `${testCase.lib}: ${result.stdout}`).toMatch(testCase.expected);
      }

      // fixture が生きている間、 実 workspace には現れない。 ここが破れると `packages/*` を
      // 走査する検査 (license / taxonomy meta lint / publish guard / release script filter)
      // が fixture を実 package と読んで落ちる。 どれが反応するかは fixture の属性で
      // 入れ替わるため、 走査側ではなくこの 1 点で押さえる (#1780)。
      expect(readdirSync(join(ROOT, 'packages')).filter((n) => n.startsWith('fixture-'))).toEqual([]);
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });

  it('--packages-dir が実在しなければ exit 1 (#1780)', async () => {
    // 実在しない path は tmpdir 配下に作る。 repo 直下の固定名を使うと、 同名 dir が
    // 生えた時に検査対象が変わる。
    const { mkdtempSync, rmSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const sandbox = mkdtempSync(join(tmpdir(), 'kiwa-taxonomy-missing-'));
    try {
      const result = spawnSync(
        'node',
        [CLI_PATH, '--category', 'fidelity', '--packages-dir', join(sandbox, 'no-such-root')],
        { encoding: 'utf-8', timeout: SPAWN_TIMEOUT_MS },
      );
      expect(result.status).toBe(1);
      expect(result.stderr).toMatch(/--packages-dir not found or not a directory/);
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });

  it('--packages-dir が dir でなければ exit 1 (#1780)', () => {
    // file を渡すと `readdirSync` が ENOTDIR を投げて stack trace になっていた。
    const result = spawnSync(
      'node',
      [CLI_PATH, '--category', 'fidelity', '--packages-dir', join(ROOT, 'package.json')],
      { encoding: 'utf-8', timeout: SPAWN_TIMEOUT_MS },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/--packages-dir not found or not a directory/);
  });

  it('--packages-dir の値の取り違え 3 形を parseArgs が null にする (#1783)', async () => {
    // いずれも `path.resolve` が cwd を返す形。 既定へ倒すと呼んだ場所次第で別 root を
    // 黙って見に行く。 `--packages-dir --format json` は値の取り違えで、 `--format` を
    // path として食う。
    //
    // 3 形とも `parseArgs` が `packagesDir` を `null` にするだけで判定が完結するため、
    // process を跨がずに見る (#1783)。 `main()` が exit 1 で止まることは次の test が
    // spawn 1 本で確かめる。
    const mod = (await import(
      pathToFileURL(join(ROOT, 'scripts/kiwa-taxonomy-run.mjs')).href
    )) as { parseArgs: (argv: string[]) => { packagesDir: string | null } };

    for (const argv of [
      ['--category', 'fidelity', '--packages-dir'],
      ['--category', 'fidelity', '--packages-dir', ''],
      ['--category', 'fidelity', '--packages-dir', '--format', 'json'],
    ]) {
      expect(mod.parseArgs(argv).packagesDir, argv.join(' ')).toBeNull();
    }

    // 正常な値を `null` に倒していないこと。 これが無いと「常に null を返す」 実装でも通る。
    expect(mod.parseArgs(['--packages-dir', '/tmp/kiwa-packages']).packagesDir).toBe(
      '/tmp/kiwa-packages',
    );
    // 未指定は既定 root のまま (null にしない)。
    expect(mod.parseArgs(['--category', 'fidelity']).packagesDir).toBe(
      join(ROOT, 'packages'),
    );
  });

  it('値の取り違えで main が exit 1 + stderr に理由を出す (#1783)', () => {
    // 上の in-process test は `parseArgs` の戻り値までしか見ない。 `main()` がその `null` を
    // 受けて実際に停止することは、 3 形の代表 1 つを実起動して確かめる。
    const result = spawnSync(
      'node',
      [CLI_PATH, '--category', 'fidelity', '--packages-dir'],
      { encoding: 'utf-8', timeout: SPAWN_TIMEOUT_MS },
    );
    expect(result.status, describeFailure(result)).toBe(1);
    expect(result.stderr).toMatch(/--packages-dir requires a non-empty path/);
  });

  it('--packages-dir が相対 path なら exit 1 (#1780)', () => {
    // 相対 path は呼んだ場所で指す先が変わる。
    const result = spawnSync(
      'node',
      [CLI_PATH, '--category', 'fidelity', '--packages-dir', 'packages'],
      { encoding: 'utf-8', cwd: ROOT, timeout: SPAWN_TIMEOUT_MS },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/--packages-dir must be an absolute path/);
  });

  it('package を 1 件も持たない root は exit 1 (0 件 pass にしない) (#1780)', async () => {
    // 実在する dir でも package が無ければ検査は 1 件も走らない。 それを exit 0 で返すと
    // 「全 pass」 と見分けが付かず、 taxonomy gate を無効化できる (review Round 1 MAJOR)。
    const { mkdtempSync, rmSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const empty = mkdtempSync(join(tmpdir(), 'kiwa-taxonomy-empty-'));
    try {
      const result = spawnSync(
        'node',
        [CLI_PATH, '--category', 'all', '--packages-dir', empty],
        { encoding: 'utf-8', timeout: SPAWN_TIMEOUT_MS },
      );
      expect(result.status, describeFailure(result)).toBe(1);
      expect(result.stderr).toMatch(/--packages-dir has no package/);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });

  it('--category all も全 category 0 件なら exit 1 + 名指しの警告 (#1780)', async () => {
    // `all` 経路は category ごとに集計するため、 単一 category 経路とは別に固定する。
    // `lean` は perf exempt かつ fidelity / skill / integration の config 対象外なので、
    // これ 1 件だけを置くと 4 category すべてが 0 件になる。
    const { mkdirSync, mkdtempSync, rmSync, writeFileSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const sandbox = mkdtempSync(join(tmpdir(), 'kiwa-taxonomy-allzero-'));
    try {
      const pkgDir = join(sandbox, 'packages', 'lean');
      mkdirSync(pkgDir, { recursive: true });
      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify({ name: '@kiwa-lab/lean', version: '0.0.0', private: true }),
      );
      const result = spawnSync(
        'node',
        [CLI_PATH, '--category', 'all', '--format', 'json', '--packages-dir', join(sandbox, 'packages')],
        { encoding: 'utf-8', timeout: SPAWN_TIMEOUT_MS },
      );
      expect(result.status, describeFailure(result)).toBe(1);
      const output = JSON.parse(result.stdout) as {
        summaries: Record<string, { total: number }>;
      };
      for (const category of ['perf', 'fidelity', 'skill', 'integration']) {
        expect(output.summaries[category]?.total, `${category} が 0 件でない`).toBe(0);
      }
      // exit code だけでは「0 件」 と「全 pass」 を読み手が見分けられない。
      for (const category of ['perf', 'fidelity', 'skill', 'integration']) {
        expect(result.stderr, `${category} の警告が無い`).toMatch(
          new RegExp(`${category}: 対象 lib が 0 件`),
        );
      }
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });

  it('config 記載 lib を 1 件も含まない root は exit 1 (0 件 pass にしない) (#1780)', async () => {
    // package はあるが config 記載 lib が 1 件も無い形。 `libsForCategory` が交差を取るため
    // scope が空になり、 `failed` が 0 のまま exit 0 に落ちていた経路。
    const { mkdirSync, mkdtempSync, rmSync, writeFileSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const sandbox = mkdtempSync(join(tmpdir(), 'kiwa-taxonomy-nolib-'));
    try {
      const pkgDir = join(sandbox, 'packages', 'fixture-unknown-lib');
      mkdirSync(pkgDir, { recursive: true });
      writeFileSync(
        join(pkgDir, 'package.json'),
        JSON.stringify({ name: '@kiwa-lab/fixture-unknown-lib', version: '0.0.0', private: true }),
      );
      const result = spawnSync(
        'node',
        [CLI_PATH, '--category', 'fidelity', '--packages-dir', join(sandbox, 'packages')],
        { encoding: 'utf-8', timeout: SPAWN_TIMEOUT_MS },
      );
      expect(result.status, describeFailure(result)).toBe(1);
      expect(result.stderr).toMatch(/対象 lib が 0 件/);
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });
});

/**
 * CLI の perf adapter を、実 perf 計測なしで確かめる (#1751)。
 *
 * `runPerfCell` は command を組み立て、Vitest の JSON を読んで status に変換する。
 * この層が壊れても `pnpm test:perf` は緑のままになる。`test:perf` は各 package の
 * `test:perf` を直接叩くため、この関数を通らない。
 *
 * 実行を伴わないので機械の空き具合に依らない。runner を差し替えて、決まった JSON に
 * 対して決まった status を返すことだけを見る。
 */
describe('perf adapter の command 組立てと JSON 解釈 (#1751)', () => {
  type SpawnResult = { stdout: string; stderr: string };
  type Call = { cmd: string; args: string[]; opts: { cwd?: string; env?: NodeJS.ProcessEnv } };
  type RunPerfCell = (
    libDir: string,
    includeReal: boolean,
    runner?: unknown,
  ) => { status: string; passed: number; failed: number; total: number; stderr?: string };

  /** 用意した stdout を返しつつ、呼ばれ方を記録する runner。 */
  function fakeRunner(stdout: string, stderr = ''): {
    runner: (cmd: string, args: string[], opts: Call['opts']) => SpawnResult;
    calls: Call[];
  } {
    const calls: Call[] = [];
    return {
      runner: (cmd, args, opts) => {
        calls.push({ cmd, args, opts });
        return { stdout, stderr };
      },
      calls,
    };
  }

  async function loadRunPerfCell(): Promise<RunPerfCell> {
    const mod = (await import(
      pathToFileURL(join(ROOT, 'scripts/kiwa-taxonomy-run.mjs')).href
    )) as { runPerfCell: RunPerfCell };
    return mod.runPerfCell;
  }

  // 実在する perf config を持つ package。 この関数は config の存在で早期 return する。
  const LIB_DIR = join(ROOT, 'packages/ui');

  it('vitest を perf config + json reporter で起動する', async () => {
    const runPerfCell = await loadRunPerfCell();
    const { runner, calls } = fakeRunner(JSON.stringify({ numPassedTests: 4, numTotalTests: 4 }));
    runPerfCell(LIB_DIR, false, runner);
    expect(calls.length).toBe(1);
    const call = calls[0]!;
    expect(call.cmd).toBe('pnpm');
    expect(call.args).toEqual([
      'exec', '--', 'vitest', 'run', '-c', 'vitest.perf.config.ts', '--reporter=json',
    ]);
    // cwd を間違えると別 package を測る。
    expect(call.opts.cwd).toBe(LIB_DIR);
  });

  it('全件通過を pass に変換する', async () => {
    const runPerfCell = await loadRunPerfCell();
    const { runner } = fakeRunner(
      JSON.stringify({ numPassedTests: 4, numFailedTests: 0, numTotalTests: 4 }),
    );
    expect(runPerfCell(LIB_DIR, false, runner)).toMatchObject({
      status: 'pass', passed: 4, failed: 0, total: 4,
    });
  });

  it('1 件でも落ちれば fail に変換する', async () => {
    const runPerfCell = await loadRunPerfCell();
    const { runner } = fakeRunner(
      JSON.stringify({ numPassedTests: 3, numFailedTests: 1, numTotalTests: 4 }),
    );
    expect(runPerfCell(LIB_DIR, false, runner)).toMatchObject({
      status: 'fail', passed: 3, failed: 1, total: 4,
    });
  });

  it('0 件を no-tests に変換する', async () => {
    // pass でも fail でもない。 対象が無いのを「通った」 と読むと、 test を消しても
    // 気付けない。
    const runPerfCell = await loadRunPerfCell();
    const { runner } = fakeRunner(
      JSON.stringify({ numPassedTests: 0, numFailedTests: 0, numTotalTests: 0 }),
    );
    expect(runPerfCell(LIB_DIR, false, runner)).toMatchObject({ status: 'no-tests', total: 0 });
  });

  it('JSON でない出力を parse-fail に変換し、stderr を残す', async () => {
    const runPerfCell = await loadRunPerfCell();
    const { runner } = fakeRunner('not json at all', 'Error: something broke');
    const result = runPerfCell(LIB_DIR, false, runner);
    expect(result.status).toBe('parse-fail');
    // 原因が消えると、 何が起きたか追えない。
    expect(result.stderr).toContain('something broke');
  });

  it('--include-real で KIWA_MODE=real を渡す', async () => {
    const runPerfCell = await loadRunPerfCell();
    const withReal = fakeRunner(JSON.stringify({ numPassedTests: 1, numTotalTests: 1 }));
    runPerfCell(LIB_DIR, true, withReal.runner);
    expect(withReal.calls[0]!.opts.env?.['KIWA_MODE']).toBe('real');
    const plain = fakeRunner(JSON.stringify({ numPassedTests: 1, numTotalTests: 1 }));
    runPerfCell(LIB_DIR, false, plain.runner);
    expect(plain.calls[0]!.opts.env?.['KIWA_MODE']).toBeUndefined();
  });

  it('perf config が無ければ起動しない', async () => {
    const runPerfCell = await loadRunPerfCell();
    const { runner, calls } = fakeRunner('{}');
    const result = runPerfCell(join(ROOT, 'packages/lean'), false, runner);
    expect(result.status).toBe('no-files');
    expect(calls.length, '対象が無いのに起動した').toBe(0);
  });
});
