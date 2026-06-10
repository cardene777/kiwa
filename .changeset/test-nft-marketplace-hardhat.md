---
"@kiwa-test/core": minor
---

Phase F-1 第 2 弾として `/kiwa-hardhat` skill の動作実証範囲を 3 example から 4 example に拡張 (#197)。
最も複雑な market 系 contract (listing + offer + royalty payout + offer invalidation) を持つ `examples/nft-marketplace` に Hardhat 構成を追加し、 MarketNft (ERC721 + ERC2981) 21 件 + SimpleMarketplace 30 件を観点 6 系統で網羅。
4 round 連続 PASS (flaky 0) + coverage Stmts 98.77% / Branch 84.62% / Funcs 100% / Lines 97.25% で全 metric 80%+ を達成し、 F-1 (mint-nft / defi-swap / token-gating / nft-marketplace 4 例 Hardhat 並立) を完遂。
