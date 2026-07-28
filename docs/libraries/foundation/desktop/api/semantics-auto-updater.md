---
title: "@kiwa-lab/desktop semantics-auto-updater の API 契約"
---

# <code v-pre>@kiwa-lab/desktop</code> <code v-pre>semantics-auto-updater</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>applyDownloadedUpdate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L79) <code v-pre>packages/desktop/src/semantics/auto-updater.ts</code>

```ts
export declare function applyDownloadedUpdate(session: AutoUpdaterSession): AxisStep<AutoUpdaterState>;
```

#### <code v-pre>recordUpdateDownloaded</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L63) <code v-pre>packages/desktop/src/semantics/auto-updater.ts</code>

```ts
export declare function recordUpdateDownloaded(session: AutoUpdaterSession, input: {
    version: string;
    bytes: number;
}): AxisStep<AutoUpdaterState>;
```

#### <code v-pre>scheduleRelaunch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L91) <code v-pre>packages/desktop/src/semantics/auto-updater.ts</code>

```ts
export declare function scheduleRelaunch(session: AutoUpdaterSession, delayMs: number): AxisStep<AutoUpdaterState>;
```

#### <code v-pre>startAutoUpdaterCheck</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L44) <code v-pre>packages/desktop/src/semantics/auto-updater.ts</code>

```ts
export declare function startAutoUpdaterCheck(input: {
    target: DesktopTarget;
    channel: string;
}): AutoUpdaterSession;
```

### 型

#### <code v-pre>AutoUpdaterSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L14) <code v-pre>packages/desktop/src/semantics/auto-updater.ts</code>

```ts
export interface AutoUpdaterSession {
    target: DesktopTarget;
    channel: string;
    state: AutoUpdaterState;
    latestVersion: string | null;
    downloadedBytes: number;
    applied: boolean;
    relaunchDelayMs: number;
    history: AxisStep<AutoUpdaterState>[];
}
```

#### <code v-pre>AutoUpdaterState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/auto-updater.ts#L7) <code v-pre>packages/desktop/src/semantics/auto-updater.ts</code>

Auto-updater axis (v0.2) — check + download + apply + relaunch の 4 step 状態遷移。 Squirrel.Mac / Squirrel.Windows / AppImage の 3 target を uniform state machine で扱う。

```ts
export type AutoUpdaterState = 'idle' | 'check-started' | 'update-downloaded' | 'update-applied' | 'relaunch-scheduled';
```
