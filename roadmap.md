# Phase 11
- [x] Audit and preserve the configured image provider and existing media architecture.
- [x] Add real prompt/styles/ratios, streaming previews and persisted generation jobs.
- [x] Save real images privately; connect history, downloads, deletion and project/timeline insertion.
- [x] Verify one real provider generation, private upload/download, Editor insertion and refresh before session reset; run 12 validation/media tests and mobile layouts.
- [ ] Verify updated server-save flow, second style, all four ratios, history/delete and injected storage/provider failure cases. Blocker: test session reset; multiple accounts exist and requesting user has no matching account. User must sign in through preview.
- [ ] Add ad-hoc spending/rate limits only with confirmed tradeoff. No standard backend rate-limit primitive is available; provider rate limits are surfaced, not retried automatically.

# Phase 10

- [x] Audit existing camera, imports, storage and project ownership.
- [x] Implement camera permissions, capture, controls, preview and recovery; verify browser test-device recording.
- [x] Connect device imports, playback and Recents to stored assets.
- [x] Implement selected-project restoration and atomic per-track clip appends with owned-reference policies.
- [x] Run nine media-rule tests, browser capture/playback/retake/countdown/discard checks and 360/390/430 layouts; report limitations honestly.
- [ ] Verify signed-in photo/video/audio uploads, retry, timeline insertion and refresh end-to-end. Blocker: signed-in test session unavailable; user must sign in through preview.
- [ ] Verify physical phone camera/microphone, front/rear switch, torch and zoom. Blocker: sandbox has no physical device; automated tests use browser test-device streams.