//! Internal recorder helpers shared across the integration / axum /
//! actix test adapters.
//!
//! v1.6-5 (Issue #611) factors the previously-inline header case-folding
//! plus multi-value view construction from
//! [`crate::integration::handle_request`], [`crate::axum::RequestBuilder::send`],
//! and [`crate::actix::RequestBuilder::send`] into one SSOT so all three
//! adapters share the following:
//!
//! - the same last-write-wins semantics on the single-value view
//!   ([`fold_headers`]),
//! - the same wire-order preservation on the multi-value view, and
//! - the same allocation shape (`HashMap::with_capacity(hint)`).
//!
//! The helpers are `pub(crate)` — the recorder is an implementation detail
//! of each adapter and the exported surface remains
//! [`crate::integration::RecordedRequest`] plus the adapter-owned
//! `TestResponse`.
//!
//! ## Why a generic helper (not a shared struct)
//!
//! The three adapters iterate different header types
//! (`http::HeaderMap`, `actix_web::http::header::HeaderMap`, and the
//! hyper server's own map), and each carries a `to_str()`-adjacent
//! decoding step that the caller controls. The cleanest bridge is a
//! generic function that accepts pre-decoded `(name, value)` pairs and
//! returns the two-view pair.

use std::collections::HashMap;

/// Fold pre-decoded `(name, value)` header pairs into the
/// `(single-value, multi-value)` view pair shared by every adapter's
/// recorder path.
///
/// - Keys are lowercased in-place (case-insensitive matching contract).
/// - The single-value map is last-write-wins on duplicate keys — matches
///   the kiwa-go recorder so polyglot specs compare equal across
///   languages.
/// - The multi-value map preserves every value in wire order so
///   `Set-Cookie`, `WWW-Authenticate`, `Vary`, `Link`, … survive the
///   recording round trip.
///
/// `size_hint` is used to pre-allocate the returned maps at their
/// upper bound (`HeaderMap::len()` in the axum/actix paths, request
/// header count in the hyper server path).
pub(crate) fn fold_headers<'a, I>(
    pairs: I,
    size_hint: usize,
) -> (HashMap<String, String>, HashMap<String, Vec<String>>)
where
    I: IntoIterator<Item = (&'a str, &'a str)>,
{
    let mut single: HashMap<String, String> = HashMap::with_capacity(size_hint);
    let mut multi: HashMap<String, Vec<String>> = HashMap::with_capacity(size_hint);
    for (name, value) in pairs {
        let key = name.to_lowercase();
        // Last-write-wins on duplicate keys — same semantics as the
        // kiwa-go recorder so polyglot specs compare equal.
        single.insert(key.clone(), value.to_string());
        multi.entry(key).or_default().push(value.to_string());
    }
    (single, multi)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn last_write_wins_on_duplicates() {
        let pairs = vec![
            ("X-Trace", "first"),
            ("X-Trace", "second"),
            ("X-Trace", "third"),
        ];
        let (single, _) = fold_headers(pairs, 1);
        assert_eq!(single.get("x-trace").map(String::as_str), Some("third"));
    }

    #[test]
    fn multi_value_preserves_wire_order() {
        let pairs = vec![("Set-Cookie", "session=abc"), ("Set-Cookie", "csrf=xyz")];
        let (_, multi) = fold_headers(pairs, 1);
        let cookies = multi.get("set-cookie").expect("set-cookie recorded");
        assert_eq!(
            cookies,
            &vec!["session=abc".to_string(), "csrf=xyz".to_string()]
        );
    }

    #[test]
    fn lowercases_keys() {
        let pairs = vec![("Content-Type", "text/plain")];
        let (single, multi) = fold_headers(pairs, 1);
        assert!(single.contains_key("content-type"));
        assert!(multi.contains_key("content-type"));
    }
}
