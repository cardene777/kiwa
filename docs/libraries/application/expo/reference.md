# @kiwa-lab/expo リファレンス

## Expo test environment

`createExpoTestEnv(options)` は router、secure store、file system、camera、scheduled list、時刻関数、notification id generator を返します。option には各 mock の option と `nowFn` を渡せます。`reset()` は各 mock の clear、scheduled list、notification id の連番を初期化します。

## router と secure store

`mockExpoRouter` は `initialPath` と `initialParams` を受け取ります。`push` は stack に追加、`replace` は最上位を置換、`back` は最上位を一つ戻します。stack が一件だけの `back` でも history には back が記録されます。

`mockSecureStore` は `initial` と `failOn` を受け取ります。`setItemAsync`、`getItemAsync`、`deleteItemAsync` は Promise を返し、`listKeys` は保存された key、`clear` はすべての値を消去します。

## notification と file system

`dispatchNotification(env, payload)` は `identifier` と `scheduled` status を返します。payload の必須 field は title と body です。`scheduledAt` は env の `nowFn` で決まります。

`mockFileSystem` は document と cache directory の URI、read、write、info、delete、list、clear を提供します。ファイルサイズは content の string length です。

## camera

`mockCamera` は `initialPermission`、既定の width と height、URI prefix を受け取ります。permission は `granted`、`denied`、`undetermined` です。`takePictureAsync` は base64 と exif option を受け取り、`recordAsync` は任意の `maxDurationMs` を返します。

## 拡張 API

