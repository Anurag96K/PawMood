import { useState, useEffect } from "react";
import { X, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { MoodEntry } from "@/hooks/useMoodEntries";
import { useBadge } from "@/contexts/BadgeContext";
import { cn } from "@/lib/utils";

interface ReplaceSelectionModalProps {
  entries: MoodEntry[];
  currentEntryId: string;
  onSelect: (entry: MoodEntry, reAnalyze: boolean) => void;
  onClose: () => void;
}

export function ReplaceSelectionModal({
  entries,
  currentEntryId,
  onSelect,
  onClose,
}: ReplaceSelectionModalProps) {
  const { t } = useLanguage();
  const { markEntryAsRead, isEntryUnread } = useBadge();
  const [selectedEntry, setSelectedEntry] = useState<MoodEntry | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  // Filter out the current entry from selectable options
  const selectableEntries = entries.filter(e => e.id !== currentEntryId);

  // Mark all entries as read when modal opens (user views all photos)
  useEffect(() => {
    entries.forEach(entry => {
      if (isEntryUnread(entry.id)) {
        markEntryAsRead(entry.id);
      }
    });
  }, [entries, isEntryUnread, markEntryAsRead]);

  // Lock body scroll when modal is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, []);

  const handlePhotoSelect = (entry: MoodEntry) => {
    setSelectedEntry(entry);
    setShowOptions(true);
  };

  const handleConfirm = (reAnalyze: boolean) => {
    if (selectedEntry) {
      onSelect(selectedEntry, reAnalyze);
    }
    setShowOptions(false);
    setSelectedEntry(null);
    onClose();
  };

  const handleCancel = () => {
    setShowOptions(false);
    setSelectedEntry(null);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      data-modal-container="true"
    >
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-warm-lg overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h3 className="text-lg font-bold text-emphasis">
              {showOptions ? t("confirmReplace") : t("selectReplacement")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {showOptions ? t("chooseReplaceOption") : t("selectFromToday")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Content */}
        {/* 
           Rules:
           - 1-2 photos: Small container (auto height or small fixed).
           - 3+ photos: Larger FIXED container height.
           - 3-4 photos: NO SCROLL (overflow-hidden).
           - 5+ photos: SCROLL (overflow-y-auto).
        */}
        <div
          className={cn(
            "p-4 w-full transition-all duration-300",
            // Height & Scroll Logic
            selectableEntries.length >= 3
              ? "h-[390px]" // Fixed large height for 3+ items
              : "h-auto", // Default auto behavior for 1-2 items (1 row)

            selectableEntries.length >= 5
              ? "overflow-y-auto" // Enable scroll only for 5+
              : "overflow-hidden" // Lock scroll for 3-4
          )}
        >
          {showOptions && selectedEntry ? (
            // Confirmation options - Full height usage
            <div className="space-y-4 py-2 h-full flex flex-col justify-center">
              <div className="flex justify-center flex-shrink-0">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary shadow-warm">
                  <img
                    src={selectedEntry.image_url}
                    alt="Selected"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <p className="text-sm text-center text-muted-foreground flex-shrink-0">
                {t("replacePhotoConfirmText")}
              </p>
              <div className="space-y-2 flex-grow-0">
                <Button
                  onClick={() => handleConfirm(false)}
                  variant="outline"
                  className="w-full h-11"
                >
                  <Check className="w-4 h-4" />
                  {t("replaceOnly")}
                </Button>
                <Button
                  onClick={() => handleConfirm(true)}
                  className="w-full h-11"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t("replaceAndReanalyze")}
                </Button>
              </div>
            </div>
          ) : (
            // Entry grid
            (selectableEntries.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                {t("noOtherPhotos")}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pb-2">
                {selectableEntries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => handlePhotoSelect(entry)}
                    className="relative aspect-square w-full rounded-xl overflow-hidden border-2 border-transparent hover:border-primary/50 transition-all group shadow-sm bg-muted"
                  >
                    <img
                      src={entry.image_url}
                      alt={entry.mood}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Overlay with mood info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-base flex-shrink-0">{entry.mood_emoji}</span>
                        <span className="text-xs font-semibold text-white truncate">{entry.mood}</span>
                      </div>
                    </div>
                    {/* Hover effect */}
                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
