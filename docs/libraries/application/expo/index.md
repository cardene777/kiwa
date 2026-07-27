# @kiwa-lab/expo

`@kiwa-lab/expo` は、Expo Router、SecureStore、Notifications、FileSystem、Camera を一つの in-memory テスト環境へまとめる harness です。Expo Go、実端末、EAS build を起動せずに、端末 API に依存するアプリケーションフローを検証できます。

![Expo の router、端末 storage、通知、camera を一つの環境で検証する流れ](/images/kiwa-docs/application/expo-overview.png)

## 検証する流れ

`ExpoTestEnv` の router では `push`、`replace`、`back` が現在 path、params、履歴を変えます。SecureStore は key の保存、取得、削除を状態として持つため、token がない場合の分岐も同じテストで確認できます。通知は scheduled list へ、file 操作は URI ごとの state へ、camera は permission と capture 結果へ記録されます。

そのため、アプリケーションが端末 API を呼んだあとに何を表示または送信するかを検証できます。実際の push 配信、Keychain、camera、native file I/O を証明するものではありません。そこで必要になる端末固有の確認は実機または統合テストへ残してください。

## 使わない場面

これは実際の Expo SDK、push 配信、Keychain、端末 camera、ネイティブ file I/O を起動しません。OS permission dialog、deep link、実端末の push token、画像のピクセル内容、EAS update は必要に応じて実機または integration test で確認してください。

## 読み進める

[Quickstart](./quickstart) で `ExpoTestEnv` を使い token 保存と画面遷移を検証します。[使い方](./how-to) では通知、ファイル、camera permission を扱います。各 mock の保持する状態は [リファレンス](./reference) にあります。
