# @kiwa-lab/expo の使い方

この手順では、注文通知の payload から詳細画面へ進み、camera permission を解決して撮影結果を file system へ保存し、logout 時に token と receipt を消します。OS が通知を配信したか、camera が実際に撮影したかを検証するものではありません。アプリケーションが SDK 呼び出しの結果を受けてどの state と route を選ぶかを固定します。

## 注文フローを一つの test file にする

次の内容を `tests/order-flow.expo.test.ts` にそのまま保存してください。`dispatchNotification` は delivery を再現せず、scheduled list へ payload を記録します。camera は `undetermined` から permission request を行うと granted になり、写真を返します。`reset` は storage、file、通知、capture 履歴を消します。

```ts
import { expect, it } from "vitest";
import {
  createExpoTestEnv,
  dispatchNotification,
} from "@kiwa-lab/expo";

it("通知から注文へ進み、撮影した receipt を保存する", async () => {
  const env = createExpoTestEnv({ nowFn: () => 1_000 });
  const scheduled = dispatchNotification(env, {
    title: "注文を発送しました",
    body: "配送状況を確認できます",
    data: { path: "/orders/5" },
    trigger: { seconds: 30 },
  });

  expect(scheduled).toEqual({ identifier: "notif-1", status: "scheduled" });
  env.router.push(String(env.scheduled[0]?.payload.data?.path));
  expect(env.router.getCurrentPath()).toBe("/orders/5");

  await expect(env.camera.takePictureAsync()).rejects.toThrow(
    "Camera permission not granted",
  );
  expect(await env.camera.requestCameraPermissionsAsync()).toEqual({
    status: "granted",
    granted: true,
  });
  const picture = await env.camera.takePictureAsync({ base64: true, exif: true });
  await env.fileSystem.writeAsStringAsync(
    "file:///mock/document/receipt.b64",
    picture.base64!,
  );

  expect(picture).toMatchObject({
    uri: "file:///mock/camera/picture-1.jpg",
    width: 1920,
    height: 1080,
    exif: { Make: "kiwa-mock" },
  });
  expect(await env.fileSystem.getInfoAsync("file:///mock/document/receipt.b64")).toMatchObject({
    exists: true,
    size: picture.base64!.length,
  });
});

it("logout で token と receipt を残さない", async () => {
  const env = createExpoTestEnv();
  await env.secureStore.setItemAsync("token", "secret-token");
  await env.fileSystem.writeAsStringAsync(
    "file:///mock/document/receipt.json",
    '{"orderId":"o-1"}',
  );

  env.reset();

  expect(await env.secureStore.getItemAsync("token")).toBeNull();
  expect(env.fileSystem.listUris()).toEqual([]);
});
```

保存後は、この file だけを実行します。

```bash
pnpm exec vitest run tests/order-flow.expo.test.ts
```

成功時には、payload 内の path が route になり、permission 前の撮影は失敗し、permission 後の画像 data が mock file に保存されます。二つ目の test は logout 後に認証情報と receipt を残さないことを確認します。

## 実機で確認すること

`denied` の camera は request しても granted になりません。設定画面へ誘導する route はアプリケーションで決め、`initialPermission: "denied"` の env で別 test にしてください。OS の permission dialog、push delivery や tap callback、実 camera の画像、Keychain の暗号化、native file URI は Expo development build または実機 test の対象です。全 mock の保持する state は [リファレンス](./reference) を参照してください。
