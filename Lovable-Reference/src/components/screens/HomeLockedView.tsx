import { Lock, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { TranslationKey } from "@/lib/translations";
import { ContentCard, ContentCardCorners } from "@/components/ui/content-card";

interface HomeLockedViewProps {
  onUnlock: () => void;
}

/**
 * Sparkle particle component
 */
function Sparkle({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <div 
      className={`absolute animate-pulse pointer-events-none ${className}`}
      style={{ animationDelay: `${delay}ms`, animationDuration: '3s' }}
    >
      <Sparkles className="w-3 h-3 text-[hsl(25,80%,60%)] opacity-40" />
    </div>
  );
}

/**
 * HomeLockedView - Full-sized lock screen for Home/Camera
 * 
 * OPTION A Implementation: When locked, we render ONLY the lock UI.
 * No underlying buttons are rendered at all - they are completely replaced.
 * 
 * Layout covers the entire camera module area with proper horizontal padding.
 */
export function HomeLockedView({ onUnlock }: HomeLockedViewProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[55vh] px-4">
      {/* Lock container - wraps entire camera module area */}
      <div 
        className="relative w-full cursor-pointer"
        onClick={onUnlock}
      >
        {/* ContentCard provides the background structure matching unlocked state */}
        <div className="relative">
          <ContentCard className="w-full min-h-[360px]">
            {/* Empty content placeholder - maintains card height */}
            <div className="opacity-30 pointer-events-none">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <div className="text-5xl mb-3">🐶</div>
                <div className="flex justify-center gap-1.5 mb-4">
                  <span className="text-xl">🐾</span>
                  <span className="text-lg opacity-60">🐾</span>
                  <span className="text-base opacity-40">🐾</span>
                </div>
                <h2 className="text-base font-bold text-foreground mb-1">{t("cameraReady")}</h2>
                <p className="text-muted-foreground text-xs leading-relaxed max-w-[180px]">
                  {t("cameraIntro")}
                </p>
              </div>
            </div>
            <ContentCardCorners />
            
            {/* Lock overlay - covers entire ContentCard */}
            <div 
              className="absolute inset-0 z-30 overflow-hidden pointer-events-auto rounded-3xl"
            >
              {/* Warm glassmorphism background */}
              <div 
                className="absolute inset-0 rounded-3xl"
                style={{
                  background: 'linear-gradient(180deg, rgba(255, 250, 245, 0.92) 0%, rgba(255, 245, 235, 0.94) 50%, rgba(255, 240, 228, 0.95) 100%)',
                  backdropFilter: 'blur(4px)',
                }}
              />
              
              {/* Soft warm shadow */}
              <div 
                className="absolute inset-0 pointer-events-none rounded-3xl"
                style={{
                  boxShadow: '0 4px 24px rgba(255, 200, 170, 0.2), 0 2px 8px rgba(255, 180, 150, 0.1)',
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
          </ContentCard>
        </div>

      </div>
    </div>
  );
}
