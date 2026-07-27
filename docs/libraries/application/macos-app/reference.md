# macos-app リファレンス

## API を選ぶ

画面操作を含む test は `createMacAppEnv` から始めます。mode、bundle、window、root view を一つの環境に閉じ込められるため、test 間で操作履歴や通知の記録が混ざりません。`simulateUserInteraction` は target ID を見つけ、操作を dispatch できたかを返します。これだけでは SwiftUI の state や AppKit の responder chain は実行されないため、操作後の state を検証するにはアプリケーション側の callback も test します。

accessibility の role と label を確認する場合は `captureAccessibilityTree`、capture 要求の領域と format を固定する場合は `mockScreencap` を使います。前者は view type から role を推定し、後者は実ピクセルを撮影しません。通知の payload を組み立てる処理には `emitUserNotification` を使い、schedule の成否、bundle ID、event log を確認します。

## 設定

`createMacAppEnv` は `mode`、`bundleId`、`windowTitle`、`initialView`、`now` を受け取ります。mode は `swiftui` または `appkit` です。

## 結果の分岐

操作結果は dispatched と handled を別に持ちます。通知と view 操作は eventLog に記録されるため、実行されたこととアプリ側が処理したことを分けて検証します。

`mockScreencap` の既定領域は window 全体です。PNG は8-byte signature、JPEG は2-byte SOI marker から始まり、`bytesLength` と region を assertion できます。画像の実ピクセルや font rendering を比較する API ではありません。

`captureAccessibilityTree` は view tree を走査し、`totalNodes` と capture time を返します。role は type 名からの推定です。`emitUserNotification` は非空 title と body を要求し、成功時は bundle ID と schedule time を返します。

## 後始末と制約

環境は event log とビュー木を保持します。テストごとに新しい環境を作ってください。操作は event log への記録までで、SwiftUI の state 更新や AppKit の responder chain は実行しません。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| `rate limit ${options.maxRequests}/${options.windowMs}ms exceeded` | [packages/macos-app/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L57) |
| 'circuit breaker open' | [packages/macos-app/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L72) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `batchOperate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L111) `packages/macos-app/src/resilience.ts`

```ts
export declare function batchOperate<TIn, TOut>(items: readonly BatchItem<TIn>[], runner: (item: BatchItem<TIn>) => Promise<TOut>): Promise<BatchResult[]>;
```

#### `captureAccessibilityTree`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/accessibility.ts#L34) `packages/macos-app/src/accessibility.ts`

SwiftUI / AppKit view tree を macOS accessibility API (AXUIElement) が返す tree に mapping。 tree walk 済み snapshot を返し、 user assert (label 存在 / role 一致 / total node 数) を可能にする。 実 AX API は起動せず view attributes から機械的に role を 推定する。

```ts
export declare function captureAccessibilityTree(env: MacAppEnv): AccessibilityTree;
```

#### `createMacAppEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/env.ts#L55) `packages/macos-app/src/env.ts`

mock native app env を生成。 mode = 'swiftui' は declarative View tree の初期状態、 'appkit' は imperative responder chain の初期 window を返す。 real XCTest 起動なしで bundle info / window / view tree / accessibility descriptor を保持する。

```ts
export declare function createMacAppEnv(options?: CreateMacAppEnvOptions): MacAppEnv;
```

#### `emitUserNotification`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/notification.ts#L35) `packages/macos-app/src/notification.ts`

UserNotifications framework の schedule API 相当を mock。 実 UNUserNotificationCenter は 起動せず、 env.eventLog に notification schedule を記録して user が listSent 相当で assert 可能にする。

```ts
export declare function emitUserNotification(env: MacAppEnv, notification: UserNotification): NotificationResult;
```

#### `mockScreencap`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/screencap.ts#L34) `packages/macos-app/src/screencap.ts`

CGDisplayCreateImage 相当の mock screencap を生成。 実 GPU capture ではなく、 region + 決定的 pixel data (env.id + region ハッシュ) から magic 付きの mock byte 列を 返す。 caller は format magic + length + region 契約を assert 可能。

