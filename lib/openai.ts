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
  size: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024',
  style: 'vivid' | 'natural' = 'vivid'
): Promise<string> => {
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: size,
      style: style,
      quality: 'standard',
    });

    return response.data[0]?.url || '';
  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error('Failed to generate image');
  }
};