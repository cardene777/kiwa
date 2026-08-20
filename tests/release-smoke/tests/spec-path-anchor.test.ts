// 仕様書を「読み手が開かない場所」 へ置く経路を塞ぐ (Issue #2101)。
//
// ## 何が起きたか
//
// `kiwa layers` が返す 2 つのパスは起点が違う。
//
//   spec_path            → --project-root 起点
//   test_paths.files     → 実行ディレクトリ起点
//
// `.claude/skills/kiwa-observe/SKILL.md` § 2 つの path は起点が違う が明記しており、
// 「同列に『返った値を開く』 と読むと仕様書だけ外す」 と警告している。
//
// それでも #2092 はリポジトリ直下だけを数えて「22 組合せ中 2 件しか仕様書が無い」 と
// 結論し、#2096 / #2097 / #2098 の 3 本がその前提のまま仕様書を直下へ書いた。
// 実測すると各 example の下に 13 件あった。
//
// ## なぜ検査で止めるか
//
// この誤りは **失敗として現れない**。 仕様書は書けるし、テストも通る。
// 読み手が別の場所を見るだけで、突き合わせは「仕様が無い」 と報告する。
// 書いた側からは成功に見え、読んだ側からは未着手に見える。
//
// 警告は SKILL.md に 1 年前から書いてあった。 散文では止まらないので機械で止める。
//
// ## 既にある検査との違い
//
// `skill-review-inputs.test.ts` は同じ起点の差を **1 組合せ** (`ui` × `counter` × `en`) で
// 固定しており、陰性対照も持つ。 覆っているのは「CLI の解決がそう振る舞うか」 まで。
//
// 本検査が見るのは **repo 全体の配置** になる。 2 点が届いていなかった。
//
//   1. どの組合せの仕様書も、読み手が開けない場所に置かれていないか
//   2. 同じ組合せの仕様書が 2 箇所に無いか
//
// 1 点目は言語でも分かれる。 既存検査は `en` で解決するため、`.ja` の仕様書が直下にあっても
// 素通りする (`ui` × `counter` が実際にその状態にある)。 本検査は両方の言語の形を見る。
//
// ## 2 つの歯止め
//
// どちらも現状を基準にした ratchet で、**悪化だけを落とす**。
// 「どちらの場所が正しいか」 は layer ごとに違い、その決着は本検査の役目ではない。
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { ROSTER, type RosterEntry } from './layer-roster.js';
import { REPO_ROOT } from './skill-md.js';

/**
 * 仕様書がリポジトリ直下にあってよい layer。
 *
 * `contract` は Foundry / Hardhat が、`e2e` は Playwright がリポジトリ直下で走るため、
 * 仕様書も直下に置く。 example 配下に同じものは無い。
 *
 * ここに載っていない layer の仕様書が直下にしか無ければ、それは #2101 の再発になる。
 */
const REPO_ANCHORED_LAYERS = new Set(['contract', 'e2e']);

/**
 * 両方の場所に仕様書がある組合せ。
 *
 * 読み手が起点を取り違えると **別の仕様書を読んで突き合わせる**。
 * 「仕様に無いテストがある」 と「テストが無い仕様がある」 が同時に誤検出になる。
 *
 * 解消は #2101 の段階 2 (どちらを残すかの判断が要る)。 それまでの間、
 * **増えることだけを止める**。 減る分にはこの検査は落ちない。
 */
const KNOWN_DUPLICATES = new Set([
  'api × items',
  'ui × counter',
  'unit × token',
  'a11y × counter',
  'integration × inventory',
]);

interface Resolved {
  key: string;
  /** `--project-root` を前置して開けた仕様書 (規約どおりの起点) */
  projectAnchored: string | null;
  /** 実行ディレクトリ起点で開けた仕様書 (リポジトリ直下) */
  repoAnchored: string | null;
}

