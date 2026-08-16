// 変異試験の設定が実装構成に追随しているかの検査 (Issue #1936)。
//
// 変異試験は「走って緑」 が何も証明しない種類の検査で、失敗が完走の中に隠れる。
// 実際に起きた 2 つの形を固定する。
//
//   1. 変異対象が生成物 (`.vitest-dist/`) を指すのに、`test:mutation` がその生成を
//      しなかった。 対象 file が 1 つも無いまま Stryker が正常終了し、`files` が空の
//      レポートを残す。 gate はそれを MSI 0% として読むため、未計測が閾値割れと
//      同じ見た目になる。 #1641 の後に残っていた `mutation.json` (8/8) がこの状態で、
//      変異が 1 件も作られていなかった。
//   2. `index.ts` を `runCli.ts` に分離した際、`mutate` が `commands/` 配下 3 file を
//      指したままだった。 引数解析と command 振り分けを持つ 611 変異ぶんの module が
//      対象から外れており、そこを壊しても gate は緑を返した。
//
// どちらも「file が増えた時に設定を足し忘れる」 形で、書かれた設定を読んでも
// 気付けない。 増えた側から見て検査するのが唯一の検知経路になる。
//
// ## 検査の範囲
//
// `src` 直下の module だけを要求する。 `src/commands` と `src/detect` は現状の選択
// (どれを変異対象にするか) をそのまま尊重する = `anvil-seed.ts` は CAR-1530 で別途
// 判断する対象で、ここで巻き込むと本 Issue の範囲を超える。
//
// 直下に絞っても目的は達する。 #1641 のような「entry を分割して新しい module を
// 直下に作る」 形が、本 Issue で起きた追随漏れそのものだから。
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));

/** `package.json` を持つ最も近い祖先を package root とする。 */
function packageRoot(from: string): string {
  for (let dir = from; ; ) {
    try {
      readFileSync(join(dir, 'package.json'), 'utf8');
      return dir;
    } catch {
      const parent = resolve(dir, '..');
      // root まで辿っても見つからないなら、探し方のほうが誤っている。
      if (parent === dir) throw new Error(`package.json が見つからない: ${from}`);
      dir = parent;
    }
  }
}

const PKG_ROOT = packageRoot(HERE);

/**
 * 変異対象に載っているべき `src` 直下 module の名前を返す (拡張子なし)。
 *
 * `bin` は shebang + `runCli` 呼出だけの 6 行で、変異させる判断が無い。
 * `index` は公開 API の再 export で、変異させても意味を持つ分岐が無い。
 * どちらも `test:cov` の coverage exclude でも同じ扱いをしている。
 */
const EXEMPT_MODULES = new Set(['bin', 'index']);

export function topLevelModules(entries: string[]): string[] {
  return entries
    .filter((name) => name.endsWith('.ts') && !name.endsWith('.d.ts'))
    .map((name) => name.slice(0, -'.ts'.length))
    .filter((name) => !EXEMPT_MODULES.has(name))
    .sort();
}

/**
 * 変異対象から漏れている `src` 直下 module を返す。
 *
 * 対応は「`.vitest-dist/src/<name>.js` が `mutate` に載っているか」 で見る。
 * 文字列の部分一致で見ると `runCli.js` を要求する検査が `runCliHelpers.js` で
 * 通ってしまうため、要素そのものと突き合わせる。
 */
export function findUnmutatedModules(modules: string[], mutate: unknown): string[] {
  // 配列でない `mutate` は「何を変異させるか決められない」 = 検査が成立しない。
  // 通すのではなく全件を漏れとして返す (fail-closed)。
  if (!Array.isArray(mutate)) return [...modules];
  const listed = new Set(mutate.filter((entry): entry is string => typeof entry === 'string'));
  return modules.filter((name) => !listed.has(`.vitest-dist/src/${name}.js`));
}

/**
 * `test:mutation` が変異対象の生成を含むかを返す。 含んでいれば null。
 *
 * 見るのは 2 点で、どちらも欠けると変異 0 件で完走しうる。 生成 command そのものが
 * 無い形と、`stryker run` より後ろに書かれていて実行順として間に合わない形。
 *
 * shell の完全な解析はしない (`rules/quality.md` が静的 shell 解析の非収束を実測
 * している領域)。 ここで防ぐのは「書き忘れ」 であって、意図的な迂回ではない。
 */
const BUILD_STEP = 'tsc -p tsconfig.vitest.json';
const MUTATION_RUN = 'stryker run';

