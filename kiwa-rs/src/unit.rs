//! Unit test fixture (`setup_env`) for kiwa-test-rs.
//!
//! Mirrors `@kiwa-test/core` `setup_env(opts)` contract. The returned
//! [`KiwaEnv`] owns its lifecycle and runs `stop()` automatically when it
//! goes out of scope via [`Drop`], so tests cannot forget cleanup.

use std::cell::Cell;
use std::sync::atomic::{AtomicUsize, Ordering};

/// Test execution mode passed to [`setup_env`].
///
/// `Mock` builds a fully deterministic in-process fixture (no network, no
/// filesystem). `Live` opts into real-resource setup; adapters layered on top
/// (e.g. reqwest / hyper integration helpers) interpret the flag.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum Mode {
    /// Deterministic in-process fixture (default).
    #[default]
    Mock,
    /// Real-resource fixture (network / filesystem).
    Live,
}

/// Options passed to [`setup_env`].
#[derive(Clone, Debug, Default)]
pub struct SetupOpts {
    /// Test mode — defaults to [`Mode::Mock`].
    pub mode: Mode,
    /// Optional deterministic seed forwarded to downstream adapters.
    pub seed: Option<u64>,
    /// Optional fixture label, surfaced in assertion failure messages so
    /// multi-fixture tests can disambiguate which env raised the failure.
    pub label: Option<String>,
}

/// Test fixture handle returned by [`setup_env`].
///
/// `KiwaEnv` is intentionally `!Send` (interior `Cell`) — fixtures are
/// scoped to the test thread that created them. Cleanup runs in [`Drop`] so
/// tests cannot leak state across cases.
#[derive(Debug)]
pub struct KiwaEnv {
    id: usize,
    mode: Mode,
    seed: Option<u64>,
    label: Option<String>,
    stopped: Cell<bool>,
}

// Monotonic id generator so multiple concurrent fixtures stay distinguishable
// in log output.
static NEXT_ID: AtomicUsize = AtomicUsize::new(1);

impl KiwaEnv {
    /// Fixture id (monotonic per-process).
    pub fn id(&self) -> usize {
        self.id
    }

    /// Configured mode.
    pub fn mode(&self) -> Mode {
        self.mode
    }

    /// Configured deterministic seed.
    pub fn seed(&self) -> Option<u64> {
        self.seed
    }

    /// Configured fixture label.
    pub fn label(&self) -> Option<&str> {
        self.label.as_deref()
    }

    /// Returns `true` once [`KiwaEnv::stop`] has run (or the fixture has been
    /// dropped).
    pub fn is_stopped(&self) -> bool {
        self.stopped.get()
    }

    /// Stop the fixture explicitly. Idempotent — re-invocations are no-ops so
    /// `Drop` can safely call it after a manual `stop()`.
    pub fn stop(&self) {
        if !self.stopped.get() {
            self.stopped.set(true);
        }
    }
}

impl Drop for KiwaEnv {
    fn drop(&mut self) {
        // Drop guarantees `stop` runs exactly once even if the test forgot.
        if !self.stopped.get() {
            self.stopped.set(true);
        }
    }
}

/// Build a kiwa unit test fixture.
///
/// Mirrors `@kiwa-test/core` `setupEnv` contract. The returned [`KiwaEnv`]
/// owns its lifecycle; drop it (or call [`KiwaEnv::stop`]) to release
/// resources.
///
/// # Examples
///
/// ```
/// use kiwa::unit::{setup_env, SetupOpts, Mode};
///
/// let env = setup_env(SetupOpts { mode: Mode::Mock, seed: Some(1), ..Default::default() });
/// assert_eq!(env.mode(), Mode::Mock);
/// ```
pub fn setup_env(opts: SetupOpts) -> KiwaEnv {
    KiwaEnv {
        id: NEXT_ID.fetch_add(1, Ordering::Relaxed),
        mode: opts.mode,
        seed: opts.seed,
        label: opts.label,
        stopped: Cell::new(false),
    }
}
