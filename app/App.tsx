import { useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { CameraView } from 'expo-camera';
import { CameraFeed } from './src/components/CameraFeed';
import { DataPanel } from './src/components/DataPanel';
import { useDetectionLoop } from './src/hooks/useDetectionLoop';
import { createDetectionService } from './src/services';

const WIDE_BREAKPOINT = 768;
const service = createDetectionService();

export default function App() {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;

  const cameraRef = useRef<CameraView | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const { result, lastUpdated, connection, isStale, now } = useDetectionLoop({
    service,
    cameraRef,
    enabled: cameraReady,
  });

  return (
    <View style={[styles.root, { flexDirection: isWide ? 'row' : 'column' }]}>
      <StatusBar style="light" />
      <View style={isWide ? styles.feedWide : styles.feedNarrow}>
        <CameraFeed cameraRef={cameraRef} onReadyChange={setCameraReady} />
      </View>
      <View style={isWide ? styles.panelWide : styles.panelNarrow}>
        <DataPanel
          result={result}
          connection={connection}
          lastUpdated={lastUpdated}
          now={now}
          isStale={isStale}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  feedWide: { flex: 3, backgroundColor: '#000' },
  panelWide: { flex: 1 },
  feedNarrow: { flex: 1, minHeight: 200, backgroundColor: '#000' },
  panelNarrow: { minHeight: 280 },
});
