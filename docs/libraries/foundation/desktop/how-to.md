# Desktop の使い方

## Tauri command を検証する

Tauri command は登録してから invoke します。未登録 command の invoke は失敗するため、成功だけでなく登録漏れもテストできます。

```ts
import { expect, test } from 'vitest';
import {
  invokeTauriCommand,
  registerTauriCommand,
  startTauriApp,
} from '@kiwa-lab/desktop';

test('invokes a registered command', () => {
  const session = startTauriApp({
    target: 'windows',
    appName: 'settings-app',
  });

  registerTauriCommand(session, 'save_preferences');
  const step = invokeTauriCommand(session, {
    commandName: 'save_preferences',
    payload: '{"theme":"dark"}',
  });

  expect(step.neutralEvent).toBe('tauri.command_invoked');
  expect(session.state).toBe('command-invoked');
});
```

`appName` と command 名は空文字列にできません。`invokeTauriCommand` は登録済みの command だけを受け付けます。payload は文字列として記録され、JSON の構文や command の実装結果は評価しません。payload の schema と実際の command 実行はアプリ側のテストで扱います。

## Webview の isolation を記録する

Webview は preload を読み込んでから bridge と message を扱います。`bindContextBridge` と `postWebviewMessage` は preload なしでは失敗します。

```ts
import {
  assertContextIsolation,
  bindContextBridge,
  loadPreloadScript,
  postWebviewMessage,
} from '@kiwa-lab/desktop';

const session = loadPreloadScript({ target: 'linux', webviewId: 'settings' });
bindContextBridge(session, 'desktopApi');
postWebviewMessage(session, { channel: 'settings:open', payload: '{}' });
const step = assertContextIsolation(session, true);

console.log(step.metadata.isolated);
// true
```

この検証は context isolation の設定値を記録するもので、ブラウザの security boundary を実際に強制するものではありません。実 Webview の権限と preload 実装は実行環境で別途検証します。

## native command の結果を分けて扱う

`probeAndInvoke` は OS によって使えない axis や未導入 CLI を例外だけで扱わず、結果の `status` と `reason` で返します。

```ts
import { expect, test } from 'vitest';
import { probeAndInvoke } from '@kiwa-lab/desktop';

test('reports whether a native command can run', async () => {
  const result = await probeAndInvoke({
    axis: 'clipboard',
    target: 'macos',
    args: ['--help'],
  });

  expect([
    'invoked',
    'cli-unavailable',
    'axis-skipped',
    'no-cli-mapping',
  ]).toContain(result.status);
});
```

`invoked` でも native UI を操作したとは限りません。この経路は `KIWA_DESKTOP_MODE=real` と dry-run 指定を付けて spawn します。`cli-unavailable` と `axis-skipped` は成功として数えず、必要な OS とツールを CI の前提条件として明示してください。

## cache を使う

同じ axis、target、args の probe を繰り返す場合は `InvokeCache` と `withCache` を使えます。cache key に env は含まれません。環境変数で結果が変わる検証では cache を無効にするか、実行前に `clear` してください。

TTL の既定値は 5 分、最大 entry 数は 128 です。`ttlMs` または `maxEntries` を負値にすると cache は無効になります。`cacheStatus` を assertion し、古い結果を実行済みの根拠にしないようにします。

## 実行して status を確認する

Tauri、Webview、probe の example を `tests/desktop.boundary.test.ts` に保存し、次を実行します。

```bash
pnpm exec vitest run tests/desktop.boundary.test.ts
```

成功すれば、登録済み command は invoke され、preload 後の bridge と message は履歴に残り、probe は利用可否を status で返します。`cli-unavailable` と `axis-skipped` は native command が成功したことを意味しません。実 CLI を使う場合は対象 OS、必要な tool、`KIWA_DESKTOP_MODE=real` を CI の前提として用意してください。
