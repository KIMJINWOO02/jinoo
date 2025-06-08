'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatInterface } from '@/components/chat-interface';
import { ImageGenerator } from '@/components/image-generator';
import { MessageSquare, Image, Palette, Sparkles, Github } from 'lucide-react';

export default function Home() {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    // Generate a session ID for this user session
    const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(id);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Studio
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            AI와 채팅하고 멋진 이미지를 생성해보세요
          </p>
        </header>

        <Card className="max-w-6xl mx-auto backdrop-blur-sm bg-card/50 border-white/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl text-center">AI 도구 모음</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="chat" className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>AI 채팅</span>
                </TabsTrigger>
                <TabsTrigger value="image" className="flex items-center space-x-2">
                  <Palette className="w-4 h-4" />
                  <span>이미지 생성</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="chat" className="h-[600px]">
                <Card className="h-full">
                  <ChatInterface sessionId={sessionId} />
                </Card>
              </TabsContent>
              
              <TabsContent value="image" className="h-[600px]">
                <Card className="h-full p-6">
                  <ImageGenerator sessionId={sessionId} />
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <footer className="text-center mt-8 text-muted-foreground">
          <div className="flex items-center justify-center space-x-4">
            <p>OpenAI GPT-4 & DALL-E 3으로 구동됩니다</p>
            <Button variant="ghost" size="sm" asChild>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </a>
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}