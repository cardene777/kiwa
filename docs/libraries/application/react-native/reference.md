# react-native リファレンス

## API を選ぶ

通常は `createRNTestEnv` から始めます。platform、route、storage、linking を一つの test ごとに独立した状態で用意できるため、ログイン後の遷移のように複数の端末 API をまたぐ処理に向いています。AsyncStorage だけを対象にする unit test では `mockAsyncStorage`、navigation の stack だけを固定する test では `mockNavigation` を直接作れます。

URL をイベントとして流すときは `dispatchLinkingUrl` を使います。この API は route を決めません。URL の許可規則を test する場合は `matchDeepLink`、アプリ固有の route へ送る場合は listener 内の変換を組み合わせます。`setPlatform` と `setDimensions` は、同じ環境を作り直さずに OS と画面サイズの分岐を確認する API です。

## 設定

`createRNTestEnv` は `platform`、`version`、`initialRoute`、`asyncStorageInitial`、`initialUrl`、`window`、`screen` を受け取ります。

## 結果の分岐

Deep Link は受信履歴と navigation の更新を別々に確認します。AsyncStorage の値、現在 route、Platform 情報は env に格納され、listener 登録だけでは route が変わりません。

## 後始末と制約

Navigation listener は返り値の解除関数を呼んでください。これは React Native 本体や端末シミュレーターを起動せず、メモリ上の状態とイベント履歴だけを扱います。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>circuit-open</code> | [packages/react-native/src/extensions.ts](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L202) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>batchAsync</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L228) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export declare function batchAsync<T>(fns: Array<() => Promise<T>>, options?: BatchOptions): Promise<BatchResult<T>>;
```

#### <code v-pre>createCircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L192) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export declare function createCircuitBreaker(options: CircuitBreakerOptions): CircuitBreaker;
```

#### <code v-pre>createNotificationPermissionMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L92) <code v-pre>packages/react-native/src/extensions.ts</code>

notification permission mock — iOS/Android 統一

```ts
export declare function createNotificationPermissionMock(initial?: NotificationPermission): NotificationPermissionMock;
```

#### <code v-pre>createObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L120) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export declare function createObservabilityHook(): ObservabilityHook;
```

#### <code v-pre>createRateLimiter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L159) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export declare function createRateLimiter(options: RateLimitOptions): RateLimiter;
```

#### <code v-pre>createRNTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/env.ts#L31) <code v-pre>packages/react-native/src/env.ts</code>

RN test env bundle。 5 primitive (platform / dimensions / asyncStorage / navigation / linking) を 1 env に集約、 test setup で 1 呼出しすれば全 API mock が使える。

```ts
export declare function createRNTestEnv(options?: CreateRNTestEnvOptions): RNTestEnv;
```

#### <code v-pre>dispatchLinkingUrl</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/linking.ts#L22) <code v-pre>packages/react-native/src/linking.ts</code>

Linking.addEventListener 相当 event 発火 mock。 deep link / universal link の simulation を in-process で行う。

```ts
export declare function dispatchLinkingUrl(state: LinkingState, url: string, timestamp?: number): LinkingEvent;
```

#### <code v-pre>matchDeepLink</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L58) <code v-pre>packages/react-native/src/extensions.ts</code>

deep link URL を pattern に対して match、 param 抽出

```ts
export declare function matchDeepLink(url: string, patterns: DeepLinkPattern[]): DeepLinkMatch;
```

#### <code v-pre>mockAsyncStorage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/async-storage.ts#L17) <code v-pre>packages/react-native/src/async-storage.ts</code>

```ts
export declare function mockAsyncStorage(initial?: AsyncStorageInitial): AsyncStorageMock;
```

#### <code v-pre>mockNavigation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/navigation.ts#L19) <code v-pre>packages/react-native/src/navigation.ts</code>

```ts
export declare function mockNavigation(initialRoute: NavigationRoute): NavigationMock;
```

