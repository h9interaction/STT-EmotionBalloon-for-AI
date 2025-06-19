import * as io from "socket.io-client";
import { STT_CONFIG, SERVER_CONFIG } from '../constants/audioConfig';
import { removeDuplicateText, isValidText } from '../utils/textProcessor';

export interface WordRecognized {
  isFinal: boolean;
  text: string;
}

export interface SocketCallbacks {
  onConnect: () => void;
  onDisconnect: () => void;
  onAudioText: (text: string) => void;
  onFinalSTT: (text: string) => void;
  onStreamError: (error: string) => void;
  onConnectionError: (error: Error) => void;
}

export class SocketManager {
  private socket: io.Socket | null = null;
  private callbacks: SocketCallbacks;
  private sttTimer: NodeJS.Timeout | null = null;
  private speakingTimeout: NodeJS.Timeout | null = null;
  private lastFinalSTTTime: number = 0;
  private isSpeaking: boolean = false;
  private currentSTT: string = '';
  private prevSTT: string | null = null;
  private prevText: string = '';

  constructor(callbacks: SocketCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * WebSocket 연결을 시작합니다.
   */
  connect(): void {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io.connect(SERVER_CONFIG.url);
    this.setupEventListeners();
  }

  /**
   * 이벤트 리스너를 설정합니다.
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("Connected to server");
      this.callbacks.onConnect();
      this.startSTTSession();
    });

    this.socket.on("receive_audio_text", (data: WordRecognized) => {
      this.handleAudioText(data);
    });

    this.socket.on("stream_error", (data: { error: string }) => {
      console.log("Stream error received:", data);
      this.callbacks.onStreamError(data.error);
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from server");
      this.callbacks.onDisconnect();
    });

    this.socket.on("connect_error", (error: Error) => {
      console.error("Connection error:", error);
      this.callbacks.onConnectionError(error);
    });
  }

  /**
   * 오디오 텍스트를 처리합니다.
   */
  private handleAudioText(data: WordRecognized): void {
    this.isSpeaking = true;
    
    if (this.speakingTimeout) {
      clearTimeout(this.speakingTimeout);
    }

    if (data.isFinal) {
      this.currentSTT += (this.currentSTT ? ' ' : '') + data.text;
    } else {
      // 진행 중인 한 문장만 전달 (누적X)
      this.callbacks.onAudioText(data.text);
    }

    this.speakingTimeout = setTimeout(() => {
      this.isSpeaking = false;
      this.processFinalSTT();
    }, STT_CONFIG.speakingTimeout);
  }

  /**
   * 최종 STT를 처리합니다.
   */
  private processFinalSTT(): void {
    if (!isValidText(this.currentSTT)) return;

    let merged = this.currentSTT;
    
    if (this.prevSTT) {
      merged = removeDuplicateText(this.prevSTT, merged);
      merged = this.prevSTT + merged;
    }

    // Debounce: 중복 호출 방지
    const now = Date.now();
    if (now - this.lastFinalSTTTime > STT_CONFIG.finalSTTDebounce) {
      this.callbacks.onFinalSTT(merged);
      this.lastFinalSTTTime = now;
    }

    this.prevSTT = null;
    this.currentSTT = '';
  }

  /**
   * STT 세션을 시작합니다.
   */
  private startSTTSession(): void {
    if (!this.socket) return;

    this.socket.emit("startGoogleCloudStream");
    this.sttTimer = setTimeout(() => {
      this.restartSTTSession();
    }, STT_CONFIG.sessionLimit);
  }

  /**
   * STT 세션을 재시작합니다.
   */
  private restartSTTSession(): void {
    if (!this.socket) return;

    // 현재 실시간 텍스트를 이전 텍스트로 저장
    if (this.prevText) {
      this.prevText = this.prevText;
    }

    if (isValidText(this.currentSTT)) {
      this.prevSTT = this.currentSTT;
      this.currentSTT = '';
    }

    this.socket.emit("endGoogleCloudStream");
    
    setTimeout(() => {
      if (this.socket) {
        this.socket.emit("startGoogleCloudStream");
        this.sttTimer = setTimeout(() => {
          this.restartSTTSession();
        }, STT_CONFIG.sessionLimit);
      }
    }, 500);
  }

  /**
   * 오디오 데이터를 서버로 전송합니다.
   */
  sendAudioData(audioData: Uint8Array): void {
    if (this.socket) {
      this.socket.emit("send_audio_data", { audio: audioData });
    }
  }

  /**
   * 이전 텍스트를 설정합니다.
   */
  setPrevText(text: string): void {
    this.prevText = text;
  }

  /**
   * WebSocket 연결을 종료합니다.
   */
  disconnect(): void {
    if (this.socket) {
      try {
        this.socket.emit("endGoogleCloudStream");
        this.socket.disconnect();
      } catch (e) {
        console.error("Error disconnecting:", e);
      }
      this.socket = null;
    }

    if (this.sttTimer) {
      clearTimeout(this.sttTimer);
      this.sttTimer = null;
    }

    if (this.speakingTimeout) {
      clearTimeout(this.speakingTimeout);
      this.speakingTimeout = null;
    }

    this.resetState();
    this.callbacks.onDisconnect();
  }

  /**
   * 상태를 초기화합니다.
   */
  private resetState(): void {
    this.isSpeaking = false;
    this.currentSTT = '';
    this.prevSTT = null;
    this.prevText = '';
    this.lastFinalSTTTime = 0;
  }

  /**
   * 연결 상태를 확인합니다.
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
} 