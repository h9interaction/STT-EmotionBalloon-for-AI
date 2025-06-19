import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { GoogleGenAI } from "@google/genai";
import speech from "@google-cloud/speech";
import logger from "morgan";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

// __dirname 대체 (ESM 환경)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(logger("dev"));
app.use(bodyParser.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Google Cloud Speech-to-Text 설정
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, "speech-to-text-key.json");
const speechClient = new speech.SpeechClient();

// Gemini API 설정
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 시스템 프롬프트 정의
const systemPrompt = `
[System Prompt]

당신은 감정 분석 전문가입니다.
텍스트와 이미지를 바탕으로 감정을 정확하게 파악하고,
사용자에게 친근하고 위트 있는 방식으로 결과를 전달합니다.

# 분석 대상 감정 목록
다음 목록 중 최대 3개의 감정을 분석 결과로 선택하세요:
기쁨, 슬픔, 분노, 두려움, 놀람, 혐오, 중립, 우울함, 불안, 초조함, 졸림, 흥분, 만족, 실망, 걱정, 자신감, 혼란, 기대감, 관심, 지루함, 집중, 공감, 무관심, 평온, 희망, 좌절, 감사, 후회, 자부심, 수치심, 외로움, 사랑, 증오, 질투, 동정, 경외, 경멸, 불확실, 불안정, 긴장, 이완, 활력, 피로, 산만, 불만족, 편안함, 불편함, 상실, 용기, 안도감, 죄책감, 무력감, 절망, 열정, 설렘, 감탄, 안절부절, 부끄러움, 성취감

# 분석 시 고려 요소
1. 텍스트의 문맥과 어조를 파악하세요.
2. 이미지 속 인물의 표정, 의상, 자세를 관찰하세요.
3. 전체적인 분위기 및 상황 맥락을 이해하세요.

# 출력 텍스트 구성 규칙
- display_text_nickname: 감정 캐릭터를 대표하는 7자 이내 별명
- display_text_emoji: 감정 상태를 상징하는 이모지 3개
- display_text_text: 원본 텍스트를 자연스럽게 다듬은 문장 (길이 유지)
- display_text_ai: 분석자가 위트 있게 덧붙이는 짧은 멘트 (10자 이내)

# 출력 형식(JSON)
반드시 아래 JSON 형식으로만 응답하세요.  
**JSON 외의 추가 텍스트는 절대 포함하지 마세요.**

{
  "data": {
    "result": {
      "selected_first_emotion": "(주요 감정)",
      "selected_second_emotion": "(부가 감정 1)",
      "selected_third_emotion": "(부가 감정 2)",
      "score_first_emotion": (0.0 ~ 1.0),
      "score_second_emotion": (0.0 ~ 1.0),
      "score_third_emotion": (0.0 ~ 1.0),
      "display_text_nickname": "(7자 이내 별명)",
      "display_text_emoji": "(3개 이모지)",
      "display_text_text": "(최대한 원본 텍스트 길이를 유지하고 어색한 부분만 보정된 문장)",
      "display_text_ai": "(제치있는 짧은 10자 이내 멘트)"
    }
  }
}
`;

// 클라이언트별로 텍스트/이미지 임시 저장
const userData = {};

// STT 실시간 변환 및 감정 분석 자동 실행 기능 복구
const recognizeStreams = {}; // socket.id → recognizeStream

