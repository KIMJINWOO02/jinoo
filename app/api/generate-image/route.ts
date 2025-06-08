import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/openai';

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

    // Save generated image to local storage
    localStorage.setItem(`image-${sessionId}`, imageUrl);

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Image generation API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}