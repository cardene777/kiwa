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
| 'circuit-open' | [packages/react-native/src/extensions.ts](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L202) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/index.ts) から同期しています。各項目は公開名、実際の TypeScript 宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `batchAsync`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L228) `packages/react-native/src/extensions.ts`

```ts
export async function batchAsync<T>(fns: Array<() => Promise<T>>, options: BatchOptions = {}): Promise<BatchResult<T>>;
```

#### `createCircuitBreaker`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L192) `packages/react-native/src/extensions.ts`

```ts
export function createCircuitBreaker(options: CircuitBreakerOptions): CircuitBreaker;
```

#### `createNotificationPermissionMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L92) `packages/react-native/src/extensions.ts`

notification permission mock — iOS/Android 統一

```ts
export function createNotificationPermissionMock(initial: NotificationPermission = 'undetermined'): NotificationPermissionMock;
```

#### `createObservabilityHook`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L120) `packages/react-native/src/extensions.ts`

```ts
export function createObservabilityHook(): ObservabilityHook;
```

#### `createRateLimiter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L159) `packages/react-native/src/extensions.ts`

```ts
export function createRateLimiter(options: RateLimitOptions): RateLimiter;
```

#### `createRNTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/env.ts#L31) `packages/react-native/src/env.ts`

RN test env bundle。 5 primitive (platform / dimensions / asyncStorage / navigation / linking) を 1 env に集約、 test setup で 1 呼出しすれば全 API mock が使える。

```ts
export function createRNTestEnv(options: CreateRNTestEnvOptions = {}): RNTestEnv;
```

#### `dispatchLinkingUrl`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/linking.ts#L22) `packages/react-native/src/linking.ts`

Linking.addEventListener 相当 event 発火 mock。 deep link / universal link の simulation を in-process で行う。

```ts
export function dispatchLinkingUrl(
  state: LinkingState,
  url: string,
  timestamp: number = 0,
): LinkingEvent;
```

#### `matchDeepLink`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L58) `packages/react-native/src/extensions.ts`

deep link URL を pattern に対して match、 param 抽出

```ts
export function matchDeepLink(url: string, patterns: DeepLinkPattern[]): DeepLinkMatch;
```

#### `mockAsyncStorage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/async-storage.ts#L17) `packages/react-native/src/async-storage.ts`

```ts
export function mockAsyncStorage(initial: AsyncStorageInitial = {}): AsyncStorageMock;
```

#### `mockNavigation`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/navigation.ts#L19) `packages/react-native/src/navigation.ts`

```ts
export function mockNavigation(initialRoute: NavigationRoute): NavigationMock;
```

#### `retryWithBackoff`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L21) `packages/react-native/src/extensions.ts`

```ts
export async function retryWithBackoff<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<RetryResult<T>>;
```

#### `setDimensions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/dimensions.ts#L10) `packages/react-native/src/dimensions.ts`

Dimensions.get('window') / .get('screen') 値差替。 iPhone / iPad / Android 各 form factor を切替、 responsive layout の test を書く経路。

```ts
export function setDimensions(
  state: DimensionsState,
  next: {
    window?: Partial<DimensionsState['window']>;
    screen?: Partial<DimensionsState['screen']>;
  },
): DimensionsState;
```

#### `setPlatform`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/platform.ts#L14) `packages/react-native/src/platform.ts`

Platform.OS / Platform.Version 値差替。 iOS / Android / web / windows / macos の 5 OS を 切替可能、 test 内で platform-dependent path の分岐を verify する経路。

```ts
export function setPlatform(
  state: PlatformState,
  next: { os?: RNPlatformOS; version?: number | string; isPad?: boolean; isTV?: boolean },
): PlatformState;
```

#### `withTimeout`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L134) `packages/react-native/src/extensions.ts`

```ts
export async function withTimeout<T>(fn: () => Promise<T>, options: TimeoutOptions): Promise<T>;
```

### 型

#### `AsyncStorageInitial`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/async-storage.ts#L1) `packages/react-native/src/async-storage.ts`

```ts
export type AsyncStorageInitial = Record<string, string>;
```

#### `AsyncStorageMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/async-storage.ts#L3) `packages/react-native/src/async-storage.ts`

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

#### `BatchOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L218) `packages/react-native/src/extensions.ts`

```ts
export interface BatchOptions {
  concurrency?: number;
}
```

#### `BatchResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L222) `packages/react-native/src/extensions.ts`

```ts
export interface BatchResult<T> {
  successCount: number;
  failureCount: number;
  results: Array<{ ok: boolean; value?: T; error?: unknown }>;
}
```

#### `CircuitBreaker`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L186) `packages/react-native/src/extensions.ts`

```ts
export interface CircuitBreaker {
  state: () => CircuitState;
  execute: <T>(fn: () => Promise<T>) => Promise<T>;
  reset: () => void;
}
```

