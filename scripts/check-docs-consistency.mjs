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
import { definitionKeys } from '../docs/.vitepress/library-sidebar.mjs';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const packagesRoot = join(repositoryRoot, 'packages');
const librariesRoot = join(repositoryRoot, 'docs', 'libraries');

/**
 * 分類の正本を読む。
 *
 * import ではなく読み込んで parse する。import は評価を伴うので、正本が repo の外を
 * 指す link に差し替えられていたり、副作用を持つ module に化けていたりしても、
 * 実行してから気付くことになる。他の読み込みと同じ guard を通す。
 */
function loadDefinition() {
  const label = 'docs/libraries.json';
  const path = join(repositoryRoot, 'docs', 'libraries.json');
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(resolveReadPath(path, repositoryRoot, label), 'utf8'));
  } catch (error) {
    if (error instanceof DocsSyncError) throw error;
    throw new DocsSyncError(`${label}: cannot read the definition: ${error.message}`);
  }
  // 揃っているべき key の一覧は sidebar 側と共有する。この検査 script が使わないもの
  // (sidebar だけが読む `documentKinds` と `standaloneCategory`) も含まれる。
  for (const key of definitionKeys) {
    if (parsed[key] === undefined) throw new DocsSyncError(`${label}: ${key} is missing.`);
  }
  return parsed;
}

/**
 * 別枠で扱う文書の置き場所。`分類/名前` を key にする。
 *
 * 名前だけを key にすると `languages/python` (TypeScript のアダプター) と
 * `native-languages/python` (単独の native プロジェクト) が衝突する。別物なので
 * 分類と組にして区別する。
 */
function exemptPaths(definition) {
  return new Map(
    definition.exemptDocuments.map((document) => [
      `${document.category}/${document.name}`,
      document.category,
    ]),
  );
}

/** 正本。各 package の manifest の name が対象 scope のものを集める。 */
function sourcePackages(problems, scope) {
  const names = new Set();
  for (const entry of readdirSync(packagesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifest = join(packagesRoot, entry.name, 'package.json');
    if (!existsSync(manifest)) continue;
    const label = `${entry.name} package.json`;
    const name = JSON.parse(
      readFileSync(resolveReadPath(manifest, repositoryRoot, label), 'utf8'),
    ).name;
    if (typeof name !== 'string' || !name.startsWith(`${scope}/`)) continue;
    // manifest を正本と呼ぶ以上、名前と directory 名の一致まで見る。ずれていると
    // 文書と sidebar と test は directory 名で揃っているのに、公開される package 名
    // だけが違う状態を見逃す。
    if (name !== `${scope}/${entry.name}`) {
      problems.push(`${entry.name}: packages/${entry.name}/package.json declares ${name}`);
      continue;
    }
    names.add(entry.name);
  }
  return names;
}

/**
 * docs 側のライブラリ文書。`docs/libraries/<category>/<library>/` を集める。
 *
 * 必要なページが 1 つでも欠けている文書は「不完全」として報告する。生成 script は
 * ページの揃った文書だけを対象にするため、reference.md を消しても走査から外れて
 * 黙って成功してしまう。directory の存在では足りない。
 *
 * 同じ名前の文書が複数の分類に置かれた場合も報告する。Map へ入れるだけだと
 * 最後の 1 件が残り、余分な文書があっても最後の分類さえ合っていれば通る。
 */
function libraryDocuments(problems, definition) {
  const exemptDocumentPaths = exemptPaths(definition);
  const requiredPages = definition.requiredPages;
  // 別枠の文書は分類ごと別物として扱うので、通常の対応検査に載せる分だけを集める。
  const documents = new Map();
  const exempt = new Set();
  for (const category of readdirSync(librariesRoot, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    for (const library of readdirSync(join(librariesRoot, category.name), { withFileTypes: true })) {
      if (!library.isDirectory()) continue;
      const missing = requiredPages.filter(
        (page) => !existsSync(join(librariesRoot, category.name, library.name, page)),
      );
      if (missing.length > 0) {
        problems.push(
          `${library.name}: docs/libraries/${category.name}/${library.name}/ is missing ` +
            `${missing.join(', ')}`,
        );
      }
      if (exemptDocumentPaths.has(`${category.name}/${library.name}`)) {
        exempt.add(`${category.name}/${library.name}`);
        continue;
      }
      const seen = documents.get(library.name);
      if (seen !== undefined) {
        problems.push(`${library.name}: has documents under both ${seen}/ and ${category.name}/`);
        continue;
      }
      documents.set(library.name, category.name);
    }
  }
  return { documents, exempt };
}

/**
 * 分類ごとの package 一覧を、package 名から分類を引ける形にする。
 *
 * 同じ package が複数の分類に載ると、Map へ入れるだけでは上書きした側しか残らない。
 * 重複は別に集めて報告する。
 */
function sidebarCategories(definition) {
  const slugs = new Map();
  const duplicated = [];
  for (const category of definition.libraryCategories) {
    for (const name of category.packages) {
      const seen = slugs.get(name);
      if (seen !== undefined) {
        duplicated.push(`${name}: listed under both ${seen} and ${category.slug}`);
      } else {
        slugs.set(name, category.slug);
      }
    }
  }
  return { slugs, duplicated };
}

/**
 * ライブラリ文書テストを持つ package。
 *
 * 名前は package と一致していることまで見る。`docs-library-*` で受けると、
 * rename 後に残った古い名前の test が新しい package の分として数えられる。
 */
function documentedPackages() {
  const names = new Set();
  for (const entry of readdirSync(packagesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const testDirectory = join(packagesRoot, entry.name, 'tests');
    if (!existsSync(testDirectory)) continue;
    // 他の読み込みと同じく、実体が repo の内側にあることを確かめてから列挙する。
    const label = `${entry.name} tests`;
    const canonical = resolveReadPath(testDirectory, repositoryRoot, label);
    const expected = new Set([
      `docs-library-${entry.name}.test.ts`,
      `docs-library-${entry.name}.test.tsx`,
    ]);
    if (readdirSync(canonical).some((file) => expected.has(file))) names.add(entry.name);
  }
  return names;
}

function main() {
  const definition = loadDefinition();
  const problems = [];
  const packages = sourcePackages(problems, definition.packageScope);
  const { documents, exempt } = libraryDocuments(problems, definition);
  const { slugs: sidebar, duplicated } = sidebarCategories(definition);
  problems.push(...duplicated);
  const tests = documentedPackages();

  for (const name of packages) {
    if (!documents.has(name)) {
      problems.push(`${name}: no library document under docs/libraries/<category>/${name}/`);
    }
    if (!sidebar.has(name)) {
      problems.push(`${name}: missing from libraryCategories in docs/libraries.json`);
    }
    if (!tests.has(name)) {
      problems.push(`${name}: no packages/${name}/tests/docs-library-${name}.test.ts`);
    }
  }

  // 特例の文書は package を持たないが、置き場所は決まっている。移動しても検査を
  // 通ると、分類ごとに固定 link を書く sidebar と食い違う。
  for (const path of exemptPaths(definition).keys()) {
    if (!exempt.has(path)) problems.push(`${path}: docs/libraries/${path}/ is missing`);
  }

  for (const [name, category] of documents) {
    if (packages.has(name)) continue;
    problems.push(
      `${name}: docs/libraries/${category}/${name}/ has no package under packages/${name}`,
    );
  }

  for (const [name, slug] of sidebar) {
    if (!packages.has(name)) {
      problems.push(`${name}: listed in docs/libraries.json but has no package under packages/`);
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
    for (const problem of [...new Set(problems)].sort()) console.error(`  ${problem}`);
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
