# Mobile v0.6 実 child_process.spawn 実行 — v0.5 shape preserving in 10 min

## What you'll build

`@kiwa/mobile` v0.6 で v0.5 spawn stub 契約層が **実 child_process.spawn 実行** に置換された経路を、 dry-run + DI + env sanitize の 3 pattern で決定的に扱う vitest suite。 **depth-5 pattern 実装完成**、 v0.5 shape 契約 preserving で backward compat 絶対維持。

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- Empty directory

## Step-by-step build

### 1. Bootstrap

```bash
mkdir kiwa-mobile-v06 && cd kiwa-mobile-v06
pnpm init
pnpm add -D @kiwa/mobile@^0.6 vitest typescript @types/node
```

### 2. Dry-run mode (実 CLI 未 install 環境向け)

`KIWA_MOBILE_SPAWN=dry-run` を env に追加すると v0.5 stub 相当の shape のみ返す = 実 spawn 実行しない。 CI / 実 CLI 未 install 環境で決定的挙動を検証する経路。

```ts
import { describe, expect, it } from 'vitest';
import { invokeMobileCli } from '@kiwa/mobile';

describe('v0.6 dry-run', () => {
  it('returns shape without invoking spawn', async () => {
    const r = await invokeMobileCli({
      command: 'expo build',
      args: ['--platform', 'ios'],
      env: { KIWA_MOBILE_MODE: 'real', KIWA_MOBILE_SPAWN: 'dry-run', PATH: '/usr/bin' },
    });
    expect(r.invoked).toBe(true);
    expect(r.stdout).toContain('[v0.6 dry-run]');
    expect(r.exitCode).toBe(0);
  });
});
```

### 3. DI 経路 (SpawnFn 注入)

`invokeMobileCliWith(inv, spawnFn)` で任意の spawn 実装を注入可能、 test 環境で決定的挙動を再現。

```ts
import { EventEmitter } from 'node:events';
import { describe, expect, it } from 'vitest';
import { invokeMobileCliWith, type SpawnFn } from '@kiwa/mobile';

class DummyChild extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  kill() {}
}

function makeSpawn(stdout: string): SpawnFn {
  return ((_cmd: string, _args: readonly string[]) => {
    const child = new DummyChild();
    setTimeout(() => {
      child.stdout.emit('data', Buffer.from(stdout));
      child.emit('close', 0, null);
    }, 0);
    return child as unknown as ReturnType<SpawnFn>;
  }) as unknown as SpawnFn;
}

describe('v0.6 DI', () => {
  it('captures injected stdout', async () => {
    const r = await invokeMobileCliWith(
      {
        command: 'metro bundle',
        args: [],
        env: { KIWA_MOBILE_MODE: 'real', PATH: '/usr/bin' },
      },
      makeSpawn('bundle ok'),
    );
    expect(r.stdout).toBe('bundle ok');
    expect(r.exitCode).toBe(0);
  });
});
```

### 4. env sanitize (secret 漏洩防止)

`sanitizeEnv(command, env)` で command per-command allowlist を通過した env のみ残す、 secret token / password 等は自動除去。

```ts
import { describe, expect, it } from 'vitest';
import { sanitizeEnv } from '@kiwa/mobile';

describe('v0.6 env sanitize', () => {
  it('drops secrets, keeps command-specific tokens', () => {
    const env = sanitizeEnv('expo build', {
      PATH: '/usr/bin',
      EXPO_TOKEN: 'ok',
      DATABASE_PASSWORD: 'nope',
      GITHUB_TOKEN: 'nope',
    });
    expect(env.EXPO_TOKEN).toBe('ok');
    expect(env.DATABASE_PASSWORD).toBeUndefined();
    expect(env.GITHUB_TOKEN).toBeUndefined();
  });
});
```

### 5. 実行

```bash
pnpm exec vitest run
# ✓ 3 tests pass
```

## v0.6 の 3 経路 = 実 CLI 有無問わず determ

- **Dry-run** = `KIWA_MOBILE_SPAWN=dry-run` で shape のみ、 実 spawn 未実行
- **DI** = SpawnFn を注入して決定的挙動、 CI 環境で 実 CLI 依存なし
- **実 spawn** = default 経路、 env sanitize + allowlist + timeout + buffer 上限で safe に実行

## 6 段構造完成 = depth-5 pattern 実装完成

- **v1.50 (base、 第 1 段)** = 3 axis semantics
- **v1.51 (2 段目)** = 4 advanced II axis + env-gate helper
- **v1.52 (3 段目)** = 4 advanced III axis (New Architecture)
- **v1.53 (4 段目 = depth-4 4 例目)** = 22 adapter + fidelity harness
- **v1.54 (5 段目 = depth-5 pattern 新設 kiwa milestone 史上初)** = spawn stub 契約層
- **v1.55 (6 段目 = depth-5 pattern 実装完成)** = 実 child_process.spawn 実行 + env sanitize + safety guards

Mobile pair は **kiwa milestone 史上初 depth-5 record + 実装完成 6 段構造**、 v1.60-v1.70 前後で depth-5 3 例安定化 candidate。

## 次の Step

- v1.55-2 dogfood app (`examples/dogfood-mobile-v06-spawn-app`) で dry-run + DI + sanitize の 3 pattern full workflow reference
- `docs/concepts/mobile-testing-v06-spawn.md` = 実 spawn safety SSOT + allowlist per-command + depth-5 pattern 実装完成 SSOT
- v1.56+ で 他 pair depth-5 拡張 (AI/LLM / Payment / Observability) or v2.0 Desktop adapter
