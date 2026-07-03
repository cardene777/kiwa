//! Alloy ergonomic wrappers — EIP-712 typed data + Multicall3 batch + Permit2
//! `PermitWitnessTransferFrom` (v0.5).
//!
//! Three pure-Rust helpers that render production-shaped payloads kiwa users
//! feed into an alloy `Provider` or into `cast rpc` invocations. Same design
//! constraint as [`super`]: no alloy crate dependency, only bytes / hex-strings
//! come out.
//!
//! - [`Eip712TypedData`] — builds an EIP-712 v4 payload (`domainSeparator +
//!   typeHash + hashStruct`) using kiwa's built-in keccak-256 hasher. The
//!   caller supplies primary-type field declarations and values; the builder
//!   emits both the JSON envelope suitable for `eth_signTypedData_v4` and the
//!   32-byte digest ready for ECDSA signing.
//! - [`Multicall3Call`] + [`encode_multicall3`] — renders the classic
//!   Multicall3 `aggregate3` calldata blob so kiwa tests can batch reads /
//!   writes through the canonical
//!   `0xcA11bde05977b3631167028862bE2a173976CA11` contract without hand-rolling
//!   ABI encoding.
//! - [`Permit2PermitTransfer`] + [`encode_permit2_witness_transfer`] — encodes
//!   the Permit2 `permitWitnessTransferFrom` calldata + the EIP-712 witness
//!   digest so signers (from [`super::Signer`]) can drop a signature in
//!   without touching the ABI wire format.
//!
//! All three helpers piggyback on kiwa's existing `keccak256` implementation
//! from [`super`] so the module ships without pulling `sha3` or `alloy-primitives`.

use super::{keccak256, keccak_selector_hex};

// -----------------------------------------------------------------------------
// EIP-712 typed data builder.
// -----------------------------------------------------------------------------

/// EIP-712 domain — the four canonical fields kiwa users configure.
///
/// The chain id is a `u64` since kiwa targets mainnet + rollup ecosystems all
/// well below the 2^53 ceiling. Names / versions / verifying-contract are
/// UTF-8 strings; the address must be a `0x`-prefixed 20-byte hex string.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Eip712Domain {
    /// `name` — matches Solidity `EIP712Domain.name`.
    pub name: String,
    /// `version` — matches Solidity `EIP712Domain.version`.
    pub version: String,
    /// `chainId` — u64 encoded to a 32-byte big-endian word.
    pub chain_id: u64,
    /// `verifyingContract` — `0x`-prefixed 20-byte hex address.
    pub verifying_contract: String,
}

/// One field in the primary EIP-712 struct.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Eip712Field {
    /// Field name (e.g. `owner`).
    pub name: String,
    /// EIP-712 type — `address` / `uint256` / `bytes32` / `string` / `bytes`.
    /// Struct types + arrays are out of scope for v0.5 (they arrive with v0.6
    /// when kiwa adds nested-type support).
    pub sol_type: String,
    /// Field value as a `0x`-prefixed hex string (for `address` / `bytes*` /
    /// `uint*`), or plain UTF-8 (for `string`).
    pub value: String,
}

/// Fully-rendered EIP-712 typed data envelope.
#[derive(Debug, Clone)]
pub struct Eip712TypedData {
    /// Domain the payload was signed against.
    pub domain: Eip712Domain,
    /// Primary type name (e.g. `Permit`).
    pub primary_type: String,
    /// Ordered fields for the primary type.
    pub fields: Vec<Eip712Field>,
    /// The 32-byte digest — `keccak256("\\x19\\x01" || domainSeparator || hashStruct(primary))`.
    /// This is what an ECDSA signer signs; hex-encoded with a `0x` prefix.
    pub digest_hex: String,
    /// JSON envelope suitable for `eth_signTypedData_v4`. Not full RFC 8259
    /// bells / whistles — the payload is deterministically ordered so the
    /// digest matches what alloy or ethers-js would compute.
    pub json_envelope: String,
}

