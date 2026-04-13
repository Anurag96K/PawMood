import { useState, useEffect } from "react";
import { Search, MapPin, Hash, Users, MessageSquare, ChevronRight, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { ChatRoomView } from "@/components/community/ChatRoomView";
import { DirectMessageView } from "@/components/community/DirectMessageView";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Mock data for community chat rooms (these would be public rooms)
interface PublicChatRoom {
  id: string;
  name: string;
  type: "region" | "topic" | "group";
  icon: string;
  members: number;
  lastMessage: string;
  unread: number;
}

const publicChatRooms: PublicChatRoom[] = [
  { id: "public-1", name: "New York Dogs", type: "region", icon: "🗽", members: 1243, lastMessage: "Anyone knows a good vet in Manhattan?", unread: 3 },
  { id: "public-2", name: "Los Angeles Pets", type: "region", icon: "🌴", members: 892, lastMessage: "Beach walk meetup this Saturday!", unread: 0 },
  { id: "public-3", name: "Walking Buddies", type: "topic", icon: "🚶", members: 567, lastMessage: "Morning walk routine tips?", unread: 5 },
  { id: "public-4", name: "Training Tips", type: "topic", icon: "🎓", members: 1089, lastMessage: "Best way to teach 'stay'", unread: 0 },
  { id: "public-5", name: "Healthy Snacks", type: "topic", icon: "🥕", members: 432, lastMessage: "DIY frozen treats recipe", unread: 2 },
  { id: "public-6", name: "Puppy Parents", type: "group", icon: "🐕", members: 234, lastMessage: "First vet visit advice needed", unread: 0 },
];

export function CommunityScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { chatRooms, loading: roomsLoading, createChatRoom } = useChat();
  const [activeTab, setActiveTab] = useState<"rooms" | "messages">("rooms");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<{ id: string; name: string | null; icon?: string; members?: number } | null>(null);
  const [selectedDM, setSelectedDM] = useState<{ chatRoomId: string; otherUser: { id: string; username: string; avatar?: string | null } } | null>(null);
  const [creatingRoom, setCreatingRoom] = useState(false);

  const filteredPublicRooms = publicChatRooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPrivateRooms = chatRooms.filter(room =>
    room.name?.toLowerCase().includes(searchQuery.toLowerCase()) || !room.name
  );

  // Handle creating a demo chat room
  const handleCreateDemoRoom = async () => {
    if (!user) {
      toast.error("Please sign in to create a chat room");
      return;
    }

    setCreatingRoom(true);
    try {
      const room = await createChatRoom("My Pet Chat 🐾", "group", []);
      toast.success("Chat room created!");
      setSelectedRoom({ id: room.id, name: room.name, icon: "🐾" });
    } catch (error) {
      console.error("Error creating room:", error);
      toast.error("Failed to create chat room");
    } finally {
      setCreatingRoom(false);
    }
  };

  // Show chat room view
  if (selectedRoom) {
    return (
      <ChatRoomView 
        room={selectedRoom} 
        onBack={() => setSelectedRoom(null)} 
      />
    );
  }

  // Show direct message view
  if (selectedDM) {
    return (
      <DirectMessageView 
        chatRoomId={selectedDM.chatRoomId}
        otherUser={selectedDM.otherUser}
        onBack={() => setSelectedDM(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-10 pb-4">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">💬 {t("communityTitle")}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{t("communitySubtitle")}</p>
      </header>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex bg-muted rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab("rooms")}
            className={cn(
              "flex-1 py-2 rounded-md text-xs font-medium transition-all duration-200",
              activeTab === "rooms"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <Users className="w-3.5 h-3.5 inline-block mr-1" />
            {t("chatRooms")}
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={cn(
              "flex-1 py-2 rounded-md text-xs font-medium transition-all duration-200 relative",
              activeTab === "messages"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <MessageSquare className="w-3.5 h-3.5 inline-block mr-1" />
            {t("messages")}
            {chatRooms.length > 0 && (
              <span className="absolute top-1.5 right-4 w-1.5 h-1.5 bg-primary rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "rooms" ? (
        <div className="px-4 space-y-2">
          {/* Categories */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {[
              { label: t("all"), icon: Hash },
              { label: t("regions"), icon: MapPin },
              { label: t("topics"), icon: Hash },
              { label: t("groups"), icon: Users },
            ].map((cat) => (
              <button
                key={cat.label}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-secondary rounded-full whitespace-nowrap text-xs font-medium text-secondary-foreground hover:bg-accent transition-colors"
              >
                <cat.icon className="w-3 h-3" />
                {cat.label}
              </button>
            ))}
          </div>

          {/* Room List */}
          <div className="space-y-1.5">
            {filteredPublicRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoom({ id: room.id, name: room.name, icon: room.icon, members: room.members })}
                className="w-full flex items-center gap-3 p-3 bg-card rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200 border border-border"
              >
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-lg">
                  {room.icon}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold text-foreground truncate">{room.name}</h3>
                    {room.unread > 0 && (
                      <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full">
                        {room.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{room.lastMessage}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {room.members.toLocaleString()} {t("members")}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {/* Create New Chat Button */}
          <Button
            onClick={handleCreateDemoRoom}
            disabled={creatingRoom}
            variant="outline"
            className="w-full h-12 border-dashed"
          >
            {creatingRoom ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Create New Chat Room
          </Button>

          {/* User's Chat Rooms */}
          {roomsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredPrivateRooms.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 text-center shadow-plush border border-border">
              <div className="text-5xl mb-4 animate-wiggle">🐕</div>
              <div className="flex justify-center gap-1 mb-4">
                <span className="text-xl">💬</span>
                <span className="text-lg opacity-60">💬</span>
                <span className="text-sm opacity-40">💬</span>
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">No conversations yet... 💕</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Create a chat room to make<br />new furry friends! 🐾
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredPrivateRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom({ id: room.id, name: room.name, icon: room.type === "group" ? "👥" : "💬" })}
                  className="w-full flex items-center gap-3 p-3 bg-card rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200 border border-border"
                >
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-lg">
                    {room.type === "group" ? "👥" : "💬"}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {room.name || "Chat"}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {room.type === "group" ? "Group chat" : "Direct message"}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
