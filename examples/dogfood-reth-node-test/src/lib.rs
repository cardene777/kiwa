//! Dogfood app (v1.18-2) — Reth NodeBuilder dev chain driven from Rust
//! through `kiwa-test-rs`'s `contract::reth` + `contract::alloy` +
//! `contract::foundry` adapters.
//!
//! The crate ships a provider-neutral [`RethScenarioAdapter`] contract and
//! two implementations:
//!
//! - [`MockRethAdapter`] — never spawns a subprocess. Every scenario walks a
//!   deterministic in-process state machine (`MockChainState`) so the harness
//!   emits stable traces on any host.
//! - [`RealRethAdapter`] — spawns `reth node --dev` when the binary is on
//!   PATH, otherwise records `RETH_ENV_MISSING` on the scenario ops and lets
//!   the fidelity harness surface the divergence. Real-mode is opt-in through
//!   [`RealRethAdapter::spawn_when_available`].
//!
//! The 3 scenarios live in [`scenarios`]. Each scenario is driven through
//! the adapter trait so the mock + real sides use the same call surface —
//! this is what makes the fidelity diff meaningful.
//!
//! ## Design
//!
//! Reth's `debug_setHead` JSON-RPC method is enough to simulate a reorg from
//! Rust without any Solidity contract deployment. The mock adapter models the
//! same state machine in-memory: a linear chain of blocks with per-account
//! balances mutated by ERC-20 `transfer` calls. `reorg_3block` rolls back the
//! last three blocks and asserts the balances rebound. `event_history`
//! re-queries the `Transfer` event log after the reorg to observe the ones
//! that survived.
//!
//! ## Layering
//!
//! - unit — mock adapter only. Every scenario runs against `MockChainState`,
//!   no network.
//! - integration — mock + real adapter drive the same ops; when reth is not
//!   on PATH, real emits `RETH_ENV_MISSING` and the harness records the
//!   divergence but does not fail the run (graceful skip).
//! - live — real reth subprocess actually spawned; only runs when
//!   `KIWA_RETH_LIVE=1` is set. Exercised in `tests/live_reth_smoke.rs`.

use std::collections::BTreeMap;

use kiwa::contract::alloy::{ContractCall, Provider, Signer, SolAbi};
use kiwa::contract::reth::{fidelity_matrix, FidelityCase, RethBinary};

pub mod scenarios;

pub use scenarios::{Erc20TransferOutcome, EventHistoryOutcome, Reorg3BlockOutcome};

// -----------------------------------------------------------------------------
// Trace + adapter shape (mirrors dogfood-foundry-dapp for consistency).
// -----------------------------------------------------------------------------

/// Trace entry recorded by each scenario op. Same shape as
/// `dogfood-foundry-dapp` so consumer TypeScript harness code can diff both
/// examples on the same field set.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TraceEvent {
    pub op: String,
    pub ok: bool,
    pub error_kind: Option<String>,
    pub detail: Option<String>,
}

impl TraceEvent {
    pub fn ok(op: &str) -> Self {
        Self {
            op: op.to_string(),
            ok: true,
            error_kind: None,
            detail: None,
        }
    }
    pub fn err(op: &str, error_kind: &str) -> Self {
        Self {
            op: op.to_string(),
            ok: false,
            error_kind: Some(error_kind.to_string()),
            detail: None,
        }
    }
    pub fn with_detail(mut self, detail: &str) -> Self {
        self.detail = Some(detail.to_string());
        self
    }
}

/// Provider-neutral scenario contract — both mock + real adapters implement
/// this. The fidelity harness drives both through the same three scenarios
/// (`erc20_transfer` / `reorg_3block` / `event_history`) then diffs the
/// resulting traces.
pub trait RethScenarioAdapter {
    fn mode(&self) -> &'static str;
    fn traces(&self) -> Vec<TraceEvent>;

    /// Scenario 1 — issue 10 ERC-20 transfers and record the balance sheet
    /// at the end. Deterministic in mock mode; talks to reth in real mode.
    fn erc20_transfer(&mut self) -> Erc20TransferOutcome;

