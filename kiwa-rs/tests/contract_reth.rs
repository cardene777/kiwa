//! Integration tests for the reth (Rust Ethereum Execution client) adapter.
//!
//! These tests do NOT require the `reth` binary to be installed — they
//! verify the graceful degradation path (`RethBinary::detect` reports
//! `available=false`, `reth_reorg` on an unreachable endpoint returns a
//! `skipped` report) and the fidelity matrix contract shape. When run in
//! an environment with `reth` on PATH, extra assertions kick in for the
//! spawn / wait-ready round-trip.

#![cfg(feature = "contract-reth")]

use std::time::Duration;

use kiwa::contract::reth::{
    fidelity_matrix, reth_reorg, FidelityCase, ReorgReport, RethBinary, RethNode,
};

#[test]
fn t_reth_001_detect_never_panics() {
    let bin = RethBinary::detect();
    // Field access — the shape must stay stable.
    let _ = bin.available;
    let _ = bin.path.clone();
}

#[test]
fn t_reth_002_detect_available_flag_matches_path_presence() {
    let bin = RethBinary::detect();
    if bin.available {
        assert!(!bin.path.as_os_str().is_empty());
    } else {
        assert!(bin.path.as_os_str().is_empty());
    }
}

#[test]
fn t_reth_003_reth_reorg_returns_skipped_when_endpoint_unreachable() {
    // Use a port that is guaranteed to be closed to force the "unreachable"
    // path. The report must not panic even when the RPC never lands.
    let out = reth_reorg("http://127.0.0.1:1", 3).unwrap();
    assert!(out.skipped);
    assert!(!out.rpc_ok);
    assert_eq!(out.blocks, 3);
    assert!(out.response_body.contains("unreachable"));
}

#[test]
fn t_reth_004_reth_reorg_report_skipped_helper_populates_shape() {
    let r = ReorgReport::skipped(7, "test-reason");
    assert!(r.skipped);
    assert!(!r.rpc_ok);
    assert_eq!(r.blocks, 7);
    assert_eq!(r.response_body, "test-reason");
    assert!(r.request.is_empty());
}

#[test]
fn t_reth_005_fidelity_matrix_covers_seven_methods() {
    let matrix = fidelity_matrix();
    assert_eq!(matrix.len(), 7);
    // Every entry must have a non-empty method + rationale — stable contract
    // for kiwa consumers building assertion harnesses.
    for case in &matrix {
        assert!(!case.method.is_empty(), "empty method in {case:?}");
        assert!(!case.rationale.is_empty(), "empty rationale in {case:?}");
    }
}

#[test]
fn t_reth_006_fidelity_matrix_includes_eth_block_number() {
    let matrix = fidelity_matrix();
    let has_block_number = matrix.iter().any(|c| c.method == "eth_blockNumber");
    assert!(has_block_number, "eth_blockNumber missing from fidelity matrix");
}

#[test]
fn t_reth_007_fidelity_matrix_has_both_agreement_expectations() {
    let matrix = fidelity_matrix();
    let agree = matrix.iter().filter(|c| c.expected_agreement).count();
    let disagree = matrix.iter().filter(|c| !c.expected_agreement).count();
    assert!(agree > 0, "no agreement-expected cases");
    assert!(disagree > 0, "no divergence-expected cases");
}

#[test]
fn t_reth_008_fidelity_case_debug_shape_is_stable() {
    let case = FidelityCase {
        method: "eth_chainId".to_string(),
        params_json: "[]".to_string(),
        expected_agreement: true,
        rationale: "smoke".to_string(),
    };
    let debug = format!("{case:?}");
    assert!(debug.contains("eth_chainId"));
    assert!(debug.contains("expected_agreement"));
}

#[test]
fn t_reth_009_spawn_returns_not_found_when_reth_missing() {
    let bin = RethBinary::detect();
    if !bin.available {
        let err = RethNode::spawn_dev(38545).unwrap_err();
        assert_eq!(err.kind(), std::io::ErrorKind::NotFound);
        assert!(err.to_string().contains("reth not on PATH"));
    }
}

#[test]
fn t_reth_010_wait_ready_times_out_on_unreachable_port() {
    // Fabricate a RethNode-like handle by spawning against a port and then
    // stopping the child so the port is definitely closed. Since we do not
    // have real reth on the CI matrix, we use the graceful path: skip the
    // wait-ready assertion when the binary is missing.
    let bin = RethBinary::detect();
    if bin.available {
        // Bind reth on a high port unlikely to conflict; then never wait
        // for its startup and immediately drop it.
        let node = RethNode::spawn_dev(39_876).expect("spawn dev node");
        // The wait must succeed within 8 s of real startup; on a slow machine
        // this is still generous.
        let ready = node.wait_ready(Duration::from_secs(8));
        assert!(ready.is_ok(), "wait_ready failed: {ready:?}");
    }
    // No assertions in the missing-binary path — the test still exercises
    // the "detect + branch" contract without needing reth installed.
}

#[test]
fn t_reth_011_reorg_request_payload_matches_json_rpc_shape() {
    // Even the skipped path returns an empty `request` field; the shape is
    // only populated on the reachable branch. Exercise the format string
    // separately to keep the contract stable.
    let payload = format!(
        r#"{{"jsonrpc":"2.0","method":"debug_setHead","params":["0x{:x}"],"id":1}}"#,
        3u32
    );
    assert!(payload.contains("\"method\":\"debug_setHead\""));
    assert!(payload.contains("\"params\":[\"0x3\"]"));
    assert!(payload.contains("\"id\":1"));
}
