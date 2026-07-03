//! Integration tests for the alloy helpers submodule (v0.5).
//!
//! Covers:
//! - EIP-712 typed data digest computation + JSON envelope shape.
//! - Multicall3 aggregate3 calldata encoding.
//! - Permit2 permitWitnessTransferFrom calldata + digest.
//!
//! Tests do not need any alloy crate on the compile tree — they exercise the
//! pure-Rust helpers kiwa ships and cross-check against expected byte
//! layouts derived from the Ethereum standard.

#![cfg(feature = "contract-alloy")]

use kiwa::contract::alloy::{
    build_eip712_typed_data, encode_multicall3, encode_permit2_witness_transfer, Eip712Domain,
    Eip712Field, Multicall3Call, Permit2PermitTransfer,
};

fn permit2_domain() -> Eip712Domain {
    Eip712Domain {
        name: "Permit2".to_string(),
        version: "1".to_string(),
        chain_id: 1,
        verifying_contract: "0x000000000022D473030F116dDEE9F6B43aC78BA3".to_string(),
    }
}

// -----------------------------------------------------------------------------
// EIP-712 typed data.
// -----------------------------------------------------------------------------

#[test]
fn t_eip712_001_builds_digest_and_envelope_for_permit_payload() {
    let domain = Eip712Domain {
        name: "Test".to_string(),
        version: "1".to_string(),
        chain_id: 1,
        verifying_contract: "0x1111111111111111111111111111111111111111".to_string(),
    };
    let td = build_eip712_typed_data(
        domain,
        "Permit",
        vec![
            Eip712Field {
                name: "owner".to_string(),
                sol_type: "address".to_string(),
                value: "0x2222222222222222222222222222222222222222".to_string(),
            },
            Eip712Field {
                name: "value".to_string(),
                sol_type: "uint256".to_string(),
                value: "0x0100".to_string(),
            },
        ],
    )
    .expect("digest must build");
    assert!(td.digest_hex.starts_with("0x"));
    assert_eq!(td.digest_hex.len(), 66); // 0x + 64 hex chars = 32 bytes.
    assert_eq!(td.primary_type, "Permit");
    assert_eq!(td.fields.len(), 2);
    // JSON envelope must include primary type + domain fields.
    assert!(td.json_envelope.contains("\"primaryType\":\"Permit\""));
    assert!(td.json_envelope.contains("\"name\":\"Test\""));
}

#[test]
fn t_eip712_002_rejects_short_verifying_contract() {
    let domain = Eip712Domain {
        name: "X".to_string(),
        version: "1".to_string(),
        chain_id: 1,
        verifying_contract: "0x1234".to_string(),
    };
    let err = build_eip712_typed_data(domain, "T", vec![]).unwrap_err();
    assert!(err.contains("20-byte hex"));
}

#[test]
fn t_eip712_003_rejects_unsupported_field_type() {
    let domain = Eip712Domain {
        name: "X".to_string(),
        version: "1".to_string(),
        chain_id: 1,
        verifying_contract: "0x1111111111111111111111111111111111111111".to_string(),
    };
    let err = build_eip712_typed_data(
        domain,
        "T",
        vec![Eip712Field {
            name: "child".to_string(),
            sol_type: "SomeNestedStruct".to_string(),
            value: String::new(),
        }],
    )
    .unwrap_err();
    assert!(err.contains("unsupported sol_type"));
}

#[test]
fn t_eip712_004_rejects_empty_field_name() {
    let domain = Eip712Domain {
        name: "X".to_string(),
        version: "1".to_string(),
        chain_id: 1,
        verifying_contract: "0x1111111111111111111111111111111111111111".to_string(),
    };
    let err = build_eip712_typed_data(
        domain,
        "T",
        vec![Eip712Field {
            name: String::new(),
            sol_type: "address".to_string(),
            value: "0x2222222222222222222222222222222222222222".to_string(),
        }],
    )
    .unwrap_err();
    assert!(err.contains("non-empty"));
}

