// 오디오 설정
export const AUDIO_CONFIG = {
  sampleRate: 16000,
  sampleSize: 16,
  channelCount: 1,
  deviceId: "default"
} as const;

// 버퍼 설정
export const BUFFER_CONFIG = {
  seconds: 3,
  sampleRate: 16000,
  bytesPerSample: 2,
  size: 3 * 16000 * 2 // BUFFER_SECONDS * SAMPLE_RATE * BYTES_PER_SAMPLE
} as const;

// STT 세션 설정
export const STT_CONFIG = {
  sessionLimit: 295000, // 4분 55초 (ms)
  maxRestartAttempts: 3,
  restartDelay: 2000, // 재연결 시도 간격 (ms)
  speakingTimeout: 1000, // 말하기 감지 타임아웃 (ms)
  finalSTTDebounce: 1000 // 최종 STT 중복 호출 방지 (ms)
} as const;

// 서버 설정
// Render에 배포된 서버 사용
export const SERVER_CONFIG = {
  url: "https://stt-emotion-balloon-server.onrender.com", // Render 배포 서버
  // url: "http://localhost:8081", // 로컬 테스트용 (환경 변수 문제 해결 시)
  workletPath: "/src/worklets/recorderWorkletProcessor.js"
} as const; 