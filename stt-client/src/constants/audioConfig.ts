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

// 서버 설정 (환경에 따라 동적 설정)
const getServerUrl = (): string => {
  // 개발 환경
  if (process.env.NODE_ENV === 'development') {
    return "http://localhost:8081";
  }
  
  // 프로덕션 환경 (Render 배포 URL)
  // TODO: 실제 배포 후 URL로 변경
  return "https://your-render-service-url.onrender.com";
};

export const SERVER_CONFIG = {
  url: getServerUrl(),
  workletPath: "/src/worklets/recorderWorkletProcessor.js"
} as const; 