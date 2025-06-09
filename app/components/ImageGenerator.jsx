'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, AlertCircle, ImagePlus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const imageContainerRef = useRef(null);
  const { toast } = useToast();
  
  // 이미지 컨테이너 높이 조정
  useEffect(() => {
    if (imageContainerRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        // 이미지 컨테이너의 최소 높이를 뷰포트 높이의 60%로 설정
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
      setError('이미지 생성을 위한 설명을 입력해주세요.');
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
      setImages(responseData.data || []);
      
      // 성공 토스트 메시지
      toast({
        title: '이미지 생성 완료!',
        description: '이미지가 성공적으로 생성되었습니다.',
        variant: 'default',
      });
      
    } catch (err) {
      console.error('이미지 생성 오류:', err);
      
      let errorMessage = '이미지 생성 중 오류가 발생했습니다.';
      
      if (err.message.includes('429')) {
        errorMessage = '요청 한도에 도달했습니다. 잠시 후 다시 시도해주세요.';
      } else if (err.message.includes('401')) {
        errorMessage = '인증 오류가 발생했습니다. 관리자에게 문의해주세요.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      // 에러 토스트 메시지
      toast({
        title: '오류 발생',
        description: errorMessage,
        variant: 'destructive',
      });
      
    } finally {
      setIsLoading(false);
      setProgress('');
      setTimeout(() => setIsGenerating(false), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
          <CardTitle className="text-2xl md:text-3xl font-bold">
            AI 이미지 생성기
          </CardTitle>
          <p className="text-blue-100 mt-2">
            상상하는 이미지를 문장으로 설명해보세요. AI가 그림으로 만들어드립니다.
          </p>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={generateImage} className="space-y-6">
            <div className="flex flex-col space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="예: 고양이가 우주를 여행하는 초현실적인 일러스트, 4k, 상세한 질감"
                  className="w-full h-14 px-5 pr-24 text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  disabled={isLoading || !prompt.trim()}
                  className="absolute right-2 top-2 h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    <>
                      <ImagePlus className="mr-2 h-4 w-4" />
                      생성하기
                    </>
                  )}
                </Button>
              </div>
              
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3 transition-all">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">오류 발생</p>
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              )}
              
              {progress && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">{progress}</p>
                </div>
              )}
            </div>
          </form>

          <div 
            ref={imageContainerRef}
            className={`mt-8 transition-all duration-300 ${isGenerating ? 'opacity-50' : 'opacity-100'}`}
          >
            {images.length > 0 ? (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">생성된 이미지</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="text-sm"
                  >
                    다시 생성하기
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  {images.map((img, index) => (
                    <div 
                      key={index}
                      className="relative group rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-all hover:shadow-xl hover:border-blue-500"
                    >
                      <div className="aspect-square w-full bg-gray-100 dark:bg-gray-800">
                        <img
                          src={img.url}
                          alt={`${prompt} - 생성된 이미지 ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-image.jpg';
                          }}
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                        <div className="w-full">
                          <p className="text-white text-sm font-medium line-clamp-2">
                            {prompt}
                          </p>
                          <div className="mt-3 flex justify-end">
                            <a 
                              href={img.url} 
                              download={`ai-generated-${Date.now()}-${index}.png`}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              다운로드
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-24 h-24 md:w-32 md:h-32 text-gray-300 dark:text-gray-600 mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">아직 생성된 이미지가 없어요</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                  위에 상상하는 이미지에 대한 설명을 입력하고 '생성하기' 버튼을 눌러보세요.
                  <span className="block mt-2 text-sm text-gray-400">예시: "해변가의 황금빛 일몰, 파도가 부드럽게 밀려오는 모습, 고품질 사진"</span>
                </p>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 p-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            이미지 생성에는 약 10-30초가 소요될 수 있습니다. 생성된 이미지는 상업적 용도로 자유롭게 사용하실 수 있습니다.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
