/**
 * 텍스트 중복 제거 함수
 * 이전 텍스트와 새로운 텍스트 간의 중복 부분을 제거합니다.
 */
export function removeDuplicateText(prevText: string, newText: string): string {
  for (let i = Math.min(prevText.length, newText.length); i > 0; i--) {
    if (prevText.slice(-i) === newText.slice(0, i)) {
      return newText.slice(i);
    }
  }
  return newText;
}

/**
 * 텍스트 병합 함수
 * 이전 텍스트와 새로운 텍스트를 중복을 제거하여 병합합니다.
 */
export function mergeTexts(prevText: string, newText: string): string {
  if (!prevText) return newText;
  if (!newText) return prevText;
  
  const uniquePart = removeDuplicateText(prevText, newText);
  return prevText + uniquePart;
}

/**
 * 텍스트 정규화 함수
 * 텍스트의 앞뒤 공백을 제거하고 빈 문자열인지 확인합니다.
 */
export function normalizeText(text: string): string {
  return text.trim();
}

/**
 * 텍스트가 유효한지 확인하는 함수
 */
export function isValidText(text: string): boolean {
  return normalizeText(text).length > 0;
} 