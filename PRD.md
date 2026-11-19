# PRD: Parking Spot Monitor (Single-Page App)

**Audience:** Developers and AI coding agents implementing the app
**Scope:** Client app only (web + mobile), built with Expo. The computer vision (CV) model is built separately and consumed through a simple interface.

---

## 1. Overview

A single-page monitoring app. It opens the device camera, shows a live video feed, and displays how many parking spots are available in real time.

- **No login, no accounts, no extra screens.** One screen only.
- Runs on **web, iOS and Android** from one Expo codebase.
- On phones, uses the **rear camera**.

### Non-Goals
Login, user accounts, multiple screens or navigation, reservations, video recording, multi-lot dashboards, building the CV model.

---

## 2. Tech Stack

| Concern | Choice |
|---|---|
| Framework | Expo (React Native) + TypeScript, with web enabled via `react-native-web` |
| Camera | `expo-camera` (`CameraView`, `useCameraPermissions`) |
| Layout | `StyleSheet` + `useWindowDimensions()` (no router, single `App.tsx`) |
| Overlay boxes (optional) | Absolutely positioned `View`s |
| Frame resize (optional) | `expo-image-manipulator` |
| Testing on phone | Expo Go (scan QR code) |

**Setup:** `npx create-expo-app` inside `app/`. Enable web with `npx expo install react-dom react-native-web @expo/metro-runtime`.

---

## 3. Project Structure

```
parking-monitor/            <- repo root
├── PRD.md
├── app/                    <- Expo app (this PRD)
│   ├── App.tsx             # the single screen (feed + data panel)
│   ├── app.json            # camera permission config
│   └── src/
│       ├── components/
│       │   ├── CameraFeed.tsx    # CameraView + overlay + error states
│       │   └── DataPanel.tsx     # available / total / occupied / status / updated
│       ├── hooks/
│       │   └── useDetectionLoop.ts   # frame capture, backpressure, retries, stale detection
│       ├── services/
│       │   ├── DetectionService.ts       # interface + types
│       │   ├── HttpDetectionService.ts
│       │   └── MockDetectionService.ts
│       └── config.ts       # env: API URL, mock flag, frame interval, stale timeout
└── model-server/           <- Python API that loads the .keras model (built later)
    ├── model/              <- .keras file goes here
    └── main.py
```

Claude Code should build only `app/` for now and use the mock service. `model-server/` is added later.

---

## 4. The Screen

One screen with two areas: the **camera feed** and the **data panel**.

### 4.1 Desktop / wide layout (width 768px and above)

Side by side, filling the full viewport height:

```
+-------------------------------------+-------------+
|                                     |             |
|                                     |    DATA     |
|        LIVE CAMERA FEED             |    PANEL    |
|            (75%)                    |    (25%)    |
|                                     |             |
+-------------------------------------+-------------+
```

- Camera feed: **left, 75% width**.
- Data panel: **right, 25% width**.

### 4.2 Mobile / narrow layout (width below 768px)

Stacked vertically, camera feed on top and data panel below:

```
+---------------------+
|   LIVE CAMERA FEED  |
+---------------------+
|     DATA PANEL      |
+---------------------+
```

Implement with `useWindowDimensions()`: `flexDirection: "row"` (feed `flex: 3`, panel `flex: 1`) at 768px and wider, otherwise `flexDirection: "column"`.

### 4.3 Data panel contents

| Item | Description |
|---|---|
| **Available spots** | Large number, the main focus. Example: **12** |
| Total spots | "of 40 total" |
| Occupied spots | Example: 28 |
| Status color | Green = plenty free, Amber = under 20% free, Red = full (0 free) |
| Connection status | Live / Reconnecting / Offline |
| Last updated | Example: "updated 2s ago" |

If no new data arrives within the stale timeout (default 10 seconds), dim the numbers and show "Stale data" instead of presenting old values as live.

### 4.4 Camera feed

- Use `CameraView` with `facing="back"` so phones use the rear camera. On desktop web it uses the default webcam.
- Optional: draw green/red boxes over free/occupied spots if the model returns them (see Section 6). Box coordinates are normalized (0-1), so scale them to the displayed feed size.

---

## 5. Camera and Permissions

| Requirement | Detail |
|---|---|
| Permission prompt | Use `useCameraPermissions()`. Request on load. Web shows the browser prompt, native shows the system prompt. |
| Rear camera | `facing="back"` |
| Denied permission | Show a message in the feed area explaining how to enable the camera, plus a **Try Again** button (and "Open Settings" on native via `Linking.openSettings()`). |
| No camera / camera busy | Show a clear error message in the feed area. |
| App in background / tab hidden | Pause the detection loop. Resume when the user returns. |
| Web secure context | Must run on HTTPS (or localhost) for camera access. |

