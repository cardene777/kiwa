# x.com 投稿用下書き — 日本語 thread (polyglot voice)

> 投稿先 ... [@cardene777](https://x.com/cardene777)
> Voice ... 本人名義 / 個人 dev 視点 / 「作ったよ」 maker トーン
> 動画 ... `assets/kiwa-promo-ja.mp4` (7.1MB / 80s) を 1 ツイート目に添付
> 想定 ... 1 ツイート 140 字以内
> 全 8 ツイート、 番号 [1/8] 付き

---

## [1/8] (動画添付)

「test stack が runner ごとに散らばってる」 を 1 spec で解決する polyglot test toolchain 「kiwa」 を v0.5 まで仕上げました。

contract / API / component / e2e / a11y / visual を 1 つの spec から並列生成、 release で Coverage + Mutation 両 gate を物理 enforce。

80s 動画 ↓

https://github.com/cardene777/kiwa

#OSS #testing

---

## [2/8]

何が嬉しいか ... Foundry / Hardhat / Vitest / Playwright / msw / axe-core / pixelmatch / pytest を **1 つの Layer 1 spec から自動生成**、 runner ごとに同じ観点を書き直す必要がなくなります。

「stack 横断の単一ソース」 が手に入る感覚です。

---

## [3/8]

対応 layer は 6 surface ...

1. Contract (Foundry / Hardhat)
2. API integration (msw / supertest)
3. Component (8 framework adapter)
4. E2E (Playwright + anvil + viem)
5. A11y / Visual (axe-core / pixelmatch)
6. Data / CLI / Observability (queue / shell IO / flaky 検出)

dApp / smart contract は対応分野の 1 つです。

---

## [4/8]

言語横断対応 (polyglot)

- **TypeScript** ... 11 npm package
- **Python** ... 1 PyPI package (kiwa-test-py)
- **Solidity** ... Foundry / Hardhat 連携

Rust / Go は構想中。 「default は TS だけど Python の service と Solidity の contract も同じ spec で test できる」 のが kiwa の独自性です。

---

## [5/8]

v0.5 の目玉 ... 全 11 npm package で MSI ≥ 80 を release workflow で物理 enforce しました。

- @kiwa-test/api ... 96.06 %
- @kiwa-test/a11y ... 93.62 %
- @kiwa-test/ui ... 91.76 %
- 全 package ≥ 80 通過

Coverage gate (Lines 90+ / Branches 80+) も維持。

---

## [6/8]

Component test (`@kiwa-test/ui`) は 1 package で 8 surface 対応 ...

React / Vue 3 / Svelte / SolidJS / Lit / Qwik / Angular + 実 Chromium

全 adapter が `mode + stop()` 契約共有。 thin wrapper なので新 framework 追加も 1 PR 100 行レベルです。

---

## [7/8]

設計判断のキモ ... mutation gate を **package 別 threshold** にしたこと。 pure-logic 系 (api / a11y / ui setup-component-env+lit) は 90 % 強制、 thin wrapper 系 (vue / solid / svelte / qwik / angular / e2e / cli / observability / visual / spec / core) は 80 % 固定。

equivalent mutant の壁を現実的に超えました。

---

## [8/8]

stack に test 散乱を感じる方、 ぜひ触ってみてください。

📖 README https://github.com/cardene777/kiwa
💬 Discussions https://github.com/cardene777/kiwa/discussions/451
📦 `npm install @kiwa-test/core`
🐍 `pip install kiwa-test-py`

質問・要望は Issue / Discussion / リプライ歓迎です 🌱
