# x.com (Twitter) 投稿用下書き — 日本語 thread

> 投稿先 ... [@cardene777](https://x.com/cardene777)
> Voice ... 本人名義 / 個人 dev 視点 / 「作ったよ」 maker トーン
> 動画 ... `assets/kiwa-promo-ja.mp4` (9.1MB / 71s) を 1 ツイート目に添付
> 想定 ... 1 ツイート 140 字以内 (改行 + 全角を考慮した実用上限)
> Threads ... 全 7 ツイート、 番号 [1/7] 付き

---

## [1/7] (動画添付)

contract test も dApp e2e も 7 SPA framework (React/Vue/Svelte/Solid/Lit/Qwik/Angular) も 1 spec から並列生成できる OSS test toolchain 「kiwa」 を v0.5 まで仕上げました。

71s 動画で全体像です ↓

https://github.com/cardene777/kiwa

#OSS #testing #web3

---

## [2/7]

何が嬉しいか ... 「テスト書くのだるい」 を仕様書から自動生成 ＋ Stryker mutation gate ＋ 8 adapter ＋ AI skill chain でまとめて解決。

Foundry / Hardhat / Playwright / Vitest / msw / axe-core / pixelmatch を 1 つの spec で繋ぎます。

---

## [3/7]

v0.5 の目玉 ... 全 11 npm package で MSI ≥ 80 を release workflow で物理 enforce しました。

- @kiwa-test/api ... 96.06 %
- @kiwa-test/a11y ... 93.62 %
- @kiwa-test/ui ... 91.76 %
- 全 package ≥ 80 通過

Coverage gate (Lines 90+ / Branches 80+) も維持。

---

## [4/7]

UI test adapter (`@kiwa-test/ui`) は 1 package で 8 framework + 実 Chromium browser に対応です。

React / Vue 3 / Svelte / SolidJS / Lit / Qwik / Angular + Playwright

`setupComponentEnv` / `setupVueComponentEnv` / ... と同じ `mode + stop()` 契約で揃えました。

---

## [5/7]

なぜ 8 framework 全部 ... dApp UI は React 一強ではなく、 ENS / wallet / token explorer が Lit / Vue / Solid で書かれる現場がある。 利用者がどの SPA stack でも kiwa で同じ test 体験を得られるよう adapter を揃えました。

---

## [6/7]

設計判断のキモ ... mutation gate を **package 別 threshold** にしたこと。 pure-logic 系 (api / a11y / ui setup-component-env+lit) は 90 % 強制、 thin wrapper 系 (vue / solid / svelte / qwik / angular / e2e / cli / observability / visual / spec / core) は 80 % 固定。

equivalent mutant の壁を現実的に超えました。

---

## [7/7]

dApp / smart contract / SPA を test したい方、 ぜひ触ってみてください。

📖 README https://github.com/cardene777/kiwa
💬 Discussions https://github.com/cardene777/kiwa/discussions
📦 `npm install @kiwa-test/core`

質問・要望は Issue / Discussion / リプライ歓迎です 🌱
