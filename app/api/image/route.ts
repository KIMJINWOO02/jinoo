import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/openai';

interface ImageRequest {
  prompt: string;
  size?: '1024x1024' | '512x512' | '256x256';
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in .env.local.' },
        { status: 500 }
      );
    }

    const { prompt, size = '1024x1024' } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const imageUrl = await generateImage(prompt, size);
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
