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
  console.log('=== CORS 프리플라이트 요청 처리 ===');
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      'Content-Length': '0',
    }
  });
}

// 에러 응답 생성
function createErrorResponse(status: number, message: string, details?: any) {
  console.error(`[${status}] ${message}`, details || '');
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      details: process.env.NODE_ENV === 'development' ? details : undefined,
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

// 이미지 생성 API 핸들러
export async function POST(request: NextRequest) {
  console.log('=== 이미지 생성 요청 수신 ===');
  const startTime = Date.now();
  
  try {
    // 요청 본문 파싱
    let body;
    try {
      body = await request.json();
      console.log('요청 본문:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('요청 본문 파싱 오류:', parseError);
      return createErrorResponse(400, '유효하지 않은 JSON 형식의 요청 본문입니다.');
    }
    
    const { prompt, size = '1024x1024', style = 'vivid' } = body;
    
    // 입력 유효성 검사
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return createErrorResponse(400, '이미지 생성을 위한 프롬프트가 필요합니다.', { received: prompt });
    }

    console.log(`이미지 생성 요청 - 프롬프트: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}, 크기: ${size}, 스타일: ${style}`);
    
    // OpenAI 클라이언트 초기화
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const error = new Error('OpenAI API 키가 환경 변수에 설정되지 않았습니다.');
      console.error(error.message);
      return createErrorResponse(500, '서버 구성 오류가 발생했습니다.');
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      timeout: 60000, // 60초 타임아웃
    });

    console.log('OpenAI API 클라이언트 초기화 완료');
    console.log('이미지 생성 요청 시작...');
    
    // 이미지 생성 요청
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt.trim(),
      n: 1,
      size: size as any, // 클라이언트에서 유효성 검사를 거친다고 가정
      style: style as any, // 클라이언트에서 유효성 검사를 거친다고 가정
      quality: 'hd',
      response_format: 'url',
    });

    console.log('OpenAI API 응답 수신:', JSON.stringify(response, null, 2));

    if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
      throw new Error('OpenAI API에서 유효한 응답을 받지 못했습니다.');
    }

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error('생성된 이미지 URL을 받지 못했습니다.');
    }

    console.log('이미지 생성 성공 - URL 길이:', imageUrl.length);
    
    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('이미지 생성 중 오류 발생:', error);
    
    // OpenAI API 오류 처리
    if (error instanceof OpenAI.APIError) {
      console.error('OpenAI API 오류 상세:', {
        status: error.status,
        code: error.code,
        type: error.type,
        headers: error.headers,
      });
      
      return createErrorResponse(
        error.status || 500,
        `OpenAI API 오류: ${error.message}`,
        process.env.NODE_ENV === 'development' ? {
          code: error.code,
          type: error.type,
        } : undefined
      );
    }
    
    // 기타 오류 처리
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return createErrorResponse(500, `이미지 생성 중 오류가 발생했습니다: ${errorMessage}`);
  } finally {
    const endTime = Date.now();
    console.log(`이미지 생성 요청 처리 완료 (${endTime - startTime}ms)`);
  }
}