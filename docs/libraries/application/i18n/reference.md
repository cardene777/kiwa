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
| `rate limit ${options.maxRequests}/${options.windowMs}ms exceeded` | [packages/i18n/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L57) |
| 'circuit breaker open' | [packages/i18n/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L72) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `batchOperate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L111) `packages/i18n/src/resilience.ts`

```ts
export declare function batchOperate<TIn, TOut>(items: readonly BatchItem<TIn>[], runner: (item: BatchItem<TIn>) => Promise<TOut>): Promise<BatchResult[]>;
```

#### `createI18nClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/client.ts#L53) `packages/i18n/src/client.ts`

provider 別 mock 差 (setLocale event fire pattern / missing key marker) を持たせつつ、 全 API 共通 interface。 実 provider (next-intl / vue-i18n / react-i18next / Lingui) の SDK を差し替えても同じ signature で呼べる想定。

```ts
export declare function createI18nClient(options?: CreateI18nClientOptions): I18nClient;
```

#### `interpolate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/interpolate.ts#L14) `packages/i18n/src/interpolate.ts`

`&#123;&#123;name&#125;&#125;` placeholder を values で置換する mustache-lite interpolation。 実 provider (next-intl / vue-i18n / react-i18next / Lingui) の interpolation engine を差し替えても 同じ signature で呼べる想定。

```ts
export declare function interpolate(template: string, values: InterpolationValues): InterpolateResult;
```

#### `selectPlural`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/plural.ts#L14) `packages/i18n/src/plural.ts`

Intl.PluralRules 経由で count に対する plural category を返す。 実 provider の pluralization rule (CLDR SSOT) を差し替えても同じ signature で呼べる想定。 失敗時は 'other' を返す (safe default)。

```ts
export declare function selectPlural(locale: string, count: number): PluralCategory;
```

#### `translate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/translator.ts#L26) `packages/i18n/src/translator.ts`

translation lookup + fallback + pluralization + interpolation の統合 entry。 実 provider の t() / $t() / gettext() を差し替えても同じ signature で呼べる想定。

```ts
export declare function translate(input: TranslateInput): TranslateResult;
```

#### `withCircuitBreaker`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L64) `packages/i18n/src/resilience.ts`

```ts
export declare function withCircuitBreaker<T>(fn: () => Promise<T>, options: CircuitBreakerOptions): () => Promise<T>;
```

#### `withIdempotencyKey`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L101) `packages/i18n/src/resilience.ts`

```ts
export declare function withIdempotencyKey<T>(fn: (key: string) => Promise<T>): (key: string) => Promise<T>;
```

#### `withObservability`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L86) `packages/i18n/src/resilience.ts`

```ts
export declare function withObservability<T>(name: string, fn: () => Promise<T>, hook: ObservabilityHook): () => Promise<T>;
```

#### `withRateLimit`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L50) `packages/i18n/src/resilience.ts`

```ts
export declare function withRateLimit<T>(fn: () => Promise<T>, options: RateLimitOptions): () => Promise<T>;
```

#### `withRetry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L20) `packages/i18n/src/resilience.ts`

```ts
export declare function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): () => Promise<T>;
```

#### `withTimeout`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L40) `packages/i18n/src/resilience.ts`

```ts
export declare function withTimeout<T>(fn: () => Promise<T>, options: TimeoutOptions): () => Promise<T>;
```

### 型

#### `BatchItem`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L17) `packages/i18n/src/resilience.ts`

```ts
export interface BatchItem<TIn = unknown> {
    name: string;
    input: TIn;
}
```

#### `BatchResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L18) `packages/i18n/src/resilience.ts`

```ts
export interface BatchResult {
    ok: boolean;
    output?: unknown;
    error?: {
        code: string;
        message: string;
    };
}
```

#### `CircuitBreakerOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L11) `packages/i18n/src/resilience.ts`

```ts
export interface CircuitBreakerOptions {
    failureThreshold: number;
    resetMs: number;
}
```

#### `CreateI18nClientOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/client.ts#L41) `packages/i18n/src/client.ts`

```ts
export interface CreateI18nClientOptions {
    provider?: I18nProvider;
    locale?: Locale;
    fallbackLocale?: Locale;
    messages?: Messages;
}
```

#### `I18nClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/client.ts#L29) `packages/i18n/src/client.ts`

```ts
export interface I18nClient {
    provider: I18nProvider;
    locale: Locale;
    fallbackLocale: Locale;
    setLocale: (locale: Locale) => void;
    translate: (key: string, options?: TranslateOptions) => TranslateResult;
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
    formatDate: (value: number | Date, options?: Intl.DateTimeFormatOptions) => string;
    listRecorded: () => TranslateResult[];
    clear: () => void;
}
```

#### `I18nProvider`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/client.ts#L3) `packages/i18n/src/client.ts`

```ts
export type I18nProvider = 'next-intl' | 'vue-i18n' | 'react-i18next' | 'lingui';
```

#### `InterpolateResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/interpolate.ts#L3) `packages/i18n/src/interpolate.ts`

```ts
export interface InterpolateResult {
    text: string;
    variables: string[];
    missing: string[];
}
```

#### `Locale`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/client.ts#L5) `packages/i18n/src/client.ts`

```ts
export type Locale = string;
```

#### `MessageBundle`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/client.ts#L9) `packages/i18n/src/client.ts`

```ts
export type MessageBundle = {
    [key: string]: MessageEntry;
};
```

#### `Messages`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/client.ts#L11) `packages/i18n/src/client.ts`

```ts
export type Messages = Record<Locale, MessageBundle>;
```

#### `ObservabilityHook`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L12) `packages/i18n/src/resilience.ts`

```ts
export interface ObservabilityHook {
    onStart?: (name: string, input?: unknown) => void;
    onSuccess?: (name: string, output: unknown, durationMs: number) => void;
    onError?: (name: string, err: unknown, durationMs: number) => void;
}
```

#### `PluralCategory`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/plural.ts#L1) `packages/i18n/src/plural.ts`

```ts
export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
```

#### `PluralRule`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/plural.ts#L3) `packages/i18n/src/plural.ts`

```ts
export interface PluralRule {
    locale: string;
    category: PluralCategory;
    count: number;
}
```

#### `RateLimitOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L10) `packages/i18n/src/resilience.ts`

```ts
export interface RateLimitOptions {
    maxRequests: number;
    windowMs: number;
}
```

#### `RetryOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L4) `packages/i18n/src/resilience.ts`

```ts
export interface RetryOptions {
    maxAttempts: number;
    backoffMs?: number;
    retryOn?: (err: unknown) => boolean;
}
```

#### `TimeoutOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/resilience.ts#L9) `packages/i18n/src/resilience.ts`

```ts
export interface TimeoutOptions {
    ms: number;
}
```

#### `TranslateInput`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/translator.ts#L12) `packages/i18n/src/translator.ts`

```ts
export interface TranslateInput {
    key: string;
    messages: Messages;
    locale: Locale;
    fallbackLocale: Locale;
    values?: InterpolationValues;
    count?: number;
    defaultMessage?: string;
}
```

#### `TranslateOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/client.ts#L15) `packages/i18n/src/client.ts`

```ts
export interface TranslateOptions {
    values?: InterpolationValues;
    count?: number;
    defaultMessage?: string;
    locale?: Locale;
}
```

#### `TranslateResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/client.ts#L22) `packages/i18n/src/client.ts`

```ts
export interface TranslateResult {
    text: string;
    locale: Locale;
    used: 'primary' | 'fallback' | 'default' | 'missing';
    missing?: string[];
}
```
<!-- kiwa-public-api:end -->