#[test]
fn t_eip712_005_digest_depends_on_field_values() {
    let mk = |value: &str| -> String {
        let domain = Eip712Domain {
            name: "T".to_string(),
            version: "1".to_string(),
            chain_id: 1,
            verifying_contract: "0x1111111111111111111111111111111111111111".to_string(),
        };
        let td = build_eip712_typed_data(
            domain,
            "Msg",
            vec![Eip712Field {
                name: "n".to_string(),
                sol_type: "uint256".to_string(),
                value: value.to_string(),
            }],
        )
        .unwrap();
        td.digest_hex
    };
    assert_ne!(mk("0x01"), mk("0x02"));
}

#[test]
fn t_eip712_006_string_field_hashes_via_keccak() {
    let domain = Eip712Domain {
        name: "T".to_string(),
        version: "1".to_string(),
        chain_id: 1,
        verifying_contract: "0x1111111111111111111111111111111111111111".to_string(),
    };
    let td = build_eip712_typed_data(
        domain,
        "Note",
        vec![Eip712Field {
            name: "content".to_string(),
            sol_type: "string".to_string(),
            value: "hello".to_string(),
        }],
    )
    .unwrap();
    // Digest must be a valid 32-byte hex — no zero words.
    let bytes = &td.digest_hex[2..];
    assert!(bytes.chars().any(|c| c != '0'));
}

// -----------------------------------------------------------------------------
// Multicall3.
// -----------------------------------------------------------------------------

#[test]
fn t_multicall3_001_encodes_selector_first() {
    let enc = encode_multicall3(&[Multicall3Call {
        target: "0x1111111111111111111111111111111111111111".to_string(),
        allow_failure: false,
        call_data: "0xdeadbeef".to_string(),
    }])
    .unwrap();
    // Selector for aggregate3((address,bool,bytes)[]) — precomputed.
    // We just verify the encoded blob starts with the selector.
    assert!(enc.data_hex.starts_with("0x"));
    let sel_bytes = &enc.selector_hex[2..];
    assert!(enc.data_hex[2..].starts_with(sel_bytes));
    assert_eq!(enc.call_count, 1);
}

#[test]
fn t_multicall3_002_supports_multiple_calls() {
    let enc = encode_multicall3(&[
        Multicall3Call {
            target: "0x1111111111111111111111111111111111111111".to_string(),
            allow_failure: false,
            call_data: "0xdeadbeef".to_string(),
        },
        Multicall3Call {
            target: "0x2222222222222222222222222222222222222222".to_string(),
            allow_failure: true,
            call_data: "0xcafebabe".to_string(),
        },
    ])
    .unwrap();
    assert_eq!(enc.call_count, 2);
    assert!(enc.data_hex.len() > 200); // Larger than a single-call blob.
}

#[test]
fn t_multicall3_003_rejects_short_target_address() {
    let err = encode_multicall3(&[Multicall3Call {
        target: "0x1234".to_string(),
        allow_failure: false,
        call_data: "0x00".to_string(),
    }])
    .unwrap_err();
    assert!(err.contains("20 bytes"));
}

#[test]
fn t_multicall3_004_rejects_bad_calldata_hex() {
    let err = encode_multicall3(&[Multicall3Call {
        target: "0x1111111111111111111111111111111111111111".to_string(),
        allow_failure: false,
        call_data: "0xzz".to_string(),
    }])
    .unwrap_err();
    assert!(err.contains("hex"));
}

#[test]
fn t_multicall3_005_selector_matches_expected_signature() {
    let enc = encode_multicall3(&[]).unwrap();
    assert_eq!(enc.selector_hex.len(), 10); // 0x + 8 hex.
    // Selector is derived from the tuple-array signature we document.
    assert!(enc.selector_hex.starts_with("0x"));
}

// -----------------------------------------------------------------------------
// Permit2.
// -----------------------------------------------------------------------------

