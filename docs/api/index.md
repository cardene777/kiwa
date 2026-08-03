---
title: kiwa API reference
---

# kiwa API reference

kiwa の各 lib API を分類別に列挙。 各 lib page には Overview + Supported providers + Main API + Types + Usage examples + Related skills を掲載。

## Libraries by category

### SaaS (1)

| lib | package | domain |
|---|---|---|
| [email](./email) | `@kiwa-lab/email` | Resend / SendGrid / Postmark / SES email send + template + webhook |

## Auto-generated language API refs

kiwa は上記の hand-written reference に加えて、 language-native の auto-generated API reference も持つ:

- **TypeScript** — [`/api/typescript/`](./typescript/) covers every `@kiwa-lab/*` package (typedoc output)
- **Rust** — [`/api/rust/kiwa/`](./rust/kiwa/) covers `kiwa-test-rs` (cargo doc output)
- **Solidity** — [`/api/solidity/dogfood-foundry-dapp/`](./solidity/dogfood-foundry-dapp/) covers the dogfood Foundry project (forge doc output)

## test-taxonomy guide

- **[test-taxonomy-guide.md](./test-taxonomy-guide)** — 5 分類 SSOT + meta lint + fidelity primitive + skill-test + CLI + real driver 経路の user-facing 統合 guide。

## Concepts

- **[Multi-provider mock pattern](../concepts/multi-provider-mock)** — 統一 interface で複数 provider を mock する設計思想
- **[Lib composition pattern](../concepts/lib-composition)** — 複数 lib を組合わせて real app test を書く経路

## Regeneration

```bash
claude /docs-generate
```

typedoc + cargo doc + forge doc を順次実行、 `docs/api/<language>/` に書出す。