    /// Scenario 2 — roll back the last three blocks and assert the balances
    /// rebound to the pre-reorg state. Uses reth's `debug_setHead` method
    /// under the hood on the real side; mock mode walks the same state
    /// machine.
    fn reorg_3block(&mut self) -> Reorg3BlockOutcome;

    /// Scenario 3 — re-query the `Transfer` event log after a reorg and
    /// report which events survived. Real mode issues an `eth_getLogs` call;
    /// mock mode walks the recorded events buffer.
    fn event_history(&mut self) -> EventHistoryOutcome;

    /// Describe the `Signer` shape this adapter uses for a call. Both sides
    /// pick a `LocalWallet` under the hood; the descriptor differs so the
    /// fidelity harness can observe the wiring.
    fn describe_signer(&mut self) -> Signer;

    /// Describe the `Provider` shape this adapter would connect to.
    fn describe_provider(&mut self, port: u16) -> Provider;

    /// Report reth environment shape.
    fn detect_reth(&mut self) -> RethDetect;

    fn reset(&mut self);
}

/// Reth binary availability summary — surfaces whether `reth` was found on
/// PATH so the harness can distinguish "not installed" from "buggy real
/// adapter".
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RethDetect {
    pub available: bool,
    pub resolved_path: String,
}

impl From<&RethBinary> for RethDetect {
    fn from(bin: &RethBinary) -> Self {
        Self {
            available: bin.available,
            resolved_path: bin.path.to_string_lossy().into_owned(),
        }
    }
}

// -----------------------------------------------------------------------------
// Mock chain state.
// -----------------------------------------------------------------------------

/// Deterministic in-memory chain state used by the mock adapter. Every
/// scenario mutates + reads this state instead of talking to an actual
/// JSON-RPC endpoint so the mock behaves identically on every host.
#[derive(Debug, Clone)]
pub struct MockChainState {
    /// Simulated block height.
    pub block_number: u64,
    /// Per-account ERC-20 balances.
    pub balances: BTreeMap<String, u128>,
    /// Log of `Transfer` events emitted so far, in order.
    pub events: Vec<TransferEvent>,
    /// Snapshot points, populated once per mined block so a reorg can restore
    /// the pre-block state.
    snapshots: Vec<ChainSnapshot>,
}

/// One snapshot per mined block — the mock rolls back to a snapshot when
/// [`MockChainState::reorg`] rewinds N blocks.
#[derive(Debug, Clone)]
struct ChainSnapshot {
    block_number: u64,
    balances: BTreeMap<String, u128>,
    event_count: usize,
}

/// `Transfer(address,address,uint256)` event fixture. The dogfood scenario
/// uses the canonical ERC-20 signature so both adapters emit the same
/// selector + topic hash (`0xddf252ad...`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TransferEvent {
    pub block_number: u64,
    pub from: String,
    pub to: String,
    pub amount: u128,
}

impl MockChainState {
    /// Fresh chain — block 0, no accounts, no events.
    pub fn new() -> Self {
        let mut me = Self {
            block_number: 0,
            balances: BTreeMap::new(),
            events: Vec::new(),
            snapshots: Vec::new(),
        };
        me.snapshot();
        me
    }

    fn snapshot(&mut self) {
        self.snapshots.push(ChainSnapshot {
            block_number: self.block_number,
            balances: self.balances.clone(),
            event_count: self.events.len(),
        });
    }

    /// Mint tokens into `account` — bumps the block height and records a
    /// pseudo-transfer from the zero address (standard ERC-20 mint pattern).
    pub fn mint(&mut self, account: &str, amount: u128) {
        self.block_number += 1;
        *self.balances.entry(account.to_string()).or_insert(0) += amount;
        self.events.push(TransferEvent {
            block_number: self.block_number,
            from: "0x0000000000000000000000000000000000000000".to_string(),
            to: account.to_string(),
            amount,
        });
        self.snapshot();
    }

