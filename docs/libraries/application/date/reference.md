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

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/date/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>addDays</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/arithmetic.ts#L15) <code v-pre>packages/date/src/arithmetic.ts</code>

`addDays(date, N, provider)` は date から N 日進めた Date を返す。 全 provider で同一挙動 (UTC ベース、 DST 影響回避のため timestamp 演算)。

```ts
export declare function addDays(date: Date, days: number, provider: DateProvider): ArithmeticResult;
```

#### <code v-pre>createDateClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/client.ts#L25) <code v-pre>packages/date/src/client.ts</code>

4 provider (date-fns / dayjs / Luxon / Temporal) を統一 interface で叩ける mock client。 実 provider (real deps) を差替えても同じ signature で呼べる想定。

```ts
export declare function createDateClient(options?: CreateDateClientOptions): DateClient;
```

#### <code v-pre>createHolidayCalendar</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L80) <code v-pre>packages/date/src/extensions.ts</code>

holiday calendar — country 別祝日判定

```ts
export declare function createHolidayCalendar(initial?: Holiday[]): HolidayCalendar;
```

#### <code v-pre>createObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L123) <code v-pre>packages/date/src/extensions.ts</code>

```ts
export declare function createObservabilityHook(): ObservabilityHook;
```

#### <code v-pre>diffDays</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/arithmetic.ts#L23) <code v-pre>packages/date/src/arithmetic.ts</code>

`diffDays(a, b, provider)` は (a - b) の日数差を整数で返す。 fractional は切捨て。

```ts
export declare function diffDays(a: Date, b: Date, provider: DateProvider): ArithmeticResult;
```

#### <code v-pre>expandRecurrence</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L46) <code v-pre>packages/date/src/extensions.ts</code>

RRULE subset expand — DAILY/WEEKLY/MONTHLY/YEARLY

```ts
export declare function expandRecurrence(rule: RecurrenceRule, start: Date): Date[];
```

#### <code v-pre>formatDate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/format.ts#L19) <code v-pre>packages/date/src/format.ts</code>

pattern token = `YYYY / MM / DD / HH / mm / ss` を UTC ベースで置換。 全 provider (date-fns/dayjs/Luxon/Temporal) が最低限 support する共通 subset。

```ts
export declare function formatDate(date: Date, pattern: string, provider: DateProvider): FormatResult;
```

#### <code v-pre>parseDate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/format.ts#L40) <code v-pre>packages/date/src/format.ts</code>

pattern に沿って date string を parse。 未対応 pattern は Date コンストラクタに fallback。

```ts
export declare function parseDate(str: string, pattern: string, provider: DateProvider): ParseResult;
```

#### <code v-pre>parseDuration</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L14) <code v-pre>packages/date/src/extensions.ts</code>

ISO 8601 duration parse — "P1Y2M3DT4H5M6S" 対応

```ts
export declare function parseDuration(iso: string): DurationParseResult;
```

#### <code v-pre>retryWithBackoff</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L99) <code v-pre>packages/date/src/extensions.ts</code>

```ts
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<RetryResult<T>>;
```

#### <code v-pre>timezoneConvert</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/timezone.ts#L32) <code v-pre>packages/date/src/timezone.ts</code>

`timezoneConvert(date, tz, provider)` は date を tz オフセット分ずらした Date を返す。 未知の tz は 0 offset (UTC 相当) に fallback。 DST 未対応 = mock として cover 十分。

```ts
export declare function timezoneConvert(date: Date, timezone: string, provider: DateProvider): TimezoneResult;
```

### 型

#### <code v-pre>ArithmeticResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/arithmetic.ts#L3) <code v-pre>packages/date/src/arithmetic.ts</code>

```ts
export interface ArithmeticResult {
    result: Date;
    days: number;
    provider: DateProvider;
}
```

#### <code v-pre>CreateDateClientOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/client.ts#L7) <code v-pre>packages/date/src/client.ts</code>

