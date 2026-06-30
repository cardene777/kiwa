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
//! - assertion macros — exported at crate root.

#![deny(missing_docs)]
#![warn(rust_2018_idioms)]

pub mod unit;

#[cfg(feature = "integration")]
pub mod integration;

mod assertions;

/// Crate version (semver), kept in sync with `Cargo.toml`.
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

// Re-export commonly used items so test authors only need `use kiwa::*;` in
// simple cases.
pub use unit::{setup_env, KiwaEnv, Mode, SetupOpts};
