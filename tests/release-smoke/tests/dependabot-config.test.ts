// CI を持たない repo が `github-actions` ecosystem を宣言していないことを固定する (Issue #2156)。
//
// ## なぜ検査を置くか
//
// `.github/dependabot.yml` が `github-actions` ecosystem を 1 件だけ宣言していた一方、
// `.github/workflows/` は存在しなかった。 Dependabot は更新対象の file を見つけられず、
// **daily の run が観測できる範囲で全て failure** になっていた。
//
//     ERROR Error during file fetching; aborting:
//       /action.yml or /.github/workflows/<anything>.yml not found
//
// workflow は `46db4ed3d` で意図的に全削除された (`rules/git-workflow.md § CI 全面禁止`
// 遵守、Closes #557)。 その時この設定 file が取り残された。
//
// **取り残しに誰も気付かなかった**。 削除の 1 ヶ月後に #1731 がこの file を編集しており、
// そこでも失敗は見つかっていない。 GitHub 上でしか赤くならず、手元の検査に現れないため。
//
// ## 何を assert するか
//
// 2 つを別々に見る。 片方だけだと、もう片方が変わった時に検査が意味を失う。
//
// | # | assert | 壊れ方 |
// |---|---|---|
// | 1 | workflow が 1 件も無い | CI が復活すると前提が変わる。 その時は本検査ごと見直す |
// | 2 | `github-actions` を宣言する設定 file が無い | 設定 file が復活すると Dependabot が再び失敗する |
//
// 1 を落とすと 2 だけが残り、「workflow があるのに ecosystem を宣言していない」 という
// 逆の壊れ方 (更新が来なくなる) を見逃す。 2 を落とすと元の失敗が戻る。
//
// ## 何を見ないか
//
// **Dependabot の run そのものは見ない。** 走るのは GitHub 側で、手元からは起動できない。
// ここで固定するのは「失敗する設定が repo に無いこと」 までで、run の成否は
// `gh run list` で見る。
//
// **他の ecosystem は見ない。** 現在 1 件も宣言していないため、対象を一般化すると
// 走査対象が空になって検査が空振りする。 `npm` 等を足す判断が出た時に、その ecosystem の
// 対象 file を assert する行をここへ足す。
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT } from './skill-md.js';

/** Dependabot が `github-actions` ecosystem の対象として探す path。 */
const WORKFLOW_DIR = '.github/workflows';
const ROOT_ACTION = 'action.yml';

/** Dependabot の設定 file が置ける path (GitHub が読む 1 箇所)。 */
const DEPENDABOT_CONFIG = '.github/dependabot.yml';

/** workflow として数える file を列挙する。 dir が無ければ空。 */
function workflowFiles(): string[] {
  const dir = resolve(REPO_ROOT, WORKFLOW_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'));
}

/**
 * 設定 file が宣言する ecosystem 名を並べる。
 *
 * YAML parser をこの workspace に足さずに済ませるため、`package-ecosystem` の行だけを
 * 読む。 この key は list 要素の直下にしか現れず、値は quote 付き / 無しの 2 形しかない。
 * **入れ子の意味は解釈しない** = 宣言の有無を見るだけなので、行が読めれば足りる。
 */
function declaredEcosystems(body: string): string[] {
  const out: string[] = [];
  for (const line of body.split('\n')) {
    const match = /^\s*-?\s*package-ecosystem:\s*["']?([\w-]+)["']?\s*$/.exec(line);
    if (match) out.push(match[1]!);
  }
  return out;
}

describe('dependabot の設定が repo の実態と噛み合う (#2156)', () => {
  it('T-DBC-001 workflow を 1 件も持たない', () => {
    // `rules/git-workflow.md § CI 全面禁止` が新規作成を禁じている。 ここが変わったら
    // T-DBC-002 の前提 (ecosystem を宣言してはいけない) ごと見直す。
    expect(
      workflowFiles(),
      `${WORKFLOW_DIR} に workflow がある。 CI 全面禁止の前提が変わったなら本検査を見直す`,
    ).toEqual([]);
    expect(
      existsSync(resolve(REPO_ROOT, ROOT_ACTION)),
      `repo root に ${ROOT_ACTION} がある。 同上`,
    ).toBe(false);
  });

  it('T-DBC-002 github-actions ecosystem を宣言しない', () => {
    const path = resolve(REPO_ROOT, DEPENDABOT_CONFIG);
    if (!existsSync(path)) {
      // 設定 file が無いのが現在の形。 「無い」 ことを assert して、
      // file が復活した時に下の分岐へ入ることを見えるようにする。
      expect(existsSync(path), `${DEPENDABOT_CONFIG} は存在しない`).toBe(false);
      return;
    }
    const ecosystems = declaredEcosystems(readFileSync(path, 'utf8'));
    expect(
      ecosystems,
      `${DEPENDABOT_CONFIG} が github-actions を宣言している。 workflow が無いため Dependabot は dependency_file_not_found で毎回失敗する`,
    ).not.toContain('github-actions');
  });
});
