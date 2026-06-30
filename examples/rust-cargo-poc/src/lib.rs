//! Toy domain code used by the kiwa-test-rs PoC tests.
//!
//! Kept intentionally minimal — the value is in the tests under
//! `tests/poc.rs` (unit) and `tests/poc_integration.rs` (integration) that
//! show how `kiwa::unit::setup_env`, the assertion macros, and
//! `kiwa::integration::mock_server` are wired into a real cargo crate.

/// Add two integers. (placeholder domain logic)
pub fn add(a: i64, b: i64) -> i64 {
    a + b
}

/// Mean of a slice of `f64`. Returns `0.0` for an empty slice so callers do
/// not need to guard. (placeholder domain logic — the focus is on showing
/// `assert_kiwa_close!` against this output.)
pub fn mean(values: &[f64]) -> f64 {
    if values.is_empty() {
        return 0.0;
    }
    let sum: f64 = values.iter().sum();
    sum / values.len() as f64
}

/// A user record returned by the upstream "users" API the PoC integrates
/// with. Public so the integration test can decode JSON into this struct.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct User {
    /// User id.
    pub id: u64,
    /// User display name.
    pub name: String,
}

/// Thin client over an HTTP "users" API. Used by the integration PoC to show
/// how `kiwa::integration::mock_server` wraps an external API behind a
/// deterministic endpoint.
///
/// Construction takes a base URL so the integration test can point it at the
/// kiwa mock server's `base_url()`.
pub struct UsersClient {
    base_url: String,
    http: reqwest::blocking::Client,
}

impl UsersClient {
    /// Build a client targeting `base_url` (e.g. `http://127.0.0.1:54812`).
    pub fn new(base_url: impl Into<String>) -> Self {
        UsersClient {
            base_url: base_url.into(),
            http: reqwest::blocking::Client::new(),
        }
    }

    /// `GET {base_url}/users` — decode response as `Vec<User>`.
    pub fn list_users(&self) -> Result<Vec<User>, String> {
        let url = format!("{}/users", self.base_url);
        let resp = self
            .http
            .get(&url)
            .send()
            .map_err(|e| format!("kiwa-poc list_users send failed: {e}"))?;
        let status = resp.status();
        if !status.is_success() {
            return Err(format!("kiwa-poc list_users non-2xx: {status}"));
        }
        let body: serde_json::Value = resp
            .json()
            .map_err(|e| format!("kiwa-poc list_users decode failed: {e}"))?;
        let arr = body
            .as_array()
            .ok_or_else(|| "kiwa-poc list_users response was not a JSON array".to_string())?;
        let mut users = Vec::with_capacity(arr.len());
        for entry in arr {
            let id = entry
                .get("id")
                .and_then(|v| v.as_u64())
                .ok_or_else(|| "kiwa-poc list_users entry missing id".to_string())?;
            let name = entry
                .get("name")
                .and_then(|v| v.as_str())
                .ok_or_else(|| "kiwa-poc list_users entry missing name".to_string())?
                .to_string();
            users.push(User { id, name });
        }
        Ok(users)
    }

    /// `POST {base_url}/users` with a JSON body — returns the server-assigned id.
    pub fn create_user(&self, name: &str) -> Result<u64, String> {
        let url = format!("{}/users", self.base_url);
        let resp = self
            .http
            .post(&url)
            .json(&serde_json::json!({ "name": name }))
            .send()
            .map_err(|e| format!("kiwa-poc create_user send failed: {e}"))?;
        let status = resp.status();
        if status.as_u16() != 201 {
            return Err(format!("kiwa-poc create_user non-201: {status}"));
        }
        let body: serde_json::Value = resp
            .json()
            .map_err(|e| format!("kiwa-poc create_user decode failed: {e}"))?;
        body.get("id")
            .and_then(|v| v.as_u64())
            .ok_or_else(|| "kiwa-poc create_user response missing id".to_string())
    }
}