function resolveSpec(entry: RosterEntry): Resolved {
  const key = `${entry.layer} × ${entry.module}`;
  const projectRoot = `examples/${entry.example}`;
  const bin = resolve(REPO_ROOT, 'packages/cli/dist/bin.js');
  const out = execFileSync(
    'node',
    [
      bin,
      'layers',
      '--json',
      '--layer',
      entry.layer,
      '--module',
      entry.module,
      '--producer',
      entry.producer,
      '--project-root',
      projectRoot,
    ],
    { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' },
  );
  const layer = (
    JSON.parse(out) as { layers: { id: string; spec_path?: string | null }[] }
  ).layers.find((l) => l.id === entry.layer);
  const spec = layer?.spec_path;
  if (typeof spec !== 'string' || spec.length === 0) {
    return { key, projectAnchored: null, repoAnchored: null };
  }
  // CLI は `--lang` 未指定だと suffix 無しを返す。 実物はどちらの形でも置かれうるので
  // 両方見る (`withLangSuffix` が付ける `.ja` は末尾固定)。
  const candidates = [spec, spec.replace(/\.md$/, '.ja.md')];
  const projectAnchored =
    candidates.find((c) => existsSync(resolve(REPO_ROOT, projectRoot, c))) ?? null;
  const repoAnchored = candidates.find((c) => existsSync(resolve(REPO_ROOT, c))) ?? null;
  return {
    key,
    projectAnchored: projectAnchored === null ? null : join(projectRoot, projectAnchored),
    repoAnchored,
  };
}

describe('spec_path の起点 (#2101)', () => {
  const resolved = ROSTER.map(resolveSpec);
  const byKey = new Map(ROSTER.map((e, i) => [e, resolved[i]!] as const));

  it('roster を走査でき、両方の起点で仕様書が見つかっている', () => {
    // 集合が空だと以下 2 件が素通りする。 起点ごとに下限を置く = 合計だけを見ると
    // 片方の解決が 0 件でも対応する検査が恒真になる。
    expect(ROSTER.length, 'roster が空 (検査が空振りしている)').toBeGreaterThan(0);
    expect(
      resolved.filter((r) => r.projectAnchored !== null).length,
      '--project-root 起点で仕様書を 1 件も開けない (解決が壊れている可能性)',
    ).toBeGreaterThan(0);
    expect(
      resolved.filter((r) => r.repoAnchored !== null).length,
      'リポジトリ直下で仕様書を 1 件も開けない (解決が壊れている可能性)',
    ).toBeGreaterThan(0);
  });

  it('example 配下で走る layer の仕様書が、リポジトリ直下にだけ置かれていない', () => {
    // #2101 の本体。 直下にしか無い仕様書は、読み手が --project-root 起点で開くため
    // **誰にも読まれない**。 書いた側は成功に見え、突き合わせは未着手に見える。
    const stranded: string[] = [];
    for (const entry of ROSTER) {
      if (REPO_ANCHORED_LAYERS.has(entry.layer)) continue;
      const r = byKey.get(entry)!;
      if (r.repoAnchored !== null && r.projectAnchored === null) {
        stranded.push(`${r.key}: ${r.repoAnchored} (examples/${entry.example} 側に無い)`);
      }
    }
    expect(
      stranded,
      '仕様書がリポジトリ直下にしか無い = --project-root 起点の読み手が開けない',
    ).toEqual([]);
  });

  it('両方の場所にある組合せが、既知の一覧を超えない', () => {
    // 増えることだけを止める ratchet。 解消して減る分には落ちない。
    const unexpected = resolved
      .filter((r) => r.projectAnchored !== null && r.repoAnchored !== null)
      .map((r) => r.key)
      .filter((key) => !KNOWN_DUPLICATES.has(key));
    expect(
      unexpected,
      '同じ組合せの仕様書が 2 箇所にある (読み手が起点を取り違えると別の仕様書を読む)',
    ).toEqual([]);
  });

  it('リポジトリ直下に置いてよい layer が、実際に直下へ置かれている', () => {
    // 除外一覧そのものの検査。 実物と合っていない除外は、
    // 上の検査を黙って無効にする穴になる (載せるだけで見逃せてしまう)。
    for (const entry of ROSTER) {
      if (!REPO_ANCHORED_LAYERS.has(entry.layer)) continue;
      const r = byKey.get(entry)!;
      expect(
        r.repoAnchored,
        `${r.key}: 直下に置く layer として除外しているが、直下に仕様書が無い`,
      ).not.toBeNull();
      expect(
        r.projectAnchored,
        `${r.key}: 直下に置く layer なのに examples/${entry.example} 側にもある`,
      ).toBeNull();
    }
  });
});
