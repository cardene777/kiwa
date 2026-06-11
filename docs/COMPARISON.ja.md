# Tool comparison

> [🇬🇧 English](./COMPARISON.md) • [🇯🇵 日本語](./COMPARISON.ja.md)

本ドキュメントは kiwa を既存の wallet E2E 周辺ツールと比較したい利用者向けです。
内容は v0.1.0 時点、すなわち 2026-06 時点の kiwa の機能と、
各公式 repository / docs で公開されている役割を基準に整理しています。
結論だけ先に言うと、kiwa は anvil を使う headless E2E の安定運用に寄せた立ち位置です。

## 比較表

| 観点 | Synpress | dappwright | wallet-mock | kiwa |
|---|---|---|---|---|
| 主対象 | 実 wallet 連携を含む E2E | 実 MetaMask / Coinbase Wallet 拡張の自動化 | headless wallet 注入 | ローカル chain 前提の dApp E2E |
| ブラウザ側 | Playwright / Cypress + wallet 拡張連携 | Playwright + 拡張機能 download / unpack helper | Playwright へ mock wallet を注入 | Playwright へ `window.ethereum` を注入 |
| chain backend | 実 wallet と組み合わせる任意 backend | 実 wallet と組み合わせる任意 backend | mock 応答または任意 transport | anvil を test ごとに起動 |
| 署名 / 送金 | wallet UI を経由 | wallet UI を経由 | mock または transport 経由 | anvil dev account で直接処理 |
| CI 安定性 | 中 | 中 (MetaMask version 依存) | 高 | 高 |
| 向く場面 | wallet UX 確認 | 軽量な拡張機能自動化 | provider 差し替え検証 | ローカル chain での接続フロー検証 |

どれが常に上位という関係ではなく、確認したい対象が違います。
wallet UI、provider mock、ローカル chain のどこに重心を置くかで選ぶのが実用的です。

## kiwa の位置づけ

kiwa は次の 3 点を優先しています。

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
一方で browser setup と extension 依存が入るため、headless 実行だけを素早く回す用途では過剰になりやすいです。

### dappwright を選ぶ場合

- MetaMask または Coinbase Wallet 拡張を自動化する軽量な Playwright helper が欲しい
- Synpress 全体を取り込まず、拡張機能の download / unpack / load helper だけが欲しい
- dappwright が対応する特定の MetaMask version を pin して使うことに抵抗がない

dappwright は scope の広さで言うと Synpress と wallet-mock の中間に位置します。
E2E framework 全体ではなく、拡張機能の自動化を Playwright helper として薄く束ねた構成で、Synpress より表面積を小さく抑えられます。
ただし実 MetaMask 拡張の自動化は最近の MetaMask version に対して構造的な脆さがあるため (次節を参照)、CI 安定性の注意点は Synpress と同様に当てはまります。

### wallet-mock を選ぶ場合

- provider を headless に差し込みたい
- mock 応答を細かく差し替えたい
- 実 chain 接続よりも dApp 側分岐の確認を優先したい

wallet-mock は Playwright に wallet を注入する発想が近い一方で、
anvil lifecycle やローカル chain の隔離は利用側で組む前提です。
transport を自由に差し替えたい test には向きます。

### kiwa を選ぶ場合

- 自分でセットアップした anvil のローカル chain で dApp E2E を試したい
- provider の最小面だけあれば十分で、wallet UI までは不要
- `window.ethereum` の request / event を page から素直に叩きたい
- Playwright fixture だけで起動、注入、終了まで閉じたい

kiwa は「ローカル chain 上で dApp 自体を headless に検証する」用途に最も合います。
`eth_requestAccounts` から `eth_sendTransaction` までの流れを 1 つの fixture にまとめたいなら、
この repo の `examples/basic-connect` が最短の導入例です。

## 選定の目安

1. wallet UI の真偽が重要なら Synpress または dappwright
2. provider の差し替えと mock 制御が主目的なら wallet-mock
3. ローカル chain 上の dApp 挙動と CI 安定性を同時に欲しいなら kiwa

## kiwa が MetaMask 拡張自動化を取り込まない理由

kiwa は real MetaMask 拡張の自動化を自前で実装せず、Synpress や dappwright に意図的に委ねています。
これは PoC 段階で 10 種類のアプローチを最後まで走らせた結果、OSS 一個でルートできない共通の構造的ブロッカーに辿り着いたためです。

10 試行に共通する根本原因は、自動化されたブラウザ下で MetaMask の `chrome.sidePanel` API が undefined となり、click handler が `catch` 分岐に落ち、wallet-ready コンポーネントが `H && q` ガードによって `disabled` を保持し続けるため navigation dispatch が発火しないという点です。
README onboarding そのまま、wait 延長、`manage-default-settings` の bypass、`disabled` 属性の剥奪、headful Chromium、v13.17.0 への downgrade、Synpress 完全 install、MetaMask 公式 e2e flow の vendor、dappwright の vendor、暗号化済み vault を `chrome.storage` に直書き、の 10 アプローチがすべて同じブロッカーで停止しました。