export function findMissingBuildStep(script: unknown): string | null {
  if (typeof script !== 'string') return 'test:mutation script が無い';
  const runAt = script.indexOf(MUTATION_RUN);
  if (runAt < 0) return `\`${MUTATION_RUN}\` を含まない`;
  const buildAt = script.indexOf(BUILD_STEP);
  if (buildAt < 0) {
    return `変異対象を生成する \`${BUILD_STEP}\` を含まない (対象 0 件で完走しうる)`;
  }
  if (buildAt > runAt) {
    return `\`${BUILD_STEP}\` が \`${MUTATION_RUN}\` より後ろにある`;
  }
  return null;
}

describe('stryker 設定が実装構成に追随している (#1936)', () => {
  it('src 直下の module は全て変異対象に載っている', async () => {
    const config = await import(pathToFileURL(join(PKG_ROOT, 'stryker.config.mjs')).href);
    const modules = topLevelModules(readdirSync(join(PKG_ROOT, 'src')));
    // 対象が空だと検査が常に通る。 module の列挙自体が壊れていないことを先に固定する。
    expect(modules).toContain('runCli');

    expect(
      findUnmutatedModules(modules, config.default?.mutate),
      'src 直下に module を足したら stryker.config.mjs の mutate にも足す。 ' +
        '漏れると、その module を壊しても変異 gate が緑を返す',
    ).toEqual([]);
  });

  it('test:mutation は変異対象を生成してから走る', () => {
    const pkg = JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8'));
    expect(
      findMissingBuildStep(pkg.scripts?.['test:mutation']),
      '変異対象は .vitest-dist/ 配下の生成物で、test / test:cov を通さずに ' +
        'test:mutation だけを起動すると対象が存在しない。 Stryker は正常終了し、' +
        'files が空のレポートを残す',
    ).toBeNull();
  });
});

describe('stryker 設定の検査自体 (#1936)', () => {
  it('変異対象から漏れた module を検出する', () => {
    const cases: Array<[string, string[], unknown]> = [
      ['1 件も載っていない', ['runCli'], []],
      ['別 module だけ載っている', ['runCli'], ['.vitest-dist/src/commands/init.js']],
      ['前方一致する別名で通そうとする', ['runCli'], ['.vitest-dist/src/runCliHelpers.js']],
      ['src を経由しない path で書く', ['runCli'], ['.vitest-dist/runCli.js']],
      ['source の path で書く', ['runCli'], ['src/runCli.ts']],
      ['複数のうち 1 件だけ漏れる', ['other', 'runCli'], ['.vitest-dist/src/other.js']],
      ['mutate が配列でない', ['runCli'], '.vitest-dist/src/runCli.js'],
      ['mutate が無い', ['runCli'], undefined],
    ];
    for (const [label, modules, mutate] of cases) {
      expect(findUnmutatedModules(modules, mutate), label).not.toEqual([]);
    }
  });

  it('載っている形は通す', () => {
    expect(findUnmutatedModules(['runCli'], ['.vitest-dist/src/runCli.js'])).toEqual([]);
    expect(
      findUnmutatedModules(
        ['other', 'runCli'],
        ['.vitest-dist/src/runCli.js', '.vitest-dist/src/other.js'],
      ),
    ).toEqual([]);
    // 対象 module が無ければ漏れも無い。
    expect(findUnmutatedModules([], [])).toEqual([]);
  });

  it('bin と index は変異対象として要求しない', () => {
    expect(topLevelModules(['bin.ts', 'index.ts', 'runCli.ts'])).toEqual(['runCli']);
    // dir や型定義を module として数えない。
    expect(topLevelModules(['commands', 'runCli.ts', 'types.d.ts'])).toEqual(['runCli']);
  });

  it('生成段を欠く script を検出する', () => {
    const cases: Array<[string, unknown]> = [
      ['stryker run だけ', 'stryker run'],
      ['生成が後ろにある', `stryker run && tsc -p tsconfig.vitest.json`],
      ['別 config を build している', 'tsc -p tsconfig.json && stryker run'],
      ['script が無い', undefined],
      ['文字列でない', ['stryker run']],
      ['そもそも stryker を呼ばない', 'tsc -p tsconfig.vitest.json'],
    ];
    for (const [label, script] of cases) {
      expect(findMissingBuildStep(script), label).not.toBeNull();
    }
  });

  it('生成してから走る script は通す', () => {
    expect(findMissingBuildStep('tsc -p tsconfig.vitest.json && stryker run')).toBeNull();
    expect(
      findMissingBuildStep(
        `node -e "require('node:fs').rmSync('.vitest-dist',{recursive:true,force:true})" && ` +
          `tsc -p tsconfig.vitest.json && stryker run`,
      ),
    ).toBeNull();
  });
});
