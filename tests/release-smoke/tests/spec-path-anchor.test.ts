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
// `skill-review-inputs.test.ts` は同じ起点の差を **1 組合せ** (`ui` × `counter` × `ja`) で
// 固定しており、陰性対照も持つ。 覆っているのは「CLI の解決がそう振る舞うか」 まで。
//
// 本検査が見るのは **repo 全体の配置と言語** になる。 3 点が届いていなかった。
//
//   1. どの組合せの仕様書も、読み手が開けない場所に置かれていないか
//   2. 同じ組合せの仕様書が 2 箇所に無いか
//   3. 読み手の既定言語で実在する仕様書を開けるか
//
// 1 点目は言語でも分かれる。 既存検査は `en` で解決するため、`.ja` の仕様書が直下にあっても
// 素通りする (`ui` × `counter` が実際にその状態にある)。 本検査は suffix 無しと、
// 全 ISO 639-1 suffix の形を見る。
//
// ## 3 つの歯止め
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
 * 読み手が既定で使う言語。
 *
 * `lang-suffix-agreement.test.ts` が全 skill の `--lang` 既定を
 * 「省略時は起動元が渡した値、 単体起動なら `ja`」 で固定している。
 * 単体で起動した読み手はこの言語の仕様書を探す。
 */
const READER_DEFAULT_LANG = 'ja';

interface Resolved {
  key: string;
  /** `--project-root` を前置して開けた仕様書 (規約どおりの起点) */
  projectAnchored: string | null;
  /** 実行ディレクトリ起点で開けた仕様書 (リポジトリ直下) */
  repoAnchored: string | null;
  /** 読み手の既定言語で解決した path が、どちらかの起点に実在するか */
  defaultLangFound: boolean;
}

/**
 * layer ごとの仕様書 path。 `docs/layers.json` の宣言から導く。
 *
 * suffix を持たない layer (`contract` / `e2e` / `integration` / `unit`) の仕様書は
 * stem が `test-spec-{module}` になるため、同じ dir にある別 layer の仕様書が
 * **言語 variant に見える**。 `ui` の suffix は 2 文字なので、
 * `test-spec-counter.ui.md` が `test-spec-counter.md` の `ui` 語版として通っていた (実測)。
 * 同じ dir を共有するのは `integration` と `ui` の組で、実際に起こりうる。
 *
 * ただし suffix だけを見て除外すると広すぎる。 CLI の `--lang` は 2 文字の形しか見ないため
 * `--lang ui` を受け付け (実測)、`test-spec-items.api.ui.md` を生成できる。 この path は
 * どの layer の宣言とも一致しないので、除外すると正当な仕様書を取りこぼす。
 *
 * 同じ module を別 layer の宣言へ代入した path と **完全一致** する候補だけを除外する。
 */
const LAYER_SPEC_PATHS = new Map(
  (
    JSON.parse(read('docs/layers.json')) as {
      layers: { id: string; spec_path?: string | null }[];
    }
  ).layers.flatMap((layer) =>
    typeof layer.spec_path === 'string' ? [[layer.id, layer.spec_path] as const] : [],
  ),
);

function isOtherLayerSpec(layerId: string, spec: string, file: string): boolean {
  const template = LAYER_SPEC_PATHS.get(layerId);
  if (template === undefined) return false;
  const [prefix, suffix, extra] = template.split('{module}');
  if (prefix === undefined || suffix === undefined || extra !== undefined) return false;
  if (!spec.startsWith(prefix) || !spec.endsWith(suffix)) return false;
  const module = spec.slice(prefix.length, spec.length - suffix.length);
  const candidate = join(dirname(spec), file);
  // `otherId !== layerId` は防御で、この経路には到達しない。 自分自身の宣言へ同じ module を
  // 代入すると `spec` そのものになり、`candidate === spec` は `file === basename(spec)` を
  // 意味する。 その形は `isSpecVariant` の先頭で `true` を返して抜けるため、ここまで来ない。
  // 変異試験でこの条件を外しても 1 件も落ちない (到達する入力を作れないため)。
  return [...LAYER_SPEC_PATHS].some(
    ([otherId, otherTemplate]) =>
      otherId !== layerId && otherTemplate.replace('{module}', module) === candidate,
  );
}