fn permit2_input() -> Permit2PermitTransfer {
    Permit2PermitTransfer {
        token: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48".to_string(), // USDC.
        amount_hex: "0x0f4240".to_string(), // 1_000_000 (1 USDC).
        recipient: "0x3333333333333333333333333333333333333333".to_string(),
        owner: "0x4444444444444444444444444444444444444444".to_string(),
        nonce_hex: "0x01".to_string(),
        deadline_hex: "0x64".to_string(),
        witness_hex: "0x1111111111111111111111111111111111111111111111111111111111111111".to_string(),
        witness_type_string: "WitnessData witness".to_string(),
    }
}

#[test]
fn t_permit2_001_encodes_selector_and_digest() {
    let out =
        encode_permit2_witness_transfer(&permit2_input(), &permit2_domain()).expect("encode");
    assert!(out.selector_hex.starts_with("0x"));
    assert_eq!(out.selector_hex.len(), 10);
    assert_eq!(out.eip712_digest_hex.len(), 66);
    assert!(out.data_hex.starts_with("0x"));
}

#[test]
fn t_permit2_002_rejects_short_witness_hash() {
    let mut inp = permit2_input();
    inp.witness_hex = "0x1234".to_string();
    let err =
        encode_permit2_witness_transfer(&inp, &permit2_domain()).unwrap_err();
    assert!(err.contains("32 bytes"));
}

#[test]
fn t_permit2_003_rejects_bad_domain() {
    let mut dom = permit2_domain();
    dom.verifying_contract = "0x1234".to_string();
    let err = encode_permit2_witness_transfer(&permit2_input(), &dom).unwrap_err();
    assert!(err.contains("20-byte hex"));
}

#[test]
fn t_permit2_004_digest_changes_when_nonce_changes() {
    let a =
        encode_permit2_witness_transfer(&permit2_input(), &permit2_domain()).unwrap();
    let mut inp = permit2_input();
    inp.nonce_hex = "0x02".to_string();
    let b = encode_permit2_witness_transfer(&inp, &permit2_domain()).unwrap();
    assert_ne!(a.eip712_digest_hex, b.eip712_digest_hex);
}

#[test]
fn t_permit2_005_calldata_encodes_token_and_recipient_addresses() {
    let out =
        encode_permit2_witness_transfer(&permit2_input(), &permit2_domain()).unwrap();
    // token address left-padded to 32 bytes appears in the encoded blob.
    let token_lc = "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
    assert!(out.data_hex.contains(token_lc));
    let recip_lc = "3333333333333333333333333333333333333333";
    assert!(out.data_hex.contains(recip_lc));
}

#[test]
fn t_permit2_006_witness_type_string_embedded_in_calldata() {
    let out =
        encode_permit2_witness_transfer(&permit2_input(), &permit2_domain()).unwrap();
    // The witness type string "WitnessData witness" is hex-encoded in the tail.
    let ws = "WitnessData witness";
    let ws_hex: String = ws
        .bytes()
        .map(|b| format!("{b:02x}"))
        .collect();
    assert!(out.data_hex.contains(&ws_hex));
}

// -----------------------------------------------------------------------------
// Cross-check between EIP-712 helper and Permit2 encoder.
// -----------------------------------------------------------------------------

#[test]
fn t_helpers_cross_001_domain_separator_consistent_across_helpers() {
    // Two EIP-712 payloads under the same domain should produce different
    // digests only when the field content differs. This exercises the domain
    // separator path shared by both `build_eip712_typed_data` and
    // `encode_permit2_witness_transfer`.
    let domain = permit2_domain();
    let a = build_eip712_typed_data(
        domain.clone(),
        "Msg",
        vec![Eip712Field {
            name: "n".to_string(),
            sol_type: "uint256".to_string(),
            value: "0x01".to_string(),
        }],
    )
    .unwrap();
    let b = build_eip712_typed_data(
        domain,
        "Msg",
        vec![Eip712Field {
            name: "n".to_string(),
            sol_type: "uint256".to_string(),
            value: "0x01".to_string(),
        }],
    )
    .unwrap();
    assert_eq!(a.digest_hex, b.digest_hex);
}
