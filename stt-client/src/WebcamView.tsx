import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";

export interface WebcamViewHandle {
    capture: () => string | null;
}

// 이미지 크기 조절을 위한 설정 인터페이스
interface ImageCaptureConfig {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;  // 0.0 ~ 1.0
}

const WebcamView = forwardRef<WebcamViewHandle>((props, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    // 기본 이미지 캡처 설정
    const defaultConfig: ImageCaptureConfig = {
        maxWidth: 640 / 4,    // 최대 너비
        maxHeight: 480 / 4,   // 최대 높이
        quality: 0.5      // JPEG 품질 (70%)
    };

    // 이미지 크기 조절 함수
    const resizeImage = (canvas: HTMLCanvasElement, config: ImageCaptureConfig = defaultConfig) => {
        const { maxWidth, maxHeight, quality } = config;
        const originalWidth = canvas.width;
        const originalHeight = canvas.height;

        // 새로운 크기 계산
        let newWidth = originalWidth;
        let newHeight = originalHeight;

        if (maxWidth && originalWidth > maxWidth) {
            newWidth = maxWidth;
            newHeight = (originalHeight * maxWidth) / originalWidth;
        }

        if (maxHeight && newHeight > maxHeight) {
            newHeight = maxHeight;
            newWidth = (newWidth * maxHeight) / newHeight;
        }

        // 크기가 변경된 경우에만 리사이즈
        if (newWidth !== originalWidth || newHeight !== originalHeight) {
            const resizedCanvas = document.createElement('canvas');
            resizedCanvas.width = newWidth;
            resizedCanvas.height = newHeight;
            const ctx = resizedCanvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(canvas, 0, 0, newWidth, newHeight);
                return resizedCanvas;
            }
        }

        return canvas;
    };

    useImperativeHandle(ref, () => ({
        capture: () => {
            const video = videoRef.current;
            if (!video) return null;

            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");

            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                // 이미지 크기 조절 적용
                const resizedCanvas = resizeImage(canvas);

                // JPEG 품질 적용하여 Base64 변환
                const base64 = resizedCanvas.toDataURL("image/jpeg", defaultConfig.quality);

                console.log('Image size info:', {
                    originalWidth: canvas.width,
                    originalHeight: canvas.height,
                    resizedWidth: resizedCanvas.width,
                    resizedHeight: resizedCanvas.height,
                    base64Length: base64.length,
                    estimatedSizeKB: Math.round(base64.length * 0.75 / 1024),
                    quality: defaultConfig.quality
                });

                return base64;
            }
            return null;
        }
    }));

    useEffect(() => {
        // 웹캠 스트림 요청
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch((err) => {
                alert("웹캠 접근이 거부되었습니다: " + err.message);
            });

        // 컴포넌트 언마운트 시 스트림 정리
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div className="webcam-view">
            <video 
                ref={videoRef}
                autoPlay
                playsInline
            />
        </div>
    );
});

export default WebcamView;