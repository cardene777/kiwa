# kiwa

The short entry point for [kiwa](https://github.com/cardene777/kiwa), a spec-driven development platform where testing, formal verification, and specification meet.

```bash
npx kiwa init
```

This package delegates every command to [`@kiwa-lab/cli`](https://www.npmjs.com/package/@kiwa-lab/cli). It exists so the unscoped name resolves to the same binary, and you can type `npx kiwa` instead of `npx @kiwa-lab/cli`.

## What kiwa is

`kiwa` (際) means boundary, edge, and connection. The project treats the boundaries between specification and implementation, between runtime testing and formal verification, and between each step of the development flow as the places where quality is decided.

Read the [MANIFESTO](https://github.com/cardene777/kiwa/blob/main/MANIFESTO.md) for the full reasoning.

## Related packages

| Package | Purpose |
|---|---|
| [`@kiwa-lab/kaname`](https://www.npmjs.com/package/@kiwa-lab/kaname) | Classify specification items and split them into paired spec files |
| [`@kiwa-lab/lean`](https://www.npmjs.com/package/@kiwa-lab/lean) | Generate and verify Lean 4 specs from state machine definitions |
| [`@kiwa-lab/cli`](https://www.npmjs.com/package/@kiwa-lab/cli) | The commands this package delegates to |

## License

Pre-release. All rights reserved. See [LICENSE](https://github.com/cardene777/kiwa/blob/main/LICENSE).
