// ライブラリの分類と、文書種別の呼び方の正本。
//
// sidebar (docs/.vitepress/config.mts) と整合検査 (scripts/check-docs-consistency.mjs) の
// 両方がここを読む。以前は sidebar が配列を持ち、検査 script がその配列を構文解析で
// 取り出していたため、定義の書き方を変えると検査だけが壊れる関係になっていた。
//
// 素の JavaScript にしてあるのは、TypeScript を解さない Node の script からも
// そのまま import するため。

/**
 * 分類の並び。sidebar の表示順がこの順になる。
 *
 * `slug` は `docs/libraries/<slug>/` の directory 名で、公開 URL にもそのまま出る。
 * `text` は sidebar の見出し。
 */
export const libraryCategories = [
  {
    text: '基盤',
    slug: 'foundation',
    packages: [
      'core', 'dapp', 'e2e', 'api', 'ui', 'cli', 'cli-test', 'component',
      'data', 'design-check', 'kaname', 'lean', 'skill-test', 'desktop', 'mobile',
    ],
  },
  {
    text: 'アプリUI',
    slug: 'application',
    packages: ['form', 'state', 'query', 'chart', 'date', 'i18n', 'react-native', 'expo', 'macos-app'],
  },
  {
    text: 'Webフレームワーク',
    slug: 'frameworks',
    packages: ['astro', 'edge', 'fresh', 'hono', 'nextjs', 'nuxt', 'qwikcity', 'remix', 'solidjs', 'solidstart', 'sveltekit'],
  },
  {
    text: 'サービス',
    slug: 'services',
    packages: ['auth', 'cache', 'crypto', 'email', 'feature-flag', 'graphql', 'grpc', 'migration', 'notification', 'orm', 'payment', 'queue', 'trpc', 'upload', 'webhook', 'websocket', 'workflow'],
  },
  {
    text: 'AIとリアルタイム',
    slug: 'ai-realtime',
    packages: ['agent', 'ai-llm', 'mcp', 'observability', 'realtime', 'search', 'streaming', 'vector', 'visual'],
  },
  {
    text: '品質とセキュリティ',
    slug: 'quality',
    packages: ['a11y', 'perf-harness', 'quality-metrics', 'release-invariants', 'security', 'security-devsecops'],
  },
  {
    text: '言語アダプター',
    slug: 'languages',
    packages: ['go-lib', 'python', 'ruby', 'rust-lib'],
  },
];

/**
 * 通常の対応検査に載せない文書。
 *
 * `packages/<名前>/` に実体を持たないため、package との突き合わせから外す。
 * ただし置き場所は決まっている。sidebar が分類ごとに固定の link を書くので、
 * 移動すれば link が切れる。`category` を持たせて場所まで固定する。
 *
 * `name` だけを key にすると `languages/python` (TypeScript のアダプター) と
 * `native-languages/python` (単独の native プロジェクト) が衝突する。別物なので
 * 分類と組にして区別する。
 */
export const exemptDocuments = [
  {
    // 全体をまとめて説明する入口。sidebar では基盤の先頭に別枠で並ぶ。
    name: 'kiwa',
    category: 'foundation',
    sidebarText: 'kiwa 全体',
  },
  { name: 'go', category: 'native-languages', sidebarText: 'kiwa-test-go' },
  { name: 'python', category: 'native-languages', sidebarText: 'kiwa-test-py' },
  { name: 'rust', category: 'native-languages', sidebarText: 'kiwa-test-rs' },
];

/** 単独の native プロジェクトを置く分類。package との対応を取らない。 */
export const standaloneCategory = {
  slug: 'native-languages',
  text: 'ネイティブ言語',
};

/**
 * 文書種別の呼び方。
 *
 * 日本語のサイトなので日本語に統一する。`slug` は file 名と URL に出る英語で、
 * `text` が画面に出る呼び方。sidebar と入口ページで同じ言葉を使うために、
 * 呼び方をここへ集める。
 */
export const documentKinds = [
  { slug: '', text: '概要' },
  { slug: 'quickstart', text: 'はじめる' },
  { slug: 'how-to', text: '使い方' },
  { slug: 'reference', text: 'リファレンス' },
];

/** ライブラリ文書が持つべきページの file 名。 */
export const requiredPages = ['index.md', 'quickstart.md', 'how-to.md', 'reference.md'];

/** package 名の名前空間。 */
export const packageScope = '@kiwa-lab';