/// Build an EIP-712 typed-data payload. Only primitive scalar types are
/// supported in v0.5 (`address`, `uint*`, `bytes*`, `string`, `bytes`).
pub fn build_eip712_typed_data(
    domain: Eip712Domain,
    primary_type: &str,
    fields: Vec<Eip712Field>,
) -> Result<Eip712TypedData, String> {
    validate_domain(&domain)?;
    for f in &fields {
        validate_field(f)?;
    }
    let type_hash = compute_type_hash(primary_type, &fields);
    let struct_hash = compute_struct_hash(&type_hash, &fields)?;
    let domain_separator = compute_domain_separator(&domain);
    let mut prefixed = Vec::with_capacity(2 + 32 + 32);
    prefixed.extend_from_slice(&[0x19, 0x01]);
    prefixed.extend_from_slice(&domain_separator);
    prefixed.extend_from_slice(&struct_hash);
    let digest = keccak256(&prefixed);
    let json_envelope = render_json_envelope(&domain, primary_type, &fields);
    Ok(Eip712TypedData {
        domain,
        primary_type: primary_type.to_string(),
        fields,
        digest_hex: format!("0x{}", hex_encode(&digest)),
        json_envelope,
    })
}

fn validate_domain(d: &Eip712Domain) -> Result<(), String> {
    if !d.verifying_contract.starts_with("0x") || d.verifying_contract.len() != 42 {
        return Err(format!(
            "Eip712Domain.verifying_contract must be 0x-prefixed 20-byte hex; got '{}'",
            d.verifying_contract
        ));
    }
    Ok(())
}

fn validate_field(f: &Eip712Field) -> Result<(), String> {
    if f.name.is_empty() {
        return Err("Eip712Field.name must be non-empty".to_string());
    }
    if f.sol_type.is_empty() {
        return Err(format!("Eip712Field '{}' has empty sol_type", f.name));
    }
    if is_supported_type(&f.sol_type) {
        Ok(())
    } else {
        Err(format!(
            "Eip712Field '{}' uses unsupported sol_type '{}' (v0.5 supports address, uint*, bytes*, string, bytes)",
            f.name, f.sol_type
        ))
    }
}

fn is_supported_type(sol_type: &str) -> bool {
    matches!(sol_type, "address" | "string" | "bytes")
        || sol_type.starts_with("uint")
        || sol_type.starts_with("int")
        || sol_type.starts_with("bytes")
        || sol_type == "bool"
}

fn compute_type_hash(primary_type: &str, fields: &[Eip712Field]) -> [u8; 32] {
    let params = fields
        .iter()
        .map(|f| format!("{} {}", f.sol_type, f.name))
        .collect::<Vec<_>>()
        .join(",");
    let signature = format!("{primary_type}({params})");
    keccak256(signature.as_bytes())
}

fn compute_struct_hash(type_hash: &[u8; 32], fields: &[Eip712Field]) -> Result<[u8; 32], String> {
    let mut buf = Vec::with_capacity(32 + fields.len() * 32);
    buf.extend_from_slice(type_hash);
    for f in fields {
        let word = encode_field_value(f)?;
        buf.extend_from_slice(&word);
    }
    Ok(keccak256(&buf))
}

fn compute_domain_separator(d: &Eip712Domain) -> [u8; 32] {
    // Canonical EIP712Domain type — the four-field variant.
    let type_hash = keccak256(
        b"EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)",
    );
    let name_hash = keccak256(d.name.as_bytes());
    let version_hash = keccak256(d.version.as_bytes());
    let chain_id_word = u256_be_from_u64(d.chain_id);
    let addr_word = address_to_word(&d.verifying_contract).unwrap_or([0u8; 32]);
    let mut buf = Vec::with_capacity(32 * 5);
    buf.extend_from_slice(&type_hash);
    buf.extend_from_slice(&name_hash);
    buf.extend_from_slice(&version_hash);
    buf.extend_from_slice(&chain_id_word);
    buf.extend_from_slice(&addr_word);
    keccak256(&buf)
}

