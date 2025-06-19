/* eslint-disable react-hooks/exhaustive-deps */
import { default as React, useEffect, useState, useRef } from "react";
import { Button } from "react-bootstrap";
import Container from "react-bootstrap/Container";
import StatusDisplay, { StatusType } from './components/StatusDisplay';
import { AudioStreamManager } from './services/AudioStreamManager';
import { SocketManager } from './services/SocketManager';
import { useRestartManager } from './hooks/useRestartManager';

interface AudioToTextProps {
  isRecording: boolean;
  status: StatusType;
  currentText: string;
  analysisResult?: any;
  onStart: () => void;
  onStop: () => void;
  onAudioText: (text: string) => void;
  onFinalSTT: (text: string) => void;
  onBubbleCreated?: () => void;
}

const AudioToText: React.FC<AudioToTextProps> = ({
  isRecording, status, currentText, analysisResult,
  onStart, onStop, onAudioText, onFinalSTT, onBubbleCreated
}) => {
  const [recognitionHistory, setRecognitionHistory] = useState<string[]>([]);
  const [currentRecognition, setCurrentRecognition] = useState<string>();
  const [showLiveBubble, setShowLiveBubble] = useState(false);
  
  const audioStreamManagerRef = useRef<AudioStreamManager | null>(null);
  const socketManagerRef = useRef<SocketManager | null>(null);

  // 재시작 관리 훅
  const restartManager = useRestartManager({
    onRestart: () => {
      connect();
    },
    onMaxAttemptsReached: () => {
      alert("음성 인식 연결에 문제가 발생했습니다. 수동으로 재시작해주세요.");
      disconnect();
    }
  });

  // 오디오 스트림 콜백
  const audioStreamCallbacks = {
    onAudioData: (chunk: Uint8Array) => {
      if (socketManagerRef.current) {
        socketManagerRef.current.sendAudioData(chunk);
      }
    },
    onError: (error: Error) => {
      console.error("Audio stream error:", error);
      disconnect();
    }
  };

  // 소켓 콜백
  const socketCallbacks = {
    onConnect: () => {
      console.log("Socket connected");
    },
    onDisconnect: () => {
      console.log("Socket disconnected");
      onStop();
    },
    onAudioText: (text: string) => {
      setCurrentRecognition(text);
      onAudioText(text);
    },
    onFinalSTT: (text: string) => {
      if (text.trim()) {
        setRecognitionHistory((old) => [text, ...old]);
        onFinalSTT(text);
        // onAudioText('');
      }
    },
    onStreamError: (error: string) => {
      restartManager.handleStreamError(error);
    },
    onConnectionError: (error: Error) => {
      restartManager.handleConnectionError();
    },
    onBubbleCreated: () => {
      setShowLiveBubble(false);
      onAudioText('');
      console.log("onBubbleCreated");
      // if (onBubbleCreated) onBubbleCreated();
    }
  };

  // 연결 함수
  const connect = async () => {
    try {
      // 소켓 매니저 초기화 및 연결
      socketManagerRef.current = new SocketManager(socketCallbacks);
      socketManagerRef.current.connect();

      // 오디오 스트림 매니저 초기화
      audioStreamManagerRef.current = new AudioStreamManager(audioStreamCallbacks);
      await audioStreamManagerRef.current.startStream();

      onStart();
      restartManager.resetErrorState();

    } catch (error) {
      console.error("Error connecting:", error);
      disconnect();
    }
  };

  // 연결 해제 함수
  const disconnect = () => {
    try {
      audioStreamManagerRef.current?.stopStream();
      socketManagerRef.current?.disconnect();
      
      audioStreamManagerRef.current = null;
      socketManagerRef.current = null;

      onStop();
      onAudioText(''); // 실시간 텍스트 초기화
      restartManager.resetErrorState();

    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // 현재 텍스트가 변경될 때 소켓 매니저에 전달
  useEffect(() => {
    if (socketManagerRef.current) {
      socketManagerRef.current.setPrevText(currentText);
    }
  }, [currentText]);

  // 인식 히스토리 로깅
  useEffect(() => {
    console.log("\n\nrecognitionHistory", recognitionHistory);
  }, [recognitionHistory]);

  // status가 processing으로 바뀔 때 최초 1회만 showLiveBubble true
  useEffect(() => {
    if (status === 'processing') setShowLiveBubble(true);
  }, [status]);

  // analysisResult가 바뀌는 순간(최종 버블 생성 타이밍)에 실시간 버블 숨김
  useEffect(() => {
    if (analysisResult) {
      setShowLiveBubble(false);
    }
  }, [analysisResult]);

  return (
    <Container className="stt-container">
      <StatusDisplay
        status={status}
        currentText={currentText}
        analysisResult={analysisResult}
        showLiveBubble={showLiveBubble}
      />
      {/* 녹음 중이 아닐 때만 Start 버튼 보이기 */}
      {!isRecording && (
        <Button
          className="btn-outline-light btn-recording"
          onClick={connect}
        >
          Start
        </Button>
      )}
      {/* 녹음 중일 때는 버튼 숨김 (Stop 버튼 미노출) */}
    </Container>
  );
};

export default AudioToText;
