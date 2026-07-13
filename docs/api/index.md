---
title: kiwa API reference
---

# kiwa API reference

Auto-generated API documentation for every language kiwa ships.

- **TypeScript** — [`/api/typescript/`](./typescript/) covers every `@kiwa/*` package (typedoc output)
- **Rust** — [`/api/rust/kiwa/`](./rust/kiwa/) covers `kiwa-test-rs` (cargo doc output)
- **Solidity** — [`/api/solidity/dogfood-foundry-dapp/`](./solidity/dogfood-foundry-dapp/) covers the dogfood Foundry project (forge doc output)

## test-taxonomy guide (user-facing)

- **[test-taxonomy-guide.md](./test-taxonomy-guide.md)** — 5 分類 SSOT + meta lint + fidelity primitive + skill-test + CLI + real driver 経路の user-facing 統合 guide。 新規 lib 追加時の手順 + 各 primitive 使用例。

## Regeneration

The three generators are wired into a single local skill:

```bash
claude /docs-generate
```

The skill runs typedoc + cargo doc + forge doc in sequence and writes each language's output under `docs/api/<language>/`. Because the outputs are large (typedoc alone is ~30 MiB across 23 packages), the actual HTML lives outside git.

To rebuild after a package changes:

```bash
pnpm -F @kiwa/<name> build     # keep dist/ current
claude /docs-generate --only typescript
```

See [`docs/api/README.md`](./README) for the CI-free build story.
