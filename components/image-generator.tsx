'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Download, Wand2, Image as ImageIcon, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/loading-spinner';

interface ImageGeneratorProps {
  sessionId: string;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  size: string;
  style: string;
  timestamp: Date;
}

export function ImageGenerator({ sessionId }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<'1024x1024' | '1792x1024' | '1024x1792'>('1024x1024');
  const [style, setStyle] = useState<'vivid' | 'natural'>('vivid');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  const generateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    toast.info('AI가 이미지를 생성하고 있습니다...', {
      duration: 10000,
    });

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          size,
          style,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const data = await response.json();
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: data.imageUrl,
        prompt: prompt.trim(),
        size,
        style,
        timestamp: new Date(),
      };

      setGeneratedImages(prev => [newImage, ...prev]);
      setPrompt('');
      toast.success('이미지가 성공적으로 생성되었습니다!');
    } catch (error) {
      console.error('Error generating image:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다';
      
      if (errorMessage.includes('OPENAI_API_KEY')) {
        toast.error('OpenAI API 키가 설정되지 않았습니다. .env.local 파일을 확인해 주세요.');
      } else {
        toast.error('이미지 생성에 실패했습니다. 다시 시도해 주세요.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async (imageUrl: string, prompt: string) => {
    try {
      toast.info('이미지를 다운로드하고 있습니다...');
      
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-generated-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('이미지가 다운로드되었습니다!');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('이미지 다운로드에 실패했습니다.');
    }
  };

  const openImageInNewTab = (imageUrl: string) => {
    window.open(imageUrl, '_blank');
  };

  const removeImage = (imageId: string) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== imageId));
    toast.success('이미지가 제거되었습니다.');
  };

  const getSizeLabel = (size: string) => {
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
    <div className="flex flex-col h-full">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wand2 className="w-5 h-5 text-purple-500" />
            <span>AI 이미지 생성</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={generateImage} className="space-y-6">
            <div>
              <Label htmlFor="prompt" className="text-sm font-medium">
                프롬프트 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="생성할 이미지를 자세히 설명해 주세요... (예: 석양이 지는 바다 위의 범선, 디지털 아트 스타일)"
                disabled={isGenerating}
                className="mt-2"
                maxLength={1000}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {prompt.length}/1000 문자 - 구체적이고 상세한 설명일수록 더 좋은 결과를 얻을 수 있습니다
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium">이미지 크기</Label>
                <Select value={size} onValueChange={setSize} disabled={isGenerating}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1024x1024">정사각형 (1024×1024)</SelectItem>
                    <SelectItem value="1792x1024">가로형 (1792×1024)</SelectItem>
                    <SelectItem value="1024x1792">세로형 (1024×1792)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium">스타일</Label>
                <RadioGroup 
                  value={style} 
                  onValueChange={setStyle} 
                  className="mt-2 flex space-x-6" 
                  disabled={isGenerating}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="vivid" id="vivid" />
                    <Label htmlFor="vivid" className="text-sm">생생한 (더 드라마틱하고 화려함)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="natural" id="natural" />
                    <Label htmlFor="natural" className="text-sm">자연스러운 (더 사실적이고 차분함)</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            
            <Button 
              type="submit" 
              disabled={!prompt.trim() || isGenerating} 
              className="w-full h-12"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <LoadingSpinner size="sm\" className="mr-2" />
                  이미지 생성 중... (약 10-30초 소요)
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  이미지 생성하기
                </>
              )}
            </Button>
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
                  <img
                    src={image.url}
                    alt={image.prompt}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <Button
                      onClick={() => downloadImage(image.url, image.prompt)}
                      variant="secondary"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      다운로드
                    </Button>
                    <Button
                      onClick={() => openImageInNewTab(image.url)}
                      variant="secondary"
                      size="sm"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      크게 보기
                    </Button>
                    <Button
                      onClick={() => removeImage(image.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p 
                    className="text-sm font-medium mb-2 line-clamp-2" 
                    title={image.prompt}
                  >
                    {image.prompt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <span>{getSizeLabel(image.size)}</span>
                      <span>•</span>
                      <span>{getStyleLabel(image.style)}</span>
                    </div>
                    <span>{image.timestamp.toLocaleString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
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