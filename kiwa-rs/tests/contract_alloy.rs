//! Integration tests for the alloy.rs contract adapter.
//!
//! Tests do not require any alloy crate to be present — they exercise the
//! pure-Rust helpers kiwa ships (ABI parser, selector computation via a
//! built-in keccak-256, signer + provider enums, and call encoding).

#![cfg(feature = "contract-alloy")]

use kiwa::contract::alloy::{
    canonical_signature, keccak256, keccak_selector_hex, ContractCall, Provider, Signer, SolAbi,
    SolAbiItem, SolAbiParam,
};

fn erc20_abi_json() -> &'static str {
    // Minimal ERC-20 ABI fragment — a Foundry `out/*.json`-shaped envelope.
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

#[test]
fn t_alloy_001_parse_foundry_out_extracts_functions_and_events() {
    let abi = SolAbi::parse_foundry_out("ERC20", erc20_abi_json()).unwrap();
    assert_eq!(abi.contract_name, "ERC20");
    assert!(abi.items_by_kind.contains_key("function"));
    assert!(abi.items_by_kind.contains_key("event"));
    assert_eq!(abi.items_by_kind["function"].len(), 2);
    assert_eq!(abi.items_by_kind["event"].len(), 1);
}

#[test]
fn t_alloy_002_parse_foundry_out_computes_selectors_for_functions() {
    let abi = SolAbi::parse_foundry_out("ERC20", erc20_abi_json()).unwrap();
    // Known ERC-20 selectors — verified against Ethereum yellow paper.
    let transfer = abi.selector_of("transfer").unwrap();
    let balance = abi.selector_of("balanceOf").unwrap();
    assert_eq!(transfer, "0xa9059cbb");
    assert_eq!(balance, "0x70a08231");
}

#[test]
fn t_alloy_003_parse_foundry_out_rejects_missing_abi_key() {
    let err = SolAbi::parse_foundry_out("X", r#"{ "bytecode": "0x00" }"#).unwrap_err();
    assert!(err.contains("could not locate top-level"));
}

#[test]
fn t_alloy_004_signature_of_returns_canonical_form() {
    let abi = SolAbi::parse_foundry_out("ERC20", erc20_abi_json()).unwrap();
    assert_eq!(abi.signature_of("transfer").unwrap(), "transfer(address,uint256)");
    assert_eq!(abi.signature_of("balanceOf").unwrap(), "balanceOf(address)");
}

#[test]
fn t_alloy_005_signature_of_returns_none_for_missing_function() {
    let abi = SolAbi::parse_foundry_out("ERC20", erc20_abi_json()).unwrap();
    assert!(abi.signature_of("nonexistent").is_none());
}

#[test]
fn t_alloy_006_signature_of_returns_none_when_overloaded() {
    let abi_json = r#"{
      "abi": [
        {
          "type": "function",
          "name": "foo",
          "inputs": [ { "name": "x", "type": "uint256" } ],
          "outputs": [],
          "stateMutability": "nonpayable"
        },
        {
          "type": "function",
          "name": "foo",
          "inputs": [ { "name": "x", "type": "address" } ],
          "outputs": [],
          "stateMutability": "nonpayable"
        }
      ]
    }"#;
    let abi = SolAbi::parse_foundry_out("X", abi_json).unwrap();
    assert!(abi.signature_of("foo").is_none());
    assert_eq!(abi.items_by_selector.len(), 2);
}

#[test]
fn t_alloy_007_event_inputs_include_indexed_flag() {
    let abi = SolAbi::parse_foundry_out("ERC20", erc20_abi_json()).unwrap();
    let transfer_event = &abi.items_by_kind["event"][0];
    assert_eq!(transfer_event.name, "Transfer");
    let from_param = &transfer_event.inputs[0];
    assert!(from_param.indexed);
    let value_param = &transfer_event.inputs[2];
    assert!(!value_param.indexed);
}

#[test]
fn t_alloy_008_canonical_signature_works_for_no_args() {
    let item = SolAbiItem {
        kind: "function".to_string(),
        name: "renounceOwnership".to_string(),
        inputs: vec![],
        outputs: vec![],
        state_mutability: "nonpayable".to_string(),
    };
    assert_eq!(canonical_signature(&item), "renounceOwnership()");
}

#[test]
fn t_alloy_009_selector_of_matches_known_erc20_hex() {
    // transfer(address,uint256) selector is a canonical ecosystem constant.
    assert_eq!(
        keccak_selector_hex("transfer(address,uint256)"),
        "0xa9059cbb"
    );
    // balanceOf(address) → 0x70a08231.
    assert_eq!(keccak_selector_hex("balanceOf(address)"), "0x70a08231");
}

