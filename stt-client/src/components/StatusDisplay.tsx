import React from 'react';
import { Container } from 'react-bootstrap';
import '../styles/StatusDisplay.css';

export type StatusType = 'idle' | 'ready' | 'processing' | 'creating';

interface StatusDisplayProps {
    status: StatusType;
    currentText?: string;
    analysisResult?: any;
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
            return '말풍선 생성 중...';
        default:
            return '';
    }
};

const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, currentText, analysisResult }) => {
    React.useEffect(() => {
        if (analysisResult !== undefined) {
            console.log('[StatusDisplay] analysisResult:', analysisResult);
        }
    }, [analysisResult]);

    const showBubble = status === 'creating' && !analysisResult;

    return (
        <Container className="status-display">
            <div className="status-text">
                {getStatusMessage(status)}
            </div>
            {status === 'processing' && currentText && (
                <div className="current-text">
                    {currentText}
                </div>
            )}
            {showBubble && <BubbleAnimation />}
        </Container>
    );
};

export default StatusDisplay; 