**`app.json` config**
```json
{
  "expo": {
    "plugins": [
      ["expo-camera", {
        "cameraPermission": "This app uses the camera to detect available parking spots."
      }]
    ]
  }
}
```

---

## 6. CV Model Integration

The app talks to the model only through this interface, so the backend can change without touching the UI.

```ts
export interface Spot {
  id: string;
  bbox: [number, number, number, number]; // normalized 0-1: x, y, width, height
  status: "free" | "occupied";
}

export interface DetectionResult {
  timestamp: number;   // epoch ms
  total: number;
  available: number;
  occupied: number;
  spots?: Spot[];      // optional, used for overlay boxes
}

export interface DetectionService {
  detect(frame: Blob, signal?: AbortSignal): Promise<DetectionResult>;
}
```

**Assumed API (confirm with the CV team):**
`POST {API_BASE_URL}/detect` with the JPEG as `multipart/form-data` (field `image`), returning the `DetectionResult` JSON above.

**Frame loop (`useDetectionLoop`)**
1. Capture a frame with `cameraRef.current.takePictureAsync({ quality: 0.5, skipProcessing: true })`.
2. Optionally downscale to max 640px wide with `expo-image-manipulator`.
3. Convert the file URI to a `Blob` and call `DetectionService.detect()`.
4. Wait for the response, then wait the configured interval (default **1000 ms**, configurable, can be raised to 2-5 s for a static lot), then repeat.
5. Only one request in flight at a time (no queueing).
6. On errors, retry with exponential backoff and show "Reconnecting".

**Two implementations required**
1. `HttpDetectionService`: the real API client.
2. `MockDetectionService`: fake, slowly changing numbers so the UI can be built and demoed without the model. Enabled with `EXPO_PUBLIC_USE_MOCK=true` (default until the real endpoint is confirmed).

---

## 7. Non-Functional Requirements

- **Responsive:** works from small phones to large desktop screens, portrait and landscape.
- **Performance:** counter updates shortly after each result arrives. A slow capture interval is acceptable since parked cars rarely change.
- **Privacy:** frames go only to the configured endpoint; nothing is stored or logged.
- **Accessibility:** the available count has an accessibility label/live region for screen readers; status is shown with text as well as color.
- **Config:** no hardcoded URLs or keys; use `EXPO_PUBLIC_*` environment variables.

---

## 8. Acceptance Criteria

- [ ] The app is one screen with no login or navigation.
- [ ] On desktop web, the feed takes the left 75% and the data panel the right 25%.
- [ ] On mobile (and narrow browser windows), the feed is on top and the data panel is below it.
- [ ] Desktop browser prompts for camera access and shows the live feed once allowed.
- [ ] On phones (Expo Go / installed app), the rear camera is used by default.
- [ ] Denying permission shows a helpful message, and Try Again recovers without reloading.
- [ ] The available count updates live from the Mock service and from the real API.
- [ ] Offline or stale data is clearly indicated.
- [ ] Backgrounding the app pauses the detection loop.
- [ ] Runs on web, iOS and Android from one codebase.

---

## 9. Milestones

1. **Setup:** create Expo app in `app/` with TypeScript, enable web.
2. **Layout:** single screen with the 75/25 wide layout and stacked narrow layout (static placeholder data).
3. **Camera:** `CameraView`, permissions, rear camera, error states.
4. **Detection:** Mock service, frame loop, wire data into the panel.
5. **Real model:** `HttpDetectionService`, retries, stale/offline states.
6. **Polish and builds:** background handling, accessibility, EAS build for iOS/Android (optional).

---

## 10. Open Questions for the CV Team

1. Is inference server-side (HTTP/WebSocket), and what are the exact endpoint and response format?
2. Does the model return per-spot boxes, or only counts?
3. What input resolution does it handle best?
4. Is the camera fixed or handheld?

---

## 11. Instructions for the Implementing Agent

- Work inside `app/` and build in milestone order. Keep it to a single screen.
- Use the Mock service by default until the real endpoint is confirmed.
- Keep the UI dependent only on the `DetectionService` interface.
- Do not build `model-server/` yet.
- When a requirement is ambiguous, choose the simplest option and note it in `DECISIONS.md`.
