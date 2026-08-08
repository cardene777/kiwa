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

## 実行

```bash
forge test --root examples/dogfood-foundry-dapp
```

`forge` が PATH に無い host では実行できない。 kiwa 側の graceful skip は Rust harness が
担っていたため、 現在は Foundry の有無をそのまま前提にする。
