import { Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { TranslationKey } from "@/lib/translations";
import { ContentCard, ContentCardCorners } from "@/components/ui/content-card";

interface UnifiedLockScreenProps {
  /** Which screen this is displayed on - affects only content, not styling */
  variant: "home" | "calendar";
  /** Callback when user taps to unlock */
  onUnlock: () => void;
  /** Additional class names for the outer container */
  className?: string;
  /** Whether user has ever subscribed (for copy differentiation) */
  isReturningUser?: boolean;
}

interface UnifiedLockOverlayProps {
  /** Callback when user taps to unlock */
  onUnlock: () => void;
  /** Additional class names */
  className?: string;
  /** Whether user has ever subscribed (for copy differentiation) */
  isReturningUser?: boolean;
}

/**
 * Sparkle particle component - consistent across all lock screens
 */
function Sparkle({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div 
      className={cn("absolute animate-pulse pointer-events-none", className)}
      style={{ animationDelay: `${delay}ms`, animationDuration: '3s' }}
    >
      <Sparkles className="w-3 h-3 text-[hsl(25,80%,60%)] opacity-40" />
    </div>
  );
}

/**
 * Get CTA text based on user type:
 * - New users (never subscribed): "Start with 3 free credits ✨"
 * - Returning users (had subscription): "Start again ✨"
 */
function getLockCTAText(isReturningUser: boolean, t: (key: TranslationKey) => string): string {
  if (isReturningUser) {
    return "Start again\u2009!"; // thin space before exclamation
  }
  return t("unlockWithFreeCredits" as TranslationKey);
}

/**
 * UNIFIED LOCK OVERLAY
 * 
 * The overlay portion that can be used independently (for Calendar)
 * or as part of UnifiedLockScreen (for Home).
 * 
 * This ensures 100% identical lock UI styling across all screens.
 * Copy differs based on user type (new vs returning).
 */
export function UnifiedLockOverlay({ onUnlock, className, isReturningUser = false }: UnifiedLockOverlayProps) {
  const { t } = useLanguage();
  const ctaText = getLockCTAText(isReturningUser, t);

  return (
    <div 
      className={cn(
        "absolute inset-0 z-30 pointer-events-auto cursor-pointer rounded-3xl",
        className
      )}
      onClick={onUnlock}
      style={{
        // Natural depth shadow - grounded, soft, matches background tone
        boxShadow: "0px 6px 20px rgba(180, 120, 90, 0.18)",
      }}
    >
      {/* Inner clipped layer (keeps rounded corners) - outer wrapper stays overflow-visible so shadow can't be clipped */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden">
        {/* Light glassmorphism background - reduced opacity for better visibility of underlying content */}
        <div 
          className="absolute inset-0 rounded-3xl"
          style={{
            background: 'linear-gradient(180deg, rgba(255, 250, 245, 0.60) 0%, rgba(255, 245, 235, 0.65) 50%, rgba(255, 240, 228, 0.70) 100%)',
            backdropFilter: 'blur(3px)',
          }}
        />

        {/* Optional subtle outer stroke/glow (kept light, does not affect layout) */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 0 1px rgba(255, 200, 170, 0.35)',
          }}
        />
        
        {/* Sparkle particles - same positions for all variants */}
        <Sparkle className="top-[10%] left-[10%]" delay={0} />
        <Sparkle className="top-[18%] right-[12%]" delay={700} />
        <Sparkle className="top-[32%] left-[8%]" delay={1200} />
        <Sparkle className="top-[40%] right-[18%]" delay={400} />
        <Sparkle className="top-[55%] left-[20%]" delay={900} />
        <Sparkle className="top-[62%] right-[8%]" delay={1500} />
        <Sparkle className="bottom-[22%] left-[6%]" delay={200} />
        <Sparkle className="bottom-[12%] right-[22%]" delay={1100} />
        
        {/* Centered lock content - identical styling, copy differs by user type */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            {/* Glow halo behind lock */}
            <div className="relative">
              <div 
                className="absolute w-20 h-20 rounded-full -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 170, 110, 0.35) 0%, rgba(255, 190, 140, 0.18) 50%, transparent 70%)',
                  filter: 'blur(8px)',
                }}
              />
              {/* Lock icon in glass circle */}
              <div 
                className="relative w-14 h-14 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 248, 240, 0.75) 100%)',
                  boxShadow: '0 4px 20px rgba(255, 180, 130, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.9)',
                  border: '1.5px solid rgba(255, 200, 160, 0.5)',
                }}
              >
                <Lock className="w-6 h-6 text-[hsl(25,60%,50%)]" />
              </div>
            </div>
            
            {/* Glass CTA button - same style, different text */}
            <button 
              className="px-5 py-2.5 rounded-full flex items-center gap-2 transition-all hover:scale-105 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 200, 160, 0.65) 0%, rgba(255, 175, 130, 0.6) 50%, rgba(255, 155, 110, 0.65) 100%)',
                boxShadow: '0 4px 16px rgba(255, 170, 120, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.6)',
                border: '1.5px solid rgba(255, 190, 150, 0.6)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span className="text-sm font-bold" style={{ color: 'hsl(25, 50%, 35%)' }}>
                {ctaText}
              </span>
              <Sparkles className="w-4 h-4" style={{ color: 'hsl(25, 60%, 45%)' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * UNIFIED LOCK SCREEN COMPONENT
 * 
 * This is the SINGLE SOURCE OF TRUTH for all lock screen UI.
 * Both Home and Calendar screens MUST use this component when locked.
 * 
 * Styling is 100% identical regardless of variant.
 * Only the inner content (text/icons) may differ based on variant.
 */
export function UnifiedLockScreen({ 
  variant, 
  onUnlock,
  className 
}: UnifiedLockScreenProps) {
  const { t } = useLanguage();

  // Variant-specific content (text only, not styling)
  const getContent = () => {
    if (variant === "home") {
      return {
        emoji: "🐶",
        title: t("cameraReady"),
        subtitle: t("cameraIntro"),
        pawPrints: true,
      };
    }
    // Calendar variant - handled separately via UnifiedLockOverlay
    return null;
  };

  const content = getContent();

  return (
    <div className={cn("relative w-full", className)}>
      {/* Background content (dimmed) */}
      {content && (
        <div className="opacity-40 pointer-events-none">
          <ContentCard className="w-full">
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="text-6xl mb-4">{content.emoji}</div>
              {content.pawPrints && (
                <div className="flex justify-center gap-1.5 mb-5">
                  <span className="text-2xl">🐾</span>
                  <span className="text-xl opacity-60">🐾</span>
                  <span className="text-lg opacity-40">🐾</span>
                </div>
              )}
              <h2 className="text-lg font-bold text-foreground mb-2">{content.title}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-[200px]">
                {content.subtitle}
              </p>
            </div>
            <ContentCardCorners />
          </ContentCard>
        </div>
      )}

      {/* UNIFIED LOCK OVERLAY - identical styling for ALL screens */}
      <UnifiedLockOverlay onUnlock={onUnlock} />
    </div>
  );
}
