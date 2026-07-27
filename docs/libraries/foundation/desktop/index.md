# desktop

`@kiwa-lab/desktop` は、Electron、Tauri、Webview と OS 固有機能のアプリケーション側の契約を、小さな状態遷移として検証する library です。実アプリを起動せず、window 作成、IPC、Tauri command、preload と context bridge、通知や clipboard の操作順を session の履歴に記録します。実装がどの順序を許可し、どの入力を拒否するかを速く固定するための harness です。

![デスクトップテストの実行経路](/images/kiwa-docs/foundation/desktop-overview.png)

## runtime ではなく操作の契約を test する

Electron では app を開始してから window を作り、IPC を dispatch し、最後に quit します。Tauri では command を登録してから invoke します。Webview では preload を読み込んでから bridge と message を扱います。各 API は session を更新し、`history` に OS 共通の `neutralEvent` と対象 OS に対応する `providerEvent` を残します。共通の振る舞いは前者で、macOS、Windows、Linux の差は後者で assertion します。

この順序には意味があります。終了済み Electron session で window を作る、未登録の Tauri command を invoke する、preload なしに context bridge を bind する操作は失敗します。成功だけを記録する mock ではなく、アプリが守るべき lifecycle と入力境界を test に残せます。`target` は runtime 名ではなく OS 名で、`macos`、`windows`、`linux` のいずれかです。

## native command は probe の結果で扱う

実 CLI が必要な axis には `probeAndInvoke` を使います。対応 OS か、CLI が割り当てられているか、CLI が利用可能かを順に確認し、`invoked`、`cli-unavailable`、`axis-skipped`、`no-cli-mapping` の status と reason を返します。使えない環境を例外で隠さず、CI の前提条件として記録できます。同じ probe を繰り返す場合は `InvokeCache` を使えますが、環境変数は cache key に含まれないため、環境で結果が変わる test では cache を無効化または clear します。

semantics API は OS、Electron、Tauri を起動しません。native command の spawn も `KIWA_DESKTOP_MODE=real` と dry-run を明示した経路です。実 UI の描画、native permission dialog、context isolation の強制、code signing、配布 artifact は実機または OS 別の E2E 環境で検証してください。

## 読み進める

[Quickstart](./quickstart) では Electron lifecycle を test にします。[使い方](./how-to) では Tauri command、Webview、native probe を扱います。session、adapter、cache の条件は [リファレンス](./reference) にあります。
