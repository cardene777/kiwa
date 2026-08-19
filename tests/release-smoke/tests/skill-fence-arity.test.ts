// SKILL.md の sample が、 実在する API を **実在する呼び方で** 呼んでいるかを見る (#2056)。
//
// `skill-fence-imports` は名前の実在までを見る。 名前が合っていても引数の渡し方が違えば
// sample は compile しない = `/kiwa-a11y` の Step 2 は
// `runAxe(container, { axe, runOnly: [...] })` と書いていたが、 実 API は
// `runAxe({ context, runOptions })` の options 1 つで、 `expectNoViolations(results)` も
// 第 2 引数に `expect` を要求する。 dogfood で写した sample が
// `TS2554: Expected 0-1 arguments, but got 2` と `Expected 2-3 arguments, but got 1` で
// 落ちた (実測)。
//
// **引数の数を書き写す検査にはしない**。 package の宣言から範囲を導く
// (`rules/quality.md § 導出可能記述は人手で書かない` の経路 1)。 数を持つと signature が
// 変わった時に検査だけ古くなる。
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';
import { skillBody, skillsWithSkillMd } from './skill-md.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);

/** 対象 package と、 その source root。 */
const PACKAGES: Record<string, string> = {
  '@kiwa-lab/a11y': 'packages/a11y/src',
  '@kiwa-lab/dapp': 'packages/dapp/src',
};

interface Arity {
  /** 省略できない引数の数。 */
  min: number;
  /** 渡せる引数の上限。 rest 引数があれば `Infinity`。 */
  max: number;
}

function tsFilesUnder(dir: string): string[] {
  const root = resolve(REPO_ROOT, dir);
  const out: string[] = [];
  const walk = (current: string): void => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) out.push(full);
    }
  };
  walk(root);
  return out;
}

/**
 * package が export する関数名 → 引数の範囲。
 *
 * `export function f(a, b?)` と `export const f = (a) => …` の 2 形を拾う。 型だけの export
 * (interface / type) は呼べないので入らない。
 */
function exportedArities(srcDir: string): Map<string, Arity> {
  const arities = new Map<string, Arity>();

  const rangeOf = (params: readonly ts.ParameterDeclaration[]): Arity => {
    let min = 0;
    let hasRest = false;
    for (const p of params) {
      if (p.dotDotDotToken) {
        hasRest = true;
        continue;
      }
      if (!p.questionToken && p.initializer === undefined) min += 1;
    }
    return { min, max: hasRest ? Number.POSITIVE_INFINITY : params.length };
  };

  for (const file of tsFilesUnder(srcDir)) {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf-8'), ts.ScriptTarget.Latest, true);
    for (const statement of source.statements) {
      const modifiers = ts.canHaveModifiers(statement) ? ts.getModifiers(statement) : undefined;
      if (!modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue;

      if (ts.isFunctionDeclaration(statement) && statement.name) {
        arities.set(statement.name.text, rangeOf(statement.parameters));
        continue;
      }
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          if (!ts.isIdentifier(declaration.name)) continue;
          const init = declaration.initializer;
          if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) {
            arities.set(declaration.name.text, rangeOf(init.parameters));
          }
        }
      }
    }
  }
  return arities;
}

interface Call {
  skill: string;
  name: string;
  args: number;
}

/**
 * fence を 1 つ parse する。
 *
 * **`.tsx` として読む**。 sample は JSX を含む (`render(<LoginForm />)`) ため、 `.ts` で読むと
 * 比較演算子として解釈されて構文木が崩れ、 呼出を 1 つも拾えない (実測で 0 件になった)。
 */
function parseFence(code: string): ts.SourceFile {
  return ts.createSourceFile(
    'fence.tsx',
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
}

/** その fence の中で定義された名前 (function / const / let)。 */
function locallyDefined(source: ts.SourceFile): Set<string> {
  const names = new Set<string>();
  const visit = (node: ts.Node): void => {
    if (ts.isFunctionDeclaration(node) && node.name) names.add(node.name.text);
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) names.add(node.name.text);
    ts.forEachChild(node, visit);
  };
  visit(source);
  return names;
}

