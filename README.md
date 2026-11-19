# Parking Spot Monitor

Single-screen Expo app (web, iOS, Android) that shows a live camera feed and how many parking spots are available. See [PRD.md](PRD.md) for the spec and [DECISIONS.md](DECISIONS.md) for choices made where the PRD was ambiguous.

## Prerequisites

Install these yourself; they are not part of the repo:

- **Node.js 20 or newer** (includes npm). Check with `node -v`.
- **A webcam** for the web version, or **a phone with the Expo Go app** (App Store / Google Play) for the mobile version.
- **A modern browser** (Chrome, Edge, Firefox, Safari) for web.
- Optional: Android Studio or Xcode, only if you want emulators or native builds. Not needed for Expo Go.

No global Expo CLI is needed; `npx expo` is used.

## Setup

```
cd app
npm install
```

`npm install` installs every library below from `app/package.json`; nothing else needs to be installed by hand, including the camera library.

| Library | Why |
|---|---|
| `expo` | Framework and dev server |
| `react`, `react-native` | UI |
| `react-dom`, `react-native-web`, `@expo/metro-runtime` | Run the same code in the browser |
| `expo-camera` | Camera preview, camera permission, and taking frames for detection |
| `expo-status-bar` | Status bar styling |
| `typescript`, `@types/react` (dev) | Type checking |

If you add a library later, use `npx expo install <package>` instead of `npm install <package>` so the version matches the Expo SDK.

## Run

```
npx expo start --web     # browser
npx expo start           # then scan the QR code with Expo Go on your phone
```

Phone notes:
- The phone and computer must be on the same Wi-Fi. If the QR code will not connect, use `npx expo start --tunnel` (Expo may ask to install `@expo/ngrok`; say yes).
- Allow camera access when Expo Go asks. The rear camera is used.

Web notes:
- The browser asks for camera access. Camera only works on `https://` or `http://localhost`, so use `localhost`, not your LAN IP.
- If you denied access, click the camera icon in the address bar, allow it, then press **Try Again** in the app.

## Configuration

The mock detection service is the default, so no server is needed. To change settings, copy `app/.env.example` to `app/.env` (it is git-ignored) and edit it, then restart `npx expo start`.

| Variable | Default | Meaning |
|---|---|---|
| `EXPO_PUBLIC_USE_MOCK` | `true` | `false` uses the real HTTP service |
| `EXPO_PUBLIC_API_BASE_URL` | empty | Model server base URL (`POST {url}/detect`) |
| `EXPO_PUBLIC_FRAME_INTERVAL_MS` | `1000` | Wait between detections |
| `EXPO_PUBLIC_STALE_TIMEOUT_MS` | `10000` | Show "Stale data" after this long without a result |

## Checks

```
cd app
npx tsc --noEmit      # type check
npx expo-doctor       # dependency check
```

## Layout

- `app/` Expo app
- `model-server/` Python model API (not built yet)
