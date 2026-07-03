//! Mock-mode scenario tests — deterministic across every host, never touch
//! reth. These are the "unit" layer of the 3-layer perf test structure the
//! sub-Issue AC calls for: `MockChainState` + `MockRethAdapter` exercised
//! end-to-end with pure in-process state.

use dogfood_reth_node_test::scenarios::{
    erc20_transfer, event_history, reorg_3block, ALICE, BOB, CAROL,
};
use dogfood_reth_node_test::{MockChainState, MockRethAdapter, RethScenarioAdapter, TransferEvent};

#[test]
fn t_drn_m_001_erc20_transfer_moves_1000_tokens_from_alice_to_bob() {
    let mut state = MockChainState::new();
    let outcome = erc20_transfer(&mut state);
    assert_eq!(outcome.transfer_count, 10);
    assert_eq!(outcome.final_block, 11); // 1 mint + 10 transfers
    assert_eq!(outcome.alice_balance, 1_000_000 - 1000);
    assert_eq!(outcome.bob_balance, 1000);
    assert_eq!(outcome.carol_balance, 0);
    assert!(!outcome.skipped);
}

#[test]
fn t_drn_m_002_reorg_rolls_back_last_three_transfers() {
    let mut state = MockChainState::new();
    erc20_transfer(&mut state);
    let outcome = reorg_3block(&mut state);
    assert_eq!(outcome.blocks_rolled_back, 3);
    assert_eq!(outcome.head_after_reorg, 8);
    assert_eq!(outcome.bob_balance_after, 700); // 1000 - 300
    assert_eq!(
        outcome.alice_balance_after,
        1_000_000 - 700 // reverse of bob's balance
    );
    assert!(outcome.balances_restored);
    assert!(!outcome.skipped);
}

#[test]
fn t_drn_m_003_event_history_prunes_three_transfer_events() {
    let mut state = MockChainState::new();
    erc20_transfer(&mut state);
    reorg_3block(&mut state);
    let outcome = event_history(&mut state);
    assert_eq!(outcome.events_before_reorg, 11);
    assert_eq!(outcome.surviving_events, 8);
    assert_eq!(outcome.pruned_events, 3);
    assert_eq!(outcome.max_block_in_log, 8);
    assert!(!outcome.skipped);
}

#[test]
fn t_drn_m_004_mock_chain_state_snapshot_survives_double_reorg() {
    // Reorg twice — the mock should still restore to the correct snapshot.
    let mut state = MockChainState::new();
    erc20_transfer(&mut state);
    reorg_3block(&mut state);
    // Roll back another 2 blocks — now at height 6.
    let head = state.reorg(2);
    assert_eq!(head, 6);
    // 5 transfers survived, so bob has 500.
    assert_eq!(state.balance_of(BOB), 500);
    assert_eq!(state.balance_of(ALICE), 1_000_000 - 500);
}

#[test]
fn t_drn_m_005_mock_chain_state_reorg_past_genesis_clamps() {
    let mut state = MockChainState::new();
    erc20_transfer(&mut state);
    // Ask for a 100-block rewind on an 11-block chain — should clamp to 0.
    let head = state.reorg(100);
    assert_eq!(head, 0);
    assert!(state.balances.is_empty());
    assert!(state.events.is_empty());
}

#[test]
fn t_drn_m_006_mock_chain_state_get_logs_filters_by_range() {
    let mut state = MockChainState::new();
    erc20_transfer(&mut state);
    let logs = state.get_logs(3, 5);
    assert_eq!(logs.len(), 3);
    // Every event in range is a transfer from alice.
    assert!(logs.iter().all(|e| e.from == ALICE));
    // Every event is inside the requested block range.
    assert!(logs
        .iter()
        .all(|e| e.block_number >= 3 && e.block_number <= 5));
}

#[test]
fn t_drn_m_007_mock_adapter_reset_clears_state_and_trace() {
    let mut adapter = MockRethAdapter::new();
    adapter.erc20_transfer();
    adapter.reorg_3block();
    assert!(!adapter.traces().is_empty());
    assert_ne!(adapter.state().block_number, 0);
    adapter.reset();
    assert!(adapter.traces().is_empty());
    assert_eq!(adapter.state().block_number, 0);
    assert!(adapter.state().balances.is_empty());
}

#[test]
fn t_drn_m_008_mock_adapter_records_every_scenario_op_in_trace() {
    let mut adapter = MockRethAdapter::new();
    adapter.erc20_transfer();
    adapter.reorg_3block();
    adapter.event_history();
    adapter.describe_signer();
    adapter.describe_provider(8545);
    adapter.detect_reth();
    let ops: std::collections::HashSet<_> = adapter
        .traces()
        .iter()
        .map(|t| t.op.as_str().to_string())
        .collect();
    for op in [
        "erc20_transfer",
        "reorg_3block",
        "event_history",
        "describe_signer",
        "describe_provider",
        "detect_reth",
    ] {
        assert!(ops.contains(op), "trace missing op {op}");
    }
}

#[test]
fn t_drn_m_009_transfer_event_equality_compares_by_field() {
    let a = TransferEvent {
        block_number: 1,
        from: ALICE.to_string(),
        to: BOB.to_string(),
        amount: 100,
    };
    let b = TransferEvent {
        block_number: 1,
        from: ALICE.to_string(),
        to: BOB.to_string(),
        amount: 100,
    };
    assert_eq!(a, b);
}

#[test]
fn t_drn_m_010_scenario_uses_deterministic_dev_accounts() {
    // Guard against accidental account renaming — the fidelity harness
    // depends on the same addresses on both sides.
    assert!(ALICE.starts_with("0x"));
    assert!(BOB.starts_with("0x"));
    assert!(CAROL.starts_with("0x"));
    assert_ne!(ALICE, BOB);
    assert_ne!(BOB, CAROL);
    assert_ne!(ALICE, CAROL);
}
