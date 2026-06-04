# FAQ

## Q1: Why dapp-e2e over Synpress or MetaMask Test Dapp?

A: Existing tools mostly drive the MetaMask extension. Reproducing wallet popup UI in CI tends to be flaky.
dapp-e2e keeps wallet behavior **inside code**, skipping popup / approve UIs, and prioritizes CI stability.
See [docs/COMPARISON.md](../COMPARISON.md).

## Q2: anvil does not start (`anvil not found in PATH`)

A: Install Foundry and make sure it is on PATH.

~~~bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
~~~

## Q3: Port 8545 is already used

A: Another anvil instance is likely already running. Kill it or pass another port via `startAnvil({ port: 8546 })`.

~~~bash
lsof -iTCP:8545 -sTCP:LISTEN
kill <PID>
~~~

## Q4: Tests fail with stake-balance: (loading)

A: Your `.env.local` contract addresses may not have been baked in during build.
Next.js inlines `.env.local` at build time, so addresses written by global-setup are not reflected until the next build.
Either write `.env.local` via `pretest` or clear the build cache (`rm -rf .next`).

## Q5: Multiple examples collide on ports

A: Use unique ports per example (3033-3047). See each example's `package.json` `scripts.dev` / `start`.
Anvil shares port 8545 by default, so parallel runs across examples are not supported.

## Q6: I want to use ConnectKit / Reown instead of wagmi v2 + RainbowKit v2

A: dapp-e2e conforms to EIP-1193 / EIP-6963 standards, so it works with any wallet picker.
For specific picker testing, see `examples/basic-connect/tests/eip6963.spec.ts`.

## Q7: Contract deploys are slow

A: Anvil's deterministic deploys (fixed deployer + sequential nonce) yield the same addresses every run.
Commit the deploy artifacts (`forge-out/`) to skip `forge build` and speed things up.

## Q8: How do I test time-dependent code?

A: Use anvil RPCs `evm_snapshot` / `evm_revert` / `evm_increaseTime`.
See [Cookbook: Time manipulation](./cookbook/time-manipulation.md).

## Q9: My tests fail randomly (flaky)

A: Check in order:
1. A previous anvil instance may still be running (`lsof -iTCP:8545`)
2. `.env.local` may hold stale contract addresses
3. Polling-based assertions can often be deterministically replaced via `waitForChainState`

## Q10: Officially supported scope

A: dapp-e2e supports headless Chromium + standard wallet APIs only.
Browser-extension UI driving (MetaMask, etc.), Firefox / Safari, and mobile WebViews are out of scope.

## Related

- [GitHub Issues](https://github.com/cardene777/dapp-e2e/issues)
- [Concepts](./concepts/README.md)
- [Cookbook](./cookbook/README.md)
