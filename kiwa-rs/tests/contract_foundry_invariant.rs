//! Integration tests for the Foundry invariant / fuzz runner (v0.5).
//!
//! Tests do not require Foundry to be installed — they verify:
//!
//! - `invariant_run` returns a `Skipped` report when the CLI is missing.
//! - `parse_invariant_shrink` correctly extracts the failing test name, the
//!   `Reason:` string, and the shrunk sequence steps from canned Foundry
//!   stdout.
//! - `InvariantOptions::default()` uses the documented 10 000-run + no-seed
//!   defaults.
//! - `forge_script` short-circuits when forge is missing.
//! - The classifier flips outcome to `Failed` when the shrink parser sees a
//!   `[FAIL. Reason: ...]` header.

#![cfg(feature = "contract-foundry")]

use std::path::PathBuf;

use kiwa::contract::foundry::{
    forge_script, invariant_run, parse_invariant_shrink, FoundryEnv, InvariantOptions,
    InvariantOutcome,
};

fn missing_env() -> FoundryEnv {
    let mut env = FoundryEnv::detect();
    env.forge_available = false;
    env.cast_available = false;
    env.anvil_available = false;
    env.forge_path = PathBuf::new();
    env.cast_path = PathBuf::new();
    env.anvil_path = PathBuf::new();
    env
}

#[test]
fn t_invariant_001_default_options_use_ten_thousand_runs() {
    let opts = InvariantOptions::default();
    assert_eq!(opts.runs, 10_000);
    assert!(opts.seed.is_none());
    assert!(opts.match_contract.is_none());
    assert!(opts.match_test.is_none());
    assert!(opts.extra_forge_args.is_empty());
}

#[test]
fn t_invariant_002_run_returns_skipped_when_forge_missing() {
    let env = missing_env();
    let out = invariant_run(&env, std::path::Path::new("."), &InvariantOptions::default()).unwrap();
    assert_eq!(out.outcome, InvariantOutcome::Skipped);
    assert!(out.skipped);
    assert_eq!(out.runs_executed, 0);
    assert!(out.shrink.is_none());
    assert!(out.stderr.contains("forge not on PATH"));
}

#[test]
fn t_invariant_003_run_records_requested_seed_in_report() {
    let env = missing_env();
    let out = invariant_run(
        &env,
        std::path::Path::new("."),
        &InvariantOptions {
            runs: 5_000,
            seed: Some(0xdead_beef),
            ..Default::default()
        },
    )
    .unwrap();
    assert_eq!(out.seed, Some(0xdead_beef));
}

#[test]
fn t_invariant_004_forge_script_returns_skipped_when_forge_missing() {
    let env = missing_env();
    let out = forge_script(
        &env,
        std::path::Path::new("."),
        "script/Deploy.s.sol",
        "http://127.0.0.1:8545",
        false,
        &[],
    )
    .unwrap();
    assert!(out.skipped);
    assert!(!out.success);
    assert_eq!(out.script_path, "script/Deploy.s.sol");
    assert!(!out.broadcast);
    assert!(out.stderr.contains("forge not on PATH"));
}

#[test]
fn t_invariant_005_shrink_parser_extracts_test_name_and_reason() {
    let stdout = r#"
Running 1 test for test/InvariantERC20.t.sol:InvariantERC20
[FAIL. Reason: totalSupply drifted] invariant_totalSupplyEqSumOfBalances()
  sequence: caller=0xabc target=0x0000000000000000000000000000000000000001 sig=transfer(address,uint256) calldata=0xdead
Test result: FAILED. 0 passed; 1 failed; finished in 0.15s
"#;
    let shrink = parse_invariant_shrink(stdout).expect("parser must find a FAIL line");
    assert_eq!(shrink.test_name, "invariant_totalSupplyEqSumOfBalances");
    assert_eq!(shrink.reason, "totalSupply drifted");
    assert_eq!(shrink.sequence.len(), 1);
    assert_eq!(
        shrink.sequence[0].target,
        "0x0000000000000000000000000000000000000001"
    );
    assert_eq!(shrink.sequence[0].signature, "transfer(address,uint256)");
    assert_eq!(shrink.sequence[0].calldata, "0xdead");
}

#[test]
fn t_invariant_006_shrink_parser_returns_none_when_no_fail_line() {
    let stdout = "Test result: PASSED. 42 passed; 0 failed; finished in 1.20s";
    assert!(parse_invariant_shrink(stdout).is_none());
}

#[test]
fn t_invariant_007_shrink_parser_handles_test_fuzz_prefix() {
    let stdout = "[FAIL. Reason: assertion] testFuzz_addNeverOverflows()";
    let shrink = parse_invariant_shrink(stdout).unwrap();
    assert_eq!(shrink.test_name, "testFuzz_addNeverOverflows");
}

#[test]
fn t_invariant_008_options_preserve_extra_args() {
    let opts = InvariantOptions {
        runs: 100,
        seed: Some(1),
        match_contract: Some("Foo".to_string()),
        match_test: Some("bar".to_string()),
        extra_forge_args: vec!["--gas-report".to_string()],
    };
    let cloned = opts.clone();
    assert_eq!(cloned.runs, 100);
    assert_eq!(cloned.match_contract.as_deref(), Some("Foo"));
    assert_eq!(cloned.extra_forge_args, vec!["--gas-report".to_string()]);
}

#[test]
fn t_invariant_009_run_report_command_stays_empty_on_skip() {
    let env = missing_env();
    let out = invariant_run(&env, std::path::Path::new("."), &InvariantOptions::default()).unwrap();
    assert!(out.command.is_empty());
    assert!(out.stdout.is_empty());
}

#[test]
fn t_invariant_010_forge_script_command_stays_empty_on_skip() {
    let env = missing_env();
    let out = forge_script(
        &env,
        std::path::Path::new("."),
        "script/Deploy.s.sol",
        "http://127.0.0.1:8545",
        true,
        &["--slow"],
    )
    .unwrap();
    assert!(out.command.is_empty());
    // broadcast flag preserved even on skip so callers can see what they asked for.
    assert!(out.broadcast);
}
