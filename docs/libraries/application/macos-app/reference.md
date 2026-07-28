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
| <code v-pre>rate limit $&#123;options.maxRequests&#125;/$&#123;options.windowMs&#125;ms exceeded</code> | [packages/macos-app/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L57) |
| <code v-pre>circuit breaker open</code> | [packages/macos-app/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L72) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>batchOperate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L111) <code v-pre>packages/macos-app/src/resilience.ts</code>

```ts
export declare function batchOperate<TIn, TOut>(items: readonly BatchItem<TIn>[], runner: (item: BatchItem<TIn>) => Promise<TOut>): Promise<BatchResult[]>;
```

#### <code v-pre>captureAccessibilityTree</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/accessibility.ts#L34) <code v-pre>packages/macos-app/src/accessibility.ts</code>

SwiftUI / AppKit view tree を macOS accessibility API (AXUIElement) が返す tree に mapping。 tree walk 済み snapshot を返し、 user assert (label 存在 / role 一致 / total node 数) を可能にする。 実 AX API は起動せず view attributes から機械的に role を 推定する。

```ts
export declare function captureAccessibilityTree(env: MacAppEnv): AccessibilityTree;
```

#### <code v-pre>createMacAppEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/env.ts#L55) <code v-pre>packages/macos-app/src/env.ts</code>

mock native app env を生成。 mode = 'swiftui' は declarative View tree の初期状態、 'appkit' は imperative responder chain の初期 window を返す。 real XCTest 起動なしで bundle info / window / view tree / accessibility descriptor を保持する。

```ts
export declare function createMacAppEnv(options?: CreateMacAppEnvOptions): MacAppEnv;
```

#### <code v-pre>emitUserNotification</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/notification.ts#L35) <code v-pre>packages/macos-app/src/notification.ts</code>

UserNotifications framework の schedule API 相当を mock。 実 UNUserNotificationCenter は 起動せず、 env.eventLog に notification schedule を記録して user が listSent 相当で assert 可能にする。

```ts
export declare function emitUserNotification(env: MacAppEnv, notification: UserNotification): NotificationResult;
```

#### <code v-pre>mockScreencap</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/screencap.ts#L34) <code v-pre>packages/macos-app/src/screencap.ts</code>

CGDisplayCreateImage 相当の mock screencap を生成。 実 GPU capture ではなく、 region + 決定的 pixel data (env.id + region ハッシュ) から magic 付きの mock byte 列を 返す。 caller は format magic + length + region 契約を assert 可能。

```ts
export declare function mockScreencap(env: MacAppEnv, options?: ScreencapOptions): ScreencapResult;
```

#### <code v-pre>simulateUserInteraction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/interaction.ts#L27) <code v-pre>packages/macos-app/src/interaction.ts</code>

view tree を walk して target id を探索、 見つかったら enabled かつ mode-specific な dispatchable node であれば event を eventLog に記録する。 responder chain (AppKit) や SwiftUI の

```ts
export declare function simulateUserInteraction(env: MacAppEnv, event: InteractionEvent): InteractionResult;
```

#### <code v-pre>withCircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L64) <code v-pre>packages/macos-app/src/resilience.ts</code>

```ts
export declare function withCircuitBreaker<T>(fn: () => Promise<T>, options: CircuitBreakerOptions): () => Promise<T>;
```

#### <code v-pre>withIdempotencyKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L101) <code v-pre>packages/macos-app/src/resilience.ts</code>

```ts
export declare function withIdempotencyKey<T>(fn: (key: string) => Promise<T>): (key: string) => Promise<T>;
```

#### <code v-pre>withObservability</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L86) <code v-pre>packages/macos-app/src/resilience.ts</code>

```ts
export declare function withObservability<T>(name: string, fn: () => Promise<T>, hook: ObservabilityHook): () => Promise<T>;
```

#### <code v-pre>withRateLimit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L50) <code v-pre>packages/macos-app/src/resilience.ts</code>

```ts
export declare function withRateLimit<T>(fn: () => Promise<T>, options: RateLimitOptions): () => Promise<T>;
```

#### <code v-pre>withRetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L20) <code v-pre>packages/macos-app/src/resilience.ts</code>

```ts
export declare function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): () => Promise<T>;
```

#### <code v-pre>withTimeout</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L40) <code v-pre>packages/macos-app/src/resilience.ts</code>

```ts
export declare function withTimeout<T>(fn: () => Promise<T>, options: TimeoutOptions): () => Promise<T>;
```

### 型

#### <code v-pre>AccessibilityNode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/accessibility.ts#L13) <code v-pre>packages/macos-app/src/accessibility.ts</code>

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

#### <code v-pre>AccessibilityRole</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/accessibility.ts#L3) <code v-pre>packages/macos-app/src/accessibility.ts</code>

```ts
export type AccessibilityRole = 'AXWindow' | 'AXGroup' | 'AXStaticText' | 'AXButton' | 'AXTextField' | 'AXCheckBox' | 'AXImage' | 'AXUnknown';
```

#### <code v-pre>AccessibilityTree</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/accessibility.ts#L22) <code v-pre>packages/macos-app/src/accessibility.ts</code>