/**
 * English (suffix 無し) または ISO 639-1 suffix 付きの同じ仕様書か。
 *
 * 別 layer の宣言 path と一致する形は言語とみなさない。
 */
function isSpecVariant(layerId: string, spec: string, file: string): boolean {
  const english = basename(spec);
  if (file === english) return true;
  if (!english.endsWith('.md')) return false;
  const stem = english.slice(0, -'.md'.length);
  if (!file.startsWith(`${stem}.`) || !file.endsWith('.md')) return false;
  const lang = file.slice(stem.length + 1, -'.md'.length);
  if (isOtherLayerSpec(layerId, spec, file)) return false;
  return /^[a-z]{2}$/.test(lang);
}

function selectSpecVariant(layerId: string, spec: string, files: string[]): string | null {
  return files.sort().find((file) => isSpecVariant(layerId, spec, file)) ?? null;
}

/** anchor 配下にある、CLI が返した仕様書の任意言語 variant を探す。 */
function findSpecAt(anchor: string, layerId: string, spec: string): string | null {
  const relativeDir = dirname(spec);
  const absoluteDir = resolve(REPO_ROOT, anchor, relativeDir);
  if (!existsSync(absoluteDir)) return null;
  const file = selectSpecVariant(layerId, spec, readdirSync(absoluteDir));
  return file === null ? null : join(relativeDir, file);
}

