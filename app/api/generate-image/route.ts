import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/openai';
import { saveGeneratedImage } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { prompt, size, style } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Generate image using DALL-E
    const imageUrl = await generateImage(prompt, size, style);

    // Get user ID (session-based for now)
    const sessionId = request.headers.get('x-session-id') || 'anonymous';

    // Save generated image to database
    try {
      await saveGeneratedImage({
        prompt,
        imageUrl,
        size: size || '1024x1024',
        style,
        userId: sessionId,
      });
    } catch (error) {
      console.warn('Failed to save generated image to database:', error);
      // Continue even if database save fails
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Image generation API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}