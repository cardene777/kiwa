---
"@kiwa/cli": minor
"@kiwa/core": minor
---

`@kiwa/cli` の `init` 命令に 4 option (`--testDir <path>` / `--config-suffix <name>` / `--script-key <key>` / `--with-deploy <foundry-path>`) を追加 (#150 / #154)。
既存 Playwright 構成を持つ project への共存導入と、Foundry boilerplate (`tests/prepare-env.ts` / `global-setup.ts` / `global-teardown.ts` / `fixture.ts`) の自動生成が可能になった。
`@kiwa/core` の `RpcContext` に opt-in `rejectConnect` flag を追加し、 `setApprovalMode('reject')` 時に `eth_requestAccounts` を EIP-1193 code 4001 で reject 可能に (#156)。 `eth_accounts` は read-only として従来挙動を維持し下位互換を保つ。 `WalletApi` / `DappE2eApi` に `setRejectConnect(enabled)` setter を expose。
