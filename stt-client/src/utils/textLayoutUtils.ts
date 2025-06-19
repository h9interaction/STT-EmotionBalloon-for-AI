import { bubbleConfig } from '../constants/emotionConfig';

export interface BubbleLayout {
  lines: string[];
  maxLineWidth: number;
  contentWidth: number;
  contentHeight: number;
  dynamicRadius: number;
}

export interface LayoutOptions {
  maxLines?: number;
  lineHeight?: number;
  padding?: number;
  minRadius?: number;
  maxRadius?: number;
}

/**
 * 텍스트를 말풍선에 맞게 줄바꿈하고 반지름을 계산하는 함수
 */
export function getBubbleLayout(
  displayText: string, 
  ctx: CanvasRenderingContext2D, 
  options?: LayoutOptions
): BubbleLayout {
  const maxLines = options?.maxLines ?? bubbleConfig.maxLines;
  const lineHeight = options?.lineHeight ?? bubbleConfig.lineHeight;
  const padding = options?.padding ?? bubbleConfig.padding;
  const minRadius = options?.minRadius ?? bubbleConfig.minRadius;
  const maxRadius = options?.maxRadius ?? bubbleConfig.maxRadius;
  const maxTextWidthBase = bubbleConfig.maxTextWidthBase;

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

// ----------- 구조화 텍스트 레이아웃 유틸리티 -----------

export interface StructuredTextLayout {
  lines: { text: string; font: string; fontSize: number; lineY: number }[];
  maxLineWidth: number;
  totalHeight: number;
  recommendedRadius: number;
  padding: number;
}

/**
 * 별명, 이모지, 텍스트(여러 줄) 구조를 받아, 줄 배열, 각 줄 폰트, 전체 높이, 최대 너비, 반지름 추천값 등을 반환
 * A안: 각 줄의 실제 폰트 크기와 시각적 높이로 전체 텍스트 블록 높이 계산, 줄별 중앙 정렬 정보 포함
 * B안: 반지름 계산식 개선(mainSize/2 + padding/2, padding 16~24, 최대 반지름 200, 최소 48)
 */
export function getStructuredTextLayout(
  ctx: CanvasRenderingContext2D,
  components: { nickname: string; emoji: string; text: string; ai?: string },
  radiusHint?: number // 추천 반지름(없으면 자동계산)
): StructuredTextLayout {
  const { nickname, emoji, text, ai } = components;
  // 폰트/간격/패딩(비율화는 추후)
  const nicknameFont = '800 18px Pretendard, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  const emojiFont = '40px Pretendard-Regular, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  const textFont = '400 14px Pretendard, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  const aiFont = '200 12px Pretendard, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  const nicknameFontSize = 18;
  const emojiFontSize = 40;
  const textFontSize = 14;
  const aiFontSize = 12;
  const lineGap = 8; // 줄 간격
  const minPadding = 10;
  const maxPadding = 16;
  // 패딩: 반지름 힌트가 있으면 비례, 없으면 20
  const padding = radiusHint ? Math.max(minPadding, Math.min(maxPadding, Math.round(radiusHint * 0.12))) : 20;

  let lines: { text: string; font: string; fontSize: number; lineY: number }[] = [];
  let maxLineWidth = 0;
  let totalHeight = 0;

  // 별명
  if (nickname) {
    ctx.font = nicknameFont;
    lines.push({ text: nickname, font: nicknameFont, fontSize: nicknameFontSize, lineY: 0 });
    const w = ctx.measureText(nickname).width;
    if (w > maxLineWidth) maxLineWidth = w;
    totalHeight += nicknameFontSize;
  }
  // 이모지
  if (emoji) {
    ctx.font = emojiFont;
    lines.push({ text: emoji, font: emojiFont, fontSize: emojiFontSize, lineY: 0 });
    const w = ctx.measureText(emoji).width;
    if (w > maxLineWidth) maxLineWidth = w;
    totalHeight += emojiFontSize;
  }
  // 텍스트(줄바꿈 포함)
  if (text) {
    ctx.font = textFont;
    // 한 줄의 최대 너비: 내접 사각형 기준
    const maxTextWidth = Math.max(60, (radiusHint ?? 180) * Math.SQRT2 - 2 * padding);
    const words = text.split(' ');
    let currentLine = '';
    let textLines: string[] = [];
    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextWidth && currentLine) {
        textLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) textLines.push(currentLine);
    // 줄 수 제한
    const maxLines = 10;
    if (textLines.length > maxLines) {
      textLines = textLines.slice(0, maxLines - 1);
      textLines.push(textLines[textLines.length - 1].replace(/.$/, '…'));
    }
    textLines.forEach(line => {
      ctx.font = textFont;
      lines.push({ text: line, font: textFont, fontSize: textFontSize, lineY: 0 });
      const w = ctx.measureText(line).width;
      if (w > maxLineWidth) maxLineWidth = w;
    });
    totalHeight += textLines.length * textFontSize;
  }
  // AI 코멘트
  if (ai) {
    ctx.font = aiFont;
    lines.push({ text: ai, font: aiFont, fontSize: aiFontSize, lineY: 0 });
    const w = ctx.measureText(ai).width;
    if (w > maxLineWidth) maxLineWidth = w;
    totalHeight += aiFontSize;
  }
  // 줄 간격 추가 (줄 수 - 1)
  if (lines.length > 1) {
    totalHeight += (lines.length - 1) * lineGap;
  }
  // 패딩 추가
  maxLineWidth += padding * 2;
  totalHeight += padding * 2;
  // 각 줄의 Y좌표 계산 (세로 중앙 정렬)
  let y = -totalHeight / 2 + padding;
  for (let i = 0; i < lines.length; i++) {
    lines[i].lineY = y + lines[i].fontSize / 2;
    y += lines[i].fontSize + lineGap;
  }
  // 반지름 추천값: mainSize/2 + padding/2, 상한/하한 적용
  const mainSize = Math.max(maxLineWidth, totalHeight);
  const recommendedRadius = Math.max(48, Math.min(400, Math.ceil(mainSize / 2 + padding / 2)));

  return {
    lines,
    maxLineWidth,
    totalHeight,
    recommendedRadius,
    padding
  };
} 