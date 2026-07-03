//! Foundry integration — `forge`, `cast`, and `anvil` from Rust.
//!
//! This module supplies a thin, testable layer over the Foundry CLI tools so
//! kiwa users can drive contract tests entirely from Rust without hand-rolling
//! subprocess plumbing. Two entry points anchor the API:
//!
//! - [`FoundryEnv::detect`] — locate the CLI binaries + report on availability
//!   without failing the whole test run when Foundry is not installed. This is
//!   the pattern the kiwa contract-rust layer uses to skip tests gracefully in
//!   CI environments that do not provision Foundry.
//! - [`Anvil::spawn_deterministic`] — spawn `anvil --deterministic` on a chosen
//!   port with automatic `Drop`-based tear-down.
//!
//! `forge test --coverage` + `cast` helpers are exposed as methods on
//! [`FoundryEnv`] so a single `FoundryEnv` handle is enough to run an entire
//! contract test suite from a Rust integration test file.
//!
//! ## Design
//!
//! Foundry's CLI output is stable enough for `serde_json` parsing on the
//! coverage path (`forge coverage --report lcov` + `--report summary`). The
//! module treats `stdout` as the source of truth on the happy path and falls
//! back to `stderr` in error messages so failures surface actionable context
//! (typically "forge not on PATH" or "no test target matched").
//!
//! ## Example
//!
//! ```no_run
//! use kiwa::contract::foundry::{FoundryEnv, Anvil};
//!
//! # fn main() -> Result<(), Box<dyn std::error::Error>> {
//! let env = FoundryEnv::detect();
//! if !env.forge_available {
//!     eprintln!("forge not on PATH, skipping contract tests");
//!     return Ok(());
//! }
//! let anvil = Anvil::spawn_deterministic(8545)?;
//! let out = env.forge_test(std::path::Path::new("."))?;
//! assert!(out.success);
//! drop(anvil);
//! # Ok(())
//! # }
//! ```

use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::time::{Duration, Instant};

pub mod invariant;
pub use invariant::{
    forge_script, invariant_run, parse_invariant_shrink, InvariantOptions, InvariantOutcome,
    InvariantRunReport, ScriptBroadcastReport, ShrinkResult,
};

/// Available Foundry CLI binaries and their resolved paths on PATH.
#[derive(Debug, Clone)]
pub struct FoundryEnv {
    /// Whether `forge` was found on PATH.
    pub forge_available: bool,
    /// Whether `cast` was found on PATH.
    pub cast_available: bool,
    /// Whether `anvil` was found on PATH.
    pub anvil_available: bool,
    /// Resolved path to `forge` (empty when not available).
    pub forge_path: PathBuf,
    /// Resolved path to `cast`.
    pub cast_path: PathBuf,
    /// Resolved path to `anvil`.
    pub anvil_path: PathBuf,
}

impl FoundryEnv {
    /// Probe PATH for the three Foundry binaries. Never fails — callers use
    /// the boolean flags to decide whether to skip a test suite.
    pub fn detect() -> Self {
        Self {
            forge_available: which("forge").is_some(),
            cast_available: which("cast").is_some(),
            anvil_available: which("anvil").is_some(),
            forge_path: which("forge").unwrap_or_default(),
            cast_path: which("cast").unwrap_or_default(),
            anvil_path: which("anvil").unwrap_or_default(),
        }
    }

    /// True when all three (forge / cast / anvil) are available.
    pub fn all_available(&self) -> bool {
        self.forge_available && self.cast_available && self.anvil_available
    }

    /// Run `forge test` in the given project directory. When the CLI is not
    /// present, returns [`ForgeTestOutput::skipped`] so tests can short-circuit
    /// without failing.
    pub fn forge_test(&self, project_root: &Path) -> std::io::Result<ForgeTestOutput> {
        if !self.forge_available {
            return Ok(ForgeTestOutput::skipped("forge not on PATH"));
        }
        run_forge_test(&self.forge_path, project_root, &[])
    }

    /// Run `forge test --coverage --report lcov --report summary` and return
    /// the parsed coverage summary + raw lcov output.
    pub fn forge_coverage(&self, project_root: &Path) -> std::io::Result<CoverageReport> {
        if !self.forge_available {
            return Ok(CoverageReport::skipped());
        }
        run_forge_coverage(&self.forge_path, project_root)
    }

    /// Wrap `cast call <target> <sig> <args…> --rpc-url <url>`.
    pub fn cast_call(
        &self,
        rpc_url: &str,
        target: &str,
        sig: &str,
        args: &[&str],
    ) -> std::io::Result<CastOutput> {
        if !self.cast_available {
            return Ok(CastOutput::skipped("cast not on PATH"));
        }
        run_cast_call(&self.cast_path, rpc_url, target, sig, args)
    }

