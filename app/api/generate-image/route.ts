import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// 환경 변수 로드 확인
console.log('=== 환경 변수 로드 상태 ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '*** (설정됨)' : '설정되지 않음');

// 이미지 생성 API 핸들러
export async function POST(request: Request) {
  console.log('\n=== 이미지 생성 요청 수신 ===');
  
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  try {
    // 요청 본문 파싱
    let body;
    try {
      body = await request.json();
      console.log('요청 본문:', JSON.stringify(body, null, 2));
    } catch (error) {
      console.error('요청 본문 파싱 오류:', error);
      return NextResponse.json(
        { success: false, error: '유효하지 않은 JSON 형식의 요청 본문입니다.' },
        { status: 400, headers }
      );
    }

    const { prompt, n = 1, size = '1024x1024' } = body;

    // 입력 유효성 검사
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '이미지 생성을 위한 프롬프트가 필요합니다.' },
        { status: 400, headers }
      );
    }

    // API 키 확인
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('오류: OPENAI_API_KEY가 설정되지 않았습니다.');
      return NextResponse.json(
        { success: false, error: '서버 구성 오류가 발생했습니다.' },
        { status: 500, headers }
      );
    }

    console.log('OpenAI API 호출 시작...');
    console.log(`프롬프트: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`);
    
    // OpenAI 클라이언트 초기화
    const openai = new OpenAI({
      apiKey: apiKey,
      timeout: 30000, // 30초 타임아웃
    });

    // 이미지 생성 요청
    try {
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt.trim(),
        n: Math.min(parseInt(n), 4),
        size: size,
        quality: 'hd',
        response_format: 'url',
      });

      console.log('OpenAI API 응답 수신');
      
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        throw new Error('OpenAI API에서 유효한 응답을 받지 못했습니다.');
      }

      // 성공 응답
      const result = {
        success: true,
        data: response.data.map(img => ({
          url: img.url,
          revised_prompt: img.revised_prompt || prompt
        }))
      };

      console.log('이미지 생성 성공!');
      return NextResponse.json(result, { status: 200, headers });
      
    } catch (error) {
      console.error('OpenAI API 호출 오류:', error);
      
      let statusCode = 500;
      let errorMessage = '이미지 생성 중 오류가 발생했습니다.';
      
      // 오류 유형에 따른 처리
      if (error.message.includes('401') || error.message.includes('인증')) {
        statusCode = 401;
        errorMessage = 'API 인증에 실패했습니다. API 키를 확인해주세요.';
      } else if (error.message.includes('429')) {
        statusCode = 429;
        errorMessage = '요청 한도에 도달했습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.message.includes('timeout') || error.message.includes('시간 초과')) {
        statusCode = 504;
        errorMessage = '요청 시간이 초과되었습니다. 네트워크 상태를 확인하고 다시 시도해주세요.';
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: statusCode, headers }
      );
    }
    
  } catch (error) {
    console.error('처리 중 예상치 못한 오류 발생:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '처리 중 예상치 못한 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}