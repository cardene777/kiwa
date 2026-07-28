#!/usr/bin/env node

// 各ライブラリの reference.md に、公開 entry point から抽出した API 契約を書き込む。
//
// 宣言は TypeScript の declaration emitter が生成した .d.ts から取る。実装の
// ソーステキストを切り貼りすると、実体のない `export function foo(...);` や
// private member や default parameter がそのまま公開ドキュメントへ流れ、
// 宣言として成立しないものが並ぶ。emitter を通せば ambient declaration として
// 正しい形が得られる。

import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

import {
  DocsSyncError,
  codeBlock,
  escapeMarkdownText,
  inlineCode,
  insideRoot,
  linkPath,
  neutralizeLeadingFence,
  prepareWritePath,
  replaceManagedBlock,
  resolveReadPath,
  tableCodeCell,
  writeFileAtomic,
} from './docs-sync-safety.mjs';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const librariesRoot = join(repositoryRoot, 'docs', 'libraries');
const packagesRoot = join(repositoryRoot, 'packages');
const scope = '@kiwa-lab';
const start = '<!-- kiwa-public-api:start -->';
const end = '<!-- kiwa-public-api:end -->';
// 既定は検査のみ。無条件に上書きすると、commit 漏れが手元の build で修復されて
// repo の内容と公開される内容が静かに分岐する。書き込みは明示した時だけ行う。
const write = process.argv.includes('--write');

function repoRelativePosix(path) {
  // Windows の separator は 1 文字。2 文字を探していたので、生成される link が
  // その環境でだけ壊れていた。
  return relative(repositoryRoot, path).replaceAll('\\', '/');
}

function sourceUrl(path, line) {
  // path 片だけを encode する。行番号の `#L` は URL の構造なので残す。
  return `https://github.com/cardene777/kiwa/blob/main/${linkPath(repoRelativePosix(path))}#L${line}`;
}

