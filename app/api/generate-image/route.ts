import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/openai';

// CORS 헤더 설정
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-session-id',
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('Received request to generate image');
    
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { prompt } = body;

    if (!prompt) {
      console.error('No prompt provided');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Prompt is required' 
        }), 
        { 
          status: 400, 
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }

    console.log('Generating image with prompt:', prompt);
    const imageUrl = await generateImage(prompt);
    console.log('Generated image URL:', imageUrl);

    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error('Image generation API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate image';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
}