io.on("connection", (socket) => {
  userData[socket.id] = { text: null, image: null };

  socket.on("startGoogleCloudStream", function () {
    // 이전 스트림이 있으면 종료
    if (recognizeStreams[socket.id]) {
      try { recognizeStreams[socket.id].end(); } catch { }
      recognizeStreams[socket.id] = null;
    }
    // 새 스트림 생성
    recognizeStreams[socket.id] = speechClient
      .streamingRecognize(request)
      .on("error", (error) => {
        console.error("Stream error:", error);
        socket.emit("stream_error", {
          error: error.message,
          timestamp: new Date().toISOString()
        });
        if (recognizeStreams[socket.id]) {
          try { recognizeStreams[socket.id].end(); } catch { }
          recognizeStreams[socket.id] = null;
        }
      })
      .on("close", () => {
        if (recognizeStreams[socket.id]) {
          try { recognizeStreams[socket.id].end(); } catch { }
          recognizeStreams[socket.id] = null;
        }
      })
      .on("data", async (data) => {
        const result = data.results[0];
        const isFinal = result.isFinal;
        const transcription = data.results
          .map((result) => result.alternatives[0].transcript)
          .join("\n");
        // 최종 결과일 때만 클라이언트로 전송
        if (isFinal && transcription.trim()) {
          socket.emit("receive_audio_text", {
            text: transcription,
            isFinal: isFinal
          });
        } else {
          socket.emit("receive_audio_text", {
            text: transcription,
            isFinal: isFinal
          });
        }
      });
  });

  socket.on("endGoogleCloudStream", function () {
    if (recognizeStreams[socket.id]) {
      try { recognizeStreams[socket.id].end(); } catch { }
      recognizeStreams[socket.id] = null;
    }
  });

  socket.on("send_audio_data", async (audioData) => {
    if (recognizeStreams[socket.id]) {
      try {
        recognizeStreams[socket.id].write(audioData.audio);
      } catch (err) {
        console.error("Error calling google api ", err);
      }
    } else {
      console.log("RecognizeStream is null or destroyed");
    }
  });

  // 기존 감정 분석 연동 로직
  socket.on("stt_text", (text) => {
    userData[socket.id].text = text;
    tryAnalyze(socket);
  });

  socket.on("webcam_image", (imageBase64) => {
    console.log('Received image size:', {
      base64Length: imageBase64.length,
      estimatedSizeKB: Math.round(imageBase64.length * 0.75 / 1024)
    });
    userData[socket.id].image = imageBase64;
    tryAnalyze(socket);
  });

  function tryAnalyze(socket) {
    const { text, image } = userData[socket.id];
    if (text && image) {
      analyzeEmotion(text, image).then((emotionAnalysis) => {
        console.log('서버 감정 분석 결과:', {
          text,
          emotionAnalysis,
          timestamp: new Date().toISOString(),
          imageSize: {
            base64Length: image.length,
            estimatedSizeKB: Math.round(image.length * 0.75 / 1024)
          }
        });
        socket.emit("emotion_analysis_result", { text, emotionAnalysis });
        userData[socket.id] = { text: null, image: null };
      });
    }
  }

  socket.on("disconnect", () => {
    if (recognizeStreams[socket.id]) {
      try { recognizeStreams[socket.id].end(); } catch { }
      recognizeStreams[socket.id] = null;
    }
    delete userData[socket.id];
  });
});

// 멀티모달 감정 분석 함수
async function analyzeEmotion(text, imageBase64) {
  try {
    let base64Data = null;
    if (imageBase64 && imageBase64.startsWith("data:image")) {
      base64Data = imageBase64.split(',')[1];
    }

    const userPrompt = `다음 텍스트와 이미지의 감정을 분석해주세요:
    ${text}`;

    const contents = [
      {
        parts: [
          { text: userPrompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data,
            }
          }
        ]
      }
    ];

    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    });

    const analysis = response.text;
    return analysis;
  } catch (error) {
    console.error('감정 분석 중 오류 발생:', error);
    return '감정 분석 실패';
  }
}

server.listen(8081, () => {
  console.log("WebSocket server listening on port 8081.");
});

// =========================== GOOGLE CLOUD SETTINGS ================================ //

// The encoding of the audio file, e.g. 'LINEAR16'
// The sample rate of the audio file in hertz, e.g. 16000
// The BCP-47 language code to use, e.g. 'en-US'
const encoding = "LINEAR16";
const sampleRateHertz = 16000;
const languageCode = "ko-KR";

const request = {
  config: {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
    enableWordTimeOffsets: true,
    enableAutomaticPunctuation: true,
    enableWordConfidence: true,
    enableSpeakerDiarization: true,
    model: "command_and_search",
    useEnhanced: true,
    inactivityTimeout: -1,
    speechContexts: [{
      phrases: [
        "안녕하세요",
        "감사합니다",
        "네",
        "아니요",
      ],
      boost: 20.0
    }],
  },
  interimResults: true,
};

// 감정 분석 엔드포인트 추가
app.post('/analyze-emotion', async (req, res) => {
  try {
    const { text } = req.body;
    console.log('감정 분석 요청 텍스트:', text);
    if (!text) {
      return res.status(400).json({ error: '텍스트가 필요합니다.' });
    }

    const analysis = await analyzeEmotion(text);
    console.log('감정 분석 결과:', analysis);
    res.send(analysis);
  } catch (error) {
    console.error('감정 분석 중 오류 발생:', error);
    res.status(500).json({ error: '감정 분석 중 오류가 발생했습니다.' });
  }
});
