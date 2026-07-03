//! Foundry invariant / fuzz runner + `forge script` broadcast wrapper — v0.5.
//!
//! Foundry's `forge test` grows two extra dimensions on top of the plain unit
//! test path this module wraps:
//!
//! - **invariant tests** — the `forge test --match-contract Invariant*` +
//!   `foundry.toml` `[invariant]` section drives a state-explorer that
//!   randomly walks the target contract set until it finds a counter-example
//!   or the run budget elapses. The default budget is 256 runs × 15 depth;
//!   real kiwa users bump the run count to 10 000+ for release-gate confidence.
//! - **stateless fuzz tests** — the `forge test --match-test testFuzz_*` path
//!   picks random primitive inputs on every run, subject to the
//!   `foundry.toml` `[fuzz]` section (`runs` + `seed`).
//!
//! This submodule wraps both under a single [`invariant_run`] entry point that
//! renders the CLI invocation, captures stdout/stderr, and parses the failure
//! reproducer/shrink summary Foundry emits when a counter-example lands. The
//! same handle also exposes a `forge script --broadcast` wrapper through
//! [`forge_script`] so kiwa integration tests can simulate deployment
//! scripts end-to-end (without actually broadcasting — the `--dry-run` flag
//! is on by default).
//!
//! ## Design
//!
//! The module reuses the [`FoundryEnv`] path resolution from
//! [`super`] so the two runners share the "forge not on PATH → return
//! `skipped`" contract. Consumers pass in a [`InvariantOptions`] configured
//! with the run count and RNG seed (both are forwarded to Foundry via
//! `FOUNDRY_INVARIANT_RUNS` / `FOUNDRY_INVARIANT_SEED` env vars, which
//! Foundry v0.2.x reads at startup — env plumbing keeps the wrapper free of
//! `foundry.toml` mutation and stays deterministic across parallel test
//! invocations).
//!
//! ## Example
//!
//! ```no_run
//! use kiwa::contract::foundry::{FoundryEnv, invariant::{invariant_run, InvariantOptions}};
//!
//! # fn main() -> Result<(), Box<dyn std::error::Error>> {
//! let env = FoundryEnv::detect();
//! let report = invariant_run(
//!     &env,
//!     std::path::Path::new("."),
//!     &InvariantOptions {
//!         runs: 10_000,
//!         seed: Some(0xdead_beef),
//!         match_contract: Some("InvariantERC20".to_string()),
//!         match_test: None,
//!         extra_forge_args: Vec::new(),
//!     },
//! )?;
//! if report.skipped {
//!     eprintln!("forge not on PATH — invariant run skipped");
//! } else {
//!     assert_eq!(report.outcome, kiwa::contract::foundry::InvariantOutcome::Passed);
//! }
//! # Ok(())
//! # }
//! ```

use std::path::Path;
use std::process::{Command, Stdio};

use super::FoundryEnv;

/// Options accepted by [`invariant_run`]. Every field maps to a CLI flag or
/// env var Foundry consumes.
#[derive(Debug, Clone)]
pub struct InvariantOptions {
    /// Number of invariant runs — forwarded to `FOUNDRY_INVARIANT_RUNS`.
    /// Default in Foundry is 256; kiwa release-gate suites use 10_000.
    pub runs: u32,
    /// RNG seed — forwarded to `FOUNDRY_INVARIANT_SEED` + `FOUNDRY_FUZZ_SEED`.
    /// When `Some(_)`, the run is fully deterministic; when `None`, Foundry
    /// picks a fresh seed per invocation.
    pub seed: Option<u64>,
    /// `--match-contract <regex>` — restrict the run to invariant contracts
    /// whose name matches.
    pub match_contract: Option<String>,
    /// `--match-test <regex>` — restrict the run to test functions whose name
    /// matches. Useful for stateless fuzz tests (`testFuzz_*`).
    pub match_test: Option<String>,
    /// Extra CLI flags appended after the invariant-specific ones. Escape
    /// hatch for future-Foundry flags kiwa does not model.
    pub extra_forge_args: Vec<String>,
}

impl Default for InvariantOptions {
    fn default() -> Self {
        Self {
            runs: 10_000,
            seed: None,
            match_contract: None,
            match_test: None,
            extra_forge_args: Vec::new(),
        }
    }
}

/// Outcome of an invariant / fuzz run.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum InvariantOutcome {
    /// Every run completed without a counter-example.
    Passed,
    /// At least one run produced a counter-example; the shrink summary lives
    /// in [`InvariantRunReport::shrink`].
    Failed,
    /// The run was short-circuited (forge missing).
    Skipped,
}

