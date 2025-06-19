// 웹캠 스트림 설정
export const WEBCAM_CONFIG = {
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: "user" as const
  }
} as const;

// 이미지 캡처 설정
export const IMAGE_CAPTURE_CONFIG = {
  maxWidth: 640 / 4,    // 최대 너비 (160px)
  maxHeight: 480 / 4,   // 최대 높이 (120px)
  quality: 0.5,         // JPEG 품질 (50%)
  format: "image/jpeg" as const
} as const;

// 이미지 크기 조절을 위한 설정 인터페이스
export interface ImageResizeConfig {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;  // 0.0 ~ 1.0
} 