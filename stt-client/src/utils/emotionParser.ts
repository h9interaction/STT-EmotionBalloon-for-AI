import { emotionColorMap } from '../constants/emotionConfig';

export interface ParsedEmotionData {
  displayText: string;
  selectedEmotion: string;
  bubbleColor: string;
  displayTextComponents?: {
    nickname: string;
    emoji: string;
    text: string;
    ai?: string;
  };
}

/**
 * 감정 분석 JSON 문자열을 파싱하는 함수
 */
export function parseEmotionAnalysis(emotionAnalysis: string): any {
  try {
    let jsonStr = emotionAnalysis.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
}

/**
 * display_text 컴포넌트들을 조합하여 표시 텍스트를 생성하는 함수
 */
function buildDisplayText(components: {
  nickname?: string;
  emoji?: string;
  text?: string;
  ai?: string;
}): string {
  const { nickname, emoji, text, ai } = components;
  let result = '';
  if (nickname && emoji && text) {
    result = `${nickname}\n\n${emoji}\n${text}`;
  } else if (emoji && text) {
    result = `${emoji}\n${text}`;
  } else if (text) {
    result = text;
  }
  // ai 코멘트가 있으면 마지막 줄에 추가
  if (ai) {
    result += `\n${ai}`;
  }
  return result;
}

/**
 * 감정 분석 결과에서 표시 텍스트와 색상을 추출하는 함수
 */
export function extractEmotionData(
  text: string, 
  emotionAnalysis: string
): ParsedEmotionData {
  let displayText = text;
  let bubbleColor = 'rgba(255,255,255,1)'; // 기본값
  let selectedEmotion = '중립';
  let displayTextComponents: { nickname: string; emoji: string; text: string; ai?: string } | undefined;

  const parsedJson = parseEmotionAnalysis(emotionAnalysis);
  
  if (parsedJson) {
    if (parsedJson.data?.result?.selected_first_emotion) {
      selectedEmotion = parsedJson.data.result.selected_first_emotion;
    }
    
    if (selectedEmotion && emotionColorMap[selectedEmotion]) {
      bubbleColor = emotionColorMap[selectedEmotion];
    }

    // 새로운 display_text 구조 처리
    const nickname = parsedJson.data?.result?.display_text_nickname;
    const emoji = parsedJson.data?.result?.display_text_emoji;
    const displayTextText = parsedJson.data?.result?.display_text_text;
    const ai = parsedJson.data?.result?.display_text_ai;
    
    if (nickname || emoji || displayTextText || ai) {
      // 새로운 구조가 있는 경우
      displayTextComponents = {
        nickname: nickname || '',
        emoji: emoji || '',
        text: displayTextText || '',
        ai: ai || ''
      };
      displayText = buildDisplayText(displayTextComponents);
    } else if (parsedJson.data?.result?.display_text) {
      // 기존 구조 (하나의 문자열)가 있는 경우
      displayText = parsedJson.data.result.display_text;
    }
  }

  return {
    displayText,
    selectedEmotion,
    bubbleColor,
    displayTextComponents
  };
} 