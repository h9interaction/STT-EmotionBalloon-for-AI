import React from 'react';
import { emotionColorMap } from '../constants/emotionConfig';

// 텍스트 길이에 따라 간단한 레이아웃 정보를 반환하는 함수
const getSimpleLayout = (text: string) => {
  const length = text.length;
  let radius = 60;
  let fontSize = 24;

  if (length > 30) {
    radius = 120;
    fontSize = 20;
  } else if (length > 15) {
    radius = 100;
    fontSize = 22;
  } else if (length > 5) {
    radius = 80;
    fontSize = 24;
  }
  
  return { radius, fontSize };
};

interface LiveBubbleProps {
  text: string;
  fadeOut?: boolean;
}

const LiveBubble: React.FC<LiveBubbleProps> = ({ text, fadeOut = false }) => {
  const { radius, fontSize: baseFontSize } = getSimpleLayout(text);
  // '기쁨'에 해당하는 색상을 찾고, 없으면 기본 흰색 사용
  const bubbleColor = emotionColorMap['기쁨'] || '#FFFFFF';
  const textColor = '#000000'; // 가독성을 위해 텍스트 색상 변경

  return (
    <>
      <style>
        {`
          @keyframes breathing {
            0% { transform: scale(1.1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1.1); }
          }
        `}
      </style>
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 16,
      }}>
        <div style={{
          position: 'relative',
          width: radius * 2,
          height: radius * 2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <div
            className={fadeOut ? 'fade-out' : ''}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: bubbleColor,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              willChange: 'transform, opacity, width, height',
              userSelect: 'none',
              animation: 'breathing 1s ease-in-out infinite',
            }}
          />
          <div
            className={fadeOut ? 'fade-out' : ''}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: baseFontSize,
              fontWeight: 600,
              color: textColor,
              textAlign: 'center',
              wordBreak: 'keep-all',
              lineHeight: 1.4,
              padding: '20px',
              boxSizing: 'border-box',
              textShadow: '0 0 5px rgba(255,255,255,0.7)',
              pointerEvents: 'none',
            }}
          >
            {text}
          </div>
        </div>
      </div>
    </>
  );
};

export default LiveBubble; 