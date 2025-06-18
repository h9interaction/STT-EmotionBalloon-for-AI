/* eslint-disable react-hooks/exhaustive-deps */
import { default as React, useEffect, useState, useRef } from "react";
import { Button } from "react-bootstrap";
import Container from "react-bootstrap/Container";
import * as io from "socket.io-client";
import StatusDisplay, { StatusType } from './components/StatusDisplay';

const sampleRate = 16000;
const MAX_RESTART_ATTEMPTS = 3;
const BUFFER_SECONDS = 3;
const SAMPLE_RATE = 16000;
const BYTES_PER_SAMPLE = 2;
const BUFFER_SIZE = BUFFER_SECONDS * SAMPLE_RATE * BYTES_PER_SAMPLE;
const STT_SESSION_LIMIT = 295000; // 4분 55초 (ms)
// let isSpeaking = false;

const getMediaStream = () =>
  navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: "default",
      sampleRate: sampleRate,
      sampleSize: 16,
      channelCount: 1,
    },
    video: false,
  });

interface WordRecognized {
  isFinal: boolean;
  text: string;
}

interface AudioToTextProps {
  isRecording: boolean;
  status: StatusType;
  currentText: string;
  analysisResult?: any;
  onStart: () => void;
  onStop: () => void;
  onAudioText: (text: string) => void;
  onFinalSTT: (text: string) => void;
}