fn encode_field_value(f: &Eip712Field) -> Result<[u8; 32], String> {
    match f.sol_type.as_str() {
        "address" => address_to_word(&f.value),
        "string" => Ok(keccak256(f.value.as_bytes())),
        "bytes" => Ok(keccak256(&hex_decode(&f.value)?)),
        "bool" => {
            let v = f.value.eq_ignore_ascii_case("true");
            let mut w = [0u8; 32];
            if v {
                w[31] = 1;
            }
            Ok(w)
        }
        t if t.starts_with("uint") || t.starts_with("int") => {
            let bytes = hex_decode(&f.value)?;
            if bytes.len() > 32 {
                return Err(format!(
                    "Eip712Field '{}' value '{}' exceeds 32 bytes (got {})",
                    f.name,
                    f.value,
                    bytes.len()
                ));
            }
            let mut w = [0u8; 32];
            let start = 32 - bytes.len();
            w[start..].copy_from_slice(&bytes);
            Ok(w)
        }
        t if t.starts_with("bytes") => {
            // Fixed-size bytesN — left-aligned.
            let bytes = hex_decode(&f.value)?;
            if bytes.len() > 32 {
                return Err(format!(
                    "Eip712Field '{}' fixed bytesN value exceeds 32 bytes (got {})",
                    f.name,
                    bytes.len()
                ));
            }
            let mut w = [0u8; 32];
            w[..bytes.len()].copy_from_slice(&bytes);
            Ok(w)
        }
        _ => Err(format!("unreachable: unsupported sol_type '{}'", f.sol_type)),
    }
}

fn address_to_word(addr: &str) -> Result<[u8; 32], String> {
    let bytes = hex_decode(addr)?;
    if bytes.len() != 20 {
        return Err(format!("address '{addr}' must decode to 20 bytes"));
    }
    let mut w = [0u8; 32];
    w[12..].copy_from_slice(&bytes);
    Ok(w)
}

fn u256_be_from_u64(v: u64) -> [u8; 32] {
    let mut w = [0u8; 32];
    let bytes = v.to_be_bytes();
    w[24..].copy_from_slice(&bytes);
    w
}

fn hex_decode(s: &str) -> Result<Vec<u8>, String> {
    let trimmed = s.trim_start_matches("0x").trim_start_matches("0X");
    if trimmed.len() % 2 != 0 {
        return Err(format!("hex string '{s}' has odd length"));
    }
    let mut out = Vec::with_capacity(trimmed.len() / 2);
    let bytes = trimmed.as_bytes();
    for chunk in bytes.chunks(2) {
        let hi = hex_nibble(chunk[0])?;
        let lo = hex_nibble(chunk[1])?;
        out.push((hi << 4) | lo);
    }
    Ok(out)
}

fn hex_nibble(c: u8) -> Result<u8, String> {
    match c {
        b'0'..=b'9' => Ok(c - b'0'),
        b'a'..=b'f' => Ok(c - b'a' + 10),
        b'A'..=b'F' => Ok(c - b'A' + 10),
        _ => Err(format!("invalid hex nibble: {c:#x}")),
    }
}

fn hex_encode(bytes: &[u8]) -> String {
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        s.push_str(&format!("{b:02x}"));
    }
    s
}

fn render_json_envelope(
    domain: &Eip712Domain,
    primary_type: &str,
    fields: &[Eip712Field],
) -> String {
    let mut out = String::new();
    out.push_str("{\"types\":{\"EIP712Domain\":[");
    out.push_str("{\"name\":\"name\",\"type\":\"string\"},");
    out.push_str("{\"name\":\"version\",\"type\":\"string\"},");
    out.push_str("{\"name\":\"chainId\",\"type\":\"uint256\"},");
    out.push_str("{\"name\":\"verifyingContract\",\"type\":\"address\"}");
    out.push_str("],\"");
    out.push_str(primary_type);
    out.push_str("\":[");
    for (i, f) in fields.iter().enumerate() {
        if i > 0 {
            out.push(',');
        }
        out.push_str("{\"name\":\"");
        out.push_str(&f.name);
        out.push_str("\",\"type\":\"");
        out.push_str(&f.sol_type);
        out.push_str("\"}");
    }
    out.push_str("]},\"primaryType\":\"");
    out.push_str(primary_type);
    out.push_str("\",\"domain\":{\"name\":\"");
    out.push_str(&domain.name);
    out.push_str("\",\"version\":\"");
    out.push_str(&domain.version);
    out.push_str("\",\"chainId\":");
    out.push_str(&domain.chain_id.to_string());
    out.push_str(",\"verifyingContract\":\"");
    out.push_str(&domain.verifying_contract);
    out.push_str("\"},\"message\":{");
    for (i, f) in fields.iter().enumerate() {
        if i > 0 {
            out.push(',');
        }
        out.push('"');
        out.push_str(&f.name);
        out.push_str("\":\"");
        out.push_str(&f.value);
        out.push('"');
    }
    out.push_str("}}");
    out
}

