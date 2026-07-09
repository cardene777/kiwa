# dogfood-nextjs-webrtc-video-app (v1.28-2)

A Next.js 15 + mediasoup SFU + coturn TURN + WebRTC video/audio call room that exercises signaling / ice / track / simulcast / reconnect across a provider-neutral `VideoCallAdapter`. Both mock (`@kiwa-lab/realtime` v0.2) and real (mediasoup + coturn testcontainers, opt-in) implementations satisfy the same 8-op contract so the fidelity harness can diff them side by side.

## Run

```bash
pnpm --filter dogfood-nextjs-webrtc-video-app test
pnpm --filter dogfood-nextjs-webrtc-video-app test:e2e
```

The vitest suite drives the mock adapter through the same signaling + room handlers the Next.js runtime mounts in production. The Playwright suite additionally spawns two `BrowserContext` tabs against a minimal HTTP server so multi-tab regression is captured.

## Real mode (opt-in)

```bash
export KIWA_MODE=real
export WEBRTC_MEDIASOUP_READY=1
pnpm --filter dogfood-nextjs-webrtc-video-app test
```

The real adapter defers the mediasoup worker + coturn testcontainers wiring to a follow-up milestone. Until `WEBRTC_MEDIASOUP_READY=1` is set (which every non-integration environment leaves unset), every real op refuses with `KIWA_WEBRTC_ENV_MISSING`. The fidelity harness records those refusals as behavioral divergences — this is expected in the real-mode-skipped baseline.

## Adapter contract

`VideoCallAdapter` covers 8 ops.

- `joinRoom` — establish a peer connection through signaling (SDP offer / answer + ICE candidate exchange)
- `leaveRoom` — close the peer connection and release resources
- `publishTrack` — push an audio / video track onto the connection (video defaults to 3-layer simulcast)
- `unpublishTrack` — remove a previously published track
- `muteTrack` / `unmuteTrack` — toggle a track's enabled state
- `selectLayer` — pick a simulcast layer preference (viewer bandwidth adaptation)
- `iceRestart` — force a fresh ICE gathering + connectivity check to recover from network changes without renegotiating tracks

## Fidelity report

The vitest suite writes `quality-report/fidelity-latest.md` + `quality-report/fidelity-latest.json` that `@kiwa-lab/quality-metrics` picks up for the 12-axis release gate. The doc counterpart lives at `docs/quality-reports/realtime/nextjs-webrtc-video-app.md`.
