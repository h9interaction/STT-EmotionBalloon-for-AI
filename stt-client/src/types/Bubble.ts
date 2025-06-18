export interface Bubble {
  x: number;
  y: number;
  text: string;
  emotion: string;
  opacity: number;
  velocity: number;
  angle: number;
  radius: number;
  emotionSpeed: number;
  mass?: number;
  wanderAngle?: number;
  scale?: number;
} 