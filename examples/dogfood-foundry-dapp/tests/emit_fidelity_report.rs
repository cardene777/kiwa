//! Emit the fidelity JSON + markdown to `quality-report/` so the outputs are
//! easy to inspect locally. Kept git-ignored so CI does not append noise.

use std::fs;
use std::path::PathBuf;

use dogfood_foundry_dapp::{
    build_fidelity_report, dogfood_project_root, synthetic_erc20_abi_json,
    DAppAdapter, MockAdapter, RealAdapter,
};

fn out_dir() -> PathBuf {
    let mut p = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    p.push("quality-report");
    p
}

#[test]
fn t_dff_em_001_writes_json_snapshot_and_markdown_report() {
    let mut mock = MockAdapter::new();
    let mut real = RealAdapter::new();
    for adapter in [&mut mock as &mut dyn DAppAdapter, &mut real as &mut dyn DAppAdapter] {
        adapter.run_forge_test(&dogfood_project_root());
        adapter.inspect_abi(synthetic_erc20_abi_json());
        adapter.encode_transfer_call("0xbeef", 12345);
        adapter.detect_foundry();
        adapter.describe_signer();
        adapter.describe_provider(8545);
    }
    let report = build_fidelity_report(
        "@kiwa-test/contract/foundry-dogfood",
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
}
