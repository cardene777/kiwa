//! # kiwa-test-rs — Rust cargo test adapter for the kiwa test framework
//!
//! Port of [`@kiwa-test/core`](https://github.com/cardene777/kiwa/tree/main/packages/core)
//! to the Rust ecosystem. Provides a deterministic fixture (`setup_env`) with
//! mode selection (`Mock` / `Live`), automatic cleanup via [`Drop`], and
//! diff-aware assertion macros (`assert_kiwa_eq!` / `assert_kiwa_close!`).
//!
//! ## Quick start
//!
//! ```
//! use kiwa::unit::{setup_env, SetupOpts, Mode};
//!
//! let env = setup_env(SetupOpts { mode: Mode::Mock, seed: Some(42), ..Default::default() });
//! assert_eq!(env.mode(), Mode::Mock);
//! assert_eq!(env.seed(), Some(42));
//! // env goes out of scope -> Drop runs stop() automatically.
//! ```
//!
//! ## Modules
//!
//! - [`mod@unit`] — unit test fixture (`setup_env` + `KiwaEnv` + `Mode`).
//! - [`mod@integration`] — hyper-based mock server + request recorder for
//!   integration tests (`reqwest` / `hyper` client → kiwa mock endpoint).
//!   Gated behind the `integration` feature (enabled by default).
//! - [`mod@axum`] — axum `Router` test adapter (`test_app` + in-process
//!   `oneshot` invocation). Gated behind the `axum` feature (opt-in).
//! - [`mod@actix`] — actix-web `App` test adapter (`test_app` + in-process
//!   `call_service` invocation). Gated behind the `actix-web` feature (opt-in).
//! - [`mod@tower_http`] — tower-http middleware chain adapter
//!   (`test_chain(layers, router)` + `Layer<S>` stack drive). Gated behind
//!   the `tower-http` feature (opt-in), depends on the axum adapter.
//! - assertion macros — exported at crate root.

#![deny(missing_docs)]
#![warn(rust_2018_idioms)]

pub mod unit;

#[cfg(feature = "integration")]
pub mod integration;

#[cfg(feature = "axum")]
pub mod axum;

#[cfg(feature = "actix-web")]
pub mod actix;

#[cfg(feature = "tower-http")]
pub mod tower_http;

// Internal recorder helpers shared by the integration / axum / actix
// adapters. v1.6-5 (Issue #611) SSOT for the previously-inlined header
// case-folding + multi-value view construction. Gated behind the
// integration OR axum OR actix-web feature so a build with none of the
// three adapters does not pay for it.
#[cfg(any(feature = "integration", feature = "axum", feature = "actix-web"))]
mod recorder;

mod assertions;

/// Crate version (semver), kept in sync with `Cargo.toml`.
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

// Re-export commonly used items so test authors only need `use kiwa::*;` in
// simple cases.
pub use unit::{setup_env, KiwaEnv, Mode, SetupOpts};
