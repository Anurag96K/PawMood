import { useState } from "react";
import { X, Share2, Download, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
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
      const link = document.createElement('a');
      link.href = data.imageUrl;
      link.download = `petmood-${new Date().toISOString().split('T')[0]}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Image downloaded!");
    } catch {
      toast.error("Failed to download image");
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete?.();
  };

  const cardContent = (
    <>
      {/* Full card container with mood-based border */}
      <div className={`h-full flex flex-col bg-card shadow-warm-glow rounded-3xl border-2 ${moodStyles.border} overflow-hidden`}>
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
              {/* Glowing emoji */}
              <span 
                className="text-sm"
                style={{ 
                  filter: 'drop-shadow(0 0 5px hsl(var(--primary) / 0.6))',
                }}
              >
                ✨
              </span>
              <span className="text-sm font-extrabold text-emphasis tracking-wide">
                {title}
              </span>
              <span 
                className="text-sm"
                style={{ 
                  filter: 'drop-shadow(0 0 5px hsl(var(--primary) / 0.6))',
                }}
              >
                ✨
              </span>
            </div>
          </div>

          {/* Date + Action buttons row - with spacing from photo */}
          <div className="flex items-center justify-between px-3 pt-0.5 pb-1.5">
            {/* Replace button - left side */}
            {showReplaceButton && onReplacePhoto ? (
              <button
                onClick={onReplacePhoto}
                className={`w-8 h-8 bg-white rounded-full flex items-center justify-center border ${moodStyles.buttonBorder} hover:bg-white/80 transition-colors shadow-sm hover:scale-105`}
              >
                <RefreshCw className="w-4 h-4 text-foreground" />
              </button>
            ) : (
              <div className="w-8" /> 
            )}
            
            {/* Date - center, bold black text */}
            <span className="text-sm font-extrabold text-black tracking-wider">
              {headerDate}
            </span>
            
            {/* Close button - right side, mood-themed border */}
            <button 
              onClick={onClose}
              disabled={isClosing}
              className={`w-8 h-8 bg-white rounded-full flex items-center justify-center border ${moodStyles.buttonBorder} hover:bg-white/80 transition-colors shadow-sm hover:scale-105`}
            >
              {isClosing ? (
                <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
              ) : (
                <X className="w-4 h-4 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Pet Image - more vertical space, with mood-based border */}
        <div className={`w-full flex-shrink-0 relative border-y-2 ${moodStyles.border}`} style={{ height: '55%' }}>
          <img 
            src={data.imageUrl} 
            alt="Pet" 
            className="w-full h-full object-cover object-center" 
          />
        </div>

        {/* Analysis Result Section - mood-based ambient background */}
        <div 
          className={`${moodStyles.bg} px-4 py-2.5 flex flex-col flex-1 min-h-0 overflow-hidden`}
          style={{ boxShadow: `inset ${moodStyles.glow}` }}
        >
          
          {/* Mood info row - with mood-themed glow on pill and emoji */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Emoji container - 6% smaller (45px from 48px) for hierarchy */}
            <div 
              className={`rounded-xl ${moodStyles.pillBg} flex items-center justify-center flex-shrink-0 border ${moodStyles.pillBorder}`}
              style={{ width: '45px', height: '45px', fontSize: '1.25rem', boxShadow: moodStyles.emojiGlow }}
            >
              {data.moodEmoji}
            </div>
            <div className="flex-1 min-w-0">
              {/* Mood label - +2px height (py-2 = 8px vs py-1.5 = 6px) */}
              <span 
                className={`inline-block px-3 rounded-full text-lg font-black leading-none ${moodStyles.pillBg} text-foreground border ${moodStyles.pillBorder}`}
                style={{ paddingTop: '8px', paddingBottom: '8px', boxShadow: moodStyles.pillGlow }}
              >
                {data.mood}
              </span>
              {/* Progress bar with percentage - mood-colored fill, strong black border track, position indicator */}
              <div className="flex items-center gap-2.5 mt-1.5">
                <div 
                  className="flex-1 h-2.5 bg-white rounded-full overflow-hidden relative"
                  style={{ border: '2px solid #000000' }}
                >
                  <div 
                    className={`h-full ${moodStyles.progressFill} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${data.confidence}%`, border: '2px solid #000000', marginLeft: '-2px', marginTop: '-2px', marginBottom: '-2px', height: 'calc(100% + 4px)', boxSizing: 'border-box' }} 
                  />
                </div>
                {/* Percentage - larger, bolder, pure black */}
                <span className="text-sm font-extrabold text-black">
                  {data.confidence}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Content area - no internal scroll, fits single screen */}
          <div className="flex-1 py-1.5 space-y-2 min-h-0 overflow-hidden">
            {/* Description - wraps properly */}
            <p className="text-foreground/90 text-sm" style={{ lineHeight: '1.48' }}>{data.moodDescription}</p>
            
            {/* Care tip - wraps properly with no clipping */}
            {data.careTip && (
              <div className="bg-card/60 rounded-lg px-2 py-1.5">
                <p className="text-sm text-foreground/85" style={{ lineHeight: '1.48' }}>
                  <span className="font-bold text-primary">💡</span> {data.careTip}
                </p>
              </div>
            )}
          </div>

          {/* Action buttons - mood-themed borders */}
          <div className="flex gap-1.5 pt-0.5 flex-shrink-0">
            <Button 
              onClick={handleShareToStory} 
              variant="outline" 
              size="sm"
              className={`flex-1 h-8 text-xs font-semibold bg-card/80 ${moodStyles.buttonBorder} hover:bg-card shadow-warm px-2 min-h-0`}
            >
              <Share2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{t("shareToStory")}</span>
            </Button>
            <Button 
              onClick={handleDownloadImage} 
              variant="outline" 
              size="sm"
              className={`flex-1 h-8 text-xs font-semibold bg-card/80 ${moodStyles.buttonBorder} hover:bg-card shadow-warm px-2 min-h-0`}
            >
              <Download className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{t("downloadImage")}</span>
            </Button>
            {onDelete && (
              <Button 
                onClick={handleDeleteClick} 
                variant="outline" 
                size="sm"
                className={`h-8 w-10 flex-shrink-0 bg-card/80 ${moodStyles.buttonBorder} hover:bg-card shadow-warm px-0 min-h-0`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal - stop propagation to prevent closing parent */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-[320px] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-base">
              This action cannot be undone.
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm">
              Are you sure you want to delete this analysis?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-center">
            <AlertDialogCancel 
              className="flex-1 mt-0"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.stopPropagation();
                handleConfirmDelete();
              }}
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Share Preview Modal */}
      <AnalysisSharePreview
        isOpen={showSharePreview}
        onClose={() => setShowSharePreview(false)}
        data={data}
        date={headerDate}
        petName={pet?.name || "My Pet"}
      />
    </>
  );
  if (isEmbedded) {
    return <div className="h-full">{cardContent}</div>;
  }

  return (
    <div className="fixed inset-x-2 top-2 bottom-24 z-50 animate-fade-in-up">
      {cardContent}
    </div>
  );
}
