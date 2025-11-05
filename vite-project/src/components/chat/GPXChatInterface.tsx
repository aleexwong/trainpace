/**
 * Chat interface for asking questions about GPX routes
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Trash2, MessageSquare, Sparkles } from 'lucide-react';
import type { ChatMessage } from '@/features/chat/types';
import { getSuggestedQuestions } from '@/services/gpxChat';
import type { GPXChatContext } from '@/features/chat/types';

interface GPXChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  context: GPXChatContext | null;
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
  onClearError: () => void;
}

export function GPXChatInterface({
  messages,
  isLoading,
  error,
  context,
  onSendMessage,
  onClearChat,
  onClearError,
}: GPXChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    if (!isLoading) {
      onSendMessage(question);
    }
  };

  const suggestedQuestions = context ? getSuggestedQuestions(context) : [];
  const showSuggestions = messages.length === 0 && !isLoading;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Chat with Your Route</CardTitle>
              <CardDescription className="text-sm">
                Ask questions about your elevation profile and pacing strategy
              </CardDescription>
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearChat}
              disabled={isLoading}
              className="h-8"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 pt-0 min-h-0">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearError}
                className="h-6 px-2"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Messages Area */}
        <ScrollArea className="flex-1 pr-4 -mr-4">
          {!context && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Upload a GPX file to start chatting about your route
            </div>
          )}

          {context && messages.length === 0 && !isLoading && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>Try asking:</span>
              </div>
              <div className="grid gap-2">
                {suggestedQuestions.map((question, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestedQuestion(question)}
                    className="justify-start h-auto py-2 px-3 text-left whitespace-normal"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Analyzing route data...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Suggested questions when showing messages */}
        {context && messages.length > 0 && !isLoading && showSuggestions && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs text-muted-foreground mb-2">Suggestions:</div>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.slice(0, 3).map((question, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestedQuestion(question)}
                  className="h-7 text-xs"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              context
                ? 'Ask about pacing, elevation, or race strategy...'
                : 'Upload a GPX file first...'
            }
            disabled={!context || isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!context || !input.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        }`}
      >
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>
        {message.metadata?.processingTime && (
          <div className="text-xs opacity-70 mt-1">
            {(message.metadata.processingTime / 1000).toFixed(2)}s
          </div>
        )}
      </div>
    </div>
  );
}
