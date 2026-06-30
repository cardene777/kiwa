//! Diff-aware assertion macros for kiwa-test-rs.
//!
//! - [`assert_kiwa_eq!`] — equality assertion with structured diff output.
//! - [`assert_kiwa_close!`] — floating-point closeness assertion with absolute
//!   tolerance.
//!
//! Both macros panic on failure (standard cargo test semantics) and produce
//! deterministic, file-prefixed messages so failures are diff-friendly.

/// Equality assertion with diff-style failure message.
///
/// On failure panics with `kiwa assert_eq failed\n  left  = {left}\n  right = {right}\n  hint  = {hint}`.
///
/// # Examples
///
/// ```
/// use kiwa::assert_kiwa_eq;
///
/// assert_kiwa_eq!(2 + 2, 4);
/// assert_kiwa_eq!(vec![1, 2, 3], vec![1, 2, 3], "sequence");
/// ```
#[macro_export]
macro_rules! assert_kiwa_eq {
    ($left:expr, $right:expr $(,)?) => {{
        let left_val = &$left;
        let right_val = &$right;
        if !(left_val == right_val) {
            panic!(
                "kiwa assert_eq failed\n  left  = {:?}\n  right = {:?}",
                left_val, right_val
            );
        }
    }};
    ($left:expr, $right:expr, $hint:expr $(,)?) => {{
        let left_val = &$left;
        let right_val = &$right;
        if !(left_val == right_val) {
            panic!(
                "kiwa assert_eq failed\n  left  = {:?}\n  right = {:?}\n  hint  = {}",
                left_val, right_val, $hint
            );
        }
    }};
}

/// Floating-point closeness assertion with absolute tolerance.
///
/// On failure panics with the actual delta and the configured tolerance.
///
/// # Examples
///
/// ```
/// use kiwa::assert_kiwa_close;
///
/// assert_kiwa_close!(1.0_f64, 1.0_f64 + 1e-9, 1e-6);
/// ```
#[macro_export]
macro_rules! assert_kiwa_close {
    ($left:expr, $right:expr, $tol:expr $(,)?) => {{
        let left_val: f64 = ($left) as f64;
        let right_val: f64 = ($right) as f64;
        let tol: f64 = ($tol) as f64;
        let delta = (left_val - right_val).abs();
        if !(delta <= tol) {
            panic!(
                "kiwa assert_close failed\n  left  = {}\n  right = {}\n  delta = {}\n  tol   = {}",
                left_val, right_val, delta, tol
            );
        }
    }};
    ($left:expr, $right:expr, $tol:expr, $hint:expr $(,)?) => {{
        let left_val: f64 = ($left) as f64;
        let right_val: f64 = ($right) as f64;
        let tol: f64 = ($tol) as f64;
        let delta = (left_val - right_val).abs();
        if !(delta <= tol) {
            panic!(
                "kiwa assert_close failed\n  left  = {}\n  right = {}\n  delta = {}\n  tol   = {}\n  hint  = {}",
                left_val, right_val, delta, tol, $hint
            );
        }
    }};
}
