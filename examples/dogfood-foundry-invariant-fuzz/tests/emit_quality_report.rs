//! Emit the fidelity report to `quality-report/` so a downstream consumer
//! (e.g. `@kiwa-test/quality-metrics`) can pick it up. Writing under
//! `CARGO_MANIFEST_DIR/quality-report/` keeps the emitter git-ignored yet
//! reachable from repo-root scripts.

use std::fs;
use std::path::PathBuf;

use dogfood_foundry_invariant_fuzz::{
    build_fidelity_report, dogfood_project_root, release_gate_options, InvariantScenarioAdapter,
    MockInvariantAdapter, RealInvariantAdapter,
};

fn out_dir() -> PathBuf {
    let mut p = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    p.push("quality-report");
    p
}

#[test]
fn t_dfi_em_001_writes_json_and_markdown_snapshots() {
    let opts = release_gate_options();
    let mut mock = MockInvariantAdapter::new();
    let mut real = RealInvariantAdapter::new(dogfood_project_root());
    let summaries = vec![
        mock.invariant_erc20(&opts),
        mock.invariant_vault(&opts),
        mock.invariant_router(&opts),
    ];
    mock.describe_options(&opts);
    mock.describe_env();
    mock.run_coverage();

    let _real_summaries = [
        real.invariant_erc20(&opts),
        real.invariant_vault(&opts),
        real.invariant_router(&opts),
    ];
    real.describe_options(&opts);
    real.describe_env();
    real.run_coverage();

    let report = build_fidelity_report(
        "@kiwa-test/contract/foundry-invariant-fuzz-dogfood",
        "0.1.0",
        &mock.traces(),
        &real.traces(),
        &summaries,
    );
    let out = out_dir();
    fs::create_dir_all(&out).unwrap();
    fs::write(out.join("fidelity-latest.json"), report.to_json()).unwrap();
    fs::write(out.join("fidelity-latest.md"), report.to_markdown()).unwrap();
    assert!(out.join("fidelity-latest.json").exists());
    assert!(out.join("fidelity-latest.md").exists());
    // Non-empty snapshots — guards against a serializer regression writing
    // empty files.
    let json = fs::read_to_string(out.join("fidelity-latest.json")).unwrap();
    let md = fs::read_to_string(out.join("fidelity-latest.md")).unwrap();
    assert!(json.contains("foundry-invariant-fuzz-dogfood"));
    assert!(md.contains("foundry-invariant-fuzz-dogfood"));
    assert!(json.contains("InvariantERC20"));
    assert!(md.contains("InvariantVault"));
}
