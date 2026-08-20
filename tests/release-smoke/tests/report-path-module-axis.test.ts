import { describe, expect, it } from 'vitest';

import { headingSectionIn, skillBody } from './skill-md.js';

/**
 * 同じ example の別 module を回した時に report が上書きされないか (#2075).
 *
 * #2076 で `--module` を足すまで module は example と同じ値だったため、 report 名が
 * `{example}` だけで一意になっていた。 module が run ごとに変わる軸になった以上、
 * report は module でも区別しないと 2 回目が 1 回目を上書きする。
 *
 * `nextjs-app-router-full` は `items` と `auth` の 2 module を持つため実際に起こりうる。
 *
 * 同じ形は `contract` layer の runner 軸で先に起きており、 `--out` に runner を足して
 * 解決済 (`dashboard-{example}-{module}-contract-{runner}.{lang}.md`)。
 */

const TEST = skillBody('kiwa-test');

/** kiwa-test が宣言する `tests/reports/**` の path 雛形。 */
function templates(): string[] {
  return [
    ...new Set(
      [...TEST.matchAll(/tests\/reports\/[A-Za-z0-9{}$_.\-/]+\.md/g)].map((m) => m[0]!),
    ),
  ];
}

const TEMPLATES = templates();

// 1 run が 1 module でも、同じ example / target を別 module で再実行すれば
// run 間で衝突する。 integrated を含む report 全件が module 軸を持つ必要がある。
const MODULE_SCOPED = TEMPLATES;

/** 雛形に値を差し込む。 lang は固定で、 module だけを振る。 */
function fill(template: string, example: string, module: string): string {
  return template
    .replace(/\{example\}/g, example)
    .replace(/\{module\}/g, module)
    .replace(/\{layer\}/g, 'nextjs-server-action')
    .replace(/\{target\}/g, 'web')
    .replace(/\{N\}/g, '1')
    .replace(/\$\{DOC_LANG\}|\{\$DOC_LANG\}|\{lang\}/g, 'ja');
}

describe('report が module で区別される', () => {
  it('雛形を 1 件以上拾えている (空振り防止)', () => {
    // 正規表現が書き方に追随できなくなると 0 件になり、 下の検査が何も見ない。
    expect(TEMPLATES.length).toBeGreaterThan(0);
    expect(MODULE_SCOPED.length).toBeGreaterThan(0);
  });

  it('integrated report も module 軸の検査対象に含む', () => {
    const integrated = MODULE_SCOPED.filter((t) => t.startsWith('tests/reports/integrated/'));
    expect(integrated.length, 'integrated report の雛形が無い').toBeGreaterThan(0);
    expect(integrated.every((t) => t.includes('{module}'))).toBe(true);
  });

  it('report の雛形がすべて {module} を持つ', () => {
    const missing = MODULE_SCOPED.filter((t) => !t.includes('{module}'));
    expect(missing, '{module} を持たない report がある').toEqual([]);
  });

  it('同じ example で module 違いの 2 run が別 file を書く', () => {
    // 「{module} と書いてあるか」 だけでは、 位置が違って衝突する形を見逃す。
    // 実際に 2 つの module を差し込んで、 生成される path 集合が交わらないことを見る。
    const a = MODULE_SCOPED.map((t) => fill(t, 'nextjs-app-router-full', 'items'));
    const b = MODULE_SCOPED.map((t) => fill(t, 'nextjs-app-router-full', 'auth'));
    const overlap = a.filter((p) => b.includes(p));
    expect(overlap, 'module を変えても同じ path を書く report がある').toEqual([]);
  });

  it('同じ module 同士では従来どおり同じ path になる (陰性対照)', () => {
    // 上の検査は「交わらない」 を主張する。 `fill` が毎回違う値を返すなら恒真になるため、
    // **同じ入力なら同じ path** であることを確かめる。
    const a = MODULE_SCOPED.map((t) => fill(t, 'defi-swap', 'defi-swap'));
    const b = MODULE_SCOPED.map((t) => fill(t, 'defi-swap', 'defi-swap'));
    expect(a).toEqual(b);
    // module == example の既定でも placeholder が両方 埋まることを確かめる。
    expect(a.every((p) => !p.includes('{')), '埋め残した placeholder がある').toBe(true);
  });

  it('module を持たない雛形が残っていれば衝突する (陽性対照)', () => {
    // 直す前の形。 `{module}` を外すと 2 run が同じ path を書くことを、 その場で示す。
    const legacy = MODULE_SCOPED.map((t) => t.replace(/-\{module\}/g, ''));
    const a = legacy.map((t) => fill(t, 'nextjs-app-router-full', 'items'));
    const b = legacy.map((t) => fill(t, 'nextjs-app-router-full', 'auth'));
    expect(a.filter((p) => b.includes(p)).length, '直す前の形でも衝突しない').toBeGreaterThan(0);
  });
});

describe('統合 report の link が実 path と揃っている', () => {
  it('Section 5 が review report を chain return から読む', () => {
    // 名前を組み立てると module 軸の変更に追随できない。 実 path を読む形を固定する。
    const line = TEST.split('\n').find((l) => l.startsWith('- spec-review / test-review:'));
    expect(line, 'Section 5 に review report の行が無い').toBeTruthy();
    expect(line!, 'chain return の実 path を読んでいない').toContain('chain return');
  });

  it('Section 5 が coverage report を writer の実 path から読む', () => {
    // module / runner / lang を caller が組み立てると writer の Step 0 と規約が二重になる。
    const line = TEST.split('\n').find((l) => l.startsWith('- coverage report (contract):'));
    expect(line, 'Section 5 に contract coverage report の行が無い').toBeTruthy();
    expect(line!, 'writer が返した実 path を読んでいない').toContain('返した実 path');
    expect(line!, 'coverage path の雛形を組み立て直している').not.toContain('coverage-report-{');
  });

  it('Section 2 の observe dashboard が Step 5a の宣言と一致する', () => {
    // 表と Step 5a で別の名前を書くと、 result-review が読む先が実物とずれる。
    //
    // Step 5a 側は 2 形で宣言する = layer 共通の起動形が `--out` で、 `contract` の
    // runner 別は分岐表の cell。 `--out` だけを集めると contract の 2 件が漏れ、
    // 「表に 3 件 / 起動形に 1 件」 で必ず食い違う (実測)。
    const norm = (p: string): string => p.replace(/\$\{DOC_LANG\}|\{lang\}/g, 'LANG');
    const table = [
      ...TEST.matchAll(/\| observe dashboard[^|]*\| (tests\/reports\/observe\/\S+\.md) \|/g),
    ].map((m) => norm(m[1]!));

    const step5a = headingSectionIn(TEST, /^### Step 5a: kiwa-observe 自動呼出/m);
    const declared = [...step5a.matchAll(/tests\/reports\/observe\/\S+?\.md/g)].map((m) =>
      norm(m[0]!.replace(/`$/, '')),
    );

    expect(table.length, 'Section 2 に observe dashboard の行が無い').toBeGreaterThan(0);
    expect(declared.length, 'Step 5a に observe の宣言が無い').toBeGreaterThan(0);
    expect([...new Set(declared)].sort(), '表と Step 5a の名前が食い違う').toEqual(
      [...new Set(table)].sort(),
    );
  });
});