    /// Wrap `cast send <target> <sig> <args…> --rpc-url <url> --private-key <pk>`.
    pub fn cast_send(
        &self,
        rpc_url: &str,
        private_key: &str,
        target: &str,
        sig: &str,
        args: &[&str],
    ) -> std::io::Result<CastOutput> {
        if !self.cast_available {
            return Ok(CastOutput::skipped("cast not on PATH"));
        }
        run_cast_send(&self.cast_path, rpc_url, private_key, target, sig, args)
    }

    /// Wrap `cast rpc <method> <params…> --rpc-url <url>`.
    pub fn cast_rpc(
        &self,
        rpc_url: &str,
        method: &str,
        params: &[&str],
    ) -> std::io::Result<CastOutput> {
        if !self.cast_available {
            return Ok(CastOutput::skipped("cast not on PATH"));
        }
        run_cast_rpc(&self.cast_path, rpc_url, method, params)
    }
}

/// Result of `forge test`. `skipped` is set when the CLI was missing.
#[derive(Debug, Clone)]
pub struct ForgeTestOutput {
    /// Whether the invocation exited zero.
    pub success: bool,
    /// True when the run was short-circuited (e.g. forge missing).
    pub skipped: bool,
    /// Skip reason, populated only when `skipped` is true.
    pub skip_reason: Option<String>,
    /// stdout captured from the CLI.
    pub stdout: String,
    /// stderr captured from the CLI.
    pub stderr: String,
    /// Number of passing tests, parsed from the stdout summary line.
    pub tests_passed: Option<u32>,
    /// Number of failing tests, parsed from the stdout summary line.
    pub tests_failed: Option<u32>,
}

impl ForgeTestOutput {
    /// Build a skipped output with a reason.
    pub fn skipped(reason: &str) -> Self {
        Self {
            success: false,
            skipped: true,
            skip_reason: Some(reason.to_string()),
            stdout: String::new(),
            stderr: String::new(),
            tests_passed: None,
            tests_failed: None,
        }
    }
}

/// Parsed `forge coverage` output. `lcov` is the raw lcov text.
#[derive(Debug, Clone)]
pub struct CoverageReport {
    /// True when the CLI was missing so no coverage was collected.
    pub skipped: bool,
    /// Line coverage percentage (0.0 – 100.0) parsed from the summary table.
    pub line_coverage_pct: Option<f64>,
    /// Function coverage percentage parsed from the summary table.
    pub function_coverage_pct: Option<f64>,
    /// Branch coverage percentage parsed from the summary table.
    pub branch_coverage_pct: Option<f64>,
    /// Raw lcov text emitted by `forge coverage --report lcov`.
    pub lcov: String,
    /// Raw stdout / stderr for debugging.
    pub stdout: String,
    /// Raw stderr for debugging.
    pub stderr: String,
}

impl CoverageReport {
    /// Empty skipped report.
    pub fn skipped() -> Self {
        Self {
            skipped: true,
            line_coverage_pct: None,
            function_coverage_pct: None,
            branch_coverage_pct: None,
            lcov: String::new(),
            stdout: String::new(),
            stderr: String::new(),
        }
    }
}

/// Structured result of a `cast` invocation.
#[derive(Debug, Clone)]
pub struct CastOutput {
    /// Whether the invocation exited zero.
    pub success: bool,
    /// True when the CLI was missing.
    pub skipped: bool,
    /// stdout captured from the CLI (trimmed).
    pub stdout: String,
    /// stderr captured from the CLI.
    pub stderr: String,
    /// Fully-rendered command line — useful for assertions in tests.
    pub command: String,
}

impl CastOutput {
    fn skipped(reason: &str) -> Self {
        Self {
            success: false,
            skipped: true,
            stdout: String::new(),
            stderr: reason.to_string(),
            command: String::new(),
        }
    }
}

/// Handle to a spawned `anvil` node. Drops the child process when the handle
/// goes out of scope, mirroring the [`Drop`]-based cleanup pattern the rest of
/// kiwa uses.
pub struct Anvil {
    child: Option<Child>,
    port: u16,
    endpoint: String,
}

impl std::fmt::Debug for Anvil {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Anvil")
            .field("port", &self.port)
            .field("endpoint", &self.endpoint)
            .field("running", &self.child.is_some())
            .finish()
    }
}

impl Anvil {
    /// Spawn `anvil --port <port> --host 127.0.0.1` with deterministic
    /// accounts. When `anvil` is not on PATH the method returns an error whose
    /// `kind()` is `NotFound` so callers can distinguish "not installed" from
    /// "port in use".
    pub fn spawn_deterministic(port: u16) -> std::io::Result<Self> {
        Self::spawn_with_args(port, &["--deterministic"])
    }

