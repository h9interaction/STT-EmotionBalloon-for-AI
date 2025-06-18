import React, { useRef, useEffect, useState, useMemo } from 'react';
import { BubbleAnimation } from './animations/BubbleAnimation';
import { Bubble } from './types/Bubble';

const emotionColorMap: Record<string, string> = {
  '기쁨': '#FFF9C4', // 연노랑
  '슬픔': '#BBDEFB', // 연파랑
  '분노': '#FFCDD2', // 연빨강
  '두려움': '#D1C4E9', // 연보라
  '놀람': '#FFE0B2', // 연오렌지
  '혐오': '#C8E6C9', // 연연두
  '중립': '#ECECEC', // 연회색
  '우울함': '#B0BEC5', // 연회색(푸른기)
  '불안': '#FFE082', // 연노랑(불안)
  '초조함': '#FFECB3', // 연노랑(초조)
  '졸림': '#E1BEE7', // 연보라(졸림)
  '흥분': '#FFCCBC', // 연살구
  '만족': '#F0F4C3', // 연연두(만족)
  '실망': '#BCAAA4', // 연갈색
  '걱정': '#B3E5FC', // 연하늘
  '자신감': '#C5E1A5', // 연연두(자신감)
  '혼란': '#F8BBD0', // 연분홍(혼란)
  '기대감': '#FFF9C4', // 연노랑(기대)
  '관심': '#FFD6E0', // 연핑크
  '지루함': '#F5F5F5', // 밝은회색
  '집중': '#B2DFDB', // 연청록
  '공감': '#F8BBD0', // 연분홍
  '무관심': '#E0E0E0', // 연회색
  '평온': '#DCEDC8', // 연연두
  '희망': '#FFF59D', // 연노랑(희망)
  '좌절': '#B0BEC5', // 연회색(푸른기)
  '감사': '#FFF8E1', // 연베이지
  '후회': '#D7CCC8', // 연갈색(후회)
  '자부심': '#FFE082', // 연노랑(자부심)
  '수치심': '#FFCDD2', // 연빨강(수치심)
  '외로움': '#B3E5FC', // 연하늘(외로움)
  '사랑': '#FFEBEE', // 연분홍(사랑)
  '증오': '#D7CCC8', // 연갈색(증오)
  '질투': '#C8E6C9', // 연연두(질투)
  '동정': '#E1BEE7', // 연보라(동정)
  '경외': '#B2DFDB', // 연청록(경외)
  '경멸': '#F5F5F5', // 밝은회색(경멸)
  '불확실': '#FFFDE7', // 연노랑(불확실)
  '불안정': '#FFE0B2', // 연오렌지(불안정)
  '긴장': '#B3E5FC', // 연하늘(긴장)
  '이완': '#DCEDC8', // 연연두(이완)
  '활력': '#FFF9C4', // 연노랑(활력)
  '피로': '#E0E0E0', // 연회색(피로)
  '산만': '#F8BBD0', // 연분홍(산만)
  '불만족': '#FFCDD2', // 연빨강(불만족)
  '편안함': '#DCEDC8', // 연연두(편안함)
  '불편함': '#FFE0B2', // 연오렌지(불편함)
  '상실': '#B0BEC5', // 연회색(상실)
  '용기': '#C5E1A5', // 연연두(용기)
  '안도감': '#FFF9C4', // 연노랑(안도감)
  '죄책감': '#D7CCC8', // 연갈색(죄책감)
  '무력감': '#B0BEC5', // 연회색(무력감)
  '절망': '#B0BEC5', // 연회색(절망)
  '열정': '#FFCCBC', // 연살구(열정)
  '설렘': '#FFF9C4', // 연노랑(설렘)
  '감탄': '#FFD6A5', // 연오렌지(감탄)
  '안절부절': '#FFE0B2', // 연오렌지(안절부절)
  '부끄러움': '#F8BBD0', // 연분홍(부끄러움)
  '성취감': '#C5E1A5', // 연연두(성취감)
};

interface EmotionAnalysis {
  text: string;
  emotionAnalysis: string;
}

interface VisualizationCanvasProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
  zIndex?: number;
  analysisResult?: EmotionAnalysis | null;
}

