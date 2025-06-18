import { Bubble } from '../types/Bubble';

interface AnimationConfig {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  springConstant: number;
  dampingFactor: number;
  centerAttraction: number;
  repulsionStrength: number;
  minDistance: number;
  collisionDamping: number;
  maxVelocity: number;
}

export class BubbleAnimation {
  private config: AnimationConfig;
  private bubbles: Bubble[];

  constructor(config: AnimationConfig) {
    this.config = {
      ...{
        collisionDamping: 0.7,  // 기본값
        maxVelocity: 12        // 기본값
      },
      ...config               // 사용자 제공 설정값
    };
    this.bubbles = [];
  }

  // JSON 파싱 및 감정 추출 함수
  private parseEmotionFromBubble(bubble: Bubble): string {
    try {
      let jsonStr = bubble.emotion.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      return parsed.data?.result?.selected_first_emotion || '중립';
    } catch (e) {
      return '중립';
    }
  }

  setBubbles(bubbles: Bubble[]) {
    this.bubbles = bubbles.map(bubble => {
      const emotion = this.parseEmotionFromBubble(bubble);
      return {
        ...bubble,
        mass: bubble.radius * bubble.radius,
        wanderAngle: bubble.wanderAngle || Math.random() * Math.PI * 2,
        emotionSpeed: bubble.emotionSpeed || Math.random() * 0.2 + 0.5 // 기본 속도 범위
      };
    });
  }

  update(): Bubble[] {
    return this.bubbles.map(bubble => this.updateBubble(bubble));
  }

  private updateBubble(bubble: Bubble): Bubble {
    if (bubble.scale !== undefined && bubble.scale < 1) {
      // 스케일 애니메이션 중에는 위치/물리 업데이트 하지 않음
      return bubble;
    }
    let { x, y, velocity, angle, radius, mass = 1, wanderAngle = 0, emotionSpeed = 1 } = bubble;
    
    // 1. 중앙으로의 인력 계산
    const dx = this.config.centerX - (x + radius);
    const dy = this.config.centerY - (y + radius);
    const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
    
    // 중앙으로의 인력을 거리에 반비례하도록 수정
    const maxDistance = Math.min(this.config.width, this.config.height) * 0.4;
    const distanceFactor = Math.min(1, distanceToCenter / maxDistance);
    const centerForce = this.config.centerAttraction * distanceFactor / Math.max(distanceToCenter, 50);
    
    // 2. 배회 행동 추가 (감정 속도 반영)
    const wanderRadius = 30;
    const wanderDistance = 100;
    const wanderJitter = 0.1;
    
    // 배회 각도 업데이트
    wanderAngle += (Math.random() * 2 - 1) * wanderJitter * emotionSpeed;
    
    // 배회 힘 계산
    const wanderX = Math.cos(wanderAngle) * wanderRadius;
    const wanderY = Math.sin(wanderAngle) * wanderRadius;
    const wanderForce = emotionSpeed * 2; // 감정 속도에 비례하는 배회 힘
    
    // 3. 다른 말풍선과의 반발력 계산
    let repulsionX = 0;
    let repulsionY = 0;
    
    this.bubbles.forEach(other => {
      if (other === bubble) return;
      
      const dx = (bubble.x + bubble.radius) - (other.x + other.radius);
      const dy = (bubble.y + bubble.radius) - (other.y + other.radius);
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minAllowedDistance = bubble.radius + other.radius;
      
      if (distance < minAllowedDistance) {
        // 겹침 방지를 위한 반발력
        const overlap = minAllowedDistance - distance;
        const force = this.config.repulsionStrength * overlap;
        const direction = distance > 0 ? 1 : Math.random() * 2 * Math.PI;
        
        if (distance > 0) {
          repulsionX += (dx / distance) * force / mass;
          repulsionY += (dy / distance) * force / mass;
        } else {
          // 완전히 겹친 경우 랜덤 방향으로 밀어냄
          repulsionX += Math.cos(direction) * force / mass;
          repulsionY += Math.sin(direction) * force / mass;
        }
      } else if (distance < this.config.minDistance) {
        const force = this.config.repulsionStrength / (distance * distance);
        repulsionX += (dx / distance) * force / mass;
        repulsionY += (dy / distance) * force / mass;
      }
    });
    
    // 4. 스프링 효과 적용
    const springForceX = -this.config.springConstant * dx / mass;
    const springForceY = -this.config.springConstant * dy / mass;
    
    // 5. 모든 힘 합성 (배회 힘 포함)
    const totalForceX = springForceX + repulsionX + (dx / distanceToCenter) * centerForce + wanderX * wanderForce;
    const totalForceY = springForceY + repulsionY + (dy / distanceToCenter) * centerForce + wanderY * wanderForce;
    
    // 6. 속도 업데이트 (감정 속도 반영)
    const targetVelocity = Math.sqrt(totalForceX * totalForceX + totalForceY * totalForceY) * 0.1 * emotionSpeed;
    velocity = velocity * (1 - this.config.dampingFactor) + targetVelocity * this.config.dampingFactor;
    
    // 속도 제한 (감정 속도에 따라 조정)
    const maxVelocity = this.config.maxVelocity * emotionSpeed;
    velocity = Math.min(Math.max(velocity, 0.1), maxVelocity);
    
    // 7. 위치 업데이트
    const deltaTime = 1/60;
    x += totalForceX * deltaTime * emotionSpeed;
    y += totalForceY * deltaTime * emotionSpeed;
    
    // 8. 화면 경계 처리
    const bubbleWidth = 2 * radius;
    const bubbleHeight = 2 * radius;
    
    if (x < 0) {
      x = 0;
      velocity *= -this.config.collisionDamping;
      wanderAngle = Math.PI - wanderAngle;
    } else if (x + bubbleWidth > this.config.width) {
      x = this.config.width - bubbleWidth;
      velocity *= -this.config.collisionDamping;
      wanderAngle = Math.PI - wanderAngle;
    }
    
    if (y < 0) {
      y = 0;
      velocity *= -this.config.collisionDamping;
      wanderAngle = -wanderAngle;
    } else if (y + bubbleHeight > this.config.height) {
      y = this.config.height - bubbleHeight;
      velocity *= -this.config.collisionDamping;
      wanderAngle = -wanderAngle;
    }
    
    // 새로운 각도 계산
    const newAngle = Math.atan2(totalForceY, totalForceX);
    angle = angle * 0.95 + newAngle * 0.05;

    // 9. 겹침 보정 (즉각적 separation)
    this.bubbles.forEach(other => {
      if (other === bubble) return;
      const dx = (x + radius) - (other.x + other.radius);
      const dy = (y + radius) - (other.y + other.radius);
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minAllowedDistance = radius + other.radius;
      if (distance < minAllowedDistance && distance > 0) {
        const overlap = (minAllowedDistance - distance) / 2;
        x += (dx / distance) * overlap;
        y += (dy / distance) * overlap;
      }
    });

    return {
      ...bubble,
      x,
      y,
      velocity,
      angle,
      mass,
      wanderAngle,
      emotionSpeed
    };
  }
} 