#!/usr/bin/env node

// package 構成と生成物の対応がずれていないかを検査する。
//
// 生成 script は docs 側を起点に走るため、package を足しても対応する文書が無ければ
// 黙って無視し、package を消しても文書は残り続ける。どちらも生成は成功と報告する。
// ここでは packages 側を正本に置いて 4 つの集合を突き合わせ、1 つでも欠けたら
// 非 0 で終わる。
//
//   node scripts/check-docs-consistency.mjs

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DocsSyncError, resolveReadPath } from './docs-sync-safety.mjs';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const packagesRoot = join(repositoryRoot, 'packages');
const librariesRoot = join(repositoryRoot, 'docs', 'libraries');
const configPath = join(repositoryRoot, 'docs', '.vitepress', 'config.mts');

// standalone な native project で、TypeScript の package を持たない。
// 同名の adapter package (languages/python 等) とは別物なので、対応検査から外す。
const STANDALONE_CATEGORY = 'native-languages';

// packages 側に実体を持たないが docs を持つ入口。全体をまとめて説明するページで、
// sidebar では config.mts が別名の entry として特別扱いしている。
const UMBRELLA_LIBRARIES = new Set(['kiwa']);

const scope = '@kiwa-lab';

/** 正本。各 package の manifest の name が対象 scope のものを集める。 */
function sourcePackages() {
  const names = new Set();
  for (const entry of readdirSync(packagesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifest = join(packagesRoot, entry.name, 'package.json');
    if (!existsSync(manifest)) continue;
    const label = `${entry.name} package.json`;
    const name = JSON.parse(
      readFileSync(resolveReadPath(manifest, repositoryRoot, label), 'utf8'),
    ).name;
    if (typeof name === 'string' && name.startsWith(`${scope}/`)) names.add(entry.name);
  }
  return names;
}

/** docs 側のライブラリ文書。`docs/libraries/<category>/<library>/` を集める。 */
function libraryDocuments() {
  const documents = new Map();
  for (const category of readdirSync(librariesRoot, { withFileTypes: true })) {
    if (!category.isDirectory() || category.name === STANDALONE_CATEGORY) continue;
    for (const library of readdirSync(join(librariesRoot, category.name), { withFileTypes: true })) {
      if (!library.isDirectory()) continue;
      documents.set(library.name, category.name);
    }
  }
  return documents;
}

/**
 * sidebar の分類定義。`config.mts` の `libraryCategories` を読む。
 *
 * TypeScript のまま読むので、配列 literal の部分だけを取り出して評価する。
 * 定義の形が変わればここで落ちる。黙って空集合になるより落ちるほうがよい。
 */
function sidebarCategories() {
  const label = 'docs/.vitepress/config.mts';
  const source = readFileSync(resolveReadPath(configPath, repositoryRoot, label), 'utf8');
  const matched = source.match(/const libraryCategories: LibraryCategory\[\] = (\[[\s\S]*?\n\]);/);
  if (!matched) {
    throw new DocsSyncError(
      `${label}: could not find the libraryCategories array. ` +
        `Update scripts/check-docs-consistency.mjs when the shape of the definition changes.`,
    );
  }
  const categories = JSON.parse(
    matched[1]
      // TypeScript の literal を JSON にする。key の quote と単引用符と末尾の comma。
      .replace(/(\w+):/g, '"$1":')
      .replaceAll("'", '"')
      .replace(/,(\s*[}\]])/g, '$1'),
  );
  const slugs = new Map();
  for (const category of categories) {
    for (const name of category.packages) slugs.set(name, category.slug);
  }
  return slugs;
}

/** ライブラリ文書テスト。`packages/<name>/tests/docs-library-<name>.test.ts(x)` を持つか。 */
function documentedPackages() {
  const names = new Set();
  for (const entry of readdirSync(packagesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const testDirectory = join(packagesRoot, entry.name, 'tests');
    if (!existsSync(testDirectory)) continue;
    const hasTest = readdirSync(testDirectory).some((file) =>
      /^docs-library-.+\.test\.tsx?$/.test(file),
    );
    if (hasTest) names.add(entry.name);
  }
  return names;
}

function main() {
  const packages = sourcePackages();
  const documents = libraryDocuments();
  const sidebar = sidebarCategories();
  const tests = documentedPackages();

  const problems = [];

  for (const name of packages) {
    if (!documents.has(name)) {
      problems.push(`${name}: no library document under docs/libraries/<category>/${name}/`);
    }
    if (!sidebar.has(name)) {
      problems.push(`${name}: missing from libraryCategories in docs/.vitepress/config.mts`);
    }
    if (!tests.has(name)) {
      problems.push(`${name}: no packages/${name}/tests/docs-library-*.test.ts`);
    }
  }

  for (const [name, category] of documents) {
    if (packages.has(name) || UMBRELLA_LIBRARIES.has(name)) continue;
    problems.push(
      `${name}: docs/libraries/${category}/${name}/ has no package under packages/${name}`,
    );
  }

  for (const [name, slug] of sidebar) {
    if (!packages.has(name)) {
      problems.push(`${name}: listed in libraryCategories but has no package under packages/`);
      continue;
    }
    const actual = documents.get(name);
    if (actual && actual !== slug) {
      problems.push(`${name}: libraryCategories says ${slug} but the document sits under ${actual}`);
    }
  }

  for (const name of tests) {
    if (!packages.has(name)) {
      problems.push(`${name}: has a docs-library test but no package under packages/`);
    }
  }

  if (problems.length > 0) {
    console.error('Documentation and package layout disagree:');
    for (const problem of problems.sort()) console.error(`  ${problem}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Package layout and documentation agree for ${packages.size} packages ` +
      `(${documents.size} documents, ${sidebar.size} sidebar entries, ${tests.size} document tests).`,
  );
}

try {
  main();
} catch (error) {
  if (error instanceof DocsSyncError) {
    console.error(error.message);
    process.exitCode = 1;
  } else {
    throw error;
  }
}
