import { OpenAI } from 'openai';

export async function POST(request) {
  try {
    const { prompt, size = '1024x1024', n = 1 } = await request.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: '프롬프트가 필요합니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.images.generate({
      prompt,
      n: parseInt(n, 10),
      size,
    });

    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('이미지 생성 중 오류 발생:', error);
    return new Response(
      JSON.stringify({ 
        error: '이미지 생성 중 오류가 발생했습니다.',
        details: error.message 
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
