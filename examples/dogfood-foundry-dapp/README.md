# dogfood-foundry-dapp

Solidity の ERC20 project。 `contracts/DogfoodToken.sol` と Foundry の Solidity test を持ち、
`/kiwa-forge` の対象と `/docs-generate` の `forge doc` 生成元を兼ねる。

もとは Rust 側の adapter から駆動する real-vs-mock harness を持っていたが、 #1864 で Rust
対応ごと削除した。 残っているのは
Solidity 側だけで、 test は `forge test` で走らせる。

## Layout

```
foundry.toml                      -- Foundry project descriptor (src/out/test)
contracts/DogfoodToken.sol        -- ERC20 contract
test/DogfoodToken.t.sol           -- Foundry Solidity test
quality-report/                   -- 過去に生成した fidelity snapshot (履歴)
```

## 実行 (現状は動かない)

Solidity test は `forge-std/Test.sol` を import するが、 `lib/` に `forge-std` が無く
remapping も無いため **`forge test` は現状 import 解決に失敗する**。

もとは Rust 側の adapter が `forge` を CLI として起動し、 依存の解決もそちら側で完結していた。
#1864 でその駆動を削除した結果、 Solidity test を走らせる経路が無くなっている。

動かすには `forge-std` を `lib/` に固定して remapping を通す必要がある。 #1868 で扱う。

```bash
# 依存を入れた後であればこの形で走る
forge test --root examples/dogfood-foundry-dapp
```
