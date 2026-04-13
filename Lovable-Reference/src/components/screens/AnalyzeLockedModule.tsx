import { Camera, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentCard, ContentCardCorners } from "@/components/ui/content-card";
import { useLanguage } from "@/contexts/LanguageContext";
import { UnifiedLockOverlay } from "@/components/UnifiedLockScreen";

interface AnalyzeLockedModuleProps {
  onUnlock: () => void;
  /** Whether user has ever subscribed (for copy differentiation) */
  isReturningUser?: boolean;
}

/**
 * AnalyzeLockedModule
 *
 * Lock UI for the Analyze/Home module:
 * - Uses the EXACT same layout as HomeMainView (same container, card, buttons)
 * - Applies blur + reduced opacity to show it's disabled
 * - Overlays UnifiedLockOverlay on top for the lock CTA
 * - Underlying UI is fully non-interactive
 */
export function AnalyzeLockedModule({ onUnlock, isReturningUser = false }: AnalyzeLockedModuleProps) {
  const { t } = useLanguage();

  return (
    // EXACT same outer container as HomeMainView
    <div className="flex flex-col items-center justify-center h-full min-h-[55vh] px-2">
      {/* Relative wrapper - same as HomeMainView */}
      <div className="relative w-full">
        {/* Content layer - blurred and disabled (teaser preview) */}
        <div 
          className="opacity-70 pointer-events-none select-none"
          style={{ filter: 'blur(1px)' }}
          aria-hidden="true"
        >
          {/* Card - EXACT same as HomeMainView */}
          <ContentCard className="mb-6">
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="text-6xl mb-4">🐶</div>
              <div className="flex justify-center gap-1.5 mb-5">
                <span className="text-2xl">🐾</span>
                <span className="text-xl opacity-60">🐾</span>
                <span className="text-lg opacity-40">🐾</span>
              </div>
              <h2 className="text-lg font-bold text-foreground mb-2">{t("cameraReady")}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-[200px]">{t("cameraIntro")}</p>
            </div>
            <ContentCardCorners />
          </ContentCard>

          {/* Buttons - EXACT same as HomeMainView */}
          <div className="w-full space-y-3">
            <Button 
              size="lg" 
              className="w-full shadow-warm-glow"
              disabled
            >
              <Camera className="w-4 h-4" />
              {t("takePhoto")}
            </Button>

            <Button 
              variant="outline" 
              size="lg" 
              className="w-full"
              disabled
            >
              <ImagePlus className="w-4 h-4" />
              {t("selectFromGallery")}
            </Button>
          </div>
        </div>

        {/* Lock overlay - positioned over the entire content area */}
        <UnifiedLockOverlay 
          onUnlock={onUnlock} 
          isReturningUser={isReturningUser} 
        />
      </div>
    </div>
  );
}
