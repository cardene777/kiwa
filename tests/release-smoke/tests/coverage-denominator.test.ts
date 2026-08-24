/**
 * coverage の分母に、測る意味の無い file が入っていないことを固定する。
 *
 * coverage gate は package 単位の集計値しか見ない。実測では、型だけの file と
 * 型検査専用で実行されない file がどちらも `covered === 0` の entry になっていた。
 * V8 は型だけの file の compiled output (`export {};`) も 1 行 / 0% と数えるため、
 * coverage-summary.json だけから両者を別の結果として識別することはできない。
 *
 * T-COV-001 は結果側で 0 covered entry の混入を検出する。一方、結果から消えた file が
 * 本当に除外してよいかは判断できないため、T-COV-002 が test:cov の source 除外を既存の
 * TypeScript classifier で検査する。comment は compiler が構文として扱うので、文字列や
 * 正規表現中の comment marker を誤って落とす text 処理には依存しない。
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT } from './skill-md.js';

interface Entry {
  package: string;
  file: string;
  lines: { total: number; covered: number; pct: number };
}

interface PackageInfo {
  name: string;
  dir: string;
  testCov: string;
}

interface SourceShape {
  kind: 'implementation' | 'barrel' | 'type-only';
  runsWithoutExporting: boolean;
}

interface SourceClassifier {
  classify(source: string, fileName?: string): SourceShape;
}

const PACKAGES_DIR = resolve(REPO_ROOT, 'packages');

/** package.json が test:cov を持つ package を coverage の期待集合にする。 */
function coveragePackages(): PackageInfo[] {
  return readdirSync(PACKAGES_DIR)
    .sort()
    .flatMap((name) => {
      const dir = join(PACKAGES_DIR, name);
      const manifest = join(dir, 'package.json');
      if (!existsSync(manifest)) return [];
      const parsed = JSON.parse(readFileSync(manifest, 'utf8')) as {
        scripts?: Record<string, string>;
      };
      const testCov = parsed.scripts?.['test:cov'];
      return testCov ? [{ name, dir, testCov }] : [];
    });
}

const COVERAGE_PACKAGES = coveragePackages();

/** 全 coverage package の報告を file entry へ展開する。 */
function entries(): Entry[] {
  return COVERAGE_PACKAGES.flatMap(({ name, dir }) => {
    const summary = join(dir, 'coverage', 'coverage-summary.json');
    if (!existsSync(summary)) return [];
    const parsed = JSON.parse(readFileSync(summary, 'utf8')) as Record<
      string,
      { lines: { total: number; covered: number; pct: number } }
    >;
    return Object.entries(parsed).flatMap(([key, value]) => {
      if (key === 'total') return [];
      const rel = key.split('/.vitest-dist/src/').at(-1) ?? key;
      return [{ package: name, file: rel, lines: value.lines }];
    });
  });
}

const ENTRIES = entries();

/** test:cov が明示的に分母から外す source file。 */
function sourceExclusions(): Array<{ package: string; file: string; source: string | null }> {
  const pattern = /--coverage\.exclude(?:=|\s+)(['"]?)([^'"\s]+)\1/g;
  return COVERAGE_PACKAGES.flatMap(({ name, dir, testCov }) =>
    [...testCov.matchAll(pattern)].flatMap((match) => {
      const excluded = match[2] ?? '';
      if (!excluded.startsWith('.vitest-dist/src/')) return [];
      const file = excluded.replace(/^\.vitest-dist\/src\//, '').replace(/\.js$/, '');
      if (!excluded.endsWith('.js')) return [{ package: name, file, source: null }];
      const source = ['.ts', '.tsx']
        .map((extension) => join(dir, 'src', `${file}${extension}`))
        .find(existsSync);
      return [{ package: name, file, source: source ?? null }];
    }),
  );
}

// 実行時の値は公開しないが load 時に処理を行う、既存 classifier の既知の例外。
// 追加の runtime 除外はここへ明示しない限り T-COV-002 が拒否する。
const RUNTIME_EXCLUSION_EXCEPTIONS = new Set(['cli/bin', 'dapp/strict-abi-typing']);
const GENERATED_DIRS = new Set([
  '.next',
  '.stryker-tmp',
  '.vitest-dist',
  'coverage',
  'dist',
  'forge-out',
  'mutation-report',
  'node_modules',
]);

/** dir 配下の JavaScript / TypeScript source。generated output は除く。 */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return GENERATED_DIRS.has(entry.name) ? [] : sourceFiles(path);
    return /\.[cm]?[jt]sx?$/.test(entry.name) ? [path] : [];
  });
}

