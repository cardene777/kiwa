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
| `parseDate: invalid input "${str}"` | [packages/date/src/format.ts](https://github.com/cardene777/kiwa/blob/main/packages/date/src/format.ts#L54) |
| `parseDate: invalid input "${str}"` | [packages/date/src/format.ts](https://github.com/cardene777/kiwa/blob/main/packages/date/src/format.ts#L58) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/date/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `addDays`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/arithmetic.ts#L15) `packages/date/src/arithmetic.ts`

`addDays(date, N, provider)` は date から N 日進めた Date を返す。 全 provider で同一挙動 (UTC ベース、 DST 影響回避のため timestamp 演算)。

```ts
export declare function addDays(date: Date, days: number, provider: DateProvider): ArithmeticResult;
```

#### `createDateClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/client.ts#L25) `packages/date/src/client.ts`

4 provider (date-fns / dayjs / Luxon / Temporal) を統一 interface で叩ける mock client。 実 provider (real deps) を差替えても同じ signature で呼べる想定。

```ts
export declare function createDateClient(options?: CreateDateClientOptions): DateClient;
```

#### `createHolidayCalendar`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L80) `packages/date/src/extensions.ts`

holiday calendar — country 別祝日判定

```ts
export declare function createHolidayCalendar(initial?: Holiday[]): HolidayCalendar;
```

#### `createObservabilityHook`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L123) `packages/date/src/extensions.ts`

```ts
export declare function createObservabilityHook(): ObservabilityHook;
```

#### `diffDays`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/arithmetic.ts#L23) `packages/date/src/arithmetic.ts`

`diffDays(a, b, provider)` は (a - b) の日数差を整数で返す。 fractional は切捨て。

```ts
export declare function diffDays(a: Date, b: Date, provider: DateProvider): ArithmeticResult;
```

#### `expandRecurrence`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L46) `packages/date/src/extensions.ts`

RRULE subset expand — DAILY/WEEKLY/MONTHLY/YEARLY

```ts
export declare function expandRecurrence(rule: RecurrenceRule, start: Date): Date[];
```

#### `formatDate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/format.ts#L19) `packages/date/src/format.ts`

pattern token = `YYYY / MM / DD / HH / mm / ss` を UTC ベースで置換。 全 provider (date-fns/dayjs/Luxon/Temporal) が最低限 support する共通 subset。

```ts
export declare function formatDate(date: Date, pattern: string, provider: DateProvider): FormatResult;
```

#### `parseDate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/format.ts#L40) `packages/date/src/format.ts`

pattern に沿って date string を parse。 未対応 pattern は Date コンストラクタに fallback。

```ts
export declare function parseDate(str: string, pattern: string, provider: DateProvider): ParseResult;
```

#### `parseDuration`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L14) `packages/date/src/extensions.ts`

ISO 8601 duration parse — "P1Y2M3DT4H5M6S" 対応

```ts
export declare function parseDuration(iso: string): DurationParseResult;
```

#### `retryWithBackoff`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L99) `packages/date/src/extensions.ts`

```ts
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<RetryResult<T>>;
```

#### `timezoneConvert`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/timezone.ts#L32) `packages/date/src/timezone.ts`

`timezoneConvert(date, tz, provider)` は date を tz オフセット分ずらした Date を返す。 未知の tz は 0 offset (UTC 相当) に fallback。 DST 未対応 = mock として cover 十分。

```ts
export declare function timezoneConvert(date: Date, timezone: string, provider: DateProvider): TimezoneResult;
```

### 型

#### `ArithmeticResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/arithmetic.ts#L3) `packages/date/src/arithmetic.ts`

```ts
export interface ArithmeticResult {
    result: Date;
    days: number;
    provider: DateProvider;
}
```

#### `CreateDateClientOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/client.ts#L7) `packages/date/src/client.ts`

```ts
export interface CreateDateClientOptions {
    provider?: DateProvider;
    defaultTimezone?: string;
}
```

#### `DateClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/client.ts#L12) `packages/date/src/client.ts`

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

#### `DateProvider`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/client.ts#L5) `packages/date/src/client.ts`

```ts
export type DateProvider = 'date-fns' | 'dayjs' | 'luxon' | 'temporal';
```

#### `DurationParseResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L6) `packages/date/src/extensions.ts`

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

#### `FormatResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/format.ts#L3) `packages/date/src/format.ts`

```ts
export interface FormatResult {
    formatted: string;
    pattern: string;
    provider: DateProvider;
}
```

#### `Holiday`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L65) `packages/date/src/extensions.ts`

```ts
export interface Holiday {
    name: string;
    date: string;
    country: string;
}
```

#### `HolidayCalendar`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L71) `packages/date/src/extensions.ts`

```ts
export interface HolidayCalendar {
    isHoliday: (date: Date) => boolean;
    getHoliday: (date: Date) => Holiday | undefined;
    addHoliday: (holiday: Holiday) => void;
    list: () => Holiday[];
    nextHoliday: (from: Date) => Holiday | undefined;
}
```

#### `ObservabilityHook`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L117) `packages/date/src/extensions.ts`

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

#### `ParseResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/format.ts#L9) `packages/date/src/format.ts`

```ts
export interface ParseResult {
    date: Date;
    pattern: string;
    provider: DateProvider;
}
```

#### `RecurrenceFreq`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L36) `packages/date/src/extensions.ts`

```ts
export type RecurrenceFreq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
```

#### `RecurrenceRule`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L38) `packages/date/src/extensions.ts`

```ts
export interface RecurrenceRule {
    freq: RecurrenceFreq;
    interval?: number;
    count?: number;
    until?: Date;
}
```

#### `RetryOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L96) `packages/date/src/extensions.ts`

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    backoffFactor?: number;
}
```

#### `RetryResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L97) `packages/date/src/extensions.ts`

```ts
export interface RetryResult<T> {
    ok: boolean;
    attempts: number;
    value?: T;
    error?: unknown;
}
```

#### `TimezoneResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/timezone.ts#L3) `packages/date/src/timezone.ts`

```ts
export interface TimezoneResult {
    date: Date;
    timezone: string;
    offsetMinutes: number;
    provider: DateProvider;
}
```
<!-- kiwa-public-api:end -->
