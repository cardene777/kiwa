# 1 機能に 5 layer test を重ねる

> [🇬🇧 English](../../en/cookbook/five-layer-stack.md) • [🇯🇵 日本語](./five-layer-stack.md)

[同じ contract に 3 layer を重ねる](./three-layer-stack.md) は 1 Solidity contract に Foundry / Hardhat / Playwright を並立する形を示した。 F-3 skill (`/kiwa-vitest` と `/kiwa-api`) が出揃ったことで、 機能が TS / TSX ロジック + HTTP / RPC adapter も持つ場合は同じ機能に 5 layer を並立できる。

## 5 layer の内訳

| Layer | Skill | 何を test するか | 出力 path |
|---|---|---|---|
| Contract (Foundry) | `/kiwa-forge` | `*.sol` を `forge test` で | `test/{Contract}.t.sol` |
| Contract (Hardhat) | `/kiwa-hardhat` | 同 contract を `solidity-coverage` 経由で | `hardhat-test/{Contract}.test.cjs` |
| Unit (Vitest) | `/kiwa-vitest` | `src/lib/` / `hooks/` の TS helper / TSX hook | `test/unit/{module}.test.{ts,tsx}` |
| Integration (API) | `/kiwa-api` | `app/api/*/route.ts` を msw / supertest / Playwright `request` 経由 | `test/integration/{module}.test.ts` |
| E2E (Playwright) | `/kiwa-play` | `@kiwa-test/core` fixture 経由の dApp flow (browser + anvil) | `tests/{module}.spec.ts` |

## 5 layer が引き合う場面

contract 単体機能 (例 ERC-721 mint で metadata URL 固定) には 5 layer は overkill (3 layer で十分)。 以下 3 点全部当てはまるときに引き合う。

- Foundry と Hardhat 両方が必要な Solidity surface (Foundry で invariant、 Hardhat で coverage)
- React 外で fee 計算 / calldata 構築 / address format する TS / TSX helper
- frontend が叩いて contract に橋渡しする HTTP / RPC adapter

具体例 — `mint-nft` で fee 計算 hook + `/api/mint` endpoint、 `defi-swap` で slippage 計算 + `/api/quote`、 `nextjs-token-gating` で metadata fetcher + `/api/access`。

## 5 layer を整合させる仕組み

Layer 1 spec は依然として単一 SSOT。 `/kiwa-design --layer all` (or 各 `--layer contract` / `--layer e2e` / `--layer unit` / `--layer integration` を順に) で `tests/spec/{layer}/test-spec-{module}.md` 配下に spec を書き、 各 Layer 2 skill がそれを読む。

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

## 既存 example に 5 layer 目を追加するには

3 layer 並立済の example (mint-nft / defi-swap / nextjs-token-gating) を起点に、 不足する unit + integration layer を以下順で追加。

1. `/kiwa-design --layer unit --module <name> --input src/lib/<helper>.ts`
2. `/kiwa-vitest --module <name>` → `test/unit/<name>.test.ts`
3. `/kiwa-design --layer integration --module <name> --input app/api/<route>/route.ts`
4. `/kiwa-api --module <name> --backend msw` (or Express-style なら `supertest`)

両 Layer 2 skill が coverage target に収束したら、 機能は 5 つの独立した regression net を持ち、 それぞれ別 failure mode を捕捉する。

- Foundry — fuzz 下の Solidity invariant
- Hardhat — `solidity-coverage` での Solidity coverage gap
- Vitest — TS helper / TSX hook の regression
- msw / supertest — HTTP 境界 bug (validation / status / idempotency)
- Playwright — end-to-end UX path

## 関連

- [`three-layer-stack.ja.md`](./three-layer-stack.md) — contract 中心 3 layer 並立
- [`tests/docs/skill-chain-tutorial.ja.md`](../../../tests/docs/skill-chain-tutorial.ja.md) — skill chain full flow
- [`.claude/skills/kiwa-vitest/SKILL.md`](../../../.claude/skills/kiwa-vitest/SKILL.md) — unit layer skill 仕様
- [`.claude/skills/kiwa-api/SKILL.md`](../../../.claude/skills/kiwa-api/SKILL.md) — integration layer skill 仕様