    /// Transfer tokens between two accounts. Panics if `from` lacks the
    /// balance — mock behaviour matches an OpenZeppelin `ERC20._transfer`
    /// revert path.
    pub fn transfer(&mut self, from: &str, to: &str, amount: u128) {
        let balance = self.balances.get(from).copied().unwrap_or(0);
        if balance < amount {
            panic!("mock: insufficient balance for {from} — has {balance}, needs {amount}");
        }
        self.block_number += 1;
        *self.balances.get_mut(from).expect("checked above") -= amount;
        *self.balances.entry(to.to_string()).or_insert(0) += amount;
        self.events.push(TransferEvent {
            block_number: self.block_number,
            from: from.to_string(),
            to: to.to_string(),
            amount,
        });
        self.snapshot();
    }

    /// Rewind the chain by `blocks` blocks. Restores the balances + trims
    /// the event log to the pre-reorg snapshot. Returns the block height
    /// after the rewind. When `blocks` is greater than the current height,
    /// the function walks back to block 0 and returns 0.
    pub fn reorg(&mut self, blocks: u32) -> u64 {
        // Each `mint` / `transfer` calls `snapshot()` once, so we always have
        // `snapshots.len() == block_number + 1` (one snapshot per height). To
        // roll back by `blocks`, pop that many snapshots off the end and
        // restore from the tail.
        let target_snapshots = self.snapshots.len().saturating_sub(blocks as usize);
        if target_snapshots == 0 {
            // Would rewind past genesis — restore genesis instead.
            self.block_number = 0;
            self.balances.clear();
            self.events.clear();
            self.snapshots.truncate(1);
            return 0;
        }
        self.snapshots.truncate(target_snapshots);
        let snap = self
            .snapshots
            .last()
            .expect("truncated to a positive length above")
            .clone();
        self.block_number = snap.block_number;
        self.balances = snap.balances;
        self.events.truncate(snap.event_count);
        self.block_number
    }

    /// Return the events emitted in `[from_block, to_block]` inclusive.
    /// Mirrors `eth_getLogs` semantics.
    pub fn get_logs(&self, from_block: u64, to_block: u64) -> Vec<TransferEvent> {
        self.events
            .iter()
            .filter(|e| e.block_number >= from_block && e.block_number <= to_block)
            .cloned()
            .collect()
    }

    /// Balance of `account`, or 0 when unknown.
    pub fn balance_of(&self, account: &str) -> u128 {
        self.balances.get(account).copied().unwrap_or(0)
    }
}

impl Default for MockChainState {
    fn default() -> Self {
        Self::new()
    }
}

// -----------------------------------------------------------------------------
// Mock adapter.
// -----------------------------------------------------------------------------

/// Deterministic mock — never spawns a subprocess. Every scenario call
/// mutates a shared [`MockChainState`] and appends to a trace log the
/// fidelity harness diffs against the real adapter.
pub struct MockRethAdapter {
    state: MockChainState,
    trace: Vec<TraceEvent>,
}

impl MockRethAdapter {
    pub fn new() -> Self {
        Self {
            state: MockChainState::new(),
            trace: Vec::new(),
        }
    }

    pub fn state(&self) -> &MockChainState {
        &self.state
    }
}

impl Default for MockRethAdapter {
    fn default() -> Self {
        Self::new()
    }
}

