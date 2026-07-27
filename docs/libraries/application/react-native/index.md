# react-native

`@kiwa-lab/react-native` は、端末 API をまとめた `RNTestEnv` を作り、React Native の画面遷移や保存処理を検証するハーネスです。AsyncStorage、Navigation、Linking、Platform、Dimensions を一つの環境で扱います。

![Deep Linkで画面遷移と保存値を確認する流れ](/images/kiwa-docs/application/react-native-overview.png)

## 検証する流れ

`RNTestEnv` を作ると、初期 route、OS、画面サイズ、AsyncStorage、Navigation、Linking が同じテスト内の状態になります。ログイン後の token を保存して画面を遷移し、次に Deep Link を dispatch したときの route と受信履歴を確認してください。シミュレーターを起動せずに、アプリケーションが端末 API の戻り値をどう扱うかを検証できます。

実際の native module、gesture、レンダリング、OS permission dialog は対象外です。Expo SDK の mock は [expo](../expo/) を、実端末を含む操作は [e2e](../../foundation/e2e/) を使います。まず [Quickstart](./quickstart) で初期 route と保存済み token を持つ環境を作り、次に [使い方](./how-to) で Deep Link と複数の storage 操作を追加してください。状態と API の全項目は [リファレンス](./reference) を参照します。
