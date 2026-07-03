//! Mock-mode invariant tests — deterministic, forge-free. Exercises the
//! adapter surface + the shrink-parser path so the unit layer stays useful
//! even when `forge` is not on PATH.

use dogfood_foundry_invariant_fuzz::{
    build_fidelity_report, parse_synthetic_shrink, release_gate_options, synthetic_shrink_stdout,
    InvariantScenarioAdapter, MockInvariantAdapter, INVARIANT_CONTRACTS, OPS_UNDER_TEST,
};
use kiwa::contract::foundry::invariant::{parse_invariant_shrink, InvariantOutcome};

fn drive_mock() -> MockInvariantAdapter {
    let opts = release_gate_options();
    let mut adapter = MockInvariantAdapter::new();
    adapter.invariant_erc20(&opts);
    adapter.invariant_vault(&opts);
    adapter.invariant_router(&opts);
    adapter.describe_options(&opts);
    adapter.describe_env();
    adapter.run_coverage();
    adapter
}

#[test]
fn t_dfi_m_001_mock_invariant_erc20_reports_ten_thousand_runs_and_pinned_seed() {
    let opts = release_gate_options();
    let mut adapter = MockInvariantAdapter::new();
    let summary = adapter.invariant_erc20(&opts);
    assert_eq!(summary.contract, "InvariantERC20");
    assert_eq!(summary.outcome, InvariantOutcome::Passed);
    assert_eq!(summary.runs_executed, 10_000);
    assert_eq!(summary.seed, Some(0xdead_beef_cafe_babe));
    assert!(!summary.skipped);
    assert!(summary.shrink.is_none());
}

#[test]
fn t_dfi_m_002_mock_invariant_vault_and_router_share_the_same_shape() {
    let opts = release_gate_options();
    let mut adapter = MockInvariantAdapter::new();
    let vault = adapter.invariant_vault(&opts);
    let router = adapter.invariant_router(&opts);
    assert_eq!(vault.contract, "InvariantVault");
    assert_eq!(router.contract, "InvariantRouter");
    assert_eq!(vault.runs_executed, router.runs_executed);
    assert_eq!(vault.seed, router.seed);
}

#[test]
fn t_dfi_m_003_mock_describe_options_reflects_pinned_seed() {
    let opts = release_gate_options();
    let mut adapter = MockInvariantAdapter::new();
    let snap = adapter.describe_options(&opts);
    assert_eq!(snap.runs, 10_000);
    assert!(snap.seed_pinned);
    assert_eq!(snap.seed_hex.as_deref(), Some("0xdeadbeefcafebabe"));
}

#[test]
fn t_dfi_m_004_mock_describe_env_reports_forge_absent_by_design() {
    let mut adapter = MockInvariantAdapter::new();
    let snap = adapter.describe_env();
    assert!(!snap.forge_available);
    assert!(!snap.cast_available);
    assert!(!snap.anvil_available);
    assert!(!snap.all_available);
}

#[test]
fn t_dfi_m_005_mock_run_coverage_returns_release_gate_floor() {
    let mut adapter = MockInvariantAdapter::new();
    let cov = adapter.run_coverage();
    assert!(!cov.skipped);
    assert_eq!(cov.line_pct, Some(90.0));
    assert_eq!(cov.branch_pct, Some(82.0));
    assert_eq!(cov.function_pct, Some(95.0));
}

#[test]
fn t_dfi_m_006_mock_trace_records_every_op_under_test() {
    let adapter = drive_mock();
    let ops: std::collections::HashSet<_> = adapter
        .traces()
        .iter()
        .map(|t| t.op.as_str().to_string())
        .collect();
    for op in OPS_UNDER_TEST {
        assert!(ops.contains(*op), "trace missing op {op}");
    }
}

#[test]
fn t_dfi_m_007_synthetic_shrink_stdout_parses_into_shrink_result() {
    let shrink = parse_synthetic_shrink().expect("synthetic stdout should parse");
    assert_eq!(shrink.test_name, "invariant_totalSupplyEqSumOfBalances");
    assert!(shrink.reason.contains("sum(balances)"));
    // Two sequence lines were emitted so the shrunk sequence has two steps.
    assert_eq!(shrink.sequence.len(), 2);
    assert_eq!(shrink.sequence[0].signature, "mint(uint256,uint256)");
    assert_eq!(shrink.sequence[1].signature, "transfer(uint256,uint256,uint256)");
}

#[test]
fn t_dfi_m_008_parse_invariant_shrink_matches_our_helper() {
    // Direct kiwa-level parser call vs. our helper — both must return the
    // same fields so a downstream refactor cannot break the harness silently.
    let direct = parse_invariant_shrink(synthetic_shrink_stdout())
        .expect("kiwa parser accepts the stdout blob");
    let helper = parse_synthetic_shrink().expect("helper accepts the stdout blob");
    assert_eq!(direct, helper);
}

#[test]
fn t_dfi_m_009_release_gate_options_pin_seed_and_ten_thousand_runs() {
    let opts = release_gate_options();
    assert_eq!(opts.runs, 10_000);
    assert_eq!(opts.seed, Some(0xdead_beef_cafe_babe));
    assert!(opts.match_contract.is_none());
    assert!(opts.match_test.is_none());
    assert!(opts.extra_forge_args.is_empty());
}

#[test]
fn t_dfi_m_010_mock_reset_clears_the_trace() {
    let mut adapter = drive_mock();
    assert!(!adapter.traces().is_empty());
    adapter.reset();
    assert!(adapter.traces().is_empty());
}

#[test]
fn t_dfi_m_011_three_invariant_contract_names_are_stable() {
    // Sanity check — the sub-Issue AC names ERC-20 / Vault / Router as the
    // three contracts under invariant test. Guard against accidental rename.
    assert_eq!(INVARIANT_CONTRACTS.len(), 3);
    assert!(INVARIANT_CONTRACTS.contains(&"InvariantERC20"));
    assert!(INVARIANT_CONTRACTS.contains(&"InvariantVault"));
    assert!(INVARIANT_CONTRACTS.contains(&"InvariantRouter"));
}

#[test]
fn t_dfi_m_012_fidelity_report_shape_covers_all_ops_on_the_mock_side() {
    let opts = release_gate_options();
    let mut mock = MockInvariantAdapter::new();
    let summaries = vec![
        mock.invariant_erc20(&opts),
        mock.invariant_vault(&opts),
        mock.invariant_router(&opts),
    ];
    mock.describe_options(&opts);
    mock.describe_env();
    mock.run_coverage();
    let mock_traces = mock.traces();
    let report = build_fidelity_report(
        "@kiwa-test/contract/foundry-invariant-fuzz-dogfood",
        "0.1.0",
        &mock_traces,
        &[],
        &summaries,
    );
    assert_eq!(report.mock_covered_ops, OPS_UNDER_TEST.len());
    assert_eq!(report.ops_under_test, OPS_UNDER_TEST.len());
    assert_eq!(report.contracts.len(), 3);
    // 3 contracts x 10_000 runs.
    assert_eq!(report.total_runs, 30_000);
}
