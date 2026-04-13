import { useState } from "react";
import { X, Share2, Download, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getMoodTheme } from "@/lib/moodTheme";
import { AnalysisSharePreview } from "./AnalysisSharePreview";
import { usePet } from "@/hooks/usePet";

export interface AnalysisCardData {
  imageUrl: string;
  mood: string;
  moodEmoji: string;
  moodDescription: string;
  confidence: number;
  careTip?: string;
}

interface AnalysisCardProps {
  data: AnalysisCardData;
  onClose: () => void;
  isClosing?: boolean;
  title?: string;
  date?: string;
  showReplaceButton?: boolean;
  onReplacePhoto?: () => void;
  onDelete?: () => void;
  isEmbedded?: boolean;
  badgeCount?: number;
}

export function AnalysisCard({
  data,
  onClose,
  isClosing = false,
  title = "Analysis Card",
  date,
  showReplaceButton = false,
  onReplacePhoto,
  onDelete,
  isEmbedded = false,
  badgeCount = 0,
}: AnalysisCardProps) {
  const { t } = useLanguage();
  const { pet } = usePet();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSharePreview, setShowSharePreview] = useState(false);

  // Format date as numeric: 2026.01.08
  const headerDate = date
    ? date
    : (() => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}.${m}.${day}`;
    })();

  const moodStyles = getMoodTheme(data.mood);

  const handleShareToStory = () => {
    setShowSharePreview(true);
  };

  const handleDownloadImage = async () => {
    if (!data.imageUrl) return;

    try {
      if (Capacitor.isNativePlatform()) {
        toast.loading("Preparing download...");
        
        // Fetch the image
        const response = await fetch(data.imageUrl);
        const blob = await response.blob();
        
        // Convert to base64
        const reader = new FileReader();
        await new Promise((resolve, reject) => {
          reader.onload = resolve;
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        
        const base64Data = reader.result as string;
        const fileName = `pawmood-${Date.now()}.jpg`;
        
        // Save to filesystem
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache, // Use Cache as temporary
        });

        const uriResult = await Filesystem.getUri({
          directory: Directory.Cache,
          path: fileName
        });

        // Use Share API as a way to "Save Image" or "Download" consistently on both iOS/Android
        // This is often the most reliable way to get it into the gallery without extra plugins
        await Share.share({
          title: 'Save Pet Mood Analysis',
          text: 'Check out my pet\'s mood!',
          url: uriResult.uri,
          dialogTitle: 'Save to Gallery',
        });

        toast.dismiss();
        toast.success("Download started!");
      } else {
        const link = document.createElement('a');
        link.href = data.imageUrl;
        link.download = `petmood-${new Date().toISOString().split('T')[0]}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Image downloaded!");
      }
    } catch (e) {
      toast.dismiss();
      toast.error("Failed to download image");
      console.error("Download error:", e);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete?.();
  };

  // The inner content of the card - shared between embedded and overlay modes
  const cardContent = (
    <>
      {/* Compact top header area - mood-based ambient background */}
      <div
        className={`flex-shrink-0 ${moodStyles.bg}`}
        style={{ boxShadow: `inset ${moodStyles.glow}` }}
      >
        {/* Top-attached inverted U title section - mood-themed border */}
        <div className="flex justify-center">
          <div
            className={`bg-white border-l-2 border-r-2 border-b-2 ${moodStyles.border} rounded-b-2xl px-8 py-1 flex items-center gap-2 shadow-sm`}
          >
            <span className="text-sm" style={{ filter: `drop-shadow(0 0 5px hsl(${moodStyles.accentHsl} / 0.6))` }}>✨</span>
            <span className="text-sm font-extrabold text-emphasis tracking-wide">{title}</span>
            <span className="text-sm" style={{ filter: `drop-shadow(0 0 5px hsl(${moodStyles.accentHsl} / 0.6))` }}>✨</span>
          </div>
        </div>

        {/* Date + Action buttons row */}
        <div className="flex items-center justify-between px-3 pt-0.5 pb-1.5">
          {showReplaceButton && onReplacePhoto ? (
            <div className="relative">
              <button
                onClick={onReplacePhoto}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-neutral-200/60 transition-colors shadow-sm hover:scale-105 active:scale-95"
              >
                <RefreshCw className="w-4 h-4 text-foreground" />
              </button>
              {badgeCount > 0 && (
                <div className="absolute -top-1 -right-1 flex item-center justify-center z-20 pointer-events-none">
                  <span className={cn(
                    "flex items-center justify-center bg-[#FF6A00] text-white text-[9px] font-bold border border-white shadow-sm leading-none rounded-full h-4 min-w-[16px] px-1",
                    badgeCount <= 9 && "w-4"
                  )}>
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                </div>
              )}
            </div>
          ) : <div className="w-8" />}

          <span className="text-sm font-extrabold text-black tracking-wider">{headerDate}</span>

          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            disabled={isClosing}
            className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-neutral-200/60 transition-colors shadow-sm hover:scale-105 active:scale-95"
          >
            {isClosing ? <div className="w-4 h-4 border-2 border-primary/30 border-t-primary/40 rounded-full animate-spin" /> : <X className="w-4 h-4 text-foreground" />}
          </button>
        </div>
      </div>

      {/* Pet Image Area - Flexible 45% of available space */}
      <div className={`w-full flex-shrink-0 relative border-y-2 ${moodStyles.border}`} style={{ flex: '1 1 45%', minHeight: '0' }}>
        <img src={data.imageUrl} alt="Pet" className="w-full h-full object-cover object-center" crossOrigin="anonymous" />
      </div>

      {/* Result Section */}
      <div className={`${moodStyles.bg} px-4 py-3 flex flex-col flex-1 min-h-0 relative z-10`}>
        <div className="absolute inset-0 pointer-events-none opacity-40 shadow-inner" style={{ boxShadow: `inset ${moodStyles.glow}` }} />

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className={`rounded-xl ${moodStyles.pillBg} flex items-center justify-center flex-shrink-0 border ${moodStyles.pillBorder}`} style={{ width: '45px', height: '45px', fontSize: '1.25rem', boxShadow: moodStyles.emojiGlow }}>
            {data.moodEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <span className={`inline-block px-3 rounded-full text-lg font-black leading-none ${moodStyles.pillBg} text-foreground border ${moodStyles.pillBorder}`} style={{ paddingTop: '8px', paddingBottom: '8px', boxShadow: moodStyles.pillGlow }}>
              {data.mood}
            </span>
            <div className="flex items-center gap-2.5 mt-1.5">
              <div className="flex-1 h-2.5 bg-white rounded-full overflow-hidden relative border-2 border-black">
                <div className={`h-full ${moodStyles.progressFill} transition-all duration-1000 ease-out`} style={{ width: `${data.confidence}%` }} />
              </div>
              <span className="text-sm font-extrabold text-black">{data.confidence}%</span>
            </div>
          </div>
        </div>

        {/* Scrollable Description */}
        <div className="flex-1 py-2 space-y-2.5 overflow-y-auto scrollbar-hide min-h-0">
          <p className="text-foreground/90 text-[13px] leading-[1.4] tracking-tight">{data.moodDescription}</p>
          {data.careTip && (
            <div className="bg-card/60 rounded-xl px-3 py-2 border border-black/5">
              <p className="text-[13px] text-foreground/85 leading-[1.4]">
                <span className="font-bold text-primary">💡</span> {data.careTip}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 pt-1.5 flex-shrink-0 mt-auto items-center">
          <Button variant="outline" size="sm" className={`flex-1 h-8 text-[11px] font-semibold bg-card/80 ${moodStyles.buttonBorder} rounded-xl shadow-sm transition-all flex items-center justify-center gap-1 active:scale-95`} onClick={handleShareToStory}>
            <Share2 className="w-3.5 h-3.5" />
            <span className="truncate">{t("shareToStory") || "Share to Story"}</span>
          </Button>
          <Button variant="outline" size="sm" className={`flex-1 h-8 text-[11px] font-semibold bg-card/80 ${moodStyles.buttonBorder} rounded-xl shadow-sm transition-all flex items-center justify-center gap-1 active:scale-95`} onClick={handleDownloadImage}>
            <Download className="w-3.5 h-3.5" />
            <span className="truncate">{t("downloadImage") || "Download Image"}</span>
          </Button>
          {onDelete && (
            <Button variant="outline" size="sm" className={`h-8 w-8 bg-card/80 ${moodStyles.buttonBorder} rounded-full flex items-center justify-center active:scale-95 shadow-sm`} onClick={handleDeleteClick}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {isEmbedded ? (
        <div className={`w-full h-full flex flex-col bg-card rounded-3xl border-2 ${moodStyles.border} overflow-hidden`}>
          {cardContent}
        </div>
      ) : (
        <div className="fixed inset-x-0 top-0 bottom-[104px] z-50 animate-fade-in-up flex items-center justify-center p-4 pointer-events-none">
          <div className="w-full h-auto max-h-full max-w-[420px] flex flex-col pointer-events-auto">
            <div className={`w-full h-auto max-h-full flex flex-col bg-card shadow-2xl rounded-[2rem] border-2 ${moodStyles.border} overflow-hidden relative shadow-warm-glow active:scale-[0.99] transition-transform duration-200`}>
              {cardContent}
            </div>
          </div>
        </div>
      )}

      {/* Modals rendered outside the card but accessible */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-[320px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-base">This action cannot be undone.</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm">Are you sure you want to delete this analysis?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-center">
            <AlertDialogCancel className="flex-1 mt-0" onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.stopPropagation(); handleConfirmDelete(); }} className="flex-1 bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AnalysisSharePreview
        isOpen={showSharePreview}
        onClose={() => setShowSharePreview(false)}
        data={data}
        date={headerDate}
        petName={pet?.name || "My Pet"}
      />
    </>
  );
}
