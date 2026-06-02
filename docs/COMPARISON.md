# Tool comparison

本ドキュメントは dapp-e2e を既存の wallet E2E 周辺ツールと比較したい利用者向けです。
内容は v0.1.0 時点、すなわち 2026-06 時点の dapp-e2e の機能と、
各公式 repository / docs で公開されている役割を基準に整理しています。
結論だけ先に言うと、dapp-e2e は fork chain を使う headless E2E の安定運用に寄せた立ち位置です。

## 比較表

| 観点 | Synpress | wallet-mock | dapp-e2e |
|---|---|---|---|
| 主対象 | 実 wallet 連携を含む E2E | headless wallet 注入 | fork chain 前提の dApp E2E |
| ブラウザ側 | Playwright / Cypress + wallet 拡張連携 | Playwright へ mock wallet を注入 | Playwright へ `window.ethereum` を注入 |
| chain backend | 実 wallet と組み合わせる任意 backend | mock 応答または任意 transport | anvil を test ごとに起動 |
| 署名 / 送金 | wallet UI を経由 | mock または transport 経由 | anvil dev account で直接処理 |
| CI 安定性 | 中 | 高 | 高 |
| 向く場面 | wallet UX 確認 | provider 差し替え検証 | fork chain での接続フロー検証 |

どれが常に上位という関係ではなく、確認したい対象が違います。
wallet UI、provider mock、fork chain のどこに重心を置くかで選ぶのが実用的です。

## dapp-e2e の位置づけ

dapp-e2e は次の 3 点を優先しています。

- anvil を test 単位で直接起動できること
- browser extension を持ち込まず headless で回せること
- EIP-1193 の最小コアを fixture として使い回せること

その代わり、wallet popup の文言確認や拡張 UI の操作再現は対象外です。
README の先頭で「実 MetaMask UI 検証は別ツールへ分離」としている理由もここにあります。

## 使い分けガイド

### Synpress を選ぶ場合

- 実 wallet UI の接続確認、承認、拒否まで含めて見たい
- dApp 側だけでなく browser extension 側の表示崩れも拾いたい
- Playwright または Cypress と wallet 拡張の組み合わせを維持したい

Synpress は wallet 実体との統合を取り込みたいときに強い候補です。
一方で browser setup と extension 依存が入るため、fork chain の最小再現だけを素早く回す用途では過剰になりやすいです。

### wallet-mock を選ぶ場合

- provider を headless に差し込みたい
- mock 応答を細かく差し替えたい
- 実 chain 接続よりも dApp 側分岐の確認を優先したい

wallet-mock は Playwright に wallet を注入する発想が近い一方で、
anvil lifecycle や fork chain の隔離は利用側で組む前提です。
transport を自由に差し替えたい test には向きます。

### dapp-e2e を選ぶ場合

- mainnet fork や L2 fork を使った dApp E2E を安定して回したい
- provider の最小面だけあれば十分で、wallet UI までは不要
- `window.ethereum` の request / event を page から素直に叩きたい
- Playwright fixture だけで起動、注入、終了まで閉じたい

dapp-e2e は「fork した chain 上で dApp 自体を headless に検証する」用途に最も合います。
`eth_requestAccounts` から `eth_sendTransaction` までの流れを 1 つの fixture にまとめたいなら、
この repo の `examples/basic-connect` が最短の導入例です。

## 選定の目安

1. wallet UI の真偽が重要なら Synpress
2. provider の差し替えと mock 制御が主目的なら wallet-mock
3. fork chain 上の dApp 挙動と CI 安定性を同時に欲しいなら dapp-e2e

複数併用も現実的です。
たとえば日常の回帰は dapp-e2e、release 前の wallet UX 確認だけ Synpress、という分担は十分ありえます。
wallet 層と dApp 層を別々に検証したい team ほど、この分担の効果が出やすくなります。

## dapp-e2e が向かないケース

- 拡張 popup のボタン文言や配置そのものを検証したい
- 複数 wallet 拡張の競合や browser profile 差分を見たい
- provider を完全 mock にして chain 接続を切り離したい

この領域では、dapp-e2e の「anvil を起点にした最小 provider」という設計がそのまま制約になります。
wallet UI の再現性が主目的なら Synpress、
transport 差し替えの自由度が主目的なら wallet-mock の方が設計意図に合います。

## dapp-e2e を選ぶときの確認項目

- anvil を利用できる環境があるか
- fork 元 RPC の準備を利用側で管理できるか
- wallet 拡張 UI の確認を別レイヤへ分離できるか
- `viem` と Playwright を host project 側で管理したいか

この 4 点に無理がなければ、dapp-e2e の設計と相性が良い可能性が高いです。

## 関連

- [Synpress repository](https://github.com/Synthetixio/synpress)
- [wallet-mock repository](https://github.com/johanneskares/wallet-mock)
- [Foundry anvil docs](https://book.getfoundry.sh/anvil/)
- [RPC.md](./RPC.md)
- [README.md](../README.md)