// -----------------------------------------------------------------------------
// Multicall3 batch encoder.
// -----------------------------------------------------------------------------

/// One call in a Multicall3 `aggregate3` batch.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Multicall3Call {
    /// Target contract address (20-byte hex, `0x`-prefixed).
    pub target: String,
    /// `allowFailure` flag — when `true`, one revert does not roll back the batch.
    pub allow_failure: bool,
    /// Hex-encoded calldata (`0x`-prefixed) for the sub-call. Kiwa users
    /// typically get this from [`super::ContractCall`].
    pub call_data: String,
}

/// Result of a Multicall3 encode.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Multicall3Encoded {
    /// The 4-byte selector for `aggregate3(tuple(address,bool,bytes)[])`.
    /// Baked in so callers do not need to re-hash it.
    pub selector_hex: String,
    /// Fully-encoded calldata blob — selector + ABI-encoded call array.
    pub data_hex: String,
    /// Number of sub-calls in the batch (mirrors [`Multicall3Call`] input).
    pub call_count: usize,
}

/// Encode a Multicall3 `aggregate3` calldata blob.
pub fn encode_multicall3(calls: &[Multicall3Call]) -> Result<Multicall3Encoded, String> {
    let selector = keccak_selector_hex("aggregate3((address,bool,bytes)[])");
    let mut buf = Vec::new();
    let sel_bytes = hex_decode(&selector)?;
    buf.extend_from_slice(&sel_bytes);
    // ABI-encode the single dynamic argument (`tuple(address,bool,bytes)[]`).
    // Layout:
    //   [offset to array]        (32 bytes, always 0x20)
    //   [array length]           (32 bytes)
    //   [tuple offsets]          (32 bytes × N)
    //   [tuple bodies]           (variable)
    // Each tuple body:
    //   [address]                (32 bytes, left-padded)
    //   [allowFailure bool]      (32 bytes)
    //   [offset to calldata]     (32 bytes)
    //   [calldata length]        (32 bytes)
    //   [calldata bytes]         (padded to 32-byte multiple)
    let n = calls.len();
    push_u256(&mut buf, 0x20);
    push_u256(&mut buf, n as u64);
    // Compute each tuple body separately, remember its offset within the
    // "tuples" region so we can emit the offsets table before the bodies.
    let mut tuple_bodies: Vec<Vec<u8>> = Vec::with_capacity(n);
    for c in calls {
        let mut body = Vec::new();
        body.extend_from_slice(&address_to_word(&c.target)?);
        let mut allow_word = [0u8; 32];
        if c.allow_failure {
            allow_word[31] = 1;
        }
        body.extend_from_slice(&allow_word);
        // Offset to calldata within THIS tuple body = 3 words (96 bytes).
        push_u256(&mut body, 96);
        let raw = hex_decode(&c.call_data)?;
        push_u256(&mut body, raw.len() as u64);
        body.extend_from_slice(&raw);
        // Pad to 32-byte multiple.
        let padding = (32 - (raw.len() % 32)) % 32;
        body.extend(std::iter::repeat(0u8).take(padding));
        tuple_bodies.push(body);
    }
    // Offsets to each tuple body, relative to the START of the offsets table
    // (i.e. the first offset slot). This mirrors solc's dynamic-array-of-
    // dynamic-tuples layout.
    let offsets_bytes = 32 * n;
    let mut running = offsets_bytes as u64;
    for body in &tuple_bodies {
        push_u256(&mut buf, running);
        running += body.len() as u64;
    }
    for body in tuple_bodies {
        buf.extend_from_slice(&body);
    }
    Ok(Multicall3Encoded {
        selector_hex: selector,
        data_hex: format!("0x{}", hex_encode(&buf)),
        call_count: n,
    })
}

fn push_u256(buf: &mut Vec<u8>, value: u64) {
    buf.extend_from_slice(&u256_be_from_u64(value));
}