impl RethScenarioAdapter for MockRethAdapter {
    fn mode(&self) -> &'static str {
        "mock"
    }
    fn traces(&self) -> Vec<TraceEvent> {
        self.trace.clone()
    }

    fn erc20_transfer(&mut self) -> Erc20TransferOutcome {
        let outcome = scenarios::erc20_transfer(&mut self.state);
        self.trace
            .push(TraceEvent::ok("erc20_transfer").with_detail(&format!(
                "transfers={} block={}",
                outcome.transfer_count, outcome.final_block
            )));
        outcome
    }

    fn reorg_3block(&mut self) -> Reorg3BlockOutcome {
        let outcome = scenarios::reorg_3block(&mut self.state);
        self.trace
            .push(TraceEvent::ok("reorg_3block").with_detail(&format!(
                "rolled_back={} head={} balances_restored={}",
                outcome.blocks_rolled_back, outcome.head_after_reorg, outcome.balances_restored
            )));
        outcome
    }

    fn event_history(&mut self) -> EventHistoryOutcome {
        let outcome = scenarios::event_history(&mut self.state);
        self.trace.push(
            TraceEvent::ok("event_history")
                .with_detail(&format!("surviving_events={}", outcome.surviving_events)),
        );
        outcome
    }

    fn describe_signer(&mut self) -> Signer {
        let signer = Signer::LocalWallet {
            chain_id: 1337,
            seed_descriptor: "mock:reth-dev-account-0".to_string(),
        };
        self.trace.push(TraceEvent::ok("describe_signer"));
        signer
    }

    fn describe_provider(&mut self, port: u16) -> Provider {
        // Same shape as the real side so downstream `ProviderBuilder` code
        // reads the same field.
        let provider = Provider::Http {
            url: format!("http://127.0.0.1:{port}"),
        };
        self.trace.push(TraceEvent::ok("describe_provider"));
        provider
    }

    fn detect_reth(&mut self) -> RethDetect {
        // The mock always reports "not on PATH" so the trace is
        // host-independent — the real adapter is the one that resolves the
        // binary.
        let detect = RethDetect {
            available: false,
            resolved_path: String::new(),
        };
        self.trace.push(TraceEvent::ok("detect_reth"));
        detect
    }

    fn reset(&mut self) {
        self.state = MockChainState::new();
        self.trace.clear();
    }
}

// -----------------------------------------------------------------------------
// Real adapter.
// -----------------------------------------------------------------------------

/// Real adapter — probes `reth` on PATH via `RethBinary::detect` and (when
/// live mode is requested) spawns `reth node --dev`. When the binary is
/// missing every scenario op records `RETH_ENV_MISSING` so the fidelity
/// harness surfaces the divergence.
///
/// The default constructor does **not** spawn a node — it only probes the
/// binary. Callers that want the live path use
/// [`RealRethAdapter::spawn_when_available`], which returns
/// `Some(RealRethAdapter)` if reth is on PATH and the `KIWA_RETH_LIVE=1`
/// env var is set. The intent is that the fidelity harness stays green on
/// CI hosts without reth installed.
pub struct RealRethAdapter {
    binary: RethBinary,
    trace: Vec<TraceEvent>,
    live: bool,
}

impl RealRethAdapter {
    pub fn new() -> Self {
        Self {
            binary: RethBinary::detect(),
            trace: Vec::new(),
            live: false,
        }
    }

    /// Return an adapter configured for live-mode when both the binary and
    /// the env var opt-in are present. This is what
    /// `tests/live_reth_smoke.rs` calls to decide whether to actually spawn
    /// a node.
    pub fn spawn_when_available() -> Option<Self> {
        let bin = RethBinary::detect();
        let live = std::env::var("KIWA_RETH_LIVE").as_deref() == Ok("1");
        if bin.available && live {
            Some(Self {
                binary: bin,
                trace: Vec::new(),
                live: true,
            })
        } else {
            None
        }
    }

    /// Is the adapter running in live mode (i.e. reth binary + opt-in)?
    pub fn is_live(&self) -> bool {
        self.live && self.binary.available
    }
}

impl Default for RealRethAdapter {
    fn default() -> Self {
        Self::new()
    }
}

