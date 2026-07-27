# Security を始める

`@kiwa-lab/security` は、CSP、rate limit、RBAC と ABAC、WAF、secret scan、SBOM を共通の判定結果として test する library です。browser、reverse proxy、WAF appliance を起動するものではありません。アプリケーションの security policy が期待どおり allow、deny、warn になるかを、provider 接続前に固定します。

## インストールする

Node.js 20 以降で次を実行してください。

```bash
pnpm add -D @kiwa-lab/security vitest
```

## CSP policy を検証する

次の内容を `tests/security-policy.test.ts` に保存します。nonce 付き script policy を作り、header と展開済み directive の両方を確認します。

```ts
import { expect, it } from "vitest";
import { buildCspHeader } from "@kiwa-lab/security";

it("nonce を含む CSP header を作る", () => {
  const policy = buildCspHeader({
    directives: { "default-src": ["'self'"], "script-src": ["'self'"] },
    nonces: [{ nonce: "AAAAAAAAAAAAAAAAAAAAAA" }],
    strictDynamic: true,
  });

  expect(policy.headerName).toBe("Content-Security-Policy");
  expect(policy.headerValue).toContain("'nonce-AAAAAAAAAAAAAAAAAAAAAA'");
  expect(policy.headerValue).toContain("'strict-dynamic'");
  expect(policy.expandedDirectives["script-src"]).toContain("'self'");
});
```

`strictDynamic` は nonce または hash を必要とします。nonce を使わずに有効化した場合は policy validation が失敗します。生成された文字列が browser の全 source expression を実行するわけではないため、実 browser での script load は e2e test でも確認してください。

## 実行して確認する

```bash
pnpm exec vitest run tests/security-policy.test.ts
```

test が成功すると、CSP header と script source の構成を確認できます。次は [CSP と authorization を検証する](./how-to) で、認可拒否、rate limit、WAF 判定を追加してください。

<!-- skill-guide -->
## skill との使い分け

この library には package 固有の companion skill はありません。CSP、認可、WAF の verdict を一つの pass 判定に混ぜず、機能ごとの期待値をこの Quickstart のように確認してください。仕様から policy の unit test を作る場合は、初回だけ Claude Code で plugin を導入します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

次に security policy の仕様と Vitest test の下書きを作ります。

```text
/kiwa:kiwa-design --layer unit --module security-policy
/kiwa:kiwa-vitest --module security-policy
```

生成後は、CSP の source expression、role と permission、rate-limit の時刻、WAF の rule ID を実際の policy と照合して書き換えます。その後に test を実行します。

```bash
pnpm exec vitest run tests/security-policy.test.ts
```

失敗時は、policy の期待値ではなく実 browser、reverse proxy、identity provider の動作を unit test に期待していないかを確認してください。実 provider は別の integration test と CI で検証します。
