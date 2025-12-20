import { useState, useRef, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLFGChat } from '@/hooks/useLFGChat';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface LobbyChatProps {
  lobbyId: string;
}

export function LobbyChat({ lobbyId }: LobbyChatProps) {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, sendTyping, typingText } = useLFGChat(lobbyId);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle typing indicator
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);

      // Debounce typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (e.target.value.trim()) {
        sendTyping();
        typingTimeoutRef.current = setTimeout(() => {
          // Typing stopped
        }, 2000);
      }
    },
    [sendTyping]
  );

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    setInput('');
    await sendMessage.mutateAsync(trimmedInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Загрузка чата...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Нет сообщений. Начните общение!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isOwn = message.sender_id === user?.id;
              const showAvatar =
                index === 0 || messages[index - 1].sender_id !== message.sender_id;

              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    isOwn && 'flex-row-reverse'
                  )}
                >
                  {showAvatar ? (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage
                        src={message.sender_profile?.avatar_url || undefined}
                      />
                      <AvatarFallback>
                        {message.sender_profile?.username?.charAt(0).toUpperCase() ||
                          '?'}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-8" />
                  )}

                  <div
                    className={cn(
                      'flex flex-col max-w-[70%]',
                      isOwn && 'items-end'
                    )}
                  >
                    {showAvatar && (
                      <div
                        className={cn(
                          'flex items-center gap-2 mb-1',
                          isOwn && 'flex-row-reverse'
                        )}
                      >
                        <span className="text-sm font-medium">
                          {message.sender_profile?.username || 'Пользователь'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    )}

                    <div
                      className={cn(
                        'rounded-lg px-3 py-2 text-sm',
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Typing indicator */}
      {typingText && (
        <div className="px-4 py-1 text-xs text-muted-foreground italic">
          {typingText}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Написать сообщение..."
            disabled={sendMessage.isPending}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
