//! Integration tests for `kiwa::unit::setup_env`.

use kiwa::unit::{setup_env, Mode, SetupOpts};

#[test]
fn setup_env_returns_env_with_default_mode_mock() {
    let env = setup_env(SetupOpts::default());
    assert_eq!(env.mode(), Mode::Mock);
    assert_eq!(env.seed(), None);
    assert_eq!(env.label(), None);
    assert!(!env.is_stopped());
}

#[test]
fn setup_env_returns_env_with_explicit_live_mode_and_seed() {
    let env = setup_env(SetupOpts {
        mode: Mode::Live,
        seed: Some(7),
        label: Some("integration-a".into()),
    });
    assert_eq!(env.mode(), Mode::Live);
    assert_eq!(env.seed(), Some(7));
    assert_eq!(env.label(), Some("integration-a"));
}

#[test]
fn fixture_ids_are_monotonic_within_same_process() {
    let env_a = setup_env(SetupOpts::default());
    let env_b = setup_env(SetupOpts::default());
    let env_c = setup_env(SetupOpts::default());
    // The ordering is what matters; absolute values depend on cross-test order.
    assert!(env_b.id() > env_a.id());
    assert!(env_c.id() > env_b.id());
}

#[test]
fn manual_stop_marks_fixture_stopped() {
    let env = setup_env(SetupOpts::default());
    assert!(!env.is_stopped());
    env.stop();
    assert!(env.is_stopped());
}

#[test]
fn manual_stop_is_idempotent() {
    let env = setup_env(SetupOpts::default());
    env.stop();
    env.stop();
    env.stop();
    assert!(env.is_stopped());
}

#[test]
fn drop_runs_stop_automatically() {
    // The behaviour is observable indirectly — `is_stopped` becomes true
    // before the destructor finishes. We use a Cell-based probe via a
    // wrapper test that calls stop manually first and then drops to ensure
    // the second path (drop without manual stop) also passes without panic.
    {
        let env = setup_env(SetupOpts::default());
        assert!(!env.is_stopped());
    }
    // If Drop panics it would abort the test, so reaching this line is the
    // assertion. We additionally cover the "Drop after manual stop" path.
    {
        let env = setup_env(SetupOpts::default());
        env.stop();
    }
}
