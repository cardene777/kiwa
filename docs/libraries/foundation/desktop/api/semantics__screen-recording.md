---
title: "@kiwa-lab/desktop semantics__screen-recording の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/desktop</code> <code v-pre>semantics&#95;&#95;screen-recording</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>captureScreenChunk</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L78) <code v-pre>packages/desktop/src/semantics/screen-recording.ts</code>

```ts
export declare function captureScreenChunk(session: ScreenRecordingSession, chunkBytes: number): AxisStep<ScreenRecordingState>;
```

#### <code v-pre>requestScreenRecordingPermission</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L44) <code v-pre>packages/desktop/src/semantics/screen-recording.ts</code>

```ts
export declare function requestScreenRecordingPermission(input: {
    target: DesktopTarget;
    sessionId: string;
    displayId: string;
}): ScreenRecordingSession;
```

#### <code v-pre>startScreenRecording</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L65) <code v-pre>packages/desktop/src/semantics/screen-recording.ts</code>

```ts
export declare function startScreenRecording(session: ScreenRecordingSession, granted: boolean): AxisStep<ScreenRecordingState>;
```

#### <code v-pre>stopScreenRecording</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L96) <code v-pre>packages/desktop/src/semantics/screen-recording.ts</code>

```ts
export declare function stopScreenRecording(session: ScreenRecordingSession): AxisStep<ScreenRecordingState>;
```

### 型

#### <code v-pre>ScreenRecordingSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L14) <code v-pre>packages/desktop/src/semantics/screen-recording.ts</code>

```ts
export interface ScreenRecordingSession {
    target: DesktopTarget;
    sessionId: string;
    displayId: string;
    state: ScreenRecordingState;
    permissionGranted: boolean;
    chunksCaptured: number;
    totalBytes: number;
    history: AxisStep<ScreenRecordingState>[];
}
```

#### <code v-pre>ScreenRecordingState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/screen-recording.ts#L7) <code v-pre>packages/desktop/src/semantics/screen-recording.ts</code>

Screen-recording axis (v0.3) — permission + start + chunk + stop の 4 step 遷移。 macOS ScreenCaptureKit + Windows Windows.Graphics.Capture + Linux xdg-portal ScreenCast を uniform 扱い。

```ts
export type ScreenRecordingState = 'idle' | 'permission-requested' | 'recording' | 'chunk-captured' | 'stopped';
```
