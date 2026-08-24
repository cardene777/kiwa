// `packages/*` の `test:fast` が `test` から導出された形のままであることを固定する (Issue #2202)。
//
// `test:fast` は source を直接走らせて `--changed` で絞る経路で、 `test` とは走らせ方が違う。
// flag は package ごとに違う (`--environment jsdom` / `--testTimeout 15000` /
// `--no-file-parallelism` / leg 2 本) ため、 26 個を人手で書くと `test` を直した時に
// `test:fast` だけが古い flag のまま残る。
//
// **ずれても落ちない**。 `test:fast` は開発者が手で叩く経路で、 完全実行の gate には出て
// こない。 古い `--environment` で走り続けても「速い」 としか見えないので、 drift を
// 落とす場所がここにしか無い。
//
// 導出の実体は `scripts/sync-test-fast.mjs` で、 本 file はそれを実行した結果と、 導出
// 関数そのものの性質を見る。 期待値の script 文字列は書き写さない
// (`rules/quality.md § 導出可能記述は人手で書かない`)。
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const SCRIPT = resolve(REPO_ROOT, 'scripts/sync-test-fast.mjs');

interface Result {
  name: string;
  file: string;
  status: 'ok' | 'drift' | 'missing' | 'skipped';
  reason?: string;
  expected?: string;
  actual?: string;
}

interface Module {
  parseScript: (script: string) => string[][];
  deriveFast: (script: string) => string | null;
  inspect: () => Result[];
  packageDirs: () => string[];
  EXCLUDED: Map<string, string>;
  blankReasons: (excluded?: Map<string, string>) => string[];
  OUT_DIR: string;
  CHANGED_BASE: string;
}

/** 導出 script を module として読む。 実行と同じ実体を見る。 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const load = (): Promise<Module> => import(pathToFileURL(SCRIPT).href) as any;

/**
 * 報告 mode の判定結果。 script を実際に起動して受け取る。
 *
 * **exit code で捨てない**。 drift があると script は 1 で終わるが、 その時こそ「どの
 * package がどうずれたか」 を読みたい。 throw させると失敗の理由が
 * `Command failed` だけになり、 本 file が報告すべき中身が消える。
 */
function runJson(): { status: number; results: Result[] } {
  try {
    const out = execFileSync(process.execPath, [SCRIPT, '--json'], {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      maxBuffer: 8 * 1024 * 1024,
    });
    return { status: 0, results: JSON.parse(out) as Result[] };
  } catch (error) {
    const failure = error as { status?: number; stdout?: string };
    if (failure.stdout === undefined) throw error;
    return { status: failure.status ?? 1, results: JSON.parse(failure.stdout) as Result[] };
  }
}

function results(): Result[] {
  return runJson().results;
}