// 감정별 속도 매핑
const emotionSpeedMap: Record<string, [number, number]> = {
  // 매우 빠름
  '분노': [1.5, 2.0], '화남': [1.5, 2.0], '흥분': [1.5, 2.0], '긴장': [1.5, 2.0], '초조함': [1.5, 2.0], '불안': [1.5, 2.0], '열정': [1.5, 2.0], '증오': [1.5, 2.0], '산만': [1.5, 2.0],
  // 보통
  '기쁨': [1.3, 1.8], '놀람': [1.3, 1.8], '자신감': [1.3, 1.8], '기대감': [1.3, 1.8], '설렘': [1.3, 1.8], '감탄': [1.3, 1.8], '활력': [1.3, 1.8], '집중': [1.3, 1.8], '사랑': [1.3, 1.8], '용기': [1.3, 1.8], '성취감': [1.3, 1.8],
  // 느림
  '슬픔': [0.5, 0.9], '우울함': [0.5, 0.9], '피로': [0.5, 0.9], '졸림': [0.5, 0.9], '실망': [0.5, 0.9], '후회': [0.5, 0.9], '상실': [0.5, 0.9], '무력감': [0.5, 0.9], '절망': [0.5, 0.9], '외로움': [0.5, 0.9], '불만족': [0.5, 0.9], '불확실': [0.5, 0.9], '불안정': [0.5, 0.9], '좌절': [0.5, 0.9], '수치심': [0.5, 0.9], '부끄러움': [0.5, 0.9],
  // 아주 느림/정적
  '중립': [0.8, 1.0], '평온': [0.8, 1.0], '이완': [0.8, 1.0], '편안함': [0.8, 1.0], '안도감': [0.8, 1.0], '감사': [0.8, 1.0], '공감': [0.8, 1.0], '동정': [0.8, 1.0], '무관심': [0.8, 1.0],
};

// 텍스트 줄바꿈 및 반지름 계산 함수
function getBubbleLayout(displayText: string, ctx: CanvasRenderingContext2D, options?: { maxLines?: number, lineHeight?: number, padding?: number, minRadius?: number, maxRadius?: number }) {
  const maxLines = options?.maxLines ?? 12;
  const lineHeight = options?.lineHeight ?? 22;
  const padding = options?.padding ?? 24;
  const minRadius = options?.minRadius ?? 70;
  const maxRadius = options?.maxRadius ?? 500;
  const maxTextWidthBase = 90 * 1.6; // 기본값, 실제 반지름에 따라 조정 필요

  // \n을 실제 줄바꿈 문자로 변환
  displayText = displayText.replace(/\\n/g, '\n');
  // 줄바꿈 문자 기준으로 분리
  const rawLines = displayText.split('\n');
  const lines: string[] = [];
  let maxLineWidth = 0;
  for (let rawLine of rawLines) {
    const words = rawLine.split(' ');
    let currentLine = words[0] || '';
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + ' ' + word;
      const width = ctx.measureText(testLine).width;
      if (width < maxTextWidthBase) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
        if (lines.length >= maxLines - 1) break;
      }
    }
    lines.push(currentLine);
    if (lines.length >= maxLines) break;
  }
  // 줄 수 제한, 넘치면 말줄임표
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = lines[maxLines - 1].replace(/.$/, '…');
  }
  lines.forEach(line => {
    const width = ctx.measureText(line).width;
    if (width > maxLineWidth) maxLineWidth = width;
  });
  const contentWidth = maxLineWidth + padding * 2;
  const contentHeight = lines.length * lineHeight + padding * 2;
  const dynamicRadius = Math.max(
    minRadius,
    Math.min(
      maxRadius,
      Math.max(contentWidth * 0.3, contentHeight * 0.6)
    )
  );
  return { lines, maxLineWidth, contentWidth, contentHeight, dynamicRadius };
}

