# @kiwa-lab/cli-test 使い方

import-data command を例に、temporary directory 内で stdin を読み、設定 file を cwd から読むまでを確認します。さらに timeout は `CliRunResult` ではなく Promise rejection であることを別の case にします。これらを混ぜないことで、CLI 自身が返した failure と test harness が command を起動できなかった failure を区別できます。

`tests/import-data.cli.test.ts` を作成します。

```ts
import { afterEach, describe, expect, it } from 'vitest';
import {
  dispatchCliEvent,
  setupCliEnv,
  startCli,
  summarizeCli,
  type CliTestEnv,
} from '@kiwa-lab/cli-test';

const envs: CliTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) await envs.pop()?.stop();
});

describe('import-data command', () => {
  it('reads stdin in a relative cwd and writes the result', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    await env.writeFile('config/app.json', '{"enabled":true}');

    const result = await env.runCli({
      cmd: 'node',
      args: [
        '-e',
        "const fs=require('node:fs'); process.stdin.on('data', d => { fs.writeFileSync('imported.txt', d); console.log(fs.existsSync('app.json')); });",
      ],
      cwd: 'config',
      stdin: 'hello',
    });

    expect(result.exitCode).toBe(0);
    expect(result.signal).toBeNull();
    expect(result.stdout.trim()).toBe('true');
    expect(await env.readFile('config/imported.txt')).toBe('hello');
    expect((await env.listFiles()).sort()).toEqual(['config/app.json', 'config/imported.txt']);
  });

  it('rejects a command that exceeds the harness timeout', async () => {
    const env = await setupCliEnv();
    envs.push(env);
    await expect(
      env.runCli({
        cmd: 'node',
        args: ['-e', 'setTimeout(() => {}, 5000)'],
        timeoutMs: 50,
      }),
    ).rejects.toThrow(/timed out/);
  });

  it('checks a lifecycle plan without starting a process', () => {
    const started = startCli({ timestamp: '2026-01-01T00:00:00.000Z' });
    const running = dispatchCliEvent({
      session: started,
      event: 'spawn-succeeded',
      timestamp: '2026-01-01T00:00:01.000Z',
    });
    const exited = dispatchCliEvent({
      session: running,
      event: 'exit-detected',
      timestamp: '2026-01-01T00:00:02.000Z',
    });
    expect(summarizeCli(exited)).toMatchObject({ currentState: 'exited', spawns: 1 });
  });
});
```

実行します。

```bash
pnpm exec vitest run tests/import-data.cli.test.ts
```

`stdin` を省略しても stream は閉じられます。対話入力を待つ command には `timeoutMs` を指定してください。timeout と binary の spawn error は Promise rejection なので、result の `signal` や stderr をこの経路で assertion しません。child が signal で終了して result を返す場合は、OS によって `exitCode` がゼロへ正規化されるため `signal` も確認します。

relative `cwd` は temporary directory に結合されますが、`../` を含む path と absolute `cwd` は拒否されません。この helper は sandbox ではないため、test の path を user input から組み立てず temporary directory 配下の既知の相対 path に限定してください。`env.stop()` は directory を削除します。background child を自分で起動した場合は stop の前に終了させます。