#### <code v-pre>retryWithBackoff</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L21) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<RetryResult<T>>;
```

#### <code v-pre>setDimensions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/dimensions.ts#L10) <code v-pre>packages/react-native/src/dimensions.ts</code>

Dimensions.get('window') / .get('screen') 値差替。 iPhone / iPad / Android 各 form factor を切替、 responsive layout の test を書く経路。

```ts
export declare function setDimensions(state: DimensionsState, next: {
    window?: Partial<DimensionsState['window']>;
    screen?: Partial<DimensionsState['screen']>;
}): DimensionsState;
```

#### <code v-pre>setPlatform</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/platform.ts#L14) <code v-pre>packages/react-native/src/platform.ts</code>

Platform.OS / Platform.Version 値差替。 iOS / Android / web / windows / macos の 5 OS を 切替可能、 test 内で platform-dependent path の分岐を verify する経路。

```ts
export declare function setPlatform(state: PlatformState, next: {
    os?: RNPlatformOS;
    version?: number | string;
    isPad?: boolean;
    isTV?: boolean;
}): PlatformState;
```

#### <code v-pre>withTimeout</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L134) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export declare function withTimeout<T>(fn: () => Promise<T>, options: TimeoutOptions): Promise<T>;
```

### 型

#### <code v-pre>AsyncStorageInitial</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/async-storage.ts#L1) <code v-pre>packages/react-native/src/async-storage.ts</code>

```ts
export type AsyncStorageInitial = Record<string, string>;
```

#### <code v-pre>AsyncStorageMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/async-storage.ts#L3) <code v-pre>packages/react-native/src/async-storage.ts</code>

```ts
export interface AsyncStorageMock {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
    clear: () => Promise<void>;
    getAllKeys: () => Promise<string[]>;
    multiGet: (keys: string[]) => Promise<Array<[string, string | null]>>;
    multiSet: (pairs: Array<[string, string]>) => Promise<void>;
}
```

#### <code v-pre>BatchOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L218) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export interface BatchOptions {
    concurrency?: number;
}
```

#### <code v-pre>BatchResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L222) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export interface BatchResult<T> {
    successCount: number;
    failureCount: number;
    results: Array<{
        ok: boolean;
        value?: T;
        error?: unknown;
    }>;
}
```

#### <code v-pre>CircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L186) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export interface CircuitBreaker {
    state: () => CircuitState;
    execute: <T>(fn: () => Promise<T>) => Promise<T>;
    reset: () => void;
}
```

#### <code v-pre>CircuitBreakerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L181) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export interface CircuitBreakerOptions {
    failureThreshold: number;
    resetTimeoutMs: number;
}
```

#### <code v-pre>CircuitState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L179) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export type CircuitState = 'closed' | 'open' | 'half-open';
```

#### <code v-pre>CreateRNTestEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/env.ts#L9) <code v-pre>packages/react-native/src/env.ts</code>

```ts
export interface CreateRNTestEnvOptions {
    platform?: RNPlatformOS;
    version?: number | string;
    initialRoute?: NavigationRoute;
    asyncStorageInitial?: AsyncStorageInitial;
    initialUrl?: string;
    window?: {
        width: number;
        height: number;
        scale?: number;
    };
    screen?: {
        width: number;
        height: number;
        scale?: number;
    };
}
```

#### <code v-pre>DeepLinkMatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L49) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export interface DeepLinkMatch {
    matched: boolean;
    scheme: string;
    host?: string;
    path?: string;
    params?: Record<string, string>;
}
```

