//! Fidelity harness — mock ↔ real trace diff.
//!
//! Both adapters run through the same 6-op sequence. The real adapter is
//! `RethBinary::detect`-driven so the harness passes on any host: when reth
//! is on PATH the scenario ops record `ok`; when it is not, they record
//! `RETH_ENV_MISSING` and the harness surfaces the divergence.

use dogfood_reth_node_test::{
    build_fidelity_report, MockRethAdapter, RealRethAdapter, RethScenarioAdapter, OPS_UNDER_TEST,
};

fn drive(adapter: &mut dyn RethScenarioAdapter) {
    adapter.erc20_transfer();
    adapter.reorg_3block();
    adapter.event_history();
    adapter.describe_signer();
    adapter.describe_provider(8545);
    adapter.detect_reth();
}

#[test]
fn t_drn_fid_001_mock_covers_all_ops_under_test() {
    let mut mock = MockRethAdapter::new();
    let mut real = RealRethAdapter::new();
    drive(&mut mock);
    drive(&mut real);
    let report = build_fidelity_report(
        "@kiwa-test/contract/reth-node-dogfood",
        "0.1.0",
        &mock.traces(),
        &real.traces(),
    );
    assert_eq!(report.mock_covered_ops, OPS_UNDER_TEST.len());
    assert!(report.behavioral_divergences <= OPS_UNDER_TEST.len());
}

#[test]
fn t_drn_fid_002_divergence_arises_when_reth_is_absent() {
    let mut mock = MockRethAdapter::new();
    let mut real = RealRethAdapter::new();
    drive(&mut mock);
    drive(&mut real);
    let report = build_fidelity_report(
        "@kiwa-test/contract/reth-node-dogfood",
        "0.1.0",
        &mock.traces(),
        &real.traces(),
    );
    // On a host without reth on PATH, the three scenario ops emit
    // RETH_ENV_MISSING and the harness records a BEHAVIORAL_DIVERGENCE.
    if !kiwa::contract::reth::RethBinary::detect().available {
        let scenario_divs: Vec<_> = report
            .divergences
            .iter()
            .filter(|d| {
                d.op == "erc20_transfer" || d.op == "reorg_3block" || d.op == "event_history"
            })
            .collect();
        assert_eq!(scenario_divs.len(), 3);
        for d in scenario_divs {
            assert_eq!(d.reason, "BEHAVIORAL_DIVERGENCE");
            assert!(d.mock_ok);
            assert!(!d.real_ok);
        }
    }
}

#[test]
fn t_drn_fid_003_markdown_and_json_shapes_are_stable() {
    let mut mock = MockRethAdapter::new();
    let mut real = RealRethAdapter::new();
    drive(&mut mock);
    drive(&mut real);
    let report = build_fidelity_report(
        "@kiwa-test/contract/reth-node-dogfood",
        "0.1.0",
        &mock.traces(),
        &real.traces(),
    );
    let md = report.to_markdown();
    let json = report.to_json();
    assert!(md.contains("Quality Report"));
    assert!(md.contains("Fidelity matrix"));
    assert!(json.contains("\"provider\""));
    assert!(json.contains("\"behavioralDivergences\""));
    assert!(json.contains("\"fidelityMatrix\""));
    // The matrix pulls from kiwa::contract::reth::fidelity_matrix() so the
    // rendered report exposes the 7 JSON-RPC methods without hard-coding.
    assert!(json.contains("eth_blockNumber"));
    assert!(json.contains("eth_chainId"));
    assert!(json.contains("web3_clientVersion"));
}

#[test]
fn t_drn_fid_004_report_covers_the_full_seven_method_matrix() {
    let mut mock = MockRethAdapter::new();
    let mut real = RealRethAdapter::new();
    drive(&mut mock);
    drive(&mut real);
    let report = build_fidelity_report(
        "@kiwa-test/contract/reth-node-dogfood",
        "0.1.0",
        &mock.traces(),
        &real.traces(),
    );
    assert_eq!(report.fidelity_matrix.len(), 7);
    let methods: std::collections::HashSet<_> = report
        .fidelity_matrix
        .iter()
        .map(|c| c.method.as_str())
        .collect();
    for m in [
        "eth_blockNumber",
        "eth_chainId",
        "eth_getBalance",
        "eth_gasPrice",
        "eth_call",
        "net_version",
        "web3_clientVersion",
    ] {
        assert!(methods.contains(m), "matrix missing method {m}");
    }
}

#[test]
fn t_drn_fid_005_agreement_flags_are_not_all_true() {
    // Sanity check — the matrix intentionally documents divergences (gas
    // pricing / net_version / client version) so if a refactor accidentally
    // flips every case to `agreement=true` the test surfaces it.
    let mut mock = MockRethAdapter::new();
    let mut real = RealRethAdapter::new();
    drive(&mut mock);
    drive(&mut real);
    let report = build_fidelity_report(
        "@kiwa-test/contract/reth-node-dogfood",
        "0.1.0",
        &mock.traces(),
        &real.traces(),
    );
    let agree_count = report
        .fidelity_matrix
        .iter()
        .filter(|c| c.expected_agreement)
        .count();
    let diverge_count = report
        .fidelity_matrix
        .iter()
        .filter(|c| !c.expected_agreement)
        .count();
    assert!(agree_count > 0);
    assert!(diverge_count > 0);
    assert_eq!(agree_count + diverge_count, report.fidelity_matrix.len());
}
