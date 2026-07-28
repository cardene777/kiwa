# sveltekit リファレンス

## 公開 API

`invokeLoad` は URL、params、cookies、locals を持つ load event を作ります。`invokeAction` と `fail` は form action を扱います。`invokeHandle`、`invokeHandleFetch`、`invokeHandleError` は個別 hook を実行します。`setupSvelteKitHooksEnv` は共有環境を作り、`sequence` は handle を連鎖します。

## 設定

hooks 環境は URL、cookies、locals、params、routeId、platform を受け取ります。`runHandle` には固定 Response または event から Response を作る関数を渡せます。

## 結果の分岐

load と form action は data、fail、redirect、error を区別します。`redirect` と `error` は throw する signal、`fail` は action から return する signal です。server hook が変更した locals と cookie は env から確認し、response だけで見落とさないようにします。

## 後始末と制約

共有 hooks 環境は `reset` で初期 cookie と locals の浅い snapshot に戻します。`sequence` は outer handle から inner handle、resolve、逆順の after 処理を組み立てます。例外は error と 500 response で確認します。SvelteKit server と browser navigation は起動しません。

<!-- kiwa-public-api:start -->

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/sveltekit/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [invoke-action.ts](./api/invoke-action) | 3 | 5 |
| [invoke-hooks.ts](./api/invoke-hooks) | 3 | 13 |
| [invoke-load.ts](./api/invoke-load) | 5 | 6 |
| [setup-hooks-env.ts](./api/setup-hooks-env) | 2 | 7 |

<!-- kiwa-public-api:end -->
