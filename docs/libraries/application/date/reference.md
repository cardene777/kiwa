# @kiwa-lab/date リファレンス

## client

`createDateClient({ provider, defaultTimezone })` は `DateClient` を返します。provider の既定値は `date-fns` です。client の `addDays`、`diffDays`、`format`、`parse`、`toTimezone` は、top-level API から result metadata を除いた値を返します。

## 演算と書式

`addDays(date, days, provider)` は `ArithmeticResult` として日数、provider、加算後 Date を返します。`diffDays(a, b, provider)` は `a - b` の日数を切り捨てて返し、`result` は a です。

`formatDate` は `FormatResult`、`parseDate` は `ParseResult` を返します。format の token は UTC の field で置き換えられます。`parseDate` は `YYYY-MM-DD` の ISO 風入力だけを明示的に扱います。

## timezone

`timezoneConvert(date, timezone, provider)` は `TimezoneResult` を返します。UTC、GMT、Asia/Tokyo、Asia/Seoul、Asia/Shanghai、Asia/Singapore、Asia/Kolkata、主要な Europe、America、Australia timezone の固定 offset を扱います。DST の日付依存 offset は扱いません。

## 拡張 API

`parseDuration` は ISO 8601 duration の subset を parse し、年を三百六十五日、月を三十日として total milliseconds を計算します。`expandRecurrence` は四つの frequency を最大 count 件まで展開します。

`createHolidayCalendar` は holiday の追加、取得、次の holiday の検索を提供します。`retryWithBackoff` と `createObservabilityHook` は date 計算そのものではなく、周辺処理の失敗制御と記録用 helper です。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>parseDate: invalid input "$&#123;str&#125;"</code> | [packages/date/src/format.ts](https://github.com/cardene777/kiwa/blob/main/packages/date/src/format.ts#L54) |
| <code v-pre>parseDate: invalid input "$&#123;str&#125;"</code> | [packages/date/src/format.ts](https://github.com/cardene777/kiwa/blob/main/packages/date/src/format.ts#L58) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/date/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [arithmetic.ts](./api/arithmetic) | 2 | 1 |
| [client.ts](./api/client) | 1 | 3 |
| [extensions.ts](./api/extensions) | 5 | 8 |
| [format.ts](./api/format) | 2 | 2 |
| [timezone.ts](./api/timezone) | 1 | 1 |

<!-- kiwa-public-api:end -->