const AudioToText: React.FC<AudioToTextProps> = ({
  isRecording, status, currentText, analysisResult,
  onStart, onStop, onAudioText, onFinalSTT
}) => {
  const [connection, setConnection] = useState<io.Socket>();
  const [currentRecognition, setCurrentRecognition] = useState<string>();
  const [recognitionHistory, setRecognitionHistory] = useState<string[]>([]);
  const [recorder, setRecorder] = useState<any>();
  const [isStreamError, setIsStreamError] = useState<boolean>(false);
  const [restartAttempts, setRestartAttempts] = useState<number>(0);
  const processorRef = useRef<any>();
  const audioContextRef = useRef<any>();
  const audioInputRef = useRef<any>();
  const audioBufferRef = useRef<Uint8Array>(new Uint8Array(BUFFER_SIZE));
  const bufferOffsetRef = useRef<number>(0);
  const sttTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingRef = useRef(false);
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevSTTRef = useRef<string | null>(null);
  const currentSTTRef = useRef<string>('');
  const prevTextRef = useRef<string>(''); // 이전 세션의 실시간 텍스트 저장

  // 중복 텍스트 제거 함수
  function removeDuplicateText(prevText: string, newText: string) {
    for (let i = Math.min(prevText.length, newText.length); i > 0; i--) {
      if (prevText.slice(-i) === newText.slice(0, i)) {
        return newText.slice(i);
      }
    }
    return newText;
  }

  const lastFinalSTTTimeRef = useRef<number>(0);

  const speechRecognized = (data: WordRecognized) => {
    if (data.isFinal) {
      let finalText = data.text;
      if (recognitionHistory.length > 0) {
        finalText = removeDuplicateText(recognitionHistory[0], finalText);
      }
      setCurrentRecognition("...");
      if (finalText.trim()) {
        setRecognitionHistory((old) => [finalText, ...old]);
        // Debounce: 1초 이내 중복 호출 방지
        const now = Date.now();
        if (now - lastFinalSTTTimeRef.current > 1000) {
          if (onFinalSTT) {
            onFinalSTT(finalText);
          }
          lastFinalSTTTimeRef.current = now;
        }
      }
    } else setCurrentRecognition(data.text + "...");
  };

  useEffect(() => {
    console.log("\n\nrecognitionHistory", recognitionHistory);
  }, [recognitionHistory]);

  const connect = () => {
    if (connection) {
      disconnect();
    }
    const socket = io.connect("http://localhost:8081");

    socket.on("connect", () => {
      setConnection(socket);
      socket.emit("startGoogleCloudStream");
      startSTTSession(socket);
    });

    socket.on("receive_audio_text", (data) => {
      isSpeakingRef.current = true;
      if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);

      if (data.isFinal) {
        currentSTTRef.current += (currentSTTRef.current ? ' ' : '') + data.text;
      } else {
        const newText = prevTextRef.current ?
          prevTextRef.current + ' ' + data.text :
          data.text;
          onAudioText(newText);
      }

      speakingTimeoutRef.current = setTimeout(() => {
        isSpeakingRef.current = false;
        if (currentSTTRef.current.trim()) {
          let merged = currentSTTRef.current;
          if (prevSTTRef.current) {
            merged = removeDuplicateText(prevSTTRef.current, merged);
            merged = prevSTTRef.current + merged;
          }
          if (onFinalSTT) {
            // 말풍선 생성 시작
            onFinalSTT(merged);
            // 상태 변경은 App.tsx에서 감정 분석 결과 수신 시 처리
          }
          prevSTTRef.current = null;
          currentSTTRef.current = '';
        }
      }, 1000);
    });

    socket.on("stream_error", (data) => {
      console.log("Stream error received:", data);
      if (data.error?.includes("Exceeded maximum allowed stream duration")) {
        setIsStreamError(true);
        setRestartAttempts(prev => prev + 1);
      }
    });

    socket.on("disconnect", () => {
      console.log("disconnected", socket.id);
      setConnection(undefined);
      onStop();
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setIsStreamError(true);
      setRestartAttempts(prev => prev + 1);
    });
  };

  const disconnect = () => {
    if (connection) {
      try {
        connection.emit("endGoogleCloudStream");
        connection.disconnect();
      } catch (e) {
        console.error("Error disconnecting:", e);
      }
      setConnection(undefined);
      onStop();
    }

    try {
      processorRef.current?.disconnect();
      audioInputRef.current?.disconnect();
      if (audioContextRef.current?.state !== "closed") {
        audioContextRef.current?.close();
      }
    } catch (e) {
      console.error("Error cleaning up audio resources:", e);
    }

    setRecorder(undefined);
    setIsStreamError(false);
    setRestartAttempts(0);
    onAudioText(''); // 실시간 텍스트 초기화
    prevTextRef.current = ''; // 이전 텍스트도 초기화

    if (sttTimerRef.current) {
      clearTimeout(sttTimerRef.current);
    }
    onStop();
  };

  useEffect(() => {
    if (isStreamError && restartAttempts < MAX_RESTART_ATTEMPTS) {
      console.log(`Attempting restart (${restartAttempts}/${MAX_RESTART_ATTEMPTS})`);
      disconnect();
      const timer = setTimeout(() => {
        connect();
        setIsStreamError(false);
      }, 2000); // 재연결 시도 간격을 2초로 늘림
      return () => clearTimeout(timer);
    } else if (isStreamError && restartAttempts >= MAX_RESTART_ATTEMPTS) {
      console.error("Maximum restart attempts reached");
      alert("음성 인식 연결에 문제가 발생했습니다. 수동으로 재시작해주세요.");
      disconnect(); // 최대 시도 횟수 초과 시 모든 리소스 정리
    }
  }, [isStreamError, restartAttempts]);

  useEffect(() => {
    let isActive = true; // 컴포넌트 마운트 상태 추적

    const setupAudio = async () => {
      if (!connection || isRecording) return;

      try {
        const stream = await getMediaStream();
        if (!isActive) return; // 컴포넌트가 언마운트된 경우 중단

        audioContextRef.current = new window.AudioContext();
        await audioContextRef.current.audioWorklet.addModule(
          "/src/worklets/recorderWorkletProcessor.js"
        );

        if (!isActive) return;

        audioContextRef.current.resume();
        audioInputRef.current = audioContextRef.current.createMediaStreamSource(stream);
        processorRef.current = new AudioWorkletNode(
          audioContextRef.current,
          "recorder.worklet"
        );

        processorRef.current.connect(audioContextRef.current.destination);
        audioContextRef.current.resume();
        audioInputRef.current.connect(processorRef.current);

        processorRef.current.port.onmessage = (event: any) => {
          if (connection && isActive) {
            const chunk = new Uint8Array(event.data);
            // === 3초 버퍼링 ===
            const chunkLen = chunk.length;
            let buffer = audioBufferRef.current;
            let offset = bufferOffsetRef.current;
            if (offset + chunkLen > BUFFER_SIZE) {
              const shift = offset + chunkLen - BUFFER_SIZE;
              buffer.set(buffer.subarray(shift, offset), 0);
              offset -= shift;
            }
            buffer.set(chunk, offset);
            offset += chunkLen;
            audioBufferRef.current = buffer;
            bufferOffsetRef.current = offset;
            // === 서버 전송 ===
            connection.emit("send_audio_data", { audio: chunk });
          }
        };

        onStart();
      } catch (error) {
        console.error("Error setting up audio:", error);
        disconnect();
      }
    };

    setupAudio();

    return () => {
      isActive = false;
      if (isRecording) {
        try {
          processorRef.current?.disconnect();
          audioInputRef.current?.disconnect();
          if (audioContextRef.current?.state !== "closed") {
            audioContextRef.current?.close();
          }
        } catch (e) {
          console.error("Error cleaning up audio resources:", e);
        }
      }
    };
  }, [connection]);

  // 세션 시작 함수
  const startSTTSession = (sock: io.Socket) => {
    if (sock) {
      sock.emit("startGoogleCloudStream");
      sttTimerRef.current = setTimeout(() => restartSTTSession(sock), STT_SESSION_LIMIT);
    }
  };

  // 세션 재시작 함수
  const restartSTTSession = (sock: io.Socket) => {
    if (sock) {
      // 현재 실시간 텍스트를 이전 텍스트로 저장
      if (currentText) {
        prevTextRef.current = currentText;
        onAudioText(''); // 현재 텍스트 초기화
      }

      if (currentSTTRef.current.trim()) {
        prevSTTRef.current = currentSTTRef.current;
        currentSTTRef.current = '';
      }
      sock.emit("endGoogleCloudStream");
      setTimeout(() => {
        sock.emit("startGoogleCloudStream");
        const buffer = audioBufferRef.current;
        const offset = bufferOffsetRef.current;
        if (offset > 0) {
          sock.emit("send_audio_data", { audio: buffer.slice(0, offset) });
        }
        sttTimerRef.current = setTimeout(() => restartSTTSession(sock), STT_SESSION_LIMIT);
      }, 500);
    }
  };

  return (
    <Container className="stt-container">
      <StatusDisplay status={status} currentText={currentText} analysisResult={analysisResult} />
      <div className="bottom-mic-visual-panel">
      </div>
      <Button
        className={isRecording ? "btn-danger btn-recording" : "btn-outline-light btn-recording"}
        onClick={isRecording ? disconnect : connect}
      >
        {isRecording ? "Stop" : "Start"}
      </Button>
    </Container>
  );
};

export default AudioToText;
