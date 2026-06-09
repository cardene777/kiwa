# FAQ

> [🇬🇧 English](../en/faq.md) • [🇯🇵 日本語](./faq.md)

## Q1: なぜ Synpress や MetaMask Test Dapp ではなく kiwa なのか

A: 既存ツールは MetaMask 拡張機能を経由する E2E が多く、CI で wallet popup の UI 操作を再現するため flaky になりがちです。
kiwa は wallet を **コード内で完結** させ、popup / approve UI を再現せず CI 安定性を最優先にします。
比較は [docs/COMPARISON.md](../COMPARISON.md) を参照してください。

## Q2: anvil が起動しない (`anvil not found in PATH`)

A: Foundry をインストールして PATH に通してください。

~~~bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
~~~

## Q3: port 8545 が既に使われている

A: 別 anvil プロセスが起動している可能性。kill するか別 port を `startAnvil({ port: 8546 })` で指定してください。

~~~bash
lsof -iTCP:8545 -sTCP:LISTEN
kill <PID>
~~~

## Q4: test が stake-balance: (loading) で fail する

A: `.env.local` の contract address が build 時に baked-in されていない可能性。
Next.js は build 時に `.env.local` を inline するため、global-setup で書いた address が次の build まで反映されません。
`pretest` で `.env.local` を書く / build キャッシュをクリアする (`rm -rf .next`) のいずれかが必要です。

## Q5: 複数 example で port が衝突する

A: 各 example で固有 port を使う (3033-3047)。詳細は `examples/*/package.json` の `scripts.dev` / `start` 参照。
anvil は default 8545 共有のため、複数 example の並列実行は不可。

## Q6: wagmi v2 / RainbowKit v2 ではなく ConnectKit / Reown を使いたい

A: kiwa は EIP-1193 / EIP-6963 標準に準拠しているため、いずれの wallet picker でも動作します。
特定 picker の test 対応は `examples/basic-connect/tests/eip6963.spec.ts` を参考にしてください。

## Q7: contract deploy が遅い

A: anvil の deterministic deploy は固定 deployer + 連続 nonce で動くため、毎回同じ address が得られます。
deploy artifact (`forge-out/`) を repo に commit すると `forge build` を skip できて高速化します。

## Q8: 時間に依存する test の書き方は

A: anvil RPC の `evm_snapshot` / `evm_revert` / `evm_increaseTime` を活用してください。
詳細は [Cookbook: 時間操作で test する](./cookbook/time-manipulation.md)。

## Q9: test がランダムに fail する (flaky)

A: 以下を順番に確認してください。
1. 前回 run の anvil が残っていないか (`lsof -iTCP:8545`)
2. `.env.local` が古い contract address を持っていないか
3. polling-based assertion が `waitForChainState` で deterministic 化できないか

## Q10: 公式サポート範囲

A: kiwa は Headless Chromium + 標準 wallet API のみサポートします。
ブラウザ拡張 (MetaMask 等の) UI 操作、Firefox / Safari、mobile WebView は非対応です。

## Related

- [GitHub Issues](https://github.com/cardene777/kiwa/issues)
- [Concepts](./concepts/README.md)
- [Cookbook](./cookbook/README.md)
