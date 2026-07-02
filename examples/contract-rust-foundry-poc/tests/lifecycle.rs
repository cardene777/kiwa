//! Integration-shaped tests over the PoC lifecycle. These do not require
//! Foundry to be installed — they demonstrate the "graceful skip" pattern the
//! kiwa contract layer promotes.

use std::path::Path;

use contract_rust_foundry_poc::ContractLifecycle;

#[test]
fn t_poc_001_lifecycle_detects_foundry_env() {
    let lc = ContractLifecycle::new();
    // The flags never panic and follow the conjunction rule.
    let all = lc.env.all_available();
    assert_eq!(all, lc.env.forge_available && lc.env.cast_available && lc.env.anvil_available);
}

#[test]
fn t_poc_002_run_forge_test_gracefully_skips_when_forge_missing() {
    let mut lc = ContractLifecycle::new();
    lc.env.forge_available = false;
    let out = lc.run_forge_test(Path::new(".")).unwrap();
    assert!(out.skipped);
    assert!(!out.success);
}

#[test]
fn t_poc_003_run_forge_coverage_returns_empty_lcov_when_skipped() {
    let mut lc = ContractLifecycle::new();
    lc.env.forge_available = false;
    let report = lc.run_forge_coverage(Path::new(".")).unwrap();
    assert!(report.skipped);
    assert!(report.lcov.is_empty());
    assert!(report.line_coverage_pct.is_none());
}

#[test]
fn t_poc_004_read_state_skips_when_cast_missing() {
    let mut lc = ContractLifecycle::new();
    lc.env.cast_available = false;
    let out = lc.read_state("http://127.0.0.1:8545", "0x00", "totalSupply()").unwrap();
    assert!(out.skipped);
    assert!(out.stderr.contains("cast not on PATH"));
}

#[test]
fn t_poc_005_lifecycle_reports_paths_when_binaries_present() {
    let lc = ContractLifecycle::new();
    if !lc.env.forge_available {
        return;
    }
    assert!(lc.env.forge_path.exists());
}

#[test]
fn t_poc_006_lifecycle_reports_zero_test_counts_on_missing_summary() {
    let mut lc = ContractLifecycle::new();
    lc.env.forge_available = false;
    let out = lc.run_forge_test(Path::new(".")).unwrap();
    assert!(out.tests_passed.is_none());
    assert!(out.tests_failed.is_none());
}

#[test]
fn t_poc_007_run_forge_test_when_binary_present_returns_status() {
    let lc = ContractLifecycle::new();
    if !lc.env.forge_available {
        return;
    }
    // In an environment with forge but no Solidity project, the CLI reports a
    // non-zero exit. We only assert on the shape here.
    let out = lc.run_forge_test(Path::new("/tmp")).unwrap();
    assert!(!out.skipped);
}

#[test]
fn t_poc_008_read_state_when_cast_present_produces_command_string() {
    let lc = ContractLifecycle::new();
    if !lc.env.cast_available {
        return;
    }
    let out = lc
        .read_state("http://127.0.0.1:65535", "0x00", "totalSupply()")
        .unwrap();
    // We do not assert success (there is nothing to talk to) — only that the
    // wrapper populated the command string.
    assert!(out.command.starts_with("cast call"));
}
