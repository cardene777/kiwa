# @kiwa-lab/upload をはじめる

この Quickstart では、アバターを保存して読み戻し、サイズ上限を超えた upload が store を汚さないことを同じ test file で確認します。この harness は S3、GCS、R2、Cloudinary の実 bucket へ接続しません。

## インストール

```bash
pnpm add -D @kiwa-lab/upload vitest
```

## 保存と拒否を確認する

`tests/avatar-upload.test.ts` を作り、次の内容をそのまま保存します。

```ts
import { describe, expect, it } from "vitest";
import { createUploadClient } from "@kiwa-lab/upload";

describe("avatar upload", () => {
  it("stores an avatar and reads it back", async () => {
    const client = createUploadClient({ provider: "s3", maxSizeBytes: 1024 });
    const result = await client.upload({
      bucket: "avatars",
      key: "u1/avatar.png",
      body: Buffer.from("image"),
      contentType: "image/png",
    });

    expect(result.status).toBe("uploaded");
    expect(client.get("avatars", "u1/avatar.png")).toMatchObject({
      size: 5,
      request: { contentType: "image/png" },
    });
  });

  it("does not retain an object beyond the size limit", async () => {
    const client = createUploadClient({ provider: "s3", maxSizeBytes: 4 });
    const result = await client.upload({
      bucket: "avatars",
      key: "u1/large.png",
      body: Buffer.from("image"),
    });

    expect(result.status).toBe("failed");
    expect(result.reason).toContain("size");
    expect(client.get("avatars", "u1/large.png")).toBeUndefined();
  });
});
```

次の command は作成した file だけを実行します。

```bash
pnpm exec vitest run tests/avatar-upload.test.ts
```

成功時は保存された object が読み戻せ、容量超過の object は残りません。実ストレージの credential、policy、CORS、URL expiry はこの mock の範囲外です。presigned URL と multipart は [使い方](./how-to) を確認してください。

## skill で test の下書きを作る

この library には `/kiwa:kiwa-upload` という companion skill があります。初回だけ kiwa plugin を導入します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

upload の契約と出力先を指定して生成します。

```text
/kiwa:kiwa-upload --module avatar-upload --provider s3 --output tests/integration/avatar-upload.test.ts
```

生成後は bucket、key、上限、失敗時の UI または API response を実際の仕様に置き換えます。次の command で生成 file だけを実行し、成功時の object と失敗時に object が残らないことを確認します。

```bash
pnpm exec vitest run tests/integration/avatar-upload.test.ts
```
