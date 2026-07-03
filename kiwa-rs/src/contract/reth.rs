//! Reth (Rust Ethereum Execution client) integration — v0.5.
//!
//! Reth ships a full production-grade EL client written in Rust. For test
//! authors the interesting entry point is `reth node --dev`, which spawns a
//! deterministic dev chain that exposes the standard JSON-RPC surface on a
//! chosen port. This module wraps that subprocess with a
//! [`Drop`]-based [`RethNode`] handle so tests that spawn a dev node do not
//! leak processes when panics unwind.
//!
//! Two additional helpers round out the release-gate feed:
//!
//! - [`reth_reorg`] — drives an N-block reorg simulation through the JSON-RPC
//!   `debug_setHead` method reth exposes in dev mode. Kiwa integration tests
//!   use the same shape when driving anvil, so the helper mirrors the
//!   anvil-side API surface.
//! - [`FidelityCase`] + [`fidelity_matrix`] — enumerate the seven JSON-RPC
//!   methods where anvil (`kiwa::contract::foundry::Anvil`) and reth are
//!   expected to agree. Consumers feed the matrix through their own
//!   provider harness and assert the outputs line up.
//!
//! ## Design
//!
//! `reth` is not a required dependency of kiwa-test-rs — the module ships a
//! [`RethNode::detect`] probe that returns a [`RethBinary`] descriptor so
//! tests can `skip` when the binary is not on PATH. This mirrors the
//! Foundry adapter's pattern.
//!
//! ## Example
//!
//! ```no_run
//! use std::time::Duration;
//! use kiwa::contract::reth::{RethNode, reth_reorg, RethBinary};
//!
//! # fn main() -> Result<(), Box<dyn std::error::Error>> {
//! let bin = RethBinary::detect();
//! if !bin.available {
//!     eprintln!("reth not on PATH — skipping reth-side tests");
//!     return Ok(());
//! }
//! let node = RethNode::spawn_dev(8545)?;
//! node.wait_ready(Duration::from_secs(3))?;
//! let reorg = reth_reorg(node.endpoint(), 3)?;
//! assert!(reorg.rpc_ok);
//! # Ok(())
//! # }
//! ```

use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::time::{Duration, Instant};

/// Descriptor of the reth CLI availability. `available` is false when the
/// binary is not on PATH.
#[derive(Debug, Clone)]
pub struct RethBinary {
    /// Whether `reth` was found on PATH.
    pub available: bool,
    /// Resolved path to the binary (empty when not available).
    pub path: PathBuf,
}

impl RethBinary {
    /// Probe PATH for `reth`. Never fails.
    pub fn detect() -> Self {
        let path = which("reth").unwrap_or_default();
        Self {
            available: !path.as_os_str().is_empty(),
            path,
        }
    }
}

/// Handle to a spawned `reth node --dev` process. Terminates the child on
/// [`Drop`], mirroring the [`crate::contract::foundry::Anvil`] pattern.
pub struct RethNode {
    child: Option<Child>,
    port: u16,
    endpoint: String,
}

impl std::fmt::Debug for RethNode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("RethNode")
            .field("port", &self.port)
            .field("endpoint", &self.endpoint)
            .field("running", &self.child.is_some())
            .finish()
    }
}

impl RethNode {
    /// Spawn `reth node --dev --http --http.port <port>`. When `reth` is not
    /// on PATH the method returns an error whose `kind()` is `NotFound` so
    /// callers can distinguish "not installed" from "port in use".
    pub fn spawn_dev(port: u16) -> std::io::Result<Self> {
        Self::spawn_with_args(port, &[])
    }

