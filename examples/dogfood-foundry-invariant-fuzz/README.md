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

## 実行

```bash
forge test --root examples/dogfood-foundry-invariant-fuzz
```

run 数と seed は `foundry.toml` の `[invariant]` 節で指定する。 `forge` が PATH に無い host
では実行できない (graceful skip は Rust harness が担っていた)。