function sourceLine(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

// separator を文字列で連結すると、separator が `\` の環境で子 source を 1 件も
// 拾えず、診断表が空のまま reference を上書きする。path の包含判定は insideRoot に任せる。
function isProjectSource(path, library) {
  return insideRoot(join(packagesRoot, library, 'src'), path);
}

function publicSymbol(checker, exported) {
  return exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
}

function sourceDeclaration(symbol, library) {
  return symbol.declarations?.find((declaration) => isProjectSource(declaration.getSourceFile().fileName, library));
}

/**
 * 対象となるライブラリを列挙する。
 *
 * package がある library で `reference.md` が欠けていたら止める。以前は黙って
 * 対象から外していたので、`reference.md` を消しても生成が成功していた。
 * 文書リンクの検査も 4 ページ揃っていない library を外し、VitePress は
 * 死んだリンクを許すため、消えたことに気付ける層がどこにも無かった。
 */
function collectTargets() {
  const targets = [];
  const missing = [];
  for (const category of readdirSync(librariesRoot, { withFileTypes: true })) {
    if (!category.isDirectory() || category.name === 'native-languages') continue;
    for (const library of readdirSync(join(librariesRoot, category.name), { withFileTypes: true })) {
      if (!library.isDirectory()) continue;
      const entry = join(packagesRoot, library.name, 'src', 'index.ts');
      const reference = join(librariesRoot, category.name, library.name, 'reference.md');
      // package を持たない文書 (全体をまとめる入口) は対象外。
      if (!existsSync(entry)) continue;
      if (!existsSync(reference)) {
        missing.push(`docs/libraries/${category.name}/${library.name}/reference.md`);
        continue;
      }
      targets.push({ library: library.name, entry, reference });
    }
  }
  if (missing.length > 0) {
    throw new DocsSyncError(
      `${missing.length} package(s) have no reference.md to write into:\n` +
        missing.map((path) => `  ${path}`).join('\n'),
    );
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
    // manifest も link を追って読まれる。名前空間の判定に外の file を使わせない。
    const name = JSON.parse(
      readFileSync(resolveReadPath(manifest, repositoryRoot, `${entry.name} package.json`), 'utf8'),
    ).name;
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

  // オーバーロードは同じ名前の宣言が並ぶ。最初の 1 件で打ち切ると、
  // 呼び出し形が複数ある関数の契約が 1 つしか見えなくなる。
  const matched = [];
  for (const statement of dts.statements) {
    if (ts.isVariableStatement(statement)) {
      const hit = statement.declarationList.declarations.some(
        (declaration) => ts.isIdentifier(declaration.name) && declaration.name.text === name,
      );
      if (hit) matched.push(statement.getText(dts).trim());
      continue;
    }
    const declared = statement.name && ts.isIdentifier(statement.name) ? statement.name.text : null;
    if (declared === name) {
      matched.push(withoutPrivateMembers(statement, dts) ?? statement.getText(dts).trim());
    }
  }
  return matched.length > 0 ? matched.join('\n') : null;
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
    // NamespaceExport の親は ExportDeclaration だが、ExportSpecifier は
    // NamedExports を挟むので 1 段深い。ここを揃えて辿ると SourceFile を掴み、
    // entry point 全体が契約として出力されてしまう。
    const statement = ts.isNamespaceExport(declaration)
      ? declaration.parent
      : ts.isExportSpecifier(declaration)
        ? declaration.parent.parent
        : null;
    if (statement && ts.isExportDeclaration(statement)) {
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
      // namespace 公開は名前が付け替わったわけではないので注記しない。
      // 元の名前も公開名も宣言から来る。backtick で囲んだだけでは Vue の補間が
      // 式として実行されるので、公開名の見出しと同じく `<code v-pre>` に入れる。
      const note =
        aliased && !namespaceExport
          ? `${inlineCode(symbol.getName())} を ${inlineCode(name)} として公開しています。`
          : null;
      return { code: statement, source: null, note };
    }
  }

  const node = declaration ?? symbol.declarations?.[0] ?? symbol.valueDeclaration;
  if (!node) return { code: `export declare const ${name}: unknown;`, source: null, note: null };

  const sourceFileName = node.getSourceFile().fileName;
  const code = emittedDeclaration(emitted, sourceFileName, symbol.getName()) ?? fallbackDeclaration(node);

  const declarationPath = repoRelativePosix(sourceFileName);
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

/**
 * JSDoc の説明文を Markdown へ埋める形にする。
 *
 * 実装が書いた prose なので backtick は markdown として活かす。生 HTML と Vue の
 * 補間だけを止める。改行は空白へ畳む。畳まないと、複数行の説明が表や見出しの
 * 途中で改行して以降の構造を壊す。
 *
 * 畳んだ結果は 1 行になり、その行は `contractEntry` で行頭に置かれる。行頭の
 * backtick 3 連は fence として開き、直後に続く宣言の code block を丸ごと取り込む。
 * 先頭の backtick 列だけ実体参照へ写して、fence にならないようにする。
 */
function documentation(checker, symbol) {
  const folded = ts
    .displayPartsToString(symbol.getDocumentationComment(checker))
    .replaceAll(/\s+/g, ' ')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('{{', '&#123;&#123;')
    .replaceAll('}}', '&#125;&#125;')
    .trim();
  return neutralizeLeadingFence(folded);
}

// 表のセルに入れる値の畳み込みと escape は docs-sync-safety の tableCell に集約した。
// 以前は縦棒だけを escape していたので、throw の引数に書かれた raw HTML や Vue の
// 波括弧が、HTML を有効にした VitePress でそのまま active markup として働いた。

/**
 * throw の第 1 引数を表に載せる形にする。
 *
 * 文字列 literal と template literal は、囲みの引用符を外した中身だけを見せる。
 * 引用符ごと載せると、表示が「引用符に囲まれた文字列」になって message そのものより
 * 読みにくい。substitution を持つ template literal は `${...}` を残す。実行時に何が
 * 埋まるかは source を見ないと分からないので、source の形のまま示す。
 */
function diagnosticMessage(argument, sourceFile) {
  if (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument)) {
    return argument.text;
  }
  const text = argument.getText(sourceFile);
  if (ts.isTemplateExpression(argument)) return text.replace(/^`/, '').replace(/`$/, '');
  return text;
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
          message: tableCodeCell(diagnosticMessage(node.expression.arguments[0], sourceFile)),
          path: repoRelativePosix(sourceFile.fileName),
          url: sourceUrl(sourceFile.fileName, sourceLine(sourceFile, node)),
        });
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
  if (errors.length === 0) return '';
  errors.sort((a, b) => a.path.localeCompare(b.path) || a.url.localeCompare(b.url));
  const rows = errors.map(
    (error) => `| ${error.message} | [${escapeMarkdownText(error.path)}](${error.url}) |`,
  );
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
  // 公開名と source path は TypeScript の宣言から来る。TypeScript は文字列の
  // export 名を許すので、backtick で囲んだだけでは Vue の補間が式として実行される。
  // inlineCode は escape 済み text を `<code v-pre>` に入れて両方を止める。
  const source = contract.source
    ? `[ソース宣言](${contract.source.url}) ${inlineCode(contract.source.path)}`
    : '公開 entry point から解決しています。';
  const note = contract.note ? `\n\n${contract.note}` : '';
  const description = contract.description ? `\n\n${contract.description}` : '';
  // 固定長の fence は、閉じ fence を含む文字列 literal を持つ宣言で block を途中で
  // 閉じ、以降の宣言を本文として描画させる。codeBlock は中身より長い fence で開く。
  return `#### ${inlineCode(contract.name)}\n\n${source}${note}${description}\n\n${codeBlock(contract.code, 'ts')}`;
}

