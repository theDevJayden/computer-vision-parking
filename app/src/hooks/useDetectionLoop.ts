import { useEffect, useState, type RefObject } from 'react';
import { AppState } from 'react-native';
import type { CameraView } from 'expo-camera';
import { config } from '../config';
import type { DetectionResult, DetectionService } from '../services/DetectionService';

export type ConnectionStatus = 'live' | 'reconnecting' | 'offline';

interface Options {
  service: DetectionService;
  cameraRef: RefObject<CameraView | null>;
  /** True when the camera is mounted and ready to capture. */
  enabled: boolean;
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(t);
        resolve();
      },
      { once: true },
    );
  });
}

/**
 * Capture frame -> detect -> wait interval -> repeat.
 * Strictly sequential (one request in flight, no queue). Pauses while the app is
 * backgrounded (on web, react-native-web maps AppState to tab visibility).
 */
export function useDetectionLoop({ service, cameraRef, enabled }: Options) {
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [connection, setConnection] = useState<ConnectionStatus>('offline');
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setAppActive(s === 'active'));
    return () => sub.remove();
  }, []);

  // 1s ticker for "updated Ns ago" and stale detection.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!enabled || !appActive) {
      // No camera, or app backgrounded: loop is paused, so we are not live.
      setConnection('offline');
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    let failures = 0;
    setConnection((c) => (c === 'live' ? c : 'reconnecting'));

    (async () => {
      while (!cancelled) {
        let wait = config.frameIntervalMs;
        try {
          const camera = cameraRef.current;
          if (!camera) throw new Error('Camera not ready');
          const picture = await camera.takePictureAsync({
            quality: 0.5,
            skipProcessing: true,
            shutterSound: false,
          });
          if (cancelled) break;
          const blob = await (await fetch(picture.uri)).blob();
          const next = await service.detect(blob, controller.signal);
          if (cancelled) break;
          failures = 0;
          setResult(next);
          setLastUpdated(Date.now());
          setNow(Date.now());
          setConnection('live');
        } catch {
          if (cancelled) break;
          failures += 1;
          setConnection(failures >= config.offlineAfterFailures ? 'offline' : 'reconnecting');
          wait = Math.min(config.backoffMaxMs, config.backoffBaseMs * 2 ** (failures - 1));
        }
        await sleep(wait, controller.signal);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [enabled, appActive, service, cameraRef]);

  const isStale = lastUpdated !== null && now - lastUpdated > config.staleTimeoutMs;

  return { result, lastUpdated, connection, isStale, now };
}
