//! PoC — a small "alloy contract test harness" using kiwa's pure-Rust alloy
//! helper. Real projects would pull the alloy crate family and use the parsed
//! `SolAbi` to feed the `sol!` macro; here we exercise the pure-Rust shape.

use kiwa::contract::alloy::{
    canonical_signature, ContractCall, Provider, Signer, SolAbi, SolAbiItem, SolAbiParam,
};

/// Build a `ContractCall` for `ERC20.transfer(to, amount)` on the given
/// contract address. Selector is derived from a parsed ABI, not hard-coded.
pub fn erc20_transfer_call(
    abi: &SolAbi,
    contract_address: &str,
    to_address: &str,
    amount: u128,
) -> ContractCall {
    let selector = abi
        .selector_of("transfer")
        .expect("PoC: transfer must be present in the ABI");
    let mut encoded = String::new();
    encoded.push_str(&format!("{:0>64}", to_address.trim_start_matches("0x")));
    encoded.push_str(&format!("{:0>64x}", amount));
    ContractCall::with_encoded_args(contract_address, &selector, &encoded)
}

/// Build a signer + provider tuple for an anvil-backed test — the shape a
/// downstream `alloy_provider::ProviderBuilder` would consume.
pub fn anvil_signer_and_provider(port: u16) -> (Signer, Provider) {
    (
        Signer::LocalWallet {
            chain_id: 31337,
            seed_descriptor: "anvil-account-0".to_string(),
        },
        Provider::anvil_http(port),
    )
}

/// Build a minimal in-memory ERC20-ish ABI for tests that do not want to hand
/// over a raw Foundry `out/*.json` file. Kept synthetic on purpose.
pub fn synthetic_erc20_abi() -> SolAbi {
    let abi_json = r#"{
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
          "name": "totalSupply",
          "inputs": [],
          "outputs": [ { "name": "", "type": "uint256" } ],
          "stateMutability": "view"
        }
      ]
    }"#;
    SolAbi::parse_foundry_out("ERC20", abi_json).unwrap()
}

/// Show the canonical signature of every function in the parsed ABI — the
/// same shape a `sol!` macro would code-gen structs from.
pub fn function_signatures(abi: &SolAbi) -> Vec<String> {
    abi.items_by_kind
        .get("function")
        .map(|v| v.iter().map(canonical_signature).collect())
        .unwrap_or_default()
}

/// Round-trip the parameters through a synthetic ABI param — kept so PoC
/// tests can assert the exported field shape holds.
pub fn build_param(name: &str, sol_type: &str, indexed: bool) -> SolAbiParam {
    SolAbiParam {
        name: name.to_string(),
        sol_type: sol_type.to_string(),
        indexed,
    }
}

/// Build a synthetic ABI item for testing purposes.
pub fn build_item(name: &str, sol_type: &str) -> SolAbiItem {
    SolAbiItem {
        kind: "function".to_string(),
        name: name.to_string(),
        inputs: vec![build_param("x", sol_type, false)],
        outputs: vec![],
        state_mutability: "nonpayable".to_string(),
    }
}
