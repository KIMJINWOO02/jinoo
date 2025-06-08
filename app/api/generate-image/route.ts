import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Generate image using DALL-E
    const imageUrl = await generateImage(prompt);

    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    return NextResponse.json({ 
      success: true,
      imageUrl 
    });
  } catch (error) {
    console.error('Image generation API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate image';
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}