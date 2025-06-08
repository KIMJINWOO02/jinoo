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
  prompt: string,
  size: '1024x1024' | '512x512' | '256x256' = '1024x1024'
): Promise<string> => {
  try {
    const response = await openai.images.generate({
      model: 'dall-e-2',
      prompt: prompt,
      n: 1,
      size: size,
      response_format: 'url',
    });

    if (!response.data || !response.data[0] || !response.data[0].url) {
      throw new Error('No image URL received from OpenAI');
    }
    return response.data[0].url;
  } catch (error) {
    console.error('Image generation error:', error);
    throw new Error('Failed to generate image');
  }
};