function group(title, contracts) {
  if (contracts.length === 0) return '';
  return `### ${title}\n\n${contracts.map(contractEntry).join('\n\n')}`;
}

function section(library, contracts, diagnostics) {
  const values = contracts.filter((contract) => contract.kind === 'value');
  const types = contracts.filter((contract) => contract.kind === 'type');
  // library は directory 名から来る。encode しないと、名前に `)` や改行を含む
  // checkout で link を閉じて後続を本文として描画させられる。
  const source = `https://github.com/cardene777/kiwa/blob/main/packages/${linkPath(library)}/src/index.ts`;
  return `${start}\n${diagnostics ? `${diagnostics}\n\n` : ''}## API 契約\n\nこの section は [公開 entry point](${source}) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。\n\n${group('値', values)}\n\n${group('型', types)}\n${end}`;
}

/**
 * 管理ブロックを 1 回だけ差し替える。marker が 1 組そろっていない reference.md は
 * DocsSyncError で止める。以前は最初の start marker と最初の end marker を無条件に
 * 置換していたので、正規 marker より前に stray marker があるとその間の手書き本文が消えた。
 */
function replace(content, replacement, label) {
  return replaceManagedBlock(content, {
    startMarker: start,
    endMarker: end,
    block: replacement,
    insert: (body, block) => `${body.replace(/\s*$/, '')}\n\n${block}\n`,
    label,
  });
}

/**
 * 依存の型定義を置いてよい場所。実体で持つ。
 *
 * `node_modules` が repo の外の store を指す構成があるため、repo の内側判定だけでは
 * 正当な依存まで弾いてしまう。許可するのはここで列挙した root の内側だけにする。
 */
function dependencyStoreRoots() {
  const roots = [];
  for (const candidate of [join(repositoryRoot, 'node_modules')]) {
    try {
      roots.push(realpathSync(candidate));
    } catch {
      // 無ければ許可対象も無い。
    }
  }
  return roots;
}

/**
 * TypeScript が実際に読んだ source が repo の内側に収まっているかを確かめる。
 *
 * entry point の path を検証しても、そこから辿る import graph は TypeScript が自分で
 * 読む。checkout に外を指す link を置くか `../../` で外へ出る import を書けば、repo の
 * 外にある宣言と JSDoc が生成物へ流れ込む。書き込む前に program 全体を見て止める。
 *
 * 依存の型定義は repo の外にある store を指すので対象から外す。ただし除外の判定は
 * 実体を取ってから行う。名乗りの path に `/node_modules/` を含めるだけで検証を
 * 迂回できてしまうため、文字列一致で先に除外してはいけない。
 */
