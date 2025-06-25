import { useEffect, useRef } from 'react';

export interface CanvasEventHandlers {
  onResize: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void;
  onKeyPress?: (event: KeyboardEvent) => void;
}

export function useCanvasEvents(
  width: number,
  height: number,
  backgroundColor: string,
  handlers: CanvasEventHandlers
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
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

    // 창 크기 변경 이벤트 핸들러
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      handlers.onResize(canvas, ctx);
    };

    // "/" 키 이벤트 핸들러
    // const handleKeyPress = (event: KeyboardEvent) => {
    //   if (event.code === 'Slash' || event.key === '/') {
    //     handlers.onKeyPress?.(event);
    //   }
    // };

    window.addEventListener('resize', handleResize);
    // window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('resize', handleResize);
      // window.removeEventListener('keydown', handleKeyPress);
    };
  }, [width, height, backgroundColor, handlers]);

  return canvasRef;
} 