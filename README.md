# STT Emotion Balloon for AI

실시간 음성 인식과 감정 분석을 통해 사용자의 말을 애니메이션 말풍선으로 시각화하는 AI 기반 웹 애플리케이션입니다.

## 🎯 프로젝트 개요

이 프로젝트는 Google Speech-to-Text API와 Gemini Live API를 활용하여 사용자의 음성을 실시간으로 텍스트로 변환하고, 웹캠 이미지와 함께 감정을 분석하여 화면에 애니메이션 말풍선으로 표시하는 시스템입니다.

### 주요 기능
- 🎤 **실시간 음성 인식**: Google Speech-to-Text API를 통한 실시간 음성-텍스트 변환
- 📷 **웹캠 이미지 캡처**: 사용자의 표정과 상황을 분석하기 위한 이미지 수집
- 🧠 **AI 감정 분석**: Gemini Live API를 활용한 텍스트와 이미지 기반 실시간 감정 분석
- 💬 **애니메이션 말풍선**: 분석된 감정을 바탕으로 한 동적 말풍선 시각화
- 🎨 **실시간 애니메이션**: Canvas API를 활용한 부드러운 말풍선 애니메이션
- 🔄 **자동 재연결**: WebSocket 연결이 끊어져도 자동으로 재연결
- 📊 **실시간 상태 표시**: 연결 상태에 따른 UI 피드백 (Streaming/Disconnected)

## 🏗️ 프로젝트 구조

```
STT-EmotionBalloon-for-AI/
├── client/                # 🚀 현재 사용 중인 React 프론트엔드 (Gemini Live API 통합)
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   │   ├── control-tray/     # 음성/영상 제어 UI
│   │   │   ├── settings-dialog/  # 설정 다이얼로그
│   │   │   └── side-panel/       # 사이드 패널
│   │   ├── contexts/      # React Context (LiveAPIContext)
│   │   ├── hooks/         # 커스텀 React 훅
│   │   ├── lib/           # 라이브러리 (genai-live-client)
│   │   ├── factories/     # 말풍선 팩토리
│   │   ├── utils/         # 유틸리티 함수
│   │   ├── types/         # TypeScript 타입 정의
│   │   └── App.tsx        # 메인 앱 컴포넌트
│   └── package.json       # 클라이언트 의존성
├── server/                # ⚠️ 레거시 Node.js 백엔드 서버 (현재 미사용)
│   ├── index.js           # 메인 서버 파일 (STT + 감정 분석)
│   └── package.json       # 서버 의존성
└── stt-client/            # ⚠️ 레거시 React 프론트엔드 (현재 미사용)
    ├── src/
    │   ├── components/    # React 컴포넌트
    │   ├── services/      # 비즈니스 로직 서비스
    │   ├── hooks/         # 커스텀 React 훅
    │   ├── animations/    # 애니메이션 관련 클래스
    │   ├── constants/     # 설정 상수
    │   ├── types/         # TypeScript 타입 정의
    │   ├── utils/         # 유틸리티 함수
    │   └── App.tsx        # 메인 앱 컴포넌트
    └── package.json       # 클라이언트 의존성
```

### 📋 폴더별 상태

| 폴더 | 상태 | 설명 |
|------|------|------|
| `client/` | ✅ **현재 사용 중** | Gemini Live API 통합 버전, 실시간 스트리밍 지원 |
| `server/` | ⚠️ **레거시** | 기존 Node.js 백엔드, 현재는 Gemini Live API로 대체됨 |
| `stt-client/` | ⚠️ **레거시** | 기존 React 프론트엔드, 현재는 client 폴더로 대체됨 |

### 🔄 아키텍처 변경 사항

**v1.0 (레거시)**: 
- `server/` + `stt-client/` 조합
- REST API 기반 통신
- Google Cloud Speech-to-Text + Gemini API

**v2.0 (현재)**:
- `client/` 단일 폴더
- Gemini Live API 직접 통신
- WebSocket 기반 실시간 스트리밍
- 자동 재연결 및 안정성 향상

