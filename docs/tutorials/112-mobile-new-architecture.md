# Mobile New Architecture — Fabric + TurboModules + Codegen in 12 min

## What you'll build

`@kiwa-lab/mobile` v0.3 で追加された advanced III 4 axis (fabric + turbo-modules + codegen + new-architecture) を、 React Native 0.76+ New Architecture の semantics を target-neutral に扱う vitest suite。 v1.50 base 3 + v1.51 advanced II 4 と合わせて **11 axis を production layer で使う pattern**、 pair 深度 3 段拡張達成 5 例目。

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- Empty directory

## Step-by-step build

### 1. Bootstrap

```bash
mkdir kiwa-mobile-new-arch && cd kiwa-mobile-new-arch
pnpm init
pnpm add -D @kiwa-lab/mobile@^0.3 vitest typescript @types/node
```

### 2. Fabric axis (concurrent renderer)

```ts
import { describe, expect, it } from 'vitest';
import {
  commitShadowTree,
  completeFabricMount,
  initFabric,
  scheduleFabricRender,
} from '@kiwa-lab/mobile';

describe('Fabric concurrent renderer', () => {
  it('schedule → commit → mount', () => {
    const s = initFabric({ target: 'ios', rootId: 'AppRoot' });
    scheduleFabricRender(s, 'discrete');
    commitShadowTree(s, { nodeCount: 24 });
    completeFabricMount(s);
    expect(s.state).toBe('mounted');
  });
});
```

### 3. TurboModules axis (typed native + JSI)

```ts
import { describe, expect, it } from 'vitest';
import {
  bindJsiRuntime,
  initTurboModules,
  invokeTurboMethod,
  registerTurboSpec,
  unregisterTurboModule,
} from '@kiwa-lab/mobile';

describe('TurboModules JSI lifecycle', () => {
  it('register → bind → invoke → unregister', () => {
    const s = initTurboModules({ target: 'android', moduleName: 'CameraTurbo' });
    registerTurboSpec(s, ['takePhoto']);
    bindJsiRuntime(s);
    invokeTurboMethod(s, 'takePhoto');
    unregisterTurboModule(s);
    expect(s.state).toBe('unregistered');
  });
});
```

### 4. Codegen axis (schema-first)

```ts
import { describe, expect, it } from 'vitest';
import {
  completeCodegenBuild,
  emitCodegenType,
  generateSpec,
  initCodegen,
  loadCodegenSchema,
} from '@kiwa-lab/mobile';

describe('Codegen build flow', () => {
  it('schema → spec → type → build', () => {
    const s = initCodegen({ target: 'ios', packageName: '@myapp/native' });
    loadCodegenSchema(s, 'sha256:abc');
    generateSpec(s, { specCount: 3 });
    emitCodegenType(s, 'NativeCameraSpec.h');
    completeCodegenBuild(s);
    expect(s.state).toBe('build-completed');
  });
});
```

### 5. New Architecture axis (async init + concurrent + interop)

```ts
import { describe, expect, it } from 'vitest';
import {
  bridgeLegacyModule,
  enableConcurrentReact,
  initNewArchitecture,
  markNewArchReady,
  startNewArchInit,
} from '@kiwa-lab/mobile';

describe('New Architecture full init', () => {
  it('init → concurrent → interop → ready', () => {
    const s = initNewArchitecture({ target: 'ios', appName: 'MyApp' });
    startNewArchInit(s);
    enableConcurrentReact(s);
    bridgeLegacyModule(s, 'LegacyAudio');
    markNewArchReady(s);
    expect(s.state).toBe('ready');
  });
});
```

### 6. 実行

```bash
pnpm exec vitest run
# ✓ 4 tests pass
```

## 11 axis grid の位置付け

- **v1.50 base 3 axis** = RN + Expo + Metro
- **v1.51 advanced II 4 axis** = navigation + reanimated + async-storage + secure-storage
- **v1.52 advanced III 4 axis** = fabric + turbo-modules + codegen + new-architecture

3 target × 11 axis = **33 row fidelity grid**、 132 total dialect mapping。 backward compat 絶対維持 = v0.1 + v0.2 API 変更 0。

## 次の Step

- v1.52-2 dogfood app (`examples/dogfood-mobile-new-arch-app`) で 4 new axis × 3 target = 12 grid workflow
- `docs/concepts/mobile-testing-advanced-III.md` で 11 axis SSOT + pair 深度 3 段記録 5 例目 SSOT
- v1.53+ で v0.4 real driver child_process 実装 (Metro real bundle + Expo EAS CLI + Fabric real renderer)
