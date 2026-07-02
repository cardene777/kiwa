//! Mock-mode e2e tests — deterministic across every host, no Foundry CLI
//! dependency. These tests exercise the adapter surface end-to-end so the
//! fidelity harness diff has meaningful ops on the mock side even when the
//! real side is skipped.

use dogfood_foundry_dapp::{
    dogfood_project_root, synthetic_erc20_abi_json, DAppAdapter, MockAdapter,
};

#[test]
fn t_dff_m_001_mock_run_forge_test_is_skipped() {
    let mut adapter = MockAdapter::new();
    let out = adapter.run_forge_test(&dogfood_project_root());
    assert!(out.skipped);
    assert!(!out.success);
}

#[test]
fn t_dff_m_002_mock_inspect_abi_reports_functions_and_events() {
    let mut adapter = MockAdapter::new();
    let snap = adapter.inspect_abi(synthetic_erc20_abi_json());
    assert_eq!(snap.contract_name, "DogfoodToken");
    assert_eq!(snap.function_count, 3);
    assert_eq!(snap.event_count, 1);
    assert_eq!(snap.transfer_selector.as_deref(), Some("0xa9059cbb"));
    assert_eq!(snap.balance_of_selector.as_deref(), Some("0x70a08231"));
}

#[test]
fn t_dff_m_003_mock_encode_transfer_call_matches_erc20_selector() {
    let mut adapter = MockAdapter::new();
    let call = adapter
        .encode_transfer_call("0xbeef", 12345)
        .expect("mock adapter should return a call");
    assert_eq!(call.selector_hex, "0xa9059cbb");
    assert!(call.data_hex.starts_with("0xa9059cbb"));
    assert!(call.data_hex.contains("beef"));
}

#[test]
fn t_dff_m_004_mock_detect_foundry_reports_env_absent() {
    let mut adapter = MockAdapter::new();
    let detect = adapter.detect_foundry();
    assert!(!detect.forge_available);
    assert!(!detect.cast_available);
    assert!(!detect.anvil_available);
    assert!(!detect.all_available);
}

#[test]
fn t_dff_m_005_mock_describe_signer_uses_local_wallet() {
    let mut adapter = MockAdapter::new();
    let signer = adapter.describe_signer();
    match signer {
        kiwa::contract::alloy::Signer::LocalWallet { chain_id, .. } => {
            assert_eq!(chain_id, 31337);
        }
        _ => panic!("expected LocalWallet"),
    }
}

#[test]
fn t_dff_m_006_mock_describe_provider_returns_anvil_http() {
    let mut adapter = MockAdapter::new();
    let provider = adapter.describe_provider(8545);
    match provider {
        kiwa::contract::alloy::Provider::Http { url } => {
            assert_eq!(url, "http://127.0.0.1:8545");
        }
        _ => panic!("expected Http provider"),
    }
}

#[test]
fn t_dff_m_007_mock_trace_captures_every_op() {
    let mut adapter = MockAdapter::new();
    adapter.run_forge_test(&dogfood_project_root());
    adapter.inspect_abi(synthetic_erc20_abi_json());
    adapter.encode_transfer_call("0xbeef", 1);
    adapter.detect_foundry();
    adapter.describe_signer();
    adapter.describe_provider(8545);
    let traces = adapter.traces();
    let ops: std::collections::HashSet<_> = traces.iter().map(|t| t.op.as_str()).collect();
    for op in [
        "run_forge_test",
        "inspect_abi",
        "encode_transfer_call",
        "detect_foundry",
        "describe_signer",
        "describe_provider",
    ] {
        assert!(ops.contains(op), "trace missing op {op}");
    }
}

#[test]
fn t_dff_m_008_mock_reset_clears_the_trace() {
    let mut adapter = MockAdapter::new();
    adapter.detect_foundry();
    assert!(!adapter.traces().is_empty());
    adapter.reset();
    assert!(adapter.traces().is_empty());
}
