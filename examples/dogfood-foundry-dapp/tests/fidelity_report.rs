//! Fidelity harness — runs the mock + real adapters through a common
//! sequence of ops, then diffs the traces and asserts on the emitted
//! divergences. The real adapter is `FoundryEnv::detect`-driven so this
//! test suite passes whether or not Foundry CLI is installed on the host.

use dogfood_foundry_dapp::{
    build_fidelity_report, dogfood_project_root, synthetic_erc20_abi_json,
    DAppAdapter, MockAdapter, RealAdapter, OPS_UNDER_TEST,
};

fn drive(adapter: &mut dyn DAppAdapter) {
    adapter.run_forge_test(&dogfood_project_root());
    adapter.inspect_abi(synthetic_erc20_abi_json());
    adapter.encode_transfer_call("0xbeef", 12345);
    adapter.detect_foundry();
    adapter.describe_signer();
    adapter.describe_provider(8545);
}

#[test]
fn t_dff_fid_001_mock_covers_all_ops_under_test() {
    let mut mock = MockAdapter::new();
    let mut real = RealAdapter::new();
    drive(&mut mock);
    drive(&mut real);
    let report = build_fidelity_report(
        "@kiwa-test/contract/foundry-dogfood",
        "0.1.0",
        &mock.traces(),
        &real.traces(),
    );
    assert_eq!(report.mock_covered_ops, OPS_UNDER_TEST.len());
    assert!(report.behavioral_divergences <= OPS_UNDER_TEST.len());
}

#[test]
fn t_dff_fid_002_divergence_arises_when_real_forge_is_absent() {
    let mut mock = MockAdapter::new();
    let mut real = RealAdapter::new();
    drive(&mut mock);
    drive(&mut real);
    let report = build_fidelity_report(
        "@kiwa-test/contract/foundry-dogfood",
        "0.1.0",
        &mock.traces(),
        &real.traces(),
    );
    if !kiwa::contract::foundry::FoundryEnv::detect().forge_available {
        let has_run_forge_test = report
            .divergences
            .iter()
            .any(|d| d.op == "run_forge_test");
        assert!(has_run_forge_test);
    }
}

#[test]
fn t_dff_fid_003_markdown_and_json_shapes_are_stable() {
    let mut mock = MockAdapter::new();
    let mut real = RealAdapter::new();
    drive(&mut mock);
    drive(&mut real);
    let report = build_fidelity_report(
        "@kiwa-test/contract/foundry-dogfood",
        "0.1.0",
        &mock.traces(),
        &real.traces(),
    );
    let md = report.to_markdown();
    let json = report.to_json();
    assert!(md.contains("Quality Report"));
    assert!(json.contains("provider"));
    assert!(json.contains("behavioralDivergences"));
}
