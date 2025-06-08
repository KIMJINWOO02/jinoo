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
export const generateImage = async (
  prompt: string
): Promise<string> => {
  console.log('Starting image generation with prompt:', prompt);
  
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('프롬프트는 필수이며, 비어있을 수 없습니다.');
  }

  try {
    console.log('Sending request to OpenAI API...');
    const response = await openai.images.generate({
      model: 'dall-e-2',
      prompt: prompt.trim(),
      n: 1,
      size: '1024x1024',
      response_format: 'url',
    });

    console.log('OpenAI API Response:', JSON.stringify(response, null, 2));

    if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
      throw new Error('OpenAI API에서 유효한 응답을 받지 못했습니다.');
    }

    const imageUrl = response.data[0]?.url;

    if (!imageUrl) {
      throw new Error('OpenAI API에서 이미지 URL을 받지 못했습니다.');
    }

    console.log('Successfully generated image URL:', imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('Image generation error:', error);
    throw new Error('Failed to generate image');
  }
};