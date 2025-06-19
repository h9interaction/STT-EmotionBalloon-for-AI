import React, { forwardRef, useImperativeHandle } from "react";
import { useWebcam } from './hooks/useWebcam';
import { ImageCaptureService } from './services/ImageCaptureService';
import { ImageResizeConfig, IMAGE_CAPTURE_CONFIG } from './constants/webcamConfig';

export interface WebcamViewHandle {
    capture: () => string | null;
}

interface WebcamViewProps {
    captureConfig?: ImageResizeConfig;
}

const WebcamView = forwardRef<WebcamViewHandle, WebcamViewProps>((props, ref) => {
    const { captureConfig = IMAGE_CAPTURE_CONFIG } = props;
    const { videoRef, isStreamReady, error } = useWebcam();

    useImperativeHandle(ref, () => ({
        capture: () => {
            if (!videoRef.current || !isStreamReady) {
                console.warn("Webcam is not ready for capture");
                return null;
            }

            return ImageCaptureService.captureFromVideo(videoRef.current, captureConfig);
        }
    }));

    if (error) {
        return (
            <div className="webcam-view">
                <div className="webcam-error">
                    <p>웹캠 오류: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="webcam-view">
            <video 
                ref={videoRef}
                autoPlay
                playsInline
                muted // 자동 재생을 위해 muted 추가
            />
        </div>
    );
});

WebcamView.displayName = 'WebcamView';

export default WebcamView;