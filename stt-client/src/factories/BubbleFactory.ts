import { Bubble } from '../types/Bubble';
import { emotionSpeedMap } from '../constants/emotionConfig';
import { extractEmotionData } from '../utils/emotionParser';
import { getBubbleLayout, getStructuredTextLayout } from '../utils/textLayoutUtils';

export interface EmotionAnalysis {
  text: string;
  emotionAnalysis: string;
}

export class BubbleFactory {
  /**
   * 감정 분석 결과로부터 새로운 버블을 생성하는 함수
   */
  static createBubble(
    analysisResult: EmotionAnalysis,
    width: number,
    height: number
  ): Bubble {
    const { text, emotionAnalysis } = analysisResult;
    
    // 감정 데이터 추출
    const { selectedEmotion, displayTextComponents } = extractEmotionData(text, emotionAnalysis);
    
    // 임시 캔버스 컨텍스트로 반지름 계산
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) {
      throw new Error('Failed to create canvas context for bubble layout calculation');
    }
    
    let dynamicRadius = 90; // 기본값
    if (displayTextComponents) {
      // 유틸리티로 통합된 레이아웃 계산
      const layout = getStructuredTextLayout(ctx, displayTextComponents);
      dynamicRadius = layout.recommendedRadius;
    } else {
      ctx.font = '300 14px Pretendard, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      const { dynamicRadius: layoutRadius } = getBubbleLayout(text, ctx);
      dynamicRadius = layoutRadius;
    }
    dynamicRadius = dynamicRadius;
    
    // 초기 위치를 화면 중앙으로 설정
    const x = width / 2 - dynamicRadius / 2;
    const y = height / 2 - dynamicRadius / 2;
    
    // 감정별 속도 적용
    const [minV, maxV] = emotionSpeedMap[selectedEmotion] || [0.4, 0.8];
    const emotionSpeed = minV + Math.random() * (maxV - minV);
    
    return {
      x,
      y,
      text,
      emotion: emotionAnalysis,
      opacity: 0,
      velocity: 0,
      angle: Math.random() * Math.PI * 2,
      radius: dynamicRadius,
      emotionSpeed,
      scale: 0
    };
  }
  
  /**
   * 버블의 scale 애니메이션을 시작하는 함수
   */
  static startScaleAnimation(
    bubble: Bubble,
    bubbleIndex: number,
    setBubbles: React.Dispatch<React.SetStateAction<Bubble[]>>,
    duration: number = 300
  ): void {
    const start = performance.now();
    
    function animateScale(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      
      setBubbles(bubs => bubs.map((b, i) =>
        i === bubbleIndex ? { ...b, scale: t, opacity: t } : b
      ));
      
      if (t < 1) {
        requestAnimationFrame(animateScale);
      }
    }
    
    requestAnimationFrame(animateScale);
  }
} 