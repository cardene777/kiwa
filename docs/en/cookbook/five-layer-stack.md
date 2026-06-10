# Stack five test layers on a single feature

> [🇬🇧 English](./five-layer-stack.md) • [🇯🇵 日本語](../../ja/cookbook/five-layer-stack.md)

[Stack three layers on the same contract](./three-layer-stack.md) shows how Foundry / Hardhat / Playwright run side by side on one Solidity contract. With the F-3 skills (`/kiwa-vitest` and `/kiwa-api`) you can now stack five layers on the same feature when the feature also has TS / TSX logic and an HTTP / RPC adapter.

## The five layers

| Layer | Skill | What it tests | Output path |
|---|---|---|---|
| Contract (Foundry) | `/kiwa-forge` | Solidity `*.sol` against `forge test` | `test/{Contract}.t.sol` |
| Contract (Hardhat) | `/kiwa-hardhat` | Same Solidity contract via `solidity-coverage` | `hardhat-test/{Contract}.test.cjs` |
| Unit (Vitest) | `/kiwa-vitest` | TS helpers / TSX hooks under `src/lib/` / `hooks/` | `test/unit/{module}.test.{ts,tsx}` |
| Integration (API) | `/kiwa-api` | HTTP / RPC handlers under `app/api/*/route.ts` via msw / supertest / Playwright `request` | `test/integration/{module}.test.ts` |
| E2E (Playwright) | `/kiwa-play` | dApp flow with `@kiwa-test/core` fixture (browser + anvil) | `tests/{module}.spec.ts` |

## When five layers pay off

The five-layer stack is overkill for a contract-only feature (e.g. ERC-721 mint with a static metadata URL — the three-layer stack covers it). It pays off when the feature has all three of the following.

- A Solidity surface that needs both Foundry and Hardhat (e.g. invariant on Foundry, coverage on Hardhat)
- TS / TSX helpers that compute fees / build calldata / format addresses outside React
- An HTTP / RPC adapter that the frontend calls and that talks to the contract

Concrete examples — `mint-nft` with a fee-calculation hook and an `/api/mint` endpoint, `defi-swap` with a slippage calculator and an `/api/quote` endpoint, `nextjs-token-gating` with a metadata fetcher and a `/api/access` endpoint.

## How the five layers stay aligned

The Layer 1 spec is still the single source of truth. `/kiwa-design --layer all` (or each `--layer contract` / `--layer e2e` / `--layer unit` / `--layer integration` in sequence) writes a spec under `tests/spec/{layer}/test-spec-{module}.md` and every Layer 2 skill reads it.

```mermaid
graph LR
    A[Feature] --> B[/kiwa-design]
    B --> C1[contract spec]
    B --> C2[e2e spec]
    B --> C3[unit spec]
    B --> C4[integration spec]
    C1 --> D1[/kiwa-forge]
    C1 --> D2[/kiwa-hardhat]
    C3 --> D3[/kiwa-vitest]
    C4 --> D4[/kiwa-api]
    C2 --> D5[/kiwa-play]
    D1 --> E1[forge test]
    D2 --> E2[hardhat test]
    D3 --> E3[vitest run]
    D4 --> E4[vitest run integration]
    D5 --> E5[playwright test]
```

## How to add a fifth layer to an existing example

Pick an example that already has the three-layer stack (mint-nft / defi-swap / nextjs-token-gating). Add the missing unit + integration layers in the following order.

1. `/kiwa-design --layer unit --module <name> --input src/lib/<helper>.ts`
2. `/kiwa-vitest --module <name>` → `test/unit/<name>.test.ts`
3. `/kiwa-design --layer integration --module <name> --input app/api/<route>/route.ts`
4. `/kiwa-api --module <name> --backend msw` (or `supertest` for Express-style)

After both Layer 2 skills converge to their coverage targets, the feature has five independent regression nets that catch different failure modes:

- Foundry catches Solidity invariants under fuzz
- Hardhat catches Solidity coverage gaps via `solidity-coverage`
- Vitest catches TS helper / TSX hook regressions
- msw / supertest catches HTTP boundary bugs (validation, status codes, idempotency)
- Playwright catches the end-to-end UX path

## Related

- [`three-layer-stack.md`](./three-layer-stack.md) — Contract-only three-layer stack
- [`tests/docs/skill-chain-tutorial.md`](../../../tests/docs/skill-chain-tutorial.md) — Full skill-chain flow
- [`.claude/skills/kiwa-vitest/SKILL.md`](../../../.claude/skills/kiwa-vitest/SKILL.md) — Unit layer skill spec
- [`.claude/skills/kiwa-api/SKILL.md`](../../../.claude/skills/kiwa-api/SKILL.md) — Integration layer skill spec
