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
// 実測 (#2109) では 50 テスト中 **1 件しか ID を持っていなかった**。
// 27 / 28 ファイルが 1 件も持たず、`T-DR-S1` のような近い形も
// 末尾が数字でないため一致しなかった。
//
// ## 何を見るか
//
// `examples/*/tests/e2e/*.spec.ts` の `test(` / `it(` と repo 固有 wrapper の第 1 引数。
// これは `kiwa layers --layer e2e-generic` が `test_outputs` として宣言する場所と同じ。
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT, read } from './skill-md.js';

/**
 * 突き合わせが手掛かりにする ID の形。
 *
 * `packages/observability/src/collect.ts` の `TC_ID_REGEX` と同じでなければ、
 * ここで通しても突き合わせでは拾われない。 実物から導いて食い違いを防ぐ。
 */
function tcIdPattern(source: string): RegExp {
  const parsed = ts.createSourceFile('collect.ts', source, ts.ScriptTarget.Latest, true);
  const literals: ts.RegularExpressionLiteral[] = [];

  function visit(node: ts.Node): void {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'TC_ID_REGEX' &&
      node.initializer &&
      ts.isRegularExpressionLiteral(node.initializer)
    ) {
      literals.push(node.initializer);
    }
    ts.forEachChild(node, visit);
  }
  visit(parsed);

  expect(literals, '`TC_ID_REGEX` の正規表現リテラルを一意に取り出せない').toHaveLength(1);
  const literal = literals[0]!.getText(parsed);
  const closingSlash = literal.lastIndexOf('/');
  return new RegExp(literal.slice(1, closingSlash), literal.slice(closingSlash + 1));
}

const TC_ID_PATTERN = tcIdPattern(read('packages/observability/src/collect.ts'));

interface E2eTest {
  file: string;
  name: string;
}

interface E2eScan {
  files: string[];
  tests: E2eTest[];
}

interface TestWrapper {
  name: string;
  nameParameter: string;
  body: ts.ConciseBody;
}

function calledIdentifier(node: ts.CallExpression): string | undefined {
  return ts.isIdentifier(node.expression) ? node.expression.text : undefined;
}

/** `test` / `it` へ test 名を渡す local wrapper も宣言名に依存せず辿る。 */
function e2eTestNames(file: string, source: string): string[] {
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const wrappers: TestWrapper[] = [];

  function collectWrappers(node: ts.Node): void {
    if (
      ts.isFunctionDeclaration(node) &&
      node.name &&
      node.body &&
      node.parameters[0] &&
      ts.isIdentifier(node.parameters[0].name)
    ) {
      wrappers.push({
        name: node.name.text,
        nameParameter: node.parameters[0].name.text,
        body: node.body,
      });
    } else if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer)) &&
      node.initializer.parameters[0] &&
      ts.isIdentifier(node.initializer.parameters[0].name)
    ) {
      wrappers.push({
        name: node.name.text,
        nameParameter: node.initializer.parameters[0].name.text,
        body: node.initializer.body,
      });
    }
    ts.forEachChild(node, collectWrappers);
  }
  collectWrappers(parsed);

  const registrars = new Set(['test', 'it']);
  let changed = true;
  while (changed) {
    changed = false;
    for (const wrapper of wrappers) {
      if (registrars.has(wrapper.name)) continue;
      let forwardsName = false;
      function findForward(node: ts.Node): void {
        if (
          ts.isCallExpression(node) &&
          registrars.has(calledIdentifier(node) ?? '') &&
          node.arguments[0] &&
          ts.isIdentifier(node.arguments[0]) &&
          node.arguments[0].text === wrapper.nameParameter
        ) {
          forwardsName = true;
          return;
        }
        ts.forEachChild(node, findForward);
      }
      findForward(wrapper.body);
      if (forwardsName) {
        registrars.add(wrapper.name);
        changed = true;
      }
    }
  }

  const names: string[] = [];
  function collectNames(node: ts.Node): void {
    if (ts.isCallExpression(node) && registrars.has(calledIdentifier(node) ?? '')) {
      const name = node.arguments[0];
      if (name && (ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name))) {
        names.push(name.text);
      }
    }
    ts.forEachChild(node, collectNames);
  }
  collectNames(parsed);
  return names;
}

function e2eTests(): E2eScan {
  const out: E2eTest[] = [];
  const files = new Set<string>();
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
      if (files.has(file)) continue;
      files.add(file);
      const body = readFileSync(resolve(REPO_ROOT, file), 'utf8');
      for (const name of e2eTestNames(file, body)) {
        out.push({ file, name });
      }
    }
  }
  return { files: [...files].sort(), tests: out };
}

/** 宣言 glob と独立に、repo の配置規約から実在する e2e spec を列挙する。 */
function actualE2eSpecFiles(): string[] {
  const examplesDir = resolve(REPO_ROOT, 'examples');
  return readdirSync(examplesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((example) => {
      const e2eDir = resolve(examplesDir, example.name, 'tests/e2e');
      try {
        return readdirSync(e2eDir, { withFileTypes: true })
          .filter((entry) => entry.isFile() && entry.name.endsWith('.spec.ts'))
          .map((entry) => `examples/${example.name}/tests/e2e/${entry.name}`);
      } catch {
        return [];
      }
    })
    .sort();
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
  const scan = e2eTests();
  const tests = scan.tests;

  it('e2e の test を走査できている', () => {
    // 宣言の取りこぼしと、動的な test 名を静的検査が黙って除外する形を防ぐ。
    expect(scan.files, '宣言 glob が実在する e2e spec の集合と一致しない').toEqual(
      actualE2eSpecFiles(),
    );
    expect(tests.length, 'e2e の test を 1 件も見つけられない (検査が空振りしている)').toBeGreaterThan(0);
    expect(
      [...new Set(tests.map((t) => t.file))].sort(),
      'test 名を 1 件も取得できていない e2e spec がある',
    ).toEqual(scan.files);
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

  it('コメント内の偽宣言ではなく実際の正規表現リテラルを読む', () => {
    const pattern = tcIdPattern(`
      // const TC_ID_REGEX = /wrong/;
      const TC_ID_REGEX = /T\\/E2E/gi;
    `);
    expect(pattern.source).toBe('T\\/E2E');
    expect(pattern.flags).toBe('gi');
  });

  it('test 名を転送する local wrapper を宣言名に依存せず走査する', () => {
    const names = e2eTestNames(
      'future-wrapper.spec.ts',
      `
        function futureWrapper(name: string, run: () => void): void {
          test(name, run);
        }
        test('T-E2E-001 direct', () => {});
        futureWrapper('T-E2E-002 wrapped', () => {});
      `,
    );
    expect(names).toEqual(['T-E2E-001 direct', 'T-E2E-002 wrapped']);
  });
});
