# @kiwa-lab/cli-test

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-en.gif" alt="kiwa 127s overview — generate full-spec tests across Web (Next.js) / Contract (Solidity) / dApp (Playwright) in 6 steps (this package covers the CLI test surface)" width="640" />
  <br />
  <sub>Full <a href="https://github.com/cardene777/kiwa">kiwa</a> overview (127s) — this package covers the CLI test surface shown in the video. <a href="https://github.com/cardene777/kiwa/blob/main/assets/kiwa-promo-en.mp4">▶ Full-quality MP4 (2.9 MB)</a>.</sub>
</p>

CLI / shell / file IO test adapter for kiwa.

## Overview

`@kiwa-lab/cli-test` provides isolated, deterministic primitives for testing CLI tools:

- `setupCliEnv({ seedFiles, env, prefix })` — isolated tempdir with optional seed files, env override, helper file IO.
- `env.runCli({ cmd, args, stdin, env, cwd, timeoutMs })` — execFile with stdout/stderr capture, exit code, signal, duration.
- `expectExitCode` / `expectStdoutContains` / `expectStderrContains` — assertion helpers.

## Install

```bash
pnpm add -D @kiwa-lab/cli-test @kiwa-lab/core vitest
```

## Quick start

```ts
import { afterEach, describe, expect, it } from "vitest";
import {
  expectExitCode,
  expectStdoutContains,
  setupCliEnv,
  type CliTestEnv,
} from "@kiwa-lab/cli-test";

const envs: CliTestEnv[] = [];
afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

it("greets the user", async () => {
  const env = await setupCliEnv({ env: { GREETING: "hi" } });
  envs.push(env);
  const result = await env.runCli({
    cmd: "node",
    args: ["-e", 'console.log(process.env.GREETING + ", " + process.argv.slice(1)[0])', "world"],
  });
  expectExitCode(result, 0, expect);
  expectStdoutContains(result, "hi, world", expect);
});
```

## File IO helpers

```ts
await env.writeFile("config.json", JSON.stringify({ x: 1 }));
const config = await env.readFile("config.json");
const allFiles = await env.listFiles(); // recursive walk relative to tempDir
const exists = await env.fileExists("config.json");
```

## Example: kiwa CLI dogfooding PoC

See [`examples/cli-poc/`](../../examples/cli-poc) — the PoC drives the production `kiwa` CLI through `setupCliEnv` to verify help / doctor / init / anvil seed behavior end-to-end.

<!-- kiwa-docs:start -->
## Documentation

公開ドキュメントを正本として管理しています。

- [概要](https://cardene777.github.io/kiwa/libraries/foundation/cli-test/)
- [はじめる](https://cardene777.github.io/kiwa/libraries/foundation/cli-test/quickstart)
- [使い方](https://cardene777.github.io/kiwa/libraries/foundation/cli-test/how-to)
- [リファレンス](https://cardene777.github.io/kiwa/libraries/foundation/cli-test/reference)

編集元は [docs/libraries/foundation/cli-test](../../docs/libraries/foundation/cli-test/) です。
<!-- kiwa-docs:end -->

## License

MIT
