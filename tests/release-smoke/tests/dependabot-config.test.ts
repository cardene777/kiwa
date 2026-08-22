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
// repo history には取り残しを直した記録が無い。削除の 1 ヶ月後に #1731 がこの file を
// 編集した後も設定は残った。GitHub 上でしか赤くならず、手元の検査に現れなかったため。
//
// ## 何を assert するか
//
// 2 つを別々に見る。release-smoke が実行される時点の repo tree を検査するもので、workflow が
// 将来にわたり存在しないこと自体を保証するものではない。片方だけだと、もう片方が変わった時に
// 検査が意味を失う。
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
// **Dependabot の run そのものは見ない。** 走るのは GitHub 側で、local test からは
// 起動できない。ここで固定するのは「失敗する設定が repo に無いこと」 まで。run の成否確認と
// 手動再実行は GitHub の Insights > Dependency graph > Dependabot から行う。
//
// **security update の状態は見ない。** 有効化は repo settings 側だが、設定 file は有効化後の
// PR を一部 customize できる。この削除で version update は止まるが、security update が現在
// 無効という判断は API の時点観測であり、本検査が将来まで保証する invariant ではない。
//
// **他の ecosystem は見ない。** 現在 1 件も宣言していないため、対象を一般化すると
// 走査対象が空になって検査が空振りする。 `npm` 等を足す判断が出た時に、その ecosystem の
// 対象 file を assert する行をここへ足す。
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

import { REPO_ROOT } from './skill-md.js';

/** Dependabot が `github-actions` ecosystem の対象として探す path。 */
const WORKFLOW_DIR = '.github/workflows';
const ROOT_ACTIONS = ['action.yml', 'action.yaml'] as const;

/** Dependabot の設定 file が置ける path (GitHub が読む 2 形)。 */
const DEPENDABOT_CONFIGS = ['.github/dependabot.yml', '.github/dependabot.yaml'] as const;

/** workflow として数える file を列挙する。 dir が無ければ空。 */
function workflowFiles(): string[] {
  const dir = resolve(REPO_ROOT, WORKFLOW_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'));
}

/**
 * 設定 file が宣言する ecosystem 名を並べる。
 *
 * YAML の正規表現読みは inline comment / flow mapping / quote 付き key / alias を
 * 読み落とす。GitHub が読む YAML の意味どおりに parse して updates 直下だけを見る。
 */
function declaredEcosystems(body: string): string[] {
  const config: unknown = parse(body);
  if (typeof config !== 'object' || config === null || !('updates' in config)) return [];
  const updates = (config as { updates?: unknown }).updates;
  if (!Array.isArray(updates)) return [];
  return updates.flatMap((entry) => {
    if (typeof entry !== 'object' || entry === null || !('package-ecosystem' in entry)) return [];
    const ecosystem = (entry as { 'package-ecosystem'?: unknown })['package-ecosystem'];
    return typeof ecosystem === 'string' ? [ecosystem] : [];
  });
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
      ROOT_ACTIONS.filter((name) => existsSync(resolve(REPO_ROOT, name))),
      `repo root に ${ROOT_ACTIONS.join(' / ')} がある。 同上`,
    ).toEqual([]);
  });

  it('T-DBC-002 github-actions ecosystem を宣言しない', () => {
    for (const configPath of DEPENDABOT_CONFIGS) {
      const path = resolve(REPO_ROOT, configPath);
      if (!existsSync(path)) {
        // 設定 file が無いのが現在の形。各有効 path の不在を明示してから次を調べる。
        expect(existsSync(path), `${configPath} は存在しない`).toBe(false);
        continue;
      }
      const ecosystems = declaredEcosystems(readFileSync(path, 'utf8'));
      expect(
        ecosystems,
        `${configPath} が github-actions を宣言している。 workflow が無いため Dependabot は dependency_file_not_found で毎回失敗する`,
      ).not.toContain('github-actions');
    }
  });

  it('T-DBC-003 YAML の表記差を ecosystem 宣言として同じように読む', () => {
    const body = `
ecosystem: &actions github-actions
updates:
  - package-ecosystem: npm # plain scalar + inline comment
  - { "package-ecosystem": *actions, directory: "/" }
`;
    expect(
      declaredEcosystems(body),
      'plain scalar / inline comment / flow mapping / quote 付き key / alias を読む',
    ).toEqual(['npm', 'github-actions']);
  });
});
