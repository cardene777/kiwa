# @kiwa-lab/i18n リファレンス

## client

`createI18nClient(options)` は `provider`、`locale`、`fallbackLocale`、`messages` を受け取ります。既定値は provider が `next-intl`、locale と fallback locale が `en`、messages が空 object です。

`setLocale` は現在 locale を変えます。`formatNumber` と `formatDate` は現在 locale を `Intl` に渡します。`clear` は翻訳結果の記録だけを消去し、locale と messages は変更しません。

## 翻訳の優先順位

`translate` と `I18nClient.translate` は次の順で message を選びます。

| 条件 | `used` | result locale |
| --- | --- | --- |
| 現在 locale に key がある | `primary` | 現在 locale |
| fallback locale に key がある | `fallback` | fallback locale |
| `defaultMessage` がある | `default` | 現在 locale |
| どれもない | `missing` | 現在 locale |

message は string、plural form の object、入れ子 object を使えます。dot notation の key は入れ子を辿ります。

## 補間と複数形

`interpolate(template, values)` は text、template に出現した variables、足りない values の missing を返します。`selectPlural(locale, count)` は `Intl.PluralRules` の category を返し、無効な locale では `other` を返します。

## resilience helper

`withRetry`、`withTimeout`、`withRateLimit`、`withCircuitBreaker`、`withObservability`、`withIdempotencyKey`、`batchOperate` は翻訳そのものではなく、翻訳を含む処理を包む汎用 helper です。状態を持つ helper はテストごとに新しく作成してください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>rate limit $&#123;options.maxRequests&#125;/$&#123;options.windowMs&#125;ms exceeded</code> | [packages/i18n/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L57) |
| <code v-pre>circuit breaker open</code> | [packages/i18n/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L72) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [client.ts](./api/client) | 1 | 8 |
| [interpolate.ts](./api/interpolate) | 1 | 1 |
| [plural.ts](./api/plural) | 1 | 2 |
| [resilience.ts](./api/resilience) | 7 | 7 |
| [translator.ts](./api/translator) | 1 | 1 |

<!-- kiwa-public-api:end -->
