# dogfood-foundry-invariant-fuzz

3 つの Solidity contract (ERC-20 / Vault / Router) と、 その invariant test を持つ Foundry
project。 `/kiwa-forge` の対象。

もとは Rust 側の adapter から 10,000 run + seed 固定 + shrink 結果の assertion を駆動する
harness を持っていたが、 #1864 で Rust 対応ごと削除した。 残っているのは Solidity 側だけで、 invariant は Foundry から直接走らせる。

## Layout

```
foundry.toml                      -- Foundry project descriptor
contracts/ERC20.sol               -- ERC-20
contracts/Vault.sol               -- Vault
contracts/Router.sol              -- Router
test/invariant/                   -- Foundry invariant test
quality-report/                   -- 過去に生成した quality snapshot (履歴)
```

## 実行 (現状は動かない)

Solidity test は `forge-std/Test.sol` を import するが、 `lib/` に `forge-std` が無く
remapping も無いため **`forge test` は現状 import 解決に失敗する**。

もとは Rust 側の adapter が `forge` を CLI として起動し、 依存の解決もそちら側で完結していた。
#1864 でその駆動を削除した結果、 Solidity test を走らせる経路が無くなっている。

動かすには `forge-std` を `lib/` に固定して remapping を通す必要がある。 別 Issue で扱う。

```bash
# 依存を入れた後であればこの形で走る
forge test --root examples/dogfood-foundry-invariant-fuzz
```
