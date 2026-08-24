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
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
  status: 'ok' | 'drift' | 'missing' | 'skipped' | 'orphan';
  reason?: string;
  expected?: string;
  actual?: string;
}

interface Module {
  parseScript: (script: string) => string[][];
  deriveTest: (script: string) => string | null;
  deriveFast: (script: string) => string | null;
  inspect: (root?: string) => Result[];
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

    // `orphan` (導出できない `test` なのに `test:fast` が残っている) も落とす。 除くと、
    // `test` を導出の当たらない形に書き換えた瞬間に古い `test:fast` が無検査で残る。
    const stale = all
      .filter((r) => r.status === 'drift' || r.status === 'missing' || r.status === 'orphan')
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
    const target = results().find((r) => r.status === 'ok');
    expect(target, '導出対象の package が 1 件も無い').toBeDefined();

    const file = target!.file;
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

  it('置き去りがあると非 0 で終わる', () => {
    // `orphan` は書いて直せないので、 `--write` を通した後も 1 で終わる必要がある。
    // JSON に出るだけで exit code に出ないと、 呼出側 (人 / 別 script) は素通しする
    // (変異試験 M11 が実際に生き残った)。
    const target = results().find((r) => r.status === 'ok');
    expect(target, '導出対象の package が 1 件も無い').toBeDefined();

    const file = target!.file;
    const backup = mkdtempSync(join(tmpdir(), 'kiwa-test-fast-'));
    temps.push(backup);
    const saved = join(backup, 'package.json');
    copyFileSync(file, saved);

    try {
      // `test` を導出の当たらない形にすると、 残った `test:fast` が置き去りになる。
      const pkg = JSON.parse(readFileSync(file, 'utf-8')) as { scripts: Record<string, string> };
      pkg.scripts['test'] = 'forge test';
      writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);

      const reported = runJson();
      const orphans = reported.results.filter((r) => r.status === 'orphan').map((r) => r.name);
      expect(orphans, '置き去りを orphan として報告していない').toContain(target!.name);
      expect(reported.status, '置き去りがあるのに 0 で終わった').toBe(1);

      // `--write` でも黙らない。 消してよいかは script が決められない。
      let written = 0;
      try {
        execFileSync(process.execPath, [SCRIPT, '--write'], { cwd: REPO_ROOT, encoding: 'utf-8' });
      } catch (error) {
        written = (error as { status?: number }).status ?? 0;
      }
      expect(written, '--write が置き去りを黙らせた').toBe(1);
    } finally {
      copyFileSync(saved, file);
    }

    expect(runJson().status, '検査が package.json を戻していない').toBe(0);
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

describe('compile を要る経路だけが compile する (#2204)', () => {
  it('どの target の test も tsc を呼ばない', () => {
    // #2204 の本体。 `test` は source を直接走らせる = 26 package で 71.9 秒あった固定費が消える。
    const offenders = results()
      .filter((r) => r.status !== 'skipped')
      .map((r) => ({ name: r.name, test: JSON.parse(readFileSync(r.file, 'utf-8')).scripts.test }))
      .filter((r) => /\btsc\b/.test(r.test))
      .map((r) => r.name);
    expect(offenders.length + results().filter((r) => r.status !== 'skipped').length, '対象 target が 0 件').toBeGreaterThan(0);
    expect(offenders, `test が compile を挟んでいる: ${offenders.join(' ')}`).toEqual([]);
  });

  it('coverage の経路は自前で compile する', () => {
    // `test` から compile を外したので、 compile 済 file を測る経路は自分で作る必要がある。
    // 持っていないと **coverage が古い compile 結果を測る**。
    const withCov = results()
      .filter((r) => r.status !== 'skipped')
      .map((r) => ({ name: r.name, cov: JSON.parse(readFileSync(r.file, 'utf-8')).scripts['test:cov'] }))
      .filter((r) => r.cov !== undefined);
    expect(withCov.length, 'test:cov を持つ package が 1 件も無い').toBeGreaterThan(0);
    const missing = withCov.filter((r) => !/tsc -p/.test(r.cov)).map((r) => r.name);
    expect(missing, `test:cov が compile を持たない: ${missing.join(' ')}`).toEqual([]);
  });

  it('変異試験と taxonomy の経路は自前で compile する', () => {
    // どちらも script 側が remove / compile / run を持つ。 `test` に依存していないことを、
    // 実 file の中身で確かめる (名前だけの照合では、 中で compile を外しても気付けない)。
    const mutation = readFileSync(resolve(REPO_ROOT, 'scripts/package-mutation.mjs'), 'utf-8');
    expect(mutation, '変異試験の経路が compile を持たない').toContain('tsconfig.vitest.json');
    expect(mutation, '変異試験の経路が tsc を呼ばない').toMatch(/['"]tsc['"]/);

    const taxonomy = readFileSync(resolve(REPO_ROOT, 'scripts/kiwa-taxonomy-run.mjs'), 'utf-8');
    expect(taxonomy, 'taxonomy の経路が compile を持たない').toContain('tsconfig.vitest.json');
    expect(taxonomy, 'taxonomy の経路が tsc を呼ばない').toMatch(/['"]tsc['"]/);
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

  it('位置引数より前にある flag の値を path と誤認しない', async () => {
    // Vitest は flag を file filter より前にも置ける。 最初の非 flag 語だけを見ると
    // `jsdom` を path として変換し、 本物の `.vitest-dist/tests` が残る。 同期検査はその
    // 誤導出と一致して緑になるため、 有効な並び替えを fixture で固定する。
    const { deriveFast } = await load();
    const fast = deriveFast(
      'vitest run --environment jsdom .vitest-dist/tests --testTimeout 15000',
    )!;
    expect(fast, 'flag 値を source path にしている').toContain('--environment jsdom');
    expect(fast, 'compile 済 path が残っている').not.toContain('.vitest-dist/tests');
    expect(fast, 'source の位置引数になっていない').toContain('vitest run --environment jsdom tests ');
  });

  it('複数の compile 済位置引数をすべて source 側に戻す', async () => {
    // Vitest は file filter を複数受け取る。 先頭だけ変換すると 2 本目は exclude され、
    // fast route の収集範囲が完全実行より静かに狭くなる。
    const { deriveFast } = await load();
    const fast = deriveFast(
      'vitest run .vitest-dist/tests/a.test.js .vitest-dist/tests/b.test.js --environment node',
    )!;
    expect(fast, '1 本目を source 側に戻していない').toContain('tests/a.test.ts');
    expect(fast, '2 本目を source 側に戻していない').toContain('tests/b.test.ts');
    expect(fast, 'compile 済 path が残っている').not.toContain('.vitest-dist/tests');
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

  it('既に source 直走の test script も同じ結果に落ちる', async () => {
    // #2204 で `test` から compile 段を外したので、 導出の入力は既に source 直走になる。
    // **何度掛けても同じ結果になる** ことが、 script を繰り返し実行できる条件そのもの。
    const { deriveTest } = await load();
    const compiled =
      "node -e \"x .vitest-dist x\" && tsc -p tsconfig.vitest.json && vitest run .vitest-dist/tests --environment node";
    const once = deriveTest(compiled)!;
    expect(once, 'compile 段が残っている').not.toContain('tsc -p');
    expect(deriveTest(once), '2 度掛けると結果が変わる').toBe(once);
  });

  it('導出できない test に test:fast が残っていると orphan として報告する', async () => {
    // 「対象外」 と「置き去り」 を分ける。 混ぜると、 `test` を書き換えた瞬間に古い
    // `test:fast` が誰にも見られないまま残り、 開発者は古い flag で走り続ける。
    const { inspect } = await load();
    const root = mkdtempSync(join(tmpdir(), 'kiwa-test-fast-root-'));
    temps.push(root);
    const write = (name: string, scripts: Record<string, string>): void => {
      const dir = join(root, 'packages', name);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'package.json'), `${JSON.stringify({ name, scripts }, null, 2)}\n`);
    };

    write('leftover', { test: 'forge test', 'test:fast': 'vitest run tests --changed main' });
    write('clean', { test: 'forge test' });
    write('derived', {
      test: "vitest run tests --exclude '**/.vitest-dist/**' --environment node",
      'test:fast':
        "vitest run tests --changed ${KIWA_FAST_BASE:-main} --exclude '**/.vitest-dist/**' --environment node",
    });

    const byName = new Map(inspect(root).map((r) => [r.name.replace('packages/', ''), r]));
    expect(byName.get('leftover')?.status, '置き去りを orphan にしていない').toBe('orphan');
    expect(byName.get('clean')?.status, '置き去りの無い対象外まで orphan にしている').toBe('skipped');
    expect(byName.get('derived')?.status, '導出できる package を取りこぼしている').toBe('ok');
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
