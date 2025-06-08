import { NextRequest } from 'next/server';
import { generateImage } from '@/lib/openai';

// CORS 헤더 설정
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-session-id',
};

// CORS 프리플라이트 요청 처리
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      'Content-Length': '0',
    }
  });
}

// 이미지 생성 API 핸들러
export async function POST(request: NextRequest) {
  console.log('=== 이미지 생성 요청 수신 ===');
  
  try {
    // 요청 본문 파싱
    let body;
    try {
      body = await request.json();
      console.log('요청 본문:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('요청 본문 파싱 오류:', parseError);
      return errorResponse(400, '유효하지 않은 JSON 형식의 요청입니다.');
    }
    
    const { prompt, model, size, quality, style } = body;

    // 프롬프트 유효성 검사
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      console.error('유효하지 않은 프롬프트:', prompt);
      return errorResponse(400, '이미지 생성을 위한 프롬프트가 필요합니다.');
    }

    console.log('이미지 생성 요청 파라미터:', {
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      model,
      size,
      quality,
      style
    });
    
    // 이미지 생성 옵션
    const options = {
      model: model || 'dall-e-3',
      size: size || '1024x1024',
      quality: quality || 'hd',
      style: style || 'vivid'
    };
    
    console.log('이미지 생성 시작 - 옵션:', options);
    
    // 이미지 생성
    const imageUrl = await generateImage(prompt, options);
    
    if (!imageUrl) {
      throw new Error('OpenAI API에서 이미지 URL을 받지 못했습니다.');
    }

    console.log('이미지 생성 성공 - URL:', imageUrl);
    
    // 성공 응답 반환
    return successResponse({ imageUrl });
    
  } catch (error) {
    console.error('이미지 생성 중 오류 발생:', error);
    
    // OpenAI API 오류 메시지 추출
    let errorMessage = '이미지 생성 중 오류가 발생했습니다.';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // OpenAI API 오류 메시지가 있는 경우
      if ('response' in error && error.response) {
        const errorData = error.response as any;
        if (errorData.data?.error?.message) {
          errorMessage = `OpenAI 오류: ${errorData.data.error.message}`;
        }
      }
    }
    
    return errorResponse(500, errorMessage);
  }
}

// 성공 응답 생성
function successResponse(data: any) {
  return new Response(
    JSON.stringify({ 
      success: true,
      ...data 
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...corsHeaders
      }
    }
  );
}

// 에러 응답 생성
function errorResponse(status: number, message: string) {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: message 
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...corsHeaders
      }
    }
  );
}