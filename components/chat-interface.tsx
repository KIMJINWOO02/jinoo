'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Loader2, Send, Bot, User, Copy, Check } from 'lucide-react';
import { ChatMessage } from '@/types/chat';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/loading-spinner';

interface ChatInterfaceProps {
  sessionId: string;
}

export function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    // 컴포넌트 마운트 시 입력 필드에 포커스
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      toast.success('메시지가 클립보드에 복사되었습니다');
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      toast.error('복사에 실패했습니다');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '채팅을 처리하는 중 오류가 발생했습니다.');
      }
      
      if (!data.response) {
        throw new Error('유효하지 않은 응답을 받았습니다.');
      }
      
      setIsTyping(false);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      let errorMessage = '메시지 전송 중 오류가 발생했습니다.';
      let errorDetails = '';
      
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
        
        // API 키 관련 오류인 경우
        if (error.message.includes('API 키') || error.message.includes('API_KEY')) {
          errorMessage = 'OpenAI API 키가 올바르게 설정되지 않았습니다.';
          errorDetails = '.env.local 파일에 OPENAI_API_KEY를 설정해주세요.';
        }
        // 요청 한도 초과인 경우
        else if (error.message.includes('rate limit') || error.message.includes('한도')) {
          errorMessage = '요청 한도에 도달했습니다.';
          errorDetails = '잠시 후 다시 시도해주세요.';
        }
        // 네트워크 오류인 경우
        else if (error.message.includes('Failed to fetch')) {
          errorMessage = '서버에 연결할 수 없습니다.';
          errorDetails = '인터넷 연결을 확인하고 다시 시도해주세요.';
        }
      }
      
      // 사용자에게 오류 메시지 표시
      toast.error(
        <div className="flex flex-col">
          <span className="font-medium">{errorMessage}</span>
          {errorDetails && <span className="text-xs opacity-80">{errorDetails}</span>}
        </div>,
        { duration: 5000 }
      );
      
      // 오류 메시지를 채팅에 표시
      const errorMessageObj: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ ${errorMessage}${errorDetails ? `\n${errorDetails}` : ''}`,
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessageObj]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto mb-4 p-4 bg-blue-500/10 rounded-full w-fit">
                  <Bot className="w-12 h-12 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI 어시스턴트와 대화를 시작하세요</h3>
                <p className="text-muted-foreground mb-6">무엇이든 물어보세요! 코딩, 창작, 학습 등 다양한 주제로 대화할 수 있습니다.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  <Button 
                    variant="outline" 
                    className="text-left justify-start h-auto p-4"
                    onClick={() => setInput('React로 간단한 투두 앱을 만드는 방법을 알려주세요')}
                  >
                    <div>
                      <div className="font-medium">React 투두 앱</div>
                      <div className="text-sm text-muted-foreground">간단한 투두 앱 만들기</div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-left justify-start h-auto p-4"
                    onClick={() => setInput('TypeScript의 장점과 기본 사용법을 설명해주세요')}
                  >
                    <div>
                      <div className="font-medium">TypeScript 기초</div>
                      <div className="text-sm text-muted-foreground">타입스크립트 학습하기</div>
                    </div>
                  </Button>
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="w-8 h-8 bg-blue-500 flex-shrink-0">
                    <AvatarFallback>
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[85%] ${message.role === 'user' ? 'order-1' : ''}`}>
                  <Card className={`p-4 ${
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'bg-card border-border'
                  }`}>
                    <div className="text-sm">
                      {message.role === 'user' ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={tomorrow}
                                  language={match[1]}
                                  PreTag="div"
                                  className="rounded-md my-2"
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={`${className} bg-muted px-1 py-0.5 rounded text-sm`} {...props}>
                                  {children}
                                </code>
                              );
                            },
                            pre: ({ children }) => (
                              <pre className="overflow-x-auto">{children}</pre>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className={`text-xs ${
                        message.role === 'user' ? 'text-blue-100' : 'text-muted-foreground'
                      }`}>
                        {message.timestamp.toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {message.role === 'assistant' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-muted"
                          onClick={() => copyToClipboard(message.content, message.id)}
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </Card>
                </div>
                
                {message.role === 'user' && (
                  <Avatar className="w-8 h-8 bg-green-500 flex-shrink-0 order-2">
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-start space-x-3">
                <Avatar className="w-8 h-8 bg-blue-500">
                  <AvatarFallback>
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <Card className="bg-card p-4">
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span className="text-sm text-muted-foreground">AI가 응답을 생성하고 있습니다...</span>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      <div className="border-t p-4 bg-background/50 backdrop-blur-sm">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
            disabled={isLoading}
            className="flex-1"
            maxLength={2000}
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isLoading} 
            size="icon"
            className="flex-shrink-0"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        <div className="text-xs text-muted-foreground mt-2 text-center">
          {input.length}/2000 문자
        </div>
      </div>
    </div>
  );
}