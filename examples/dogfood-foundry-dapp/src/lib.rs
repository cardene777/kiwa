//! Dogfood app 3 (v1.11-4) — Solidity ERC20 contract driven from Rust
//! through `kiwa-test-rs`'s `contract::foundry` + `contract::alloy` adapters.
//!
//! Two adapters implement a provider-neutral `DAppAdapter` contract:
//!
//! - **mock adapter** — pure `kiwa-test-rs` shape (Foundry CLI absent). All
//!   ops fall through the graceful skip pattern, so the harness records
//!   deterministic outcomes on any host.
//! - **real adapter** — checks Foundry availability via `FoundryEnv::detect`
//!   and runs `forge test` + `SolAbi::parse_foundry_out` when the CLI is
//!   present. When it is not, the adapter reports `SUPABASE`-style
//!   `FOUNDRY_ENV_MISSING` for every op so the fidelity harness observes
//!   the divergence.

use std::collections::BTreeMap;
use std::path::PathBuf;

use kiwa::contract::alloy::{ContractCall, Provider, Signer, SolAbi};
use kiwa::contract::foundry::{FoundryEnv, ForgeTestOutput};

/// Trace entry recorded by each adapter operation. Mirrors the TypeScript
/// dogfood traces (`{ op, ok, errorKind, detail }`) so the fidelity harness
/// diffs both languages on the same shape.
#[derive(Debug, Clone)]
pub struct TraceEvent {
    pub op: String,
    pub ok: bool,
    pub error_kind: Option<String>,
    pub detail: Option<String>,
}

