# Desktop の導入

このガイドでは Electron の起動から IPC、終了までを状態遷移として検証します。実 Electron process は起動しません。返される `AxisStep` と session の履歴を確認します。

## インストール

```bash
pnpm add -D @kiwa-lab/desktop
```

## 最小のテスト

```ts
import { describe, expect, it } from 'vitest';
import {
  createBrowserWindow,
  dispatchIpcMessage,
  quitElectronApp,
  startElectronApp,
} from '@kiwa-lab/desktop';

describe('desktop lifecycle', () => {
  it('records the expected electron flow', () => {
    const session = startElectronApp({
      target: 'macos',
      appId: 'com.example.desktop',
    });

    const windowStep = createBrowserWindow(session, 'main');
    const ipcStep = dispatchIpcMessage(session, {
      channel: 'settings:save',
      payload: '{"theme":"dark"}',
    });
    const quitStep = quitElectronApp(session);

    expect(windowStep.neutralEvent).toBe('electron.window_created');
    expect(ipcStep.metadata.channel).toBe('settings:save');
    expect(quitStep.state).toBe('quit');
    expect(session.history.map((step) => step.neutralEvent)).toEqual([
      'electron.app_ready',
      'electron.window_created',
      'electron.ipc_message_dispatched',
      'electron.app_quit',
    ]);
  });
});
```

`startElectronApp` は空の `appId` を受け付けません。`createBrowserWindow` は終了済み session では使えず、空の window ID も失敗します。IPC の channel も空にできません。こうした入力境界もアプリ側の検証と合わせてテストしてください。

## 履歴の読み方

各操作は session を更新し、`history` に `AxisStep` を追加します。`neutralEvent` は OS に依存しない assertion 用の名前です。`providerEvent` は `target` を反映したイベント名で、OS ごとの差を記録するときに使います。

`target: 'electron'` や `target: 'tauri'` は無効です。runtime の選択は呼び出す API で行い、`target` には対象 OS を指定します。

この example を `tests/desktop.lifecycle.test.ts` に保存して、次を実行します。

```bash
pnpm exec vitest run tests/desktop.lifecycle.test.ts
```

成功すれば、app の開始から quit までが期待した履歴として残ります。実 Electron process、IPC handler の実装、window の描画はこの test では起動しません。

## 次に読む

[使い方](./how-to) で command と native probe の扱いを確認します。[リファレンス](./reference) には操作ごとの前提条件をまとめています。
<!-- skill-guide -->
## skill との使い分け

この library には package 固有の companion skill はありません。まずこの Quickstart の code を test に書き、入力から結果までの境界を直接確認してください。skill を導入して仕様から test を組み立てる場合は、[kiwa の skill を使う](../../../guides/skills) の手順に従い、対象が unit、API、UI、e2e のどれかに応じて layer を選びます。専用 skill がないことは、実サービスの挙動を推測する生成物より、この library の公開 API と実装した test を先に確認するためです。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

desktop lifecycle の unit test を生成する場合は次を実行します。

```text
/kiwa:kiwa-design --layer unit --module desktop-lifecycle
/kiwa:kiwa-vitest --module desktop-lifecycle
```

出力先を変更していなければ、生成 file だけを実行します。

```bash
pnpm exec vitest run tests/spec/desktop-lifecycle.test.ts
```
