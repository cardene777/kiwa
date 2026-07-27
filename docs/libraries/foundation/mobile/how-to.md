# navigation、storage、CLI の境界を検証する

navigation と storage は実 device を動かさず、アプリコードが要求した操作を memory 上の session に記録します。CLI だけは real mode で child process を起動できますが、最初は dry-run で command shape と許可された環境変数を確認してください。

次の内容全体を `tests/mobile.integration-boundary.test.ts` に保存します。navigation intent、storage の読み書き、Expo command の dry-run を同じ file で扱います。

```ts
import { expect, test } from "vitest";
import {
  flushAsyncStorageBatch,
  initAsyncStorage,
  initNavigation,
  invokeMobileCli,
  navigateDeepLink,
  pushNavigationStack,
  readAsyncStorageItem,
  setAsyncStorageItem,
  switchNavigationTab,
} from "@kiwa-lab/mobile";

test("records navigation intent without resolving a route", () => {
  const session = initNavigation({ target: "ios", navigatorId: "root" });
  pushNavigationStack(session, "profile");
  switchNavigationTab(session, "settings");
  const step = navigateDeepLink(session, "example://settings/notifications");

  expect(session.stackHistory).toEqual(["profile"]);
  expect(session.activeTab).toBe("settings");
  expect(step.neutralEvent).toBe("navigation.deep_link_navigated");
});

test("tracks storage reads and writes in memory", () => {
  const storage = initAsyncStorage({ target: "web", storeId: "preferences" });
  setAsyncStorageItem(storage, { key: "theme", value: "dark" });
  const read = readAsyncStorageItem(storage, "theme");
  const flush = flushAsyncStorageBatch(storage);

  expect(read.metadata.hit).toBe(true);
  expect(flush.metadata.itemCount).toBe(1);
});

test("checks the Expo command shape without spawning it", async () => {
  const result = await invokeMobileCli({
    command: "expo build",
    args: ["--platform", "ios"],
    env: {
      KIWA_MOBILE_MODE: "real",
      KIWA_MOBILE_SPAWN: "dry-run",
    },
  });

  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("expo build");
});
```

## session が保証しないことを分ける

navigation は stack、tab、modal、deep link の入力を記録します。URL を解決したり画面を描画したりはしません。navigator ID、screen 名、tab 名、modal ID、URL は空文字列にできませんが、route の存在確認は router の実装 test に残します。

storage は memory 上の `Map` を使います。AsyncStorage、MMKV、localStorage、secure storage を読んだり書いたりしません。set の key は空にできません。read と remove は存在しない key も操作として記録できます。実データの永続化、暗号化、認証を確認する場合は実 storage adapter を別途用意します。

実 CLI spawn には `KIWA_MOBILE_MODE=real` が必須で、args は 32 個までです。dry-run を外すと command ごとの allowlist だけを child process に渡します。Expo は `PATH`、`HOME`、`NODE_ENV`、`EXPO_TOKEN`、`EAS_TOKEN` だけです。実 driver を使う axis では URL も必要です。たとえば Expo EAS は `KIWA_EXPO_EAS_URL`、Metro は `KIWA_METRO_URL` を要求します。不足時は明示的に失敗します。

実機の route 解決、storage 永続化、permission dialog、camera、push notification、配布 build はこの library の範囲外です。semantics API で操作順と error 条件を固定し、emulator または device E2E で OS と framework の接続を確認してください。

## 実行する

```bash
pnpm exec vitest run tests/mobile.integration-boundary.test.ts
```
