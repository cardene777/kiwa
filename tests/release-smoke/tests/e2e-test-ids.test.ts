// e2e の test 名が突き合わせの手掛かりを持つことを固定する (Issue #2109)。
//
// ## なぜ検査を置くか
//
// Layer 3 は test 名に含まれる ID を手掛かりに仕様書と突き合わせる。
// ID が無いと `fullName` がそのまま識別子になり、仕様書の項目と結び付かない。
//
// **結び付かないことは失敗として現れない**。 突き合わせは「テストが無い」 と
// 報告し続け、実際にはテストがある状態になる。
//
// 実測 (#2109) では 48 テスト中 **1 件しか ID を持っていなかった**。
// 27 / 28 ファイルが 1 件も持たず、`T-DR-S1` のような近い形も
// 末尾が数字でないため一致しなかった。
//
// ## 何を見るか
//
// `examples/*/tests/e2e/*.spec.ts` の `test(` / `it(` の第 1 引数。
// これは `kiwa layers --layer e2e-generic` が `test_outputs` として宣言する場所と同じ。
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT, read } from './skill-md.js';

/**
 * 突き合わせが手掛かりにする ID の形。
 *
 * `packages/observability/src/collect.ts` の `TC_ID_REGEX` と同じでなければ、
 * ここで通しても突き合わせでは拾われない。 実物から導いて食い違いを防ぐ。
 */
const TC_ID_PATTERN = (() => {
  const source = read('packages/observability/src/collect.ts');
  const line = source.split('\n').find((l) => l.includes('const TC_ID_REGEX'));
  expect(line, '`TC_ID_REGEX` の宣言を collect.ts から引けない').toBeTruthy();
  const literal = /\/(.+)\/([a-z]*)\s*;/.exec(line!);
  expect(literal, '`TC_ID_REGEX` の正規表現リテラルを取り出せない').toBeTruthy();
  return new RegExp(literal![1]!, literal![2]);
})();

/** `test(` / `it(` の第 1 引数 (文字列リテラル)。 */
const TEST_NAME = /^\s*(?:test|it)\(\s*(['"`])([^'"`]+)\1/gm;

interface E2eTest {
  file: string;
  name: string;
}

function e2eTests(): E2eTest[] {
  const out: E2eTest[] = [];
  // `examples/*/tests/e2e/*.spec.ts` は `docs/layers.json` の `e2e-generic` が
  // `test_outputs` として宣言する形。 glob を手で書かず宣言から導く。
  const layers = JSON.parse(read('docs/layers.json')) as {
    layers: { id: string; test_outputs?: Record<string, string[]> }[];
  };
  const declared = layers.layers.find((l) => l.id === 'e2e-generic');
  expect(declared, '`e2e-generic` が docs/layers.json に無い').toBeTruthy();
  const patterns = Object.values(declared!.test_outputs ?? {}).flat();
  expect(patterns.length, '`e2e-generic` の test_outputs が空').toBeGreaterThan(0);

  for (const pattern of patterns) {
    // `{example}/tests/e2e/{module}.spec.ts` を glob へ写す。
    const glob = pattern.replace('{example}', '*').replace('{module}', '*');
    for (const file of globSync(`examples/${glob}`)) {
      const body = readFileSync(resolve(REPO_ROOT, file), 'utf8');
      for (const m of body.matchAll(TEST_NAME)) {
        out.push({ file, name: m[2] as string });
      }
    }
  }
  return out;
}

/** 依存を増やさないための最小 glob。 `*` は 1 階層のみに一致する。 */
function globSync(pattern: string): string[] {
  const parts = pattern.split('/');
  let current = [''];
  for (const part of parts) {
    const next: string[] = [];
    for (const base of current) {
      const dir = resolve(REPO_ROOT, base);
      if (!part.includes('*')) {
        next.push(base === '' ? part : `${base}/${part}`);
        continue;
      }
      const re = new RegExp(`^${part.split('*').map(escapeRe).join('[^/]*')}$`);
      let entries: string[];
      try {
        entries = readdirSync(dir);
      } catch {
        continue;
      }
      for (const entry of entries) {
        if (re.test(entry)) next.push(base === '' ? entry : `${base}/${entry}`);
      }
    }
    current = next;
  }
  return current.filter((p) => existsSync(resolve(REPO_ROOT, p)));
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

describe('e2e の test 名が突き合わせの ID を持つ (#2109)', () => {
  const tests = e2eTests();

  it('e2e の test を走査できている', () => {
    // 集合が空だと以下の検査が素通りする。 走査対象と、それを含む file の
    // 両方に下限を置く = file だけ数えても test を 1 件も読めていない形が残る。
    expect(tests.length, 'e2e の test を 1 件も見つけられない (検査が空振りしている)').toBeGreaterThan(0);
    expect(
      new Set(tests.map((t) => t.file)).size,
      'e2e の spec file を 1 件も見つけられない (検査が空振りしている)',
    ).toBeGreaterThan(0);
  });

  it('全 test 名が突き合わせの ID を含む', () => {
    const missing = tests
      .filter((t) => !TC_ID_PATTERN.test(t.name))
      .map((t) => `${t.file}: ${t.name}`);
    expect(
      missing,
      'ID を持たない test がある (突き合わせが「テストが無い」 と報告し続ける)',
    ).toEqual([]);
  });

  it('同じ file の中で ID が重複しない', () => {
    // 重複すると突き合わせがどちらを見たか決まらない。 file を跨いだ重複は
    // 履歴が `$PROJECT_ROOT/tests/reports/observe/history-{module}-{layer}.json` と
    // module 単位で分かれるため衝突しない。
    const byFile = new Map<string, string[]>();
    for (const t of tests) {
      const id = TC_ID_PATTERN.exec(t.name)?.[0];
      if (id === undefined) continue;
      byFile.set(t.file, [...(byFile.get(t.file) ?? []), id]);
    }
    const dups: string[] = [];
    for (const [file, ids] of byFile) {
      for (const id of new Set(ids)) {
        if (ids.filter((x) => x === id).length > 1) dups.push(`${file}: ${id}`);
      }
    }
    expect(dups, '同じ file の中で ID が重複している').toEqual([]);
  });

  it('ID の形を突き合わせ側の宣言から導いている', () => {
    // 手で書き写すと `collect.ts` が変わった時にここだけ古くなる。
    // 導けていることを、既知の一致例と不一致例で固定する。
    expect(TC_ID_PATTERN.test('T-E2E-001 login'), '正しい形を弾いている').toBe(true);
    expect(TC_ID_PATTERN.test('T-DR-S1 pending'), '末尾が数字でない形を通している').toBe(false);
    expect(TC_ID_PATTERN.test('renders the page'), 'ID の無い形を通している').toBe(false);
  });
});
