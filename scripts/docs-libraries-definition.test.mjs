// 共有の分類定義そのものを検査する。
//
// sidebar と整合検査の両方がこの file を読むので、定義に矛盾があると両方が同時に
// おかしくなる。突き合わせでは気付けない「定義の中だけで閉じた誤り」をここで押さえる。
//
//   node --test scripts/docs-libraries-definition.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const {
  documentKinds,
  exemptDocuments,
  libraryCategories,
  packageScope,
  requiredPages,
  standaloneCategory,
} = JSON.parse(readFileSync(join(repositoryRoot, 'docs', 'libraries.json'), 'utf8'));

test('every category has a slug, a label and at least one package', () => {
  for (const category of libraryCategories) {
    assert.equal(typeof category.slug, 'string', `${category.text}: slug`);
    assert.notEqual(category.slug, '', `${category.text}: slug is empty`);
    assert.equal(typeof category.text, 'string', `${category.slug}: text`);
    assert.notEqual(category.text, '', `${category.slug}: text is empty`);
    assert.equal(Array.isArray(category.packages), true, `${category.slug}: packages`);
    assert.notEqual(category.packages.length, 0, `${category.slug}: has no package`);
  }
});

test('category slugs are unique', () => {
  const slugs = libraryCategories.map((category) => category.slug);
  assert.deepEqual([...new Set(slugs)], slugs, 'a slug appears twice');
});

// 同じ package を 2 つの分類に置くと、sidebar は両方に出すが文書は 1 箇所にしかない。
test('no package is listed under two categories', () => {
  const seen = new Map();
  for (const category of libraryCategories) {
    for (const name of category.packages) {
      const previous = seen.get(name);
      assert.equal(previous, undefined, `${name}: listed under both ${previous} and ${category.slug}`);
      seen.set(name, category.slug);
    }
  }
});

test('package names inside a category are unique', () => {
  for (const category of libraryCategories) {
    const names = category.packages;
    assert.deepEqual([...new Set(names)], names, `${category.slug}: a package appears twice`);
  }
});

// 別枠で扱う文書は分類と組で識別する。名前だけで区別すると、同名で別物の 2 件
// (アダプターと単独プロジェクト) が衝突する。
test('exempt documents are identified by category and name', () => {
  const paths = exemptDocuments.map((document) => `${document.category}/${document.name}`);
  assert.deepEqual([...new Set(paths)], paths, 'an exempt document appears twice');
});

test('every exempt document carries a name, a category and a label', () => {
  for (const document of exemptDocuments) {
    assert.equal(typeof document.name, 'string', 'name');
    assert.notEqual(document.name, '', 'name is empty');
    assert.equal(typeof document.category, 'string', `${document.name}: category`);
    assert.notEqual(document.category, '', `${document.name}: category is empty`);
    assert.equal(typeof document.label, 'string', `${document.name}: label`);
    assert.notEqual(document.label, '', `${document.name}: label is empty`);
  }
});

// 別枠の文書は通常の分類か、単独プロジェクト用の分類のどちらかに属する。
// どちらでもない分類を書くと、sidebar のどこにも並ばない。
test('every exempt document sits in a category the sidebar renders', () => {
  const rendered = new Set([
    ...libraryCategories.map((category) => category.slug),
    standaloneCategory.slug,
  ]);
  for (const document of exemptDocuments) {
    assert.equal(
      rendered.has(document.category),
      true,
      `${document.name}: ${document.category} is not rendered anywhere`,
    );
  }
});

// 別枠の文書と通常の package が同じ名前を持つと、どちらの文書か決まらない。
test('no exempt document collides with a package in the same category', () => {
  for (const document of exemptDocuments) {
    const category = libraryCategories.find((entry) => entry.slug === document.category);
    if (!category) continue;
    assert.equal(
      category.packages.includes(document.name),
      false,
      `${document.name}: is both a package and an exempt document under ${document.category}`,
    );
  }
});

// sidebar の見出しにそのまま出る。空だと分類名の無い塊が公開される。
test('the standalone category has a slug and a label', () => {
  assert.equal(typeof standaloneCategory.slug, 'string');
  assert.notEqual(standaloneCategory.slug, '');
  assert.equal(typeof standaloneCategory.text, 'string');
  assert.notEqual(standaloneCategory.text, '');
});

// package 名は URL と directory 名になる。空や非文字列だと link が壊れる。
test('every package name is a non-empty string', () => {
  for (const category of libraryCategories) {
    for (const name of category.packages) {
      assert.equal(typeof name, 'string', `${category.slug}: a package name is not a string`);
      assert.notEqual(name, '', `${category.slug}: a package name is empty`);
    }
  }
});

// 単独プロジェクト用の分類には package を置かない。置くと package との突き合わせが走る。
test('the standalone category holds no package', () => {
  const found = libraryCategories.find((category) => category.slug === standaloneCategory.slug);
  assert.equal(found, undefined, 'the standalone category must not appear in libraryCategories');
});

// 呼び方は sidebar に出る。空だと項目が消えて見える。
test('every document kind has a label', () => {
  for (const kind of documentKinds) {
    assert.equal(typeof kind.slug, 'string', 'slug');
    assert.equal(typeof kind.text, 'string', `${kind.slug}: text`);
    assert.notEqual(kind.text, '', `${kind.slug}: text is empty`);
  }
});

test('document kind labels are in Japanese', () => {
  // 日本語のサイトなので、画面に出る呼び方は日本語に統一する。
  for (const kind of documentKinds) {
    assert.match(kind.text, /[ぁ-んァ-ヶ一-龠]/, `${kind.slug}: "${kind.text}" is not Japanese`);
  }
});

// 呼び方の並びと、文書が持つべき file の並びが対応していないと、sidebar の link が
// 存在しないページを指す。
test('document kinds line up with the required pages', () => {
  const fromKinds = documentKinds.map((kind) => (kind.slug === '' ? 'index.md' : `${kind.slug}.md`));
  assert.deepEqual(fromKinds, requiredPages);
});

test('the package scope is a namespace', () => {
  assert.match(packageScope, /^@[a-z0-9-]+$/);
});
