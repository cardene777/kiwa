// 起動形の必須要素を照合する (#2023)。
//
// [PR #2022](https://github.com/cardene777/kiwa/pull/2022) の棚卸しで、 SKILL.md の bash fence に
// 現れる flag 133 件のうち 25 件が検査の照合文字列に 1 度も現れないことが分かった。 内訳の
// 大半 (21 件) は **その fence を読む検査が 1 件も無い** = 起動形を丸ごと書き換えても誰も
// 気付かない状態だった。
//
// 本 file が扱うのは、 そのうち **落とすと実害が出ることを実測した 3 件**。 実害の無い 3 件は
// 検査を書かず、 判断と理由を `docs/quality/check-authoring.md` に残した (何を検査しないと
// 決めたかが残らないと、 次に数えた人が同じ調査をやり直す)。
//
// | 起動形 | 落とした時に起きること | 実測 |
// |---|---|---|
// | `kiwa init --detect` | `--detect` 無しは **scaffold** する (CLI が分岐を持つ) | `runCli.ts` の `SCAFFOLD_FLAGS` |
// | `forge coverage --report lcov` | 既定は `summary` なので `.lcov` に表が入る | `forge coverage --help` の `[default: summary]` |
// | `pnpm add --save-dev` | 利用者 project の `dependencies` に test 専用 dep が入る | pnpm の既定 |
//
// 照合は **comment を除いた実行行** に対して行う。 fence の text は実行される引数の代理指標
// でしかなく、 引数を comment に退避する変異が素通りする (#2021 で実測)。
import { describe, expect, it } from 'vitest';

import { fenceUnder, fenceUnderIn, headingSectionIn, skillBody } from './skill-md.js';

/** fence から comment を除いた実行行だけを返す。 */
function executableLines(fence: string): string {
  return fence
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .map((line) => line.replace(/\s+#.*$/, ''))
    .join('\n');
}

describe('SKILL.md の起動形が必須要素を落としていない', () => {
  it('/kiwa-app の検出が --detect を渡す', () => {
    // `kiwa init` は **scaffold する** (`runCli.ts` が `--detect` の有無で分岐し、
    // `SCAFFOLD_FLAGS` は `--detect` と併用できないと明示している)。 落とすと、
    // 「`.kiwa/stack.json` だけ書く」 と宣言している Step が利用者 project に test dir と
    // config を書き込む形に変わる。 **宣言と実行が逆になる**。
    const command = executableLines(fenceUnder('kiwa-app', /^## Step 1: /m, 'bash'));
    expect(command, 'kiwa init を呼んでいない').toContain('kiwa init');
    expect(command, '--detect を渡していない (scaffold に変わる)').toContain('--detect');
  });

  it('/kiwa-forge の coverage 計測が --report lcov を渡す', () => {
    // `forge coverage` の既定は `summary` (実測 = `--help` が `[default: summary]`)。
    // 落とすと `coverage-{module}.lcov` に summary の表が書かれ、 file 名は正しいまま
    // 中身だけが別物になる。 分類 (`references/coverage-classify.md`) は lcov の
    // `SF:` / `DA:` を読むため、 何も分類できない。
    const command = executableLines(fenceUnder('kiwa-forge', /^#### Step 5a: /m, 'bash'));
    // fence には summary を出す 2 本目の `forge coverage` もある。 fence 全体で 3 要素を
    // 別々に見ると、 `--report lcov` を 2 本目へ移しても緑になるため、 同じ実行行に束縛する。
    const lcovCommand = command
      .split('\n')
      .find(
        (line) =>
          line.includes('forge coverage') &&
          line.includes('tests/reports/contract/coverage-{module}.lcov'),
      );
    expect(lcovCommand, 'lcov の出力先へ書く forge coverage を呼んでいない').toBeDefined();
    expect(lcovCommand, '--report lcov を同じ実行行に渡していない').toContain('--report lcov');
    // 出力先も同じ実行行に束縛する。 lcov を出しても別の行が file を書けば、 分類は
    // summary を読む可能性がある。
    expect(lcovCommand, 'lcov の出力先が変わっている').toContain(
      'tests/reports/contract/coverage-{module}.lcov',
    );
  });

  it('/kiwa-hardhat の solidity-coverage install が --save-dev を渡す', () => {
    // 落とすと利用者 project の `dependencies` に入る。 test 専用の dep が runtime 依存
    // として宣言され、 その project を publish すると利用者の利用者にまで届く。
    // install 自体は成功するため、 落ちない。
    const section = skillBody('kiwa-hardhat');
    const command = executableLines(fenceUnderIn(section, /^### Step 5: /m, 'bash'));
    expect(command, 'solidity-coverage を install していない').toContain(
      'pnpm add --save-dev solidity-coverage',
    );
  });

  it('範囲が次の同 level 見出しの手前で閉じる', () => {
    // 範囲の閉じ方そのものを見る。 実装中に **範囲が 1 文字に潰れる** 形を踏んだ
    // (`m` flag の `^` が文字列先頭にも一致し、 対象の見出し自身を「次の見出し」 として
    // 拾っていた)。 fence が取れるかだけを見ていると、 潰れた時に「fence が無い」 としか
    // 分からず、 原因が範囲にあることに気付けない。
    const section = headingSectionIn(skillBody('kiwa-app'), /^## Step 1: /m);
    expect(section, '対象の見出しから始まっていない').toMatch(/^## Step 1: /);
    expect(section, '次の Step を飲み込んでいる').not.toContain('## Step 2: ');
    expect(section.length, '範囲が潰れている').toBeGreaterThan(50);
  });

  it('対象 Step から fence が消えたら隣の Step を拾わない', () => {
    // 範囲を `### ` で閉じると、 `## ` 見出しの skill では後続 Step を飲み込む =
    // 対象から fence が消えても隣の fence を拾って緑になる。 `fenceUnderIn` は level を
    // 数えて閉じるため、 消えたことが「見つからない」 として落ちる。
    const body = skillBody('kiwa-app');
    const stripped = body.replace(/```bash\nnpx --no kiwa init --detect\n```/, '');
    expect(stripped, '前提が崩れている (対象 fence を消せていない)').not.toBe(body);
    expect(() => fenceUnderIn(stripped, /^## Step 1: /m, 'bash')).toThrow();
  });
});
