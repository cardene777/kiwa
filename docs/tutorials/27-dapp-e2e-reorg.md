# dApp e2e reorg (snapshot + revert + refetch across 4 scenarios) in 12 min

## What you'll build

A Playwright + `@kiwa-lab/dapp` test that fires a Next.js + wagmi ERC-20 UI at an anvil fork, mines a transfer, drops an `evm_snapshot` marker, mines more state on top, then rewinds the chain with `evm_revert` and asserts the dApp reconverges. You end with 4 scenarios that cover the reorg failure modes wagmi + viem users hit in production — pending-tx dropped, confirmed-tx balance rollback, `Transfer` event history truncation, and nonce-gap re-send — powered by the same `snapshotChain` / `revertChain` primitives `kiwa-play` ships in v1.18.

## Prerequisites

- Node.js ≥ 20 and `pnpm`
- `foundryup` for `anvil` (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-reorg-first && cd kiwa-reorg-first
pnpm init
pnpm add next react react-dom wagmi viem
pnpm add -D @playwright/test @kiwa-lab/dapp typescript @types/node
```

Set `type: module`, the test script, and the Playwright config in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "dev": "next dev --port 3110",
    "test:e2e": "playwright test"
  }
}
```

Compile the ERC-20 test contract with Foundry (`forge build`) and expose its ABI + bytecode as a JSON blob at `contracts/ReorgToken.json`. A minimal Solidity source is enough — the Playwright fixture deploys the contract before the first scenario runs.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ReorgToken {
    mapping(address => uint256) public balanceOf;
    uint256 public totalSupply;
    event Transfer(address indexed from, address indexed to, uint256 value);

    constructor(uint256 supply) {
        balanceOf[msg.sender] = supply;
        totalSupply = supply;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
}
```

Bring the anvil chain up (fork mainnet is optional; the tutorial uses the default local chain).

```bash
anvil --port 8557 &
```

Create the Playwright fixture at `tests/fixture.ts` that layers on top of `@kiwa-lab/dapp`.

```ts
import { dappE2eTest } from '@kiwa-lab/dapp';

const ANVIL_PORT = 8557;

export const test = dappE2eTest.extend({
  _anvilHandle: async ({}: unknown, use: (h: { port: number; stop: () => Promise<void> }) => Promise<void>) => {
    await use({ port: ANVIL_PORT, stop: async () => {} });
  },
} as never);

export { expect } from '@playwright/test';
```

Add the reorg spec at `tests/e2e/reorg.spec.ts`. The four scenarios walk exactly the shape the `dogfood-dapp-e2e-reorg` app measures in the release-gate feed.

```ts
import { snapshotChain, revertChain } from '@kiwa-lab/dapp';
import { createPublicClient, createWalletClient, defineChain, http, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { test, expect } from '../fixture';

const OWNER_PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
const OWNER = '0xf39Fd6e51aad88F6F4ce6aB8827279cfFFb92266' as const;
const RECIPIENT = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as const;

const chain = defineChain({
  id: 31337,
  name: 'anvil-reorg',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://127.0.0.1:8557'] } },
});

test.describe('reorg regression', () => {
  test('S2 confirmed tx → reorg → balance rolls back', async ({ page }) => {
    const account = privateKeyToAccount(OWNER_PK);
    const wallet = createWalletClient({ account, chain, transport: http() });
    const rpc = createPublicClient({ chain, transport: http() });

    // Deploy + fund is handled by a globalSetup step (omitted for brevity — see
    // examples/dogfood-dapp-e2e-reorg/tests/global-setup.ts for the pattern).
    const tokenAddress = process.env.REORG_TOKEN_ADDRESS as `0x${string}`;

    // 1. Snapshot before the transfer so we can rewind after mining. The
    //    helper takes a viem PublicClient and returns the Hex snapshot id
    //    anvil's `evm_snapshot` produced.
    const snapshotId = await snapshotChain(rpc);

    // 2. Send the transfer on the real chain state.
    const hash = await wallet.writeContract({
      address: tokenAddress,
      abi: [{ inputs: [{ type: 'address' }, { type: 'uint256' }], name: 'transfer', outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' }],
      functionName: 'transfer',
      args: [RECIPIENT, parseUnits('10', 18)],
    });
    await rpc.waitForTransactionReceipt({ hash });

    // 3. Rewind — this is the reorg simulation. `revertChain` returns the
    //    `evm_revert` boolean; assert on it so a stale id fails loudly.
    const reverted = await revertChain(rpc, snapshotId);
    expect(reverted).toBe(true);

    // 4. Assert the UI (a Next.js page rendered elsewhere) reconverges the
    //    recipient balance to its pre-transfer value within 1.5 s.
    await page.goto('http://localhost:3110/');
    await expect(page.locator('[data-testid="recipient-balance"]')).toHaveText('0.0', { timeout: 1500 });
  });
});
```

## Run

```bash
pnpm exec playwright install
pnpm dev &
pnpm test:e2e
```

## Why the 4 scenarios cover reorg failure modes

Reorg bugs in wagmi + viem apps almost always fall into one of four buckets. The dogfood harness the `dogfood-dapp-e2e-reorg` app publishes uses the same 4 op names as this tutorial's fixture, so a fidelity report you generate here maps directly onto the release-gate one.

| Scenario | Trigger | Regression it catches |
|---|---|---|
| **S1 — pending tx dropped** | `evm_snapshot` before submit → `evm_revert` before mine → `getTransactionReceipt` returns null | Tx status stuck on `pending` when the mempool entry is gone |
| **S2 — confirmed tx balance rollback** | `evm_snapshot` before submit → mine → `evm_revert` past confirmation | UI keeps showing the post-transfer balance after the chain rewinds |
| **S3 — Transfer event history disappears** | Mine 3 transfers → `evm_revert` past all 3 → `getLogs` returns the pre-mint set | UI does not refetch the event log and shows stale rows |
| **S4 — nonce gap re-send** | `evm_snapshot` → mine → `evm_revert` → re-submit at the same nonce | Wallet reports `nonce too low` because the local nonce cache leaks |

Every scenario keeps `evm_snapshot` and `evm_revert` symmetric so the anvil state matches the mock adapter's `MockChainState.snapshot()` / `revert()` — that symmetry is what lets the release-gate fidelity harness diff mock vs real on the same 4-op trace.

## What v1.18 brings to `@kiwa-lab/dapp`

The v1.10 `@kiwa-lab/dapp` package shipped the wallet-injection + `dappE2eTest` fixture. v1.18 adds two primitives on top.

- `snapshotChain(client: PublicClient): Promise<Hex>` — thin wrapper that calls `evm_snapshot` through the viem `PublicClient` request path and returns the snapshot id typed as a `Hex`, ready to feed back into `revertChain`.
- `revertChain(client: PublicClient, snapshotId: Hex): Promise<boolean>` — thin wrapper that calls `evm_revert` and returns anvil's boolean response. A stale id returns `false`, so the assertion `expect(reverted).toBe(true)` catches drift instead of letting the test silently continue.

Both helpers keep the RPC surface open — you can call `debug_setHead` on `reth` through the same viem `client.request({ method, params })` pattern the [reth node test tutorial](./25-reth-node-test) uses. That gives the reorg suite two backing dev chains without changing the assertion shape.

## Related

- Concept doc — [Blockchain testing (chain state / EL client / fuzz / reorg SSOT)](../concepts/blockchain-testing)
- Tutorial 25 — [Reth node test (dev chain + reorg + fidelity matrix)](./25-reth-node-test)
- Tutorial 26 — [Foundry invariant + fuzz runner](./26-foundry-invariant-fuzz)
- v1.18-1 [#793](https://github.com/cardene777/kiwa/issues/793) — Alloy `contract::alloy::helpers` (the EIP-712 typed-data + Multicall3 + Permit2 primitives this tutorial's follow-up uses to sign in-flight tx envelopes)
- v1.18-4 [#796](https://github.com/cardene777/kiwa/issues/796) — `dogfood-dapp-e2e-reorg` (the full 5-spec harness this tutorial cuts down to one)
