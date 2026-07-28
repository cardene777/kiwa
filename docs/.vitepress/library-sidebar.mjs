// ライブラリ sidebar の組み立て。
//
// config (docs/.vitepress/config.mts) と test (scripts/docs-sidebar.test.mjs) の両方が
// この関数を呼ぶ。以前は config が組み立て、test が同じ手順を書き直して検証していたが、
// 書き直した側が実物とずれれば「自分の写像を検証するだけ」になる。
// 正本を 1 file にまとめたのと同じ理由で、組み立ても 1 箇所に置く。
//
// 定義は引数で受け取る。読み込みの経路は呼ぶ側で決める
// (config は import、検査 script は guard を通した読み込み)。

/**
 * 正本が持つべき key。
 *
 * 「読む側が使う key」を基準にすると、sidebar だけが読む key が漏れる。
 * 欠けたまま build へ進むと見出しや link が消えた状態で公開されるので、
 * 正本として揃うべきものを 1 箇所に列挙する。
 */
export const definitionKeys = [
  'libraryCategories',
  'exemptDocuments',
  'standaloneCategory',
  'documentKinds',
  'requiredPages',
  'packageScope',
];

/** 1 つのライブラリの 4 ページ。`documentKinds` の並びがそのまま出る。 */
function pageItems(documentKinds, slug, name) {
  return documentKinds.map(({ slug: kind, text }) => ({
    text,
    link: `/libraries/${slug}/${name}/${kind}`,
  }));
}

/** 指定した分類に置く、別枠で扱う文書。 */
function exemptItemsIn(definition, category) {
  return definition.exemptDocuments
    .filter((document) => document.category === category)
    .map(({ name, label }) => ({
      text: label,
      collapsed: true,
      items: pageItems(definition.documentKinds, category, name),
    }));
}

/** 1 つの分類。カテゴリ概要、別枠の文書、package の順に並べる。 */
function categoryItem(definition, { text, slug, packages }) {
  return {
    text,
    collapsed: false,
    items: [
      { text: 'カテゴリ概要', link: `/libraries/${slug}/` },
      ...exemptItemsIn(definition, slug),
      ...packages.map((name) => ({
        text: `${definition.packageScope}/${name}`,
        collapsed: true,
        items: pageItems(definition.documentKinds, slug, name),
      })),
    ],
  };
}

/**
 * ライブラリ sidebar。VitePress の `sidebar` にそのまま渡せる形で返す。
 *
 * 外側の「ライブラリ」でひとまとめにするのは、VitePress が section 見出しとして描画するため。
 */
export function buildLibrarySidebar(definition) {
  return [
    {
      text: 'ライブラリ',
      items: [
        { text: '全体像', link: '/libraries/' },
        ...definition.libraryCategories.map((category) => categoryItem(definition, category)),
        {
          text: definition.standaloneCategory.text,
          collapsed: false,
          items: [
            { text: 'カテゴリ概要', link: `/libraries/${definition.standaloneCategory.slug}/` },
            ...exemptItemsIn(definition, definition.standaloneCategory.slug),
          ],
        },
      ],
    },
  ];
}
