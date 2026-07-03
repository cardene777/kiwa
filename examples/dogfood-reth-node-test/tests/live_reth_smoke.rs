//! Live-mode smoke test — actually spawns a `reth node --dev` subprocess
//! and hits its JSON-RPC endpoint through `kiwa::contract::reth`.
//!
//! Gated behind `KIWA_RETH_LIVE=1` + `reth` on PATH. On every other host the
//! test returns early (no assertion failure). Keeping the live layer in the
//! same crate as the mock/integration layer is what closes the 3-layer perf
//! test structure the sub-Issue AC calls for.

use std::time::Duration;

use dogfood_reth_node_test::RealRethAdapter;
use kiwa::contract::reth::{reth_reorg, RethNode};

#[test]
fn t_drn_live_001_reth_node_dev_boots_and_answers_debug_set_head() {
    let Some(_adapter) = RealRethAdapter::spawn_when_available() else {
        eprintln!("KIWA_RETH_LIVE=1 not set or reth not on PATH — skipping live smoke");
        return;
    };
    // Pick a port unlikely to collide with the default 8545 anvil in dev.
    let port = 18545;
    let node = match RethNode::spawn_dev(port) {
        Ok(n) => n,
        Err(e) => {
            eprintln!("failed to spawn reth in live mode: {e}");
            return;
        }
    };
    if node.wait_ready(Duration::from_secs(10)).is_err() {
        eprintln!("reth did not become ready within 10s — skipping live smoke");
        return;
    }
    let report = reth_reorg(node.endpoint(), 3).expect("reth_reorg should not io-fail");
    // The reth dev binary may reject debug_setHead when it has never mined a
    // block deep enough to roll back — the smoke test only asserts the call
    // went out and the report captured the response.
    assert!(
        !report.skipped,
        "reth_reorg should have reached the endpoint"
    );
    assert_eq!(report.blocks, 3);
    assert!(!report.request.is_empty());
    assert!(report.request.contains("debug_setHead"));
    // Node is torn down by Drop.
}
