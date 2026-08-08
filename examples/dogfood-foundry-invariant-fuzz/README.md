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

## perf 計測は無い (意図的)

`vitest.perf.config.ts` があったが #1864 で削除した。 include していた
`tests/perf/**/*.perf.ts` は Rust 側 harness と一緒に消えており、 残しても
`No test files found` で exit 1 になるだけで、 config の存在が計測の存在に見える。

計測を戻すなら Foundry から直接駆動する形になる。 `forge test` が動く前提が要るため
#1868 の後に別途決める。

## 実行 (現状は動かない)

Solidity test は `forge-std/Test.sol` を import するが、 `lib/` に `forge-std` が無く
remapping も無いため **`forge test` は現状 import 解決に失敗する**。

#1864 で Rust 側の harness を削除した結果、 Solidity test を走らせる経路が無くなった。
`forge-std` はもとから `lib/` に無く、 Rust 側が代わりに解決していたわけでもない。

動かすには `forge-std` を `lib/` に固定して remapping を通す必要がある。 #1868 で扱う。

```bash
# 依存を入れた後であればこの形で走る
forge test --root examples/dogfood-foundry-invariant-fuzz
```
