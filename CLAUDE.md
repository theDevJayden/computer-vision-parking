# Parking Spot Monitor

Read [PRD.md](PRD.md) before changing anything; log ambiguous choices in [DECISIONS.md](DECISIONS.md).

## Layout
- `app/` Expo (React Native + TypeScript) app, web + iOS + Android. Run commands from `app/`.
- `model-server/` Python API (not built yet).

## Rules
- Single screen in `app/App.tsx`. No router, login or extra screens (this overrides generic Expo Router advice).
- UI depends only on the `DetectionService` interface (`app/src/services/`). Mock is the default (`EXPO_PUBLIC_USE_MOCK=true`).
- Config only via `EXPO_PUBLIC_*` env vars (`app/src/config.ts`); no hardcoded URLs or keys.

## Expo notes
- Expo SDK changes often. Check https://docs.expo.dev/versions/v58.0.0/ (match the `expo` version in `app/package.json`) before using Expo APIs.
- Install packages with `npx expo install <pkg>`, not `npm install <pkg>`.
- Before finishing: `npx tsc --noEmit` and `npx expo-doctor` in `app/`.
- Do not hand-edit `ios/` or `android/` (generated); configure via `app.json` and config plugins.
