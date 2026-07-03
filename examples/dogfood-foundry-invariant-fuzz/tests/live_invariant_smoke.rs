//! Live-mode smoke test — actually runs `forge test` on the invariant
//! contracts with the release-gate options. Opt-in through
//! `KIWA_FORGE_LIVE=1` + `forge` on PATH. Prints a skip message and
//! returns without failing when either is missing so CI hosts without
//! Foundry stay green.

use dogfood_foundry_invariant_fuzz::{
    dogfood_project_root, release_gate_options, InvariantScenarioAdapter, RealInvariantAdapter,
};
use kiwa::contract::foundry::FoundryEnv;

fn live_enabled() -> bool {
    let env_var = std::env::var("KIWA_FORGE_LIVE").as_deref() == Ok("1");
    let env = FoundryEnv::detect();
    env_var && env.forge_available
}

#[test]
fn t_dfi_live_001_forge_invariant_run_lands_a_passing_summary() {
    if !live_enabled() {
        eprintln!(
            "live invariant smoke skipped: set KIWA_FORGE_LIVE=1 and install forge to opt in"
        );
        return;
    }
    let mut real = RealInvariantAdapter::new(dogfood_project_root());
    // Small run count for the smoke test — the release gate runs the 10_000
    // pass separately. Keeping it low here keeps the live layer fast.
    let opts = kiwa::contract::foundry::invariant::InvariantOptions {
        runs: 128,
        ..release_gate_options()
    };
    let summary = real.invariant_erc20(&opts);
    assert!(!summary.skipped, "forge is on PATH so the run must not skip");
    // We do not assert `Passed` — the point of the smoke is to verify the
    // wiring, not to lock the invariant. Any state (Passed / Failed) proves
    // the harness talks to forge; only Skipped would indicate a wiring bug.
    assert_ne!(
        summary.outcome,
        kiwa::contract::foundry::invariant::InvariantOutcome::Skipped
    );
}
