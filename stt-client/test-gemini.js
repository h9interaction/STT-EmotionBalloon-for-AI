// test-gemini-rest.js
const { io } = require("socket.io-client");

const socket = io("ws://localhost:8081");

socket.on("connect", () => {
    console.log("Connected to server");

    // 1. 텍스트 감정 분석 요청
    socket.emit("analyze_text", "안녕하세요, 감정 분석 테스트입니다.");
});

// Gemini 결과 수신
socket.on("gemini_result", (data) => {
    if (data.candidates && data.candidates[0]?.content?.parts) {
        console.log("Gemini 답변:", data.candidates[0].content.parts[0].text);
    } else {
        console.log("Gemini 결과:", data);
    }
    socket.disconnect();
});