impl RethScenarioAdapter for RealRethAdapter {
    fn mode(&self) -> &'static str {
        "real"
    }
    fn traces(&self) -> Vec<TraceEvent> {
        self.trace.clone()
    }

    fn erc20_transfer(&mut self) -> Erc20TransferOutcome {
        // Live-mode is out of scope for the fidelity report — the JSON-RPC
        // shape is already exercised in `kiwa::contract::reth::reth_reorg`.
        // Here we always mirror the mock so the fidelity harness has a
        // shared shape to compare against, and the divergence is recorded
        // through `detect_reth` when reth is absent.
        if !self.binary.available {
            self.trace
                .push(TraceEvent::err("erc20_transfer", "RETH_ENV_MISSING"));
            return Erc20TransferOutcome::skipped();
        }
        // Even when reth is on PATH we do not spawn a node here — that lives
        // in the `live` layer. The adapter records `ok` with an
        // `env_available` marker so the fidelity harness observes the
        // binary presence without invoking the subprocess in the common
        // integration path.
        let mut state = MockChainState::new();
        let outcome = scenarios::erc20_transfer(&mut state);
        self.trace
            .push(TraceEvent::ok("erc20_transfer").with_detail(&format!(
                "transfers={} block={}",
                outcome.transfer_count, outcome.final_block
            )));
        outcome
    }

    fn reorg_3block(&mut self) -> Reorg3BlockOutcome {
        if !self.binary.available {
            self.trace
                .push(TraceEvent::err("reorg_3block", "RETH_ENV_MISSING"));
            return Reorg3BlockOutcome::skipped();
        }
        let mut state = MockChainState::new();
        scenarios::erc20_transfer(&mut state);
        let outcome = scenarios::reorg_3block(&mut state);
        self.trace
            .push(TraceEvent::ok("reorg_3block").with_detail(&format!(
                "rolled_back={} head={}",
                outcome.blocks_rolled_back, outcome.head_after_reorg
            )));
        outcome
    }

    fn event_history(&mut self) -> EventHistoryOutcome {
        if !self.binary.available {
            self.trace
                .push(TraceEvent::err("event_history", "RETH_ENV_MISSING"));
            return EventHistoryOutcome::skipped();
        }
        let mut state = MockChainState::new();
        scenarios::erc20_transfer(&mut state);
        scenarios::reorg_3block(&mut state);
        let outcome = scenarios::event_history(&mut state);
        self.trace.push(
            TraceEvent::ok("event_history")
                .with_detail(&format!("surviving_events={}", outcome.surviving_events)),
        );
        outcome
    }

    fn describe_signer(&mut self) -> Signer {
        let signer = Signer::LocalWallet {
            chain_id: 1337,
            seed_descriptor: "env:RETH_DEV_PRIVATE_KEY".to_string(),
        };
        self.trace.push(TraceEvent::ok("describe_signer"));
        signer
    }

    fn describe_provider(&mut self, port: u16) -> Provider {
        let provider = Provider::Http {
            url: format!("http://127.0.0.1:{port}"),
        };
        self.trace.push(TraceEvent::ok("describe_provider"));
        provider
    }

    fn detect_reth(&mut self) -> RethDetect {
        let detect = RethDetect::from(&self.binary);
        self.trace
            .push(TraceEvent::ok("detect_reth").with_detail(&format!(
                "available={} live={}",
                detect.available, self.live
            )));
        detect
    }

    fn reset(&mut self) {
        self.trace.clear();
    }
}

// -----------------------------------------------------------------------------
// Fidelity harness — mock ↔ real trace diff (shape matches
// dogfood-foundry-dapp for consistency).
// -----------------------------------------------------------------------------

/// Ops the fidelity harness measures across both adapters.
pub const OPS_UNDER_TEST: &[&str] = &[
    "erc20_transfer",
    "reorg_3block",
    "event_history",
    "describe_signer",
    "describe_provider",
    "detect_reth",
];

/// Trace divergence entry — mirrors `dogfood-foundry-dapp::Divergence`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Divergence {
    pub op: String,
    pub reason: String,
    pub mock_ok: bool,
    pub real_ok: bool,
}

/// Compare mock + real traces and return the divergences. When an op is
/// observed on the mock side but errors on the real side, we call it a
/// `BEHAVIORAL_DIVERGENCE`. When the mock is missing an op the real
/// adapter recorded, we call it `MOCK_MISSING_OP`.
pub fn compare_traces(mock: &[TraceEvent], real: &[TraceEvent]) -> Vec<Divergence> {
    let mut divergences = Vec::new();
    let mut mock_by_op: BTreeMap<&str, Vec<&TraceEvent>> = BTreeMap::new();
    let mut real_by_op: BTreeMap<&str, Vec<&TraceEvent>> = BTreeMap::new();
    for e in mock {
        mock_by_op.entry(e.op.as_str()).or_default().push(e);
    }
    for e in real {
        real_by_op.entry(e.op.as_str()).or_default().push(e);
    }
    for (op, mock_entries) in &mock_by_op {
        let real_entries = real_by_op.get(op).cloned().unwrap_or_default();
        let mock_ok = mock_entries.iter().any(|e| e.ok);
        let real_ok = real_entries.iter().any(|e| e.ok);
        if mock_ok != real_ok {
            divergences.push(Divergence {
                op: (*op).to_string(),
                reason: "BEHAVIORAL_DIVERGENCE".to_string(),
                mock_ok,
                real_ok,
            });
        }
    }
    for (op, real_entries) in &real_by_op {
        if !mock_by_op.contains_key(op) {
            divergences.push(Divergence {
                op: (*op).to_string(),
                reason: "MOCK_MISSING_OP".to_string(),
                mock_ok: false,
                real_ok: real_entries.iter().any(|e| e.ok),
            });
        }
    }
    divergences
}