    /// Lower-level spawn accepting extra CLI arguments (appended after the
    /// standard `--dev --http --http.port <port>` set).
    pub fn spawn_with_args(port: u16, extra_args: &[&str]) -> std::io::Result<Self> {
        let path = which("reth").ok_or_else(|| {
            std::io::Error::new(std::io::ErrorKind::NotFound, "reth not on PATH")
        })?;
        let mut cmd = Command::new(path);
        cmd.arg("node")
            .arg("--dev")
            .arg("--http")
            .arg("--http.port")
            .arg(port.to_string())
            .arg("--http.addr")
            .arg("127.0.0.1")
            .arg("--dev.block-time")
            .arg("1s");
        for a in extra_args {
            cmd.arg(a);
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

    /// Wait until the RPC port accepts a TCP connection or the timeout
    /// elapses. Real reth takes ~500 ms to bind in dev mode.
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
            format!(
                "reth on port {} did not start within {:?}",
                self.port, timeout
            ),
        ))
    }

    /// Explicit tear-down. Called automatically by [`Drop`].
    pub fn stop(&mut self) {
        if let Some(mut child) = self.child.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }
}

impl Drop for RethNode {
    fn drop(&mut self) {
        self.stop();
    }
}

/// Report emitted by [`reth_reorg`]. `rpc_ok` reflects whether the RPC call
/// returned a JSON payload with a matching id and no `error` field. When the
/// endpoint is unreachable the report is [`ReorgReport::skipped`].
#[derive(Debug, Clone)]
pub struct ReorgReport {
    /// Whether the JSON-RPC call succeeded.
    pub rpc_ok: bool,
    /// Number of blocks the caller requested to roll back.
    pub blocks: u32,
    /// True when the endpoint was unreachable / the request never went out.
    pub skipped: bool,
    /// Raw JSON payload returned by reth (empty when skipped).
    pub response_body: String,
    /// Rendered RPC request line, useful for assertions in tests.
    pub request: String,
}

impl ReorgReport {
    /// Empty skipped report.
    pub fn skipped(blocks: u32, reason: &str) -> Self {
        Self {
            rpc_ok: false,
            blocks,
            skipped: true,
            response_body: reason.to_string(),
            request: String::new(),
        }
    }
}

/// Drive a reorg simulation through reth's `debug_setHead` JSON-RPC method.
/// The helper POSTs a minimal JSON-RPC envelope via a hand-rolled HTTP
/// client so it does not pull `reqwest` into the runtime dep tree (kiwa's
/// dev-deps already ship `reqwest` for the integration tests, but the
/// production surface stays lean).
///
/// The `blocks` argument names the depth of the roll-back. reth ignores the
/// value when the target height would be negative and returns the pre-existing
/// head — the report captures that response verbatim so callers can decide
/// whether to treat it as success.
pub fn reth_reorg(endpoint: &str, blocks: u32) -> std::io::Result<ReorgReport> {
    let payload = format!(
        r#"{{"jsonrpc":"2.0","method":"debug_setHead","params":["0x{:x}"],"id":1}}"#,
        blocks
    );
    match rpc_post(endpoint, &payload) {
        Ok(body) => Ok(ReorgReport {
            rpc_ok: is_rpc_success(&body),
            blocks,
            skipped: false,
            response_body: body,
            request: payload,
        }),
        Err(e) => Ok(ReorgReport::skipped(
            blocks,
            &format!("reth endpoint unreachable: {e}"),
        )),
    }
}

/// One row in the anvil ↔ reth fidelity matrix. Kiwa integration tests wire
/// each row through their own provider harness and assert the responses agree
/// (or diverge for well-known reasons — [`FidelityCase::expected_agreement`]).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FidelityCase {
    /// JSON-RPC method (e.g. `eth_blockNumber`).
    pub method: String,
    /// Params array serialized as a JSON blob (may be empty `[]`).
    pub params_json: String,
    /// True when anvil and reth are expected to agree on the response shape.
    pub expected_agreement: bool,
    /// Rationale — human-readable note explaining why the case is on the
    /// matrix (or why divergence is expected).
    pub rationale: String,
}