```ts
export declare function mockScreencap(env: MacAppEnv, options?: ScreencapOptions): ScreencapResult;
```

#### `simulateUserInteraction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/interaction.ts#L27) `packages/macos-app/src/interaction.ts`

view tree を walk して target id を探索、 見つかったら enabled かつ mode-specific な dispatchable node であれば event を eventLog に記録する。 responder chain (AppKit) や SwiftUI の

```ts
export declare function simulateUserInteraction(env: MacAppEnv, event: InteractionEvent): InteractionResult;
```

#### `withCircuitBreaker`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L64) `packages/macos-app/src/resilience.ts`

```ts
export declare function withCircuitBreaker<T>(fn: () => Promise<T>, options: CircuitBreakerOptions): () => Promise<T>;
```

#### `withIdempotencyKey`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L101) `packages/macos-app/src/resilience.ts`

```ts
export declare function withIdempotencyKey<T>(fn: (key: string) => Promise<T>): (key: string) => Promise<T>;
```

#### `withObservability`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L86) `packages/macos-app/src/resilience.ts`

```ts
export declare function withObservability<T>(name: string, fn: () => Promise<T>, hook: ObservabilityHook): () => Promise<T>;
```

#### `withRateLimit`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L50) `packages/macos-app/src/resilience.ts`

```ts
export declare function withRateLimit<T>(fn: () => Promise<T>, options: RateLimitOptions): () => Promise<T>;
```

#### `withRetry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L20) `packages/macos-app/src/resilience.ts`

```ts
export declare function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): () => Promise<T>;
```

#### `withTimeout`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L40) `packages/macos-app/src/resilience.ts`

```ts
export declare function withTimeout<T>(fn: () => Promise<T>, options: TimeoutOptions): () => Promise<T>;
```

### 型

#### `AccessibilityNode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/accessibility.ts#L13) `packages/macos-app/src/accessibility.ts`

```ts
export interface AccessibilityNode {
    id: string;
    role: AccessibilityRole;
    label: string | undefined;
    value: string | undefined;
    enabled: boolean;
    children: AccessibilityNode[];
}
```

#### `AccessibilityRole`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/accessibility.ts#L3) `packages/macos-app/src/accessibility.ts`

```ts
export type AccessibilityRole = 'AXWindow' | 'AXGroup' | 'AXStaticText' | 'AXButton' | 'AXTextField' | 'AXCheckBox' | 'AXImage' | 'AXUnknown';
```

#### `AccessibilityTree`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/accessibility.ts#L22) `packages/macos-app/src/accessibility.ts`

```ts
export interface AccessibilityTree {
    root: AccessibilityNode;
    totalNodes: number;
    capturedAt: number;
}
```

#### `BatchItem`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L17) `packages/macos-app/src/resilience.ts`

```ts
export interface BatchItem<TIn = unknown> {
    name: string;
    input: TIn;
}
```

#### `BatchResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L18) `packages/macos-app/src/resilience.ts`

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

#### `BundleInfo`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/env.ts#L3) `packages/macos-app/src/env.ts`

```ts
export interface BundleInfo {
    bundleId: string;
    version: string;
    build: string;
    executable: string;
}
```

#### `CircuitBreakerOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L11) `packages/macos-app/src/resilience.ts`

```ts
export interface CircuitBreakerOptions {
    failureThreshold: number;
    resetMs: number;
}
```

#### `CreateMacAppEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/env.ts#L30) `packages/macos-app/src/env.ts`

```ts
export interface CreateMacAppEnvOptions {
    mode?: MacAppMode;
    bundleId?: string;
    windowTitle?: string;
    initialView?: ViewNode;
    now?: () => number;
}
```

#### `InteractionEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/interaction.ts#L5) `packages/macos-app/src/interaction.ts`

```ts
export interface InteractionEvent {
    type: InteractionType;
    target: string;
    key?: string;
    gesture?: 'swipe' | 'pinch' | 'rotate' | 'longPress';
    modifiers?: Array<'cmd' | 'ctrl' | 'opt' | 'shift'>;
}
```

