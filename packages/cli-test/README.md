# @kiwa-test/cli-test

CLI / shell / file IO test adapter for kiwa.

## Overview

`@kiwa-test/cli-test` provides isolated, deterministic primitives for testing CLI tools:

- `setupCliEnv({ seedFiles, env, prefix })` — isolated tempdir with optional seed files, env override, helper file IO.
- `env.runCli({ cmd, args, stdin, env, cwd, timeoutMs })` — execFile with stdout/stderr capture, exit code, signal, duration.
- `expectExitCode` / `expectStdoutContains` / `expectStderrContains` — assertion helpers.

## Install

```bash
pnpm add -D @kiwa-test/cli-test @kiwa-test/spec vitest
```

## Quick start

```ts
import { afterEach, describe, expect, it } from "vitest";
import {
  expectExitCode,
  expectStdoutContains,
  setupCliEnv,
  type CliTestEnv,
} from "@kiwa-test/cli-test";

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

## License

MIT