    /// Lower-level spawn with custom CLI arguments appended after the standard
    /// port + host + accounts flags.
    pub fn spawn_with_args(port: u16, extra_args: &[&str]) -> std::io::Result<Self> {
        let path = which("anvil").ok_or_else(|| {
            std::io::Error::new(std::io::ErrorKind::NotFound, "anvil not on PATH")
        })?;
        let mut cmd = Command::new(path);
        cmd.arg("--port")
            .arg(port.to_string())
            .arg("--host")
            .arg("127.0.0.1")
            .arg("--accounts")
            .arg("10")
            .arg("--balance")
            .arg("10000");
        for arg in extra_args {
            cmd.arg(arg);
        }
        cmd.stdout(Stdio::piped()).stderr(Stdio::piped());
        let child = cmd.spawn()?;
        Ok(Self {
            child: Some(child),
            port,
            endpoint: format!("http://127.0.0.1:{port}"),
        })
    }

    /// JSON-RPC endpoint URL for the spawned node.
    pub fn endpoint(&self) -> &str {
        &self.endpoint
    }

    /// TCP port the node is bound to.
    pub fn port(&self) -> u16 {
        self.port
    }

    /// Wait until the RPC endpoint accepts a TCP connection or the timeout
    /// elapses. Real anvil takes ~200 ms to bind; the default timeout of
    /// 3 seconds is generous.
    pub fn wait_ready(&self, timeout: Duration) -> std::io::Result<()> {
        let deadline = Instant::now() + timeout;
        while Instant::now() < deadline {
            if std::net::TcpStream::connect(("127.0.0.1", self.port)).is_ok() {
                return Ok(());
            }
            std::thread::sleep(Duration::from_millis(50));
        }
        Err(std::io::Error::new(
            std::io::ErrorKind::TimedOut,
            format!("anvil on port {} did not start within {:?}", self.port, timeout),
        ))
    }

    /// Explicitly terminate the child. Called automatically by [`Drop`].
    pub fn stop(&mut self) {
        if let Some(mut child) = self.child.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }
}

impl Drop for Anvil {
    fn drop(&mut self) {
        self.stop();
    }
}

// -----------------------------------------------------------------------------
// Internal — subprocess plumbing + parsers.
// -----------------------------------------------------------------------------

fn which(name: &str) -> Option<PathBuf> {
    let path = std::env::var_os("PATH")?;
    for dir in std::env::split_paths(&path) {
        let candidate = dir.join(name);
        if candidate.is_file() {
            return Some(candidate);
        }
        let with_ext = candidate.with_extension(std::env::consts::EXE_EXTENSION);
        if with_ext.is_file() {
            return Some(with_ext);
        }
    }
    None
}

fn run_forge_test(
    forge_path: &Path,
    project_root: &Path,
    extra_args: &[&str],
) -> std::io::Result<ForgeTestOutput> {
    let mut cmd = Command::new(forge_path);
    cmd.arg("test").current_dir(project_root);
    for a in extra_args {
        cmd.arg(a);
    }
    cmd.stdout(Stdio::piped()).stderr(Stdio::piped());
    let output = cmd.output()?;
    let stdout = String::from_utf8_lossy(&output.stdout).into_owned();
    let stderr = String::from_utf8_lossy(&output.stderr).into_owned();
    let (tests_passed, tests_failed) = parse_forge_test_summary(&stdout);
    Ok(ForgeTestOutput {
        success: output.status.success(),
        skipped: false,
        skip_reason: None,
        stdout,
        stderr,
        tests_passed,
        tests_failed,
    })
}

fn run_forge_coverage(
    forge_path: &Path,
    project_root: &Path,
) -> std::io::Result<CoverageReport> {
    let summary = Command::new(forge_path)
        .arg("coverage")
        .arg("--report")
        .arg("summary")
        .current_dir(project_root)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()?;
    let stdout_summary = String::from_utf8_lossy(&summary.stdout).into_owned();
    let stderr_summary = String::from_utf8_lossy(&summary.stderr).into_owned();
    let (line, func, branch) = parse_forge_coverage_summary(&stdout_summary);
    let lcov_output = Command::new(forge_path)
        .arg("coverage")
        .arg("--report")
        .arg("lcov")
        .current_dir(project_root)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()?;
    let lcov = String::from_utf8_lossy(&lcov_output.stdout).into_owned();
    let stderr_lcov = String::from_utf8_lossy(&lcov_output.stderr).into_owned();
    Ok(CoverageReport {
        skipped: false,
        line_coverage_pct: line,
        function_coverage_pct: func,
        branch_coverage_pct: branch,
        lcov,
        stdout: stdout_summary,
        stderr: [stderr_summary, stderr_lcov].join("\n"),
    })
}