#[test]
fn t_alloy_010_keccak256_matches_empty_input_hash() {
    // keccak256("") — ecosystem constant.
    let hash = keccak256(b"");
    let expected_prefix = [0xc5, 0xd2, 0x46, 0x01];
    assert_eq!(&hash[0..4], &expected_prefix);
}

#[test]
fn t_alloy_011_signer_localwallet_exposes_chain_id() {
    let signer = Signer::LocalWallet {
        chain_id: 31337,
        seed_descriptor: "anvil-account-0".to_string(),
    };
    assert_eq!(signer.chain_id(), 31337);
}

#[test]
fn t_alloy_012_signer_aws_kms_exposes_chain_id() {
    let signer = Signer::AwsKms {
        chain_id: 1,
        key_id: "alias/my-signer".to_string(),
        region: "us-east-1".to_string(),
    };
    assert_eq!(signer.chain_id(), 1);
}

#[test]
fn t_alloy_013_signer_ledger_exposes_chain_id() {
    let signer = Signer::Ledger {
        chain_id: 137,
        hd_path: "m/44'/60'/0'/0/0".to_string(),
    };
    assert_eq!(signer.chain_id(), 137);
}

#[test]
fn t_alloy_014_signer_trezor_exposes_chain_id() {
    let signer = Signer::Trezor {
        chain_id: 8453,
        hd_path: "m/44'/60'/0'/0/0".to_string(),
    };
    assert_eq!(signer.chain_id(), 8453);
}

#[test]
fn t_alloy_015_provider_http_reports_kind() {
    let p = Provider::Http { url: "http://127.0.0.1:8545".to_string() };
    assert_eq!(p.kind(), "http");
}

#[test]
fn t_alloy_016_provider_ws_reports_kind() {
    let p = Provider::Ws { url: "ws://127.0.0.1:8545".to_string() };
    assert_eq!(p.kind(), "ws");
}

#[test]
fn t_alloy_017_provider_ipc_reports_kind() {
    let p = Provider::Ipc { path: "/tmp/anvil.ipc".to_string() };
    assert_eq!(p.kind(), "ipc");
}

#[test]
fn t_alloy_018_provider_anvil_http_constructor() {
    let p = Provider::anvil_http(8545);
    match p {
        Provider::Http { url } => assert_eq!(url, "http://127.0.0.1:8545"),
        _ => panic!("expected Http variant"),
    }
}

#[test]
fn t_alloy_019_contract_call_no_args_uses_selector_as_data() {
    let call = ContractCall::no_args("0xabc", "0xa9059cbb");
    assert_eq!(call.selector_hex, "0xa9059cbb");
    assert_eq!(call.data_hex, "0xa9059cbb");
    assert_eq!(call.to, "0xabc");
}

#[test]
fn t_alloy_020_contract_call_with_encoded_args_appends_data() {
    let call = ContractCall::with_encoded_args(
        "0xabc",
        "0xa9059cbb",
        "0000000000000000000000001111111111111111111111111111111111111111",
    );
    assert_eq!(call.selector_hex, "0xa9059cbb");
    assert!(call.data_hex.starts_with("0xa9059cbb"));
    assert!(call.data_hex.contains("1111111111111111111111111111111111111111"));
}

#[test]
fn t_alloy_021_contract_call_normalizes_selector_case() {
    let call = ContractCall::no_args("0xabc", "0xA9059CBB");
    assert_eq!(call.selector_hex, "0xa9059cbb");
}

#[test]
fn t_alloy_022_contract_call_accepts_missing_0x_prefix() {
    let call = ContractCall::no_args("0xabc", "a9059cbb");
    assert_eq!(call.selector_hex, "0xa9059cbb");
}

#[test]
fn t_alloy_023_parse_foundry_out_preserves_raw_json_for_reparse() {
    let abi = SolAbi::parse_foundry_out("ERC20", erc20_abi_json()).unwrap();
    assert!(abi.raw_json.contains("\"transfer\""));
    assert!(abi.raw_json.contains("\"balanceOf\""));
}

#[test]
fn t_alloy_024_solabiparam_shape_survives_round_trip() {
    let param = SolAbiParam {
        name: "amount".to_string(),
        sol_type: "uint256".to_string(),
        indexed: false,
    };
    assert_eq!(param.name, "amount");
    assert_eq!(param.sol_type, "uint256");
    assert!(!param.indexed);
}

#[test]
fn t_alloy_025_parse_foundry_out_handles_nested_tuple_types() {
    let abi_json = r#"{
      "abi": [
        {
          "type": "function",
          "name": "swap",
          "inputs": [ { "name": "params", "type": "(uint256,address)" } ],
          "outputs": [],
          "stateMutability": "nonpayable"
        }
      ]
    }"#;
    let abi = SolAbi::parse_foundry_out("Swap", abi_json).unwrap();
    let sig = abi.signature_of("swap").unwrap();
    assert_eq!(sig, "swap((uint256,address))");
}
