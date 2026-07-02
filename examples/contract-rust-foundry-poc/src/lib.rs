//! PoC — a small "smart-contract test workflow" wrapped around kiwa's Foundry
//! integration. Real projects would spawn anvil, deploy a contract, and use
//! `cast call` / `cast send` from the same driver. Here we exercise the shape
//! of the workflow so the test harness runs green on machines without Foundry.

use std::path::Path;

use kiwa::contract::foundry::{CastOutput, CoverageReport, ForgeTestOutput, FoundryEnv};

/// A minimal "smart-contract lifecycle" driver — the same shape a production
/// integration test would use.
pub struct ContractLifecycle {
    pub env: FoundryEnv,
}

impl ContractLifecycle {
    pub fn new() -> Self {
        Self { env: FoundryEnv::detect() }
    }

    /// Run the full test suite in the given project directory. When Foundry is
    /// not installed the call returns a skipped output so downstream assertions
    /// can degrade gracefully.
    pub fn run_forge_test(&self, project: &Path) -> std::io::Result<ForgeTestOutput> {
        self.env.forge_test(project)
    }

    /// Collect coverage on the given project directory.
    pub fn run_forge_coverage(&self, project: &Path) -> std::io::Result<CoverageReport> {
        self.env.forge_coverage(project)
    }

    /// Read a contract state variable via `cast call`.
    pub fn read_state(
        &self,
        rpc_url: &str,
        contract: &str,
        signature: &str,
    ) -> std::io::Result<CastOutput> {
        self.env.cast_call(rpc_url, contract, signature, &[])
    }
}

impl Default for ContractLifecycle {
    fn default() -> Self {
        Self::new()
    }
}
