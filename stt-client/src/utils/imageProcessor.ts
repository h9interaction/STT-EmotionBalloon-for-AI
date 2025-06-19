import { ImageResizeConfig, IMAGE_CAPTURE_CONFIG } from '../constants/webcamConfig';

/**
 * 이미지 크기 조절 함수
 * 원본 캔버스를 주어진 설정에 따라 리사이즈합니다.
 */
export function resizeImage(
  canvas: HTMLCanvasElement, 
  config: ImageResizeConfig = IMAGE_CAPTURE_CONFIG
): HTMLCanvasElement {
  const { maxWidth, maxHeight } = config;
  const originalWidth = canvas.width;
  const originalHeight = canvas.height;

  // 새로운 크기 계산
  let newWidth = originalWidth;
  let newHeight = originalHeight;

  if (maxWidth && originalWidth > maxWidth) {
    newWidth = maxWidth;
    newHeight = (originalHeight * maxWidth) / originalWidth;
  }

  if (maxHeight && newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = (newWidth * maxHeight) / newHeight;
  }

  // 크기가 변경된 경우에만 리사이즈
  if (newWidth !== originalWidth || newHeight !== originalHeight) {
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = newWidth;
    resizedCanvas.height = newHeight;
    const ctx = resizedCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(canvas, 0, 0, newWidth, newHeight);
      return resizedCanvas;
    }
  }

  return canvas;
}

/**
 * 캔버스를 Base64로 변환하는 함수
 */
export function canvasToBase64(
  canvas: HTMLCanvasElement, 
  config: ImageResizeConfig = IMAGE_CAPTURE_CONFIG
): string {
  const { quality } = config;
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * 이미지 크기 정보를 로깅하는 함수
 */
export function logImageInfo(
  originalCanvas: HTMLCanvasElement, 
  resizedCanvas: HTMLCanvasElement, 
  base64: string, 
  config: ImageResizeConfig = IMAGE_CAPTURE_CONFIG
): void {
  console.log('Image size info:', {
    originalWidth: originalCanvas.width,
    originalHeight: originalCanvas.height,
    resizedWidth: resizedCanvas.width,
    resizedHeight: resizedCanvas.height,
    base64Length: base64.length,
    estimatedSizeKB: Math.round(base64.length * 0.75 / 1024),
    quality: config.quality
  });
} 