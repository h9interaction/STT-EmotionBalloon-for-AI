import { resizeImage, canvasToBase64, logImageInfo } from '../utils/imageProcessor';
import { ImageResizeConfig, IMAGE_CAPTURE_CONFIG } from '../constants/webcamConfig';

export class ImageCaptureService {
  /**
   * 비디오 요소에서 이미지를 캡처합니다.
   */
  static captureFromVideo(
    video: HTMLVideoElement, 
    config: ImageResizeConfig = IMAGE_CAPTURE_CONFIG
  ): string | null {
    if (!video || !video.videoWidth || !video.videoHeight) {
      console.warn("Video element is not ready for capture");
      return null;
    }

    try {
      // 원본 캔버스 생성
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        console.error("Failed to get canvas context");
        return null;
      }

      // 비디오 프레임을 캔버스에 그리기
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 이미지 크기 조절 적용
      const resizedCanvas = resizeImage(canvas, config);

      // Base64로 변환
      const base64 = canvasToBase64(resizedCanvas, config);

      // 이미지 정보 로깅
      logImageInfo(canvas, resizedCanvas, base64, config);

      return base64;

    } catch (error) {
      console.error("Error capturing image:", error);
      return null;
    }
  }

  /**
   * 캔버스에서 이미지를 캡처합니다.
   */
  static captureFromCanvas(
    canvas: HTMLCanvasElement, 
    config: ImageResizeConfig = IMAGE_CAPTURE_CONFIG
  ): string | null {
    try {
      const resizedCanvas = resizeImage(canvas, config);
      const base64 = canvasToBase64(resizedCanvas, config);
      
      logImageInfo(canvas, resizedCanvas, base64, config);
      
      return base64;
    } catch (error) {
      console.error("Error capturing from canvas:", error);
      return null;
    }
  }
} 