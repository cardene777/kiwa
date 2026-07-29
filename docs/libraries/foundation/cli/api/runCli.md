---
title: "@kiwa-lab/cli runCli の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/cli</code> <code v-pre>runCli</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/cli/src/runCli.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createDefaultDeps</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cli/src/runCli.ts#L74) <code v-pre>packages/cli/src/runCli.ts</code>

Dependencies backed by the current node process, used by the `kiwa` executable.

```ts
export declare function createDefaultDeps(): RunCliDeps;
```

#### <code v-pre>runCli</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cli/src/runCli.ts#L360) <code v-pre>packages/cli/src/runCli.ts</code>

Runs one `kiwa` invocation and resolves with the process exit code. `argv` excludes the node binary and the script path (`process.argv.slice(2)`). The function never terminates the process and never rejects: unexpected failures are reported on stderr as `ERR &lt;message&gt;` and resolve with 1.

```ts
export declare function runCli(argv: string[], deps: RunCliDeps): Promise<number>;
```

#### <code v-pre>takeFlagValue</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cli/src/runCli.ts#L97) <code v-pre>packages/cli/src/runCli.ts</code>

Reads the value of `--flag value` or `--flag=value` from `argv`. Returns undefined when the flag is absent, and throws when the flag is present but the following token is missing or is itself a flag.

```ts
export declare function takeFlagValue(argv: string[], flag: string): string | undefined;
```

#### <code v-pre>USAGE</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cli/src/runCli.ts#L8) <code v-pre>packages/cli/src/runCli.ts</code>

Usage text printed by `--help` / `-h` and appended to the unknown-command error.

```ts
export declare const USAGE = "Usage: kiwa <command> [options]\n\nCommands:\n  init [options]                                            Scaffold e2e/connect.spec.ts + playwright.config.ts + tsconfig.json + package.json\n  doctor                                                    Check that anvil is installed\n  anvil seed <script> --out <path>                          Run <script> against a fresh anvil and dump state to <path>\n  spec-to-test --in <spec.md> --out <test.ts> [--layer L]   Generate a vitest test file from a Layer 1 spec.md\n  run --watch [--layer L]...                                Run vitest in watch mode across one or more layers (default unit + api + ui)\n  --help, -h                                                Show this message\n\ninit options:\n  --force                       Overwrite existing files instead of failing on conflict\n  --testDir <path>              Place generated spec under <path> instead of e2e/ (relative)\n  --config-suffix <name>        Generate playwright.<name>.config.ts instead of playwright.config.ts\n  --script-key <key>            package.json scripts key for the generated playwright command (default test:e2e)\n  --with-deploy <foundry-path>  Also generate tests/{prepare-env,global-setup,global-teardown,fixture}.ts\n                                pointing at the given Foundry project (relative to cwd)\n\nanvil seed options:\n  --out <path>      Path to write state json (anvil --dump-state). Required.\n  --chain-id <n>    Override chain id (default 31337).\n  --port <n>        Bind anvil to specific port (default: random free port).\n\nspec-to-test options:\n  --in <path>       Layer 1 spec markdown file. Required.\n  --out <path>      Output vitest test file. Required.\n  --layer <name>    Override layer (api / ui / data / cli). Default: inferred from spec meta.\n\nrun --watch options:\n  --layer <name>   Layer to watch (repeat to add more): unit / api / ui / data / cli / e2e (default unit api ui).\n  --dry-run        Print the commands that would be spawned without launching them.\n";
```

### 型

#### <code v-pre>RunCliDeps</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cli/src/runCli.ts#L56) <code v-pre>packages/cli/src/runCli.ts</code>

Every side effect `runCli` performs. `bin.ts` passes the process-backed implementations; tests pass fakes so that argv parsing, command routing and exit codes can be exercised without spawning subprocesses, touching the network or terminating the test process.

```ts
export interface RunCliDeps {
    /** Working directory handed to each command implementation. */
    cwd: () => string;
    /** Sink for everything the CLI writes to stdout. */
    stdout: (chunk: string) => void;
    /** Sink for everything the CLI writes to stderr. */
    stderr: (chunk: string) => void;
    /** Runs a shell command and returns its stdout; `doctor` locates anvil with it. */
    execSync: (command: string) => string;
    runInit: (options: InitOptions) => InitResult;
    runAnvilSeed: (options: AnvilSeedOptions) => Promise<AnvilSeedResult>;
    runSpecToTest: (options: SpecToTestOptions) => SpecToTestSummary;
    runWatch: (options: RunWatchOptions) => RunWatchResult;
    /** Forwarded to `runWatch`; lets a caller observe the spawned children. */
    spawnFn?: RunWatchOptions['spawnFn'];
}
```

#### <code v-pre>SpecToTestSummary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/cli/src/runCli.ts#L42) <code v-pre>packages/cli/src/runCli.ts</code>

What `spec-to-test` reports back after writing the generated test file.

```ts
export interface SpecToTestSummary {
    module: string;
    layer: string;
    count: number;
    outPath: string;
}
```
