import React, { useEffect, useRef, useState } from 'react';
import { Container } from 'react-bootstrap';
import '../styles/StatusDisplay.css';

export type StatusType = 'idle' | 'ready' | 'processing' | 'creating';

interface StatusDisplayProps {
    status: StatusType;
    currentText?: string;
    analysisResult?: any;
    showLiveBubble?: boolean;
}

const BubbleAnimation: React.FC = () => {
    return (
        <div className="bubble-container">
            <div className="bubble">
                <div className="bubble-inner"></div>
            </div>
        </div>
    );
};

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

const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, currentText, analysisResult, showLiveBubble }) => {
    React.useEffect(() => {
        if (analysisResult !== undefined) {
            console.log('[StatusDisplay] analysisResult:', analysisResult);
        }
    }, [analysisResult]);

    const showBubble = status === 'creating' && !analysisResult;

    // --- 실시간 말풍선 애니메이션 상태 ---
    const [bubbleScale, setBubbleScale] = useState(1);
    const [bubbleOpacity, setBubbleOpacity] = useState(1);
    const [visible, setVisible] = useState(false); // 실제 DOM 렌더링 여부
    const animRef = useRef<number>();
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 애니메이션: showLiveBubble 변화 감지 (currentText는 의존성에서 제거)
    useEffect(() => {
        if (showLiveBubble) {
            setVisible(true);
            setBubbleOpacity(1);
        } else {
            setBubbleOpacity(0);
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = setTimeout(() => {
                setVisible(false);
            }, 300);
        }
    }, [showLiveBubble]);

    // scale 애니메이션 (pulse)
    useEffect(() => {
        if (showLiveBubble) {
            let t = 0;
            const animate = () => {
                setBubbleScale(0.80 + 1.0 * Math.abs(Math.sin(t)));
                t += 0.08;
                animRef.current = requestAnimationFrame(animate);
            };
            animRef.current = requestAnimationFrame(animate);
            return () => {
                if (animRef.current) cancelAnimationFrame(animRef.current);
            };
        } else {
            setBubbleScale(0.7);
            if (animRef.current) cancelAnimationFrame(animRef.current);
        }
    }, [showLiveBubble]);

    // 텍스트 길이에 따라 반지름 계산 (간단 버전)
    const minRadius = 48;
    const maxRadius = 100;
    const baseFontSize = 16;
    const padding = 10;
    const textLength = currentText ? currentText.length : 0;
    const estWidth = Math.min(maxRadius * 2, Math.max(minRadius * 2, textLength * baseFontSize * 0.6 + padding * 2));
    const radius = estWidth / 2 + padding;

    // 텍스트 컬러 동적 처리 (status 기준)
    const textColor = status === 'creating' ? '#fff' : '#888';
    const bubbleColor = status === 'creating' ? '#F6D097FF' : '#FFFFFFFF';

    return (
        <Container className="status-display">
            <div className="status-text">
                {getStatusMessage(status)}
            </div>
            {visible && (
                <div style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 32,
                }}>
                    <div style={{
                        position: 'relative',
                        width: radius * 2,
                        height: radius * 2,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        {/* 말풍선 배경 (scale+opacity 애니메이션 적용) */}
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                background: bubbleColor,
                                boxShadow: '0 10px 50px 0 rgba(0,0,0,0.80)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                transform: `scale(${bubbleScale})`,
                                opacity: bubbleOpacity,
                                transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s cubic-bezier(0.4,0,0.2,1), background-color 0.3s cubic-bezier(0.4,0,0.2,1)',
                                willChange: 'transform,opacity',
                                userSelect: 'none',
                                position: 'absolute',
                                left: 0, top: 0,
                            }}
                        />
                        {/* 텍스트 (scale 영향 없음) */}
                        <div
                            style={{
                                fontSize: baseFontSize,
                                fontWeight: 800,
                                color: textColor,
                                textAlign: 'center',
                                wordBreak: 'break-word',
                                lineHeight: 1.3,
                                padding: 10,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                height: '100%',
                                position: 'relative',
                                zIndex: 1,
                                pointerEvents: 'none',
                                opacity: bubbleOpacity,
                                transition: 'opacity 0.3s cubic-bezier(0.4,0,0.2,1)',
                                textShadow: '0 0 5px rgba(0,0,0,0.3)',
                            }}
                        >
                            {currentText}
                        </div>
                    </div>
                </div>
            )}
            {showBubble && <BubbleAnimation />}
        </Container>
    );
};

export default StatusDisplay; 