#### `InteractionResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/interaction.ts#L13) `packages/macos-app/src/interaction.ts`

```ts
export interface InteractionResult {
    dispatched: boolean;
    targetFound: boolean;
    targetType?: string;
    handled: boolean;
    reason?: string;
}
```

#### `InteractionType`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/interaction.ts#L3) `packages/macos-app/src/interaction.ts`

```ts
export type InteractionType = 'click' | 'keypress' | 'gesture' | 'focus';
```

#### `MacAppEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/env.ts#L38) `packages/macos-app/src/env.ts`

```ts
export interface MacAppEnv {
    mode: MacAppMode;
    bundle: BundleInfo;
    window: WindowInfo;
    rootView: ViewNode;
    eventLog: Array<{
        at: number;
        kind: string;
        detail: unknown;
    }>;
    now: () => number;
    createdAt: number;
}
```

#### `MacAppMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/env.ts#L1) `packages/macos-app/src/env.ts`

```ts
export type MacAppMode = 'swiftui' | 'appkit';
```

#### `NotificationAction`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/notification.ts#L3) `packages/macos-app/src/notification.ts`

```ts
export interface NotificationAction {
    id: string;
    title: string;
    destructive?: boolean;
}
```

#### `NotificationResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/notification.ts#L20) `packages/macos-app/src/notification.ts`

```ts
export interface NotificationResult {
    id: string;
    scheduled: boolean;
    scheduledAt: number;
    bundleId: string;
    reason?: string;
}
```

#### `ObservabilityHook`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L12) `packages/macos-app/src/resilience.ts`

```ts
export interface ObservabilityHook {
    onStart?: (name: string, input?: unknown) => void;
    onSuccess?: (name: string, output: unknown, durationMs: number) => void;
    onError?: (name: string, err: unknown, durationMs: number) => void;
}
```

#### `RateLimitOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L10) `packages/macos-app/src/resilience.ts`

```ts
export interface RateLimitOptions {
    maxRequests: number;
    windowMs: number;
}
```

#### `Rect`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/screencap.ts#L3) `packages/macos-app/src/screencap.ts`

```ts
export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}
```

#### `RetryOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L4) `packages/macos-app/src/resilience.ts`

```ts
export interface RetryOptions {
    maxAttempts: number;
    backoffMs?: number;
    retryOn?: (err: unknown) => boolean;
}
```

#### `ScreencapOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/screencap.ts#L10) `packages/macos-app/src/screencap.ts`

```ts
export interface ScreencapOptions {
    region?: Rect;
    format?: 'png' | 'jpeg';
    scale?: number;
}
```

#### `ScreencapResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/screencap.ts#L16) `packages/macos-app/src/screencap.ts`

```ts
export interface ScreencapResult {
    format: 'png' | 'jpeg';
    region: Rect;
    bytes: Uint8Array;
    capturedAt: number;
    bytesLength: number;
}
```

#### `TimeoutOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L9) `packages/macos-app/src/resilience.ts`

```ts
export interface TimeoutOptions {
    ms: number;
}
```

#### `UserNotification`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/notification.ts#L9) `packages/macos-app/src/notification.ts`

```ts
export interface UserNotification {
    id?: string;
    title: string;
    body: string;
    subtitle?: string;
    sound?: string;
    category?: string;
    actions?: NotificationAction[];
    userInfo?: Record<string, string | number | boolean>;
}
```

#### `ViewNode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/env.ts#L20) `packages/macos-app/src/env.ts`

```ts
export interface ViewNode {
    id: string;
    type: string;
    label?: string;
    value?: string;
    enabled: boolean;
    children: ViewNode[];
    attributes: Record<string, string | number | boolean>;
}
```

#### `WindowInfo`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/env.ts#L10) `packages/macos-app/src/env.ts`

```ts
export interface WindowInfo {
    id: string;
    title: string;
    width: number;
    height: number;
    x: number;
    y: number;
    visible: boolean;
}
```
<!-- kiwa-public-api:end -->
