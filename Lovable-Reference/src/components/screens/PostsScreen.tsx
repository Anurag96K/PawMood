import { useState } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { TranslationKey } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { CreatePostPage } from "@/components/community/CreatePostPage";
import { UserProfileView } from "@/components/community/UserProfileView";
import { DirectMessageView } from "@/components/community/DirectMessageView";

interface Post {
  id: number;
  username: string;
  avatar: string;
  image: string;
  moodKey: TranslationKey;
  emoji: string;
  caption: string;
  likes: number;
  comments: number;
  timeAgo: string;
  liked: boolean;
  hashtags?: string;
  location?: string;
}

const samplePosts: Post[] = [
  {
    id: 1,
    username: "bella_mom",
    avatar: "🐕",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=600&fit=crop",
    moodKey: "moodHappy",
    emoji: "😊",
    caption: "Someone's extra happy after their morning walk! 🌞",
    likes: 234,
    comments: 18,
    timeAgo: "2h",
    liked: false,
  },
  {
    id: 2,
    username: "max_adventures",
    avatar: "🦮",
    image: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600&h=600&fit=crop",
    moodKey: "moodExcited",
    emoji: "🎉",
    caption: "Park day = best day! Can you tell how excited Max is? 🏃‍♂️",
    likes: 456,
    comments: 32,
    timeAgo: "4h",
    liked: true,
  },
  {
    id: 3,
    username: "luna_the_golden",
    avatar: "🐶",
    image: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=600&fit=crop",
    moodKey: "moodCalm",
    emoji: "😌",
    caption: "Peaceful Sunday vibes with my calm girl 💕",
    likes: 189,
    comments: 12,
    timeAgo: "6h",
    liked: false,
  },
  {
    id: 4,
    username: "rocky_paws",
    avatar: "🐾",
    image: "https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=600&h=600&fit=crop",
    moodKey: "moodAlert",
    emoji: "👀",
    caption: "What did he see? We'll never know 😂",
    likes: 321,
    comments: 45,
    timeAgo: "8h",
    liked: false,
  },
];

export function PostsScreen() {
  const { t } = useLanguage();
  const [posts, setPosts] = useState(samplePosts);
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ username: string; avatar: string } | null>(null);
  const [messagingUser, setMessagingUser] = useState<{ id: number; username: string; avatar: string } | null>(null);

  const toggleLike = (postId: number) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          liked: !post.liked,
          likes: post.liked ? post.likes - 1 : post.likes + 1,
        };
      }
      return post;
    }));
  };

  const handleCreatePost = (image: string, caption: string, hashtags: string, location: string, scheduledTime: string) => {
    const newPost: Post = {
      id: Date.now(),
      username: "you",
      avatar: "🐕",
      image,
      moodKey: "moodHappy" as TranslationKey,
      emoji: "😊",
      caption: caption || "Just shared a moment!",
      likes: 0,
      comments: 0,
      timeAgo: scheduledTime ? "Scheduled" : "now",
      liked: false,
      hashtags,
      location,
    };
    setPosts([newPost, ...posts]);
  };

  const handleUserClick = (username: string, avatar: string) => {
    if (username !== "you") {
      setSelectedUser({ username, avatar });
    }
  };

  const handleMessageUser = (user: { username: string; avatar: string }) => {
    setSelectedUser(null);
    setMessagingUser({ id: Date.now(), username: user.username, avatar: user.avatar });
  };

  // Show messaging view
  if (messagingUser) {
    return (
      <DirectMessageView
        user={messagingUser}
        onBack={() => setMessagingUser(null)}
      />
    );
  }

  // Show user profile view
  if (selectedUser) {
    return (
      <UserProfileView
        user={selectedUser}
        onBack={() => setSelectedUser(null)}
        onMessage={handleMessageUser}
      />
    );
  }

  // Show full-screen create post page
  if (showCreatePage) {
    return (
      <CreatePostPage
        onClose={() => setShowCreatePage(false)}
        onSubmit={handleCreatePost}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border px-5 pt-10 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">📷 {t("postsTitle")}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{t("postsSubtitle")}</p>
          </div>
          <Button onClick={() => setShowCreatePage(true)} size="sm" className="h-7 text-xs px-2">
            <Plus className="w-3 h-3" />
            {t("createPost")}
          </Button>
        </div>
      </header>

      {/* Feed */}
      <div className="divide-y divide-border">
        {posts.map((post, index) => (
          <article 
            key={post.id} 
            className={cn(
              "bg-card animate-fade-in-up",
              index === 0 && "animation-delay-100",
              index === 1 && "animation-delay-200",
              index === 2 && "animation-delay-300"
            )}
          >
            {/* Post Header */}
            <div className="flex items-center justify-between px-3 py-2">
              <button 
                onClick={() => handleUserClick(post.username, post.avatar)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-base">
                  {post.avatar}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-xs text-foreground">{post.username}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span>{post.timeAgo}</span>
                    {post.location && (
                      <>
                        <span>•</span>
                        <span>{post.location}</span>
                      </>
                    )}
                  </div>
                </div>
              </button>
              <button className="p-1.5 hover:bg-muted rounded-full transition-colors">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Post Image */}
            <div className="relative aspect-square">
              <img 
                src={post.image} 
                alt={`${post.username}'s pet`}
                className="w-full h-full object-cover"
              />
              {/* Mood Badge */}
              <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                <span className="text-sm">{post.emoji}</span>
                <span className="text-xs font-semibold text-foreground">{t(post.moodKey)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="px-3 py-2">
              <div className="flex items-center gap-3 mb-2">
                <button 
                  onClick={() => toggleLike(post.id)}
                  className="flex items-center gap-1 transition-transform active:scale-90"
                >
                  <Heart 
                    className={cn(
                      "w-5 h-5 transition-colors",
                      post.liked ? "fill-primary text-primary" : "text-foreground"
                    )} 
                  />
                </button>
                <button className="flex items-center gap-1">
                  <MessageCircle className="w-5 h-5 text-foreground" />
                </button>
                <button className="flex items-center gap-1">
                  <Share2 className="w-5 h-5 text-foreground" />
                </button>
              </div>

              {/* Likes */}
              <p className="text-xs font-semibold text-foreground mb-0.5">
                {post.likes.toLocaleString()} {t("likes")}
              </p>

              {/* Caption */}
              <p className="text-xs text-foreground">
                <button 
                  onClick={() => handleUserClick(post.username, post.avatar)}
                  className="font-semibold hover:underline"
                >
                  {post.username}
                </button>{" "}
                {post.caption}
              </p>

              {/* Hashtags */}
              {post.hashtags && (
                <p className="text-xs text-primary mt-0.5">{post.hashtags}</p>
              )}

              {/* Comments */}
              {post.comments > 0 && (
                <button className="text-xs text-muted-foreground mt-0.5">
                  {t("viewAllComments").replace("{count}", post.comments.toString())}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}