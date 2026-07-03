//! Emit the fidelity report to `quality-report/` so a downstream consumer
//! (e.g. `@kiwa-test/quality-metrics`) can pick it up. Writing under
//! `CARGO_MANIFEST_DIR/quality-report/` keeps the emitter git-ignored yet
//! reachable from repo-root scripts.

use std::fs;
use std::path::PathBuf;

use dogfood_reth_node_test::{
    build_fidelity_report, MockRethAdapter, RealRethAdapter, RethScenarioAdapter,
};

fn out_dir() -> PathBuf {
    let mut p = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    p.push("quality-report");
    p
}

#[test]
fn t_drn_em_001_writes_json_and_markdown_snapshots() {
    let mut mock = MockRethAdapter::new();
    let mut real = RealRethAdapter::new();
    for adapter in [
        &mut mock as &mut dyn RethScenarioAdapter,
        &mut real as &mut dyn RethScenarioAdapter,
    ] {
        adapter.erc20_transfer();
        adapter.reorg_3block();
        adapter.event_history();
        adapter.describe_signer();
        adapter.describe_provider(8545);
        adapter.detect_reth();
    }
    let report = build_fidelity_report(
        "@kiwa-test/contract/reth-node-dogfood",
        "0.1.0",
        &mock.traces(),
        &real.traces(),
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
    assert!(json.contains("reth-node-dogfood"));
    assert!(md.contains("reth-node-dogfood"));
}