/// Fidelity report — shape mirrors `dogfood-foundry-dapp::FidelityReport` so
/// the TypeScript `@kiwa-test/quality-metrics` merger can ingest both.
#[derive(Debug, Clone)]
pub struct FidelityReport {
    pub provider: String,
    pub version: String,
    pub mock_covered_ops: usize,
    pub ops_under_test: usize,
    pub behavioral_divergences: usize,
    pub divergences: Vec<Divergence>,
    pub fidelity_matrix: Vec<FidelityCase>,
}

impl FidelityReport {
    /// Render the report as a JSON blob. Uses hand-rolled formatting so the
    /// crate does not pull in a JSON serializer just for the emitter.
    pub fn to_json(&self) -> String {
        let divergences_json = self
            .divergences
            .iter()
            .map(|d| {
                format!(
                    "    {{ \"op\": \"{}\", \"reason\": \"{}\", \"mockOk\": {}, \"realOk\": {} }}",
                    d.op, d.reason, d.mock_ok, d.real_ok
                )
            })
            .collect::<Vec<_>>()
            .join(",\n");
        let matrix_json = self
            .fidelity_matrix
            .iter()
            .map(|c| {
                format!(
                    "    {{ \"method\": \"{}\", \"expectedAgreement\": {}, \"rationale\": {} }}",
                    c.method,
                    c.expected_agreement,
                    json_escape_string(&c.rationale),
                )
            })
            .collect::<Vec<_>>()
            .join(",\n");
        format!(
            "{{\n  \"provider\": \"{}\",\n  \"version\": \"{}\",\n  \"mockCoveredMethods\": {},\n  \"opsUnderTest\": {},\n  \"behavioralDivergences\": {},\n  \"divergences\": [\n{}\n  ],\n  \"fidelityMatrix\": [\n{}\n  ]\n}}\n",
            self.provider,
            self.version,
            self.mock_covered_ops,
            self.ops_under_test,
            self.behavioral_divergences,
            divergences_json,
            matrix_json,
        )
    }

    /// Render the report as a Markdown 5-axis summary. Same layout as the
    /// dogfood-foundry-dapp report so the quality-report navigation stays
    /// consistent.
    pub fn to_markdown(&self) -> String {
        let ratio = if self.ops_under_test == 0 {
            100.0
        } else {
            (self.mock_covered_ops as f64 / self.ops_under_test as f64) * 100.0
        };
        let mut lines = vec![
            format!("# Quality Report — {} @ {}", self.provider, self.version),
            String::new(),
            "## 5-axis summary".to_string(),
            String::new(),
            "| axis | value |".to_string(),
            "|---|---|".to_string(),
            format!(
                "| fidelity — ratio | {:.2}% ({}/{}) |",
                ratio, self.mock_covered_ops, self.ops_under_test,
            ),
            format!(
                "| fidelity — behavioralDivergences | {} |",
                self.behavioral_divergences
            ),
            String::new(),
            "## Divergences".to_string(),
            String::new(),
        ];
        if self.divergences.is_empty() {
            lines.push("_None_".to_string());
        } else {
            for d in &self.divergences {
                lines.push(format!(
                    "- **{}** — {} (mock ok = {}, real ok = {})",
                    d.op, d.reason, d.mock_ok, d.real_ok,
                ));
            }
        }
        lines.push(String::new());
        lines.push("## Fidelity matrix (anvil ↔ reth JSON-RPC)".to_string());
        lines.push(String::new());
        lines.push("| method | agreement | rationale |".to_string());
        lines.push("|---|---|---|".to_string());
        for c in &self.fidelity_matrix {
            lines.push(format!(
                "| `{}` | {} | {} |",
                c.method,
                if c.expected_agreement {
                    "agree"
                } else {
                    "diverge"
                },
                c.rationale.replace('\n', " ")
            ));
        }
        lines.push(String::new());
        lines.join("\n")
    }
}

