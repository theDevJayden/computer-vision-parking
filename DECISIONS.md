# Decisions

Where the PRD was ambiguous, the simplest option was picked.

1. **No Expo Router.** The blank-TypeScript template ships an `AGENTS.md`/`CLAUDE.md` in `app/` telling agents to use Expo Router. The PRD says single `App.tsx`, no navigation, so that guidance was ignored.
2. **Repo rooted at the top level.** `create-expo-app` put `.git`, `.gitignore`, `AGENTS.md` and `CLAUDE.md` inside `app/`. The nested repo (template commit only) was removed and a fresh repo initialised at the root; `.gitignore` and `.claude/settings.json` moved to the root; the template agent docs were replaced by a root `CLAUDE.md` that follows the PRD.
3. **Connection status mapping.** Live = last request succeeded. Reconnecting = 1-2 consecutive failures, or waiting for the first result. Offline = 3+ consecutive failures (`offlineAfterFailures`), camera not ready, or app backgrounded (loop paused).
4. **Stale rule.** Stale = no successful result for `EXPO_PUBLIC_STALE_TIMEOUT_MS` (default 10 s). "Updated Ns ago" uses the local time the result arrived, not `result.timestamp`, to avoid clock skew between device and server.
5. **Status color.** Green: free >= 20% of total. Amber: free > 0 and < 20%. Red: 0 free. A text label (Plenty free / Almost full / Full) accompanies the color.
6. **Retry backoff.** 1 s, 2 s, 4 s ... capped at 15 s, applied after a failed capture or detect. Constants live in `config.ts`.
7. **Frame handling.** Frames are captured at `quality: 0.5` with `skipProcessing: true`; no downscaling with `expo-image-manipulator` (optional in the PRD). The file URI is turned into a Blob via `fetch(uri).blob()`, which works for web data URLs and native file URIs.
8. **Overlay boxes skipped.** Optional per the PRD; the mock returns counts only. `spots` stays in the type.
9. **Background pause** uses React Native `AppState` (react-native-web maps it to tab visibility). It was trivial, so it was done now, ahead of Milestone 6.
10. **`HttpDetectionService`** exists as a small client of the assumed `POST /detect` contract so the factory can compile, but it is untested (Milestone 5). The mock is the default; `EXPO_PUBLIC_USE_MOCK=false` switches it.
11. **Layout.** Wide (>= 768 px): row, feed `flex: 3`, panel `flex: 1`. Narrow: column, feed fills the remaining height (min 200 px), panel has a min height of 280 px.
12. **Camera errors.** "No camera" uses `CameraView.isAvailableAsync()`; "camera busy / failed" uses `onMountError`. Try Again remounts `CameraView` and re-requests permission (or re-reads it if the OS will not prompt again).
13. **Dev launch config** at `.claude/launch.json` (repo root) is only for the Claude Code preview pane.
