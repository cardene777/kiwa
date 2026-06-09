# Tool comparison

> [🇬🇧 English](./COMPARISON.md) • [🇯🇵 日本語](./COMPARISON.ja.md)

This document is intended for users who want to compare kiwa with existing wallet E2E companion tools.
The contents are organized based on kiwa's capabilities as of v0.1.0, that is, as of 2026-06,
and the roles described in each official repository / docs.
The conclusion first: kiwa is positioned for stable headless E2E operation using anvil.

## Comparison table

| Aspect | Synpress | wallet-mock | kiwa |
|---|---|---|---|
| Primary target | E2E including real wallet integration | Headless wallet injection | dApp E2E assuming a local chain |
| Browser side | Playwright / Cypress + wallet extension integration | Inject a mock wallet into Playwright | Inject `window.ethereum` into Playwright |
| chain backend | Any backend paired with a real wallet | Mock responses or arbitrary transport | Start anvil per test |
| Signing / transfers | Via the wallet UI | Via mock or transport | Handled directly with anvil dev accounts |
| CI stability | Medium | High | High |
| Best fit | Verifying wallet UX | Verifying provider replacement | Verifying connection flows on a local chain |

This is not a case where one tool is always superior.
They target different things.
In practice, it is best to choose based on whether your focus is wallet UI, provider mocking, or a local chain.

## Positioning of kiwa

kiwa prioritizes the following three points.

- The ability to start anvil directly per test
- The ability to run headlessly without bringing in a browser extension
- The ability to reuse the minimum EIP-1193 core as a fixture

In exchange, it does not cover checking wallet popup copy or reproducing extension UI interactions.
This is also why the top of the README says to separate real MetaMask UI verification into another tool.

## Selection guide

### When to choose Synpress

- You want to cover connection, approval, and rejection flows through a real wallet UI
- You want to catch rendering issues on the browser extension side as well as in the dApp
- You want to keep using a Playwright- or Cypress-based setup with a wallet extension

Synpress is a strong option when you want to bring in integration with a real wallet implementation.
On the other hand, because it adds browser setup and extension dependencies,
it often becomes more than you need when the goal is just to run headless tests quickly.

### When to choose wallet-mock

- You want to inject a provider headlessly
- You want fine-grained control over mocked responses
- You care more about verifying dApp-side branches than about connecting to a real chain

wallet-mock is close in spirit in that it injects a wallet into Playwright,
but it assumes the consumer will build anvil lifecycle management and local-chain isolation themselves.
It is a good fit for tests where you want full freedom to swap transports.

### When to choose kiwa

- You want to run dApp E2E against a local chain backed by anvil that you set up yourself
- The minimal provider surface is enough, and you do not need wallet UI
- You want to call `window.ethereum` requests / events directly from the page
- You want startup, injection, and teardown to stay contained within Playwright fixtures alone

kiwa is the best fit for the use case of headlessly testing the dApp itself on a local chain.
If you want to bundle the flow from `eth_requestAccounts` through `eth_sendTransaction` into one fixture,
`examples/basic-connect` in this repository is the shortest path to get started.

## Rules of thumb

1. Choose Synpress if wallet UI fidelity matters
2. Choose wallet-mock if provider replacement and mock control are the main goal
3. Choose kiwa if you want both local-chain dApp behavior and CI stability

Using more than one is also realistic.
For example, using kiwa for everyday regression coverage and Synpress only for wallet UX checks before release is a perfectly reasonable split.
The more a team wants to test the wallet layer and the dApp layer separately, the more this split pays off.

## Cases where kiwa is not a good fit

- You want to verify the exact copy or placement of buttons in an extension popup
- You want to observe conflicts between multiple wallet extensions or differences between browser profiles
- You want to fully mock the provider and decouple it from chain connectivity

In this area, kiwa's design as a minimum provider centered on anvil becomes a constraint directly.
If reproducing wallet UI is the main goal, Synpress is a better fit.
If transport-swapping flexibility is the main goal, wallet-mock aligns better with the design intent.

## Things to confirm before choosing kiwa

- Whether you have an environment where anvil is available
- Whether you can structure tests around a local anvil chain
- Whether you can separate wallet extension UI checks into another layer
- Whether you want to manage `viem` and Playwright on the host project side

If these four points are acceptable, there is a good chance kiwa's design will fit well.

## Related

- [Synpress repository](https://github.com/Synthetixio/synpress)
- [wallet-mock repository](https://github.com/johanneskares/wallet-mock)
- [Foundry anvil docs](https://book.getfoundry.sh/anvil/)
- [RPC.md](./RPC.md)
- [README.md](../README.md)
