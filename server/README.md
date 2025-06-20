# STT Emotion Balloon Backend Server

음성 인식(STT)과 감정 분석을 위한 백엔드 서버입니다.

## 기능

- Google Cloud Speech-to-Text API를 사용한 실시간 음성 인식
- Gemini API를 사용한 멀티모달 감정 분석 (텍스트 + 이미지)
- WebSocket을 통한 실시간 통신
- CORS 지원

## 환경 변수

다음 환경 변수들을 설정해야 합니다:

- `GOOGLE_APPLICATION_CREDENTIALS_JSON`: Google Cloud 서비스 계정 키 (JSON 문자열)
- `GEMINI_API_KEY`: Gemini API 키
- `PORT`: 서버 포트 (기본값: 8081)

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 모드 실행
npm run dev

# 프로덕션 모드 실행
npm start
```

## API 엔드포인트

- `GET /`: 서버 상태 확인
- `GET /health`: 헬스체크
- `POST /analyze-emotion`: 감정 분석 (텍스트만)

## WebSocket 이벤트

- `startGoogleCloudStream`: 음성 인식 스트림 시작
- `endGoogleCloudStream`: 음성 인식 스트림 종료
- `send_audio_data`: 오디오 데이터 전송
- `stt_text`: 텍스트 전송
- `webcam_image`: 웹캠 이미지 전송
- `receive_audio_text`: 음성 인식 결과 수신
- `emotion_analysis_result`: 감정 분석 결과 수신 