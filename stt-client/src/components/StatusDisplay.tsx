import React, { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import '../styles/StatusDisplay.css';
import LiveBubble from './LiveBubble';

// 간단한 로딩 애니메이션 컴포넌트
const LoadingAnimation: React.FC = () => {
    return (
        <div className="bubble-loader">
            <span></span>
            <span></span>
            <span></span>
        </div>
    );
};

export type StatusType = 'idle' | 'ready' | 'processing' | 'creating';

const getStatusMessage = (status: StatusType) => {
    switch (status) {
        case 'idle':
            return '대기중...';
        case 'ready':
            return '음성인식 대기 중...';
        case 'processing':
            return '음성 처리 중...';
        case 'creating':
            return '감정 분석 중...';
        default:
            return '';
    }
};

// props 타입에서 currentText 대신 liveBubbles 배열을 받도록 수정합니다.
export interface LiveBubbleItem {
    id: string;
    text: string;
}

interface StatusDisplayProps {
    status: StatusType;
    liveBubbles: LiveBubbleItem[];
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, liveBubbles }) => {
    const [fadeOutBubbles, setFadeOutBubbles] = useState<Set<string>>(new Set());
    const [visibleBubbles, setVisibleBubbles] = useState<LiveBubbleItem[]>(liveBubbles);

    // liveBubbles가 변경될 때 처리
    useEffect(() => {
        if (liveBubbles.length === 0 && visibleBubbles.length > 0) {
            // 모든 말풍선을 맨 위부터 순차적으로 사라지게 함
            visibleBubbles.forEach((bubble, index) => {
                setTimeout(() => {
                    setFadeOutBubbles(prev => new Set(Array.from(prev).concat(bubble.id)));
                }, index * 200); // 200ms 간격으로 순차적 애니메이션
            });

            // 모든 애니메이션 완료 후 실제 제거 (0.3초 애니메이션 + 100ms 여유)
            setTimeout(() => {
                setVisibleBubbles([]);
                setFadeOutBubbles(new Set());
            }, visibleBubbles.length * 200 + 400); // 애니메이션 시간 + 추가 대기 시간
        } else if (liveBubbles.length > visibleBubbles.length) {
            // 새로운 말풍선이 추가될 때
            setVisibleBubbles(liveBubbles);
        } else if (liveBubbles.length === visibleBubbles.length && liveBubbles.length > 0) {
            // 텍스트 업데이트만 있을 때
            setVisibleBubbles(liveBubbles);
        }
    }, [liveBubbles, visibleBubbles.length]);

    return (
        <Container className="status-display">
            {/* 여러 개의 말풍선을 위로 쌓아 올리는 컨테이너 */}
            <div className="live-bubble-container">
                {visibleBubbles.map((bubble) => (
                    <LiveBubble 
                        key={bubble.id} 
                        text={bubble.text} 
                        fadeOut={fadeOutBubbles.has(bubble.id)}
                    />
                ))}
            </div>

            {/* 하단에 고정된 상태 메시지 */}
            <div className="status-text" style={{ 
                visibility: visibleBubbles.length > 0 ? 'hidden' : 'visible' 
            }}>
                {getStatusMessage(status)}
            </div>

            {status === 'creating' && <LoadingAnimation />}
        </Container>
    );
};

export default StatusDisplay; 