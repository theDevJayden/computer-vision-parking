export interface Spot {
  id: string;
  bbox: [number, number, number, number]; // normalized 0-1: x, y, width, height
  status: 'free' | 'occupied';
}

export interface DetectionResult {
  timestamp: number; // epoch ms
  total: number;
  available: number;
  occupied: number;
  spots?: Spot[]; // optional, used for overlay boxes
}

export interface DetectionService {
  detect(frame: Blob, signal?: AbortSignal): Promise<DetectionResult>;
}
