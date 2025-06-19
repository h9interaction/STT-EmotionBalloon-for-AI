import { WEBCAM_CONFIG } from '../constants/webcamConfig';

export interface WebcamCallbacks {
  onStreamReady: (stream: MediaStream) => void;
  onError: (error: Error) => void;
}

export class WebcamStreamManager {
  private stream: MediaStream | null = null;
  private callbacks: WebcamCallbacks;

  constructor(callbacks: WebcamCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * 웹캠 스트림을 시작합니다.
   */
  async startStream(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(WEBCAM_CONFIG);
      this.callbacks.onStreamReady(this.stream);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Webcam access error:", error);
      this.callbacks.onError(new Error(`웹캠 접근이 거부되었습니다: ${errorMessage}`));
    }
  }

  /**
   * 웹캠 스트림을 중지합니다.
   */
  stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  /**
   * 현재 스트림을 가져옵니다.
   */
  getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * 스트림이 활성 상태인지 확인합니다.
   */
  isStreamActive(): boolean {
    return this.stream !== null && this.stream.active;
  }
} 