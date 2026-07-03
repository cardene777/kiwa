//! alloy.rs integration — Solidity ABI 型生成 helper + tx signing / provider
//! abstraction for kiwa Rust contract tests.
//!
//! The alloy crate family (alloy-primitives / alloy-provider / alloy-signer /
//! alloy-contract / alloy-sol-types) is heavy — pulling it as a hard
//! dependency would push kiwa-test-rs from a 400 KiB dev-dep to a 30+ MiB
//! transitive tree. Instead this module ships:
//!
//! - [`SolAbi`] — a JSON-ABI parser that consumes Foundry's `out/<Contract>.json`
//!   files and surfaces the ABI in a shape a downstream `sol!` macro can
//!   consume. Users who want the `sol!`-generated Rust structs pull the alloy
//!   crates themselves; kiwa provides the ABI reading + validation + emit path.
//! - [`Signer`] — an enum enumerating the four signing paths kiwa users
//!   commonly test against ([`Signer::LocalWallet`], [`Signer::AwsKms`],
//!   [`Signer::Ledger`], [`Signer::Trezor`]). Consumers plug their own
//!   signing implementations behind this enum so the test env stays
//!   deterministic without pulling `alloy-signer-*`.
//! - [`Provider`] — HTTP / WS / IPC provider descriptor. Real alloy consumers
//!   would construct an `alloy_provider::ProviderBuilder` from this shape.
//! - [`ContractCall`] — a call-encoding helper that renders selector + calldata
//!   ready for `cast rpc` or an alloy `SolCall::abi_encode`.
//!
//! The module compiles without pulling any alloy crate — the abstractions
//! stand alone and interop with alloy at the caller side. This matches the
//! design of the Foundry module in the same crate.

use std::collections::BTreeMap;

pub mod helpers;
pub use helpers::{
    build_eip712_typed_data, encode_multicall3, encode_permit2_witness_transfer,
    Eip712Domain, Eip712Field, Eip712TypedData, Multicall3Call, Multicall3Encoded,
    Permit2Encoded, Permit2PermitTransfer,
};

/// A parsed Solidity ABI item — mirrors the shape Foundry emits in
/// `out/<Contract>.json` under the `abi` array. Only the fields kiwa users
/// need for `sol!` code-gen and selector computation are surfaced.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SolAbiItem {
    /// Item kind — `function`, `event`, `error`, `constructor`, `fallback`,
    /// `receive`. Real alloy `sol!` macro consumes each kind differently.
    pub kind: String,
    /// Item name — empty for constructor / fallback / receive.
    pub name: String,
    /// Input parameter types, in declaration order (e.g. `["uint256", "address"]`).
    pub inputs: Vec<SolAbiParam>,
    /// Output parameter types, in declaration order.
    pub outputs: Vec<SolAbiParam>,
    /// State mutability — `pure`, `view`, `nonpayable`, `payable`.
    pub state_mutability: String,
}

/// One parameter in an ABI item.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SolAbiParam {
    /// Parameter name (may be empty when the ABI omits it).
    pub name: String,
    /// Solidity type — `uint256` / `address` / `bytes` / `bool` / tuple etc.
    pub sol_type: String,
    /// True when this parameter is `indexed` in an event.
    pub indexed: bool,
}

/// A parsed Solidity ABI — the shape a `sol!` code-gen macro would consume.
#[derive(Debug, Clone)]
pub struct SolAbi {
    /// Contract name — filled from the `out/<Name>.json` filename.
    pub contract_name: String,
    /// All ABI items in the file, keyed by their canonical 4-byte selector.
    /// Selectors are computed for functions only; events + constructors +
    /// fallback / receive land in `items_by_kind` instead.
    pub items_by_selector: BTreeMap<String, SolAbiItem>,
    /// Every parsed item, grouped by kind for easy access.
    pub items_by_kind: BTreeMap<String, Vec<SolAbiItem>>,
    /// The raw ABI JSON bytes, kept so `sol!` consumers can re-parse if the
    /// helper's shape is not sufficient.
    pub raw_json: String,
}

