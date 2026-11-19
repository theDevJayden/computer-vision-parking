import type { DetectionResult, DetectionService } from './DetectionService';

/** Real API client: POST {baseUrl}/detect, multipart field "image" (assumed contract, PRD section 6). */
export class HttpDetectionService implements DetectionService {
  constructor(private readonly baseUrl: string) {}

  async detect(frame: Blob, signal?: AbortSignal): Promise<DetectionResult> {
    const form = new FormData();
    form.append('image', frame, 'frame.jpg');
    const res = await fetch(`${this.baseUrl.replace(/\/+$/, '')}/detect`, {
      method: 'POST',
      body: form,
      signal,
    });
    if (!res.ok) throw new Error(`Detection failed: HTTP ${res.status}`);
    return (await res.json()) as DetectionResult;
  }
}
