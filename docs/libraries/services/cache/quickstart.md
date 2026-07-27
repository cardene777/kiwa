# @kiwa-lab/cache はじめる

既定の in-memory Redis environment で key を保存し、TTL が期待した範囲に入ることを確認します。Docker や Redis client はこの最短 test では必要ありません。

## インストール

```bash
pnpm add -D @kiwa-lab/cache @kiwa-lab/core vitest
```

testcontainers mode を使う場合だけ `testcontainers` と `ioredis` または `redis` を追加します。

## TTL を確認する

```ts
import { afterEach, expect, it } from "vitest";
import { setupCacheEnv } from "@kiwa-lab/cache";

let env: Awaited<ReturnType<typeof setupCacheEnv>> | undefined;

afterEach(async () => {
  await env?.stop();
});

it("session を保存して TTL を持たせる", async () => {
  env = await setupCacheEnv();
  await env.set("session:1", "user-1", { ttlSeconds: 60 });

  await env.assertTTL("session:1", { atLeast: 59, atMost: 60 });
  expect(await env.get("session:1")).toBe("user-1");
});
```

TTL は時間の経過で減るため、通常は exact value ではなく範囲で assertion します。`ttlSeconds` が 0 以下の Redis write は拒否されます。存在しない key の `ttl()` は `-2`、expiry がない key は `-1` です。

## 成功後の後始末

`stop()` は TTL sweep と subscription を停止します。in-memory mode でも `afterEach` で await してください。environment を共有すると、前の test の key や message を誤って読み取る原因になります。

## 実行する

この例を `tests/kiwa/cache.test.ts` に保存して、次を実行します。成功時は、このページで示した値と TTL の assertion がすべて通ります。

```bash
pnpm exec vitest run tests/kiwa/cache.test.ts
```

<!-- skill-guide -->
## skill で仕様から test を作る

この library の companion skill は、先に作成した仕様を input にします。plugin を導入し、Quickstart の最小 test で API と期待結果を理解してから実行してください。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

次の順序では、最初の command が `tests/spec/` に仕様を作り、二つ目の command がその module の test を作ります。

```text
/kiwa:kiwa-design --layer cache --module profile
/kiwa:kiwa-cache --module profile
```

`kiwa-cache` の既定出力先は `tests/profile.cache.test.ts` です。生成後は TTL の範囲、subscription の close、選択した provider と mode が仕様に一致することを確認してから実行します。

```bash
pnpm exec vitest run tests/profile.cache.test.ts
```

testcontainers mode は Docker、image、client peer dependency が必要です。通常の unit test を container 必須にせず、実 client compatibility が必要な scenario だけを分けてください。layer の選択肢と出力先は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-cache/SKILL.md) を参照してください。