function assertProgramInsideRepository(program) {
  const dependencyRoots = dependencyStoreRoots();
  const outside = [];
  for (const sourceFile of program.getSourceFiles()) {
    let real;
    try {
      real = realpathSync(sourceFile.fileName);
    } catch {
      // 実体を確かめられない path は判断できないので、内側と見なさない。
      outside.push(sourceFile.fileName);
      continue;
    }
    if (insideRoot(repositoryRoot, real)) continue;
    // 実体が許可した dependency store の内側なら、宣言 file に限って通す。
    if (sourceFile.isDeclarationFile && dependencyRoots.some((root) => insideRoot(root, real))) {
      continue;
    }
    outside.push(`${sourceFile.fileName} -> ${real}`);
  }
  if (outside.length === 0) return;
  throw new DocsSyncError(
    `the compiler read ${outside.length} file(s) outside ${repositoryRoot}; refusing to generate.\n` +
      outside.slice(0, 10).map((path) => `  ${path}`).join('\n'),
  );
}

function main() {
  const targets = collectTargets();
  if (targets.length === 0) {
    throw new DocsSyncError('No library reference targets found.');
  }

  const { program, emitted } = buildProgram(targets.map((target) => target.entry));

  // module 解決に失敗したまま書き込むと、型が unknown へ劣化した契約が公開される。
  // 生成前に落とす。
  const unresolved = ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.code === 2307)
    .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '));
  if (unresolved.length > 0) {
    throw new DocsSyncError(
      'Module resolution failed; refusing to write degraded API contracts.\n' +
        [...new Set(unresolved)].slice(0, 10).map((message) => `  ${message}`).join('\n'),
    );
  }

  assertProgramInsideRepository(program);

  // 第 1 段 = 全 target を読んで検証し、書く内容を組み立てるだけ。
  // 最後の target が壊れていた時に先行 target だけ更新された生成物が残るのを避ける。
  const plans = [];
  // 検査だけの実行で、commit された内容と生成結果が食い違った library。
  const stale = [];
  for (const target of targets) {
    const label = `${target.library} reference.md`;
    const contracts = contractsFrom(program, emitted, target.library, target.entry);
    const diagnostics = errorDiagnostics(program, target.library);
    // 読み書きとも canonical path で許可 root の内側を確かめる。どちらの API も
    // symlink を追うので、checkout に link を 1 本置くだけで repo の外を読み書きできる。
    const content = readFileSync(resolveReadPath(target.reference, repositoryRoot, label), 'utf8');
    const updated = replace(content, section(target.library, contracts, diagnostics), label);
    if (!write) {
      if (content !== updated) stale.push(target.library);
      continue;
    }
    plans.push({
      // 書き込み先の検証もここで済ませる。write loop に残すと、後ろの target が
      // repo の外を指す link だった時に先行 target だけ更新された状態で止まる。
      target: prepareWritePath(target.reference, repositoryRoot, label),
      content: updated,
    });
  }

  if (!write) {
    if (stale.length > 0) {
      console.error('Generated API references are out of date:');
      for (const library of stale.sort()) console.error(`  ${library}`);
      console.error('Run `pnpm docs:api-reference:write` and commit the result.');
      process.exitCode = 1;
      return;
    }
    console.log(`Detailed API contracts are up to date for ${targets.length} library references.`);
    return;
  }

  // 第 2 段 = 全件の検証を通ってから書く。
  for (const plan of plans) {
    writeFileAtomic(plan.target, plan.content);
  }
  console.log(`Synchronized detailed API contracts for ${plans.length} library references.`);
}

try {
  main();
} catch (error) {
  // 壊れた marker と repo の外を指す path は、直すまで生成を続けない。
  if (error instanceof DocsSyncError) {
    console.error(error.message);
    process.exitCode = 1;
  } else {
    throw error;
  }
}
