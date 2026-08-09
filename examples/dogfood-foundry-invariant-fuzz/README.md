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

`forge` が要る。 無い host では `command not found: forge` で止まる。

```bash
curl -L https://foundry.paradigm.xyz | bash
# installer は PATH を shell の設定 file に足すだけで、 実行中の shell には
# 反映されない。 shell を開き直すか、 絶対 path で呼ぶ
~/.foundry/bin/foundryup
```

それ以外の準備は無い。 `lib/forge-std` は repo に入っているので取得も要らない。

10 件の invariant が走る (ERC-20 が 2 / Vault が 4 / Router が 4)。 各 256 run で、
1 invariant あたり 3840 call を積む。

Vault と Router はそれぞれ 1 件が **handler の ghost 変数と突合する** invariant で、
残りは vault / router の field 同士の関係式。 後者は「何も起きていない状態」 でも成立する
ため、 対象の操作を no-op に差し替えても落ちない。 前者がその形を捕まえる。

run 数と seed は `foundry.toml` が決める。 seed を固定しているので、 counter-example が
出た時に同じ sequence を踏み直せる。 探索を広げたい場合は `runs` を上げる。

```bash
# その場だけ広げる
FOUNDRY_INVARIANT_RUNS=10000 forge test --root examples/dogfood-foundry-invariant-fuzz
```

## 失敗した後の再実行

invariant が破れると Foundry は counter-example を `cache/invariant/failures/` に残し、
**以降の実行はそれを replay する**。 探索をやり直さないので、 実装を直しても
`replay failure` と出続ける。

```bash
# 直した後に fresh campaign へ戻す
find cache/invariant/failures -type f -delete
```

`forge clean --root examples/dogfood-foundry-invariant-fuzz` では消えない。
`failure_persist_dir` が `--root` ではなく実行時の working directory を基準に
解決されるため、 repo root から走らせた分は repo root の `cache/` に落ちる
(root の `.gitignore` が `/cache/` で除外している)。

10_000 run は v1.18-3 の release gate が使っていた値で、 当時は Rust 側の harness が
env で渡していた。 #1864 でその harness を消したため、 既定は `foundry.toml` の 256 になる。
