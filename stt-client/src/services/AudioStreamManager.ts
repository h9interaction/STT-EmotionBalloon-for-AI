import { AUDIO_CONFIG, BUFFER_CONFIG, SERVER_CONFIG } from '../constants/audioConfig';

export interface AudioStreamCallbacks {
  onAudioData: (chunk: Uint8Array) => void;
  onError: (error: Error) => void;
}

export class AudioStreamManager {
  private audioContext: AudioContext | null = null;
  private audioInput: MediaStreamAudioSourceNode | null = null;
  private processor: AudioWorkletNode | null = null;
  private stream: MediaStream | null = null;
  private audioBuffer: Uint8Array;
  private bufferOffset: number = 0;
  private callbacks: AudioStreamCallbacks;

  constructor(callbacks: AudioStreamCallbacks) {
    this.callbacks = callbacks;
    this.audioBuffer = new Uint8Array(BUFFER_CONFIG.size);
  }

  /**
   * 미디어 스트림을 가져오는 함수
   */
  private async getMediaStream(): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: AUDIO_CONFIG.deviceId,
        sampleRate: AUDIO_CONFIG.sampleRate,
        sampleSize: AUDIO_CONFIG.sampleSize,
        channelCount: AUDIO_CONFIG.channelCount,
      },
      video: false,
    });
  }

  /**
   * 오디오 스트림을 시작합니다.
   */
  async startStream(): Promise<void> {
    try {
      this.stream = await this.getMediaStream();
      this.audioContext = new window.AudioContext();
      
      await this.audioContext.audioWorklet.addModule(SERVER_CONFIG.workletPath);
      await this.audioContext.resume();

      this.audioInput = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = new AudioWorkletNode(this.audioContext, "recorder.worklet");

      this.processor.connect(this.audioContext.destination);
      this.audioInput.connect(this.processor);

      this.processor.port.onmessage = (event: MessageEvent) => {
        this.handleAudioChunk(new Uint8Array(event.data));
      };

    } catch (error) {
      console.error("Error starting audio stream:", error);
      this.callbacks.onError(error as Error);
      throw error;
    }
  }

  /**
   * 오디오 청크를 처리합니다.
   */
  private handleAudioChunk(chunk: Uint8Array): void {
    const chunkLen = chunk.length;
    let buffer = this.audioBuffer;
    let offset = this.bufferOffset;

    // 3초 버퍼링
    if (offset + chunkLen > BUFFER_CONFIG.size) {
      const shift = offset + chunkLen - BUFFER_CONFIG.size;
      buffer.set(buffer.subarray(shift, offset), 0);
      offset -= shift;
    }

    buffer.set(chunk, offset);
    offset += chunkLen;
    this.audioBuffer = buffer;
    this.bufferOffset = offset;

    // 콜백으로 오디오 데이터 전달
    this.callbacks.onAudioData(chunk);
  }

  /**
   * 오디오 스트림을 중지합니다.
   */
  stopStream(): void {
    try {
      this.processor?.disconnect();
      this.audioInput?.disconnect();
      
      if (this.audioContext?.state !== "closed") {
        this.audioContext?.close();
      }

      this.stream?.getTracks().forEach(track => track.stop());

      this.processor = null;
      this.audioInput = null;
      this.audioContext = null;
      this.stream = null;
      this.bufferOffset = 0;

    } catch (error) {
      console.error("Error stopping audio stream:", error);
    }
  }

  /**
   * 현재 버퍼의 오디오 데이터를 가져옵니다.
   */
  getCurrentBuffer(): Uint8Array {
    return this.audioBuffer.slice(0, this.bufferOffset);
  }

  /**
   * 버퍼를 초기화합니다.
   */
  resetBuffer(): void {
    this.bufferOffset = 0;
  }
} 