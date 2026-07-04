// RP `/api/logout` endpoint — drops the `rp_userinfo` session cookie so the
// index page flips back to signed-out. Sub-Issue v1.22-3 (GH #889) adds this
// route to complete the full RP journey (login → OP → callback → userinfo
// → logout).
//
// The endpoint does not talk to the OP — a full RP-initiated logout
// (OpenID Connect RP-Initiated Logout 1.0) that walks the end_session_endpoint
// is deferred to a v1.22-N follow-up. The local cookie drop is enough for the
// v1.22-3 a11y gate + full-journey coverage because the RP session state is
// authoritative for the UI.

export default defineEventHandler((event) => {
  deleteCookie(event, 'rp_userinfo');
  // Best-effort cleanup for any stale /authorize cookies that never got
  // consumed by a callback (e.g. the user aborted the OP flow).
  deleteCookie(event, 'rp_state');
  deleteCookie(event, 'rp_nonce');
  deleteCookie(event, 'rp_code_verifier');
  return { ok: true };
});
