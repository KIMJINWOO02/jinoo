import { NextRequest } from 'next/server';
import OpenAI from 'openai';

// 환경 변수 로드 확인
console.log('환경 변수 로드 상태:', {
  NODE_ENV: process.env.NODE_ENV,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '설정됨' : '설정되지 않음'
});

// CORS 헤더 설정
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-session-id, Authorization',
  'Access-Control-Max-Age': '86400', // 24시간 동안 프리플라이트 요청 캐시
  'Vary': 'Origin',
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
  const requestId = Math.random().toString(36).substring(2, 9);
  console.log(`[${requestId}] === 이미지 생성 요청 수신 ===`);
  const startTime = Date.now();
  
  // 요청 헤더 로깅
  console.log(`[${requestId}] 요청 헤더:`, Object.fromEntries(request.headers.entries()));
  
  try {
    // 요청 본문 파싱
    let body;
    try {
      const rawBody = await request.text();
      console.log(`[${requestId}] 원본 요청 본문:`, rawBody);
      body = JSON.parse(rawBody);
      console.log(`[${requestId}] 파싱된 요청 본문:`, JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error(`[${requestId}] 요청 본문 파싱 오류:`, parseError);
      return createErrorResponse(400, '유효하지 않은 JSON 형식의 요청 본문입니다.');
    }
    
    const { prompt, size = '1024x1024', style = 'vivid' } = body;
    
    // 입력 유효성 검사
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return createErrorResponse(400, '이미지 생성을 위한 프롬프트가 필요합니다.');
    }

    console.log(`이미지 생성 요청 - 프롬프트: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}, 크기: ${size}, 스타일: ${style}`);
    
    // OpenAI 클라이언트 초기화
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API 키가 환경 변수에 설정되지 않았습니다.');
      return createErrorResponse(500, '서버 구성 오류가 발생했습니다.');
    }

    console.log(`[${requestId}] OpenAI API 키 길이:`, apiKey.length);
    
    const openai = new OpenAI({
      apiKey: apiKey,
      timeout: 60000, // 60초 타임아웃
    });

    console.log(`[${requestId}] OpenAI API 클라이언트 초기화 완료`);
    
    // 이미지 생성 요청
    const generationStartTime = Date.now();
    let apiResponse;
    
    try {
      console.log(`[${requestId}] OpenAI API 호출 시작...`);
      apiResponse = await openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt.trim(),
        n: 1,
        size: size,
        style: style,
        quality: 'hd',
        response_format: 'url',
      });
      console.log(`[${requestId}] OpenAI API 호출 성공 (${Date.now() - generationStartTime}ms)`);
    } catch (apiError) {
      console.error(`[${requestId}] OpenAI API 호출 실패:`, apiError);
      throw new Error(`OpenAI API 호출 중 오류가 발생했습니다: ${apiError.message}`);
    }

    console.log(`[${requestId}] OpenAI API 응답 수신`);
    console.log(`[${requestId}] 응답 데이터:`, JSON.stringify(apiResponse, null, 2));

    if (!apiResponse || !apiResponse.data || !Array.isArray(apiResponse.data) || apiResponse.data.length === 0) {
      console.error(`[${requestId}] 유효하지 않은 응답 데이터:`, apiResponse);
      throw new Error('OpenAI API에서 유효한 응답을 받지 못했습니다.');
    }

    const imageUrl = apiResponse.data[0]?.url;
    if (!imageUrl) {
      console.error(`[${requestId}] 이미지 URL이 없습니다. 응답 데이터:`, apiResponse);
      throw new Error('생성된 이미지 URL을 받지 못했습니다.');
    }

    console.log(`[${requestId}] 이미지 생성 성공 - URL 길이:`, imageUrl.length);
    
    const responseData = {
      success: true,
      imageUrl: imageUrl,
      requestId: requestId
    };
    
    console.log(`[${requestId}] 최종 응답 데이터:`, JSON.stringify({
      ...responseData,
      imageUrl: `${imageUrl.substring(0, 50)}...` // URL의 일부만 로깅
    }, null, 2));
    
    const response = new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
          'X-Request-ID': requestId,
        },
      }
    );
    
    console.log(`[${requestId}] 응답 헤더:`, Object.fromEntries(response.headers.entries()));
    return response;
    
  } catch (error) {
    const errorId = `err-${Math.random().toString(36).substring(2, 8)}`;
    console.error(`[${requestId}] [${errorId}] 이미지 생성 중 오류 발생:`, error);
    
    // OpenAI API 오류 처리
    if (error instanceof OpenAI.APIError) {
      const errorDetails = {
        errorId,
        status: error.status,
        code: error.code,
        type: error.type,
        message: error.message,
        requestId
      };
      
      console.error(`[${requestId}] [${errorId}] OpenAI API 오류 상세:`, errorDetails);
      
      return createErrorResponse(
        error.status || 500,
        `OpenAI API 오류: ${error.message}`,
        process.env.NODE_ENV === 'development' ? errorDetails : { errorId }
      );
    }
    
    // 기타 오류 처리
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    console.error(`[${requestId}] [${errorId}] 처리되지 않은 오류:`, error);
    
    return createErrorResponse(
      500, 
      `이미지 생성 중 오류가 발생했습니다: ${errorMessage}`,
      process.env.NODE_ENV === 'development' ? { error: String(error), errorId } : { errorId }
    );
    
  } finally {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`[${requestId}] 요청 처리 완료 (${duration}ms)`);
    
    // 성공/실패 여부에 따른 추가 로깅
    if (duration > 10000) {
      console.warn(`[${requestId}] 경고: 요청 처리 시간이 10초를 초과했습니다 (${duration}ms)`);
    }
  }
}