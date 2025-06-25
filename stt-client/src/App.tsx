import React, { useState, useRef, useEffect } from "react";
import AudioToText from "./AudioToText";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import WebcamView, { WebcamViewHandle } from "./WebcamView";
import VisualizationCanvas from "./VisualizationCanvas";
import io from "socket.io-client";
import { StatusType } from './components/StatusDisplay';
import { SERVER_CONFIG } from './constants/audioConfig';
import { Socket } from 'socket.io-client';
import { LiveAPIClient } from "./services/LiveAPIClient";

const socket = io(SERVER_CONFIG.url);

const App: React.FC = () => {
  const [status, setStatus] = useState<StatusType>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [sttText, setSttText] = useState<string | null>(null);
  const webcamRef = useRef<WebcamViewHandle>(null);
  const [showAudioToText, setShowAudioToText] = useState(true);
  const liveApiClientRef = useRef<LiveAPIClient | null>(null);

  const handleStart = () => {
    setIsRecording(true);
    // 서버 연결 전까지는 idle 상태 유지
    // setStatus('ready'); // 이 줄을 제거
  };

  const handleStop = () => {
    setIsRecording(false);
    setStatus('idle');
    setCurrentText('');
  };

  const handleAudioText = (text: string) => {
    setCurrentText(text);
    // 텍스트가 있을 때만 processing 상태로, 없을 때는 현재 상태 유지
    if (text) {
      setStatus('processing');
    }
    // 텍스트가 없을 때는 상태를 변경하지 않음 (서버 연결 전까지는 idle 유지)
  };

  const handleFinalSTT = (text: string) => {
    setStatus('creating');
    const base64 = webcamRef.current?.capture();
    if (!base64) return;

    setCapturedImage(base64);
    setSttText(text);

    // 소켓을 통해 텍스트와 이미지 전송
    socket.emit("stt_text", text);
    socket.emit("webcam_image", base64);
  };

  // 소켓 이벤트 리스너 설정
  useEffect(() => {
    socket.on("emotion_analysis_result", (result) => {
      console.log("감정 분석 결과 수신:", result);
      setStatus('ready');
      setAnalysisResult(result);
      setCapturedImage(null);
      setSttText(null);
    });

    return () => {
      socket.off("emotion_analysis_result");
    };
  }, []);

  useEffect(() => {
    liveApiClientRef.current = new LiveAPIClient((result) => {
      setAnalysisResult(result);
    });
    liveApiClientRef.current.connect();
    return () => {
      liveApiClientRef.current?.disconnect();
    };
  }, []);

  // useEffect(() => {
  //   const handleKeyDown = (event: KeyboardEvent) => {
  //     if (event.code === 'Backspace') {
  //       setShowAudioToText(prev => !prev);
  //     }
  //   };
  //   window.addEventListener('keydown', handleKeyDown);
  //   return () => window.removeEventListener('keydown', handleKeyDown);
  // }, []);

  // 최종 버블 생성 시 호출될 콜백
  const handleBubbleCreated = () => {
    // showLiveBubble 상태/로직 제거
    console.log("handleBubbleCreated");
  };

  // 감정 분석 버튼 클릭 시 웹캠에서 즉시 캡처
  const handleTestAnalyze = () => {
    if (!currentText.trim()) {
      setAnalysisResult(null);
      return;
    }
    const base64 = webcamRef.current?.capture();
    if (!base64) {
      setAnalysisResult(null);
      return;
    }
    setCapturedImage(base64);
    setSttText(currentText);
  };

  // 서버 연결 성공 시 호출될 콜백 추가
  const handleConnectionSuccess = () => {
    setStatus('ready');
  };

  const handleStatusChange = (newStatus: StatusType) => {
    setStatus(newStatus);
  };

  // 테스트용 실시간 분석 요청 함수
  const handleAnalyze = (text: string) => {
    liveApiClientRef.current?.send({
      contents: [
        { parts: [{ text }] }
      ]
    });
  };

  return (
    <>
      <VisualizationCanvas analysisResult={analysisResult} onBubbleCreated={handleBubbleCreated} />
      <Container className="py-5">
        {/* <h3 className="text-center mb-4">STT client app</h3> */}
        <div style={{ opacity: showAudioToText ? 1 : 0, transition: 'opacity 0.3s' }}>
          <WebcamView ref={webcamRef} />
          <AudioToText
            isRecording={isRecording}
            status={status}
            currentText={currentText}
            analysisResult={analysisResult}
            webcamRef={webcamRef}
            socket={socket}
            onStart={handleStart}
            onStop={handleStop}
            onAudioText={handleAudioText}
            onFinalSTT={handleFinalSTT}
            onBubbleCreated={handleBubbleCreated}
            onConnectionSuccess={handleConnectionSuccess}
            onStatusChange={handleStatusChange}
          />
        </div>
        <Card className="mt-5 stt-container-old">
          <Card.Header as="h5">감정 분석 테스트</Card.Header>
          <Card.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>분석할 텍스트</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={currentText}
                  onChange={(e) => setCurrentText(e.target.value)}
                  placeholder="감정 분석할 텍스트를 입력하세요..."
                />
              </Form.Group>
              <Button
                variant="primary"
                onClick={handleTestAnalyze}
                disabled={isRecording}
              >
                {isRecording ? "분석 중..." : "감정 분석"}
              </Button>
            </Form>
            {capturedImage && (
              <div className="mt-3">
                <img src={capturedImage} alt="캡처 이미지" style={{ maxWidth: 240, borderRadius: 8, border: "1px solid #ccc" }} />
              </div>
            )}
            {!currentText.trim() && (
              <div className="mt-3 text-danger">텍스트를 입력해주세요.</div>
            )}
            {!capturedImage && currentText.trim() && (
              <div className="mt-3 text-danger">웹캠 이미지를 캡처할 수 없습니다.</div>
            )}
            {analysisResult && (
              <div className="mt-3 p-3 bg-light rounded">
                <h6>분석 결과:</h6>
                <p className="mb-0">{analysisResult.emotionAnalysis}</p>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
      <button onClick={() => handleAnalyze("안녕하세요, 실시간 테스트입니다.")}
        style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
        실시간 분석 테스트
      </button>
    </>
  );
}

export default App;
