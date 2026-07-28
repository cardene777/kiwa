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
import ts from 'typescript';

import { DocsSyncError, resolveReadPath } from './docs-sync-safety.mjs';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const packagesRoot = join(repositoryRoot, 'packages');
const librariesRoot = join(repositoryRoot, 'docs', 'libraries');
const configPath = join(repositoryRoot, 'docs', '.vitepress', 'config.mts');

// standalone な native project の置き場。TypeScript の package を持たないので
// package との対応は取らないが、文書そのものの有無と置き場所は検査する。
const STANDALONE_CATEGORY = 'native-languages';

// 通常の対応検査から外す文書。値は期待する置き場所。
//
// 「package を持たない」ことだけを許可すると、置き場所が変わっても検査を通る。
// config.mts は分類ごとに固定の link を書くため、移動すれば link が切れる。
// 期待する分類まで持たせて、存在と置き場所の両方を確かめる。
//
// 名前だけを key にすると `languages/python` (TypeScript の adapter) と
// `native-languages/python` (standalone な native project) が衝突する。
// 別物なので分類と組にして区別する。
const EXEMPT_DOCUMENTS = new Map([
  // 全体をまとめて説明する入口。sidebar では別名の entry として扱われる。
  ['foundation/kiwa', 'foundation'],
  // standalone な native project。同名の adapter package とは別物。
  [`${STANDALONE_CATEGORY}/go`, STANDALONE_CATEGORY],
  [`${STANDALONE_CATEGORY}/python`, STANDALONE_CATEGORY],
  [`${STANDALONE_CATEGORY}/rust`, STANDALONE_CATEGORY],
]);

/** 特例かどうか。分類と名前の組で見る。 */
function isExempt(category, name) {
  return EXEMPT_DOCUMENTS.has(`${category}/${name}`);
}

// ライブラリ文書が持つべきページ。1 つでも欠けると生成 script が対象から外すため、
// directory の存在だけでは「文書がある」と判断できない。
const REQUIRED_PAGES = ['index.md', 'quickstart.md', 'how-to.md', 'reference.md'];

const scope = '@kiwa-lab';

/** 正本。各 package の manifest の name が対象 scope のものを集める。 */
function sourcePackages(problems) {
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
function libraryDocuments(problems) {
  // 特例は分類ごと別物として扱うので、通常の対応検査に載せる分だけを集める。
  const documents = new Map();
  const exempt = new Set();
  for (const category of readdirSync(librariesRoot, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    for (const library of readdirSync(join(librariesRoot, category.name), { withFileTypes: true })) {
      if (!library.isDirectory()) continue;
      const missing = REQUIRED_PAGES.filter(
        (page) => !existsSync(join(librariesRoot, category.name, library.name, page)),
      );
      if (missing.length > 0) {
        problems.push(
          `${library.name}: docs/libraries/${category.name}/${library.name}/ is missing ` +
            `${missing.join(', ')}`,
        );
      }
      if (isExempt(category.name, library.name)) {
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
 * sidebar の分類定義。`config.mts` の `libraryCategories` を読む。
 *
 * 文字列を置換して JSON にすると、値の中の記号で壊れる。`text: 'AI: リアルタイム'` の
 * ような値や、既に quote された key がその例になる。TypeScript の parser に構文を
 * 解かせて、必要な literal だけを取り出す。config を import して実行はしない。
 */
function sidebarCategories() {
  const label = 'docs/.vitepress/config.mts';
  const source = readFileSync(resolveReadPath(configPath, repositoryRoot, label), 'utf8');
  const parsed = ts.createSourceFile(label, source, ts.ScriptTarget.ES2022, true);

  let literal = null;
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'libraryCategories' &&
      node.initializer &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      literal = node.initializer;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(parsed);

  if (!literal) {
    throw new DocsSyncError(
      `${label}: could not find the libraryCategories array literal. ` +
        `Update scripts/check-docs-consistency.mjs when the shape of the definition changes.`,
    );
  }

  const slugs = new Map();
  const duplicated = [];
  for (const element of literal.elements) {
    if (!ts.isObjectLiteralExpression(element)) {
      throw new DocsSyncError(`${label}: libraryCategories contains a non-literal entry.`);
    }
    const slug = stringProperty(element, 'slug', label);
    for (const name of stringArrayProperty(element, 'packages', label)) {
      const seen = slugs.get(name);
      // 同じ package を 2 つの分類に置くと、上書きした側だけが残って余分な定義を
      // 見逃す。両方の分類を挙げて報告する。
      if (seen !== undefined) duplicated.push(`${name}: listed under both ${seen} and ${slug}`);
      else slugs.set(name, slug);
    }
  }
  return { slugs, duplicated };
}

/** object literal の文字列 property を取り出す。 */
function stringProperty(object, key, label) {
  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    if (propertyName(property) !== key) continue;
    if (!ts.isStringLiteralLike(property.initializer)) {
      throw new DocsSyncError(`${label}: ${key} is not a string literal.`);
    }
    return property.initializer.text;
  }
  throw new DocsSyncError(`${label}: a libraryCategories entry has no ${key}.`);
}

/** object literal の文字列配列 property を取り出す。 */
function stringArrayProperty(object, key, label) {
  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    if (propertyName(property) !== key) continue;
    if (!ts.isArrayLiteralExpression(property.initializer)) {
      throw new DocsSyncError(`${label}: ${key} is not an array literal.`);
    }
    return property.initializer.elements.map((element) => {
      if (!ts.isStringLiteralLike(element)) {
        throw new DocsSyncError(`${label}: ${key} contains a non-string entry.`);
      }
      return element.text;
    });
  }
  throw new DocsSyncError(`${label}: a libraryCategories entry has no ${key}.`);
}

/** property 名。identifier でも quote 済みの文字列でも同じ形で返す。 */
function propertyName(property) {
  if (ts.isIdentifier(property.name)) return property.name.text;
  if (ts.isStringLiteralLike(property.name)) return property.name.text;
  return null;
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
  const problems = [];
  const packages = sourcePackages(problems);
  const { documents, exempt } = libraryDocuments(problems);
  const { slugs: sidebar, duplicated } = sidebarCategories();
  problems.push(...duplicated);
  const tests = documentedPackages();

  for (const name of packages) {
    if (!documents.has(name)) {
      problems.push(`${name}: no library document under docs/libraries/<category>/${name}/`);
    }
    if (!sidebar.has(name)) {
      problems.push(`${name}: missing from libraryCategories in docs/.vitepress/config.mts`);
    }
    if (!tests.has(name)) {
      problems.push(`${name}: no packages/${name}/tests/docs-library-${name}.test.ts`);
    }
  }

  // 特例の文書は package を持たないが、置き場所は決まっている。移動しても検査を
  // 通ると、分類ごとに固定 link を書く sidebar と食い違う。
  for (const path of EXEMPT_DOCUMENTS.keys()) {
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