ここから読み取れるのは「特定のライブラリが壊れている」ことではなく、構造的なブロッカーが MetaMask 側にあるということです。
real MetaMask 拡張を全自動化したい library は upstream の変更を密に追従し、新版 MetaMask に対する脆さを許容する必要があり、これは継続的な保守コストになります。
kiwa は代わりに anvil 上の contract / UI logic 検証と最小の `window.ethereum` 注入に集中し、wallet UX 検証が必要なユーザーには Synpress や dappwright を案内する立場を取ります。

複数併用も現実的です。
たとえば日常の回帰は kiwa、release 前の wallet UX 確認だけ Synpress、という分担は十分ありえます。
wallet 層と dApp 層を別々に検証したい team ほど、この分担の効果が出やすくなります。

## kiwa が向かないケース

- 拡張 popup のボタン文言や配置そのものを検証したい
- 複数 wallet 拡張の競合や browser profile 差分を見たい
- provider を完全 mock にして chain 接続を切り離したい

この領域では、kiwa の「anvil を起点にした最小 provider」という設計がそのまま制約になります。
wallet UI の再現性が主目的なら Synpress、
transport 差し替えの自由度が主目的なら wallet-mock の方が設計意図に合います。

## kiwa を選ぶときの確認項目

- anvil を利用できる環境があるか
- ローカル anvil chain を前提に test を組めるか
- wallet 拡張 UI の確認を別レイヤへ分離できるか
- `viem` と Playwright を host project 側で管理したいか

この 4 点に無理がなければ、kiwa の設計と相性が良い可能性が高いです。

## AI / 仕様書ベース test 生成軸の比較

上の節は dApp E2E fixture としての比較ですが、 kiwa は Claude Code skill (`/kiwa-design` / `/kiwa-forge` / `/kiwa-hardhat` / `/kiwa-play` / `/kiwa-vitest` / `/kiwa-api` / `/kiwa-review` / `/kiwa-test`) も持ち、 1 つの仕様書から 4 layer (contract / unit / integration / e2e) を横断して test を設計・生成します。 本節ではその側面を比較します。

| 観点 | hardhat-test-suite-generator | Foundry / Hardhat AI plugin (2026) | Claude Code spec-driven dev | kiwa skill chain |
|---|---|---|---|---|
| アプローチ | contract ABI から静的 template scaffold | LLM で fuzz seed / invariant 提案 plugin | 自由形式 spec → test → code 反復 | 11 観点 spec → 4 layer test code |
| scope | Hardhat contract test のみ | contract layer (fuzz + invariant) のみ | 汎用、 言語非依存 | contract + dApp e2e + unit + integration |
| spec 形式 | なし (ABI 駆動) | なし (heuristic) | 自由形式 markdown | 固定 9 section / 9 column markdown |
| layer cover | 1 (Hardhat) | 1 (Foundry or Hardhat の fuzz / invariant) | project ごとに決定 | 4 (contract / unit / integration / e2e) |
| review loop | なし | なし | 手動 | `/kiwa-review` が 11 観点 + spec drift を check |
| 適性 | Hardhat の test boilerplate scaffold | 既存 Foundry repo の fuzz / invariant 補強 | 汎用 LLM 支援開発 | contract + e2e を同時に扱う dApp project |

### kiwa skill chain が活きる場面

- spec → test → review → coverage report を 1 コマンド (`/kiwa-test --example {name}`) で流したい
- 1 枚の 9 column spec 表から Foundry / Hardhat / Playwright / Vitest を並列駆動したい
- 11 観点 (正常系 / 異常系 / 境界値 / 状態遷移 / 権限 / 入力バリデーション / 冪等性 / 並行処理 / 性能 / セキュリティ / 回帰) を dApp test suite に明示適用したい

### 他ツールが向く場面

- Hardhat contract test の scaffold だけ欲しい → `hardhat-test-suite-generator` の方が軽量
- 既存 Foundry repo に fuzz seed を足したいだけ → Foundry AI plugin が適合
- dApp 固有の事情がない汎用 LLM 支援 dev loop → Claude Code spec-driven dev をそのまま使う

## kiwa 独自の領域

両軸 (dApp E2E fixture + spec-driven test 生成) を比較した結果、 kiwa の独自性は **1 入口から 4 layer chain** をすべて回す点にあります。

```
/kiwa-design (Layer 1)
  ├─ /kiwa-forge        → Foundry .t.sol
  ├─ /kiwa-hardhat      → Hardhat .test.ts
  ├─ /kiwa-play         → Playwright .spec.ts (@kiwa-test/core fixture を使用)
  ├─ /kiwa-vitest       → Vitest .test.ts (unit)
  ├─ /kiwa-api          → Vitest + msw / supertest (integration)
  └─ /kiwa-review       → spec vs 実装 drift + 11 観点 cover を check
```

執筆時点で両軸どちらの競合も 4 layer (contract + unit + integration + e2e) を 1 つの spec から横断する例は確認できませんでした。

## 関連

- [Synpress repository](https://github.com/Synthetixio/synpress)
- [dappwright repository](https://github.com/TenKeyLabs/dappwright)
- [wallet-mock repository](https://github.com/johanneskares/wallet-mock)
- [hardhat-test-suite-generator](https://github.com/ahmedali8/hardhat-test-suite-generator)
- [Claude Code spec-driven development](https://www.augmentcode.com/guides/claude-code-spec-driven-development)
- [Foundry anvil docs](https://book.getfoundry.sh/anvil/)
- [RPC.md](./RPC.md)
- [README.md](../README.md)
