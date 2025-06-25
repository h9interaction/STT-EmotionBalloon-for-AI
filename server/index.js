import dotenv from "dotenv";
dotenv.config();

import express from "express";
import logger from "morgan";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import WebSocket from "ws";
import fetch from "node-fetch";

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

// Gemini REST API 호출 함수
async function callGeminiAPI(promptText) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [
      {
        parts: [
          { text: promptText }
        ]
      }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return await response.json();
}

// 클라이언트와의 WebSocket 연결
io.on("connection", (socket) => {
  socket.on("analyze_text", async (text) => {
    try {
      const result = await callGeminiAPI(text);
      socket.emit("gemini_result", result);
    } catch (error) {
      socket.emit("gemini_result", { error: error.message });
    }
  });

  socket.on("disconnect", () => {
    // 연결 해제 시 처리 (필요시)
  });
});

server.listen(process.env.PORT || 8081, () => {
  console.log(`WebSocket server listening on port ${process.env.PORT || 8081}.`);
});

// 헬스체크 엔드포인트 (Render에서 필요)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 루트 엔드포인트
app.get('/', (req, res) => {
  res.json({ 
    message: 'STT Emotion Balloon Server is running!',
    timestamp: new Date().toISOString()
  });
});
