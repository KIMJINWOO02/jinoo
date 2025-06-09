import { Configuration, OpenAIApi } from 'openai';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { prompt, size = '1024x1024', n = 1 } = await request.json();
    
    // 입력 유효성 검사
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '유효한 프롬프트를 입력해주세요.' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 환경 변수 확인
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API 키가 설정되지 않았습니다.');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '서버 구성 오류가 발생했습니다.' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // OpenAI 클라이언트 초기화
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const openai = new OpenAIApi(configuration);

    // 이미지 생성 요청
    const response = await openai.createImage({
      prompt: prompt,
      n: Math.min(parseInt(n), 4), // 최대 4개
      size: size,
    });

    // 성공 응답
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: response.data.data 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('이미지 생성 오류:', error);
    
    // 오류 응답
    const status = error.response?.status || 500;
    let errorMessage = '이미지 생성 중 오류가 발생했습니다.';
    
    if (status === 401) {
      errorMessage = '인증 오류가 발생했습니다. API 키를 확인해주세요.';
    } else if (status === 429) {
      errorMessage = '요청 한도에 도달했습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
        } : undefined
      }),
      { 
        status: status,
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
