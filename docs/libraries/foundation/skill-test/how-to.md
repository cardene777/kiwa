# ツールの順序を検証する

一つの assertion ですべてを厳しくすると、仕様に関係のない内部改善で test が壊れます。反対に tool 名の存在だけを確認すると、危険な追加呼び出しや引数の改変を見逃します。`@kiwa-lab/skill-test` では回数、引数、順序、禁止する call を別々に重ねます。どこまでを固定するかは、実装の都合ではなく安全性と利用者への約束で決めます。

次の内容を `tests/agent-tool-path.test.ts` に保存してください。ここでは `answer` が SDK の callback を受け取る最小の agent adapter です。実際の agent では、`onToolCall` に SDK や transport がツールを選んだ直後の callback を渡します。test のためだけに `spy.record` を直接並べないでください。

```ts
import { expect, it } from "vitest";
import {
  assertToolCalled,
  assertToolCalledWith,
  assertToolCallOrder,
  assertToolNotCalled,
  createToolSpy,
} from "@kiwa-lab/skill-test";

type ToolCall = (name: string, argumentsJson: string) => void;

async function answer(input: string, onToolCall: ToolCall): Promise<string> {
  onToolCall("Read", JSON.stringify({ path: "policy.md" }));

  if (input.includes("deploy")) {
    onToolCall("Search", JSON.stringify({ query: "deployment policy", limit: 5 }));
    onToolCall("Bash", JSON.stringify({ cmd: "pnpm deploy --dry-run" }));
    return "dry run started";
  }

  return "nothing to deploy";
}

it("deploy 前に policy を読み dry run を一度だけ実行する", async () => {
  const spy = createToolSpy();

  await expect(answer("deploy this service", spy.record)).resolves.toBe("dry run started");

  assertToolCalled(spy, "Read", { times: 1 });
  assertToolCalled(spy, "Bash", { times: 1 });
  assertToolCalledWith(spy, "Search", { query: "deployment policy", limit: 5 });
  assertToolCalledWith(spy, "Bash", { cmd: "pnpm deploy --dry-run" });
  assertToolCallOrder(spy, ["Read", "Bash"]);
  assertToolNotCalled(spy, "Write");
});

it("deploy 以外では外部 command を呼ばない", async () => {
  const spy = createToolSpy();

  await expect(answer("summarize the policy", spy.record)).resolves.toBe("nothing to deploy");

  assertToolCalled(spy, "Read", { times: 1 });
  assertToolNotCalled(spy, "Bash");
  assertToolNotCalled(spy, "Write");
});
```

実行します。

```bash
pnpm exec vitest run tests/agent-tool-path.test.ts
```

`assertToolCalledWith` は同じ tool の呼び出しのうち一つが期待する引数に深く一致すれば通ります。回数も契約なら、例のように `assertToolCalled` と併用してください。JSON ではない CLI 形式の引数は JSON に変換されず、期待値にも同じ raw string を渡して比較します。

`assertToolCallOrder` は subsequence を検査します。この例では `Read` と `Bash` の間に `Search` が入っても通ります。情報を読んでから command を実行するという因果だけを守りたいときに向いています。認可前の外部送信が絶対に許されない、あるいは command が一つだけでなければならない場合は、次のように全記録を比較します。

```ts
expect(spy.getCalls().map(({ name, arguments: args }) => ({ name, args }))).toEqual([
  { name: "Read", args: '{"path":"policy.md"}' },
  { name: "Search", args: '{"query":"deployment policy","limit":5}' },
  { name: "Bash", args: '{"cmd":"pnpm deploy --dry-run"}' },
]);
```

この厳密な比較は telemetry のような許可済み call も固定します。仕様として許す call があるなら、期待列へ明記するか、観測対象を分けます。test を通すためだけに緩い順序 assertion へ戻さないでください。

失敗時は assertion message の actual calls と `spy.getCalls()` を確認します。`never invoked` は callback が呼ばれていないか tool 名が違う状態です。`no call matched expected args` は同名 tool は呼ばれたが引数が違う状態です。callback を UI logging と実行 hook の両方に繋ぐと、実装が正しくても二重に記録されます。各 test で `createToolSpy()` を作り、並列の agent run を一つの spy に混ぜないでください。