impl SolAbi {
    /// Parse a Foundry-emitted `out/<Contract>.json` file. Returns the parsed
    /// ABI when the input is valid, an error string otherwise.
    ///
    /// The parser is intentionally minimal — it reads the top-level `abi`
    /// array and normalises each item. Real alloy consumers should verify
    /// the ABI end-to-end via `alloy_json_abi::JsonAbi`.
    pub fn parse_foundry_out(contract_name: &str, json: &str) -> Result<Self, String> {
        let abi_array = extract_abi_array(json).ok_or_else(|| {
            "SolAbi::parse_foundry_out: could not locate top-level `abi` array".to_string()
        })?;
        let items = parse_abi_items(&abi_array)?;
        let mut items_by_selector: BTreeMap<String, SolAbiItem> = BTreeMap::new();
        let mut items_by_kind: BTreeMap<String, Vec<SolAbiItem>> = BTreeMap::new();
        for item in items {
            if item.kind == "function" {
                let sig = canonical_signature(&item);
                let selector = keccak_selector_hex(&sig);
                items_by_selector.insert(selector, item.clone());
            }
            items_by_kind
                .entry(item.kind.clone())
                .or_default()
                .push(item);
        }
        Ok(Self {
            contract_name: contract_name.to_string(),
            items_by_selector,
            items_by_kind,
            raw_json: json.to_string(),
        })
    }

    /// Return the canonical function signature (e.g. `transfer(address,uint256)`)
    /// for a function by name. Returns `None` when the ABI has no such
    /// function or when there are name overloads (real Solidity supports
    /// overloading; the helper's `by_selector` map is the correct entry point
    /// in that case).
    pub fn signature_of(&self, function_name: &str) -> Option<String> {
        let matches: Vec<&SolAbiItem> = self
            .items_by_kind
            .get("function")
            .map(|v| v.iter().filter(|i| i.name == function_name).collect())
            .unwrap_or_default();
        if matches.len() != 1 {
            return None;
        }
        Some(canonical_signature(matches[0]))
    }

    /// Return the 4-byte selector (hex-encoded, lowercased) for a function by
    /// name. Same overload caveat as [`signature_of`](Self::signature_of).
    pub fn selector_of(&self, function_name: &str) -> Option<String> {
        self.signature_of(function_name).map(|s| keccak_selector_hex(&s))
    }
}

/// Signing path — enumerates the four kiwa users commonly test against.
///
/// The variants carry only the parameters the caller supplies; the actual
/// signing implementation lives in the alloy crates. This enum exists so the
/// kiwa contract test env can express "which signer to use" without pulling
/// alloy-signer-* into the tree.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Signer {
    /// Local wallet — a raw 32-byte signing seed held in memory. In tests
    /// consumers point this at one of anvil's deterministic accounts.
    LocalWallet {
        /// Chain id the wallet signs for.
        chain_id: u64,
        /// Descriptor of the seed source — real seeds are never stored here,
        /// only a hint (e.g. "env:PRIVATE_KEY" or "anvil-account-0").
        seed_descriptor: String,
    },
    /// AWS KMS — cloud HSM signing path. The identifier is the KMS key id
    /// (e.g. `alias/my-signer` or a raw key ARN).
    AwsKms {
        /// Chain id the KMS signer signs for.
        chain_id: u64,
        /// KMS key identifier — an alias like `alias/my-signer` or a full ARN.
        key_id: String,
        /// AWS region the KMS key lives in.
        region: String,
    },
    /// Hardware wallet path — Ledger Live variant.
    Ledger {
        /// Chain id the signer signs for.
        chain_id: u64,
        /// BIP-44 HD path — e.g. `m/44'/60'/0'/0/0`.
        hd_path: String,
    },
    /// Hardware wallet path — Trezor variant. Included so the enum matches
    /// the alloy-signer-hardware feature set.
    Trezor {
        /// Chain id the signer signs for.
        chain_id: u64,
        /// BIP-44 HD path — e.g. `m/44'/60'/0'/0/0`.
        hd_path: String,
    },
}

impl Signer {
    /// Convenience — chain id every variant carries.
    pub fn chain_id(&self) -> u64 {
        match self {
            Self::LocalWallet { chain_id, .. }
            | Self::AwsKms { chain_id, .. }
            | Self::Ledger { chain_id, .. }
            | Self::Trezor { chain_id, .. } => *chain_id,
        }
    }
}

