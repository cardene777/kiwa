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

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [camera.ts](./api/camera) | 1 | 5 |
| [env.ts](./api/env) | 1 | 2 |
| [extensions.ts](./api/extensions) | 8 | 11 |
| [file-system.ts](./api/file-system) | 1 | 3 |
| [notifications.ts](./api/notifications) | 1 | 3 |
| [router.ts](./api/router) | 1 | 3 |
| [secure-store.ts](./api/secure-store) | 1 | 2 |

<!-- kiwa-public-api:end -->
