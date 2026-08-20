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
// 素通りする (`ui` × `counter` が実際にその状態にある)。 本検査は suffix 無しと、
// 全 ISO 639-1 suffix の形を見る。
//
// ## 2 つの歯止め
//
// どちらも現状を基準にした ratchet で、**悪化だけを落とす**。
// 「どちらの場所が正しいか」 は layer ごとに違い、その決着は本検査の役目ではない。
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { ROSTER, type RosterEntry } from './layer-roster.js';
import { REPO_ROOT, read } from './skill-md.js';

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

/**
 * layer の suffix。 `docs/layers.json` の宣言から導く。
 *
 * suffix を持たない layer (`contract` / `e2e` / `integration` / `unit`) の仕様書は
 * stem が `test-spec-{module}` になるため、同じ dir にある別 layer の仕様書が
 * **言語 variant に見える**。 `ui` の suffix は 2 文字なので、
 * `test-spec-counter.ui.md` が `test-spec-counter.md` の `ui` 語版として通っていた (実測)。
 * 同じ dir を共有するのは `integration` と `ui` の組で、実際に起こりうる。
 *
 * 手で列挙すると layer が増えた時に検査だけ古くなるので、宣言から取る。
 */
const LAYER_SUFFIXES = new Set(
  (JSON.parse(read('docs/layers.json')) as { layers: { spec_path?: string | null }[] }).layers
    .map((l) => /test-spec-\{module\}\.([a-z0-9-]+)\.md$/.exec(l.spec_path ?? ''))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => m[1]!),
);

/**
 * English (suffix 無し) または ISO 639-1 suffix 付きの同じ仕様書か。
 *
 * layer の suffix と一致する形は言語とみなさない = 別 layer の仕様書を
 * 自分の言語 variant として数えない。
 */
function isSpecVariant(spec: string, file: string): boolean {
  const english = basename(spec);
  if (file === english) return true;
  if (!english.endsWith('.md')) return false;
  const stem = english.slice(0, -'.md'.length);
  if (!file.startsWith(`${stem}.`) || !file.endsWith('.md')) return false;
  const lang = file.slice(stem.length + 1, -'.md'.length);
  if (LAYER_SUFFIXES.has(lang)) return false;
  return /^[a-z]{2}$/.test(lang);
}

/** anchor 配下にある、CLI が返した仕様書の任意言語 variant を探す。 */
function findSpecAt(anchor: string, spec: string): string | null {
  const relativeDir = dirname(spec);
  const absoluteDir = resolve(REPO_ROOT, anchor, relativeDir);
  if (!existsSync(absoluteDir)) return null;
  const file = readdirSync(absoluteDir)
    .sort()
    .find((candidate) => isSpecVariant(spec, candidate));
  return file === undefined ? null : join(relativeDir, file);
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
  // CLI は `--lang` 未指定だと suffix 無しを返す。 `--lang` は任意の ISO 639-1 を受けるため、
  // `.ja.md` だけでなく `.zh.md` 等も含め、同じ stem の全言語 variant を見る。
  const projectAnchored = findSpecAt(projectRoot, spec);
  const repoAnchored = findSpecAt('.', spec);
  return {
    key,
    projectAnchored: projectAnchored === null ? null : join(projectRoot, projectAnchored),
    repoAnchored,
  };
}

describe('spec_path の起点 (#2101)', () => {
  const resolved = ROSTER.map(resolveSpec);
  const byKey = new Map(ROSTER.map((e, i) => [e, resolved[i]!] as const));

  it('suffix 無しと任意の ISO 639-1 suffix を同じ仕様書として扱う', () => {
    // ISO 639-1 はちょうど 2 文字。 3 文字 (`jpn` = ISO 639-2) と地域付き (`ja-JP`) は
    // CLI が受けないため言語とみなさない。 この 2 件が、桁を緩めた実装と現行を分ける。
    const spec = 'tests/spec/integration/test-spec-items.api.md';
    expect(
      [
        'test-spec-items.api.md',
        'test-spec-items.api.ja.md',
        'test-spec-items.api.zh.md',
        'test-spec-items.api.ja-JP.md',
        'test-spec-items.api.jpn.md',
        'test-spec-other.api.ja.md',
      ].filter((file) => isSpecVariant(spec, file)),
    ).toEqual([
      'test-spec-items.api.md',
      'test-spec-items.api.ja.md',
      'test-spec-items.api.zh.md',
    ]);
  });

  it('別 layer の仕様書を言語 variant として数えない', () => {
    // suffix を持たない layer の stem は `test-spec-{module}` で、同じ dir にある
    // `ui` layer の仕様書が 2 文字 suffix ゆえに言語に見える。 `integration` と `ui` は
    // 実際に `tests/spec/integration/` を共有するので、起こりうる形になる。
    const integration = 'tests/spec/integration/test-spec-counter.md';
    expect(
      isSpecVariant(integration, 'test-spec-counter.ui.md'),
      'ui layer の仕様書を integration の言語 variant として数えている',
    ).toBe(false);
    expect(
      isSpecVariant(integration, 'test-spec-counter.ja.md'),
      '本当の言語 variant を取りこぼしている',
    ).toBe(true);
  });

  it('layer の suffix 一覧を宣言から導けている', () => {
    // 一覧が空だと上の除外が効かず、恒真になる。 宣言から取れていることを固定する。
    expect(LAYER_SUFFIXES.size, 'layer の suffix を 1 件も導けていない').toBeGreaterThan(0);
    expect([...LAYER_SUFFIXES], 'ui の suffix が一覧に無い').toContain('ui');
  });

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
