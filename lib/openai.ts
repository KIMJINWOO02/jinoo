import OpenAI from 'openai';

// OpenAI API 키 검증
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey || apiKey === 'your_openai_api_key_here') {
  throw new Error(
    'OPENAI_API_KEY is not configured. Please set your OpenAI API key in .env.local file.'
  );
}

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: process.env.NEXT_PUBLIC_OPENAI_API_BASE || 'https://api.openai.com/v1',
  dangerouslyAllowBrowser: true
});

/**
 * Generate a chat completion using OpenAI GPT
 */
export const generateChatCompletion = async (
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating chat completion:', error);
    throw new Error('Failed to generate chat response');
  }
};

/**
 * Generate an image using DALL-E
 */
interface ImageGenerationOptions {
  prompt: string;
  model?: 'dall-e-2' | 'dall-e-3';
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
}

export const generateImage = async (
  prompt: string,
  options: Omit<ImageGenerationOptions, 'prompt'> = {}
): Promise<string> => {
  const {
    model = 'dall-e-3',
    size = '1024x1024',
    quality = 'hd',
    style = 'vivid'
  } = options;

  console.log('Starting image generation with options:', {
    prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
    model,
    size,
    quality,
    style
  });
  
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('프롬프트는 필수이며, 비어있을 수 없습니다.');
  }

  // DALL-E 3는 최대 4000자까지 지원
  const trimmedPrompt = prompt.trim().substring(0, 4000);

  try {
    console.log('Sending request to OpenAI API...');
    
    const requestBody: any = {
      model,
      prompt: trimmedPrompt,
      n: 1,
      size,
      response_format: 'url',
    };

    // DALL-E 3 전용 옵션
    if (model === 'dall-e-3') {
      requestBody.quality = quality;
      requestBody.style = style;
    }

    console.log('OpenAI API Request:', JSON.stringify(requestBody, null, 2));
    
    const startTime = Date.now();
    const response = await openai.images.generate(requestBody as any);
    const endTime = Date.now();
    
    console.log(`OpenAI API Response (${endTime - startTime}ms):`, JSON.stringify(response, null, 2));

    if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
      throw new Error('OpenAI API에서 유효한 응답을 받지 못했습니다.');
    }

    const imageUrl = response.data[0]?.url;

    if (!imageUrl) {
      console.error('No image URL in response data:', response);
      throw new Error('OpenAI API에서 이미지 URL을 받지 못했습니다.');
    }

    console.log('Successfully generated image URL:', imageUrl);
    return imageUrl;
  } catch (error: any) {
    console.error('Image generation error:', {
      message: error.message,
      status: error.status,
      code: error.code,
      response: error.response?.data || 'No response data'
    });
    
    // OpenAI API 오류 메시지 추출
    let errorMessage = '이미지 생성 중 오류가 발생했습니다.';
    
    if (error.response?.data?.error?.message) {
      errorMessage = `OpenAI 오류: ${error.response.data.error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }
};