#### `CircuitBreakerOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L181) `packages/react-native/src/extensions.ts`

```ts
export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
}
```

#### `CircuitState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L179) `packages/react-native/src/extensions.ts`

```ts
export type CircuitState = 'closed' | 'open' | 'half-open';
```

#### `CreateRNTestEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/env.ts#L9) `packages/react-native/src/env.ts`

```ts
export interface CreateRNTestEnvOptions {
  platform?: RNPlatformOS;
  version?: number | string;
  initialRoute?: NavigationRoute;
  asyncStorageInitial?: AsyncStorageInitial;
  initialUrl?: string;
  window?: { width: number; height: number; scale?: number };
  screen?: { width: number; height: number; scale?: number };
}
```

#### `DeepLinkMatch`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L49) `packages/react-native/src/extensions.ts`

```ts
export interface DeepLinkMatch {
  matched: boolean;
  scheme: string;
  host?: string;
  path?: string;
  params?: Record<string, string>;
}
```

#### `DeepLinkPattern`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L43) `packages/react-native/src/extensions.ts`

```ts
export interface DeepLinkPattern {
  scheme: string;
  host?: string;
  pathPattern?: RegExp;
}
```

#### `DimensionsState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/dimensions.ts#L1) `packages/react-native/src/dimensions.ts`

```ts
export interface DimensionsState {
  window: { width: number; height: number; scale: number };
  screen: { width: number; height: number; scale: number };
}
```

#### `LinkingEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/linking.ts#L1) `packages/react-native/src/linking.ts`

```ts
export interface LinkingEvent {
  url: string;
  timestamp: number;
}
```

#### `LinkingListener`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/linking.ts#L6) `packages/react-native/src/linking.ts`

```ts
export type LinkingListener = (event: LinkingEvent) => void;
```

#### `NavigationMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/navigation.ts#L6) `packages/react-native/src/navigation.ts`

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

#### `NavigationRoute`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/navigation.ts#L1) `packages/react-native/src/navigation.ts`

```ts
export interface NavigationRoute {
  name: string;
  params?: Record<string, unknown>;
}
```

#### `NotificationPermission`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L83) `packages/react-native/src/extensions.ts`

```ts
export type NotificationPermission = 'granted' | 'denied' | 'undetermined';
```

#### `NotificationPermissionMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L85) `packages/react-native/src/extensions.ts`

```ts
export interface NotificationPermissionMock {
  status: () => NotificationPermission;
  request: () => Promise<NotificationPermission>;
  set: (status: NotificationPermission) => void;
}
```

#### `ObservabilityEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L108) `packages/react-native/src/extensions.ts`

```ts
export interface ObservabilityEvent {
  kind: string;
  data: Record<string, unknown>;
  timestamp: number;
}
```

#### `ObservabilityHook`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L114) `packages/react-native/src/extensions.ts`

```ts
export interface ObservabilityHook {
  emit: (event: ObservabilityEvent) => void;
  events: () => ObservabilityEvent[];
  clear: () => void;
}
```

#### `PlatformState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/platform.ts#L3) `packages/react-native/src/platform.ts`

```ts
export interface PlatformState {
  os: RNPlatformOS;
  version: number | string;
  isPad?: boolean;
  isTV?: boolean;
}
```

#### `RateLimiter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L153) `packages/react-native/src/extensions.ts`

```ts
export interface RateLimiter {
  tryAcquire: () => boolean;
  reset: () => void;
  remaining: () => number;
}
```

#### `RateLimitOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L148) `packages/react-native/src/extensions.ts`

```ts
export interface RateLimitOptions {
  requestsPerSecond: number;
  burst?: number;
}
```

#### `RetryOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L7) `packages/react-native/src/extensions.ts`

v2.1 extensions — deep link handling, notification permission, retry, batch, observability, timeout, rate limit, circuit breaker for React Native app tests. RN 0.75+ new architecture 追随。

```ts
export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number, error: unknown) => void;
}
```

#### `RetryResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L14) `packages/react-native/src/extensions.ts`

```ts
export interface RetryResult<T> {
  ok: boolean;
  attempts: number;
  value?: T;
  error?: unknown;
}
```

#### `RNPlatformOS`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/env.ts#L7) `packages/react-native/src/env.ts`

```ts
export type RNPlatformOS = 'ios' | 'android' | 'web' | 'windows' | 'macos';
```

#### `RNTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/env.ts#L19) `packages/react-native/src/env.ts`

```ts
export interface RNTestEnv {
  platform: PlatformState;
  dimensions: DimensionsState;
  asyncStorage: AsyncStorageMock;
  navigation: NavigationMock;
  linking: LinkingState;
}
```

#### `TimeoutOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/extensions.ts#L129) `packages/react-native/src/extensions.ts`

```ts
export interface TimeoutOptions {
  timeoutMs: number;
  onTimeout?: () => void;
}
```
<!-- kiwa-public-api:end -->