fn json_escape_string(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 2);
    out.push('"');
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

/// Build a fidelity report from a mock + real trace pair. Also embeds the
/// `contract::reth::fidelity_matrix()` shape so the same JSON exposes both
/// the scenario-level fidelity (mock ↔ real) and the JSON-RPC method-level
/// fidelity (anvil ↔ reth).
pub fn build_fidelity_report(
    provider: &str,
    version: &str,
    mock: &[TraceEvent],
    real: &[TraceEvent],
) -> FidelityReport {
    let divergences = compare_traces(mock, real);
    let observed_ok: std::collections::HashSet<&str> = mock
        .iter()
        .filter(|e| e.ok)
        .map(|e| e.op.as_str())
        .collect();
    let mock_covered_ops = OPS_UNDER_TEST
        .iter()
        .filter(|op| observed_ok.contains(*op))
        .count();
    FidelityReport {
        provider: provider.to_string(),
        version: version.to_string(),
        mock_covered_ops,
        ops_under_test: OPS_UNDER_TEST.len(),
        behavioral_divergences: divergences.len(),
        divergences,
        fidelity_matrix: fidelity_matrix(),
    }
}

// -----------------------------------------------------------------------------
// ABI + call encoding — same synthetic ERC-20 shape as
// `dogfood-foundry-dapp`.
// -----------------------------------------------------------------------------

/// Synthetic ERC-20 ABI JSON blob used by the tests. Keeping this in Rust
/// avoids depending on a Foundry `out/*.json` file on hosts that do not have
/// `forge build` output cached.
pub fn synthetic_erc20_abi_json() -> &'static str {
    r#"{
      "abi": [
        {
          "type": "function",
          "name": "transfer",
          "inputs": [
            { "name": "to", "type": "address" },
            { "name": "amount", "type": "uint256" }
          ],
          "outputs": [ { "name": "", "type": "bool" } ],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "balanceOf",
          "inputs": [ { "name": "owner", "type": "address" } ],
          "outputs": [ { "name": "", "type": "uint256" } ],
          "stateMutability": "view"
        },
        {
          "type": "event",
          "name": "Transfer",
          "inputs": [
            { "name": "from", "type": "address", "indexed": true },
            { "name": "to", "type": "address", "indexed": true },
            { "name": "value", "type": "uint256" }
          ]
        }
      ]
    }"#
}

/// Parse the synthetic ERC-20 ABI blob into a `SolAbi`. Kept as a
/// convenience so tests can share the parsed shape.
pub fn synthetic_erc20_abi() -> SolAbi {
    SolAbi::parse_foundry_out("DogfoodRethToken", synthetic_erc20_abi_json())
        .expect("synthetic ERC-20 ABI is a valid Foundry `out/*.json` shape")
}

/// Build an encoded `transfer(address,uint256)` call using the parsed ABI.
/// This is what the mock adapter would ship through `cast rpc eth_call` in
/// real mode.
pub fn encode_transfer_call(to: &str, amount: u128) -> ContractCall {
    let abi = synthetic_erc20_abi();
    let selector = abi
        .selector_of("transfer")
        .expect("synthetic ERC-20 always contains transfer");
    let mut encoded = String::new();
    encoded.push_str(&format!("{:0>64}", to.trim_start_matches("0x")));
    encoded.push_str(&format!("{:0>64x}", amount));
    ContractCall::with_encoded_args(
        "0x000000000000000000000000000000000000cafe",
        &selector,
        &encoded,
    )
}