```ts
export interface AccessibilityTree {
    root: AccessibilityNode;
    totalNodes: number;
    capturedAt: number;
}
```

#### <code v-pre>BatchItem</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L17) <code v-pre>packages/macos-app/src/resilience.ts</code>

```ts
export interface BatchItem<TIn = unknown> {
    name: string;
    input: TIn;
}
```

#### <code v-pre>BatchResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L18) <code v-pre>packages/macos-app/src/resilience.ts</code>

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

#### <code v-pre>BundleInfo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/env.ts#L3) <code v-pre>packages/macos-app/src/env.ts</code>

```ts
export interface BundleInfo {
    bundleId: string;
    version: string;
    build: string;
    executable: string;
}
```

#### <code v-pre>CircuitBreakerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L11) <code v-pre>packages/macos-app/src/resilience.ts</code>

```ts
export interface CircuitBreakerOptions {
    failureThreshold: number;
    resetMs: number;
}
```

#### <code v-pre>CreateMacAppEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/env.ts#L30) <code v-pre>packages/macos-app/src/env.ts</code>

```ts
export interface CreateMacAppEnvOptions {
    mode?: MacAppMode;
    bundleId?: string;
    windowTitle?: string;
    initialView?: ViewNode;
    now?: () => number;
}
```

#### <code v-pre>InteractionEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/interaction.ts#L5) <code v-pre>packages/macos-app/src/interaction.ts</code>

```ts
export interface InteractionEvent {
    type: InteractionType;
    target: string;
    key?: string;
    gesture?: 'swipe' | 'pinch' | 'rotate' | 'longPress';
    modifiers?: Array<'cmd' | 'ctrl' | 'opt' | 'shift'>;
}
```

#### <code v-pre>InteractionResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/interaction.ts#L13) <code v-pre>packages/macos-app/src/interaction.ts</code>

```ts
export interface InteractionResult {
    dispatched: boolean;
    targetFound: boolean;
    targetType?: string;
    handled: boolean;
    reason?: string;
}
```

#### <code v-pre>InteractionType</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/interaction.ts#L3) <code v-pre>packages/macos-app/src/interaction.ts</code>

```ts
export type InteractionType = 'click' | 'keypress' | 'gesture' | 'focus';
```

#### <code v-pre>MacAppEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/env.ts#L38) <code v-pre>packages/macos-app/src/env.ts</code>

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

#### <code v-pre>MacAppMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/env.ts#L1) <code v-pre>packages/macos-app/src/env.ts</code>

```ts
export type MacAppMode = 'swiftui' | 'appkit';
```

#### <code v-pre>NotificationAction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/notification.ts#L3) <code v-pre>packages/macos-app/src/notification.ts</code>

```ts
export interface NotificationAction {
    id: string;
    title: string;
    destructive?: boolean;
}
```

#### <code v-pre>NotificationResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/notification.ts#L20) <code v-pre>packages/macos-app/src/notification.ts</code>

```ts
export interface NotificationResult {
    id: string;
    scheduled: boolean;
    scheduledAt: number;
    bundleId: string;
    reason?: string;
}
```

#### <code v-pre>ObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L12) <code v-pre>packages/macos-app/src/resilience.ts</code>

```ts
export interface ObservabilityHook {
    onStart?: (name: string, input?: unknown) => void;
    onSuccess?: (name: string, output: unknown, durationMs: number) => void;
    onError?: (name: string, err: unknown, durationMs: number) => void;
}
```

#### <code v-pre>RateLimitOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L10) <code v-pre>packages/macos-app/src/resilience.ts</code>

```ts
export interface RateLimitOptions {
    maxRequests: number;
    windowMs: number;
}
```

#### <code v-pre>Rect</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/screencap.ts#L3) <code v-pre>packages/macos-app/src/screencap.ts</code>

```ts
export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}
```

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L4) <code v-pre>packages/macos-app/src/resilience.ts</code>

```ts
export interface RetryOptions {
    maxAttempts: number;
    backoffMs?: number;
    retryOn?: (err: unknown) => boolean;
}
```

#### <code v-pre>ScreencapOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/screencap.ts#L10) <code v-pre>packages/macos-app/src/screencap.ts</code>

```ts
export interface ScreencapOptions {
    region?: Rect;
    format?: 'png' | 'jpeg';
    scale?: number;
}
```

#### <code v-pre>ScreencapResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/screencap.ts#L16) <code v-pre>packages/macos-app/src/screencap.ts</code>

```ts
export interface ScreencapResult {
    format: 'png' | 'jpeg';
    region: Rect;
    bytes: Uint8Array;
    capturedAt: number;
    bytesLength: number;
}
```

#### <code v-pre>TimeoutOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L9) <code v-pre>packages/macos-app/src/resilience.ts</code>

```ts
export interface TimeoutOptions {
    ms: number;
}
```

#### <code v-pre>UserNotification</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/notification.ts#L9) <code v-pre>packages/macos-app/src/notification.ts</code>

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

#### <code v-pre>ViewNode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/env.ts#L20) <code v-pre>packages/macos-app/src/env.ts</code>

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

#### <code v-pre>WindowInfo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/env.ts#L10) <code v-pre>packages/macos-app/src/env.ts</code>

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
