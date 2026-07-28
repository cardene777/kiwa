# @kiwa-lab/core リファレンス

仕様 Markdown を構造化する `parseSpec` と、再利用可能な非同期資源を管理する `createPool` の公開 API です。

## parseSpec

`parseSpec(markdown, options)` は Markdown の metadata と最初の表を `SpecDoc` に変換します。構文エラーの多くは例外ではなく `warnings` で返るため、呼び出し側で警告を失敗にするか決めます。

```ts
const doc = parseSpec(markdown, {
  module: "wallet-connect",
  defaultLayer: "e2e",
});
```

| option | 内容 |
| --- | --- |
| `module` | Markdown の module metadata より優先する module 名 |
| `defaultLayer` | 有効な layer metadata がまだない場合に使う layer。既定値は `unit` |

| `SpecDoc` の項目 | 内容 |
| --- | --- |
| `module` | options または metadata から得た module 名。どちらもなければ空文字列 |
| `layer` | `contract`、`unit`、`integration`、`e2e`、`api`、`ui`、`data`、`cli` のいずれか |
| `cases` | 解析できた `SpecCase` の順序を保つ配列 |
| `raw` | 入力 Markdown をそのまま保持した文字列 |
| `warnings` | 必須列欠落、表なし、未知 layer、未知 mode の警告 |

`SpecCase` は `id`、`observation`、`given`、`when`、`then`、`priority`、`automation` を必ず持ちます。`mode` と `route` は任意です。`notes` は公開型にはありますが、現在の parser は表の notes 列を読み取りません。

## createPool

`createPool(options)` は初期化時に `acquire` を `size` 回並列に呼び出し、すべて成功した後に `Pool<T>` を返します。size は 1 以上の整数でなければ reject します。いずれかの acquire が失敗した場合も、pool は返りません。

```ts
const pool = await createPool({
  size: 2,
  acquire: async () => createBrowser(),
  reset: async (browser) => browser.clearCookies(),
  release: async (browser) => browser.close(),
});
```

| option | 必須 | 内容 |
| --- | --- | --- |
| `size` | はい | 初期化する資源数。正の整数のみ |
| `acquire` | はい | 各資源を作る非同期関数 |
| `reset` | いいえ | lease を返すときに呼ぶ非同期関数 |
| `release` | いいえ | `stopAll` 時に各資源へ呼ぶ非同期関数 |

`Pool<T>` は初期 size、`borrow()`、`stopAll()` を持ちます。`borrow()` は空き slot がなければ、先に待っている呼び出しから順に待機します。返された `Lease<T>` の `release()` は reset を完了してから次の待機者へ資源を渡します。reset が失敗しても slot は返却され、`release()` 自体は reject します。

`stopAll()` は待機中の borrow を解決せずに待機列から外し、すべての slot に `release` を並列で呼びます。借用中の lease がある状態で stop する設計ではないため、通常は全 lease を release してから呼んでください。

## 共有型

`TestEnvBase<TMode>` は `mode` と非同期の `stop()` を持つ環境の構造型です。`TestLayer`、`TestMode`、`TestEnvBase`、`SpecCase`、`SpecDoc`、`Lease`、`Pool` は package root から type export されています。

実装と完全な型定義は [`parser.ts`](https://github.com/cardene777/kiwa/blob/main/packages/core/src/parser.ts)、[`pool.ts`](https://github.com/cardene777/kiwa/blob/main/packages/core/src/pool.ts)、[`types.ts`](https://github.com/cardene777/kiwa/blob/main/packages/core/src/types.ts) を参照してください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>createPool: size must be a positive integer, got $&#123;opts.size&#125;</code> | [packages/core/src/pool.ts](https://github.com/cardene777/kiwa/blob/main/packages/core/src/pool.ts#L17) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/core/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [parser.ts](./api/parser) | 1 | 1 |
| [pool.ts](./api/pool) | 1 | 1 |
| [types.ts](./api/types) | 0 | 7 |

<!-- kiwa-public-api:end -->
