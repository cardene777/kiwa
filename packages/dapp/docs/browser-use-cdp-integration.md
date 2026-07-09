# Browser Use 3.0 CDP + domain-skill 永続化 + self-healing の kiwa Playwright 統合検討

CAR-857 で追加、 元 post = 2026-07-05 sweep #15 (Browser Use 3.0 の CDP Skill 実装、 likes 734)。
kiwa は 4 layer test framework for dApps で、 Playwright 経由の browser e2e 経路を持つ。
CDP (Chrome DevTools Protocol) 直結 + domain-skill 永続化 + self-healing の 3 要素を kiwa の Playwright fixture に統合する調査 SSOT。

## 背景

dApp e2e で頻出する MetaMask / WalletConnect 操作は Playwright 標準 API では以下 3 問題がある。

- browser 内部状態 (extension popup / cross-origin iframe / injected provider) の取得が困難
- 操作失敗時の retry / recovery が手動、 flaky test 増加
- MetaMask popup の promise 制御が Playwright API 経由では非同期タイミングずれ

Browser Use 3.0 が提案する CDP 直結経路は上記 3 問題を根本解決する可能性、 kiwa の `@kiwa-lab/dapp` fixture に統合する価値を検討する。

## Browser Use 3.0 の 3 要素

### 1. CDP 直結

Chrome DevTools Protocol に直接 attach、 Playwright API を bypass して browser 内部状態を取得する。
kiwa 現行 = Playwright `page.evaluate()` で JavaScript 実行 + `window.ethereum` 経由で MetaMask 状態取得、 CDP 直結なら Extension API 経由で直接 popup 制御可能。

### 2. domain-skill 永続化

dApp 固有操作 (Connect Wallet / Sign Transaction / Approve Token / Switch Chain 等) を skill として蓄積、 再利用可能な build block 化。
kiwa 現行 = 個別 test 内で操作を毎回 hand-craft、 共通操作の skill 化は未実装。

### 3. self-healing

操作失敗時 (element not found / timeout / stale state) に自動リトライ + fallback selector 経路。
kiwa 現行 = Playwright `page.waitForSelector` + `retries` config で標準対応、 domain-specific な fallback logic は未実装。

## kiwa 統合方針

### 統合前提

kiwa の core 設計は「Playwright + viem + anvil のスタック」 (`packages/dapp/README.md` SSOT)、 CDP 直結は Playwright API との hybrid 運用が現実的。

### 統合レベル分割

| レベル | 対象 | 統合コスト |
|---|---|---|
| L1 高度な操作のみ CDP | MetaMask popup 制御 / Extension 内部状態取得 | 低 (既存 API と併用) |
| L2 domain-skill を fixture 化 | Connect Wallet / Sign / Approve / Switch Chain | 中 (`@kiwa-lab/dapp` 新 helper 追加) |
| L3 self-healing を全 fixture に配線 | 全 dApp 操作の retry + fallback selector | 高 (既存 fixture 全面改修) |

L1 が最小コストで最大効果、 L2 は再利用性向上、 L3 は既存 fixture を壊す risk あり慎重に。

### 推奨 = L1 + L2 の 2 phase

- **Phase 1 (L1)** = MetaMask popup 制御を CDP 経由に置換、 flaky test 減少実測
- **Phase 2 (L2)** = domain-skill 4 種 (Connect / Sign / Approve / Switch) を fixture 化、 kiwa 全 e2e で再利用
- **Phase 3 (L3、 保留)** = self-healing 全面導入は Phase 1/2 効果測定後に判断

## Phase 1 実装 spec (L1 = CDP MetaMask popup 制御)

### 目的

Playwright API では MetaMask popup の promise 完了検知が困難、 CDP 直結で popup lifecycle event を捕捉する。

### 新規追加 file

- `packages/dapp/src/cdp-metamask.ts` = CDP client 経由の MetaMask popup 制御 helper
- `packages/dapp/tests/cdp-metamask.test.ts` = 統合 test

### API 案

```ts
import { withCdpMetamask } from '@kiwa-lab/dapp/cdp-metamask';

test('CDP MetaMask popup 制御', async ({ page }) => {
  await withCdpMetamask(page, async (metamask) => {
    await metamask.confirmTransaction(); // popup 制御 + 完了待機
    await metamask.rejectSignature();
  });
});
```

### 期待効果

- flaky test 削減 = 現状の `waitForSelector` timeout 経路より安定
- token 効率 = LLM 側 prompt に「MetaMask 操作の詳細手順」 を含めなくてよくなる (skill 側で吸収)

## Phase 2 実装 spec (L2 = domain-skill 4 種 fixture 化)

### 目的

dApp 頻出操作 4 種を skill として蓄積、 kiwa 全 e2e で再利用可能に。

### 新規追加 file

- `packages/dapp/src/skills/connect-wallet.ts`
- `packages/dapp/src/skills/sign-transaction.ts`
- `packages/dapp/src/skills/approve-token.ts`
- `packages/dapp/src/skills/switch-chain.ts`
- 各 skill に対応する test file

### API 案

```ts
import { connectWallet, signTransaction, approveToken, switchChain } from '@kiwa-lab/dapp/skills';

test('dApp flow with 4 skills', async ({ page, wallet }) => {
  await connectWallet(page, wallet);
  await switchChain(page, 137); // Polygon
  await approveToken(page, USDC_ADDRESS, MAX_UINT256);
  await signTransaction(page, txPayload);
});
```

## test 追加規約

Phase 1 実装時に以下 test を追加する。

- CDP client attach 成功 verify
- MetaMask popup lifecycle event 捕捉 verify
- 既存 Playwright API との hybrid 運用 (breaking change なし) verify

Phase 2 実装時は各 skill × 3 chain (Ethereum / Polygon / Arbitrum) の cross-chain 検証。

## 課題

- CDP 経路は Chromium 系のみ、 Firefox / Safari は非対応 = kiwa の cross-browser 前提と conflict、 CDP は「高度な操作 opt-in」 に限定する
- Browser Use 3.0 の CDP 実装は OSS 依存増加、 kiwa の依存グラフ膨張リスク = 実装は最小限の CDP client 自作を優先、 Browser Use 3.0 を直接 dep に含めない方針

## 関連

- 元 post = 2026-07-05 sweep #15 (Browser Use 3.0 CDP Skill、 Huahuazo likes 734)
- `packages/dapp/README.md` = kiwa dApp fixture SSOT
- `packages/e2e/` = kiwa e2e Playwright base
- kiwa architecture = 4 layer test framework (`README.md`)