const temps: string[] = [];
afterAll(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

describe('packages の test:fast が test から導出された形のままである (#2202)', () => {
  it('全 package が導出結果と一致する', () => {
    // 本 file の本体。 1 package でも drift / missing があれば落ちる。
    const all = results();
    expect(all.length, 'packages を 1 件も見ていない').toBeGreaterThan(0);

    const stale = all
      .filter((r) => r.status === 'drift' || r.status === 'missing')
      .map((r) => `${r.name} (${r.status})`);
    expect(stale, `test:fast が導出結果と違う:\n${stale.join('\n')}`).toEqual([]);
  });

  it('対象になった package が 1 件以上ある', () => {
    // 全 package が skipped に落ちると、 上の検査は空集合を比べて必ず通る。 対象が
    // 実在することを別に見る (`docs/quality/check-authoring.md` § 形 1)。
    const covered = results().filter((r) => r.status === 'ok');
    expect(covered.length, '導出対象の package が 1 件も無い').toBeGreaterThan(0);
  });

  it('対象外にした package には理由がある', () => {
    // 「対象外」 と「まだ確かめていない」 を同じ形にしない。 理由の無い skip は、
    // source 直走が通らない package に壊れた script を配ることと区別が付かない。
    const skipped = results().filter((r) => r.status === 'skipped');
    const missingReason = skipped
      .filter((r) => (r.reason ?? '').trim().length === 0)
      .map((r) => r.name);
    expect(missingReason, `理由の無い対象外がある: ${missingReason.join(' ')}`).toEqual([]);
  });

  it('報告 mode は drift があると非 0 で終わる', () => {
    // 呼出側 (人 / 別 script) は exit code で判断する。 0 を返すと drift を見逃す。
    const pkgDir = resolve(REPO_ROOT, 'packages');
    const target = results().find((r) => r.status === 'ok');
    expect(target, '導出対象の package が 1 件も無い').toBeDefined();

    const file = join(pkgDir, target!.name, 'package.json');
    const backup = mkdtempSync(join(tmpdir(), 'kiwa-test-fast-'));
    temps.push(backup);
    const saved = join(backup, 'package.json');
    copyFileSync(file, saved);

    try {
      const pkg = JSON.parse(readFileSync(file, 'utf-8')) as {
        scripts: Record<string, string>;
      };
      pkg.scripts['test:fast'] = `${pkg.scripts['test:fast']} --reporter=dot`;
      execFileSync(
        process.execPath,
        ['-e', `require('node:fs').writeFileSync(${JSON.stringify(file)}, ${JSON.stringify(`${JSON.stringify(pkg, null, 2)}\n`)})`],
        { cwd: REPO_ROOT },
      );

      let status = 0;
      try {
        execFileSync(process.execPath, [SCRIPT], { cwd: REPO_ROOT, encoding: 'utf-8' });
      } catch (error) {
        status = (error as { status?: number }).status ?? 0;
      }
      expect(status, 'drift があるのに 0 で終わった').toBe(1);
    } finally {
      copyFileSync(saved, file);
    }

    // 戻したことを確かめる。 戻し損ねると、 以降の run は「drift があるのに緑」 に見える
    // 別の状態で走る。
    let restored = 0;
    try {
      execFileSync(process.execPath, [SCRIPT], { cwd: REPO_ROOT, encoding: 'utf-8' });
    } catch (error) {
      restored = (error as { status?: number }).status ?? 0;
    }
    expect(restored, '検査が package.json を戻していない').toBe(0);
  });

  it('報告 mode は package.json を書き換えない', () => {
    // `--write` を付けない起動が書くと、 検査を走らせるだけで作業ツリーが動く。
    //
    // **drift を作ってから見る**。 揃った状態で比べると、 報告 mode が書いても中身が
    // 同じなので file は動かず、 検査が通ってしまう (変異試験 M8 が実際に生き残った)。
    // ずれた値を置いてから走らせれば、 書く実装は直してしまうので差が出る。
    const target = results().find((r) => r.status === 'ok');
    expect(target, '導出対象の package が 1 件も無い').toBeDefined();

    const file = target!.file;
    const backup = mkdtempSync(join(tmpdir(), 'kiwa-test-fast-'));
    temps.push(backup);
    const saved = join(backup, 'package.json');
    copyFileSync(file, saved);

    try {
      const pkg = JSON.parse(readFileSync(file, 'utf-8')) as { scripts: Record<string, string> };
      pkg.scripts['test:fast'] = `${pkg.scripts['test:fast']} --reporter=dot`;
      const drifted = `${JSON.stringify(pkg, null, 2)}\n`;
      writeFileSync(file, drifted);

      runJson();

      expect(readFileSync(file, 'utf-8'), '報告 mode が package.json を書き換えた').toBe(drifted);
    } finally {
      copyFileSync(saved, file);
    }

    expect(runJson().status, '検査が package.json を戻していない').toBe(0);
  });
});

describe('導出そのものの性質 (#2202)', () => {
  const BASE =
    "node ../../scripts/build-deps.mjs @kiwa-lab/core && node -e \"require('node:fs').rmSync('.vitest-dist',{recursive:true,force:true})\" && tsc -p tsconfig.vitest.json && vitest run .vitest-dist/tests --exclude '**/.stryker-tmp/**' --environment jsdom --testTimeout 15000";

  it('位置引数を source 側に戻す', async () => {
    const { deriveFast } = await load();
    const fast = deriveFast(BASE)!;
    expect(fast, 'compile 済 path をそのまま走らせている').not.toContain('.vitest-dist/tests ');
    expect(fast, 'source の位置引数になっていない').toContain('vitest run tests ');
  });

  it('compile 済 dir を除外する', async () => {
    // 位置引数は path の部分一致なので、 除外しないと `.vitest-dist/tests/*.test.js` も
    // 集まる。 落ちずに 2 倍走るだけになる。
    const { deriveFast, OUT_DIR } = await load();
    expect(deriveFast(BASE)!, 'compile 済 dir を除外していない').toContain(`'**/${OUT_DIR}/**'`);
  });

  it('変更で絞る flag を足す', async () => {
    const { deriveFast, CHANGED_BASE } = await load();
    expect(deriveFast(BASE)!, '--changed を足していない').toContain(`--changed ${CHANGED_BASE}`);
  });

  it('元の flag をすべて運ぶ', async () => {
    // 契約は「4 点だけ変えて残りはそのまま」。 要素ごとに 1 つずつ見る = まとめて 1 つの
    // literal で照合すると、 並びを変えただけで落ちる
    // (`docs/quality/check-authoring.md` § 複数の要素を要求する契約)。
    const { deriveFast } = await load();
    const fast = deriveFast(BASE)!;
    expect(fast, '--environment を落としている').toContain('--environment jsdom');
    expect(fast, '--testTimeout を落としている').toContain('--testTimeout 15000');
    expect(fast, '元の除外を落としている').toContain("--exclude '**/.stryker-tmp/**'");
  });

  it('leg が 2 本ある script で 2 本とも導出する', async () => {
    // `ui` がこの形。 1 本に畳むと、 畳まれた側の test が `test:fast` から丸ごと消える。
    const { deriveFast } = await load();
    const two = `${BASE} && vitest run .vitest-dist/tests/browser.test.js --environment node`;
    const fast = deriveFast(two)!;
    const legs = fast.split(' && ');
    expect(legs.length, 'leg を 1 本に畳んでいる').toBe(2);
    expect(legs[1]!, '2 本目の位置引数が source 側になっていない').toContain(
      'vitest run tests/browser.test.ts ',
    );
    expect(legs[1]!, '2 本目に --changed が無い').toContain('--changed');
  });

  it('除外 glob の拡張子を source 側に合わせる', async () => {
    // `--exclude '**/browser.test.js'` のままだと、 source 側の `.ts` に当たらず、
    // 除外したはずの file が 1 本目の leg にも入る = 2 leg に分けた意味が消える。
    const { deriveFast } = await load();
    const withGlob = `${BASE.replace('--environment jsdom', "--exclude '**/browser.test.js' --environment jsdom")}`;
    const fast = deriveFast(withGlob)!;
    expect(fast, '除外 glob が compile 済の拡張子のまま').toContain("--exclude '**/browser.test.ts'");
    expect(fast, '除外 glob の拡張子を戻していない').not.toContain("'**/browser.test.js'");
  });

  it('引用符の内側では leg を切らない', async () => {
    // `node -e "...&&..."` のような形で切ると、 vitest の leg でない断片を leg として
    // 数えることになる。
    const { parseScript } = await load();
    const legs = parseScript(`node -e "a && b" && vitest run .vitest-dist/tests`);
    expect(legs.length, '引用符の内側で切っている').toBe(2);
    expect(legs[0]!, '引用符の中身を語として保っていない').toEqual(['node', '-e', 'a && b']);
  });

  it('vitest を起動しない test script は導出しない', async () => {
    // Foundry / Playwright の package に vitest の起動形を配ると、 走らない script が
    // 増えるだけになる。
    const { deriveFast } = await load();
    expect(deriveFast('forge test -vvv'), 'vitest 以外から導出している').toBeNull();
    expect(deriveFast('playwright test'), 'vitest 以外から導出している').toBeNull();
  });

  it('理由の無い対象外を見つけられる', async () => {
    // 実 `EXCLUDED` は今 0 件なので、 それだけを見る検査は空集合どうしを比べて必ず通る。
    // 判定そのものに fixture を通し、 両方向を見る。
    const { blankReasons } = await load();
    expect(
      blankReasons(new Map([['a', '  '], ['b', '実起動で緑にならない']])),
      '理由が空の対象外を見逃している',
    ).toEqual(['a']);
    expect(
      blankReasons(new Map([['b', '実起動で緑にならない']])),
      '理由のある対象外まで拾っている',
    ).toEqual([]);
    expect(blankReasons(), '実 list に理由の無い対象外がある').toEqual([]);
  });
});
