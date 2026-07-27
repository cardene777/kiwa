#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const librariesRoot = join(repositoryRoot, 'docs', 'libraries');
const packagesRoot = join(repositoryRoot, 'packages');
const start = '<!-- kiwa-public-api:start -->';
const end = '<!-- kiwa-public-api:end -->';

function sourceUrl(path, line) {
  return `https://github.com/cardene777/kiwa/blob/main/${relative(repositoryRoot, path).replaceAll('\\\\', '/') }#L${line}`;
}

function sourceLine(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function isProjectSource(path, library) {
  const root = join(packagesRoot, library, 'src');
  return path === root || path.startsWith(`${root}/`);
}

function publicSymbol(checker, exported) {
  return exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
}

function sourceDeclaration(symbol, library) {
  return symbol.declarations?.find((declaration) => isProjectSource(declaration.getSourceFile().fileName, library));
}

function declarationNode(node) {
  // VariableDeclaration -> VariableDeclarationList -> VariableStatement.
  // Returning one parent too far selected the whole SourceFile, which made a
  // single exported const render every declaration in its module as an API
  // signature.
  if (ts.isVariableDeclaration(node)) return node.parent.parent;
  if (ts.isBindingElement(node)) return node.parent.parent.parent.parent;
  return node;
}

function sourceText(node, exportedName) {
  const target = declarationNode(node);
  const sourceFile = target.getSourceFile();
  const nodeStart = target.getStart(sourceFile);
  let text = target.getText(sourceFile);

  if (ts.isFunctionDeclaration(target) || ts.isMethodDeclaration(target) || ts.isConstructorDeclaration(target)) {
    const body = target.body;
    if (body) {
      text = `${text.slice(0, body.getStart(sourceFile) - nodeStart).trimEnd()};`;
    }
  }

  // `export { buildOtpAuthUri as buildSupabaseOtpAuthUri }` のように公開名を
  // 付け替えている場合、宣言をそのまま載せると見出しの名前で import できない。
  // 名前の位置だけを公開名へ差し替える (本文中の同名は触らない)。
  const declared = target.name && ts.isIdentifier(target.name) ? target.name.text : null;
  if (exportedName && declared && declared !== exportedName) {
    const at = target.name.getStart(sourceFile) - nodeStart;
    if (text.slice(at, at + declared.length) === declared) {
      text = text.slice(0, at) + exportedName + text.slice(at + declared.length);
    }
  }

  return text.replaceAll('\0', '\\0').trim();
}

// 値の型は宣言ノードではなくシンボル基準で解決する。VariableStatement を
// getTypeAtLocation に渡すと文そのものの型 (any) が返るため、以前は公開定数が
// すべて `any` として出力されていた。
function valueSignature(checker, name, symbol, node) {
  const type = checker.typeToString(
    checker.getTypeOfSymbolAtLocation(symbol, node),
    node,
    ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope,
  );
  return `export declare const ${name}: ${type};`;
}

// class は const ではないので宣言の形を保つ。本体を落とし、継承関係と
// メンバーのシグネチャだけを残す。
function classSignature(name, target) {
  const sourceFile = target.getSourceFile();
  const heritage = (target.heritageClauses ?? []).map((clause) => clause.getText(sourceFile)).join(' ');
  const members = target.members
    .filter((member) => !ts.isSemicolonClassElement(member))
    .map((member) => {
      const body = member.body;
      const text = body
        ? member.getText(sourceFile).slice(0, body.getStart(sourceFile) - member.getStart(sourceFile)).trimEnd()
        : member.getText(sourceFile).replace(/;\s*$/, '');
      return `  ${text};`;
    });
  const header = `export declare class ${name}${heritage ? ` ${heritage}` : ''}`;
  return members.length === 0 ? `${header} {}` : `${header} {\n${members.join('\n')}\n}`;
}

function displayContract(checker, name, symbol, declaration) {
  // 対象 library の src に宣言が無くても、別 package からの re-export なら
  // 宣言元のノードが取れる。そのまま載せた方が正確なので、宣言が一切
  // 見つからない場合だけ型解決にフォールバックする。
  const node = declaration ?? symbol.declarations?.[0] ?? symbol.valueDeclaration;
  if (!node) {
    return {
      code: `export declare const ${name}: unknown;`,
      source: null,
    };
  }

  const target = declarationNode(node);
  let code;
  if (ts.isClassDeclaration(target) || ts.isClassExpression(target)) {
    code = classSignature(name, target);
  } else if (ts.isVariableStatement(target) || ts.isVariableDeclaration(target)) {
    code = valueSignature(checker, name, symbol, node);
  } else {
    code = sourceText(target, name);
  }

  // 別 package からの re-export は型解決が `dist/*.d.ts` に着地することがある。
  // dist は追跡対象外でリンク先が存在しないため、宣言だけ載せてリンクは出さない。
  const declarationPath = relative(repositoryRoot, target.getSourceFile().fileName).replaceAll('\\\\', '/');
  if (declarationPath.includes('/dist/')) {
    return { code, source: null };
  }

  return {
    code,
    source: {
      url: sourceUrl(target.getSourceFile().fileName, sourceLine(target.getSourceFile(), target)),
      path: declarationPath,
    },
  };
}

function documentation(checker, symbol) {
  return ts
    .displayPartsToString(symbol.getDocumentationComment(checker))
    .replaceAll(/\s+/g, ' ')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('{{', '&#123;&#123;')
    .replaceAll('}}', '&#125;&#125;')
    .trim();
}

function errorDiagnostics(library) {
  const entry = join(packagesRoot, library, 'src', 'index.ts');
  const program = ts.createProgram([entry], {
    allowJs: false,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
  });
  const errors = [];
  for (const sourceFile of program.getSourceFiles()) {
    if (!isProjectSource(sourceFile.fileName, library)) continue;
    const visit = (node) => {
      if (
        ts.isThrowStatement(node) &&
        node.expression &&
        ts.isNewExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        (node.expression.expression.text === 'Error' || node.expression.expression.text === 'TypeError') &&
        node.expression.arguments?.[0]
      ) {
        errors.push({
          message: node.expression.arguments[0].getText(sourceFile).replaceAll('|', '\\|'),
          path: relative(repositoryRoot, sourceFile.fileName).replaceAll('\\\\', '/'),
          url: sourceUrl(sourceFile.fileName, sourceLine(sourceFile, node)),
        });
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
  if (errors.length === 0) return '';
  errors.sort((a, b) => a.path.localeCompare(b.path) || a.url.localeCompare(b.url));
  const rows = errors.map((error) => '| ' + error.message + ' | [' + error.path + '](' + error.url + ') |');
  return [
    '## エラー診断',
    '',
    '次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。',
    '',
    '| 送出する message | 発生箇所 |',
    '| --- | --- |',
    ...rows,
  ].join('\n');
}

function contractsFrom(library) {
  const entry = join(packagesRoot, library, 'src', 'index.ts');
  const program = ts.createProgram([entry], {
    allowJs: false,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
  });
  const checker = program.getTypeChecker();
  const entryFile = program.getSourceFile(entry);
  if (!entryFile) return [];
  const moduleSymbol = checker.getSymbolAtLocation(entryFile);
  if (!moduleSymbol) return [];

  const contracts = [];
  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    const target = publicSymbol(checker, exported);
    const declaration = sourceDeclaration(target, library);
    const kind = target.flags & ts.SymbolFlags.Value ? 'value' : 'type';
    const contract = displayContract(checker, exported.getName(), target, declaration);
    contracts.push({
      name: exported.getName(),
      kind,
      description: documentation(checker, target),
      ...contract,
    });
  }
  return contracts.sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

function contractEntry(contract) {
  const source = contract.source
    ? `[ソース宣言](${contract.source.url}) \`${contract.source.path}\``
    : '公開 entry point から型を解決しています。';
  const description = contract.description ? `\n\n${contract.description}` : '';
  return `#### \`${contract.name}\`\n\n${source}${description}\n\n\`\`\`ts\n${contract.code}\n\`\`\``;
}

function group(title, contracts) {
  if (contracts.length === 0) return '';
  return `### ${title}\n\n${contracts.map(contractEntry).join('\n\n')}`;
}

function section(library, contracts) {
  const values = contracts.filter((contract) => contract.kind === 'value');
  const types = contracts.filter((contract) => contract.kind === 'type');
  const source = `https://github.com/cardene777/kiwa/blob/main/packages/${library}/src/index.ts`;
  const diagnostics = errorDiagnostics(library);
  return `${start}\n${diagnostics ? `${diagnostics}\n\n` : ''}## API 契約\n\nこの section は [公開 entry point](${source}) から同期しています。各項目は公開名、実際の TypeScript 宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。\n\n${group('値', values)}\n\n${group('型', types)}\n${end}`;
}

function replace(content, replacement) {
  const from = content.indexOf(start);
  const to = content.indexOf(end);
  if (from !== -1 && to !== -1 && to > from) {
    return `${content.slice(0, from)}${replacement}${content.slice(to + end.length)}`;
  }
  return `${content.replace(/\s*$/, '')}\n\n${replacement}\n`;
}

let updated = 0;
for (const category of readdirSync(librariesRoot, { withFileTypes: true })) {
  if (!category.isDirectory() || category.name === 'native-languages') continue;
  for (const library of readdirSync(join(librariesRoot, category.name), { withFileTypes: true })) {
    if (!library.isDirectory()) continue;
    const packageRoot = join(packagesRoot, library.name);
    const sourcePath = join(packageRoot, 'src', 'index.ts');
    const referencePath = join(librariesRoot, category.name, library.name, 'reference.md');
    if (!existsSync(sourcePath) || !existsSync(referencePath)) continue;
    const contracts = contractsFrom(library.name);
    writeFileSync(referencePath, replace(readFileSync(referencePath, 'utf8'), section(library.name, contracts)));
    updated += 1;
  }
}
console.log(`Synchronized detailed API contracts for ${updated} library references.`);
