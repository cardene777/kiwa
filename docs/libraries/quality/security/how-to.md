# CSP と authorization を検証する

security policy は一つの pass 判定にまとめません。CSP は browser に送る header の構成を、RBAC は subject が持つ permission を、rate limit は時刻ごとの request 数を、WAF は request の rule match を扱います。どれか一つが期待どおりでも、ほかの境界が安全であるとは限りません。

導入していない場合は [Security の導入](./quickstart) を先に完了してください。次の内容全体を `tests/security-controls.test.ts` に保存します。この一つのファイルは、四つの policy を独立して失敗させられるようにしています。途中の断片を組み合わせる必要はありません。

```ts
import { expect, it } from "vitest";
import {
  buildCspHeader,
  createRbacPolicy,
  createWafPolicy,
  evaluateWaf,
  rbacAllows,
  suppressFalsePositive,
  TokenBucket,
} from "@kiwa-lab/security";

it("nonce を含む CSP header を作る", () => {
  const policy = buildCspHeader({
    directives: { "script-src": ["'self'"] },
    nonces: [{ nonce: "AAAAAAAAAAAAAAAAAAAAAA" }],
    strictDynamic: true,
  });

  expect(policy.headerName).toBe("Content-Security-Policy");
  expect(policy.headerValue).toContain("'nonce-AAAAAAAAAAAAAAAAAAAAAA'");
  expect(policy.headerValue).toContain("'strict-dynamic'");
  expect(policy.expandedDirectives["script-src"]).toContain("'self'");
});

it("writer が reader の permission を継承する", () => {
  const policy = createRbacPolicy([
    { name: "writer", permissions: ["write"], parents: ["reader"] },
    { name: "reader", permissions: ["read"] },
  ]);
  const subject = { id: "user-42", roles: ["writer"] };

  expect(rbacAllows(policy, subject, "read")).toBe(true);
  expect(rbacAllows(policy, subject, "delete")).toBe(false);
});

it("token が尽きた request を拒否する", () => {
  const limiter = new TokenBucket({ capacity: 2, refillPerMs: 0.1 }, 0);

  expect(limiter.consume(1, 0)).toMatchObject({ allowed: true, remaining: 1 });
  expect(limiter.consume(1, 0)).toMatchObject({ allowed: true, remaining: 0 });
  expect(limiter.consume(1, 0)).toMatchObject({ allowed: false, remaining: 0 });
});

it("XSS payload を block し、限定した RFI rule だけを抑制する", () => {
  const policy = createWafPolicy();
  expect(evaluateWaf(policy, {
    method: "POST",
    path: "/comments",
    headers: {},
    body: "text=<script>alert(1)</script>",
  })).toMatchObject({ action: "block", matchedCategory: "WAF_XSS" });

  const relaxed = suppressFalsePositive(policy, "CRS-931100", "/import/allowed");
  expect(evaluateWaf(relaxed, {
    method: "POST",
    path: "/import/allowed",
    headers: {},
    body: "src=https://internal.example.com/data",
  })).toMatchObject({ action: "allow", matchedRuleId: null });
});
```

## 各 test が固定する契約

CSP の `strictDynamic` には nonce または hash が必要です。この test は header 文字列と展開済み directive を固定します。nonce は request ごとに生成し、再利用しません。browser が script を実際に block すること、report endpoint が受信することは、この library の unit test の範囲外です。実 browser での load と report delivery は e2e test に残してください。

RBAC では `writer` が親 role の `reader` を継承します。role hierarchy に cycle があると policy 作成時に失敗します。identity provider の group を `roles` に変換する責務や、resource owner のような属性条件は application 側にあります。属性条件が必要な場合は `evaluateAbac()` を別 test にして、RBAC の permission 判定と失敗箇所を分けます。

`TokenBucket` には固定した timestamp を渡します。実時間の待機を使わないため、三つ目の request が拒否される理由を再現できます。この bucket は process 内 state です。複数 instance で共有する制限は `DistributedRateLimiter` または実 provider を使い、key の選び方を `resolveClientId()` と integration test で検証してください。

WAF の抑制は rule ID と path の組で最小にします。この例では RFI rule だけを `/import/allowed` に限定し、XSS rule を弱めません。WAF は input validation、parameterized query、output escaping の代わりにはなりません。reverse proxy の request normalization と provider の rule set は integration test で確認してください。

## 実行して確認する

```bash
pnpm exec vitest run tests/security-controls.test.ts
```

四つの test が成功すれば、CSP、認可、rate limit、WAF の判定を個別に固定できています。secret scan、SBOM、threat model、security header の契約は [リファレンス](./reference) から確認してください。
