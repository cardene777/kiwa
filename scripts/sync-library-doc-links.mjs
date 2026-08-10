#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { deadDocumentLinks, unsupportedLinkSyntax } from './docs-link-check.mjs';
import {
  DocsSyncError,
  linkPath,
  prepareWritePath,
  replaceManagedBlock,
  resolveReadPath,
  writeFileAtomic,
} from './docs-sync-safety.mjs';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const packagesRoot = join(repositoryRoot, 'packages');
const librariesRoot = join(repositoryRoot, 'docs', 'libraries');
const write = process.argv.includes('--write');
const startMarker = '<!-- kiwa-docs:start -->';
const endMarker = '<!-- kiwa-docs:end -->';

function siteLibraries() {
  const entries = [];
  for (const category of readdirSync(librariesRoot, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    // The native-language projects are standalone, not the similarly named
    // TypeScript adapter packages.
    if (category.name === 'native-languages') continue;
    const categoryPath = join(librariesRoot, category.name);
    for (const library of readdirSync(categoryPath, { withFileTypes: true })) {
      if (!library.isDirectory()) continue;
      const libraryPath = join(categoryPath, library.name);
      const required = ['index.md', 'quickstart.md', 'how-to.md', 'reference.md'];
      if (!required.every((file) => existsSync(join(libraryPath, file)))) continue;
      const packagePath = join(packagesRoot, library.name);
      if (!existsSync(join(packagePath, 'package.json'))) continue;
      // manifest も link を追って読まれる。package 名の出どころを repo 内に閉じる。
      const manifestPath = join(packagePath, 'package.json');
      const packageJson = JSON.parse(
        readFileSync(
          resolveReadPath(manifestPath, repositoryRoot, `${library.name} package.json`),
          'utf8',
        ),
      );
      entries.push({
        category: category.name,
        directory: library.name,
        packagePath,
        packageName: packageJson.name,
        docsPath: libraryPath,
      });
    }
  }
  return entries.sort((a, b) => a.packageName.localeCompare(b.packageName));
}

function linksFor(entry, fromDirectory) {
  // path 片は directory 名から来るので、link destination を途中で閉じる文字は
  // encode してから埋める。
  const sourceDirectory = linkPath(`${relative(fromDirectory, entry.docsPath) || '.'}/`);
  const publicBase =
    `https://cardene777.github.io/kiwa/libraries/${linkPath(entry.category)}/${linkPath(entry.directory)}/`;
  return [
    `- [概要](${publicBase})`,
    `- [はじめる](${publicBase}quickstart)`,
    `- [使い方](${publicBase}how-to)`,
    `- [リファレンス](${publicBase}reference)`,
    '',
    `編集元は [docs/libraries/${entry.category}/${entry.directory}](${sourceDirectory}) です。`,
  ].join('\n');
}

function managedSection(entry, fromDirectory) {
  return [
    startMarker,
    '## Documentation',
    '',
    '公開ドキュメントを正本として管理しています。',
    '',
    linksFor(entry, fromDirectory),
    endMarker,
  ].join('\n');
}

/**
 * 管理ブロックが無い file への差し込み位置。License 見出しの手前に置き、
 * 見出しが無ければ末尾へ足す。
 */
function insertManagedSection(content, section) {
  const licenseHeading = content.match(/^## License\b/m);
  if (licenseHeading?.index !== undefined) {
    const before = content.slice(0, licenseHeading.index).replace(/\s*$/, '');
    const after = content.slice(licenseHeading.index).replace(/^\s*/, '');
    return `${before}\n\n${section}\n\n${after}`;
  }
  return `${content.replace(/\s*$/, '')}\n\n${section}\n`;
}

/**
 * 管理ブロックを 1 回だけ差し替える。marker が 1 組そろっていない file は
 * DocsSyncError で止める。以前は marker を見つけた分だけ再帰的に剥がしていたので、
 * end marker だけ残った README は実行のたびにブロックが増え、start marker だけの
 * README は 2 回目の実行で本文を失っていた。
 */
function replaceManagedSection(content, section, label) {
  return replaceManagedBlock(content, {
    startMarker,
    endMarker,
    block: section,
    insert: insertManagedSection,
    label,
  });
}

function expectedDocsReadme(entry) {
  const directory = join(entry.packagePath, 'docs');
  return [
    `# ${entry.packageName} documentation`,
    '',
    managedSection(entry, directory),
    '',
  ].join('\n');
}

function withSingleFinalNewline(content) {
  return `${content.replace(/\s*$/, '')}\n`;
}

/** repo 内にあることを確かめてから読む。file が無ければ fallback を返す。 */
function readInsideRepo(path, label, fallback) {
  if (!existsSync(path)) return fallback;
  return readFileSync(resolveReadPath(path, repositoryRoot, label), 'utf8');
}

function main() {
  // 切れた link は生成では直せないので、--write の有無に関わらず止める。
  // 書く前に返すのは、生成物の同期と docs の破れを同じ run で混ぜないため。
  //
  // 対象は docs/ 全体。以前は docs/libraries に絞っていたが、その外の 207 件を
  // #1877 で片付けた後は止まる対象が 0 件になり、絞る理由が無くなった。統合 test が
  // 既に docs/ 全体を見ているので、範囲を揃えないと同じ検査が 2 経路で食い違う。
  //
  // 解釈できない記法も同じ扱いにする。検査できないものを黙って通すと、覆っていない
  // 範囲が「破れ無し」 として報告される。
  const docsRoot = join(repositoryRoot, 'docs');
  const dead = [
    ...deadDocumentLinks({ repositoryRoot, docsRoot, scanRoot: docsRoot }),
    ...unsupportedLinkSyntax({ repositoryRoot, scanRoot: docsRoot }),
  ];
  if (dead.length > 0) {
    console.error(dead.join('\n'));
    process.exitCode = 1;
    return;
  }

  const entries = siteLibraries();
  const errors = [];
  const plans = [];

  // 第 1 段 = 全 package を読んで検証し、書く内容を組み立てるだけ。
  // 途中で 1 件でも異常があれば、ここで例外が上がって 1 file も書かれない。
  // 検証と書き込みを package ごとに交互に行うと、最後の package が壊れていた時に
  // 先行 package だけ更新された生成物が残る。
  for (const entry of entries) {
    const readmePath = join(entry.packagePath, 'README.md');
    const docsDirectory = join(entry.packagePath, 'docs');
    const docsReadmePath = join(docsDirectory, 'README.md');
    const readmeLabel = `${entry.packageName} README.md`;
    const docsReadmeLabel = `${entry.packageName} docs/README.md`;

    const readme = readInsideRepo(readmePath, readmeLabel, `# ${entry.packageName}\n`);
    const updatedReadme = withSingleFinalNewline(
      replaceManagedSection(readme, managedSection(entry, entry.packagePath), readmeLabel),
    );
    const docsReadme = readInsideRepo(docsReadmePath, docsReadmeLabel, '');
    const updatedDocsReadme = withSingleFinalNewline(
      docsReadme
        ? replaceManagedSection(docsReadme, managedSection(entry, docsDirectory), docsReadmeLabel)
        : expectedDocsReadme(entry),
    );

    if (readme !== updatedReadme) {
      if (write) {
        // 書き込み先の検証もここで済ませる。write loop に残すと、後ろの package が
        // repo の外を指す link だった時に先行 package だけ更新された状態で止まる。
        plans.push({
          target: prepareWritePath(readmePath, repositoryRoot, readmeLabel),
          content: updatedReadme,
        });
      } else {
        errors.push(`README link is out of date: ${entry.packageName}`);
      }
    }
    if (docsReadme !== updatedDocsReadme) {
      if (write) {
        // prepareWritePath は親 directory の実体を確かめるので、先に作る。
        if (!existsSync(docsDirectory)) mkdirSync(docsDirectory, { recursive: true });
        plans.push({
          target: prepareWritePath(docsReadmePath, repositoryRoot, docsReadmeLabel),
          content: updatedDocsReadme,
        });
      } else {
        errors.push(`docs README link is out of date: ${entry.packageName}`);
      }
    }
  }

  // 第 2 段 = 全件の検証を通ってから書く。
  for (const plan of plans) {
    writeFileAtomic(plan.target, plan.content);
  }

  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
    return;
  }
  console.log(`Documentation links are synchronized for ${entries.length} packages.`);
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
