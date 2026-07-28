# remix リファレンス

## 公開 API

`invokeLoader` と `invokeAction` は route function を実行します。`json` と `redirect` は Response を作ります。`invokeResourceRoute` は HTTP method ごとの Resource Route を扱います。`setupRemixNestedRouteEnv`、`defer`、`resolveDeferred` は nested loader と遅延データを扱います。

## 設定

loader と action は URL、params、context、headers を受け取ります。action は formData または jsonBody を受け取ります。JSON Response は response として保持され、redirect Response は redirect に正規化されます。

## 結果の分岐

loader と action は result、Response、redirect、error を区別します。`undefined` の戻りは通常 data ではないため、loader の実装漏れとして error を確認します。

Resource Route の結果には通常の route 結果に加え、`dispatch` と `methodNotAllowed` が入ります。405 の allow list は loader の有無で GET、HEAD、action の有無で POST、PUT、PATCH、DELETE を含みます。

`setupRemixNestedRouteEnv` は parent と child の loader chain、headers、cookie store を提供します。`defer` は immediate data、pending promise、ResponseInit を保持し、`resolveDeferred` は resolved と rejected key を報告します。実 server streaming や React rendering は対象外です。

## 後始末と制約

request と context は呼び出しごとに作られます。`undefined` loader return はエラー、`null` は許可されます。Remix server、実 cookie session、ブラウザ遷移は起動しません。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>LOADER&#95;UNDEFINED&#95;RETURN&#95;MESSAGE</code> | [packages/remix/src/invoke-route.ts](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/invoke-route.ts#L127) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/remix/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [invoke-resource-route.ts](./api/invoke-resource-route) | 2 | 4 |
| [invoke-route.ts](./api/invoke-route) | 5 | 7 |
| [setup-nested-route-env.ts](./api/setup-nested-route-env) | 5 | 8 |

<!-- kiwa-public-api:end -->
