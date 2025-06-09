'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');

  const generateImage = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      setError('이미지 생성을 위한 설명을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setIsGenerating(true);
    setError('');
    setImages([]);
    setGenerationProgress('이미지 생성 요청을 보내는 중...');

    try {
      setGenerationProgress('OpenAI API에 요청을 보내는 중...');
      
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

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('API 응답 오류:', responseData);
        throw new Error(
          responseData.error || 
          `이미지 생성에 실패했습니다. (상태 코드: ${response.status})`
        );
      }


      if (!responseData.success) {
        throw new Error(responseData.error || '알 수 없는 오류가 발생했습니다.');
      }

      setImages(responseData.data || []);
      setGenerationProgress('이미지 생성 완료!');
      
    } catch (err) {
      console.error('이미지 생성 중 오류 발생:', err);
      
      let errorMessage = '이미지 생성 중 오류가 발생했습니다.';
      
      if (err.message.includes('429')) {
        errorMessage = '요청 한도에 도달했습니다. 잠시 후 다시 시도해주세요.';
      } else if (err.message.includes('401')) {
        errorMessage = '인증 오류가 발생했습니다. 관리자에게 문의해주세요.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setGenerationProgress('');
      
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsGenerating(false), 2000); // 애니메이션을 위해 약간의 지연
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
          AI 이미지 생성기
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          원하는 이미지를 설명하면 AI가 생성해줍니다. 자세하게 설명할수록 더 좋은 결과를 얻을 수 있습니다.
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={generateImage} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="예: 고양이가 우주를 여행하는 초현실적인 일러스트"
                className="w-full h-12 px-4 text-base border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                '이미지 생성'
              )}
            </Button>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
          
          {generationProgress && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {generationProgress}
              </p>
            </div>
          )}
        </form>

        <div className="mt-8">
          {images.length > 0 ? (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">생성된 이미지</h3>
              <div className="grid grid-cols-1 gap-6">
                {images.map((img, index) => (
                  <div 
                    key={index} 
                    className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-all hover:shadow-lg"
                  >
                    <div className="aspect-square w-full">
                      <img
                        src={img.url}
                        alt={`생성된 이미지 ${index + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <p className="text-white text-sm line-clamp-2">
                        {prompt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-12 text-center">
              <div className="mx-auto h-24 w-24 text-gray-300 dark:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">이미지가 아직 없어요</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                위에 설명을 입력하고 이미지를 생성해보세요.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