/** static / dynamic import の module specifier が対象 file を指すか。 */
function importsStrictAbiTyping(file: string): boolean {
  const parsed = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx')
      ? ts.ScriptKind.TSX
      : file.endsWith('.ts')
        ? ts.ScriptKind.TS
        : ts.ScriptKind.JS,
  );
  let found = false;
  const visit = (node: ts.Node): void => {
    const moduleSpecifier =
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier;
    if (
      (moduleSpecifier &&
        ts.isStringLiteral(moduleSpecifier) &&
        moduleSpecifier.text.includes('strict-abi-typing')) ||
      (ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments.some(
          (argument) => ts.isStringLiteral(argument) && argument.text.includes('strict-abi-typing'),
        ))
    ) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  return found;
}

describe('coverage の分母に測る意味の無い file が入っていない', () => {
  it('T-COV-000 全 coverage package の file entry を読めている', () => {
    const expected = COVERAGE_PACKAGES.map((pkg) => pkg.name);
    const reported = [...new Set(ENTRIES.map((entry) => entry.package))].sort();
    expect(expected.length, 'test:cov を持つ package が 1 件も無い').toBeGreaterThan(0);
    expect(reported, 'test:cov を持つ package の coverage 報告が欠けている').toEqual(expected);
  });

  it('T-COV-001 1 行も実行されない file が分母に入っていない', () => {
    const uncovered = ENTRIES.filter((entry) => entry.lines.covered === 0).map(
      (entry) => `${entry.package}/${entry.file} (${entry.lines.total} 行)`,
    );
    expect(
      uncovered,
      `covered line が 0 の file が分母にいる。測るべきなら test を足し、測らないなら除外する: ${uncovered.join(', ')}`,
    ).toEqual([]);
  });

  it('T-COV-002 source 除外が runtime 実装を隠していない', async () => {
    const script = pathToFileURL(resolve(REPO_ROOT, 'scripts/mutation-scope-report.mjs')).href;
    const { classify } = (await import(script)) as unknown as SourceClassifier;
    const exclusions = sourceExclusions();
    expect(exclusions.length, 'source 除外を 1 件も読めていない').toBeGreaterThan(0);
    const invalid = exclusions.flatMap((excluded) => {
      const id = `${excluded.package}/${excluded.file}`;
      if (excluded.source === null) return [`${id} (対応する source が無い)`];
      const shape = classify(readFileSync(excluded.source, 'utf8'), excluded.source);
      if (RUNTIME_EXCLUSION_EXCEPTIONS.has(id)) {
        return shape.kind === 'type-only' && shape.runsWithoutExporting
          ? []
          : [`${id} (例外の形が変わった)`];
      }
      return shape.kind === 'implementation' || shape.runsWithoutExporting
        ? [`${id} (${shape.kind})`]
        : [];
    });
    expect(
      invalid,
      `runtime 実装を coverage から除外している。除外せず test で覆う: ${invalid.join(', ')}`,
    ).toEqual([]);

    const strictImports = ['examples', 'packages', 'scripts', 'tests']
      .flatMap((dir) => sourceFiles(join(REPO_ROOT, dir)))
      .filter((file) => !file.endsWith('strict-abi-typing.ts') && importsStrictAbiTyping(file));
    expect(
      strictImports,
      'strict-abi-typing は import されない型検査専用 file としてのみ coverage 除外できる',
    ).toEqual([]);
    // **明示の timeout を置く**。 repo 全体を走査するため、単体 3.6 秒でも sweep の並列下では
    // 30 秒を超える (実測でここが `Test timed out in 30000ms` で落ちた)。
  }, 120_000);
});
