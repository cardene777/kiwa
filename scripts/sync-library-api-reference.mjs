#!/usr/bin/env node

// 各ライブラリの reference.md に、公開 entry point から抽出した API 契約を書き込む。
//
// 宣言は TypeScript の declaration emitter が生成した .d.ts から取る。実装の
// ソーステキストを切り貼りすると、実体のない `export function foo(...);` や
// private member や default parameter がそのまま公開ドキュメントへ流れ、
// 宣言として成立しないものが並ぶ。emitter を通せば ambient declaration として
// 正しい形が得られる。

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const librariesRoot = join(repositoryRoot, 'docs', 'libraries');
const packagesRoot = join(repositoryRoot, 'packages');
const scope = '@kiwa-lab';
const start = '<!-- kiwa-public-api:start -->';
const end = '<!-- kiwa-public-api:end -->';

function sourceUrl(path, line) {
  return `https://github.com/cardene777/kiwa/blob/main/${relative(repositoryRoot, path).replaceAll('\\\\', '/')}#L${line}`;
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

// 対象となるライブラリ (docs 側の reference.md と packages 側の entry point が
// 揃っているもの) を列挙する。
function collectTargets() {
  const targets = [];
  for (const category of readdirSync(librariesRoot, { withFileTypes: true })) {
    if (!category.isDirectory() || category.name === 'native-languages') continue;
    for (const library of readdirSync(join(librariesRoot, category.name), { withFileTypes: true })) {
      if (!library.isDirectory()) continue;
      const entry = join(packagesRoot, library.name, 'src', 'index.ts');
      const reference = join(librariesRoot, category.name, library.name, 'reference.md');
      if (!existsSync(entry) || !existsSync(reference)) continue;
      targets.push({ library: library.name, entry, reference });
    }
  }
  return targets;
}

// workspace 内の package 参照を dist ではなく src へ向ける。build 成果物に
// 依存すると、clean checkout や build 前の実行で解決に失敗し、型が unknown へ
// 劣化したまま公開されてしまう。
function workspacePaths() {
  const paths = {};
  for (const entry of readdirSync(packagesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifest = join(packagesRoot, entry.name, 'package.json');
    if (!existsSync(manifest)) continue;
    const name = JSON.parse(readFileSync(manifest, 'utf8')).name;
    if (typeof name !== 'string' || !name.startsWith(`${scope}/`)) continue;
    paths[name] = [join(packagesRoot, entry.name, 'src', 'index.ts')];
    paths[`${name}/*`] = [join(packagesRoot, entry.name, 'src', '*')];
  }
  return paths;
}

function buildProgram(entries) {
  const program = ts.createProgram(entries, {
    allowJs: false,
    baseUrl: repositoryRoot,
    declaration: true,
    emitDeclarationOnly: true,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    paths: workspacePaths(),
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2022,
  });

  const emitted = new Map();
  program.emit(undefined, (fileName, text) => emitted.set(fileName, text));
  return { program, emitted };
}

// emitter が出した .d.ts を parse して、名前が一致する宣言のテキストを返す。
const parsedDeclarationFiles = new Map();

function declarationSourceFile(emitted, sourceFileName) {
  const dtsName = sourceFileName.replace(/\.tsx?$/, '.d.ts');
  if (parsedDeclarationFiles.has(dtsName)) return parsedDeclarationFiles.get(dtsName);
  const text = emitted.get(dtsName);
  const parsed = text ? ts.createSourceFile(dtsName, text, ts.ScriptTarget.ES2022, true) : null;
  parsedDeclarationFiles.set(dtsName, parsed);
  return parsed;
}

// declaration emitter は private member を「名前だけ」の形で .d.ts に残す
// (構造的型付けの都合で必要になる)。読み手にとっては実装の内部事情でしかない
// ので、公開ドキュメントからは落とす。
function withoutPrivateMembers(statement, dts) {
  if (!ts.isClassDeclaration(statement)) return null;
  const members = statement.members.filter((member) => {
    if (member.name && ts.isPrivateIdentifier(member.name)) return false;
    return !(ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Private);
  });
  if (members.length === statement.members.length) return null;

  const updated = ts.factory.updateClassDeclaration(
    statement,
    statement.modifiers,
    statement.name,
    statement.typeParameters,
    statement.heritageClauses,
    members,
  );
  return ts
    .createPrinter({ newLine: ts.NewLineKind.LineFeed })
    .printNode(ts.EmitHint.Unspecified, updated, dts)
    .trim();
}

function emittedDeclaration(emitted, sourceFileName, name) {
  const dts = declarationSourceFile(emitted, sourceFileName);
  if (!dts) return null;

  for (const statement of dts.statements) {
    if (ts.isVariableStatement(statement)) {
      const matched = statement.declarationList.declarations.some(
        (declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === name,
      );
      if (matched) return statement.getText(dts).trim();
      continue;
    }
    const declared = statement.name && ts.isIdentifier(statement.name) ? statement.name.text : null;
    if (declared === name) return withoutPrivateMembers(statement, dts) ?? statement.getText(dts).trim();
  }
  return null;
}

// 実装のソースから宣言を組み立てる最終手段。emitter の出力が得られない場合
// だけ使う。本体は落とすが ambient declaration として正しいとは限らないため、
// 関数には declare を補う。
function fallbackDeclaration(node) {
  const target = ts.isVariableDeclaration(node) ? node.parent.parent : node;
  const sourceFile = target.getSourceFile();
  let text = target.getText(sourceFile);

  if (ts.isFunctionDeclaration(target) && target.body) {
    const bodyStart = target.body.getStart(sourceFile) - target.getStart(sourceFile);
    text = `${text.slice(0, bodyStart).trimEnd()};`;
    text = text.replace(/^(export\s+)?(async\s+)?function\b/, (_, exported) => `${exported ?? ''}declare function`);
  }
  return text.replaceAll('\0', '\\0').trim();
}

// `export * as ns from './x'` や `export { A as B }` は、実体の宣言ではなく
// entry point 側の export 文そのものが契約である。実体を展開すると内部 module
// の中身や、公開されていない名前を参照する宣言が出てしまう。
function reExportStatement(exported) {
  for (const declaration of exported.declarations ?? []) {
    if (ts.isNamespaceExport(declaration) || ts.isExportSpecifier(declaration)) {
      const statement = ts.isNamespaceExport(declaration)
        ? declaration.parent.parent
        : declaration.parent.parent;
      return statement.getText(statement.getSourceFile()).trim();
    }
  }
  return null;
}

function displayContract(checker, exported, symbol, library, emitted) {
  const name = exported.getName();
  const declaration = sourceDeclaration(symbol, library);

  // 別名公開・namespace 公開は export 文を契約として見せる。
  const aliased = symbol.getName() !== name;
  const namespaceExport = (exported.declarations ?? []).some((node) => ts.isNamespaceExport(node));
  if (aliased || namespaceExport || !declaration) {
    const statement = reExportStatement(exported);
    if (statement) {
      const note = aliased
        ? `\`${symbol.getName()}\` を \`${name}\` として公開しています。`
        : null;
      return { code: statement, source: null, note };
    }
  }

  const node = declaration ?? symbol.declarations?.[0] ?? symbol.valueDeclaration;
  if (!node) return { code: `export declare const ${name}: unknown;`, source: null, note: null };

  const sourceFileName = node.getSourceFile().fileName;
  const code = emittedDeclaration(emitted, sourceFileName, symbol.getName()) ?? fallbackDeclaration(node);

  const declarationPath = relative(repositoryRoot, sourceFileName).replaceAll('\\\\', '/');
  if (declarationPath.includes('/dist/') || declarationPath.startsWith('..')) {
    return { code, source: null, note: null };
  }

  const anchor = ts.isVariableDeclaration(node) ? node.parent.parent : node;
  return {
    code,
    source: {
      url: sourceUrl(sourceFileName, sourceLine(node.getSourceFile(), anchor)),
      path: declarationPath,
    },
    note: null,
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

// 表のセルに入れる値は 1 行に畳む。複数行の文字列連結や条件式をそのまま
// 入れると、改行のところで表が途切れて以降が本文として描画される。
function tableCell(text) {
  return text
    .replaceAll(/\s+/g, ' ')
    .replaceAll('|', '\\|')
    .trim();
}

function errorDiagnostics(program, library) {
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
          message: tableCell(node.expression.arguments[0].getText(sourceFile)),
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
  const rows = errors.map((error) => `| ${error.message} | [${error.path}](${error.url}) |`);
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

function contractsFrom(program, emitted, library, entry) {
  const checker = program.getTypeChecker();
  const entryFile = program.getSourceFile(entry);
  if (!entryFile) return [];
  const moduleSymbol = checker.getSymbolAtLocation(entryFile);
  if (!moduleSymbol) return [];

  const contracts = [];
  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    const symbol = publicSymbol(checker, exported);
    contracts.push({
      name: exported.getName(),
      kind: symbol.flags & ts.SymbolFlags.Value ? 'value' : 'type',
      description: documentation(checker, symbol),
      ...displayContract(checker, exported, symbol, library, emitted),
    });
  }
  return contracts.sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

function contractEntry(contract) {
  const source = contract.source
    ? `[ソース宣言](${contract.source.url}) \`${contract.source.path}\``
    : '公開 entry point から解決しています。';
  const note = contract.note ? `\n\n${contract.note}` : '';
  const description = contract.description ? `\n\n${contract.description}` : '';
  return `#### \`${contract.name}\`\n\n${source}${note}${description}\n\n\`\`\`ts\n${contract.code}\n\`\`\``;
}

function group(title, contracts) {
  if (contracts.length === 0) return '';
  return `### ${title}\n\n${contracts.map(contractEntry).join('\n\n')}`;
}

function section(library, contracts, diagnostics) {
  const values = contracts.filter((contract) => contract.kind === 'value');
  const types = contracts.filter((contract) => contract.kind === 'type');
  const source = `https://github.com/cardene777/kiwa/blob/main/packages/${library}/src/index.ts`;
  return `${start}\n${diagnostics ? `${diagnostics}\n\n` : ''}## API 契約\n\nこの section は [公開 entry point](${source}) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。\n\n${group('値', values)}\n\n${group('型', types)}\n${end}`;
}

function replace(content, replacement) {
  const from = content.indexOf(start);
  const to = content.indexOf(end);
  if (from !== -1 && to !== -1 && to > from) {
    return `${content.slice(0, from)}${replacement}${content.slice(to + end.length)}`;
  }
  return `${content.replace(/\s*$/, '')}\n\n${replacement}\n`;
}

const targets = collectTargets();
if (targets.length === 0) {
  console.error('No library reference targets found.');
  process.exit(1);
}

const { program, emitted } = buildProgram(targets.map((target) => target.entry));

// module 解決に失敗したまま書き込むと、型が unknown へ劣化した契約が公開される。
// 生成前に落とす。
const unresolved = ts
  .getPreEmitDiagnostics(program)
  .filter((diagnostic) => diagnostic.code === 2307)
  .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '));
if (unresolved.length > 0) {
  console.error('Module resolution failed; refusing to write degraded API contracts.');
  for (const message of [...new Set(unresolved)].slice(0, 10)) console.error(`  ${message}`);
  process.exit(1);
}

let updated = 0;
for (const target of targets) {
  const contracts = contractsFrom(program, emitted, target.library, target.entry);
  const diagnostics = errorDiagnostics(program, target.library);
  const content = readFileSync(target.reference, 'utf8');
  writeFileSync(target.reference, replace(content, section(target.library, contracts, diagnostics)));
  updated += 1;
}
console.log(`Synchronized detailed API contracts for ${updated} library references.`);
