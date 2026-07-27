# @kiwa-lab/macos-app を始める

`@kiwa-lab/macos-app` は、SwiftUI または AppKit の view tree に操作を送り、アプリが受け取る event を test する harness です。この Quickstart では SwiftUI の既定 Start ボタンを操作し、存在しない node が成功扱いにならないことまで確認します。Xcode、XCTest、macOS process は起動しません。

## インストール

```bash
pnpm add -D @kiwa-lab/macos-app vitest
```

## 操作対象を test にする

次の内容を `tests/start-button.macos-app.test.ts` にそのまま保存してください。`simulateUserInteraction` は view tree から id を探し、見つかって有効な node だけを event log へ記録します。ここで保証するのは操作対象の選択と dispatch です。SwiftUI の `@State` 更新や AppKit の responder chain は実行しません。

```ts
import { expect, it } from "vitest";
import {
  createMacAppEnv,
  simulateUserInteraction,
} from "@kiwa-lab/macos-app";

it("Start ボタンを操作し、不正な target を拒否する", () => {
  const env = createMacAppEnv({ mode: "swiftui", now: () => 1_000 });
  const click = simulateUserInteraction(env, {
    type: "click",
    target: "action",
  });
  const missing = simulateUserInteraction(env, {
    type: "click",
    target: "missing",
  });

  expect(click).toMatchObject({
    targetFound: true,
    targetType: "Button",
    dispatched: true,
    handled: true,
  });
  expect(env.eventLog).toEqual([
    expect.objectContaining({ at: 1_000, kind: "click:action" }),
  ]);
  expect(missing).toMatchObject({
    targetFound: false,
    dispatched: false,
    handled: false,
    reason: "target not found: missing",
  });
});
```

保存後は、この file だけを実行します。

```bash
pnpm exec vitest run tests/start-button.macos-app.test.ts
```

成功時には `action` が Button として見つかり、一件の click event が記録されます。実アプリ固有の tree を使う場合は、実際の node id を `target` に指定し、操作後の遷移や state 更新はアプリ側の test で assertion してください。

## 次に行うこと

accessibility role、deterministic screencap、通知の組み立ては [使い方](./how-to) で確認します。実際の AXUIElement 属性、VoiceOver、通知 permission、画面描画は macOS 上の統合 test または UI automation の対象です。

<!-- skill-guide -->
## skill で test を作る

`/kiwa:kiwa-macos-app` は native app test の下書きを作れます。初回だけ plugin を導入します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

```text
/kiwa:kiwa-macos-app --module preferences-pane --framework swiftui --output tests/integration/preferences.macos-app.test.ts
```

生成後は view id、framework、操作後に確認する event と state を実装へ合わせ、生成した file だけを実行します。

```bash
pnpm exec vitest run tests/integration/preferences.macos-app.test.ts
```

skill の引数は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-macos-app/SKILL.md) を参照してください。
