import { useState } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentCard, ContentCardCorners } from "@/components/ui/content-card";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { NoCreditsModal } from "@/components/NoCreditsModal";

interface HomeMainViewProps {
  onStartCamera: () => void;
  onUploadFromGallery: () => void;
  hasCredits: boolean;
  onBuyExtraCredits?: () => void;
}

/**
 * HomeMainView - Displayed when user has credits and can take photos
 * Scoped styles specific to the Home/Camera screen unlocked state
 */
export function HomeMainView({ 
  onStartCamera, 
  onUploadFromGallery, 
  hasCredits,
  onBuyExtraCredits,
}: HomeMainViewProps) {
  const { t } = useLanguage();
  const [showNoCredits, setShowNoCredits] = useState(false);

  const handleAction = (_action: () => void) => {
    setShowNoCredits(true);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[55vh] px-2">
      <div className="relative w-full">
        <ContentCard className="mb-6">
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className={cn("text-6xl mb-4", hasCredits && "animate-bounce-gentle")}>🐶</div>
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

        <div className="w-full space-y-3">
          <Button 
            onClick={() => handleAction(onStartCamera)}
            size="lg" 
            className="w-full shadow-warm-glow"
          >
            <Camera className="w-4 h-4" />
            {t("takePhoto")}
          </Button>

          <Button 
            onClick={() => handleAction(onUploadFromGallery)}
            variant="outline" 
            size="lg" 
            className="w-full"
          >
            <ImagePlus className="w-4 h-4" />
            {t("selectFromGallery")}
          </Button>
        </div>
      </div>

      <NoCreditsModal
        isOpen={showNoCredits}
        onClose={() => setShowNoCredits(false)}
        onBuyCredits={() => {
          setShowNoCredits(false);
          onBuyExtraCredits?.();
        }}
      />
    </div>
  );
}
