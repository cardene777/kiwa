# @kiwa-lab/upload の使い方

この harness は provider の bucket へ接続せず、application が組み立てる upload request と、その後に object がどう見えるかを確認します。presigned URL は URL shape を作るだけで、IAM policy、CORS、expiry、実署名を検証しません。multipart は in-memory で part を並べ替えて一回の upload にします。

次の file を `tests/avatar.upload.test.ts` として保存してください。URL の発行、順不同 multipart の復元、checksum、容量超過時の cleanup を一つの workflow として確認します。

```ts
import { describe, expect, it } from "vitest";
import {
  computeChecksum,
  createPresignedUrl,
  createUploadClient,
  uploadMultipart,
  verifyUpload,
} from "@kiwa-lab/upload";

describe("avatar upload", () => {
  it("creates a PUT URL and stores a completed multipart object", async () => {
    const client = createUploadClient({ provider: "r2" });
    const url = createPresignedUrl({
      provider: "r2",
      bucket: "avatars",
      key: "u-1/avatar.txt",
      operation: "put",
    });
    const parts = [
      { partNumber: 2, body: Buffer.from("world") },
      { partNumber: 1, body: Buffer.from("hello ") },
    ];
    const result = await uploadMultipart(client, "avatars", "u-1/avatar.txt", parts);
    const body = Buffer.from("hello world");

    expect(url).toMatchObject({ provider: "r2", operation: "put" });
    expect(url.url).toContain("avatars.r2.cloudflarestorage.com/u-1/avatar.txt");
    expect(result).toMatchObject({ parts: 2, totalSize: 11, result: { status: "uploaded" } });
    expect(client.get("avatars", "u-1/avatar.txt")?.body).toEqual(body);
    expect(verifyUpload({ body, expectedChecksum: computeChecksum(body) })).toMatchObject({ valid: true });
  });

  it("does not retain an object that exceeds the application size limit", async () => {
    const client = createUploadClient({ provider: "cloudinary", maxSizeBytes: 5 });
    const result = await client.upload({
      bucket: "videos",
      key: "large.mp4",
      body: Buffer.alloc(10),
    });

    expect(result.status).toBe("failed");
    expect(result.reason).toContain("size");
    expect(client.get("videos", "large.mp4")).toBeUndefined();
  });

  it("reports a checksum mismatch without reading another object", () => {
    const result = verifyUpload({
      body: Buffer.from("hello world"),
      expectedChecksum: "deadbeef",
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain("checksum mismatch");
  });
});
```

```bash
pnpm exec vitest run tests/avatar.upload.test.ts
```

`verifyUpload` は保存済み object を取得する API ではなく、渡した body と期待 checksum または size を比較する helper です。empty parts を `uploadMultipart` に渡すと例外になります。part ごとの resumable session、retry、virus scan、network failure はこの library で再現しません。

本番では provider の PUT を実行する integration test で credential、bucket policy、CORS、署名の有効期限、content-type 制限を確認してください。upload 成功後に queue へ出す job は [queue](../queue/)、object の read 権限は [auth](../auth/) で別に確認します。
