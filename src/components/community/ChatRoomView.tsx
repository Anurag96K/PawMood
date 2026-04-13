import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, MoreVertical, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { useChatMessages, useChatPresence } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface ChatRoomViewProps {
  room: {
    id: string;
    name: string | null;
    icon?: string;
    members?: number;
  };
  onBack: () => void;
}

export function ChatRoomView({ room, onBack }: ChatRoomViewProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { messages, participants, loading, sendMessage } = useChatMessages(room.id);
  const { onlineUsers } = useChatPresence(room.id);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-2 pt-8 border-b border-border bg-background">
        <button
          onClick={onBack}
          className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-foreground" />
        </button>
        
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-base">
          {room.icon || "💬"}
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="text-xs font-semibold text-foreground truncate">{room.name || "Chat"}</h2>
          <p className="text-[9px] text-muted-foreground flex items-center gap-0.5">
            <Users className="w-2 h-2" />
            {participants.length} {t("members")} • {onlineUsers.size} online
          </p>
        </div>
        
        <button className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
          <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-2xl mb-2">
              💬
            </div>
            <p className="text-sm text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground">Be the first to say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === user?.id;
            const senderName = msg.sender_profile?.display_name || "User";
            const senderAvatar = msg.sender_profile?.avatar_url;
            
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-1.5",
                  isOwn && "flex-row-reverse"
                )}
              >
                {!isOwn && (
                  <Avatar className="w-5 h-5 shrink-0">
                    <AvatarImage src={senderAvatar || undefined} alt={senderName} />
                    <AvatarFallback className="bg-accent text-[8px]">
                      {senderName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("max-w-[75%]", isOwn && "text-right")}>
                  {!isOwn && (
                    <p className="text-[9px] text-muted-foreground mb-0.5">{senderName}</p>
                  )}
                  <div
                    className={cn(
                      "px-2.5 py-1 rounded-xl text-[11px]",
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    )}
                  >
                    {msg.content}
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{formatTime(msg.created_at)}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2 pb-5 border-t border-border bg-background">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-9 px-3 bg-muted rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            disabled={sending}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="h-9 w-9 rounded-lg p-0"
          >
            {sending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