impl TraceEvent {
    pub fn ok(op: &str) -> Self {
        Self { op: op.to_string(), ok: true, error_kind: None, detail: None }
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

/// Provider-neutral dApp contract shape. Both mock + real adapters implement
/// this so the fidelity harness diffs their outputs by op name.
pub trait DAppAdapter {
    fn mode(&self) -> &'static str;
    fn traces(&self) -> Vec<TraceEvent>;

    /// Run `forge test` on the project rooted at `project_root`.
    fn run_forge_test(&mut self, project_root: &std::path::Path) -> ForgeTestOutput;

    /// Parse a `out/DogfoodToken.json` file into a SolAbi + surface a couple
    /// of properties the harness asserts against.
    fn inspect_abi(&mut self, abi_json: &str) -> AbiSnapshot;

    /// Emit an encoded `transfer(address,uint256)` call ready for
    /// `cast rpc eth_call` or an alloy `SolCall::abi_encode`.
    fn encode_transfer_call(&mut self, to: &str, amount: u128) -> Option<ContractCall>;

    /// Report the Foundry environment shape (mode + which binaries are on PATH).
    fn detect_foundry(&mut self) -> FoundryDetect;

    /// Describe the `Signer` variant this adapter would use for a call.
    fn describe_signer(&mut self) -> Signer;

    /// Describe the `Provider` variant this adapter would connect to.
    fn describe_provider(&mut self, port: u16) -> Provider;

    fn reset(&mut self);
}

/// Snapshot of the parsed ABI + a few useful derived fields.
#[derive(Debug, Clone)]
pub struct AbiSnapshot {
    pub contract_name: String,
    pub function_count: usize,
    pub event_count: usize,
    pub transfer_selector: Option<String>,
    pub balance_of_selector: Option<String>,
}

/// Foundry environment summary — surfaces which binaries the adapter found.
#[derive(Debug, Clone)]
pub struct FoundryDetect {
    pub forge_available: bool,
    pub cast_available: bool,
    pub anvil_available: bool,
    pub all_available: bool,
}

impl From<&FoundryEnv> for FoundryDetect {
    fn from(env: &FoundryEnv) -> Self {
        Self {
            forge_available: env.forge_available,
            cast_available: env.cast_available,
            anvil_available: env.anvil_available,
            all_available: env.all_available(),
        }
    }
}

/// Mock adapter — never invokes the Foundry CLI (even if it happens to be on
/// PATH). Used as the deterministic baseline the real adapter is diffed
/// against in the fidelity harness.
pub struct MockAdapter {
    trace: Vec<TraceEvent>,
}

impl MockAdapter {
    pub fn new() -> Self {
        Self { trace: Vec::new() }
    }
}

impl Default for MockAdapter {
    fn default() -> Self {
        Self::new()
    }
}

impl DAppAdapter for MockAdapter {
    fn mode(&self) -> &'static str {
        "mock"
    }
    fn traces(&self) -> Vec<TraceEvent> {
        self.trace.clone()
    }

    fn run_forge_test(&mut self, _project_root: &std::path::Path) -> ForgeTestOutput {
        // Deterministic skip — mirrors kiwa's graceful skip pattern.
        self.trace.push(TraceEvent::ok("run_forge_test").with_detail("skipped"));
        ForgeTestOutput::skipped("mock adapter always skips forge test")
    }

    fn inspect_abi(&mut self, abi_json: &str) -> AbiSnapshot {
        match SolAbi::parse_foundry_out("DogfoodToken", abi_json) {
            Ok(abi) => {
                let snapshot = AbiSnapshot {
                    contract_name: abi.contract_name.clone(),
                    function_count: abi.items_by_kind.get("function").map(|v| v.len()).unwrap_or(0),
                    event_count: abi.items_by_kind.get("event").map(|v| v.len()).unwrap_or(0),
                    transfer_selector: abi.selector_of("transfer"),
                    balance_of_selector: abi.selector_of("balanceOf"),
                };
                self.trace.push(TraceEvent::ok("inspect_abi").with_detail(&format!(
                    "functions={} events={}",
                    snapshot.function_count, snapshot.event_count,
                )));
                snapshot
            }
            Err(err) => {
                self.trace.push(TraceEvent::err("inspect_abi", &err));
                AbiSnapshot {
                    contract_name: String::new(),
                    function_count: 0,
                    event_count: 0,
                    transfer_selector: None,
                    balance_of_selector: None,
                }
            }
        }
    }

    fn encode_transfer_call(&mut self, to: &str, amount: u128) -> Option<ContractCall> {
        let selector = "0xa9059cbb"; // transfer(address,uint256)
        let mut encoded = String::new();
        encoded.push_str(&format!("{:0>64}", to.trim_start_matches("0x")));
        encoded.push_str(&format!("{:0>64x}", amount));
        let call = ContractCall::with_encoded_args(
            "0x0000000000000000000000000000000000000cafe",
            selector,
            &encoded,
        );
        self.trace.push(TraceEvent::ok("encode_transfer_call").with_detail(&call.data_hex));
        Some(call)
    }

    fn detect_foundry(&mut self) -> FoundryDetect {
        // Report as if Foundry were absent so the mock stays deterministic.
        let detect = FoundryDetect {
            forge_available: false,
            cast_available: false,
            anvil_available: false,
            all_available: false,
        };
        self.trace.push(TraceEvent::ok("detect_foundry"));
        detect
    }

    fn describe_signer(&mut self) -> Signer {
        let signer = Signer::LocalWallet {
            chain_id: 31337,
            seed_descriptor: "anvil-account-0".to_string(),
        };
        self.trace.push(TraceEvent::ok("describe_signer"));
        signer
    }

    fn describe_provider(&mut self, port: u16) -> Provider {
        let provider = Provider::anvil_http(port);
        self.trace.push(TraceEvent::ok("describe_provider"));
        provider
    }

    fn reset(&mut self) {
        self.trace.clear();
    }
}

/// Real adapter — uses `FoundryEnv::detect` to decide whether to actually
/// run the Foundry CLI. Ops that require the CLI record a graceful-skip
/// trace when the CLI is absent, so the fidelity harness can distinguish
/// "environment missing" from "adapter buggy".
pub struct RealAdapter {
    env: FoundryEnv,
    trace: Vec<TraceEvent>,
}

impl RealAdapter {
    pub fn new() -> Self {
        Self { env: FoundryEnv::detect(), trace: Vec::new() }
    }
}

impl Default for RealAdapter {
    fn default() -> Self {
        Self::new()
    }
}

impl DAppAdapter for RealAdapter {
    fn mode(&self) -> &'static str {
        "real"
    }
    fn traces(&self) -> Vec<TraceEvent> {
        self.trace.clone()
    }

    fn run_forge_test(&mut self, project_root: &std::path::Path) -> ForgeTestOutput {
        if !self.env.forge_available {
            let out = ForgeTestOutput::skipped("forge not on PATH");
            self.trace.push(TraceEvent::err("run_forge_test", "FOUNDRY_ENV_MISSING"));
            return out;
        }
        match self.env.forge_test(project_root) {
            Ok(out) => {
                if out.success {
                    self.trace.push(TraceEvent::ok("run_forge_test"));
                } else {
                    self.trace
                        .push(TraceEvent::err("run_forge_test", "FORGE_TEST_NON_ZERO"));
                }
                out
            }
            Err(err) => {
                self.trace.push(TraceEvent::err("run_forge_test", &err.to_string()));
                ForgeTestOutput::skipped("forge test errored")
            }
        }
    }

