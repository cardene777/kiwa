---
title: "@kiwa-lab/macos-app screencap の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/macos-app</code> <code v-pre>screencap</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/screencap.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>mockScreencap</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/screencap.ts#L34) <code v-pre>packages/macos-app/src/screencap.ts</code>

CGDisplayCreateImage 相当の mock screencap を生成。 実 GPU capture ではなく、 region + 決定的 pixel data (env.id + region ハッシュ) から magic 付きの mock byte 列を 返す。 caller は format magic + length + region 契約を assert 可能。

```ts
export declare function mockScreencap(env: MacAppEnv, options?: ScreencapOptions): ScreencapResult;
```

### 型

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
