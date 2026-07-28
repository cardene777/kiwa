---
title: "@kiwa-lab/expo camera の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/expo</code> <code v-pre>camera</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/camera.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>mockCamera</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/camera.ts#L38) <code v-pre>packages/expo/src/camera.ts</code>

expo-camera mock。 permission request + takePicture + recordVideo を deterministic に返す。 実 camera 起動なしで permission flow + capture pipeline の test を書ける。

```ts
export declare function mockCamera(options?: CameraOptions): CameraMock;
```

### 型

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
