---
"@kiwa/core": minor
---

Phase F-1 第 1 弾として `/kiwa-hardhat` skill の動作実証範囲を 1 example (mint-nft) から 3 example に拡張 (#187)。
`examples/defi-swap` と `examples/nextjs-token-gating` に Hardhat 最小構成 (`hardhat.config.cjs` + `hardhat-test/*.test.cjs`) を追加し、 Foundry .t.sol と並立する Hardhat 経路を実証。
両 example で 4 round 連続 PASS (flaky 0) と coverage 80%+ (defi-swap Stmts/Funcs/Lines 100% + Branch 87.5%、 token-gating Lines/Funcs 100% + Branch 88.89%) を達成。
