// SKILL.md の sample が実在する API だけを import していることを見る (#2032)。
//
// `/kiwa-play` の Step 5 は `makeClients(anvilPort, OWNER_PK)` を呼ぶ sample を載せていたが、
// **`makeClients` は `@kiwa-lab/dapp` の export ではない** = viem の client を束ねる local
// helper で、 6 example がそれぞれ自分で定義している (dogfood で実測)。 sample の上に
// `import { ... } from './fixture'` しか無いため、 読み手は package から来ると読む。
//
// 名前を書き写す検査にはしない。 **package の export を実物から導く** (`rules/quality.md §
// 導出可能記述は人手で書かない` の経路 1)。 一覧を持つと API が増えた時に検査だけ古くなる。
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';
import { skillBody, skillsWithSkillMd } from './skill-md.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);

/** 対象 package と、 その entry point。 */
const PACKAGES: Record<string, string> = {
  '@kiwa-lab/dapp': 'packages/dapp/src/index.ts',
};

function parse(rel: string): ts.SourceFile {
  const path = resolve(REPO_ROOT, rel);
  return ts.createSourceFile(path, readFileSync(path, 'utf-8'), ts.ScriptTarget.Latest, true);
}

/**
 * entry point が公開する名前。
 *
 * `export * from './x.js'` は **1 段だけ** 辿る。 深く辿らないのは、 辿れなかった段の名前が
 * 落ちて「export していない」 側に倒れるため = 検査は厳しい方向に外れる (正しい sample が
 * 落ちるので気付ける)。 逆に緩い方向へ倒すと、 存在しない名前を通す。
 */
function exportedNames(entry: string): Set<string> {
  const names = new Set<string>();
  const collect = (source: ts.SourceFile, depth: number): void => {
    for (const statement of source.statements) {
      if (ts.isExportDeclaration(statement)) {
        if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
          for (const element of statement.exportClause.elements) names.add(element.name.text);
          continue;
        }
        // `export * from './x.js'`
        const from = statement.moduleSpecifier;
        if (depth > 0 && from && ts.isStringLiteral(from) && from.text.startsWith('.')) {
          // entry は repo 相対。 `resolve` を挟むと cwd 基準になり、 release-smoke 配下を
          // 探しに行く (実測で ENOENT)。 repo 相対のまま join する。
          const rel = from.text.replace(/\.js$/, '.ts');
          collect(parse(join(dirname(entry), rel)), depth - 1);
        }
        continue;
      }
      const modifiers = ts.canHaveModifiers(statement) ? ts.getModifiers(statement) : undefined;
      const exported = modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      if (!exported) continue;
      if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) {
        if (statement.name) names.add(statement.name.text);
      } else if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text);
        }
      } else if (
        ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement) ||
        ts.isEnumDeclaration(statement)
      ) {
        names.add(statement.name.text);
      }
    }
  };
  collect(parse(entry), 1);
  return names;
}

/**
 * SKILL.md の ts fence が指定 package から import している名前。
 *
 * 範囲は **fence の中の import 文だけ**。 本文の散文が package 名に触れていても拾わない
 * (`docs/quality/check-authoring.md § 形 4`)。
 */
export function fenceImports(body: string, packageName: string): string[] {
  const names: string[] = [];
  for (const fence of body.matchAll(/```ts\n([\s\S]*?)```/g)) {
    const code = fence[1] ?? '';
    const pattern = new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*['"]${packageName}['"]`, 'g');
    for (const match of code.matchAll(pattern)) {
      for (const raw of (match[1] ?? '').split(',')) {
        const name = raw.replace(/^\s*type\s+/, '').trim().split(/\s+as\s+/)[0]?.trim();
        if (name) names.push(name);
      }
    }
  }
  return names;
}

describe('SKILL.md の sample が実在する API を import している', () => {
  it('対象 package の一覧が空でない', () => {
    // 空だと下の `it.each` が 1 件も生成されず、 存在しない名前を通したまま緑になる
    // (§ 形 1)。 `it.each` とは独立した test で、 対象を名指しで確かめる。
    expect(Object.keys(PACKAGES).length).toBeGreaterThan(0);
  });

  it.each(Object.keys(PACKAGES))('%s の export を entry point から導ける', (packageName) => {
    // 0 件で通る形を作らない (§ 形 1)。 entry point の書式が変わって 1 件も取れなくなると、
    // どの sample も「export していない」 と落ちるのではなく、 空集合との照合が全て通る形に
    // なりうるため、 件数を独立に確かめる。
    expect(exportedNames(PACKAGES[packageName]!).size, `${packageName} の export が 0 件`)
      .toBeGreaterThan(0);
  });

  it('どの skill も存在しない名前を import していない', () => {
    const missing: string[] = [];
    let checked = 0;
    for (const [packageName, entry] of Object.entries(PACKAGES)) {
      const exported = exportedNames(entry);
      for (const skill of skillsWithSkillMd()) {
        for (const name of fenceImports(skillBody(skill), packageName)) {
          checked += 1;
          if (!exported.has(name)) missing.push(`${skill}: ${packageName} に ${name} が無い`);
        }
      }
    }
    // 走査対象が 0 件のまま緑になる形を塞ぐ (§ 形 1)。
    expect(checked, 'import を 1 件も走査していない').toBeGreaterThan(0);
    expect(missing, `SKILL.md が存在しない名前を import している:\n${missing.join('\n')}`).toEqual(
      [],
    );
  });

  it('fence の外と別 package の import を拾わない', () => {
    // 範囲の切り出しを fixture で固定する (§ 形 4)。 散文が package 名に触れる形と、
    // 別 package からの import が同じ fence にある形の 2 つを入れる。
    const body = [
      '`@kiwa-lab/dapp` の `notImported` は fence の外にある散文なので拾わない。',
      '',
      '```ts',
      "import { createPublicClient } from 'viem';",
      "import { runE2EPrepareEnv, type WalletConfig } from '@kiwa-lab/dapp';",
      '```',
    ].join('\n');
    expect(fenceImports(body, '@kiwa-lab/dapp').sort()).toEqual(['WalletConfig', 'runE2EPrepareEnv']);
  });
});
