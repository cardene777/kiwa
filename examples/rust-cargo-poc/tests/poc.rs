//! PoC — `kiwa-test-rs` v0.1 usage in a real cargo crate.
//!
//! Each test exercises one corner of the public API:
//!
//! 1. `setup_env` + default mode (Mock).
//! 2. `setup_env` with explicit Live mode + seed + label.
//! 3. `assert_kiwa_eq!` against integer domain output.
//! 4. `assert_kiwa_close!` against floating-point domain output.

use kiwa::unit::{setup_env, Mode, SetupOpts};
use kiwa::{assert_kiwa_close, assert_kiwa_eq};
use rust_cargo_poc::{add, mean};

#[test]
fn setup_env_default_is_mock() {
    let env = setup_env(SetupOpts::default());
    assert_eq!(env.mode(), Mode::Mock);
    assert_eq!(env.seed(), None);
}

#[test]
fn setup_env_live_with_seed_and_label() {
    let env = setup_env(SetupOpts {
        mode: Mode::Live,
        seed: Some(123),
        label: Some("poc-live".into()),
    });
    assert_eq!(env.mode(), Mode::Live);
    assert_eq!(env.seed(), Some(123));
    assert_eq!(env.label(), Some("poc-live"));
}

#[test]
fn add_returns_expected_sum_via_assert_kiwa_eq() {
    let _env = setup_env(SetupOpts::default());
    assert_kiwa_eq!(add(2, 3), 5, "add(2,3) should be 5");
}

#[test]
fn mean_returns_value_within_tolerance_via_assert_kiwa_close() {
    let _env = setup_env(SetupOpts {
        mode: Mode::Mock,
        seed: Some(42),
        ..Default::default()
    });
    let avg = mean(&[1.0, 2.0, 3.0, 4.0]);
    assert_kiwa_close!(avg, 2.5_f64, 1e-9, "mean([1,2,3,4]) should be 2.5");
}
