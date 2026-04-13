import { useState } from "react";
import { ArrowLeft, UserPlus, UserCheck, MessageCircle, MoreVertical, Grid, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface UserPost {
  id: number;
  image: string;
  likes: number;
}

interface UserProfileViewProps {
  user: {
    username: string;
    avatar: string;
  };
  onBack: () => void;
  onMessage: (user: { username: string; avatar: string }) => void;
}

const generateMockPosts = (): UserPost[] => [
  { id: 1, image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&h=300&fit=crop", likes: 234 },
  { id: 2, image: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=300&h=300&fit=crop", likes: 189 },
  { id: 3, image: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&h=300&fit=crop", likes: 456 },
  { id: 4, image: "https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=300&h=300&fit=crop", likes: 321 },
  { id: 5, image: "https://images.unsplash.com/photo-1586671267731-da2cf3ceeb80?w=300&h=300&fit=crop", likes: 567 },
  { id: 6, image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=300&h=300&fit=crop", likes: 432 },
];

const mockStats = {
  posts: 24,
  friends: 156,
  likes: 2340,
};

export function UserProfileView({ user, onBack, onMessage }: UserProfileViewProps) {
  const { t } = useLanguage();
  const [isFriend, setIsFriend] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [posts] = useState<UserPost[]>(() => generateMockPosts());

  const handleAddFriend = () => {
    if (isFriend) {
      setIsFriend(false);
    } else if (friendRequestSent) {
      setFriendRequestSent(false);
    } else {
      setFriendRequestSent(true);
      setTimeout(() => {
        setFriendRequestSent(false);
        setIsFriend(true);
      }, 2000);
    }
  };

  const handleMessage = () => {
    onMessage(user);
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
        
        <h1 className="flex-1 font-semibold text-foreground text-sm">{user.username}</h1>
        
        <button className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </header>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto pb-6">
        {/* Profile Header */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-3xl shrink-0">
              {user.avatar}
            </div>
            
            {/* Stats */}
            <div className="flex-1 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-foreground">{mockStats.posts}</p>
                <p className="text-[10px] text-muted-foreground">Posts</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{mockStats.friends}</p>
                <p className="text-[10px] text-muted-foreground">Friends</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{mockStats.likes}</p>
                <p className="text-[10px] text-muted-foreground">Likes</p>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-3">
            <h2 className="font-semibold text-foreground text-sm">{user.username}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              🐾 Pet lover | Sharing daily adventures with my furry friend
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            <Button 
              onClick={handleAddFriend}
              className={cn(
                "flex-1 h-9 text-xs",
                isFriend && "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
              variant={isFriend ? "secondary" : "default"}
            >
              {isFriend ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  Friends
                </>
              ) : friendRequestSent ? (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  Request Sent
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  Add Friend
                </>
              )}
            </Button>
            <Button 
              onClick={handleMessage}
              variant="outline"
              className="flex-1 h-9 text-xs"
              disabled={!isFriend}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Message
            </Button>
          </div>

          {!isFriend && (
            <p className="text-[10px] text-muted-foreground text-center mt-1.5">
              Add as friend to send messages
            </p>
          )}
        </div>

        {/* Posts Grid Header */}
        <div className="flex items-center justify-center border-t border-border py-2">
          <div className="flex items-center gap-1.5 text-foreground">
            <Grid className="w-4 h-4" />
            <span className="text-xs font-medium">Posts</span>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-3 gap-0.5">
          {posts.map((post) => (
            <div key={post.id} className="relative aspect-square group">
              <img 
                src={post.image} 
                alt="Post" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex items-center gap-1 text-white">
                  <Heart className="w-4 h-4 fill-white" />
                  <span className="font-semibold text-xs">{post.likes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}