/// Structured result of one [`invariant_run`] invocation.
#[derive(Debug, Clone)]
pub struct InvariantRunReport {
    /// High-level outcome.
    pub outcome: InvariantOutcome,
    /// Number of runs actually executed (parsed from Foundry stdout when the
    /// report is `Passed`, otherwise the requested [`InvariantOptions::runs`]).
    pub runs_executed: u32,
    /// Seed the run used — populated from [`InvariantOptions::seed`] when the
    /// caller supplied one.
    pub seed: Option<u64>,
    /// Parsed shrink summary, populated when `outcome == Failed`.
    pub shrink: Option<ShrinkResult>,
    /// Whether the run was skipped because forge was missing.
    pub skipped: bool,
    /// The fully-rendered command line — surfaced for assertions in tests.
    pub command: String,
    /// stdout captured from the CLI.
    pub stdout: String,
    /// stderr captured from the CLI.
    pub stderr: String,
}

/// Foundry shrink-summary parser output. Populated when the runner lands a
/// counter-example.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ShrinkResult {
    /// Test function that failed — e.g. `invariant_totalSupplyEqSumOfBalances`.
    pub test_name: String,
    /// One-line reason string parsed from the `[FAIL. Reason: ...]` header.
    pub reason: String,
    /// Ordered list of `(target, sig, args)` triples the shrinker settled on.
    /// Each entry mirrors a `sequence: caller=... target=... calldata=...`
    /// stanza Foundry prints when the run fails.
    pub sequence: Vec<ShrinkStep>,
}

/// One step in the shrunk counter-example sequence.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ShrinkStep {
    /// Contract address the call went to.
    pub target: String,
    /// ABI signature — e.g. `transfer(address,uint256)`.
    pub signature: String,
    /// ABI-encoded calldata (hex-encoded, `0x`-prefixed).
    pub calldata: String,
}

/// `forge script` broadcast wrapper — v0.5.
#[derive(Debug, Clone)]
pub struct ScriptBroadcastReport {
    /// Whether the invocation exited zero.
    pub success: bool,
    /// True when forge was missing so the wrapper short-circuited.
    pub skipped: bool,
    /// Whether the caller opted into `--broadcast`. When `false`, the run was
    /// a simulation (Foundry default).
    pub broadcast: bool,
    /// Path to the script file the wrapper invoked — e.g. `script/Deploy.s.sol`.
    pub script_path: String,
    /// Fully-rendered command line.
    pub command: String,
    /// stdout captured from the CLI.
    pub stdout: String,
    /// stderr captured from the CLI.
    pub stderr: String,
}

/// Run `forge test` in invariant mode. Returns [`InvariantRunReport`] with a
/// parsed shrink summary when Foundry surfaces one.
pub fn invariant_run(
    env: &FoundryEnv,
    project_root: &Path,
    opts: &InvariantOptions,
) -> std::io::Result<InvariantRunReport> {
    if !env.forge_available {
        return Ok(InvariantRunReport {
            outcome: InvariantOutcome::Skipped,
            runs_executed: 0,
            seed: opts.seed,
            shrink: None,
            skipped: true,
            command: String::new(),
            stdout: String::new(),
            stderr: "forge not on PATH".to_string(),
        });
    }
    let mut cmd = Command::new(&env.forge_path);
    cmd.arg("test").current_dir(project_root);
    let mut command_str = String::from("forge test");
    if let Some(ref contract) = opts.match_contract {
        cmd.arg("--match-contract").arg(contract);
        command_str.push_str(" --match-contract ");
        command_str.push_str(contract);
    }
    if let Some(ref test) = opts.match_test {
        cmd.arg("--match-test").arg(test);
        command_str.push_str(" --match-test ");
        command_str.push_str(test);
    }
    for a in &opts.extra_forge_args {
        cmd.arg(a);
        command_str.push(' ');
        command_str.push_str(a);
    }
    // Deterministic env plumbing — Foundry reads these at startup and they
    // override any `foundry.toml` value so parallel test invocations do not
    // race on the config file.
    cmd.env("FOUNDRY_INVARIANT_RUNS", opts.runs.to_string());
    cmd.env("FOUNDRY_FUZZ_RUNS", opts.runs.to_string());
    if let Some(seed) = opts.seed {
        cmd.env("FOUNDRY_INVARIANT_SEED", format!("0x{seed:016x}"));
        cmd.env("FOUNDRY_FUZZ_SEED", format!("0x{seed:016x}"));
    }
    cmd.stdout(Stdio::piped()).stderr(Stdio::piped());
    let output = cmd.output()?;
    let stdout = String::from_utf8_lossy(&output.stdout).into_owned();
    let stderr = String::from_utf8_lossy(&output.stderr).into_owned();
    let (outcome, shrink, runs_executed) =
        classify_invariant_output(&stdout, output.status.success(), opts.runs);
    Ok(InvariantRunReport {
        outcome,
        runs_executed,
        seed: opts.seed,
        shrink,
        skipped: false,
        command: command_str,
        stdout,
        stderr,
    })
}