`mockEASUpdate`、`mockModal`、`retryWithBackoff`、`batchAsync`、`withTimeout`、rate limiter、circuit breaker、observability hook は Expo SDK を直接操作しない補助 API です。状態を持つものはテストごとに作成してください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>Camera permission not granted (status=$&#123;permission&#125;)</code> | [packages/expo/src/camera.ts](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/camera.ts#L57) |
| <code v-pre>Camera permission not granted (status=$&#123;permission&#125;)</code> | [packages/expo/src/camera.ts](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/camera.ts#L70) |
| <code v-pre>circuit-open</code> | [packages/expo/src/extensions.ts](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L183) |
| <code v-pre>File not found: $&#123;uri&#125;</code> | [packages/expo/src/file-system.ts](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/file-system.ts#L41) |
| <code v-pre>SecureStore setItemAsync failed for key: $&#123;key&#125;</code> | [packages/expo/src/secure-store.ts](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/secure-store.ts#L24) |
| <code v-pre>SecureStore getItemAsync failed for key: $&#123;key&#125;</code> | [packages/expo/src/secure-store.ts](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/secure-store.ts#L28) |
| <code v-pre>SecureStore deleteItemAsync failed for key: $&#123;key&#125;</code> | [packages/expo/src/secure-store.ts](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/secure-store.ts#L32) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>batchAsync</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L113) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export declare function batchAsync<T>(fns: Array<() => Promise<T>>, concurrency?: number): Promise<BatchResult<T>>;
```

#### <code v-pre>createCircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L173) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export declare function createCircuitBreaker(failureThreshold: number, resetTimeoutMs: number): CircuitBreaker;
```

#### <code v-pre>createExpoTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/env.ts#L30) <code v-pre>packages/expo/src/env.ts</code>

Expo runtime mock env。 Router / SecureStore / Notifications / FileSystem / Camera の 5 SDK mock を集約、 単一 env object 経由で全 SDK を叩ける。

```ts
export declare function createExpoTestEnv(options?: CreateExpoTestEnvOptions): ExpoTestEnv;
```

#### <code v-pre>createObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L132) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export declare function createObservabilityHook(): ObservabilityHook;
```

#### <code v-pre>createRateLimiter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L151) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export declare function createRateLimiter(rps: number, burst?: number): RateLimiter;
```

#### <code v-pre>dispatchNotification</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/notifications.ts#L25) <code v-pre>packages/expo/src/notifications.ts</code>

expo-notifications の scheduleNotificationAsync / presentNotificationAsync mock。 env が保持する scheduled list に push、 identifier を返す。

```ts
export declare function dispatchNotification(env: {
    scheduled: ScheduledNotification[];
    nowFn: () => number;
    nextId: () => string;
}, payload: NotificationPayload): NotificationDispatchResult;
```

#### <code v-pre>mockCamera</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/camera.ts#L38) <code v-pre>packages/expo/src/camera.ts</code>

expo-camera mock。 permission request + takePicture + recordVideo を deterministic に返す。 実 camera 起動なしで permission flow + capture pipeline の test を書ける。

```ts
export declare function mockCamera(options?: CameraOptions): CameraMock;
```

#### <code v-pre>mockEASUpdate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L23) <code v-pre>packages/expo/src/extensions.ts</code>

EAS Update API mock — expo-updates 相当

```ts
export declare function mockEASUpdate(initial?: EASUpdateManifest[]): EASUpdateMock;
```

#### <code v-pre>mockExpoRouter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/router.ts#L23) <code v-pre>packages/expo/src/router.ts</code>

expo-router (file-based routing) mock。 push / replace / back の 3 navigation を 内部 stack で管理、 history を snapshot 経由で verify 可能にする。

```ts
export declare function mockExpoRouter(options?: ExpoRouterOptions): ExpoRouterMock;
```

#### <code v-pre>mockFileSystem</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/file-system.ts#L29) <code v-pre>packages/expo/src/file-system.ts</code>

expo-file-system の read / write / info / delete mock。 in-memory Map で uri → content 保管、 実 file I/O なしで file 経路の test を書ける。

```ts
export declare function mockFileSystem(options?: FileSystemOptions): FileSystemMock;
```

#### <code v-pre>mockModal</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L66) <code v-pre>packages/expo/src/extensions.ts</code>

Modal presentation mock

```ts
export declare function mockModal(): ModalMock;
```

#### <code v-pre>mockSecureStore</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/secure-store.ts#L18) <code v-pre>packages/expo/src/secure-store.ts</code>

expo-secure-store (Keychain / Keystore backed) mock。 in-memory Map で key-value 保管、 async signature を維持して production code と同 API で叩ける。

```ts
export declare function mockSecureStore(options?: SecureStoreOptions): SecureStoreMock;
```

#### <code v-pre>retryWithBackoff</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L93) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<RetryResult<T>>;
```

#### <code v-pre>withTimeout</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L141) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export declare function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T>;
```

### 型

#### <code v-pre>BatchResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L111) <code v-pre>packages/expo/src/extensions.ts</code>

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

#### <code v-pre>CameraMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/camera.ts#L23) <code v-pre>packages/expo/src/camera.ts</code>

```ts
export interface CameraMock {
    requestCameraPermissionsAsync: () => Promise<{
        status: CameraPermissionStatus;
        granted: boolean;
    }>;
    getCameraPermissionsAsync: () => Promise<{
        status: CameraPermissionStatus;
        granted: boolean;
    }>;
    takePictureAsync: (options?: {
        base64?: boolean;
        exif?: boolean;
    }) => Promise<CapturedPicture>;
    recordAsync: (options?: {
        maxDurationMs?: number;
    }) => Promise<CapturedVideo>;
    setPermission: (status: CameraPermissionStatus) => void;
    getCapturedPictures: () => CapturedPicture[];
    getRecordedVideos: () => CapturedVideo[];
    clear: () => void;
}
```

#### <code v-pre>CameraOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/camera.ts#L16) <code v-pre>packages/expo/src/camera.ts</code>

```ts
export interface CameraOptions {
    initialPermission?: CameraPermissionStatus;
    defaultWidth?: number;
    defaultHeight?: number;
    uriPrefix?: string;
}
```

#### <code v-pre>CameraPermissionStatus</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/camera.ts#L1) <code v-pre>packages/expo/src/camera.ts</code>

```ts
export type CameraPermissionStatus = 'granted' | 'denied' | 'undetermined';
```

#### <code v-pre>CapturedPicture</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/camera.ts#L3) <code v-pre>packages/expo/src/camera.ts</code>

```ts
export interface CapturedPicture {
    uri: string;
    width: number;
    height: number;
    base64?: string;
    exif?: Record<string, unknown>;
}
```

#### <code v-pre>CapturedVideo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/camera.ts#L11) <code v-pre>packages/expo/src/camera.ts</code>

```ts
export interface CapturedVideo {
    uri: string;
    durationMs: number;
}
```

#### <code v-pre>CircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L171) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export interface CircuitBreaker {
    state: () => CircuitState;
    execute: <T>(fn: () => Promise<T>) => Promise<T>;
    reset: () => void;
}
```

#### <code v-pre>CircuitState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L169) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export type CircuitState = 'closed' | 'open' | 'half-open';
```

#### <code v-pre>CreateExpoTestEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/env.ts#L7) <code v-pre>packages/expo/src/env.ts</code>

```ts
export interface CreateExpoTestEnvOptions {
    router?: ExpoRouterOptions;
    secureStore?: SecureStoreOptions;
    fileSystem?: FileSystemOptions;
    camera?: CameraOptions;
    nowFn?: () => number;
}
```

#### <code v-pre>EASUpdateManifest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L6) <code v-pre>packages/expo/src/extensions.ts</code>

v2.1 extensions — EAS Update API mock, Modal presentation, retry, batch, observability, timeout, rate limit, circuit breaker for Expo SDK 52+.

```ts
export interface EASUpdateManifest {
    id: string;
    runtimeVersion: string;
    createdAt: number;
    isEnabled: boolean;
    channel: string;
}
```

#### <code v-pre>EASUpdateMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L14) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export interface EASUpdateMock {
    checkForUpdateAsync: () => Promise<{
        isAvailable: boolean;
        manifest?: EASUpdateManifest;
    }>;
    fetchUpdateAsync: () => Promise<{
        isNew: boolean;
        manifest?: EASUpdateManifest;
    }>;
    reloadAsync: () => Promise<void>;
    addListener: (fn: (event: {
        type: string;
        manifest?: EASUpdateManifest;
    }) => void) => () => void;
    publishUpdate: (manifest: EASUpdateManifest) => void;
}
```

#### <code v-pre>ExpoRouterMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/router.ts#L8) <code v-pre>packages/expo/src/router.ts</code>

```ts
export interface ExpoRouterMock {
    push: (path: string, params?: Record<string, string>) => void;
    replace: (path: string, params?: Record<string, string>) => void;
    back: () => void;
    getCurrentPath: () => string;
    getCurrentParams: () => Record<string, string>;
    getSegments: () => string[];
    getHistory: () => RouterNavigation[];
    clear: () => void;
}
```

#### <code v-pre>ExpoRouterOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/router.ts#L3) <code v-pre>packages/expo/src/router.ts</code>

```ts
export interface ExpoRouterOptions {
    initialPath?: string;
    initialParams?: Record<string, string>;
}
```

#### <code v-pre>ExpoTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/env.ts#L15) <code v-pre>packages/expo/src/env.ts</code>

```ts
export interface ExpoTestEnv {
    router: ExpoRouterMock;
    secureStore: SecureStoreMock;
    fileSystem: FileSystemMock;
    camera: CameraMock;
    scheduled: ScheduledNotification[];
    nowFn: () => number;
    nextId: () => string;
    reset: () => void;
}
```

#### <code v-pre>FileInfo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/file-system.ts#L1) <code v-pre>packages/expo/src/file-system.ts</code>

```ts
export interface FileInfo {
    exists: boolean;
    uri: string;
    size?: number;
    isDirectory?: boolean;
    modificationTime?: number;
}
```

#### <code v-pre>FileSystemMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/file-system.ts#L14) <code v-pre>packages/expo/src/file-system.ts</code>

```ts
export interface FileSystemMock {
    documentDirectory: string;
    cacheDirectory: string;
    readAsStringAsync: (uri: string) => Promise<string>;
    writeAsStringAsync: (uri: string, content: string) => Promise<void>;
    getInfoAsync: (uri: string) => Promise<FileInfo>;
    deleteAsync: (uri: string) => Promise<void>;
    listUris: () => string[];
    clear: () => void;
}
```

#### <code v-pre>FileSystemOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/file-system.ts#L9) <code v-pre>packages/expo/src/file-system.ts</code>

```ts
export interface FileSystemOptions {
    initial?: Record<string, string>;
    nowFn?: () => number;
}
```

#### <code v-pre>ModalMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L58) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export interface ModalMock {
    present: (options?: ModalOptions) => void;
    dismiss: () => void;
    isVisible: () => boolean;
    history: () => Array<{
        action: 'present' | 'dismiss';
        options?: ModalOptions;
        at: number;
    }>;
}
```