#### <code v-pre>DeepLinkPattern</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L43) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export interface DeepLinkPattern {
    scheme: string;
    host?: string;
    pathPattern?: RegExp;
}
```

#### <code v-pre>DimensionsState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/dimensions.ts#L1) <code v-pre>packages/react-native/src/dimensions.ts</code>

```ts
export interface DimensionsState {
    window: {
        width: number;
        height: number;
        scale: number;
    };
    screen: {
        width: number;
        height: number;
        scale: number;
    };
}
```

#### <code v-pre>LinkingEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/linking.ts#L1) <code v-pre>packages/react-native/src/linking.ts</code>

```ts
export interface LinkingEvent {
    url: string;
    timestamp: number;
}
```

#### <code v-pre>LinkingListener</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/linking.ts#L6) <code v-pre>packages/react-native/src/linking.ts</code>

```ts
export type LinkingListener = (event: LinkingEvent) => void;
```

#### <code v-pre>NavigationMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/navigation.ts#L6) <code v-pre>packages/react-native/src/navigation.ts</code>

```ts
export interface NavigationMock {
    currentRoute: () => NavigationRoute;
    navigate: (name: string, params?: Record<string, unknown>) => void;
    goBack: () => boolean;
    reset: (route: NavigationRoute) => void;
    history: () => NavigationRoute[];
    addListener: (event: 'focus' | 'blur' | 'state', cb: (payload: NavigationRoute) => void) => () => void;
}
```

#### <code v-pre>NavigationRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/navigation.ts#L1) <code v-pre>packages/react-native/src/navigation.ts</code>

```ts
export interface NavigationRoute {
    name: string;
    params?: Record<string, unknown>;
}
```

#### <code v-pre>NotificationPermission</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L83) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export type NotificationPermission = 'granted' | 'denied' | 'undetermined';
```

#### <code v-pre>NotificationPermissionMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L85) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export interface NotificationPermissionMock {
    status: () => NotificationPermission;
    request: () => Promise<NotificationPermission>;
    set: (status: NotificationPermission) => void;
}
```

#### <code v-pre>ObservabilityEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L108) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export interface ObservabilityEvent {
    kind: string;
    data: Record<string, unknown>;
    timestamp: number;
}
```

#### <code v-pre>ObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L114) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export interface ObservabilityHook {
    emit: (event: ObservabilityEvent) => void;
    events: () => ObservabilityEvent[];
    clear: () => void;
}
```

#### <code v-pre>PlatformState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/platform.ts#L3) <code v-pre>packages/react-native/src/platform.ts</code>

```ts
export interface PlatformState {
    os: RNPlatformOS;
    version: number | string;
    isPad?: boolean;
    isTV?: boolean;
}
```

#### <code v-pre>RateLimiter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L153) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export interface RateLimiter {
    tryAcquire: () => boolean;
    reset: () => void;
    remaining: () => number;
}
```

#### <code v-pre>RateLimitOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L148) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export interface RateLimitOptions {
    requestsPerSecond: number;
    burst?: number;
}
```

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L7) <code v-pre>packages/react-native/src/extensions.ts</code>

v2.1 extensions — deep link handling, notification permission, retry, batch, observability, timeout, rate limit, circuit breaker for React Native app tests. RN 0.75+ new architecture 追随。

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    backoffFactor?: number;
    onRetry?: (attempt: number, error: unknown) => void;
}
```

#### <code v-pre>RetryResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L14) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export interface RetryResult<T> {
    ok: boolean;
    attempts: number;
    value?: T;
    error?: unknown;
}
```

#### <code v-pre>RNPlatformOS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/env.ts#L7) <code v-pre>packages/react-native/src/env.ts</code>

```ts
export type RNPlatformOS = 'ios' | 'android' | 'web' | 'windows' | 'macos';
```

#### <code v-pre>RNTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/env.ts#L19) <code v-pre>packages/react-native/src/env.ts</code>

```ts
export interface RNTestEnv {
    platform: PlatformState;
    dimensions: DimensionsState;
    asyncStorage: AsyncStorageMock;
    navigation: NavigationMock;
    linking: LinkingState;
}
```

#### <code v-pre>TimeoutOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L129) <code v-pre>packages/react-native/src/extensions.ts</code>

```ts
export interface TimeoutOptions {
    timeoutMs: number;
    onTimeout?: () => void;
}
```
<!-- kiwa-public-api:end -->
