import { Camera, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfile } from "@/hooks/useProfile";
import { useBadge } from "@/contexts/BadgeContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

type TabId = "camera" | "calendar" | "profile";

interface BottomNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const { t } = useLanguage();
  const { profile, avatarSrc } = useProfile();
  const { totalUnreadCount } = useBadge();

  const tabs = [
    { id: "camera" as TabId, icon: Camera, label: t("navAnalyze") },
    { id: "calendar" as TabId, icon: Calendar, label: t("navCalendar"), badge: totalUnreadCount },
    { id: "profile" as TabId, icon: User, label: t("navProfile"), isProfile: true },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 bg-background border-t border-border w-full max-w-[375px]">
      <div className="flex items-center justify-around px-1 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isProfileTab = tab.id === "profile";
          const hasBadge = typeof tab.badge === 'number' && tab.badge > 0;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg relative",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {/* Fixed-size container for icon - prevents layout shift */}
              <div className="w-7 h-7 flex items-center justify-center relative">
                <motion.div 
                  className={cn(
                    "p-1 rounded-lg flex items-center justify-center",
                    isActive && "bg-accent"
                  )}
                  animate={{ scale: isActive ? 1.08 : 1 }}
                  transition={{
                    type: "tween",
                    duration: 0.15,
                    ease: "easeOut"
                  }}
                  style={{ 
                    transformOrigin: "center center",
                    willChange: "transform"
                  }}
                >
                  {isProfileTab ? (
                    <Avatar className={cn(
                      "w-5 h-5",
                      isActive && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                    )}>
                      <AvatarImage
                        src={avatarSrc || undefined}
                        alt="User profile avatar"
                        loading="lazy"
                        decoding="async"
                      />
                      <AvatarFallback className="bg-accent text-[10px]">
                        {profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Icon 
                      className="w-5 h-5"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  )}
                </motion.div>
                
                {/* iOS-style notification badge - RED color */}
                {hasBadge && (
                  <span 
                    className="absolute top-0 right-0 min-w-[14px] h-[14px] px-0.5 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-scale-in shadow-sm"
                    style={{ backgroundColor: '#FF3B30' }}
                  >
                    {tab.badge! > 99 ? "+99" : tab.badge}
                  </span>
                )}
              </div>
              
              {/* Fixed label area - no movement */}
              <span className={cn(
                "text-xs font-medium leading-none",
                isActive && "font-semibold"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
