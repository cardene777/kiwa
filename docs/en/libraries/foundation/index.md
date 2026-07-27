---
title: Foundation & test execution
description: Choose one of kiwa's five foundation packages from the boundary under test.
---

# Foundation & test execution

This category is the entry point for running kiwa tests. Choose the library closest to the boundary under test, then combine it with `@kiwa-lab/core` when you need a shared specification or test environment.

> [日本語](/libraries/foundation/)

## Choose a library

| Library | Choose it when | Read first |
| --- | --- | --- |
| [@kiwa-lab/core](./core/) | You parse specification Markdown or implement a shared pool/lifecycle | [Quickstart](./core/quickstart) |
| [@kiwa-lab/dapp](./dapp/) | You need wallet connection, signing, transactions, or Anvil browser E2E | [Quickstart](./dapp/quickstart) |
| [@kiwa-lab/api](./api/) | You test Node or Fetch HTTP handlers with mock or live modes | [Quickstart](./api/quickstart) |
| [@kiwa-lab/ui](./ui/) | You test component rendering, interaction, or snapshots in React or another UI framework | [Quickstart](./ui/quickstart) |
| [@kiwa-lab/e2e](./e2e/) | You test any Web application in a real browser | [Quickstart](./e2e/quickstart) |

## Shared principles

- **Clean up every test.** Register `stop()` or the package cleanup in `afterEach` or `afterAll`.
- **Separate mock and real environments.** Start with deterministic mocks, and use live mode only for the smallest cases that verify connectivity.
- **Start at one boundary.** Do not grow browser E2E unnecessarily; keep HTTP and component responsibilities in their matching adapters.
