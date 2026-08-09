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

## 実行

```bash
forge test --root examples/dogfood-foundry-invariant-fuzz
```

`forge` が要る (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)。
無い host では `command not found: forge` で止まる。 それ以外の準備は無く、
`lib/forge-std` は repo に入っているので取得も要らない。

8 件の invariant が走る (ERC-20 が 2 / Vault が 3 / Router が 3)。 各 256 run で、
1 invariant あたり 3840 call を積む。

run 数と seed は `foundry.toml` が決める。 seed を固定しているので、 counter-example が
出た時に同じ sequence を踏み直せる。 探索を広げたい場合は `runs` を上げる。

```bash
# その場だけ広げる
FOUNDRY_INVARIANT_RUNS=10000 forge test --root examples/dogfood-foundry-invariant-fuzz
```

10_000 run は v1.18-3 の release gate が使っていた値で、 当時は Rust 側の harness が
env で渡していた。 #1864 でその harness を消したため、 既定は `foundry.toml` の 256 になる。
