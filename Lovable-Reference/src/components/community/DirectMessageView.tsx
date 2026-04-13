import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, MoreVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChatMessages, useChatPresence } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

// Props for real-time chat with database
interface RealTimeDMProps {
  chatRoomId: string;
  otherUser: {
    id: string;
    username: string;
    avatar?: string | null;
  };
  onBack: () => void;
}

// Props for legacy mock data usage
interface LegacyDMProps {
  user: {
    id: number;
    username: string;
    avatar: string;
  };
  onBack: () => void;
}

type DirectMessageViewProps = RealTimeDMProps | LegacyDMProps;

// Type guard to check if using real-time props
function isRealTimeProps(props: DirectMessageViewProps): props is RealTimeDMProps {
  return 'chatRoomId' in props;
}

// Mock messages for legacy mode
interface MockMessage {
  id: number;
  text: string;
  timestamp: string;
  isOwn: boolean;
}

const generateMockMessages = (): MockMessage[] => [
  { id: 1, text: "Hey! I saw your post about Max, so cute! 🐕", timestamp: "Yesterday", isOwn: false },
  { id: 2, text: "Thanks! He's such a good boy", timestamp: "Yesterday", isOwn: true },
  { id: 3, text: "What breed is he?", timestamp: "Today 9:30 AM", isOwn: false },
  { id: 4, text: "He's a Golden Retriever, 3 years old", timestamp: "Today 9:35 AM", isOwn: true },
  { id: 5, text: "That's so cute! 😍", timestamp: "Today 9:40 AM", isOwn: false },
];

export function DirectMessageView(props: DirectMessageViewProps) {
  if (isRealTimeProps(props)) {
    return <RealTimeDirectMessageView {...props} />;
  }
  return <LegacyDirectMessageView {...props} />;
}

// Real-time version using database
function RealTimeDirectMessageView({ chatRoomId, otherUser, onBack }: RealTimeDMProps) {
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useChatMessages(chatRoomId);
  const { onlineUsers } = useChatPresence(chatRoomId);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isOtherUserOnline = onlineUsers.has(otherUser.id);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    
    setSending(true);
    try {
      await sendMessage(newMessage);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-3 pt-8 border-b border-border bg-background">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        
        <div className="relative">
          <Avatar className="w-9 h-9">
            <AvatarImage src={otherUser.avatar || undefined} alt={otherUser.username} />
            <AvatarFallback className="bg-accent text-lg">
              {otherUser.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isOtherUserOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate">{otherUser.username}</h2>
          <p className="text-[10px] text-muted-foreground">
            {isOtherUserOnline ? "Online" : "Offline"}
          </p>
        </div>
        
        <button className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Avatar className="w-16 h-16 mb-3">
              <AvatarImage src={otherUser.avatar || undefined} alt={otherUser.username} />
              <AvatarFallback className="bg-accent text-2xl">
                {otherUser.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm font-medium text-foreground">{otherUser.username}</p>
            <p className="text-xs text-muted-foreground mt-1">Start a conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === user?.id;
            
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2",
                  isOwn && "flex-row-reverse"
                )}
              >
                <div className={cn("max-w-[75%]", isOwn && "text-right")}>
                  <div
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs",
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    )}
                  >
                    {msg.content}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(msg.created_at)}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 pb-6 border-t border-border bg-background">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-10 px-3 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="h-10 w-10 rounded-lg p-0"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Legacy version using mock data (for PostsScreen compatibility)
function LegacyDirectMessageView({ user, onBack }: LegacyDMProps) {
  const [messages, setMessages] = useState<MockMessage[]>(() => generateMockMessages());
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    
    const message: MockMessage = {
      id: Date.now(),
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    };
    
    setMessages([...messages, message]);
    setNewMessage("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-3 pt-8 border-b border-border bg-background">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        
        <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-lg">
          {user.avatar}
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate">{user.username}</h2>
          <p className="text-[10px] text-muted-foreground">Online</p>
        </div>
        
        <button className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2",
              msg.isOwn && "flex-row-reverse"
            )}
          >
            <div className={cn("max-w-[75%]", msg.isOwn && "text-right")}>
              <div
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs",
                  msg.isOwn
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                )}
              >
                {msg.text}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{msg.timestamp}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 pb-6 border-t border-border bg-background">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-10 px-3 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="h-10 w-10 rounded-lg p-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
