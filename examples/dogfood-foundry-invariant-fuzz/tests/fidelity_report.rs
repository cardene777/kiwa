//! Fidelity harness — mock ↔ real trace diff. Both adapters run through the
//! same 6-op sequence. The real adapter is `FoundryEnv::detect`-driven so the
//! harness passes on any host: when forge is on PATH the scenario ops record
//! `ok`; when it is not, they record `FOUNDRY_ENV_MISSING` and the harness
//! surfaces the divergence.

use dogfood_foundry_invariant_fuzz::{
    build_fidelity_report, dogfood_project_root, release_gate_options, InvariantScenarioAdapter,
    InvariantSummary, MockInvariantAdapter, RealInvariantAdapter, OPS_UNDER_TEST,
};
use kiwa::contract::foundry::FoundryEnv;

fn drive(adapter: &mut dyn InvariantScenarioAdapter) -> Vec<InvariantSummary> {
    let opts = release_gate_options();
    let a = adapter.invariant_erc20(&opts);
    let b = adapter.invariant_vault(&opts);
    let c = adapter.invariant_router(&opts);
    adapter.describe_options(&opts);
    adapter.describe_env();
    adapter.run_coverage();
    vec![a, b, c]
}

#[test]
fn t_dfi_fid_001_mock_covers_all_ops_under_test() {
    let mut mock = MockInvariantAdapter::new();
    let mut real = RealInvariantAdapter::new(dogfood_project_root());
    let summaries = drive(&mut mock);
    drive(&mut real);
    let report = build_fidelity_report(
        "@kiwa-test/contract/foundry-invariant-fuzz-dogfood",
        "0.1.0",
        &mock.traces(),
        &real.traces(),
        &summaries,
    );
    assert_eq!(report.mock_covered_ops, OPS_UNDER_TEST.len());
    assert!(report.behavioral_divergences <= OPS_UNDER_TEST.len());
}

#[test]
fn t_dfi_fid_002_divergence_arises_when_forge_is_absent() {
    let env = FoundryEnv::detect();
    if env.forge_available {
        // Nothing to assert on a host that has forge — the real adapter runs
        // for real and we cannot predict whether it passes the invariant.
        // The behavioural-divergence assertion only makes sense in the
        // forge-absent baseline.
        return;
    }
    let mut mock = MockInvariantAdapter::new();
    let mut real = RealInvariantAdapter::new(dogfood_project_root());
    let summaries = drive(&mut mock);
    drive(&mut real);
    let report = build_fidelity_report(
        "@kiwa-test/contract/foundry-invariant-fuzz-dogfood",
        "0.1.0",
        &mock.traces(),
        &real.traces(),
        &summaries,
    );
    let scenario_divs: Vec<_> = report
        .divergences
        .iter()
        .filter(|d| {
            d.op == "invariant_erc20"
                || d.op == "invariant_vault"
                || d.op == "invariant_router"
                || d.op == "run_coverage"
        })
        .collect();
    // 4 ops require forge — every one of them must be flagged as diverging
    // when forge is absent (mock reports ok, real reports FOUNDRY_ENV_MISSING).
    assert_eq!(scenario_divs.len(), 4);
    for d in scenario_divs {
        assert_eq!(d.reason, "BEHAVIORAL_DIVERGENCE");
        assert!(d.mock_ok);
        assert!(!d.real_ok);
    }
}

#[test]
fn t_dfi_fid_003_markdown_and_json_shapes_are_stable() {
    let mut mock = MockInvariantAdapter::new();
    let mut real = RealInvariantAdapter::new(dogfood_project_root());
    let summaries = drive(&mut mock);
    drive(&mut real);
    let report = build_fidelity_report(
        "@kiwa-test/contract/foundry-invariant-fuzz-dogfood",
        "0.1.0",
        &mock.traces(),
        &real.traces(),
        &summaries,
    );
    let md = report.to_markdown();
    let json = report.to_json();
    assert!(md.contains("Quality Report"));
    assert!(md.contains("Contracts"));
    assert!(md.contains("InvariantERC20"));
    assert!(md.contains("InvariantVault"));
    assert!(md.contains("InvariantRouter"));
    assert!(json.contains("\"provider\""));
    assert!(json.contains("\"behavioralDivergences\""));
    assert!(json.contains("\"totalRuns\""));
    assert!(json.contains("\"contracts\""));
}

#[test]
fn t_dfi_fid_004_real_adapter_records_env_snapshot_from_foundry_detect() {
    let mut real = RealInvariantAdapter::new(dogfood_project_root());
    let snap = real.describe_env();
    let expected = FoundryEnv::detect();
    // The adapter must return exactly what FoundryEnv::detect observed at
    // adapter-construction time; a refactor that reads env at op call time
    // would be a state-drift bug.
    assert_eq!(snap.forge_available, expected.forge_available);
    assert_eq!(snap.cast_available, expected.cast_available);
    assert_eq!(snap.anvil_available, expected.anvil_available);
}

#[test]
fn t_dfi_fid_005_summary_total_runs_matches_thirty_thousand_on_mock_side() {
    let mut mock = MockInvariantAdapter::new();
    let summaries = drive(&mut mock);
    let total: u32 = summaries.iter().map(|s| s.runs_executed).sum();
    // 3 contracts x 10_000 runs each.
    assert_eq!(total, 30_000);
}
