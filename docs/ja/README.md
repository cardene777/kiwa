# kiwa ドキュメント

kiwa はブラウザ拡張なしで dApp を E2E テストするための headless fixture です。
anvil をテスト単位で起動し、Playwright と viem を組み合わせ、`window.ethereum` を inject して接続・署名・送金までを 1 つの fixture で通します。

## 入り口

- 🚀 [Quickstart](./quickstart.md) — 5 分で動かす
- 🧭 [Examples](./examples/README.md) — 試したい機能から逆引き
- 🚶 [Examples Walkthrough](./examples/walkthrough.md) — 人気 5 件を順に試すツアー
- 📚 [Concepts](./concepts/README.md) — 仕組みを学ぶ
- 🔧 [API Reference](./api/README.md) — 関数仕様
- 🍳 [Cookbook](./cookbook/README.md) — 実シナリオ
- ❓ [FAQ](./faq.md) — よくある質問

## なぜ kiwa か

ブラウザ拡張機能を経由する従来の E2E テストは popup 操作や UI 差分で flaky になりがちです。
kiwa は CI で安定して動く接続フロー検証を最優先に設計し、wallet UI の popup や見た目の確認は対象外としています。
比較は [docs/COMPARISON.md](../COMPARISON.md) を参照してください。

## 関連リンク

- [GitHub リポジトリ](https://github.com/cardene777/kiwa)
- [Issue Tracker](https://github.com/cardene777/kiwa/issues)
- [English documentation](../en/README.md)
