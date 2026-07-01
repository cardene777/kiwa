# x.com draft — English thread (v1.6 quality-first voice)

> Posting from ... [@cardene777](https://x.com/cardene777)
> Voice ... first-person / solo dev / "quality-first milestone" maker tone
> Limit ... 280 chars / tweet, thread of 8

---

## [1/8]

kiwa v1.6 just landed (6/6 Issue resolved). The **~65 Codex findings** from v1.5 got consumed into **6 topics**, bringing every adapter (v1.4 mock_server + Rust axum/actix + Go gin/echo) to **v1.4 mock_server parity**.

https://github.com/cardene777/kiwa

#OSS #testing

---

## [2/8]

v1.6 is a **quality-first milestone**.

v1.1-v1.5 shipped features (frameworks / ORM / polyglot / web frameworks). v1.5 accumulated ~65 semantics drifts in adapter contracts, so v1.6 stops and locks them down.

---

## [3/8]

What v1.6 fixed:

1. Multi-value response header retention (Set-Cookie)
2. Body defensive copy everywhere
3. Stop() lifecycle activation (post-Stop explicit error)
4. Go Send() panic → t.Fatalf migration
5. recordRequest dedup (Go internal/recorder + Rust src/recorder.rs)
6. Docs consistency

---

## [4/8]

Example: Set-Cookie multi-value retention

```go
// Before v1.6
resp.Headers()["set-cookie"]  // "session=xyz" only — auth cookie lost

// After v1.6
resp.HeadersAll("Set-Cookie")  // ["auth=abc", "session=xyz"]
resp.Cookies()                 // convenience alias
```

Auth cookie loss fixed across all adapters.

---

## [5/8]

Example: Stop lifecycle activation

Before: `srv.Stop()` was a no-op flag, post-Stop Send silently succeeded.

After: `stopped` gate in Send, post-Stop Send is an explicit error (Rust panic / Go t.Fatalf). Lifecycle now matches v1.4 mock_server.

---

## [6/8]

Recorder factor:

- Go — `kiwa-go/internal/recorder/` extracted, shared by gin/echo/mockserver
- Rust — `kiwa-rs/src/recorder.rs` `fold_headers` unifies 3 backends' header conversion loops

recordRequest semantic parity now machine-guaranteed.

---

## [7/8]

Breaking changes:

- **Go** v0.3: `Send()` panic → `t.Fatalf`, tests using `recover()` need updating
- **Rust** v0.3: source-compatible (recorder factor is internal-only)

---

## [8/8]

v1.7 candidates: polyglot deepening (tower-http / Fiber) / new layers (auth + job + cache) / Rust contract layer (waiting for alloy.rs) / Storybook.

Drop requests on Discussions:

https://github.com/cardene777/kiwa/discussions

#testing #rustlang #golang
