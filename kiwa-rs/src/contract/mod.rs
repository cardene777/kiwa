//! Contract-testing adapters for the kiwa polyglot test framework.
//!
//! The `contract` module hosts helpers that drive smart-contract tooling from
//! Rust. Currently exposed:
//!
//! - [`foundry`] — Foundry (forge / cast / anvil) integration. Runs
//!   `forge test --coverage` from a subprocess, parses coverage JSON, emits
//!   lcov, wraps `cast call` / `cast send` / `cast rpc`, and spawns a
//!   deterministic anvil node with automatic tear-down. v0.5 adds the
//!   [`foundry::invariant`] submodule with an invariant/fuzz runner (10 000
//!   default runs, deterministic seed, shrink-result parser) plus a
//!   `forge script` broadcast wrapper.
//! - [`alloy`] — alloy-shaped Solidity ABI parser + signer / provider
//!   descriptors + call encoder. v0.5 adds the [`alloy::helpers`] submodule
//!   with an EIP-712 typed-data builder, Multicall3 batch encoder, and
//!   Permit2 `PermitWitnessTransferFrom` encoder.
//! - [`reth`] — Reth (Rust Ethereum Execution client) integration. Spawns
//!   `reth node --dev` in a background process, exposes the in-process
//!   JSON-RPC endpoint through [`reth::RethNode`], drives N-block reorgs
//!   through [`reth::reth_reorg`], and enumerates the anvil-vs-reth fidelity
//!   comparison surface through [`reth::FidelityCase`].
//!
//! Contract adapters are gated behind Cargo features so users that do not
//! need them do not pay for the extra dependency surface.

#[cfg(feature = "contract-foundry")]
pub mod foundry;

#[cfg(feature = "contract-alloy")]
pub mod alloy;

#[cfg(feature = "contract-reth")]
pub mod reth;
