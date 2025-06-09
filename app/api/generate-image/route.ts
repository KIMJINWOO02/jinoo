import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// 환경 변수 로드 확인
console.log('=== 환경 변수 로드 상태 ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '*** (설정됨)' : '설정되지 않음');

// CORS 헤더 설정
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

// 응답 헬퍼 함수
const createResponse = (data: any, status: number = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
};

// 이미지 생성 API 핸들러
export async function POST(request: Request) {
  console.log('\n=== 이미지 생성 요청 수신 ===');
  
  try {
    // 요청 본문 파싱
    let body;
    try {
      const rawBody = await request.text();
      console.log('원본 요청 본문:', rawBody);
      body = JSON.parse(rawBody);
      console.log('파싱된 요청 본문:', JSON.stringify(body, null, 2));
    } catch (error) {
      console.error('요청 본문 파싱 오류:', error);
      return createResponse(
        { 
          success: false, 
          error: '유효하지 않은 JSON 형식의 요청 본문입니다.',
          details: error.message 
        },
        400
      );
    }

    const { prompt, n = 1, size = '1024x1024', style = 'vivid' } = body;

    // 입력 유효성 검사
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return createResponse(
        { 
          success: false, 
          error: '이미지 생성을 위한 프롬프트가 필요합니다.' 
        },
        400
      );
    }

    // API 키 확인
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const errorMsg = '오류: OPENAI_API_KEY가 설정되지 않았습니다.';
      console.error(errorMsg);
      return createResponse(
        { 
          success: false, 
          error: '서버 구성 오류가 발생했습니다.',
          details: process.env.NODE_ENV === 'development' ? errorMsg : undefined
        },
        500
      );
    }

    console.log('OpenAI API 호출 시작...');
    const trimmedPrompt = prompt.trim();
    console.log(`프롬프트: ${trimmedPrompt.substring(0, 100)}${trimmedPrompt.length > 100 ? '...' : ''}`);
    
    try {
      // OpenAI 클라이언트 초기화
      console.log('OpenAI 클라이언트 초기화 중...');
      const openai = new OpenAI({
        apiKey: apiKey,
        timeout: 60000, // 60초 타임아웃으로 증가
        maxRetries: 2,  // 재시도 횟수 추가
      });
      console.log('OpenAI 클라이언트 초기화 완료');

      // 이미지 생성 요청 파라미터
      const requestParams = {
        model: 'dall-e-3',
        prompt: `${trimmedPrompt} - ${style === 'vivid' ? '생동감 있는' : '자연스러운'} 스타일`,
        n: Math.min(parseInt(n), 2), // 최대 2개로 제한
        size: size,
        quality: 'hd' as const,
        response_format: 'url' as const,
      };

      console.log('OpenAI API 호출 파라미터:', JSON.stringify({
        ...requestParams,
        prompt: requestParams.prompt.substring(0, 100) + (requestParams.prompt.length > 100 ? '...' : '')
      }, null, 2));

      // API 호출
      console.log('OpenAI API에 요청을 보내는 중...');
      const startTime = Date.now();
      const response = await openai.images.generate({
        ...requestParams,
        prompt: requestParams.prompt // 전체 프롬프트 전송
      });
      const endTime = Date.now();

      console.log(`OpenAI API 응답 수신 (${endTime - startTime}ms):`, JSON.stringify({
        ...response,
        data: response.data?.map(d => ({
          ...d,
          url: d.url ? `${d.url.substring(0, 50)}...` : '없음'
        }))
      }, null, 2));
      
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        const errorMsg = 'OpenAI API에서 유효한 응답을 받지 못했습니다.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      // 응답 데이터 유효성 검사
      const validImages = response.data.filter(img => {
        const isValid = img && typeof img.url === 'string' && img.url.startsWith('http');
        if (!isValid) {
          console.error('유효하지 않은 이미지 데이터:', img);
        }
        return isValid;
      });

      if (validImages.length === 0) {
        const errorMsg = '생성된 이미지 URL을 찾을 수 없습니다.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      // 성공 응답
      const result = {
        success: true,
        data: validImages.map(img => ({
          url: img.url,
          revised_prompt: img.revised_prompt || trimmedPrompt
        }))
      };

      console.log('이미지 생성 성공!');
      return createResponse(result, 200);
      
    } catch (error) {
      console.error('OpenAI API 호출 오류:', {
        message: error.message,
        code: error.code,
        status: error.status,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers ? Object.fromEntries(
            Object.entries(error.response.headers).map(([k, v]) => [k, String(v)])
          ) : 'No headers',
          data: error.response.data
        } : 'No response',
        stack: error.stack
      });
      
      let statusCode = 500;
      let errorMessage = '이미지 생성 중 오류가 발생했습니다.';
      
      // 오류 유형에 따른 처리
      if (error.message.includes('401') || error.message.includes('인증')) {
        statusCode = 401;
        errorMessage = 'API 인증에 실패했습니다. 관리자에게 문의해주세요.';
      } else if (error.message.includes('429')) {
        statusCode = 429;
        errorMessage = '요청 한도에 도달했습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.message.includes('timeout') || error.message.includes('시간 초과')) {
        statusCode = 504;
        errorMessage = '요청 시간이 초과되었습니다. 네트워크 상태를 확인하고 다시 시도해주세요.';
      } else if (error.message.includes('content policy')) {
        statusCode = 400;
        errorMessage = '생성 요청이 콘텐츠 정책에 위반될 수 있습니다. 다른 프롬프트로 시도해주세요.';
      }
      
      return createResponse(
        { 
          success: false, 
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        statusCode
      );
    }
    
  } catch (error) {
    console.error('처리 중 예상치 못한 오류 발생:', error);
    return createResponse(
      { 
        success: false, 
        error: '처리 중 예상치 못한 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      500
    );
  }
}

// OPTIONS 메서드 핸들러 (CORS 사전 요청용)
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      'Access-Control-Max-Age': '86400', // 24시간 동안 프리플라이트 캐시
    }
  });
}