/// Write the lcov report to a file. Useful for CI pipelines that expect
/// `lcov.info` at a fixed path.
pub fn emit_lcov_to(report: &CoverageReport, target: &Path) -> std::io::Result<()> {
    let mut f = std::fs::File::create(target)?;
    f.write_all(report.lcov.as_bytes())?;
    Ok(())
}

fn run_cast_call(
    cast_path: &Path,
    rpc_url: &str,
    target: &str,
    sig: &str,
    args: &[&str],
) -> std::io::Result<CastOutput> {
    let mut cmd = Command::new(cast_path);
    cmd.arg("call")
        .arg(target)
        .arg(sig)
        .args(args)
        .arg("--rpc-url")
        .arg(rpc_url)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    let command_str = format!("cast call {target} {sig} {}", args.join(" "));
    let output = cmd.output()?;
    Ok(CastOutput {
        success: output.status.success(),
        skipped: false,
        stdout: String::from_utf8_lossy(&output.stdout).trim().to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
        command: command_str,
    })
}

fn run_cast_send(
    cast_path: &Path,
    rpc_url: &str,
    private_key: &str,
    target: &str,
    sig: &str,
    args: &[&str],
) -> std::io::Result<CastOutput> {
    let mut cmd = Command::new(cast_path);
    cmd.arg("send")
        .arg(target)
        .arg(sig)
        .args(args)
        .arg("--rpc-url")
        .arg(rpc_url)
        .arg("--private-key")
        .arg(private_key)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    let command_str = format!("cast send {target} {sig} {}", args.join(" "));
    let output = cmd.output()?;
    Ok(CastOutput {
        success: output.status.success(),
        skipped: false,
        stdout: String::from_utf8_lossy(&output.stdout).trim().to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
        command: command_str,
    })
}

fn run_cast_rpc(
    cast_path: &Path,
    rpc_url: &str,
    method: &str,
    params: &[&str],
) -> std::io::Result<CastOutput> {
    let mut cmd = Command::new(cast_path);
    cmd.arg("rpc")
        .arg(method)
        .args(params)
        .arg("--rpc-url")
        .arg(rpc_url)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    let command_str = format!("cast rpc {method} {}", params.join(" "));
    let output = cmd.output()?;
    Ok(CastOutput {
        success: output.status.success(),
        skipped: false,
        stdout: String::from_utf8_lossy(&output.stdout).trim().to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
        command: command_str,
    })
}

/// Parse `Ran <N> test suites … <passed> tests passed, <failed> failed, <skipped> skipped`.
/// The line has been stable since Foundry v0.2; when the pattern is missing
/// (e.g. Foundry future format change) the parser returns `(None, None)`.
pub fn parse_forge_test_summary(stdout: &str) -> (Option<u32>, Option<u32>) {
    for line in stdout.lines() {
        let normalised = line.trim();
        let after_passed = normalised.split_once("tests passed");
        if let Some((left, rest)) = after_passed {
            let passed = left.split_whitespace().last().and_then(|s| s.parse().ok());
            let failed = rest
                .split_once("failed")
                .and_then(|(l, _)| l.split_whitespace().last().and_then(|s| s.trim_end_matches(',').parse().ok()));
            return (passed, failed);
        }
    }
    (None, None)
}

/// Parse the `| lines | functions | branches |` summary table forge emits at
/// the end of `forge coverage --report summary`. Returns `(line, function,
/// branch)` percentages.
pub fn parse_forge_coverage_summary(stdout: &str) -> (Option<f64>, Option<f64>, Option<f64>) {
    let mut line_pct = None;
    let mut func_pct = None;
    let mut branch_pct = None;
    for l in stdout.lines() {
        let normalised = l.replace('|', " ");
        if normalised.trim().starts_with("TOTAL") || normalised.trim().starts_with("Overall") {
            let percentages: Vec<f64> = normalised
                .split_whitespace()
                .filter_map(|tok| {
                    let t = tok.trim_end_matches('%');
                    if tok.ends_with('%') { t.parse().ok() } else { None }
                })
                .collect();
            if let Some(&v) = percentages.first() {
                line_pct = Some(v);
            }
            if let Some(&v) = percentages.get(1) {
                func_pct = Some(v);
            }
            if let Some(&v) = percentages.get(2) {
                branch_pct = Some(v);
            }
        }
    }
    (line_pct, func_pct, branch_pct)
}
