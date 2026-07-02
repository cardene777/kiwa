//! PoC tests — exercise the alloy helper shape end-to-end without alloy.

use contract_rust_alloy_poc::{
    anvil_signer_and_provider, build_item, build_param, erc20_transfer_call, function_signatures,
    synthetic_erc20_abi,
};
use kiwa::contract::alloy::{canonical_signature, Provider, Signer};

#[test]
fn t_poc_a_001_synthetic_erc20_abi_has_expected_functions() {
    let abi = synthetic_erc20_abi();
    let sigs = function_signatures(&abi);
    assert!(sigs.contains(&"transfer(address,uint256)".to_string()));
    assert!(sigs.contains(&"totalSupply()".to_string()));
}

#[test]
fn t_poc_a_002_transfer_call_uses_erc20_canonical_selector() {
    let abi = synthetic_erc20_abi();
    let call = erc20_transfer_call(&abi, "0xcafe", "0xbeef", 1_000_000);
    assert_eq!(call.selector_hex, "0xa9059cbb");
    assert!(call.data_hex.starts_with("0xa9059cbb"));
    assert!(call.data_hex.contains("beef"));
}

#[test]
fn t_poc_a_003_transfer_encodes_amount_as_hex() {
    let abi = synthetic_erc20_abi();
    let call = erc20_transfer_call(&abi, "0xcafe", "0xbeef", 255);
    assert!(call.data_hex.ends_with("ff"));
}

#[test]
fn t_poc_a_004_anvil_signer_provider_shape() {
    let (signer, provider) = anvil_signer_and_provider(8545);
    assert_eq!(signer.chain_id(), 31337);
    match provider {
        Provider::Http { url } => assert_eq!(url, "http://127.0.0.1:8545"),
        _ => panic!("expected Http provider"),
    }
    match signer {
        Signer::LocalWallet { seed_descriptor, .. } => {
            assert_eq!(seed_descriptor, "anvil-account-0");
        }
        _ => panic!("expected LocalWallet signer"),
    }
}

#[test]
fn t_poc_a_005_build_param_roundtrips_all_fields() {
    let p = build_param("to", "address", false);
    assert_eq!(p.name, "to");
    assert_eq!(p.sol_type, "address");
    assert!(!p.indexed);
}

#[test]
fn t_poc_a_006_build_item_gives_valid_canonical_signature() {
    let item = build_item("myMethod", "uint256");
    assert_eq!(canonical_signature(&item), "myMethod(uint256)");
}

#[test]
fn t_poc_a_007_abi_carries_raw_json_for_reparse() {
    let abi = synthetic_erc20_abi();
    assert!(abi.raw_json.contains("transfer"));
    assert!(abi.raw_json.contains("totalSupply"));
}

#[test]
fn t_poc_a_008_selector_map_and_kind_map_are_consistent() {
    let abi = synthetic_erc20_abi();
    assert_eq!(abi.items_by_selector.len(), 2);
    assert_eq!(abi.items_by_kind["function"].len(), 2);
}