#### <code v-pre>ModalOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L52) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export interface ModalOptions {
    animation?: 'slide' | 'fade' | 'none';
    presentationStyle?: 'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen';
    transparent?: boolean;
}
```

#### <code v-pre>NotificationDispatchResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/notifications.ts#L15) <code v-pre>packages/expo/src/notifications.ts</code>

```ts
export interface NotificationDispatchResult {
    identifier: string;
    status: 'scheduled' | 'delivered' | 'failed';
    reason?: string;
}
```

#### <code v-pre>NotificationPayload</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/notifications.ts#L1) <code v-pre>packages/expo/src/notifications.ts</code>

```ts
export interface NotificationPayload {
    title: string;
    body: string;
    data?: Record<string, unknown>;
    trigger?: {
        seconds: number;
    } | {
        channelId: string;
    } | null;
    channelId?: string;
}
```

#### <code v-pre>ObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L126) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export interface ObservabilityHook {
    emit: (event: {
        kind: string;
        data: Record<string, unknown>;
        timestamp: number;
    }) => void;
    events: () => Array<{
        kind: string;
        data: Record<string, unknown>;
        timestamp: number;
    }>;
    clear: () => void;
}
```

#### <code v-pre>RateLimiter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L149) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export interface RateLimiter {
    tryAcquire: () => boolean;
    reset: () => void;
    remaining: () => number;
}
```

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L85) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    backoffFactor?: number;
}
```

