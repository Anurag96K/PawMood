import { useState, useEffect, useRef, useCallback } from "react";
import { X, Check, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { MoodEntry } from "@/hooks/useMoodEntries";
import { useBadge } from "@/contexts/BadgeContext";

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
  const [isClosing, setIsClosing] = useState(false);
  const [gridMaxHeight, setGridMaxHeight] = useState<number | null>(null);

  // Filter out the current entry and sort by creation time (oldest first for top-left to bottom-right reading order)
  const selectableEntries = entries
    .filter(e => e.id !== currentEntryId)
    .sort((a, b) => new Date(a.analyzed_at).getTime() - new Date(b.analyzed_at).getTime());

  const needsScroll = selectableEntries.length >= 5;

  // Measure the actual rendered cell height to compute exact 2-row height
  // This guarantees pixel-perfect match with the natural 3-4 photo layout
  const measureRef = useCallback((node: HTMLDivElement | null) => {
    if (node && needsScroll && gridMaxHeight === null) {
      requestAnimationFrame(() => {
        const grid = node.querySelector('.grid');
        if (grid && grid.children.length > 0) {
          const firstCell = grid.children[0] as HTMLElement;
          const cellHeight = firstCell.offsetHeight;
          const gap = 8; // gap-2
          const paddingY = 32; // p-4 top + bottom
          setGridMaxHeight(cellHeight * 2 + gap + paddingY);
        }
      });
    }
  }, [needsScroll, gridMaxHeight]);

  // Mark all entries as read when modal opens (user views all photos)
  useEffect(() => {
    entries.forEach(entry => {
      if (isEntryUnread(entry.id)) {
        markEntryAsRead(entry.id);
      }
    });
  }, [entries, isEntryUnread, markEntryAsRead]);

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
    handleClose();
  };

  const handleBack = () => {
    setShowOptions(false);
    setSelectedEntry(null);
  };

  const handleClose = () => {
    setIsClosing(true);
  };

  const handleAnimationComplete = () => {
    if (isClosing) {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <AnimatePresence onExitComplete={handleAnimationComplete}>
      {!isClosing && (
        <>
          {/* Backdrop - animates at same time as modal */}
          <motion.div 
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={handleBackdropClick}
          />
          
          {/* Modal Container - centers the modal */}
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
            <motion.div 
              className="relative w-full max-w-sm bg-card rounded-2xl shadow-warm-lg overflow-hidden pointer-events-auto"
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.90, opacity: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 400,
                damping: 28,
                mass: 0.8
              }}
              onClick={(e) => e.stopPropagation()}
            >
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
                  onClick={showOptions ? handleBack : handleClose}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors active:scale-95"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>

              {/* Content - no scroll for 1-4, scrollable for 5+ with same height as 4-photo layout */}
              <div 
                ref={measureRef}
                className={`p-4 overscroll-contain ${
                  needsScroll ? 'overflow-y-auto' : ''
                }`}
                style={needsScroll && gridMaxHeight ? { 
                  maxHeight: gridMaxHeight,
                  WebkitOverflowScrolling: 'touch',
                } : undefined}
              >
                {showOptions && selectedEntry ? (
                  // Confirmation options - centered layout
                  <div className="flex flex-col items-center gap-4 py-2">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary shadow-warm">
                      <img
                        src={selectedEntry.image_url}
                        alt="Selected"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm text-center text-muted-foreground">
                      {t("replacePhotoConfirmText")}
                    </p>
                    <div className="w-full space-y-2">
                      <Button
                        onClick={() => handleConfirm(false)}
                        variant="outline"
                        className="w-full h-11 active:scale-[0.98] transition-transform"
                      >
                        <Check className="w-4 h-4" />
                        {t("replaceOnly")}
                      </Button>
                      <Button
                        onClick={() => handleConfirm(true)}
                        className="w-full h-11 active:scale-[0.98] transition-transform"
                      >
                        <RefreshCw className="w-4 h-4" />
                        {t("replaceAndReanalyze")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Entry grid
                  <>
                    {selectableEntries.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground text-sm">
                        {t("noOtherPhotos")}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {selectableEntries.map((entry) => (
                          <button
                            key={entry.id}
                            onClick={() => handlePhotoSelect(entry)}
                            className="relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-primary/50 transition-all group shadow-warm active:scale-[0.97]"
                          >
                            <img
                              src={entry.image_url}
                              alt={entry.mood}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-lg">{entry.mood_emoji}</span>
                                <span className="text-xs font-semibold text-white truncate">{entry.mood}</span>
                              </div>
                            </div>
                            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
