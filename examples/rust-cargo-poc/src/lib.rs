//! Toy domain code used by the kiwa-test-rs PoC tests.
//!
//! Kept intentionally minimal — the value is in the tests under
//! `tests/poc.rs` that show how `kiwa::unit::setup_env` + the assertion
//! macros are wired into a real cargo crate.

/// Add two integers. (placeholder domain logic)
pub fn add(a: i64, b: i64) -> i64 {
    a + b
}

/// Mean of a slice of `f64`. Returns `0.0` for an empty slice so callers do
/// not need to guard. (placeholder domain logic — the focus is on showing
/// `assert_kiwa_close!` against this output.)
pub fn mean(values: &[f64]) -> f64 {
    if values.is_empty() {
        return 0.0;
    }
    let sum: f64 = values.iter().sum();
    sum / values.len() as f64
}