```ts
export interface CreateDateClientOptions {
    provider?: DateProvider;
    defaultTimezone?: string;
}
```

#### <code v-pre>DateClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/client.ts#L12) <code v-pre>packages/date/src/client.ts</code>

```ts
export interface DateClient {
    provider: DateProvider;
    addDays: (date: Date, days: number) => Date;
    diffDays: (a: Date, b: Date) => number;
    format: (date: Date, pattern: string) => string;
    parse: (str: string, pattern: string) => Date;
    toTimezone: (date: Date, tz: string) => Date;
}
```

#### <code v-pre>DateProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/client.ts#L5) <code v-pre>packages/date/src/client.ts</code>

```ts
export type DateProvider = 'date-fns' | 'dayjs' | 'luxon' | 'temporal';
```

#### <code v-pre>DurationParseResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L6) <code v-pre>packages/date/src/extensions.ts</code>

v2.1 extensions — duration parse, recurrence rule (RRULE subset), holiday calendar, plus retry/batch/observability generics. Temporal Stage 3 追随。

```ts
export interface DurationParseResult {
    ok: boolean;
    totalMs: number;
    components?: {
        years?: number;
        months?: number;
        days?: number;
        hours?: number;
        minutes?: number;
        seconds?: number;
    };
    error?: string;
}
```

#### <code v-pre>FormatResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/format.ts#L3) <code v-pre>packages/date/src/format.ts</code>

```ts
export interface FormatResult {
    formatted: string;
    pattern: string;
    provider: DateProvider;
}
```

#### <code v-pre>Holiday</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L65) <code v-pre>packages/date/src/extensions.ts</code>

```ts
export interface Holiday {
    name: string;
    date: string;
    country: string;
}
```

#### <code v-pre>HolidayCalendar</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L71) <code v-pre>packages/date/src/extensions.ts</code>

```ts
export interface HolidayCalendar {
    isHoliday: (date: Date) => boolean;
    getHoliday: (date: Date) => Holiday | undefined;
    addHoliday: (holiday: Holiday) => void;
    list: () => Holiday[];
    nextHoliday: (from: Date) => Holiday | undefined;
}
```

#### <code v-pre>ObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L117) <code v-pre>packages/date/src/extensions.ts</code>

```ts
export interface ObservabilityHook {
    emit: (event: {
        kind: string;
        data: Record<string, unknown>;
    }) => void;
    events: () => Array<{
        kind: string;
        data: Record<string, unknown>;
    }>;
    clear: () => void;
}
```

#### <code v-pre>ParseResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/format.ts#L9) <code v-pre>packages/date/src/format.ts</code>

```ts
export interface ParseResult {
    date: Date;
    pattern: string;
    provider: DateProvider;
}
```

#### <code v-pre>RecurrenceFreq</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L36) <code v-pre>packages/date/src/extensions.ts</code>

```ts
export type RecurrenceFreq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
```

#### <code v-pre>RecurrenceRule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L38) <code v-pre>packages/date/src/extensions.ts</code>

```ts
export interface RecurrenceRule {
    freq: RecurrenceFreq;
    interval?: number;
    count?: number;
    until?: Date;
}
```

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L96) <code v-pre>packages/date/src/extensions.ts</code>

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    backoffFactor?: number;
}
```

#### <code v-pre>RetryResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L97) <code v-pre>packages/date/src/extensions.ts</code>

```ts
export interface RetryResult<T> {
    ok: boolean;
    attempts: number;
    value?: T;
    error?: unknown;
}
```

#### <code v-pre>TimezoneResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/timezone.ts#L3) <code v-pre>packages/date/src/timezone.ts</code>

```ts
export interface TimezoneResult {
    date: Date;
    timezone: string;
    offsetMinutes: number;
    provider: DateProvider;
}
```
<!-- kiwa-public-api:end -->
