//! Three ERC-20 scenarios shared by the mock + real adapters.
//!
//! Each scenario mutates a [`MockChainState`] and returns a small `Outcome`
//! struct the fidelity harness can diff between the mock and real sides.
//! Keeping the scenarios provider-neutral is what lets the harness feed the
//! same call sequence into both adapters.

use crate::MockChainState;

/// Well-known dev account addresses used across the scenarios. `alice`,
/// `bob`, and `carol` map to the first three of anvil's deterministic
/// accounts.
pub const ALICE: &str = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
pub const BOB: &str = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
pub const CAROL: &str = "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc";

/// Result of the ERC-20 transfer scenario.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Erc20TransferOutcome {
    /// Number of transfer ops issued.
    pub transfer_count: usize,
    /// Final block height after the scenario.
    pub final_block: u64,
    /// Balances at the end (alice, bob, carol).
    pub alice_balance: u128,
    pub bob_balance: u128,
    pub carol_balance: u128,
    /// True when the scenario was skipped (real adapter without reth on PATH).
    pub skipped: bool,
}

impl Erc20TransferOutcome {
    /// Build a skipped outcome (used by the real adapter when reth is absent).
    pub fn skipped() -> Self {
        Self {
            transfer_count: 0,
            final_block: 0,
            alice_balance: 0,
            bob_balance: 0,
            carol_balance: 0,
            skipped: true,
        }
    }
}

/// Result of the reorg scenario.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Reorg3BlockOutcome {
    /// Number of blocks the reorg rolled back (always 3 in this scenario).
    pub blocks_rolled_back: u32,
    /// Head block height after the rewind.
    pub head_after_reorg: u64,
    /// Balances at the head after the rewind.
    pub alice_balance_after: u128,
    pub bob_balance_after: u128,
    pub carol_balance_after: u128,
    /// True when the mock observed the balance sheet restored to the
    /// pre-reorg snapshot (i.e. the rewind was semantically correct).
    pub balances_restored: bool,
    /// Skipped in the real adapter without reth on PATH.
    pub skipped: bool,
}

impl Reorg3BlockOutcome {
    pub fn skipped() -> Self {
        Self {
            blocks_rolled_back: 0,
            head_after_reorg: 0,
            alice_balance_after: 0,
            bob_balance_after: 0,
            carol_balance_after: 0,
            balances_restored: false,
            skipped: true,
        }
    }
}

/// Result of the event history re-query scenario.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EventHistoryOutcome {
    /// Number of `Transfer` events surviving after the reorg.
    pub surviving_events: usize,
    /// Number of events observed before the reorg.
    pub events_before_reorg: usize,
    /// Number of events pruned by the reorg.
    pub pruned_events: usize,
    /// Highest block observed in the surviving event list.
    pub max_block_in_log: u64,
    pub skipped: bool,
}

impl EventHistoryOutcome {
    pub fn skipped() -> Self {
        Self {
            surviving_events: 0,
            events_before_reorg: 0,
            pruned_events: 0,
            max_block_in_log: 0,
            skipped: true,
        }
    }
}

/// Scenario 1 — mint 1_000_000 tokens to alice, then have alice send 100
/// tokens to bob 10 times. Records the final balance sheet.
///
/// The scenario walks 11 blocks (1 mint + 10 transfers). Every op emits one
/// `Transfer` event so `state.events` grows to 11 entries.
pub fn erc20_transfer(state: &mut MockChainState) -> Erc20TransferOutcome {
    state.mint(ALICE, 1_000_000);
    for _ in 0..10 {
        state.transfer(ALICE, BOB, 100);
    }
    Erc20TransferOutcome {
        transfer_count: 10,
        final_block: state.block_number,
        alice_balance: state.balance_of(ALICE),
        bob_balance: state.balance_of(BOB),
        carol_balance: state.balance_of(CAROL),
        skipped: false,
    }
}

/// Scenario 2 — roll the chain back three blocks and record the balance
/// sheet at the new head. Callers pass a state that has already been driven
/// through [`erc20_transfer`] (so there are at least 4 blocks to roll off).
///
/// The rewind restores the balances to the block-8 snapshot (11 → 8 = -3).
/// `balances_restored` is true when bob's balance decreased by exactly
/// `3 * 100` tokens (the three rolled-back transfers).
pub fn reorg_3block(state: &mut MockChainState) -> Reorg3BlockOutcome {
    let bob_before = state.balance_of(BOB);
    let head_after = state.reorg(3);
    let bob_after = state.balance_of(BOB);
    let restored = bob_before.saturating_sub(bob_after) == 300;
    Reorg3BlockOutcome {
        blocks_rolled_back: 3,
        head_after_reorg: head_after,
        alice_balance_after: state.balance_of(ALICE),
        bob_balance_after: bob_after,
        carol_balance_after: state.balance_of(CAROL),
        balances_restored: restored,
        skipped: false,
    }
}

/// Scenario 3 — re-query the `Transfer` event log after the reorg and
/// report which entries survived. Callers pass the state after
/// [`reorg_3block`] has run so `state.events` reflects the pruned log.
pub fn event_history(state: &mut MockChainState) -> EventHistoryOutcome {
    let logs = state.get_logs(0, state.block_number);
    let max_block = logs.iter().map(|e| e.block_number).max().unwrap_or(0);
    // pre-reorg was 11 events; whatever survived is the current log length.
    let events_before: usize = 11;
    let surviving = logs.len();
    let pruned = events_before.saturating_sub(surviving);
    EventHistoryOutcome {
        surviving_events: surviving,
        events_before_reorg: events_before,
        pruned_events: pruned,
        max_block_in_log: max_block,
        skipped: false,
    }
}
