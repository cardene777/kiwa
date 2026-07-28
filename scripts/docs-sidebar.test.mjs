// sidebar の構造を検査する。
//
// 正本の値が sidebar へ届いているかは、これまでどの層も見ていなかった。
// 公開サイトの build は sidebar 項目の見出しを検証せずそのまま描画し、
// 正本の test は正本側の値だけを見て、整合検査は表示名を参照しない。
// 正本の key を rename して読む側を直し忘れると、見出しが消えたまま公開される。
//
// 組み立ては config と共有している (docs/.vitepress/library-sidebar.mjs)。
// ここで組み立てを書き直すと、実物とずれた時に自分の写像を検証するだけになる。
//
//   node --test scripts/docs-sidebar.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildLibrarySidebar } from '../docs/.vitepress/library-sidebar.mjs';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const definition = JSON.parse(
  readFileSync(join(repositoryRoot, 'docs', 'libraries.json'), 'utf8'),
);

const sidebar = buildLibrarySidebar(definition);

/** sidebar を再帰的に辿って全項目を平らにする。 */
function flatten(items) {
  const flat = [];
  for (const item of items) {
    flat.push(item);
    if (Array.isArray(item.items)) flat.push(...flatten(item.items));
  }
  return flat;
}

/** 分類の項目を見出しで引く。 */
function categoryNamed(text) {
  const found = flatten(sidebar).find((item) => item.text === text);
  assert.notEqual(found, undefined, `${text}: not found in the sidebar`);
  return found;
}

// 見出しが欠けた項目は、公開サイトで空欄として描画される。
// 正本の key を rename して読む側を直し忘れると、この形になる。
test('every sidebar item has a visible label', () => {
  for (const item of flatten(sidebar)) {
    assert.equal(typeof item.text, 'string', `${JSON.stringify(item)}: text is not a string`);
    assert.notEqual(item.text, '', `${JSON.stringify(item)}: text is empty`);
  }
});

test('every leaf item points somewhere', () => {
  for (const item of flatten(sidebar)) {
    if (Array.isArray(item.items)) continue;
    assert.equal(typeof item.link, 'string', `${item.text}: link is not a string`);
    assert.match(item.link, /^\/libraries\//, `${item.text}: link is outside /libraries/`);
  }
});

// 別枠で扱う文書の見出しは、正本の label がそのまま出る。
test('exempt documents keep their labels in the sidebar', () => {
  const labels = flatten(sidebar).map((item) => item.text);
  for (const document of definition.exemptDocuments) {
    assert.equal(
      labels.includes(document.label),
      true,
      `${document.name}: ${document.label} is missing`,
    );
  }
});

test('every package appears once with its namespace', () => {
  const labels = flatten(sidebar).map((item) => item.text);
  for (const category of definition.libraryCategories) {
    for (const name of category.packages) {
      const expected = `${definition.packageScope}/${name}`;
      assert.equal(labels.filter((label) => label === expected).length, 1, expected);
    }
  }
});

// 別枠の文書は分類の先頭 (カテゴリ概要の直後) に並ぶ。package の後ろに回ると
// 見出しの意味が変わる。
test('exempt documents come before the packages in their category', () => {
  const foundation = categoryNamed('基盤');
  assert.equal(foundation.items[0].text, 'カテゴリ概要');
  assert.equal(foundation.items[1].text, 'kiwa 全体');
  assert.match(foundation.items[2].text, /^@kiwa-lab\//);
});

// 単独プロジェクトの分類は package を持たず、カテゴリ概要と別枠の文書だけが並ぶ。
test('the standalone category holds only its exempt documents', () => {
  const standalone = categoryNamed(definition.standaloneCategory.text);
  assert.equal(standalone.items[0].text, 'カテゴリ概要');
  const rest = standalone.items.slice(1).map((item) => item.text);
  const expected = definition.exemptDocuments
    .filter((document) => document.category === definition.standaloneCategory.slug)
    .map((document) => document.label);
  assert.deepEqual(rest, expected);
});

// 概要ページの link は末尾のスラッシュで終わる。文書種別の slug が空文字であることに
// 依存しているので、正本を変えた時にここで気付ける。
test('the overview link ends with a slash', () => {
  const foundation = categoryNamed('基盤');
  const firstPackage = foundation.items.find((item) => item.text?.startsWith('@kiwa-lab/'));
  assert.equal(firstPackage.items[0].text, '概要');
  assert.match(firstPackage.items[0].link, /\/$/);
});

// VitePress は最上位を section 見出しとして描画する。分類はその中に入る。
test('the sidebar is wrapped in a single section', () => {
  assert.equal(sidebar.length, 1);
  assert.equal(sidebar[0].text, 'ライブラリ');
  assert.equal(sidebar[0].items[0].text, '全体像');
  assert.equal(sidebar[0].items[0].link, '/libraries/');
});

// 分類の並びは正本の順序をそのまま反映する。最後に単独プロジェクトの分類が付く。
test('categories appear in the order the definition lists them', () => {
  const top = sidebar[0].items.slice(1).map((item) => item.text);
  assert.deepEqual(top, [
    ...definition.libraryCategories.map((category) => category.text),
    definition.standaloneCategory.text,
  ]);
});
