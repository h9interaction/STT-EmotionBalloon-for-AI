import { useEffect, useState } from 'react';

export function useFontLoader() {
  const [fontReady, setFontReady] = useState(false);

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

  return fontReady;
} 