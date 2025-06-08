export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;  // 오류 메시지 여부
  errorDetails?: any; // 오류 상세 정보 (선택 사항)
}

export interface ImageGenerationRequest {
  prompt: string;
  size: '1024x1024' | '1792x1024' | '1024x1792';
  style?: 'vivid' | 'natural';
}