const VisualizationCanvas: React.FC<VisualizationCanvasProps> = ({
  width = window.innerWidth,
  height = window.innerHeight,
  backgroundColor = 'rgba(33, 33, 33, 1)',
  zIndex = 999,
  analysisResult
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  // 애니메이션 프레임 관리
  const animationRef = useRef<number>();
  const bubbleAnimationRef = useRef<BubbleAnimation>();

  // 폰트 로드 상태 관리
  const [fontReady, setFontReady] = useState(false);

  // 애니메이션 설정
  const animationConfig = useMemo(() => ({
    width,
    height,
    centerX: width / 2,
    centerY: height / 2,
    springConstant: 0.03,     // 스프링 강도 감소
    dampingFactor: 0.08,      // 감쇠 계수 증가
    centerAttraction: 1500,   // 중앙으로의 인력 조정
    repulsionStrength: 6000,  // 반발력 조정
    minDistance: 250,         // 최소 거리 증가
    collisionDamping: 0.7,    // 충돌 감쇠
    maxVelocity: 12          // 최대 속도 제한
  }), [width, height]);

  const radius = 90; // 항상 최상단에 선언

  // 각 bubble마다 JSON 파싱을 수행하는 함수
  const parseEmotionAnalysis = (emotionAnalysis: string) => {
    try {
      let jsonStr = emotionAnalysis.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    // Pretendard-Regular 폰트가 로드될 때까지 대기
    if (document.fonts) {
      document.fonts.load('15px Pretendard-Regular').then(() => {
        document.fonts.ready.then(() => setFontReady(true));
      });
    } else {
      // 폰트 API 미지원 브라우저는 바로 true
      setFontReady(true);
    }
  }, []);

  // 말풍선 그리기 함수
  const drawSpeechBubble = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    text: string,
    emotion: string,
    opacity: number,
    radius: number,
    scale: number = 1 // scale 기본값 1
  ) => {
    // 원형 말풍선 파라미터
    const centerX = x + radius;
    const centerY = y + radius;
    const maxLines = 12;
    const lineHeight = 22;
    const padding = 36;

    // JSON 파싱 시도 및 감정 추출
    let displayText = text;
    let bubbleColor = 'rgba(255,255,255,1)'; // 기본값
    const parsedJson = parseEmotionAnalysis(emotion);
    if (parsedJson) {
      if (parsedJson.data?.result?.display_text) {
        displayText = parsedJson.data.result.display_text;
      }
      const selectedEmotion = parsedJson.data?.result?.selected_first_emotion;
      if (selectedEmotion && emotionColorMap[selectedEmotion]) {
        bubbleColor = emotionColorMap[selectedEmotion];
      }
    }

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = bubbleColor;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 텍스트 그리기 (원 안 중앙 정렬)
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '14px Pretendard-Regular, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    const { lines } = getBubbleLayout(displayText, ctx, { maxLines, lineHeight, padding, minRadius: 70, maxRadius: 500 });
    const totalTextHeight = lines.length * lineHeight;
    const startY = -totalTextHeight / 2 + lineHeight / 2 - padding / 4;
    lines.forEach((line, i) => {
      if (i === 0) {
        ctx.font = 'bold 16px Pretendard-Regular, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      }
      else if (i === 2) {
        ctx.font = '33px Pretendard-Regular, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      } else {
        ctx.font = '14px Pretendard-Regular, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      }
      ctx.fillText(line, 0, startY + i * lineHeight);
    });
    ctx.restore();
  };

  useEffect(() => {
    if (!fontReady) return; // 폰트가 준비된 후에만 drawSpeechBubble 실행
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas 크기 설정
    canvas.width = width;
    canvas.height = height;

    // 배경색 설정
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // 말풍선 그리기
    bubbles.forEach(bubble => {
      drawSpeechBubble(ctx, bubble.x, bubble.y, bubble.text, bubble.emotion, bubble.opacity, bubble.radius, bubble.scale);
    });

    // 창 크기 변경 시 Canvas 크기 조정
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      bubbles.forEach(bubble => {
        drawSpeechBubble(ctx, bubble.x, bubble.y, bubble.text, bubble.emotion, bubble.opacity, bubble.radius, bubble.scale);
      });
    };

    // 스페이스바 키 이벤트 핸들러
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.key === ' ' || event.key === 'Spacebar') {
        setIsVisible(prev => !prev);
      }
    };
 
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [width, height, backgroundColor, bubbles, fontReady]);

  // 말풍선 위치 애니메이션
  useEffect(() => {
    // BubbleAnimation 인스턴스 초기화
    bubbleAnimationRef.current = new BubbleAnimation(animationConfig);

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
  }, [animationConfig]);

  // 새로운 분석 결과가 들어오면 말풍선 추가
  useEffect(() => {
    if (analysisResult) {
      setBubbles(prev => {
        // 중복 방지: 같은 텍스트+감정 결과가 이미 있으면 추가하지 않음
        const exists = prev.some(
          b => b.text === analysisResult.text && b.emotion === analysisResult.emotionAnalysis
        );
        if (exists) return prev;

        // 말풍선 텍스트 길이에 따라 반지름 동적 계산
        const ctx = document.createElement('canvas').getContext('2d');
        if (!ctx) return prev;

        ctx.font = '14px Pretendard-Regular, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
        let displayText = analysisResult.text;
        let selectedEmotion = '중립';

        const parsedJson = parseEmotionAnalysis(analysisResult.emotionAnalysis);
        if (parsedJson) {
          if (parsedJson.data?.result?.display_text) {
            displayText = parsedJson.data.result.display_text;
          }
          if (parsedJson.data?.result?.selected_first_emotion) {
            selectedEmotion = parsedJson.data.result.selected_first_emotion;
          }
        }

        // getBubbleLayout 함수 사용
        const { dynamicRadius } = getBubbleLayout(displayText, ctx, {
          maxLines: 12,
          lineHeight: 22,
          padding: 24,
          minRadius: 70,
          maxRadius: 500
        });

        // 초기 위치를 화면 중앙의 중심 좌표로 설정
        const x = width / 2 - radius / 2;
        const y = height / 2 - radius / 2;

        // 감정별 속도 적용
        const [minV, maxV] = emotionSpeedMap[selectedEmotion] || [0.4, 0.8];
        const emotionSpeed = minV + Math.random() * (maxV - minV);

        const newBubble = {
          x,
          y,
          text: analysisResult.text,
          emotion: analysisResult.emotionAnalysis,
          opacity: 0,
          velocity: 0,
          angle: Math.random() * Math.PI * 2,
          radius: dynamicRadius,
          emotionSpeed,
          scale: 0 // scale 0으로 생성
        };

        const next = [...prev, newBubble];
        const bubbleIdx = next.length - 1;
        // scale 트윈 (0.3초 동안 0→1)
        const duration = 300;
        const start = performance.now();
        function animateScale(now: number) {
          const elapsed = now - start;
          const t = Math.min(elapsed / duration, 1);
          setBubbles(bubs => bubs.map((b, i) =>
            i === bubbleIdx ? { ...b, scale: t, opacity: t } : b
          ));
          if (t < 1) {
            requestAnimationFrame(animateScale);
          }
        }
        requestAnimationFrame(animateScale);
        return next;
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