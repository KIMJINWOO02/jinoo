'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, ImagePlus, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const imageContainerRef = useRef(null);
  
  // 이미지 컨테이너 높이 조정
  useEffect(() => {
    if (imageContainerRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        const minHeight = window.innerHeight * 0.6;
        imageContainerRef.current.style.minHeight = `${minHeight}px`;
      });
      
      resizeObserver.observe(imageContainerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  const generateImage = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast.error('이미지 생성을 위한 설명을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setIsGenerating(true);
    setError('');
    setImages([]);
    setProgress('이미지 생성 요청을 준비 중입니다...');

    try {
      setProgress('OpenAI API에 요청을 보내는 중...');
      
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

      setProgress('이미지를 불러오는 중...');
      
      if (responseData.data && Array.isArray(responseData.data)) {
        setImages(responseData.data);
        toast.success('이미지 생성 완료!', {
          description: '이미지가 성공적으로 생성되었습니다.'
        });
      } else {
        throw new Error('유효하지 않은 응답 형식입니다.');
      }
      
    } catch (err) {
      console.error('이미지 생성 오류:', err);
      
      let errorMessage = '이미지 생성 중 오류가 발생했습니다.';
      
      if (err.message.includes('429')) {
        errorMessage = '요청 한도에 도달했습니다. 잠시 후 다시 시도해주세요.';
      } else if (err.message.includes('401')) {
        errorMessage = '인증 오류가 발생했습니다. 관리자에게 문의해주세요.';
      } else if (err.message.includes('timeout') || err.message.includes('시간 초과')) {
        errorMessage = '요청 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.';
      }
      
      setError(errorMessage);
      toast.error(`이미지 생성 실패: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
      setProgress('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-white dark:bg-gray-800 shadow-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold mb-3">AI 이미지 생성기</h1>
              <p className="text-indigo-100 text-lg">
                상상하는 이미지를 문장으로 설명해보세요. AI가 그림으로 만들어드립니다.
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 md:p-8">
            <form onSubmit={generateImage} className="space-y-6">
              <div className="relative">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="예: 고양이가 우주를 여행하는 초현실적인 일러스트, 4k, 상세한 질감"
                      className="w-full h-14 px-5 pr-36 text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      disabled={isLoading}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isLoading || !prompt.trim()}
                    className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      <>
                        <ImagePlus className="mr-2 h-5 w-5" />
                        생성하기
                      </>
                    )}
                  </Button>
                </div>
                
                {error && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">오류 발생</p>
                      <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                  </div>
                )}
                
                {progress && (
                  <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center gap-3">
                    <Loader2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">{progress}</p>
                  </div>
                )}
              </div>
            </form>

            <div 
              ref={imageContainerRef}
              className={`mt-10 transition-all duration-300 ${isGenerating ? 'opacity-50' : 'opacity-100'}`}
            >
              {images.length > 0 ? (
                <div className="space-y-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">생성된 이미지</h3>
                    <div className="flex gap-3 w-full sm:w-auto">
                      <Button 
                        variant="outline" 
                        size="lg"
                        onClick={() => {
                          setPrompt('');
                          setImages([]);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="flex-1 sm:flex-none"
                      >
                        <ImagePlus className="mr-2 h-4 w-4" />
                        새로 생성
                      </Button>
                      {images[0]?.url && (
                        <Button 
                          variant="default" 
                          size="lg"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = images[0].url;
                            link.download = `ai-image-${Date.now()}.png`;
                            link.click();
                          }}
                          className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          이미지 저장
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {images.map((image, index) => (
                      <div 
                        key={index} 
                        className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 transition-all hover:shadow-xl"
                      >
                        <div className="p-1 bg-gray-100 dark:bg-gray-700">
                          <img
                            src={image.url}
                            alt={image.revised_prompt || `생성된 이미지 ${index + 1}`}
                            className="w-full h-auto rounded-lg"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/placeholder-image.jpg';
                            }}
                          />
                        </div>
                        {image.revised_prompt && (
                          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {image.revised_prompt}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-24 h-24 mb-6 text-gray-300 dark:text-gray-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    이미지를 생성해보세요
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    상단의 입력창에 원하는 이미지에 대한 설명을 입력하고 "생성하기" 버튼을 클릭하세요.
                    AI가 여러분의 상상을 그림으로 만들어드립니다.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
