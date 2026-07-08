# Mobile v0.5 child_process.spawn stub — 6 CLI 契約層 in 10 min

## What you'll build

`@kiwa-test/mobile` v0.5 で追加された spawn-driver stub (`invokeMobileCli` + 6 CLI 呼出契約 + env-gate + fail-closed) を使い、 Mobile 領域の real CLI 呼出経路の契約層を deterministic に扱う vitest suite。 **pair 深度 5 段拡張 1 例目 candidate、 depth-5 pattern 新設**。

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- Empty directory

## Step-by-step build

### 1. Bootstrap

```bash
mkdir kiwa-mobile-real-cli && cd kiwa-mobile-real-cli
pnpm init
pnpm add -D @kiwa-test/mobile@^0.5 vitest typescript @types/node
```

### 2. Env-gate + fail-closed pattern

```ts
import { describe, expect, it } from 'vitest';
import { invokeMobileCli } from '@kiwa-test/mobile';

describe('spawn stub env-gate', () => {
  it('rejects when KIWA_MOBILE_MODE not real', async () => {
    await expect(
      invokeMobileCli({
        command: 'expo build',
        args: [],
        env: { KIWA_MOBILE_MODE: 'mock' },
      }),
    ).rejects.toThrow(/KIWA_MOBILE_MODE must be 'real'/);
  });

  it('returns spawn shape when env=real', async () => {
    const r = await invokeMobileCli({
      command: 'expo build',
      args: ['--platform', 'ios'],
      env: { KIWA_MOBILE_MODE: 'real' },
    });
    expect(r.invoked).toBe(true);
    expect(r.exitCode).toBe(0);
  });
});
```

### 3. Axis-CLI mapping

```ts
import { describe, expect, it } from 'vitest';
import { cliForAxis, type MobileAxis } from '@kiwa-test/mobile';

describe('axis-CLI mapping', () => {
  it('CLI-backed axes return command', () => {
    expect(cliForAxis('react-native')).toBe('react-native start');
    expect(cliForAxis('expo')).toBe('expo build');
    expect(cliForAxis('metro')).toBe('metro bundle');
    expect(cliForAxis('turbo-modules')).toBe('codegen run');
  });

  it('non-CLI axes return null', () => {
    expect(cliForAxis('navigation')).toBeNull();
    expect(cliForAxis('reanimated')).toBeNull();
    expect(cliForAxis('async-storage')).toBeNull();
    expect(cliForAxis('secure-storage')).toBeNull();
  });
});
```

### 4. 6 CLI 全実行

```ts
import { describe, expect, it } from 'vitest';
import { invokeMobileCli, type MobileCliCommand } from '@kiwa-test/mobile';

const ALL_CLIS: MobileCliCommand[] = [
  'expo build', 'metro bundle', 'codegen run',
  'react-native start', 'pod install', 'gradle build',
];

describe('all 6 CLI stubs', () => {
  it('every CLI returns valid SpawnResult', async () => {
    for (const cmd of ALL_CLIS) {
      const r = await invokeMobileCli({
        command: cmd,
        args: [],
        env: { KIWA_MOBILE_MODE: 'real' },
      });
      expect(r.command).toBe(cmd);
      expect(r.invoked).toBe(true);
    }
  });
});
```

### 5. 実行

```bash
pnpm exec vitest run
# ✓ 3 tests pass
```

## 5 段構造完成 = depth-5 pattern 新設 1 例目 candidate

- **v1.50 (base、 第 1 段)** = 3 axis semantics
- **v1.51 (2 段目)** = 4 advanced II axis + env-gate helper
- **v1.52 (3 段目)** = 4 advanced III axis (New Architecture)
- **v1.53 (4 段目 = depth-4 4 例目)** = adapter layer (11 mock + 11 real + fidelity harness)
- **v1.54 (5 段目 = depth-5 pattern 新設 1 例目 candidate)** = child_process.spawn stub 契約層 (6 CLI stub + env-gate + fail-closed)

kiwa milestone 史上、 depth-4 は 4 例安定化 (v1.40 AI/LLM + v1.41 Payment + v1.42 Observability + v1.53 Mobile)、 **depth-5 は Mobile v1.54 が新設 1 例目**。 v1.55+ で 実 CLI 実行に置換、 v1.60+ で 他 pair の 5 段拡張 candidate (depth-5 2 例目) が続く可能性。

## 次の Step

- v1.54-2 dogfood app (`examples/dogfood-mobile-real-cli-app`) で 6 CLI stub + env-gate + fail-closed の full workflow reference
- `docs/concepts/mobile-testing-real-cli.md` = spawn 契約 SSOT + depth-5 pattern 新設 SSOT
- v1.55+ で `invokeMobileCli` を実 `child_process.spawn` 実行に置換 (現在は stub 経路)