    fn inspect_abi(&mut self, abi_json: &str) -> AbiSnapshot {
        MockAdapter::new().inspect_abi(abi_json)
    }

    fn encode_transfer_call(&mut self, to: &str, amount: u128) -> Option<ContractCall> {
        // Same encoding logic as the mock — the point of the "real" side is
        // that this call would be shipped through `cast rpc` when the CLI
        // is available, not that the encoding differs.
        let mut mock = MockAdapter::new();
        let call = mock.encode_transfer_call(to, amount);
        self.trace.push(TraceEvent::ok("encode_transfer_call"));
        call
    }

    fn detect_foundry(&mut self) -> FoundryDetect {
        let detect = FoundryDetect::from(&self.env);
        self.trace.push(TraceEvent::ok("detect_foundry").with_detail(&format!(
            "forge={} cast={} anvil={}",
            detect.forge_available, detect.cast_available, detect.anvil_available,
        )));
        detect
    }

    fn describe_signer(&mut self) -> Signer {
        let signer = Signer::LocalWallet {
            chain_id: 31337,
            seed_descriptor: "env:ANVIL_PRIVATE_KEY".to_string(),
        };
        self.trace.push(TraceEvent::ok("describe_signer"));
        signer
    }

    fn describe_provider(&mut self, port: u16) -> Provider {
        let provider = Provider::anvil_http(port);
        self.trace.push(TraceEvent::ok("describe_provider"));
        provider
    }

    fn reset(&mut self) {
        self.trace.clear();
    }
}

/// A synthetic ERC-20 ABI JSON blob used as a stand-in when the harness
/// does not have Foundry CLI to emit one at test time.
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
          "type": "function",
          "name": "totalSupply",
          "inputs": [],
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

/// Convenience — a common project root the fidelity harness uses for
/// `run_forge_test`. Resolved relative to the manifest so callers do not
/// have to depend on cwd.
pub fn dogfood_project_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
}

/// Ops the fidelity harness measures across both adapters.
pub const OPS_UNDER_TEST: &[&str] = &[
    "run_forge_test",
    "inspect_abi",
    "encode_transfer_call",
    "detect_foundry",
    "describe_signer",
    "describe_provider",
];

/// Divergence entry — mirrors the TypeScript shape.
#[derive(Debug, Clone)]
pub struct Divergence {
    pub op: String,
    pub reason: String,
    pub mock_ok: bool,
    pub real_ok: bool,
}

/// Compare traces from a mock + real adapter and return the divergences.
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

/// Fidelity report shape — mirrors the TypeScript emitter format so a
/// downstream consumer can merge this JSON into `docs/quality-reports/`.
#[derive(Debug, Clone)]
pub struct FidelityReport {
    pub provider: String,
    pub version: String,
    pub mock_covered_ops: usize,
    pub ops_under_test: usize,
    pub behavioral_divergences: usize,
    pub divergences: Vec<Divergence>,
}

impl FidelityReport {
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
        format!(
            "{{\n  \"provider\": \"{}\",\n  \"version\": \"{}\",\n  \"mockCoveredMethods\": {},\n  \"opsUnderTest\": {},\n  \"behavioralDivergences\": {},\n  \"divergences\": [\n{}\n  ]\n}}\n",
            self.provider,
            self.version,
            self.mock_covered_ops,
            self.ops_under_test,
            self.behavioral_divergences,
            divergences_json,
        )
    }

    pub fn to_markdown(&self) -> String {
        let mut lines = vec![
            format!("# Quality Report — {} @ {}", self.provider, self.version),
            String::new(),
            "## 5-axis summary".to_string(),
            String::new(),
            "| axis | value |".to_string(),
            "|---|---|".to_string(),
            format!(
                "| fidelity — ratio | {}% ({}/{}) |",
                if self.ops_under_test == 0 {
                    100.0
                } else {
                    (self.mock_covered_ops as f64 / self.ops_under_test as f64) * 100.0
                },
                self.mock_covered_ops,
                self.ops_under_test,
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
        lines.join("\n")
    }
}

/// Build the fidelity report from a run's traces.
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
    }
}
