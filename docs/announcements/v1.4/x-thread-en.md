# x.com draft — English thread (v1.4 polyglot completion voice)

> Posting from ... [@cardene777](https://x.com/cardene777)
> Voice ... first-person / solo dev / "v0.5 promise delivered" maker tone
> Video ... `assets/kiwa-promo-en.mp4` (reused) attached to tweet 1
> Limit ... 280 chars per tweet
> Thread of 8 tweets, numbered [1/8]

---

## [1/8] (video attached)

kiwa v1.4 just landed (6/6 Issue resolved) — Rust + Go adapters complete the **5-language polyglot** lineup (TS / Python / Solidity + Rust + Go).

This finally delivers on the "Rust / Go coming" promise from the v0.5 announcement.

https://github.com/cardene777/kiwa

#OSS #testing

---

## [2/8]

What grew in v1.4:

- Languages: 3 → 5 (+ Rust + Go)
- Skills: 25 → 27 (+ kiwa-rust + kiwa-go)
- Layer 1 spec layers: 9 → 13 (+ 4 polyglot layers)
- Cross-language packages: 1 PyPI → 3 (PyPI + crates.io + pkg.go.dev)

---

## [3/8]

Rust (kiwa-test-rs v0.1):

- `cargo test` adapter (unit, `setup_env` + `assert_kiwa_eq!` / `assert_kiwa_close!`)
- `hyper` mock_server (integration, `RecordedRequest` capture)
- `integration` feature default ON, opt-out for unit-only users

---

## [4/8]

Go (kiwa-test-go v0.1):

- `testing.T` adapter (`SetupUnitEnv` + `t.Cleanup` auto-stop)
- `httptest.Server` wrap (integration, stdlib zero-dep)
- `testing.TB` accept — `T` / `B` / `F` all supported, race-detector clean

---

## [5/8]

`/kiwa-design` adds 4 layers (`rust-unit` / `rust-integration` / `go-unit` / `go-integration`).

One feature → 5-language spec → parallel `/kiwa-rust` + `/kiwa-go` test generation.

---

## [6/8]

The "scattered test stack" problem isn't just runners — it's **languages too**.

In a typical dApp: Solidity / TS / Python / Rust crypto lib / Go gateway all coexist. Driving them from one spec is the polyglot point.

---

## [7/8]

Stats:

| Axis | v1.3 | v1.4 |
|---|---|---|
| Languages | 3 | **5** |
| Skills | 25 | 27 |
| Layer 1 spec layers | 9 | 13 |

5-language polyglot reached. dApps + web + libs + services all driven from one spec.

---

## [8/8]

v1.5 candidates: Rust / Go web framework adapters (axum / actix / Gin / Echo) + new layers (auth / job queue / cache).

Drop requests on GitHub Discussions:

https://github.com/cardene777/kiwa/discussions

#testing #rustlang #golang
