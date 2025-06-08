'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wand2, ImageIcon, Trash2, Download, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/loading-spinner';
import { cn } from '@/lib/utils';

// 타입 정의
type ImageSize = '1024x1024' | '1792x1024' | '1024x1792';
type StyleType = 'vivid' | 'natural';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  size: ImageSize;
  style: StyleType;
  timestamp: Date;
}

interface ImageGeneratorProps {
  sessionId: string;
}

export function ImageGenerator({ sessionId }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<ImageSize>('1024x1024');
  const [style, setStyle] = useState<StyleType>('vivid');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // 마지막 요청 시간 추적을 위한 ref
  const lastRequestTime = useRef<number>(0);
  // 재시도 횟수 추적
  const retryCount = useRef<number>(0);
  const MAX_RETRIES = 2; // 최대 재시도 횟수
  const RATE_LIMIT_DELAY = 3000; // 3초 대기

  // 이미지 생성 핸들러
  const generateImage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!prompt.trim()) {
      setError('이미지 생성을 위한 설명을 입력해주세요.');
      return;
    }
    
    if (isGenerating) return;
    
    // 요청 간 최소 지연 시간 확인 (과도한 요청 방지)
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;
    const minDelay = 2000; // 2초 간격 요청 제한
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // 요청 간격이 너무 짧으면 대기
      if (timeSinceLastRequest < minDelay) {
        const delay = minDelay - timeSinceLastRequest;
        console.log(`요청 간격이 너무 짧아 ${delay}ms 대기합니다.`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const startTime = Date.now();
      console.log('이미지 생성 요청 시작...');
      
      // API 요청
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          size,
          style,
        }),
      });

      const endTime = Date.now();
      console.log(`API 응답 수신 (${endTime - startTime}ms) - 상태 코드:`, response.status);
      
      let data;
      try {
        data = await response.json();
        console.log('API 응답 데이터:', data);
      } catch (parseError) {
        console.error('응답 파싱 오류:', parseError);
        const textResponse = await response.text();
        console.error('원본 응답 텍스트:', textResponse);
        throw new Error(`서버 응답을 처리할 수 없습니다: ${textResponse.substring(0, 200)}`);
      }

      // 429 Too Many Requests 오류 처리
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '3', 10) * 1000;
        
        if (retryCount.current < MAX_RETRIES) {
          retryCount.current += 1;
          console.log(`요청 한도 초과. ${retryAfter/1000}초 후 재시도 (${retryCount.current}/${MAX_RETRIES})...`);
          
          // 사용자에게 알림
          toast.warning(`요청이 너무 많습니다. ${retryAfter/1000}초 후 다시 시도합니다...`);
          
          // 지연 후 재시도
          await new Promise(resolve => setTimeout(resolve, retryAfter));
          return generateImage(e);
        } else {
          throw new Error('요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
        }
      }

      if (!response.ok) {
        const errorMessage = data?.error || `서버 오류 (${response.status})`;
        console.error('API 오류:', errorMessage);
        throw new Error(errorMessage);
      }

      if (!data.success) {
        console.error('API 실패 응답:', data);
        throw new Error(data.error || '이미지 생성에 실패했습니다');
      }

      if (!data.imageUrl) {
        console.error('이미지 URL 누락:', data);
        throw new Error('생성된 이미지 URL을 받지 못했습니다');
      }

      // 이미지 생성 성공
      console.log('이미지 생성 성공 - URL 길이:', data.imageUrl.length);
      lastRequestTime.current = Date.now(); // 마지막 요청 시간 업데이트
      retryCount.current = 0; // 재시도 카운터 초기화
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: data.imageUrl,
        prompt: prompt.trim(),
        size,
        style,
        timestamp: new Date(),
      };

      setGeneratedImages(prev => [newImage, ...prev].slice(0, 10)); // 최대 10개 이미지 유지
      setPrompt(''); // 프롬프트 초기화
      toast.success('이미지가 성공적으로 생성되었습니다!');
    } catch (error) {
      console.error('이미지 생성 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      toast.error(`이미지 생성 실패: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, size, style, isGenerating, sessionId]);

  const openImageInNewTab = (imageUrl: string) => {
    window.open(imageUrl, '_blank', 'noopener,noreferrer');
  };

  // 이미지 다운로드 핸들러
  const handleDownload = async (imageUrl: string, imageId: string) => {
    try {
      toast.info('이미지를 다운로드하고 있습니다...');
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-image-${imageId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('이미지가 다운로드되었습니다!');
    } catch (error) {
      console.error('이미지 다운로드 오류:', error);
      toast.error('이미지 다운로드에 실패했습니다.');
    }
  };

  const removeImage = (imageId: string) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== imageId));
    toast.success('이미지가 제거되었습니다.');
  };

  const getSizeLabel = (size: ImageSize) => {
    switch (size) {
      case '1024x1024': return '정사각형';
      case '1792x1024': return '가로형';
      case '1024x1792': return '세로형';
      default: return size;
    }
  };

  const getStyleLabel = (style: string) => {
    switch (style) {
      case 'vivid': return '생생한';
      case 'natural': return '자연스러운';
      default: return style;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <Wand2 className="w-6 h-6 text-primary" />
            AI 이미지 생성기
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={generateImage} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="prompt" className="text-base font-medium">
                이미지 설명
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <Textarea
                  id="prompt"
                  placeholder="생성할 이미지를 상세히 설명해주세요. 예) 해질녘의 바다 풍경, 고양이가 소파에서 낮잠 자는 모습"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isGenerating}
                  className="min-h-[120px] text-base"
                  rows={4}
                />
                {isGenerating && (
                  <div className="absolute right-3 top-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                원하는 이미지를 자세히 설명해주세요. 구체적일수록 좋은 결과를 얻을 수 있습니다.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">이미지 크기</Label>
                <Select 
                  value={size} 
                  onValueChange={(value) => setSize(value as ImageSize)}
                  disabled={isGenerating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="이미지 크기 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1024x1024">정사각형 (1024x1024)</SelectItem>
                    <SelectItem value="1792x1024">와이드 (1792x1024)</SelectItem>
                    <SelectItem value="1024x1792">세로 (1024x1792)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">스타일</Label>
                <Select 
                  value={style} 
                  onValueChange={(value) => setStyle(value as StyleType)}
                  disabled={isGenerating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="스타일 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vivid">생동감 있는 (Vivid)</SelectItem>
                    <SelectItem value="natural">자연스러운 (Natural)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex flex-col space-y-4 pt-2">
              {error && (
                <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  <div className="font-medium">오류 발생</div>
                  <div className="mt-1">{error}</div>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full py-6 text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                disabled={isGenerating || !prompt.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    이미지 생성 중...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    이미지 생성하기 (DALL·E 3)
                  </>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                한 번에 하나의 이미지만 생성할 수 있습니다. 생성에는 약 10-20초가 소요될 수 있습니다.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <div className="flex-1 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <ImageIcon className="w-5 h-5" />
            <span>생성된 이미지들</span>
            {generatedImages.length > 0 && (
              <span className="text-sm text-muted-foreground">({generatedImages.length}개)</span>
            )}
          </h3>
          {generatedImages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setGeneratedImages([]);
                toast.success('모든 이미지가 제거되었습니다.');
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              전체 삭제
            </Button>
          )}
        </div>
        
        {generatedImages.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto mb-4 p-4 bg-purple-500/10 rounded-full w-fit">
              <ImageIcon className="w-12 h-12 text-purple-500" />
            </div>
            <h4 className="text-lg font-medium mb-2">아직 생성된 이미지가 없습니다</h4>
            <p className="text-muted-foreground mb-6">
              위에서 프롬프트를 입력하여 AI가 생성한 멋진 이미지를 만들어 보세요!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
              <Button 
                variant="outline" 
                className="text-left justify-start h-auto p-4"
                onClick={() => setPrompt('석양이 지는 바다 위의 범선, 디지털 아트 스타일')}
              >
                <div>
                  <div className="font-medium">바다 풍경</div>
                  <div className="text-sm text-muted-foreground">석양과 범선이 있는 바다</div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="text-left justify-start h-auto p-4"
                onClick={() => setPrompt('미래도시의 네온사인이 빛나는 밤거리, 사이버펑크 스타일')}
              >
                <div>
                  <div className="font-medium">사이버펑크 도시</div>
                  <div className="text-sm text-muted-foreground">네온사인이 빛나는 미래도시</div>
                </div>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedImages.map((image) => (
              <Card key={image.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="aspect-square relative">
                  <Image
                    src={image.url}
                    alt={image.prompt}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(image.url, image.id);
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      다운로드
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(image.url, '_blank', 'noopener,noreferrer');
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      열기
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-foreground line-clamp-2 mb-2">
                    {image.prompt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center px-2 py-1 bg-muted rounded-full">
                      {getSizeLabel(image.size)}
                    </span>
                    <span className="capitalize">
                      {getStyleLabel(image.style)}
                    </span>
                    <span>
                      {new Date(image.timestamp).toLocaleString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}