/// Wrap `forge script <path>` with an optional `--broadcast` flag.
///
/// The default is *dry-run* — kiwa integration tests almost always want to
/// simulate deployment scripts without touching a real chain. When
/// `broadcast` is `true`, the wrapper appends `--broadcast` so the script
/// executes against the target RPC.
pub fn forge_script(
    env: &FoundryEnv,
    project_root: &Path,
    script_path: &str,
    rpc_url: &str,
    broadcast: bool,
    extra_args: &[&str],
) -> std::io::Result<ScriptBroadcastReport> {
    if !env.forge_available {
        return Ok(ScriptBroadcastReport {
            success: false,
            skipped: true,
            broadcast,
            script_path: script_path.to_string(),
            command: String::new(),
            stdout: String::new(),
            stderr: "forge not on PATH".to_string(),
        });
    }
    let mut cmd = Command::new(&env.forge_path);
    cmd.arg("script")
        .arg(script_path)
        .arg("--rpc-url")
        .arg(rpc_url)
        .current_dir(project_root);
    let mut command_str = format!("forge script {script_path} --rpc-url {rpc_url}");
    if broadcast {
        cmd.arg("--broadcast");
        command_str.push_str(" --broadcast");
    }
    for a in extra_args {
        cmd.arg(a);
        command_str.push(' ');
        command_str.push_str(a);
    }
    cmd.stdout(Stdio::piped()).stderr(Stdio::piped());
    let output = cmd.output()?;
    let stdout = String::from_utf8_lossy(&output.stdout).into_owned();
    let stderr = String::from_utf8_lossy(&output.stderr).into_owned();
    Ok(ScriptBroadcastReport {
        success: output.status.success(),
        skipped: false,
        broadcast,
        script_path: script_path.to_string(),
        command: command_str,
        stdout,
        stderr,
    })
}

/// Parse a Foundry invariant-failure stdout blob into a [`ShrinkResult`].
/// Exposed publicly so users can feed canned CLI output through the parser
/// in unit tests.
pub fn parse_invariant_shrink(stdout: &str) -> Option<ShrinkResult> {
    let fail_line = stdout.lines().find(|l| l.contains("[FAIL. Reason:"))?;
    let test_name = fail_line
        .split_whitespace()
        .find(|tok| {
            tok.starts_with("invariant_")
                || tok.starts_with("testFuzz_")
                || tok.starts_with("test_")
        })
        .unwrap_or("")
        .trim_end_matches("()")
        .to_string();
    let reason = extract_between(fail_line, "Reason:", "]")
        .map(|s| s.trim().to_string())
        .unwrap_or_default();
    let sequence = parse_shrink_sequence(stdout);
    Some(ShrinkResult {
        test_name,
        reason,
        sequence,
    })
}

fn classify_invariant_output(
    stdout: &str,
    exited_zero: bool,
    requested_runs: u32,
) -> (InvariantOutcome, Option<ShrinkResult>, u32) {
    if let Some(shrink) = parse_invariant_shrink(stdout) {
        return (InvariantOutcome::Failed, Some(shrink), requested_runs);
    }
    let outcome = if exited_zero {
        InvariantOutcome::Passed
    } else {
        InvariantOutcome::Failed
    };
    let runs = parse_runs_executed(stdout).unwrap_or(requested_runs);
    (outcome, None, runs)
}

fn parse_runs_executed(stdout: &str) -> Option<u32> {
    // Foundry surfaces `runs: N, μ: X, ~: Y` in invariant summaries. We take
    // the first `runs: N` we see.
    for l in stdout.lines() {
        if let Some(rest) = l.split_once("runs:") {
            let raw = rest.1.trim_start();
            let n: String = raw.chars().take_while(|c| c.is_ascii_digit()).collect();
            if let Ok(v) = n.parse() {
                return Some(v);
            }
        }
    }
    None
}

fn parse_shrink_sequence(stdout: &str) -> Vec<ShrinkStep> {
    let mut out = Vec::new();
    for line in stdout.lines() {
        let trimmed = line.trim_start();
        if !trimmed.starts_with("sequence:") {
            continue;
        }
        let body = trimmed.trim_start_matches("sequence:").trim();
        let target = extract_kv(body, "target=").unwrap_or_default();
        let signature = extract_kv(body, "sig=").unwrap_or_default();
        let calldata = extract_kv(body, "calldata=").unwrap_or_default();
        out.push(ShrinkStep {
            target,
            signature,
            calldata,
        });
    }
    out
}

fn extract_kv(body: &str, key: &str) -> Option<String> {
    // Locate `key` and slice the value at the next whitespace-followed-by-
    // known-key boundary. Foundry emits `sig=name(uint256,address)` with
    // internal commas, so a naive comma stop is wrong — commas inside the
    // signature must survive. We stop when we hit ` <key>=` for one of the
    // three known keys ("target=", "sig=", "calldata=") or end-of-string.
    let start = body.find(key)?;
    let rest = &body[start + key.len()..];
    let stops = [" target=", " sig=", " calldata="];
    let end = stops
        .iter()
        .filter_map(|s| rest.find(s))
        .min()
        .unwrap_or(rest.len());
    Some(rest[..end].trim().to_string())
}

fn extract_between(s: &str, start: &str, end: &str) -> Option<String> {
    let start_idx = s.find(start)? + start.len();
    let end_idx = s[start_idx..].find(end)? + start_idx;
    Some(s[start_idx..end_idx].to_string())
}