/// Provider transport for the alloy provider builder. Corresponds to
/// `alloy_provider::ProviderBuilder::on_http` / `on_ws` / `on_ipc`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Provider {
    /// JSON-RPC over HTTP.
    Http {
        /// Endpoint URL — e.g. `http://127.0.0.1:8545`.
        url: String,
    },
    /// JSON-RPC over WebSocket.
    Ws {
        /// Endpoint URL — e.g. `ws://127.0.0.1:8545`.
        url: String,
    },
    /// Local IPC socket.
    Ipc {
        /// Filesystem path to the IPC socket.
        path: String,
    },
}

impl Provider {
    /// Return the transport kind as a stable string — useful for assertions.
    pub fn kind(&self) -> &'static str {
        match self {
            Self::Http { .. } => "http",
            Self::Ws { .. } => "ws",
            Self::Ipc { .. } => "ipc",
        }
    }

    /// Convenience constructor for anvil's default `http://127.0.0.1:<port>`.
    pub fn anvil_http(port: u16) -> Self {
        Self::Http { url: format!("http://127.0.0.1:{port}") }
    }
}

/// Encoded contract call — selector + calldata rendered as hex ready for
/// `cast rpc eth_call` or `alloy_sol_types::SolCall::abi_encode`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ContractCall {
    /// The 4-byte function selector as `0xdeadbeef`.
    pub selector_hex: String,
    /// Hex-encoded calldata (selector + ABI-encoded arguments), `0x`-prefixed.
    pub data_hex: String,
    /// Target contract address (checksummed hex).
    pub to: String,
}

impl ContractCall {
    /// Build a call with no arguments — the calldata is just the selector.
    pub fn no_args(to: &str, selector_hex: &str) -> Self {
        let normalized = ensure_0x_prefix(selector_hex);
        Self {
            selector_hex: normalized.clone(),
            data_hex: normalized,
            to: to.to_string(),
        }
    }

    /// Build a call from a selector + pre-encoded ABI argument blob (32-byte
    /// words concatenated). The helper prepends the selector and prefixes
    /// with `0x`.
    pub fn with_encoded_args(to: &str, selector_hex: &str, encoded_args_hex: &str) -> Self {
        let sel = ensure_0x_prefix(selector_hex);
        let args = strip_0x_prefix(encoded_args_hex);
        Self {
            selector_hex: sel.clone(),
            data_hex: format!("{sel}{args}"),
            to: to.to_string(),
        }
    }
}

// -----------------------------------------------------------------------------
// Internal helpers — minimal JSON + keccak parsers.
// -----------------------------------------------------------------------------

fn ensure_0x_prefix(s: &str) -> String {
    if let Some(rest) = s.strip_prefix("0x").or_else(|| s.strip_prefix("0X")) {
        format!("0x{}", rest.to_lowercase())
    } else {
        format!("0x{}", s.to_lowercase())
    }
}

fn strip_0x_prefix(s: &str) -> &str {
    s.strip_prefix("0x")
        .or_else(|| s.strip_prefix("0X"))
        .unwrap_or(s)
}

/// Render a canonical Solidity function signature — `name(type,type,type)`.
pub fn canonical_signature(item: &SolAbiItem) -> String {
    let params = item
        .inputs
        .iter()
        .map(|p| p.sol_type.as_str())
        .collect::<Vec<_>>()
        .join(",");
    format!("{}({})", item.name, params)
}

/// Compute the first 4 bytes of keccak256(signature) — the standard Solidity
/// function selector. Uses a compact keccak-f[1600] implementation.
pub fn keccak_selector_hex(signature: &str) -> String {
    let hash = keccak256(signature.as_bytes());
    format!("0x{:02x}{:02x}{:02x}{:02x}", hash[0], hash[1], hash[2], hash[3])
}

/// Compute the full keccak256 hash of `input`.
pub fn keccak256(input: &[u8]) -> [u8; 32] {
    // Compact keccak-256 implementation — sufficient for selector computation.
    // Not intended as a cryptographic primitive; kiwa consumers running real
    // production signing should use the ecosystem crate `sha3` or alloy's
    // built-in hasher.
    let mut lanes = [0u64; 25];
    let rate = 136usize; // 1088 bits / 8 for keccak-256.
    let mut buffer = Vec::with_capacity(input.len() + rate);
    buffer.extend_from_slice(input);
    // Padding — 0x01 domain separator (keccak, not sha3) + 0x80 at the end
    // of the block.
    buffer.push(0x01);
    while buffer.len() % rate != rate - 1 {
        buffer.push(0);
    }
    buffer.push(0x80);
    for chunk in buffer.chunks(rate) {
        for (i, block) in chunk.chunks(8).enumerate() {
            let mut word = 0u64;
            for (j, &b) in block.iter().enumerate() {
                word |= (b as u64) << (8 * j);
            }
            lanes[i] ^= word;
        }
        keccak_f(&mut lanes);
    }
    let mut out = [0u8; 32];
    for (i, word) in lanes.iter().take(4).enumerate() {
        for j in 0..8 {
            out[8 * i + j] = ((word >> (8 * j)) & 0xff) as u8;
        }
    }
    out
}