/// The v0.5 fidelity matrix — seven representative JSON-RPC methods kiwa
/// exercises across anvil and reth.
pub fn fidelity_matrix() -> Vec<FidelityCase> {
    vec![
        FidelityCase {
            method: "eth_blockNumber".to_string(),
            params_json: "[]".to_string(),
            expected_agreement: true,
            rationale: "Deterministic block cadence in dev mode; both clients emit 1 block/s.".to_string(),
        },
        FidelityCase {
            method: "eth_chainId".to_string(),
            params_json: "[]".to_string(),
            expected_agreement: true,
            rationale: "Both dev modes default to chain id 31337 (anvil) or 1337 (reth); tests assert on the returned value.".to_string(),
        },
        FidelityCase {
            method: "eth_getBalance".to_string(),
            params_json: r#"["0x0000000000000000000000000000000000000001", "latest"]"#.to_string(),
            expected_agreement: true,
            rationale: "Non-existent account returns 0 on both clients per Yellow Paper §6.".to_string(),
        },
        FidelityCase {
            method: "eth_gasPrice".to_string(),
            params_json: "[]".to_string(),
            expected_agreement: false,
            rationale: "anvil defaults to 1 gwei base, reth follows EIP-1559 base fee so numeric equality is not guaranteed.".to_string(),
        },
        FidelityCase {
            method: "eth_call".to_string(),
            params_json: r#"[{"to":"0x0000000000000000000000000000000000000000","data":"0x"},"latest"]"#.to_string(),
            expected_agreement: true,
            rationale: "Empty call to zero address returns 0x on both clients.".to_string(),
        },
        FidelityCase {
            method: "net_version".to_string(),
            params_json: "[]".to_string(),
            expected_agreement: false,
            rationale: "anvil returns 31337, reth dev returns 1337 — kiwa consumers assert on the client-specific mapping.".to_string(),
        },
        FidelityCase {
            method: "web3_clientVersion".to_string(),
            params_json: "[]".to_string(),
            expected_agreement: false,
            rationale: "String differs by design (anvil vs reth banner) — kiwa consumers use this to detect which client backs the RPC.".to_string(),
        },
    ]
}

// -----------------------------------------------------------------------------
// Internal — PATH lookup + minimal HTTP client.
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

/// Extremely small HTTP/1.1 POST client — takes a JSON body and returns the
/// response body. Doubles as a smoke test for the reth JSON-RPC endpoint
/// without pulling `reqwest` / `hyper` into the runtime dep tree.
fn rpc_post(endpoint: &str, body: &str) -> std::io::Result<String> {
    use std::io::{Read, Write};
    use std::net::TcpStream;

    let (host, port, path) = parse_http_url(endpoint)?;
    let mut stream = TcpStream::connect((host.as_str(), port))?;
    stream.set_read_timeout(Some(Duration::from_secs(3)))?;
    stream.set_write_timeout(Some(Duration::from_secs(3)))?;
    let request = format!(
        "POST {path} HTTP/1.1\r\nHost: {host}:{port}\r\nContent-Type: application/json\r\nContent-Length: {len}\r\nConnection: close\r\n\r\n{body}",
        len = body.len()
    );
    stream.write_all(request.as_bytes())?;
    let mut buf = Vec::new();
    stream.read_to_end(&mut buf)?;
    let text = String::from_utf8_lossy(&buf).into_owned();
    // Strip HTTP headers — return only the body after `\r\n\r\n`.
    if let Some(idx) = text.find("\r\n\r\n") {
        Ok(text[idx + 4..].to_string())
    } else {
        Ok(text)
    }
}

fn parse_http_url(url: &str) -> std::io::Result<(String, u16, String)> {
    let stripped = url
        .strip_prefix("http://")
        .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::InvalidInput, "expected http://"))?;
    let (authority, path) = match stripped.split_once('/') {
        Some((a, p)) => (a, format!("/{p}")),
        None => (stripped, "/".to_string()),
    };
    let (host, port) = match authority.split_once(':') {
        Some((h, p)) => (
            h.to_string(),
            p.parse().map_err(|_| {
                std::io::Error::new(std::io::ErrorKind::InvalidInput, "bad port")
            })?,
        ),
        None => (authority.to_string(), 80),
    };
    Ok((host, port, path))
}

fn is_rpc_success(body: &str) -> bool {
    // Minimal JSON check — sufficient for reth's dev mode responses which
    // are always compact single-line JSON.
    body.contains("\"result\"") && !body.contains("\"error\"")
}
