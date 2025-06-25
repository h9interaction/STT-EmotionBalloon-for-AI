type OnResultCallback = (result: any) => void;

export class LiveAPIClient {
  private ws: WebSocket | null = null;
  private onResult: OnResultCallback;

  constructor(onResult: OnResultCallback) {
    this.onResult = onResult;
  }

  connect() {
    // 실제 포트/경로로 수정 필요 (예: ws://localhost:3001)
    this.ws = new WebSocket('ws://localhost:3001');

    this.ws.onopen = () => {
      console.log('LiveAPI WebSocket 연결됨');
    };

    this.ws.onmessage = (event) => {
      const result = JSON.parse(event.data);
      this.onResult(result);
    };

    this.ws.onerror = (err) => {
      console.error('LiveAPI WebSocket 에러:', err);
    };

    this.ws.onclose = () => {
      console.log('LiveAPI WebSocket 연결 종료');
    };
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
} 