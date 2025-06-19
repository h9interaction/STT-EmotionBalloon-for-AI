import { getBubbleLayout, getStructuredTextLayout } from '../utils/textLayoutUtils';
import { extractEmotionData } from '../utils/emotionParser';
import { bubbleConfig } from '../constants/emotionConfig';

export class SpeechBubbleRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  /**
   * 말풍선을 그리는 메인 함수
   */
  drawSpeechBubble(
    x: number,
    y: number,
    text: string,
    emotion: string,
    opacity: number,
    radius: number,
    scale: number = 1
  ): void {
    
    const centerX = x + radius;
    const centerY = y + radius;

    // 감정 데이터 추출
    const { displayText, bubbleColor, displayTextComponents } = extractEmotionData(text, emotion);

    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    this.ctx.translate(centerX, centerY);
    this.ctx.scale(scale, scale);

    // 원형 말풍선 그리기
    this.drawBubbleCircle(radius, bubbleColor);

    // 텍스트 그리기 (새로운 구조 지원)
    if (displayTextComponents) {
      this.drawStructuredBubbleText(displayTextComponents, radius);
    }
    this.ctx.restore();
  }

  /**
   * 원형 말풍선 배경 그리기
   */
  private drawBubbleCircle(radius: number, color: string): void {
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255,255,255,1.0)';
    this.ctx.lineWidth = 5;
    this.ctx.stroke();
  }

  /**
   * 구조화된 텍스트 그리기 (유틸리티 통합, 줄별 Y좌표/폰트 적용)
   */
  private drawStructuredBubbleText(
    components: { nickname: string; emoji: string; text: string; ai?: string }, 
    radius: number
  ): void {
    // getStructuredTextLayout 유틸리티로 레이아웃 계산
    const layout = getStructuredTextLayout(this.ctx, components, radius);
    const { lines } = layout;

    lines.forEach(({ text, font, lineY }) => {
      this.ctx.font = font;
      this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(text, 0, lineY);
    });
  }
} 