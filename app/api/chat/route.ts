import { NextRequest, NextResponse } from 'next/server';
import { generateChatCompletion } from '@/lib/openai';
import { saveMessage } from '@/lib/supabase';

// API 응답 타입 정의
interface ApiResponse {
  response?: string;
  error?: string;
  details?: any;
}

export async function POST(request: NextRequest) {
  try {
    // OpenAI API 키 확인
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env.local file.' },
        { status: 500 }
      );
    }

    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Generate response using OpenAI
    const response = await generateChatCompletion(messages);

    // Get user ID (for now, we'll use a session-based approach)
    // In a real app, you'd get this from authentication
    const sessionId = request.headers.get('x-session-id') || 'anonymous';

    // Save both user message and assistant response
    if (messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage.role === 'user') {
        try {
          // Supabase 설정이 되어 있는 경우에만 메시지 저장 시도
          if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            await saveMessage({
              content: lastUserMessage.content,
              role: 'user',
              userId: sessionId,
            });

            await saveMessage({
              content: response,
              role: 'assistant',
              userId: sessionId,
            });
          } else {
            console.warn('Supabase is not configured. Messages will not be saved.');
          }
        } catch (error) {
          console.warn('Failed to save messages to database:', error);
          // 데이터베이스 저장 실패해도 채팅은 계속 진행
        }
      }
    }

    return NextResponse.json({ response } as ApiResponse);
  } catch (error) {
    console.error('Chat API error:', error);
    
    // OpenAI API 키 관련 오류인지 확인
    console.error('Chat API error details:', error);
    
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    const errorResponse: ApiResponse = {
      error: '채팅 처리 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    };

    if (error instanceof Error) {
      if (error.message.includes('OPENAI_API_KEY')) {
        errorResponse.error = 'OpenAI API 키가 올바르게 설정되지 않았습니다.';
        errorResponse.details = 'API 키를 .env.local 파일에 설정해주세요.';
        return NextResponse.json(errorResponse, { status: 500 });
      }
      
      if (error.message.includes('rate limit')) {
        errorResponse.error = '요청 한도에 도달했습니다. 잠시 후 다시 시도해주세요.';
        return NextResponse.json(errorResponse, { status: 429 });
      }
    }

    return NextResponse.json(errorResponse, { status: 500 });
  }
}