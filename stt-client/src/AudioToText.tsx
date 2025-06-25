/* eslint-disable react-hooks/exhaustive-deps */
import { default as React, useEffect, useState, useRef } from "react";
import { Button } from "react-bootstrap";
import Container from "react-bootstrap/Container";
import StatusDisplay, { StatusType, LiveBubbleItem } from './components/StatusDisplay';
import { AudioStreamManager, AudioStreamCallbacks } from './services/AudioStreamManager';
import { SocketManager, SocketCallbacks } from './services/SocketManager';
import { useRestartManager } from './hooks/useRestartManager';
import { nanoid } from 'nanoid';
import { WebcamViewHandle } from './WebcamView';
import { Socket } from 'socket.io-client';

// 필요한 타입들을 정의합니다.
interface RecognitionResult {
  stt: string;
  analysis: any;
}

interface AudioToTextProps {
  isRecording: boolean;
  status: StatusType;
  currentText: string;
  analysisResult?: any;
  webcamRef?: React.RefObject<WebcamViewHandle>;
  socket?: Socket;
  onStart: () => void;
  onStop: () => void;
  onAudioText: (text: string) => void;
  onFinalSTT: (text: string) => void;
  onBubbleCreated?: () => void;
  onConnectionSuccess?: () => void;
  onStatusChange?: (status: StatusType) => void;
}

const AudioToText: React.FC<AudioToTextProps> = ({
  isRecording, status, currentText, analysisResult, webcamRef, socket,
  onStart, onStop, onAudioText, onFinalSTT, onBubbleCreated, onConnectionSuccess, onStatusChange
}) => {
  const [recognitionHistory, setRecognitionHistory] = useState<string[]>([]);
  const [currentRecognition, setCurrentRecognition] = useState<string>();

  const [liveBubbles, setLiveBubbles] = useState<LiveBubbleItem[]>([]);
  const prevStatusRef = useRef<StatusType>();

  const audioStreamManagerRef = useRef<AudioStreamManager | null>(null);
  const socketManagerRef = useRef<SocketManager | null>(null);

  const restartManager = useRestartManager({
    onRestart: () => connect(),
    onMaxAttemptsReached: () => {
      alert("음성 인식 연결에 문제가 발생했습니다. 수동으로 재시작해주세요.");
      disconnect();
    }
  });

  useEffect(() => {
    if (prevStatusRef.current !== 'processing' && status === 'processing') {
      const newBubble = { id: nanoid(), text: '...' };
      setLiveBubbles(prev => [...prev, newBubble]);
    } else if (status === 'processing' && liveBubbles.length > 0) {
      setLiveBubbles(prev => {
        const updatedBubbles = [...prev];
        const lastBubble = updatedBubbles[updatedBubbles.length - 1];
        if (lastBubble && lastBubble.text !== currentText) {
          updatedBubbles[updatedBubbles.length - 1] = { ...lastBubble, text: currentText };
          return updatedBubbles;
        }
        return prev;
      });
    }

    prevStatusRef.current = status;
  }, [status, currentText]);

  useEffect(() => {
    if (analysisResult) {
      setLiveBubbles([]);
    }
  }, [analysisResult]);

  // isRecording이 true로 변경될 때 연결 시작
  useEffect(() => {
    if (isRecording) {
      connect();
    }
  }, [isRecording]);

  const connect = () => {
    const socketCallbacks: SocketCallbacks = {
      onConnect: () => {
        console.log("Socket connected.");
        if (onConnectionSuccess) {
          onConnectionSuccess();
        }
      },
      onDisconnect: () => {
        console.log("Socket disconnected.");
        onStop();
      },
      onAudioText: (text: string) => onAudioText(text),
      onFinalSTT: (text: string) => {
        if (text.trim()) {
          setRecognitionHistory((old) => [text, ...old]);
          onFinalSTT(text);
        }
      },
      onStreamError: (error: string) => {
        restartManager.handleStreamError(error);
      },
      onConnectionError: (error: Error) => {
        restartManager.handleConnectionError();
      }
    };

    const socket = new SocketManager(socketCallbacks);
    socket.connect();
    socketManagerRef.current = socket;

    const audioCallbacks: AudioStreamCallbacks = {
      onAudioData: (chunk: Uint8Array) => {
        if (socketManagerRef.current?.isConnected()) {
          socketManagerRef.current.sendAudioData(chunk);
        }
      },
      onError: (error) => {
        console.error("Audio stream error:", error);
        restartManager.handleStreamError(error.message);
      }
    };

    const audioStreamManager = new AudioStreamManager(audioCallbacks);
    audioStreamManager.startStream();
    audioStreamManagerRef.current = audioStreamManager;

    onStart();
    restartManager.resetErrorState();
  };

  const disconnect = () => {
    try {
      if (audioStreamManagerRef.current) {
        audioStreamManagerRef.current.stopStream();
        audioStreamManagerRef.current = null;
      }
      if (socketManagerRef.current) {
        socketManagerRef.current.disconnect();
        socketManagerRef.current = null;
      }
      onStop();
      restartManager.resetErrorState();
    } catch (error) {
      console.error("Error during disconnect:", error);
    }
  };

  const startRecording = () => {
    // connect(); // 이 줄을 제거 - handleStart에서 이미 isRecording을 true로 설정함
  };

  const stopRecording = () => {
    disconnect();
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const handleRestart = () => {
    disconnect();
    setTimeout(() => {
      connect();
    }, 100);
  };

  const handleStatusChange = (newStatus: StatusType) => {
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  };

  // 입력 텍스트 처리 함수
  const handleInputText = (text: string) => {
    // 입력 텍스트로 바로 LiveBubble 생성
    const newBubble = { id: nanoid(), text: text };
    setLiveBubbles(prev => [...prev, newBubble]);
  };

  // SocketManager에서 소켓 인스턴스를 가져오는 함수
  const getSocket = (): Socket | undefined => {
    return socketManagerRef.current?.getSocket() || undefined;
  };

  return (
    <Container fluid className="p-0">
      {!isRecording && (
        <div className="btn-recording-container">
          <Button
            className="btn-outline-light btn-recording"
            onClick={connect}
          >
            Start
          </Button>
        </div>
      )}
      <StatusDisplay
        status={status}
        liveBubbles={liveBubbles}
        webcamRef={webcamRef}
        onStatusChange={handleStatusChange}
        onInputText={handleInputText}
        socket={socket || getSocket()}
      />
    </Container>
  );
};

export default AudioToText;
