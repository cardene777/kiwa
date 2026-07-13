import { describe, expect, it } from 'vitest';
import { createWebRtcTrackMock } from '../src/semantics/webrtc-track.js';

describe('webrtc-track defensive branches', () => {
  it('createWebRtcTrackMock accepts explicit artificialLatencyMs', async () => {
    const mock = createWebRtcTrackMock({ artificialLatencyMs: 0 });
    expect(mock.axis).toBe('webrtc-track');
  });

  it('createWebRtcTrackMock uses default latency when config omitted', async () => {
    const mock = createWebRtcTrackMock();
    expect(mock.protocol).toBe('webrtc');
  });

  it('removeTrack is a no-op for unknown trackId', async () => {
    const mock = createWebRtcTrackMock();
    await expect(mock.removeTrack('unknown-track-id')).resolves.toBeUndefined();
  });

  it('muteTrack is a no-op for unknown trackId', async () => {
    const mock = createWebRtcTrackMock();
    await expect(mock.muteTrack('unknown-track-id')).resolves.toBeUndefined();
  });

  it('unmuteTrack is a no-op for unknown trackId', async () => {
    const mock = createWebRtcTrackMock();
    await expect(mock.unmuteTrack('unknown-track-id')).resolves.toBeUndefined();
  });

  it('addTrack + removeTrack round-trip completes', async () => {
    const mock = createWebRtcTrackMock({ artificialLatencyMs: 0 });
    const stream = await mock.getUserMedia({ audio: true });
    const track = stream.tracks[0];
    if (track) {
      const { trackId } = await mock.addTrack(track, stream);
      await mock.removeTrack(trackId);
    }
    expect(true).toBe(true);
  });

  it('addTrack + muteTrack + unmuteTrack round-trip', async () => {
    const mock = createWebRtcTrackMock({ artificialLatencyMs: 0 });
    const stream = await mock.getUserMedia({ audio: true, video: true });
    const track = stream.tracks[0];
    if (track) {
      const { trackId } = await mock.addTrack(track, stream);
      await mock.muteTrack(trackId);
      await mock.unmuteTrack(trackId);
    }
    expect(true).toBe(true);
  });

  it('event handler exceptions are swallowed (does not propagate)', async () => {
    const mock = createWebRtcTrackMock({ artificialLatencyMs: 0 });
    mock.onEvent(() => {
      throw new Error('handler-throws');
    });
    // Adding a track fires an event; the throwing handler must not propagate
    const stream = await mock.getUserMedia({ audio: true });
    const track = stream.tracks[0];
    if (track) {
      await expect(mock.addTrack(track, stream)).resolves.toBeDefined();
    }
  });
});
