import React from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface LockedFeatureOverlayProps {
  children: React.ReactNode;
  isLocked: boolean;
  onUnlock: () => void;
  className?: string;
  variant?: "blur" | "dim" | "premium";
  showIcon?: boolean;
  iconPosition?: "center" | "top-right";
}

// Sparkle component for premium glass effect
function Sparkle({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div 
      className={cn("absolute pointer-events-none", className)}
      style={style}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path 
          d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z" 
          fill="currentColor"
          className="text-primary/40"
        />
      </svg>
    </div>
  );
}

export function LockedFeatureOverlay({
  children,
  isLocked,
  onUnlock,
  className,
  variant = "blur",
  showIcon = true,
  iconPosition = "center",
}: LockedFeatureOverlayProps) {
  const { t } = useLanguage();

  if (!isLocked) {
    return <>{children}</>;
  }

  const isPremium = variant === "premium";

  return (
    <div 
      className={cn("relative cursor-pointer", className)}
      onClick={onUnlock}
    >
      {/* Original content with blur/dim */}
      <div
        className={cn(
          "transition-all duration-200",
          (variant === "blur" || isPremium) && "blur-sm",
          variant === "dim" && "opacity-50"
        )}
      >
        {children}
      </div>

      {/* Premium glass overlay */}
      {isPremium ? (
        <>
          {/* Glass background with warm tint */}
          <div 
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 253, 250, 0.75) 0%, rgba(255, 248, 240, 0.7) 50%, rgba(255, 245, 235, 0.75) 100%)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Outer glow */}
          <div 
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              boxShadow: '0 0 40px 10px rgba(255, 180, 120, 0.15), 0 0 80px 20px rgba(255, 200, 150, 0.1)',
            }}
          />

          {/* Inner highlight (top edge) */}
          <div 
            className="absolute inset-x-0 top-0 h-px rounded-t-2xl pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)',
            }}
          />

          {/* Sparkles */}
          <Sparkle className="opacity-60 animate-pulse" style={{ top: '15%', left: '20%', animationDelay: '0s', animationDuration: '2s' }} />
          <Sparkle className="opacity-40 animate-pulse" style={{ top: '25%', right: '15%', animationDelay: '0.5s', animationDuration: '2.5s' }} />
          <Sparkle className="opacity-50 animate-pulse" style={{ top: '40%', left: '12%', animationDelay: '1s', animationDuration: '3s' }} />
          <Sparkle className="opacity-30 animate-pulse" style={{ bottom: '35%', right: '20%', animationDelay: '0.3s', animationDuration: '2.2s' }} />
          <Sparkle className="opacity-45 animate-pulse" style={{ bottom: '25%', left: '25%', animationDelay: '0.7s', animationDuration: '2.8s' }} />
          <Sparkle className="opacity-35 animate-pulse" style={{ top: '55%', right: '10%', animationDelay: '1.2s', animationDuration: '2.4s' }} />
          <Sparkle className="opacity-55 animate-pulse" style={{ bottom: '45%', left: '8%', animationDelay: '0.2s', animationDuration: '2.6s' }} />
          <Sparkle className="opacity-25 animate-pulse" style={{ top: '70%', right: '25%', animationDelay: '0.9s', animationDuration: '3.2s' }} />

          {/* Floating sparkles around lock area */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-32 h-32">
              <Sparkle className="opacity-70 animate-bounce-gentle" style={{ top: '-10px', left: '50%', transform: 'translateX(-50%)', animationDelay: '0s' }} />
              <Sparkle className="opacity-50 animate-bounce-gentle" style={{ top: '20%', left: '-5px', animationDelay: '0.3s' }} />
              <Sparkle className="opacity-60 animate-bounce-gentle" style={{ top: '20%', right: '-5px', animationDelay: '0.6s' }} />
              <Sparkle className="opacity-40 animate-bounce-gentle" style={{ bottom: '30%', left: '10px', animationDelay: '0.9s' }} />
              <Sparkle className="opacity-55 animate-bounce-gentle" style={{ bottom: '30%', right: '10px', animationDelay: '1.2s' }} />
            </div>
          </div>

          {/* Lock icon on glass circle with glow halo */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
            {/* Glow halo behind lock */}
            <div 
              className="absolute w-24 h-24 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255, 180, 120, 0.3) 0%, rgba(255, 200, 150, 0.15) 40%, transparent 70%)',
                filter: 'blur(8px)',
              }}
            />

            {/* Lock icon container */}
            <div 
              className="relative w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 250, 245, 0.5) 100%)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                boxShadow: '0 4px 20px rgba(255, 180, 120, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
              }}
            >
              <Lock className="w-7 h-7 text-primary drop-shadow-sm" />
            </div>

            {/* Glass CTA button */}
            <div 
              className="px-5 py-2.5 rounded-full flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 180, 120, 0.4) 0%, rgba(255, 160, 100, 0.35) 50%, rgba(255, 140, 80, 0.4) 100%)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                boxShadow: '0 4px 16px rgba(255, 140, 80, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                border: '1px solid rgba(255, 200, 160, 0.4)',
              }}
            >
            <span className="text-sm font-semibold text-foreground drop-shadow-sm">
              {t("startWithFreeCredits")}
            </span>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Standard overlay */}
          <div className="absolute inset-0 bg-background/20 rounded-xl" />

          {/* Lock Icon */}
          {showIcon && (
            <div
              className={cn(
                "absolute z-10",
                iconPosition === "center" && "inset-0 flex items-center justify-center",
                iconPosition === "top-right" && "top-2 right-2"
              )}
            >
              <div className={cn(
                "flex items-center justify-center rounded-full bg-primary/90 shadow-lg",
                iconPosition === "center" ? "w-12 h-12" : "w-6 h-6"
              )}>
                <Lock className={cn(
                  "text-primary-foreground",
                  iconPosition === "center" ? "w-6 h-6" : "w-3 h-3"
                )} />
              </div>
            </div>
          )}

          {/* Label for center position */}
          {showIcon && iconPosition === "center" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="mt-20 bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border shadow-sm">
                <span className="text-xs font-medium text-foreground">{t("unlockWithPro")}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