/**
 * skill の ts fence が、 その package から import した名前を呼んでいる箇所。
 *
 * **import と呼出は別 fence にある**。 skill は Step 1 に import 句を、 Step 2 に使用例を置く
 * 形で書かれているため、 fence 単位で閉じると呼出を 1 つも拾えない (実測)。 skill 全体で
 * import 済の名前を集めてから、 各 fence の呼出を見る。
 *
 * ただし **その fence の中で定義した名前は除く** = 同名の local helper を見せている fence を
 * package の API と取り違えない (`skill-fence-imports` § unresolvedUses と同じ理由)。
 */
function callsInFences(skill: string, packageName: string, known: Map<string, Arity>): Call[] {
  const body = skillBody(skill);
  const fences = [...body.matchAll(/```tsx?\n([\s\S]*?)```/g)].map((m) => m[1] ?? '');

  const imported = new Set<string>();
  for (const code of fences) {
    for (const statement of parseFence(code).statements) {
      if (
        !ts.isImportDeclaration(statement) ||
        !ts.isStringLiteral(statement.moduleSpecifier) ||
        statement.moduleSpecifier.text !== packageName
      ) {
        continue;
      }
      const bindings = statement.importClause?.namedBindings;
      if (!bindings || !ts.isNamedImports(bindings)) continue;
      for (const element of bindings.elements) imported.add(element.name.text);
    }
  }
  if (imported.size === 0) return [];

  const calls: Call[] = [];
  for (const code of fences) {
    const source = parseFence(code);
    const local = locallyDefined(source);
    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        const name = node.expression.text;
        if (imported.has(name) && known.has(name) && !local.has(name)) {
          calls.push({ skill, name, args: node.arguments.length });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return calls;
}

describe.each(Object.entries(PACKAGES))('%s の呼び方が sample と一致する', (packageName, srcDir) => {
  const arities = exportedArities(srcDir);

  it('package から呼べる関数を 1 つ以上取れている', () => {
    // 0 件だと以下の検査が空回りする。 AST の読み方が変わった時に気付けるようにする。
    expect(arities.size, `${packageName}: export された関数を 1 つも取れていない`).toBeGreaterThan(0);
  });

  it('sample の呼出が宣言の引数範囲に収まる', () => {
    const calls = skillsWithSkillMd().flatMap((skill) =>
      callsInFences(skill, packageName, arities),
    );

    const wrong = calls.filter((call) => {
      const arity = arities.get(call.name)!;
      return call.args < arity.min || call.args > arity.max;
    });

    expect(
      wrong.map((call) => {
        const arity = arities.get(call.name)!;
        const max = arity.max === Number.POSITIVE_INFINITY ? '∞' : String(arity.max);
        return `${call.skill}: ${call.name}(${call.args} 引数) — 宣言は ${arity.min}-${max}`;
      }),
      '宣言の引数範囲に収まらない呼出が sample にある',
    ).toEqual([]);
  });
});

describe('検査が実際に呼出を見ている', () => {
  it('a11y の sample から runAxe / expectNoViolations を拾えている', () => {
    // 上の検査は「範囲外が 0 件」 を主張する。 呼出を 1 つも拾えていなくても 0 件になるので、
    // **拾えていること** を別に固定する (`rules/quality.md § 6 条件目` の陰性対照と同じ形)。
    const arities = exportedArities(PACKAGES['@kiwa-lab/a11y']!);
    const names = callsInFences('kiwa-a11y', '@kiwa-lab/a11y', arities).map((c) => c.name);
    expect(names, 'kiwa-a11y の fence から runAxe の呼出を拾えていない').toContain('runAxe');
    expect(names, 'kiwa-a11y の fence から expectNoViolations の呼出を拾えていない').toContain(
      'expectNoViolations',
    );
  });

  it('a11y の Playwright sample は browser context 内で axe を実行する', () => {
    const fences = [
      ...skillBody('kiwa-a11y').matchAll(/```tsx?\n([\s\S]*?)```/g),
    ].map((match) => match[1] ?? '');
    const playwright = fences.find((code) => code.includes("test('{Module} a11y check'"));

    expect(playwright, 'kiwa-a11y の Playwright sample が無い').toBeDefined();
    expect(playwright, 'Playwright page を Node/jsdom 用 runAxe に渡している').not.toMatch(
      /\brunAxe\s*\(/,
    );
    expect(playwright, 'axe-core source を Playwright page に注入していない').toContain(
      'page.addScriptTag({ content: axe.source })',
    );
    expect(playwright, 'axe を browser context 内で実行していない').toMatch(
      /page\.evaluate\([\s\S]*\baxe\.run\(document,/,
    );
  });
});
