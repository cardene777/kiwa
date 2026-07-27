# @kiwa-lab/cli-test はじめる

このチュートリアルでは、seed file を作り、temporary directory を cwd として Node command を起動し、出力と file の両方を検証します。

## インストール

```bash
pnpm add -D @kiwa-lab/cli-test vitest
```

## 最初のテスト

```ts
import { afterEach, expect, it } from "vitest";
import { setupCliEnv, type CliTestEnv } from "@kiwa-lab/cli-test";

const envs: CliTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) await envs.pop()?.stop();
});

it("seed file を読み、結果を書き出す", async () => {
  const env = await setupCliEnv({
    seedFiles: { "input.txt": "hello" },
    env: { KIWA_PREFIX: "result" },
  });
  envs.push(env);

  const result = await env.runCli({
    cmd: "node",
    args: ["-e", "const fs=require('node:fs'); fs.writeFileSync('output.txt', process.env.KIWA_PREFIX + ':' + fs.readFileSync('input.txt', 'utf8')); console.log('done')"],
  });

  expect(result.exitCode).toBe(0);
  expect(result.signal).toBeNull();
  expect(result.stdout).toBe("done\n");
  expect(await env.readFile("output.txt")).toBe("result:hello");
});
```

`runCli` は setup 時の env に、呼び出し時の `env` を上書きして child process へ渡します。初期 env は `process.env` を基にしているため、必要な値だけを明示的に上書きしてください。

## helper を使う

`expectExitCode`、`expectStdoutContains`、`expectStderrContains` は Vitest の `expect` を第三引数として受け取ります。これは global expect を内部で import しないためです。

```ts
import { expect } from "vitest";
import { expectExitCode, expectStdoutContains } from "@kiwa-lab/cli-test";

expectExitCode(result, 0, expect);
expectStdoutContains(result, "done", expect);
```

直接 `expect(result.exitCode)` を使っても構いません。helper を二引数だけで呼ぶと runtime error になります。

この example を `tests/import-data.cli.test.ts` に保存し、次を実行します。

```bash
pnpm exec vitest run tests/import-data.cli.test.ts
```

成功すれば seed file を読む child process の stdout、exit code、生成 file を確認できます。test の終了時に `afterEach` がすべての temporary directory を削除します。

## 次に読む

stdin、timeout、path の境界は [使い方](./how-to) を確認してください。
<!-- skill-guide -->
## skill で仕様から test を作る

この library の companion skill は、先に作成した仕様を input にします。[kiwa の skill を使う](../../../guides/skills) の手順で plugin を導入し、Quickstart の最小 test で API と期待結果を理解してから実行してください。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

次の順序では、最初の command が `tests/spec/` に仕様を作り、二つ目の command がその module の test を作ります。

```text
/kiwa:kiwa-design --layer cli --module import-data
/kiwa:kiwa-cli-test --module import-data
```

生成した test は、そのまま正しさの証明にはなりません。Quickstart にある入力、期待結果、対象外の境界と照合し、プロジェクトの runner で実行してください。既定の出力先を使った場合は、次で実行します。

```bash
pnpm exec vitest run tests/import-data.test.ts
```

layer の選択肢と出力先は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-cli-test/SKILL.md) を参照してください。
