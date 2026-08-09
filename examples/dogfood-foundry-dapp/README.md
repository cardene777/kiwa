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

## perf 計測は無い (意図的)

`vitest.perf.config.ts` があったが #1864 で削除した。 include していた
`tests/perf/**/*.perf.ts` は Rust 側 harness と一緒に消えており、 残しても
`No test files found` で exit 1 になるだけで、 config の存在が計測の存在に見える。

計測を戻すなら Foundry から直接駆動する形になる。 `forge test` が動く前提が要るため
#1868 の後に別途決める。

## 実行

```bash
forge test --root examples/dogfood-foundry-dapp
```

`forge` が要る。 無い host では `command not found: forge` で止まる。

```bash
curl -L https://foundry.paradigm.xyz | bash
# installer は PATH を shell の設定 file に足すだけで、 実行中の shell には
# 反映されない。 shell を開き直すか、 絶対 path で呼ぶ
~/.foundry/bin/foundryup
```

それ以外の準備は無い。 `lib/forge-std` は repo に入っているので取得も要らない。

3 件の test が走る。

`forge-std` を vendoring しているのは、 #1864 で Rust 側の harness を削除した結果
Solidity test を走らせる経路が無くなり、 #1868 で入れ直したため。 取得 step を挟むと
「checkout しただけでは走らない」 状態に戻るので、 repo に置いて解決している。
