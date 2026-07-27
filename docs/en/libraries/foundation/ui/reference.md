# API Reference

> [日本語](/libraries/foundation/ui/reference)

This reference is based on the public exports in `packages/ui/src/index.ts`.

## React

```ts
function setupComponentEnv(options: SetupComponentEnvOptions): Promise<UiTestEnv>
```

`SetupComponentEnvOptions` requires a `mode` and React `ui`, and optionally accepts `renderOptions` and `userEventOptions`.

| `UiTestEnv.kind` | Primary properties |
| --- | --- |
| `render` | `result`, `screen` |
| `interaction` | `result`, `screen`, `user` |
| `snapshot` | `result`, `markup` |

Every environment has `stop(): Promise<void>`.

## Framework helpers

| Helper | Target |
| --- | --- |
| `setupVueComponentEnv` | Vue 3 |
| `setupSvelteComponentEnv` | Svelte |
| `setupSolidComponentEnv` | SolidJS |
| `setupLitComponentEnv` | Lit Web Components |
| `setupQwikComponentEnv` | Qwik |
| `setupAngularComponentEnv` | Angular |
| `setupBrowserComponentEnv` | Playwright browser |

Each helper's options and return type depend on the matching framework test utility. For exact exports and types, see [src/index.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/index.ts) and [types.ts](https://github.com/cardene777/kiwa/blob/main/packages/ui/src/types.ts).
