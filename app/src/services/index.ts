import { config } from '../config';
import type { DetectionService } from './DetectionService';
import { HttpDetectionService } from './HttpDetectionService';
import { MockDetectionService } from './MockDetectionService';

export type { DetectionResult, DetectionService, Spot } from './DetectionService';

export function createDetectionService(): DetectionService {
  return config.useMock ? new MockDetectionService() : new HttpDetectionService(config.apiBaseUrl);
}
