# Example fixtures 方針

> [🇬🇧 English](./EXAMPLE-FIXTURES.md) • [🇯🇵 日本語](./EXAMPLE-FIXTURES.ja.md)

`examples/` 配下のどの example が「`tests/fixtures/` 配下に完成形 reference fixture を持つ retrofit walkthrough 対象」 になっていて、 どの example が意図的に対象外なのかを示すドキュメント。
contributor が commit 履歴を追わずとも、 各 example を「skill chain で 0 から 1 を歩く想定」 と読むべきか、 「そのまま読むだけの参考実装」 と読むべきかを判別できるようにする。

## TL;DR

| Group | Examples | `tests/fixtures/<name>/` を持つか | 期待する挙動 |
|---|---|---|---|
| contract 持ち fixtures | mint-nft / defi-swap / nextjs-token-gating / nft-marketplace | ✅ 持つ | `examples/<name>/{test,hardhat-test,tests}/` は gitignore 対象。 skill chain でここに test を再生成する。 完成形 reference suite は `tests/fixtures/<name>/` 側に存在する |
| 接続のみ fixture | basic-connect | ✅ 持つ (e2e-test のみ) | 同じ構造だが、 example が独自 Solidity contract を持たないため Foundry / Hardhat lane は不適用 |
| e2e only 17 example | nextjs-aa-erc4337 / nextjs-aa-smart-account / nextjs-bridge / nextjs-dao-vote / nextjs-ens-resolver / nextjs-erc1155-game / nextjs-event-history / nextjs-lending / nextjs-multi-chain / nextjs-permit-swap / nextjs-safe-multisig / nextjs-staking / nextjs-vesting / nextjs-wagmi-rainbow / nextjs-walletconnect-v2 / nextjs-zk-verifier / vite-react-wagmi | ❌ 持たない (対象外) | `examples/<name>/tests/` は tracked のまま。 retrofit walkthrough の推奨経路ではない。 そのまま読むか fork して使う |

> 補足 — PR #305 / #306 で追加された `nextjs-walletconnect-v2` と `nextjs-safe-multisig` は `docs/MOCK-DESIGN.md` の Level B mock example。 mock pattern 1 例ずつ (WalletConnect v2 の in-memory relay / Safe v1.4 semantics の TS 再現) を示すが、 in-repo Solidity surface を持たないため他 example と同じく e2e only 扱い。

## e2e only example を対象外にしている理由

これらの example は、 kiwa が own していない upstream contract の上に、 1 つの統合 pattern (account abstraction、 bridging、 投票、 ENS lookup、 multi-chain、 ZK verifier 等) を示すために存在している。
contract 持ち 4 example と同じ fixtures retrofit 処理に流さない具体的理由は次の 3 点。

- `examples/<name>/contracts/` に kiwa が SSOT として own する Solidity contract がないため、 Foundry / Hardhat lane に張る対象面がない
- Playwright spec は通常、 特定の helper 組み合わせ (multi-step approval、 paymaster setup、 ZK proof 生成) で end-to-end pattern を示している。 これを「workbench / 完成形 fixture」 の 2 構造に割ると、 pattern の見通しが落ちる
- e2e only example は 1 箇所で完結して読めるようにしておきたい。 retrofit walkthrough を強要すると `tests/` が gitignore され、 contributor は integration の中身を見るためだけに skill chain を回す必要がある

contract 持ち 4 example が異なる扱いになるのは、 まさに「contract 仕様から e2e flow までの skill chain」 を示すために存在しているためで、 workbench + 完成形 fixture の 2 構造そのものが目的になっているから。

## e2e only example の歩き方

e2e only example を理解 / 拡張したい場合は、 `tests/*.spec.ts` を直接読み、 example を fork するか該当 helper を自分の project に copy する。
`/kiwa-play` skill はこの種の example に対しても起動可能で、 新規 scaffold ではなく既存 spec を読む挙動になる。

## 将来の方向性

仮に e2e only example のどれかが、 Goerli 等にデプロイ済みの upstream contract を repo 内 `contracts/` ソースで置き換える等の変更で Solidity contract を持つようになった場合、 その example は contract 持ち 4 example と同じ条件で fixtures retrofit の候補になる。
判断は example 単位で行い、 16 例を一括で処理することはしない。

## 関連

- [tests/docs/README.ja.md](../tests/docs/README.ja.md) — skill chain test docs の入口
- [tests/docs/retrofit-existing-dapp.ja.md](../tests/docs/retrofit-existing-dapp.ja.md) — contract 持ち example の walkthrough
- [examples/mint-nft/README.ja.md](../examples/mint-nft/README.ja.md) — workbench + 完成形 fixture の参考構造
- [docs/COMPARISON.ja.md](./COMPARISON.ja.md) — kiwa の Synpress / dappwright / wallet-mock との立ち位置