## 🛠️ 기술 스택

### Frontend (Client) - 현재 사용 중
- **React 18** - 사용자 인터페이스 프레임워크
- **TypeScript** - 타입 안전성과 개발 경험 향상
- **Canvas API** - 실시간 애니메이션 렌더링
- **Gemini Live API** - 실시간 AI 스트리밍 통신
- **WebSocket** - 실시간 양방향 통신 (자동 재연결 지원)
- **React Context** - 전역 상태 관리
- **Material Symbols** - 아이콘 라이브러리

### Backend - 레거시 (현재 미사용)
- **Node.js** - 서버 런타임
- **Express.js** - 웹 서버 프레임워크
- **Socket.IO** - 실시간 양방향 통신
- **Google Cloud Speech-to-Text** - 음성 인식 API
- **Google Gemini AI** - 감정 분석 AI 모델

## 🚀 설치 및 실행

### 사전 요구사항
- Node.js 20.x 이상
- Google Cloud Platform 계정
- Gemini API 키

### 1. 저장소 클론
```bash
git clone <repository-url>
cd STT-EmotionBalloon-for-AI
```

### 2. 프론트엔드 설정 (현재 사용 중인 버전)
```bash
cd client
npm install

# 환경 변수 설정 (.env 파일 생성)
echo "REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here" > .env

# 개발 서버 실행
npm start
```

### 3. 브라우저 접속
- 프론트엔드: http://localhost:3000

### ⚠️ 레거시 버전 (참고용)
레거시 버전을 사용하려면:
```bash
# 서버 (레거시)
cd server
npm install
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env
npm run dev

# 클라이언트 (레거시)
cd ../stt-client
npm install
npm start
```

## 📖 사용 방법

### 기본 사용법 (Gemini Live API 버전)
1. **연결 시작**: "Streaming" 버튼을 클릭하여 Gemini Live API에 연결합니다.
2. **음성 인식**: 마이크 버튼을 활성화하고 말을 하면 실시간으로 텍스트가 변환됩니다.
3. **감정 분석**: 말을 마치면 웹캠 이미지와 함께 자동으로 감정 분석이 실행됩니다.
4. **말풍선 시각화**: 분석된 감정이 애니메이션 말풍선으로 화면에 표시됩니다.
5. **ESC 키**: 말풍선 시각화를 토글할 수 있습니다.

### 연결 상태 표시
- **Streaming** (파란색): 정상 연결 상태
- **Disconnected** (빨간색): 연결이 끊어진 상태 (자동 재연결 시도)

### 고급 기능
- **자동 재연결**: WebSocket 연결이 끊어져도 자동으로 재연결을 시도합니다.
- **실시간 스트리밍**: Gemini Live API를 통한 실시간 AI 응답 스트리밍
- **구조화된 감정 데이터**: 감정별명, 이모지, AI 코멘트 등 구조화된 출력

## 🎨 감정 분석 시스템

### 분석 대상 감정 (60가지)
기쁨, 슬픔, 분노, 두려움, 놀람, 혐오, 중립, 우울함, 불안, 초조함, 졸림, 흥분, 만족, 실망, 걱정, 자신감, 혼란, 기대감, 관심, 지루함, 집중, 공감, 무관심, 평온, 희망, 좌절, 감사, 후회, 자부심, 수치심, 외로움, 사랑, 증오, 질투, 동정, 경외, 경멸, 불확실, 불안정, 긴장, 이완, 활력, 피로, 산만, 불만족, 편안함, 불편함, 상실, 용기, 안도감, 죄책감, 무력감, 절망, 열정, 설렘, 감탄, 안절부절, 부끄러움, 성취감

