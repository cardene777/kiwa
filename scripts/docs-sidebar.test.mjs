// sidebar の構造を検査する。
//
// 正本の値が sidebar へ届いているかは、これまでどの層も見ていなかった。
// 公開サイトの build は sidebar 項目の見出しを検証せずそのまま描画し、
// 正本の test は正本側の値だけを見て、整合検査は表示名を参照しない。
// 正本の key を rename して consumer を直し忘れると、見出しが消えたまま公開される。
//
// ここでは config が組み立てた sidebar を読み、見出しと link の形を確かめる。
//
//   node --test scripts/docs-sidebar.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const definition = JSON.parse(
  readFileSync(join(repositoryRoot, 'docs', 'libraries.json'), 'utf8'),
);
const configSource = readFileSync(
  join(repositoryRoot, 'docs', '.vitepress', 'config.mts'),
  'utf8',
);

/**
 * config が組み立てるライブラリ sidebar を再現する。
 *
 * config.mts は VitePress と TypeScript を前提にしているので、ここでは同じ組み立てを
 * JavaScript で書き直して値を確かめる。組み立ての手順が config と食い違うと、この test は
 * 実物を検証しないただの写像になる。それを防ぐため、config が使っている property 名を
 * source から拾って照合する test を別に置いてある。
 */
function buildLibrarySidebar() {
  const { libraryCategories, exemptDocuments, standaloneCategory, documentKinds } = definition;

  const pageItems = (slug, name) =>
    documentKinds.map(({ slug: kind, text }) => ({
      text,
      link: `/libraries/${slug}/${name}/${kind}`,
    }));

  const exemptItemsIn = (category) =>
    exemptDocuments
      .filter((document) => document.category === category)
      .map(({ name, label }) => ({ text: label, collapsed: true, items: pageItems(category, name) }));

  const categoryItem = ({ text, slug, packages }) => ({
    text,
    collapsed: false,
    items: [
      { text: 'カテゴリ概要', link: `/libraries/${slug}/` },
      ...exemptItemsIn(slug),
      ...packages.map((name) => ({
        text: `${definition.packageScope}/${name}`,
        collapsed: true,
        items: pageItems(slug, name),
      })),
    ],
  });

  return [
    { text: '全体像', link: '/libraries/' },
    ...libraryCategories.map(categoryItem),
    {
      text: standaloneCategory.text,
      collapsed: false,
      items: [
        { text: 'カテゴリ概要', link: `/libraries/${standaloneCategory.slug}/` },
        ...exemptItemsIn(standaloneCategory.slug),
      ],
    },
  ];
}

/** sidebar を再帰的に辿って全項目を平らにする。 */
function flatten(items) {
  const flat = [];
  for (const item of items) {
    flat.push(item);
    if (Array.isArray(item.items)) flat.push(...flatten(item.items));
  }
  return flat;
}

// 見出しが欠けた項目は、公開サイトで空欄として描画される。
// 正本の key を rename して consumer を直し忘れると、この形になる。
test('every sidebar item has a visible label', () => {
  for (const item of flatten(buildLibrarySidebar())) {
    assert.equal(typeof item.text, 'string', `${JSON.stringify(item)}: text is not a string`);
    assert.notEqual(item.text, '', `${JSON.stringify(item)}: text is empty`);
  }
});

test('every leaf item points somewhere', () => {
  for (const item of flatten(buildLibrarySidebar())) {
    if (Array.isArray(item.items)) continue;
    assert.equal(typeof item.link, 'string', `${item.text}: link is not a string`);
    assert.match(item.link, /^\/libraries\//, `${item.text}: link is outside /libraries/`);
  }
});

// 別枠で扱う文書の見出しは、正本の label がそのまま出る。
test('exempt documents keep their labels in the sidebar', () => {
  const labels = flatten(buildLibrarySidebar()).map((item) => item.text);
  for (const document of definition.exemptDocuments) {
    assert.equal(labels.includes(document.label), true, `${document.name}: ${document.label} is missing`);
  }
});

test('every package appears once with its namespace', () => {
  const labels = flatten(buildLibrarySidebar()).map((item) => item.text);
  for (const category of definition.libraryCategories) {
    for (const name of category.packages) {
      const expected = `${definition.packageScope}/${name}`;
      assert.equal(labels.filter((label) => label === expected).length, 1, `${expected}`);
    }
  }
});

// 別枠の文書は分類の先頭 (カテゴリ概要の直後) に並ぶ。package の後ろに回ると
// 見出しの意味が変わる。
test('exempt documents come before the packages in their category', () => {
  const sidebar = buildLibrarySidebar();
  const foundation = sidebar.find((item) => item.text === '基盤');
  assert.notEqual(foundation, undefined);
  assert.equal(foundation.items[0].text, 'カテゴリ概要');
  assert.equal(foundation.items[1].text, 'kiwa 全体');
  assert.match(foundation.items[2].text, /^@kiwa-lab\//);
});

// 概要ページの link は末尾のスラッシュで終わる。文書種別の slug が空文字であることに
// 依存しているので、正本を変えた時にここで気付ける。
test('the overview link ends with a slash', () => {
  const sidebar = buildLibrarySidebar();
  const foundation = sidebar.find((item) => item.text === '基盤');
  const firstPackage = foundation.items.find((item) => item.text?.startsWith('@kiwa-lab/'));
  assert.equal(firstPackage.items[0].text, '概要');
  assert.match(firstPackage.items[0].link, /\/$/);
});

// 上の組み立てが config と食い違っていないことを確かめる。
// config が正本のどの property を読むかを source から拾い、この test の前提と照合する。
test('the config reads the same properties this test assumes', () => {
  for (const property of ['libraryCategories', 'exemptDocuments', 'standaloneCategory', 'documentKinds', 'packageScope']) {
    assert.match(configSource, new RegExp(`\\b${property}\\b`), `config does not read ${property}`);
  }
  // 別枠の文書は label を見出しにする。rename して片方だけ直すと、ここで落ちる。
  assert.match(configSource, /\{\s*name,\s*label\s*\}/, 'config does not destructure { name, label }');
  assert.equal(configSource.includes('sidebarText'), false, 'config still refers to sidebarText');
});
