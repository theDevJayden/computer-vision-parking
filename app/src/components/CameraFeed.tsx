import { useCallback, useEffect, useState, type RefObject } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface Props {
  cameraRef: RefObject<CameraView | null>;
  /** Reports whether the camera preview is mounted and ready to capture. */
  onReadyChange: (ready: boolean) => void;
}

export function CameraFeed({ cameraRef, onReadyChange }: Props) {
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [mountError, setMountError] = useState<string | null>(null);
  const [noCamera, setNoCamera] = useState(false);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0); // bumping remounts CameraView

  // Request on load (only when the OS/browser will still show a prompt).
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain && permission.status === 'undetermined') {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Detect "no camera at all" up front so we can show a clear message.
  useEffect(() => {
    let cancelled = false;
    CameraView.isAvailableAsync()
      .then((ok) => !cancelled && setNoCamera(!ok))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const granted = !!permission?.granted;
  const usable = granted && !mountError && !noCamera;

  useEffect(() => {
    onReadyChange(usable && ready);
  }, [usable, ready, onReadyChange]);

  const tryAgain = useCallback(async () => {
    setMountError(null);
    setReady(false);
    setAttempt((a) => a + 1);
    if (permission?.canAskAgain !== false) await requestPermission();
    else await getPermission();
  }, [permission, requestPermission, getPermission]);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
        <Text style={styles.body}>Checking camera access…</Text>
      </View>
    );
  }

  if (!granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera access is needed</Text>
        <Text style={styles.body}>
          {Platform.OS === 'web'
            ? 'Allow camera access using the camera icon in your browser address bar, then press Try Again. The page must be served over HTTPS or localhost.'
            : 'Enable camera access for this app in your device Settings, then press Try Again.'}
        </Text>
        <Pressable accessibilityRole="button" style={styles.button} onPress={tryAgain}>
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>
        {Platform.OS !== 'web' && (
          <Pressable accessibilityRole="button" style={styles.buttonSecondary} onPress={() => Linking.openSettings()}>
            <Text style={styles.buttonText}>Open Settings</Text>
          </Pressable>
        )}
      </View>
    );
  }

  if (noCamera || mountError) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>{noCamera ? 'No camera found' : 'Camera unavailable'}</Text>
        <Text style={styles.body}>
          {noCamera
            ? 'This device has no camera we can use. Connect a camera and press Try Again.'
            : `The camera could not start. It may be in use by another app. (${mountError})`}
        </Text>
        <Pressable accessibilityRole="button" style={styles.button} onPress={tryAgain}>
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <CameraView
      key={attempt}
      ref={cameraRef}
      style={StyleSheet.absoluteFill}
      facing="back"
      animateShutter={false}
      onCameraReady={() => setReady(true)}
      onMountError={(e) => {
        setReady(false);
        setMountError(e.message || 'Unknown error');
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  body: { color: '#cbd5e1', fontSize: 15, textAlign: 'center', maxWidth: 420 },
  button: { backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonSecondary: { backgroundColor: '#475569', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
