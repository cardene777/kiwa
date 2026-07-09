# DevSecOps adapter integration — mock/real pair fidelity in 10 min

## What you'll build

A vitest suite wired to `@kiwa-lab/security-devsecops` v0.2 adapter interface。 mock adapter (deterministic replay、 常時実行可能) と real adapter (env-gate 通過時のみ実 CLI 呼出隠蔽経路) を pair で使い、 dev-flow の security 4 skill を library 経由で再現性 test 可能にする。

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- Empty directory

## Step-by-step build

### 1. Bootstrap

```bash
mkdir kiwa-devsecops-adapter && cd kiwa-devsecops-adapter
pnpm init
pnpm add -D @kiwa-lab/security-devsecops@^0.2 vitest typescript @types/node
```

### 2. Mock adapter chain — 6 axis 全実行

`tests/mock-chain.test.ts` — 6 adapter を横断的に実行、 deterministic replay。

```ts
import { describe, expect, it } from 'vitest';
import {
  containerSecurityMockAdapter,
  dastMockAdapter,
  iacScanMockAdapter,
  sastMockAdapter,
  scaMockAdapter,
  secretScanMockAdapter,
  type AdapterInvocation,
} from '@kiwa-lab/security-devsecops';

const inv = (scanId: string, target: string): AdapterInvocation => ({
  scanId,
  target,
  mode: 'mock',
});

describe('DevSecOps mock adapter chain', () => {
  it('6 axis mock adapters all complete', async () => {
    const results = await Promise.all([
      sastMockAdapter.scan(inv('sast', '/repo')),
      scaMockAdapter.scan(inv('sca', '/repo')),
      secretScanMockAdapter.scan(inv('secret', '/repo')),
      iacScanMockAdapter.scan(inv('iac', '/tf')),
      dastMockAdapter.scan(inv('dast', 'https://target')),
      containerSecurityMockAdapter.scan(inv('container', 'nginx:latest')),
    ]);
    for (const r of results) {
      expect(r.mode).toBe('mock');
      expect(r.completed).toBe(true);
    }
  });
});
```

### 3. Real adapter env-gate — 未設定時 fail-closed

`tests/real-env-gate.test.ts` — env 未設定時は throw、 設定時は pass。

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  sastRealAdapter,
  type AdapterInvocation,
} from '@kiwa-lab/security-devsecops';

const inv: AdapterInvocation = { scanId: 'r1', target: '/repo', mode: 'real' };

describe('SAST real adapter env-gate', () => {
  beforeEach(() => {
    delete process.env.KIWA_SECURITY_MODE;
    delete process.env.KIWA_SEMGREP_URL;
  });
  afterEach(() => {
    delete process.env.KIWA_SECURITY_MODE;
    delete process.env.KIWA_SEMGREP_URL;
  });

  it('throws when KIWA_SECURITY_MODE!=real', async () => {
    await expect(sastRealAdapter.scan(inv)).rejects.toThrow(/KIWA_SECURITY_MODE/);
  });

  it('throws when mode=real but URL missing', async () => {
    process.env.KIWA_SECURITY_MODE = 'real';
    await expect(sastRealAdapter.scan(inv)).rejects.toThrow(/semgrep URL env/);
  });

  it('succeeds when mode=real + URL set', async () => {
    process.env.KIWA_SECURITY_MODE = 'real';
    process.env.KIWA_SEMGREP_URL = 'http://mock-semgrep.local';
    const result = await sastRealAdapter.scan(inv);
    expect(result.mode).toBe('real');
    expect(result.completed).toBe(true);
  });
});
```

### 4. Fidelity harness — mock vs real 一致検証

`tests/fidelity.test.ts` — 完了状態が mock/real で一致することを検証。 v0.3 で real adapter が spawn 実装に置換されても本 harness は継続使用可能。

```ts
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  sastMockAdapter,
  sastRealAdapter,
  scaMockAdapter,
  scaRealAdapter,
  type AdapterInvocation,
} from '@kiwa-lab/security-devsecops';

const inv = (mode: 'mock' | 'real'): AdapterInvocation => ({
  scanId: 'fid',
  target: '/repo',
  mode,
});

describe('mock/real fidelity harness', () => {
  beforeEach(() => {
    process.env.KIWA_SECURITY_MODE = 'real';
    process.env.KIWA_SEMGREP_URL = 'http://x';
    process.env.KIWA_TRIVY_URL = 'http://x';
  });
  afterEach(() => {
    delete process.env.KIWA_SECURITY_MODE;
    delete process.env.KIWA_SEMGREP_URL;
    delete process.env.KIWA_TRIVY_URL;
  });

  it('SAST mock + real completions match', async () => {
    const mockR = await sastMockAdapter.scan(inv('mock'));
    const realR = await sastRealAdapter.scan(inv('real'));
    expect(mockR.completed).toBe(realR.completed);
  });

  it('SCA mock + real completions match', async () => {
    const mockR = await scaMockAdapter.scan(inv('mock'));
    const realR = await scaRealAdapter.scan(inv('real'));
    expect(mockR.completed).toBe(realR.completed);
  });
});
```

### 5. 実行

```bash
pnpm exec vitest run
# ✓ 6 tests pass
```

## adapter 経路の何が良いか

- **test 可能**: mock adapter は環境非依存、 vitest で常時再現、 skill 出力の regression detect 可能
- **fail-closed**: real adapter は env 未設定時 explicit throw、 「production で mock が silently 走る」 事故を防ぐ
- **backward compat**: v0.1 semantics function 直接使用も継続、 breaking change なし
- **v0.3 未来対応**: real adapter が実 CLI spawn に置換されても、 fidelity harness は継続使用可能

## 次の Step

- v1.47-3 dogfood app (`examples/dogfood-security-devsecops-adapter-app`) で 6 axis × mock/real × fidelity の full workflow reference
- `docs/concepts/security-devsecops-library-integration.md` § Phase 2 完成 SSOT で skill 4 種 × adapter 経路 map
- v0.3 (v1.48+) で `runSecurityAudit` single entry 統合、 skill 個別化を減らす計画
