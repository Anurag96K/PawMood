import { useEffect } from "react";
import { Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { TranslationKey } from "@/lib/translations";

interface PremiumLockOverlayProps {
  onUnlock: () => void;
  className?: string;
}

// Sparkle particle component
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

export function PremiumLockOverlay({ onUnlock, className }: PremiumLockOverlayProps) {
  const { t } = useLanguage();

  // Lock body scroll when mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, []);

  return (
    <div
      className={cn(
        "absolute inset-0 z-30 overflow-hidden pointer-events-auto cursor-pointer",
        className
      )}
      onClick={onUnlock}
    >
      {/* Warm glassmorphism background with blur - no dark edges */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(255, 250, 245, 0.88) 0%, rgba(255, 245, 235, 0.90) 50%, rgba(255, 240, 228, 0.92) 100%)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Soft warm shadow - no dark borders */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: '0 12px 48px rgba(255, 160, 100, 0.45), 0 6px 16px rgba(255, 140, 80, 0.35)',
        }}
      />

      {/* Sparkle particles */}
      <Sparkle className="top-[10%] left-[10%]" delay={0} />
      <Sparkle className="top-[18%] right-[12%]" delay={700} />
      <Sparkle className="top-[32%] left-[8%]" delay={1200} />
      <Sparkle className="top-[40%] right-[18%]" delay={400} />
      <Sparkle className="top-[55%] left-[20%]" delay={900} />
      <Sparkle className="top-[62%] right-[8%]" delay={1500} />
      <Sparkle className="bottom-[22%] left-[6%]" delay={200} />
      <Sparkle className="bottom-[12%] right-[22%]" delay={1100} />

      {/* Centered lock content */}
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

          {/* Glass CTA button */}
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
              {t("unlockWithFreeCredits" as TranslationKey)}
            </span>
            <Sparkles className="w-4 h-4" style={{ color: 'hsl(25, 60%, 45%)' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