/** CLI に解かせた `spec_path`。 skill 側で組み立てない (module 名に separator が入る形を CLI が弾く)。 */
function resolveSpecPath(entry: RosterEntry, projectRoot: string, lang?: string): string | null {
  const bin = resolve(REPO_ROOT, 'packages/cli/dist/bin.js');
  const args = [
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
  ];
  if (lang !== undefined) args.push('--lang', lang);
  const out = execFileSync('node', args, { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' });
  const layer = (
    JSON.parse(out) as { layers: { id: string; spec_path?: string | null }[] }
  ).layers.find((l) => l.id === entry.layer);
  const spec = layer?.spec_path;
  return typeof spec === 'string' && spec.length > 0 ? spec : null;
}

function resolveSpec(entry: RosterEntry): Resolved {
  const key = `${entry.layer} × ${entry.module}`;
  const projectRoot = `examples/${entry.example}`;
  const spec = resolveSpecPath(entry, projectRoot);
  if (typeof spec !== 'string' || spec.length === 0) {
    return { key, projectAnchored: null, repoAnchored: null, defaultLangFound: false };
  }
  // 読み手が既定で解決する path。 CLI に同じ言語で解かせる = skill 側で組み立てない。
  const defaultLangSpec = resolveSpecPath(entry, projectRoot, READER_DEFAULT_LANG);
  const defaultLangFound =
    defaultLangSpec !== null &&
    (existsSync(resolve(REPO_ROOT, projectRoot, defaultLangSpec)) ||
      existsSync(resolve(REPO_ROOT, defaultLangSpec)));
  // CLI は `--lang` 未指定だと suffix 無しを返す。 `--lang` は任意の ISO 639-1 を受けるため、
  // `.ja.md` だけでなく `.zh.md` 等も含め、同じ stem の全言語 variant を見る。
  const projectAnchored = findSpecAt(projectRoot, entry.layer, spec);
  const repoAnchored = findSpecAt('.', entry.layer, spec);
  return {
    key,
    projectAnchored: projectAnchored === null ? null : join(projectRoot, projectAnchored),
    repoAnchored,
    defaultLangFound,
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
        'test-spec-items.api.ui.md',
      ].filter((file) => isSpecVariant('api', spec, file)),
    ).toEqual([
      'test-spec-items.api.md',
      'test-spec-items.api.ja.md',
      'test-spec-items.api.zh.md',
      'test-spec-items.api.ui.md',
    ]);
  });

  it('別 layer の仕様書を言語 variant として数えない', () => {
    // suffix を持たない layer の stem は `test-spec-{module}` で、同じ dir にある
    // `ui` layer の仕様書が 2 文字 suffix ゆえに言語に見える。 `integration` と `ui` は
    // 実際に `tests/spec/integration/` を共有するので、起こりうる形になる。
    const integration = 'tests/spec/integration/test-spec-counter.md';
    expect(
      isSpecVariant('integration', integration, 'test-spec-counter.ui.md'),
      'ui layer の仕様書を integration の言語 variant として数えている',
    ).toBe(false);
    expect(
      isSpecVariant('integration', integration, 'test-spec-counter.ja.md'),
      '本当の言語 variant を取りこぼしている',
    ).toBe(true);
  });

  it('別 layer の仕様書 path を宣言の全形から導けている', () => {
    // 一覧が空だと上の除外が効かず、恒真になる。 全宣言を取れていることを固定する。
    const declarations = (
      JSON.parse(read('docs/layers.json')) as {
        layers: { id: string; spec_path?: string | null }[];
      }
    ).layers.filter((layer) => typeof layer.spec_path === 'string');
    expect(LAYER_SPEC_PATHS.size, 'layer の spec_path を 1 件も導けていない').toBeGreaterThan(0);
    expect(LAYER_SPEC_PATHS.size, '一部の layer の spec_path を取りこぼしている').toBe(
      declarations.length,
    );
    expect(
      [...LAYER_SPEC_PATHS.values()].filter(
        (path) => path.split('{module}').length !== 2,
      ),
      'module を一意に復元できない spec_path 宣言がある',
    ).toEqual([]);
  });

  it('同じ stem の variant が複数あっても選択結果が並び順に依存しない', () => {
    const spec = 'tests/spec/integration/test-spec-items.api.md';
    const variants = ['test-spec-items.api.zh.md', 'test-spec-items.api.ja.md'];
    expect(selectSpecVariant('api', spec, [...variants])).toBe('test-spec-items.api.ja.md');
    expect(selectSpecVariant('api', spec, [...variants].reverse())).toBe(
      'test-spec-items.api.ja.md',
    );
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

  it('読み手の既定言語で解決した仕様書が実在する', () => {
    // #2103 の本体。 仕様書 13 件が日本語で書かれながら英語の名前で置かれており、
    // 読み手の既定 (`--lang ja`) では **1 件も開けなかった**。
    //
    // 「まだ書いていない」 のか「名前が違う」 のかは読み手から区別できない
    // (`/kiwa-observe` はどちらも「仕様書が無い」 として中断する)。
    const missing = resolved
      .filter((r) => r.projectAnchored !== null || r.repoAnchored !== null)
      .filter((r) => !r.defaultLangFound)
      .map((r) => r.key);
    expect(
      missing,
      `仕様書はあるが、読み手の既定 (--lang ${READER_DEFAULT_LANG}) では開けない`,
    ).toEqual([]);
  });

  it('既定言語で開ける仕様書が 1 件以上ある', () => {
    // 上の検査は「仕様書がある組合せ」 だけを見るため、1 件も無ければ素通りする。
    expect(
      resolved.filter((r) => r.defaultLangFound).length,
      '既定言語で開ける仕様書が 1 件も無い (検査が空振りしている)',
    ).toBeGreaterThan(0);
  });

  it('同じ組合せの仕様書が 2 箇所に無い', () => {
    // #2103 で 5 件を解消した。 2 箇所にあると、読み手が起点を取り違えたときに
    // **別の仕様書を読んで突き合わせる** = 「仕様に無いテストがある」 と
    // 「テストが無い仕様がある」 が同時に誤検出になる。
    const duplicated = resolved
      .filter((r) => r.projectAnchored !== null && r.repoAnchored !== null)
      .map((r) => `${r.key}: ${r.projectAnchored} と ${r.repoAnchored}`);
    expect(duplicated, '同じ組合せの仕様書が 2 箇所にある').toEqual([]);
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
