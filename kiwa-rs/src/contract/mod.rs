//! Contract-testing adapters for the kiwa polyglot test framework.
//!
//! The `contract` module hosts helpers that drive smart-contract tooling from
//! Rust. Currently exposed:
//!
//! - [`foundry`] — Foundry (forge / cast / anvil) integration. Runs
//!   `forge test --coverage` from a subprocess, parses coverage JSON, emits
//!   lcov, wraps `cast call` / `cast send` / `cast rpc`, and spawns a
//!   deterministic anvil node with automatic tear-down.
//!
//! Contract adapters are gated behind Cargo features so users that do not
//! need them do not pay for the extra dependency surface.

#[cfg(feature = "contract-foundry")]
pub mod foundry;

#[cfg(feature = "contract-alloy")]
pub mod alloy;