// -----------------------------------------------------------------------------
// Permit2 PermitWitnessTransferFrom encoder.
// -----------------------------------------------------------------------------

/// Permit2 `permitWitnessTransferFrom` inputs — the subset kiwa tests drive.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Permit2PermitTransfer {
    /// ERC-20 token address the transfer moves.
    pub token: String,
    /// Amount permitted (uint256, hex-encoded `0x`-prefixed).
    pub amount_hex: String,
    /// Recipient address of the transfer.
    pub recipient: String,
    /// Signer / owner address — used only for the EIP-712 struct digest.
    pub owner: String,
    /// Nonce (uint256, hex-encoded).
    pub nonce_hex: String,
    /// Deadline block timestamp (uint256, hex-encoded).
    pub deadline_hex: String,
    /// Witness — an opaque 32-byte hash consumed by the application layer.
    pub witness_hex: String,
    /// Witness type-string (e.g. `"WitnessData witness"`), used for the
    /// EIP-712 type hash.
    pub witness_type_string: String,
}

/// Result of the Permit2 encode.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Permit2Encoded {
    /// 4-byte selector for
    /// `permitWitnessTransferFrom(...)` — baked in so callers do not
    /// re-hash it.
    pub selector_hex: String,
    /// Fully-encoded calldata blob.
    pub data_hex: String,
    /// EIP-712 digest the signer must sign over (`0x`-prefixed 32-byte hex).
    pub eip712_digest_hex: String,
}

/// Encode a Permit2 `permitWitnessTransferFrom` call and return the
/// corresponding EIP-712 witness digest.
///
/// Signature encoded — matches Uniswap Permit2 v1 canonical form:
/// `permitWitnessTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes32,string,bytes)`
/// where the first tuple nests `TokenPermissions = (address token, uint256 amount)`
/// inside `PermitTransferFrom = (TokenPermissions permitted, uint256 nonce, uint256 deadline)`.
pub fn encode_permit2_witness_transfer(
    input: &Permit2PermitTransfer,
    domain: &Eip712Domain,
) -> Result<Permit2Encoded, String> {
    validate_domain(domain)?;
    // Canonical Uniswap Permit2 selector for permitWitnessTransferFrom.
    // First tuple is nested: PermitTransferFrom(TokenPermissions permitted, uint256 nonce, uint256 deadline)
    // where TokenPermissions = (address token, uint256 amount).
    let selector = keccak_selector_hex(
        "permitWitnessTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes32,string,bytes)",
    );
    let mut buf = Vec::new();
    buf.extend_from_slice(&hex_decode(&selector)?);
    // Static-portion ABI-encoded layout — all sub-tuples are static because
    // they contain no dynamic types, so they inline in place:
    //   PermitTransferFrom.permitted.token       (address)
    //   PermitTransferFrom.permitted.amount      (uint256)
    //   PermitTransferFrom.nonce                 (uint256)
    //   PermitTransferFrom.deadline              (uint256)
    //   SignatureTransferDetails.to              (address)
    //   SignatureTransferDetails.requestedAmount (uint256, mirrors permitted amount)
    //   owner                                    (address)
    //   witness                                  (bytes32)
    //   witnessTypeString offset                 (uint256)  → dynamic tail
    //   signature offset                         (uint256)  → dynamic tail
    // Dynamic tail carries witnessTypeString + signature length-prefixed.
    // We reserve a zero-length signature placeholder; callers replace it
    // with the 65-byte signature after signing.
    buf.extend_from_slice(&address_to_word(&input.token)?);
    buf.extend_from_slice(&hex_to_word(&input.amount_hex)?);
    buf.extend_from_slice(&hex_to_word(&input.nonce_hex)?);
    buf.extend_from_slice(&hex_to_word(&input.deadline_hex)?);
    buf.extend_from_slice(&address_to_word(&input.recipient)?);
    buf.extend_from_slice(&hex_to_word(&input.amount_hex)?);
    buf.extend_from_slice(&address_to_word(&input.owner)?);
    let witness_bytes = hex_decode(&input.witness_hex)?;
    if witness_bytes.len() != 32 {
        return Err("Permit2PermitTransfer.witness_hex must decode to 32 bytes".to_string());
    }
    buf.extend_from_slice(&witness_bytes);
    // Dynamic tail offsets — start after 8 static words + 2 offset words = 320.
    push_u256(&mut buf, 320);
    // Compute witness-tail bytes so we know where the signature slot lands.
    let ws_bytes = input.witness_type_string.as_bytes();
    let ws_padded = pad32(ws_bytes.len());
    let sig_offset = 320 + 32 + ws_padded;
    push_u256(&mut buf, sig_offset as u64);
    // witnessTypeString tail — length + bytes + padding.
    push_u256(&mut buf, ws_bytes.len() as u64);
    buf.extend_from_slice(ws_bytes);
    let padding = ws_padded - ws_bytes.len();
    buf.extend(std::iter::repeat(0u8).take(padding));
    // Empty signature slot — length 0 + no data. Callers replace this with
    // `[len=65, sig_bytes..padding]` after signing.
    push_u256(&mut buf, 0);
    let digest = compute_permit2_digest(input, domain);
    Ok(Permit2Encoded {
        selector_hex: selector,
        data_hex: format!("0x{}", hex_encode(&buf)),
        eip712_digest_hex: format!("0x{}", hex_encode(&digest)),
    })
}