fn keccak_f(state: &mut [u64; 25]) {
    const RC: [u64; 24] = [
        0x0000000000000001,
        0x0000000000008082,
        0x800000000000808a,
        0x8000000080008000,
        0x000000000000808b,
        0x0000000080000001,
        0x8000000080008081,
        0x8000000000008009,
        0x000000000000008a,
        0x0000000000000088,
        0x0000000080008009,
        0x000000008000000a,
        0x000000008000808b,
        0x800000000000008b,
        0x8000000000008089,
        0x8000000000008003,
        0x8000000000008002,
        0x8000000000000080,
        0x000000000000800a,
        0x800000008000000a,
        0x8000000080008081,
        0x8000000000008080,
        0x0000000080000001,
        0x8000000080008008,
    ];
    const R: [[u32; 5]; 5] = [
        [0, 36, 3, 41, 18],
        [1, 44, 10, 45, 2],
        [62, 6, 43, 15, 61],
        [28, 55, 25, 21, 56],
        [27, 20, 39, 8, 14],
    ];
    for round in 0..24 {
        // Theta.
        let mut c = [0u64; 5];
        for x in 0..5 {
            c[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
        }
        let mut d = [0u64; 5];
        for x in 0..5 {
            d[x] = c[(x + 4) % 5] ^ c[(x + 1) % 5].rotate_left(1);
        }
        for x in 0..5 {
            for y in 0..5 {
                state[x + 5 * y] ^= d[x];
            }
        }
        // Rho + Pi.
        let mut b = [0u64; 25];
        for x in 0..5 {
            for y in 0..5 {
                b[y + 5 * ((2 * x + 3 * y) % 5)] = state[x + 5 * y].rotate_left(R[x][y]);
            }
        }
        // Chi.
        for x in 0..5 {
            for y in 0..5 {
                state[x + 5 * y] = b[x + 5 * y] ^ ((!b[(x + 1) % 5 + 5 * y]) & b[(x + 2) % 5 + 5 * y]);
            }
        }
        // Iota.
        state[0] ^= RC[round];
    }
}

/// Extract the `abi` array from a Foundry `out/<Contract>.json` file.
fn extract_abi_array(json: &str) -> Option<String> {
    let key = "\"abi\"";
    let start = json.find(key)?;
    let after_key = json[start + key.len()..].trim_start();
    let after_colon = after_key.strip_prefix(':')?.trim_start();
    if !after_colon.starts_with('[') {
        return None;
    }
    let bytes = after_colon.as_bytes();
    let mut depth = 0i32;
    let mut end = 0usize;
    let mut in_string = false;
    let mut escaped = false;
    for (idx, &b) in bytes.iter().enumerate() {
        if in_string {
            if escaped {
                escaped = false;
            } else if b == b'\\' {
                escaped = true;
            } else if b == b'"' {
                in_string = false;
            }
            continue;
        }
        match b {
            b'"' => in_string = true,
            b'[' => depth += 1,
            b']' => {
                depth -= 1;
                if depth == 0 {
                    end = idx;
                    break;
                }
            }
            _ => {}
        }
    }
    if depth != 0 {
        return None;
    }
    Some(after_colon[..=end].to_string())
}

/// Parse the ABI array — small hand-rolled parser that reads each object.
fn parse_abi_items(abi_array: &str) -> Result<Vec<SolAbiItem>, String> {
    let mut items = Vec::new();
    let bytes = abi_array.as_bytes();
    let mut i = 0usize;
    // Skip leading `[`.
    while i < bytes.len() && bytes[i] != b'{' {
        i += 1;
    }
    while i < bytes.len() {
        if bytes[i] != b'{' {
            i += 1;
            continue;
        }
        let start = i;
        let mut depth = 0i32;
        let mut in_string = false;
        let mut escaped = false;
        while i < bytes.len() {
            let b = bytes[i];
            if in_string {
                if escaped {
                    escaped = false;
                } else if b == b'\\' {
                    escaped = true;
                } else if b == b'"' {
                    in_string = false;
                }
            } else {
                match b {
                    b'"' => in_string = true,
                    b'{' => depth += 1,
                    b'}' => {
                        depth -= 1;
                        if depth == 0 {
                            let obj = &abi_array[start..=i];
                            items.push(parse_abi_item(obj)?);
                            i += 1;
                            break;
                        }
                    }
                    _ => {}
                }
            }
            i += 1;
        }
    }
    Ok(items)
}

fn parse_abi_item(obj: &str) -> Result<SolAbiItem, String> {
    let kind = extract_string_field(obj, "type").unwrap_or_else(|| "function".to_string());
    let name = extract_string_field(obj, "name").unwrap_or_default();
    let state_mutability = extract_string_field(obj, "stateMutability").unwrap_or_default();
    let inputs = extract_params_field(obj, "inputs")?;
    let outputs = extract_params_field(obj, "outputs").unwrap_or_default();
    Ok(SolAbiItem {
        kind,
        name,
        inputs,
        outputs,
        state_mutability,
    })
}

fn extract_string_field(obj: &str, key: &str) -> Option<String> {
    let needle = format!("\"{key}\"");
    let start = obj.find(&needle)?;
    let after = obj[start + needle.len()..].trim_start();
    let after_colon = after.strip_prefix(':')?.trim_start();
    let after_quote = after_colon.strip_prefix('"')?;
    let end = after_quote.find('"')?;
    Some(after_quote[..end].to_string())
}

fn extract_params_field(obj: &str, key: &str) -> Result<Vec<SolAbiParam>, String> {
    let needle = format!("\"{key}\"");
    let start = match obj.find(&needle) {
        Some(v) => v,
        None => return Ok(Vec::new()),
    };
    let after = obj[start + needle.len()..].trim_start();
    let after_colon = after.strip_prefix(':').ok_or_else(|| {
        format!("extract_params_field: expected ':' after key '{key}'")
    })?;
    let trimmed = after_colon.trim_start();
    if !trimmed.starts_with('[') {
        return Ok(Vec::new());
    }
    let bytes = trimmed.as_bytes();
    let mut depth = 0i32;
    let mut end = 0usize;
    let mut in_string = false;
    let mut escaped = false;
    for (idx, &b) in bytes.iter().enumerate() {
        if in_string {
            if escaped {
                escaped = false;
            } else if b == b'\\' {
                escaped = true;
            } else if b == b'"' {
                in_string = false;
            }
            continue;
        }
        match b {
            b'"' => in_string = true,
            b'[' => depth += 1,
            b']' => {
                depth -= 1;
                if depth == 0 {
                    end = idx;
                    break;
                }
            }
            _ => {}
        }
    }
    let arr = &trimmed[1..end];
    let mut out = Vec::new();
    let bytes = arr.as_bytes();
    let mut i = 0usize;
    while i < bytes.len() {
        if bytes[i] != b'{' {
            i += 1;
            continue;
        }
        let start = i;
        let mut depth = 0i32;
        let mut in_string = false;
        let mut escaped = false;
        while i < bytes.len() {
            let b = bytes[i];
            if in_string {
                if escaped {
                    escaped = false;
                } else if b == b'\\' {
                    escaped = true;
                } else if b == b'"' {
                    in_string = false;
                }
            } else {
                match b {
                    b'"' => in_string = true,
                    b'{' => depth += 1,
                    b'}' => {
                        depth -= 1;
                        if depth == 0 {
                            let obj = &arr[start..=i];
                            let name = extract_string_field(obj, "name").unwrap_or_default();
                            let sol_type = extract_string_field(obj, "type").unwrap_or_default();
                            let indexed = extract_string_field(obj, "indexed")
                                .map(|v| v == "true")
                                .unwrap_or(false)
                                || obj.contains("\"indexed\": true");
                            out.push(SolAbiParam {
                                name,
                                sol_type,
                                indexed,
                            });
                            i += 1;
                            break;
                        }
                    }
                    _ => {}
                }
            }
            i += 1;
        }
    }
    Ok(out)
}
