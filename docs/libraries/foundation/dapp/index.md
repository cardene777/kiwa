# @kiwa-lab/dapp

`@kiwa-lab/dapp` は、ブラウザで動く dApp が wallet provider とやり取りする部分を、実 wallet 拡張を起動せずに Playwright で検証するための fixture です。test が始まると fixture は Anvil を起動し、作成した page に EIP-1193 互換の `window.ethereum` を注入します。アプリは通常の injected wallet として provider を呼び出し、test はその呼び出しに対する接続、署名、chain 変更、拒否を決定します。

そのため、このライブラリが検証するのは「dApp の UI と provider の契約」です。接続ボタンの後にアカウントが表示されること、ユーザー拒否をエラー表示に変換すること、chain 変更後に正しいネットワークを表示することを、同じブラウザ操作で確認できます。wallet 拡張そのもの、WalletConnect の relay、実ユーザーの秘密鍵を扱うものではありません。実 wallet との互換性は、ここで provider 契約を固めた後に別の手動または staging 検証で確かめます。

![ページとウォレットと Anvil の連携](/images/kiwa-docs/foundation/dapp-overview.png)

page は注入済み provider に request を送り、fixture は主要な EIP-1193 method を直接処理します。読み取り RPC の多くは Anvil に転送されます。test が `dappE2e` helper を呼ぶと provider の応答や event を変えられ、page は本番の wallet 応答と同じ経路で再描画します。fixture が起動した Anvil は test の終了時に停止します。

## 使う判断

Playwright で画面と wallet の接点を確認するなら `@kiwa-lab/dapp` を選びます。DOM だけを扱う Web E2E には [e2e](../e2e/) の方が軽く、Solidity contract の単体検証には contract adapter が適しています。`@kiwa-lab/dapp` は、アプリが `window.ethereum`、wagmi、viem、または同等の injected provider を使い、その結果で UI やトランザクション前の判断が変わるときのための層です。

既定では Anvil の chain ID `31337` と最初の開発 account を使い、`eth_chainId` は `0x7a69` を返します。署名や transaction、chain switch は既定で許可されます。拒否を検証したい test だけが `setApprovalMode` や `setRejectConnect` を設定します。状態の変更後は provider request が残っていないことを `waitForRpcIdle` で待ってから、画面を assertion します。

## 読み進める

[Quickstart](./quickstart) では最小の Playwright 設定、テスト file、実行 command を順に示します。[使い方](./how-to) では拒否、chain 変更、複数 wallet という実際に分岐が生まれるケースを扱います。[リファレンス](./reference) は fixture、Anvil helper、失敗条件を調べるためのページです。