### 출력 형식 (Gemini Live API)
```json
{
  "data": {
    "result": {
      "selected_first_emotion": "주요 감정",
      "selected_second_emotion": "부가 감정 1",
      "selected_third_emotion": "부가 감정 2",
      "score_first_emotion": 0.85,
      "score_second_emotion": 0.12,
      "score_third_emotion": 0.03,
      "display_text_nickname": "감정별명",
      "display_text_emoji": "😊😄🎉",
      "display_text_text": "원본 텍스트",
      "display_text_ai": "AI 코멘트"
    }
  }
}
```

## 🎭 말풍선 시각화

### 애니메이션 특징
- **동적 크기 조절**: 텍스트 길이에 따라 말풍선 크기가 자동 조절됩니다 (최소 48px, 최대 180px 반지름)
- **호흡 애니메이션**: 음성 인식 중일 때 0.95~1.15 배율로 부드러운 호흡 효과
- **위치 애니메이션**: 화면 전체에 걸쳐 자연스러운 움직임
- **투명도 효과**: 페이드 인/아웃 효과로 부드러운 등장과 사라짐
- **실시간 처리 인디케이터**: 음성 인식/분석 중 로딩 애니메이션 표시

### 폰트 시스템
- **Pretendard 폰트**: 한글 최적화 폰트 사용
- **가중치별 적용**: 
  - 200 weight: AI 코멘트 (12px)
  - 600 weight: 메인 텍스트 (14px)

### 구조화된 텍스트 표시
- **감정별명**: 사용자의 감정 상태를 나타내는 별명
- **이모지**: 감정을 시각적으로 표현하는 이모지
- **원본 텍스트**: 사용자가 말한 실제 텍스트
- **AI 코멘트**: 감정 분석 결과에 대한 AI의 해석

## 🔧 개발 가이드

### 코드 구조 원칙
- **Clean Architecture**: 계층 분리와 의존성 규칙 준수
- **SOLID 원칙**: 유지보수성과 확장성을 고려한 설계
- **TDD**: 테스트 주도 개발 방식 적용
- **DRY**: 코드 중복 최소화

### 주요 컴포넌트 (Client)
- `LiveAPIContext`: Gemini Live API 연결 및 상태 관리
- `ControlTray`: 음성/영상 제어 UI 및 연결 상태 표시
- `VisualizationCanvas`: 말풍선 애니메이션 캔버스
- `BubbleFactory`: 말풍선 생성 및 관리
- `SpeechBubbleRenderer`: 말풍선 렌더링 로직
- `SettingsDialog`: 시스템 설정 관리

### WebSocket 연결 관리
- **자동 재연결**: 연결이 끊어지면 1~3초 간격으로 재연결 시도
- **상태 관리**: 연결/연결 해제/재연결 중 상태를 실시간으로 관리
- **에러 처리**: 연결 에러 발생 시 적절한 재연결 로직 실행

### 실시간 데이터 처리
- **스트리밍 청크 누적**: Gemini Live API의 청크 단위 응답을 누적하여 완전한 JSON 파싱
- **구조화된 데이터 추출**: 감정 분석 결과에서 구조화된 필드들을 분리하여 UI에 전달
- **실시간 시각화**: 분석 결과가 도착하는 즉시 말풍선으로 시각화

## 🚀 배포

### 프로덕션 빌드
```bash
cd client
npm run build
```

### Google App Engine 배포
```bash
# app.yaml 설정 확인 후
gcloud app deploy
```

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

프로젝트에 대한 문의사항이나 버그 리포트는 이슈를 통해 제출해 주세요.

## 🔄 최근 업데이트

### v2.0 (Gemini Live API 통합)
- **Gemini Live API 통합**: 실시간 스트리밍 기반 감정 분석
- **WebSocket 자동 재연결**: 연결 안정성 향상
- **실시간 상태 표시**: 연결 상태에 따른 UI 피드백
- **구조화된 감정 데이터**: 감정별명, 이모지, AI 코멘트 등
- **실시간 처리 인디케이터**: 음성 인식/분석 중 로딩 표시
- **폴더 구조 개선**: `live-api-web-console` → `client`로 변경
