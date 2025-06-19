import { useEffect, useRef, useState } from 'react';
import { WebcamStreamManager, WebcamCallbacks } from '../services/WebcamStreamManager';

export function useWebcam() {
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamManagerRef = useRef<WebcamStreamManager | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const webcamCallbacks: WebcamCallbacks = {
    onStreamReady: (stream: MediaStream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreamReady(true);
        setError(null);
      }
    },
    onError: (error: Error) => {
      setError(error.message);
      setIsStreamReady(false);
      alert(error.message);
    }
  };

  useEffect(() => {
    // 웹캠 스트림 매니저 초기화
    streamManagerRef.current = new WebcamStreamManager(webcamCallbacks);
    
    // 스트림 시작
    streamManagerRef.current.startStream();

    // 컴포넌트 언마운트 시 스트림 정리
    return () => {
      streamManagerRef.current?.stopStream();
      streamManagerRef.current = null;
    };
  }, []);

  return {
    videoRef,
    isStreamReady,
    error,
    streamManager: streamManagerRef.current
  };
} 