# @kiwa-lab/crypto はじめる

HS256 JWT を署名し、同じ algorithm と secret で検証します。payload を利用する前に verify result の `valid` を確認します。

## インストール

```bash
pnpm add -D @kiwa-lab/crypto vitest
```

## token を検証する

```ts
import { expect, it } from "vitest";
import { signJWT, verifyJWT } from "@kiwa-lab/crypto";

it("署名した token を検証する", () => {
  const token = signJWT(
    { sub: "u-1" },
    "test-secret",
    "HS256",
  );
  const result = verifyJWT(token, "test-secret", "HS256");
  const rejected = verifyJWT(token, "wrong-secret", "HS256");

  expect(result.valid).toBe(true);
  expect(result.payload?.sub).toBe("u-1");
  expect(rejected).toMatchObject({
    valid: false,
    reason: "signature mismatch",
  });
});
```

`signJWT` と `verifyJWT` は payload、secret、algorithm の順に受け取ります。認可コードでは `valid` が false の result から payload を使いません。secret または algorithm が異なる token を成功として扱う経路がないことを、上の `rejected` と同じように確認してください。

## 実行する

この例を `tests/kiwa/crypto.test.ts` に保存して、次を実行します。成功時は、このページで示した token の検証と拒否の assertion がすべて通ります。

```bash
pnpm exec vitest run tests/kiwa/crypto.test.ts
```

[使い方](./how-to) は AES GCM の復号で iv と auth tag を渡す方法を示します。

<!-- skill-guide -->
## skill で test を作る

この library には `/kiwa:kiwa-crypto` という companion skill があります。初回だけ kiwa plugin を導入し、この Quickstart の package 導入も済ませてください。skill は library の挙動を実行時に置き換えるものではなく、ここで確認したい境界を test の形にする入口です。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

次の例では、対象を表す名前を `--module` に渡し、生成先を `--output` で固定します。

```text
/kiwa:kiwa-crypto --module auth --category jwt --output tests/integration/auth.crypto.test.ts
```

生成後は出力された `tests/integration/auth.crypto.test.ts` を読み、Quickstart と同じ成功条件・失敗条件が期待値になっていることを確認してから `pnpm exec vitest run tests/integration/auth.crypto.test.ts` を実行します。provider や対象の種類を変える引数は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-crypto/SKILL.md) を参照してください。