fn hex_to_word(s: &str) -> Result<[u8; 32], String> {
    let bytes = hex_decode(s)?;
    if bytes.len() > 32 {
        return Err(format!("hex value '{s}' exceeds 32 bytes"));
    }
    let mut w = [0u8; 32];
    let start = 32 - bytes.len();
    w[start..].copy_from_slice(&bytes);
    Ok(w)
}

fn pad32(len: usize) -> usize {
    if len == 0 {
        0
    } else {
        len + ((32 - (len % 32)) % 32)
    }
}

fn compute_permit2_digest(input: &Permit2PermitTransfer, domain: &Eip712Domain) -> [u8; 32] {
    // Canonical Permit2 witness type string, per Uniswap Permit2 spec.
    // Users pass the "witness" fragment — the outer `PermitWitnessTransferFrom`
    // shape is fixed.
    let type_string = format!(
        "PermitWitnessTransferFrom(TokenPermissions permitted,address spender,uint256 nonce,uint256 deadline,{})TokenPermissions(address token,uint256 amount)",
        input.witness_type_string
    );
    let type_hash = keccak256(type_string.as_bytes());
    let mut struct_buf = Vec::new();
    struct_buf.extend_from_slice(&type_hash);
    // permitted (TokenPermissions) → struct hash of (token, amount).
    let tp_type_hash = keccak256(b"TokenPermissions(address token,uint256 amount)");
    let mut tp_buf = Vec::new();
    tp_buf.extend_from_slice(&tp_type_hash);
    tp_buf.extend_from_slice(&address_to_word(&input.token).unwrap_or([0u8; 32]));
    tp_buf.extend_from_slice(&hex_to_word(&input.amount_hex).unwrap_or([0u8; 32]));
    struct_buf.extend_from_slice(&keccak256(&tp_buf));
    // spender = recipient (Permit2 spec: witness transfer spender is the recipient).
    struct_buf.extend_from_slice(&address_to_word(&input.recipient).unwrap_or([0u8; 32]));
    struct_buf.extend_from_slice(&hex_to_word(&input.nonce_hex).unwrap_or([0u8; 32]));
    struct_buf.extend_from_slice(&hex_to_word(&input.deadline_hex).unwrap_or([0u8; 32]));
    // Witness — 32-byte word inlined.
    let witness_bytes = hex_decode(&input.witness_hex).unwrap_or_default();
    let mut witness_word = [0u8; 32];
    if witness_bytes.len() == 32 {
        witness_word.copy_from_slice(&witness_bytes);
    }
    struct_buf.extend_from_slice(&witness_word);
    let struct_hash = keccak256(&struct_buf);
    let domain_separator = compute_domain_separator(domain);
    let mut prefixed = Vec::with_capacity(2 + 32 + 32);
    prefixed.extend_from_slice(&[0x19, 0x01]);
    prefixed.extend_from_slice(&domain_separator);
    prefixed.extend_from_slice(&struct_hash);
    keccak256(&prefixed)
}
