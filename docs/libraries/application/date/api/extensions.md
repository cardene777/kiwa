---
title: "@kiwa-lab/date extensions の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/date</code> <code v-pre>extensions</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

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

#### <code v-pre>expandRecurrence</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/extensions.ts#L46) <code v-pre>packages/date/src/extensions.ts</code>

RRULE subset expand — DAILY/WEEKLY/MONTHLY/YEARLY

```ts
export declare function expandRecurrence(rule: RecurrenceRule, start: Date): Date[];
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

### 型

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