#### <code v-pre>RetryResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/extensions.ts#L91) <code v-pre>packages/expo/src/extensions.ts</code>

```ts
export interface RetryResult<T> {
    ok: boolean;
    attempts: number;
    value?: T;
    error?: unknown;
}
```

#### <code v-pre>RouterNavigation</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/router.ts#L1) <code v-pre>packages/expo/src/router.ts</code>

```ts
export type RouterNavigation = {
    type: 'push' | 'replace' | 'back';
    path?: string;
    params?: Record<string, string>;
};
```

#### <code v-pre>ScheduledNotification</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/notifications.ts#L9) <code v-pre>packages/expo/src/notifications.ts</code>

```ts
export interface ScheduledNotification {
    identifier: string;
    payload: NotificationPayload;
    scheduledAt: number;
}
```

#### <code v-pre>SecureStoreMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/secure-store.ts#L6) <code v-pre>packages/expo/src/secure-store.ts</code>

```ts
export interface SecureStoreMock {
    setItemAsync: (key: string, value: string) => Promise<void>;
    getItemAsync: (key: string) => Promise<string | null>;
    deleteItemAsync: (key: string) => Promise<void>;
    listKeys: () => string[];
    clear: () => void;
}
```

#### <code v-pre>SecureStoreOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/secure-store.ts#L1) <code v-pre>packages/expo/src/secure-store.ts</code>

```ts
export interface SecureStoreOptions {
    initial?: Record<string, string>;
    failOn?: (key: string) => boolean;
}
```
<!-- kiwa-public-api:end -->
