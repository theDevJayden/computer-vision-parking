import type { DetectionResult, DetectionService } from './DetectionService';

const TOTAL = 40;

function abortError(): Error {
  const e = new Error('Aborted');
  e.name = 'AbortError';
  return e;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t);
        reject(abortError());
      },
      { once: true },
    );
  });
}

/** Fake service: ignores the frame and slowly flips one spot at a time. */
export class MockDetectionService implements DetectionService {
  private occupiedFlags: boolean[];

  constructor() {
    // Start around 70% full.
    this.occupiedFlags = Array.from({ length: TOTAL }, () => Math.random() < 0.7);
  }

  async detect(_frame: Blob, signal?: AbortSignal): Promise<DetectionResult> {
    await delay(150 + Math.random() * 250, signal); // simulate network + inference

    if (Math.random() < 0.5) {
      const i = Math.floor(Math.random() * TOTAL);
      this.occupiedFlags[i] = !this.occupiedFlags[i];
    }
    const occupied = this.occupiedFlags.filter(Boolean).length;
    return {
      timestamp: Date.now(),
      total: TOTAL,
      occupied,
      available: TOTAL - occupied,
    };
  }
}
