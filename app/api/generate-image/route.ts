import { NextRequest } from 'next/server';
import OpenAI from 'openai';

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

// 간소화된 이미지 생성 API 핸들러
export async function POST(request: NextRequest) {
  console.log('=== 이미지 생성 요청 수신 (간소화된 버전) ===');
  
  try {
    // 요청 본문 파싱
    const body = await request.json();
    const { prompt } = body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      console.error('유효하지 않은 프롬프트:', prompt);
      return errorResponse(400, '이미지 생성을 위한 프롬프트가 필요합니다.');
    }

    console.log('이미지 생성 요청 - 프롬프트:', prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''));
    
    // OpenAI 클라이언트 초기화
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API 키가 설정되지 않았습니다.');
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      timeout: 30000, // 30초 타임아웃
    });

    console.log('OpenAI API 호출 시작...');
    
    // 이미지 생성 요청
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt.trim(),
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid',
      response_format: 'url',
    });

    console.log('OpenAI API 응답 수신');
    
    const imageUrl = response.data[0]?.url;
    
    if (!imageUrl) {
      console.error('생성된 이미지 URL이 없습니다:', response);
      throw new Error('이미지 생성에 실패했습니다: 유효한 URL을 받지 못함');
    }
    
    console.log('이미지 생성 성공 - URL 길이:', imageUrl.length);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
    
  } catch (error) {
    console.error('이미지 생성 오류:', error);
    
    let errorMessage = '이미지 생성 중 오류가 발생했습니다.';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // OpenAI API 오류 메시지가 있는 경우
      if ('response' in error && error.response) {
        const errorData = (error.response as any)?.data;
        if (errorData?.error?.message) {
          errorMessage = `OpenAI 오류: ${errorData.error.message}`;
        }
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
}

// 에러 응답 생성 (타입 오류 방지를 위해 유지)
function errorResponse(status: number, message: string) {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: message 
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
}