//! Integration tests for `assert_kiwa_eq!` / `assert_kiwa_close!`.

use kiwa::{assert_kiwa_close, assert_kiwa_eq};

#[test]
fn assert_kiwa_eq_passes_on_equal_values() {
    assert_kiwa_eq!(2 + 2, 4);
    assert_kiwa_eq!("foo", "foo");
    assert_kiwa_eq!(vec![1_i32, 2, 3], vec![1_i32, 2, 3]);
}

#[test]
#[should_panic(expected = "kiwa assert_eq failed")]
fn assert_kiwa_eq_panics_on_mismatch() {
    assert_kiwa_eq!(1_i32, 2_i32);
}

#[test]
#[should_panic(expected = "hint  = sequence diverged")]
fn assert_kiwa_eq_panic_message_includes_hint() {
    assert_kiwa_eq!(vec![1_i32], vec![1_i32, 2], "sequence diverged");
}

#[test]
fn assert_kiwa_close_passes_within_tolerance() {
    assert_kiwa_close!(1.0_f64, 1.0_f64 + 1e-9, 1e-6);
    assert_kiwa_close!(0.0_f64, 0.0_f64, 0.0_f64);
}

#[test]
#[should_panic(expected = "kiwa assert_close failed")]
fn assert_kiwa_close_panics_outside_tolerance() {
    assert_kiwa_close!(1.0_f64, 2.0_f64, 1e-6);
}

#[test]
#[should_panic(expected = "hint  = floating drift")]
fn assert_kiwa_close_panic_message_includes_hint() {
    assert_kiwa_close!(1.0_f64, 2.0_f64, 1e-6, "floating drift");
}
