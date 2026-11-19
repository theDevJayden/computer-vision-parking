import { StyleSheet, Text, View } from 'react-native';
import type { ConnectionStatus } from '../hooks/useDetectionLoop';
import type { DetectionResult } from '../services/DetectionService';

interface Props {
  result: DetectionResult | null;
  connection: ConnectionStatus;
  lastUpdated: number | null;
  now: number;
  isStale: boolean;
}

type Level = 'plenty' | 'low' | 'full';

const LEVEL_COLOR: Record<Level, string> = { plenty: '#16a34a', low: '#f59e0b', full: '#dc2626' };
const LEVEL_TEXT: Record<Level, string> = { plenty: 'Plenty free', low: 'Almost full', full: 'Full' };
const CONNECTION_COLOR: Record<ConnectionStatus, string> = {
  live: '#16a34a',
  reconnecting: '#f59e0b',
  offline: '#dc2626',
};
const CONNECTION_TEXT: Record<ConnectionStatus, string> = {
  live: 'Live',
  reconnecting: 'Reconnecting',
  offline: 'Offline',
};

function levelOf(r: DetectionResult): Level {
  if (r.available <= 0) return 'full';
  if (r.total > 0 && r.available / r.total < 0.2) return 'low';
  return 'plenty';
}

function ago(now: number, then: number): string {
  const s = Math.max(0, Math.round((now - then) / 1000));
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

export function DataPanel({ result, connection, lastUpdated, now, isStale }: Props) {
  const level = result ? levelOf(result) : null;
  const color = level ? LEVEL_COLOR[level] : '#94a3b8';

  return (
    <View style={styles.panel}>
      <View style={styles.connectionRow} accessibilityLabel={`Connection: ${CONNECTION_TEXT[connection]}`}>
        <View style={[styles.dot, { backgroundColor: CONNECTION_COLOR[connection] }]} />
        <Text style={styles.connectionText}>{CONNECTION_TEXT[connection]}</Text>
      </View>

      <Text style={styles.label}>Available spots</Text>
      <Text
        style={[styles.available, { color }, isStale && styles.dim]}
        accessibilityLiveRegion="polite"
        accessibilityLabel={result ? `${result.available} parking spots available` : 'Waiting for data'}
      >
        {result ? result.available : '--'}
      </Text>

      <View style={[styles.statusPill, { backgroundColor: color }, isStale && styles.dim]}>
        <Text style={styles.statusText}>{level ? LEVEL_TEXT[level] : 'Waiting for data'}</Text>
      </View>

      <View style={[styles.stats, isStale && styles.dim]}>
        <Text style={styles.stat}>of {result ? result.total : '--'} total</Text>
        <Text style={styles.stat}>{result ? result.occupied : '--'} occupied</Text>
      </View>

      <Text style={[styles.updated, isStale && styles.staleText]}>
        {isStale ? 'Stale data' : ''}
        {isStale && lastUpdated ? ' · ' : ''}
        {lastUpdated ? `updated ${ago(now, lastUpdated)}` : 'no data yet'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { flex: 1, backgroundColor: '#0f172a', padding: 20, alignItems: 'center', justifyContent: 'center', gap: 10 },
  connectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, position: 'absolute', top: 16, left: 20 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  connectionText: { color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
  label: { color: '#94a3b8', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1, marginTop: 24 },
  available: { fontSize: 96, fontWeight: '800', lineHeight: 104 },
  statusPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  statusText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  stats: { alignItems: 'center', gap: 2 },
  stat: { color: '#e2e8f0', fontSize: 18 },
  updated: { color: '#94a3b8', fontSize: 14, marginTop: 8, textAlign: 'center' },
  staleText: { color: '#fbbf24', fontWeight: '700' },
  dim: { opacity: 0.4 },
});
