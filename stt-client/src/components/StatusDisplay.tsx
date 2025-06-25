import React, { useState, useEffect, useRef } from 'react';
import { Container } from 'react-bootstrap';
import '../styles/StatusDisplay.css';
import LiveBubble from './LiveBubble';
import { WebcamViewHandle } from '../WebcamView';
import { Socket } from 'socket.io-client';

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
            return '🎤\n대기중\n...';
        case 'ready':
            return '🎤\n음성인식\n대기 중\n...';
        case 'processing':
            return '🖥️\n음성 처리 중\n...';
        case 'creating':
            return '😀\n감정 분석 중\n...';
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
    webcamRef?: React.RefObject<WebcamViewHandle>;
    onStatusChange?: (status: StatusType) => void;
    onInputText?: (text: string) => void;
    socket?: Socket;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({
    status,
    liveBubbles,
    webcamRef,
    onStatusChange,
    onInputText,
    socket
}) => {
    const [fadeOutBubbles, setFadeOutBubbles] = useState<Set<string>>(new Set());
    const [visibleBubbles, setVisibleBubbles] = useState<LiveBubbleItem[]>(liveBubbles);
    const [inputText, setInputText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

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

    // status가 ready로 변경될 때 isSubmitting 리셋
    useEffect(() => {
        if (status === 'ready') {
            setIsSubmitting(false);
        }
    }, [status]);

    // 입력 필드에 자동 포커스 설정
    useEffect(() => {
        if (inputRef.current && status === 'ready' && !isSubmitting) {
            inputRef.current.focus();
        }
    }, [status, isSubmitting]);

    // 컴포넌트 마운트 시 포커스 설정
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const handleSubmit = async () => {
        if (!inputText.trim() || isSubmitting || !socket) return;

        setIsSubmitting(true);

        // 웹캠에서 이미지 캡처
        const capturedImage = webcamRef?.current?.capture();

        if (!capturedImage) {
            console.warn("웹캠 이미지를 캡처할 수 없습니다.");
            setIsSubmitting(false);
            return;
        }

        // 상태를 creating으로 변경
        if (onStatusChange) {
            onStatusChange('creating');
        }

        try {
            // 서버로 텍스트와 이미지 전송
            socket.emit("stt_text", inputText.trim());
            socket.emit("webcam_image", capturedImage);

            // 입력 필드 초기화
            setInputText('');

            // 입력 텍스트 콜백 호출
            if (onInputText) {
                onInputText(inputText.trim());
            }
        } catch (error) {
            console.error("전송 중 오류 발생:", error);
            setIsSubmitting(false);
            if (onStatusChange) {
                onStatusChange('ready');
            }
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

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
                visibility: visibleBubbles.length > 0 ? 'visible' : 'visible'
            }}>
                {getStatusMessage(status)}
            </div>
            <div className="status-processing">
                {(status === 'creating' || isSubmitting) && <LoadingAnimation />}
            </div>
            <div className="status-text-input">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="입력하세요"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isSubmitting}
                />
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !inputText.trim() || !socket}
                >
                    {isSubmitting ? '전송 중...' : '감정분석'}
                </button>
            </div>

        </Container>
    );
};

export default StatusDisplay; 