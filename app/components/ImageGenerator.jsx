'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');

  const generateImage = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('이미지 생성을 위한 설명을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          n: 1,
          size: '1024x1024',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '이미지 생성에 실패했습니다.');
      }

      const data = await response.json();
      setImages(data);
    } catch (err) {
      console.error('Error generating image:', err);
      setError(err.message || '이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>AI 이미지 생성기</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={generateImage} className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="생성할 이미지에 대한 설명을 입력하세요..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                '생성하기'
              )}
            </Button>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>

        <div className="mt-6 grid gap-4">
          {images.map((img, index) => (
            <div key={index} className="relative aspect-square overflow-hidden rounded-lg">
              <img
                src={img.url}
                alt={`생성된 이미지 ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
