import React, { useRef, useEffect, useState, useMemo } from 'react';
import { BubbleAnimation } from './animations/BubbleAnimation';
import { Bubble } from './types/Bubble';
import { animationConfig } from './constants/emotionConfig';
import { SpeechBubbleRenderer } from './components/SpeechBubbleRenderer';
import { BubbleFactory, EmotionAnalysis } from './factories/BubbleFactory';
import { useCanvasEvents } from './hooks/useCanvasEvents';
import { useFontLoader } from './hooks/useFontLoader';

interface VisualizationCanvasProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
  zIndex?: number;
  analysisResult?: EmotionAnalysis | null;
  onBubbleCreated?: () => void;
}

const VisualizationCanvas: React.FC<VisualizationCanvasProps> = ({
  width = window.innerWidth,
  height = window.innerHeight,
  backgroundColor = 'rgba(33, 33, 33, 1)',
  zIndex = 999,
  analysisResult,
  onBubbleCreated
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const fontReady = useFontLoader();

  // 애니메이션 프레임 관리
  const animationRef = useRef<number>();
  const bubbleAnimationRef = useRef<BubbleAnimation>();

  // 애니메이션 설정
  const animationSettings = useMemo(() => ({
    width,
    height,
    centerX: width / 2,
    centerY: height / 2,
    ...animationConfig
  }), [width, height]);

  // Canvas 이벤트 핸들러
  const canvasHandlers = useMemo(() => ({
    onResize: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      if (!fontReady) return;
      
      const renderer = new SpeechBubbleRenderer(ctx);
      bubbles.forEach(bubble => {
        renderer.drawSpeechBubble(
          bubble.x, 
          bubble.y, 
          bubble.text, 
          bubble.emotion, 
          bubble.opacity, 
          bubble.radius, 
          bubble.scale
        );
      });
    },
    onKeyPress: () => {
      setIsVisible(prev => !prev);
    }
  }), [bubbles, fontReady]);

  // Canvas 이벤트 훅 사용
  const canvasRef = useCanvasEvents(width, height, backgroundColor, canvasHandlers);

  // 말풍선 렌더링
  useEffect(() => {
    if (!fontReady) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderer = new SpeechBubbleRenderer(ctx);
    
    // 말풍선 그리기
    bubbles.forEach(bubble => {
      renderer.drawSpeechBubble(
        bubble.x, 
        bubble.y, 
        bubble.text, 
        bubble.emotion, 
        bubble.opacity, 
        bubble.radius, 
        bubble.scale
      );
    });
  }, [bubbles, fontReady, canvasRef]);

  // 말풍선 위치 애니메이션
  useEffect(() => {
    // BubbleAnimation 인스턴스 초기화
    bubbleAnimationRef.current = new BubbleAnimation(animationSettings);

    const animate = () => {
      setBubbles(prev => {
        if (!bubbleAnimationRef.current) return prev;

        // 현재 버블 상태를 애니메이션 클래스에 설정
        bubbleAnimationRef.current.setBubbles(prev);

        // 애니메이션 업데이트
        return bubbleAnimationRef.current.update();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animationSettings]);

  // 새로운 분석 결과가 들어오면 말풍선 추가
  useEffect(() => {
    if (analysisResult) {
      setBubbles(prev => {
        // 중복 방지: 같은 텍스트+감정 결과가 이미 있으면 추가하지 않음
        const exists = prev.some(
          b => b.text === analysisResult.text && b.emotion === analysisResult.emotionAnalysis
        );
        if (exists) return prev;

        try {
          // 새로운 버블 생성
          const newBubble = BubbleFactory.createBubble(analysisResult, width, height);
          const next = [...prev, newBubble];
          const bubbleIdx = next.length - 1;
          
          // scale 애니메이션 시작
          BubbleFactory.startScaleAnimation(newBubble, bubbleIdx, setBubbles);
          
          // 최종 버블 생성 시점에 콜백 호출
          if (onBubbleCreated) onBubbleCreated();
          
          return next;
        } catch (error) {
          console.error('Failed to create bubble:', error);
          return prev;
        }
      });
    }
  }, [analysisResult, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: zIndex,
        pointerEvents: 'none',
        opacity: isVisible ? 0 : 1,
        transition: 'opacity 0.3s ease-in-out'
      }}
    />
  );
};

export default VisualizationCanvas; 