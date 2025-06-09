import { OpenAI } from 'openai';

export const dynamic = 'force-dynamic'; // 이 줄을 추가하여 동적 라우팅을 활성화

export async function POST(request) {
  console.log('이미지 생성 요청 수신');
  
  try {
    const requestBody = await request.json();
    console.log('요청 본문:', JSON.stringify(requestBody, null, 2));
    
    const { prompt, size = '1024x1024', n = 1 } = requestBody;
    
    if (!prompt) {
      console.error('에러: 프롬프트가 제공되지 않음');
      return new Response(JSON.stringify({ 
        success: false,
        error: '프롬프트가 필요합니다.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('OpenAI 클라이언트 초기화 중...');
    console.log('API 키 존재 여부:', !!process.env.OPENAI_API_KEY);
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('에러: OpenAI API 키가 설정되지 않음');
      return new Response(JSON.stringify({
        success: false,
        error: '서버 구성 오류가 발생했습니다.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log('이미지 생성 요청 전송 중...');
    console.log('파라미터:', { prompt, n: parseInt(n, 10), size });
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: Math.min(parseInt(n, 10), 4), // 최대 4개로 제한
      size: size,
      quality: 'standard',
      style: 'vivid',
    });

    console.log('이미지 생성 성공');
    
    return new Response(JSON.stringify({
      success: true,
      data: response.data
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('이미지 생성 중 오류 발생:', error);
    console.error('스택 트레이스:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: '이미지 생성 중 오류가 발생했습니다.',
        details: {
          message: error.message,
          name: error.name,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      }), 
      {
        status: error.status || 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
