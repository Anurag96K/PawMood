import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { TranslationKey } from "@/lib/translations";
import { AnalysisCard } from "@/components/calendar/AnalysisCard";
import { ReplaceSelectionModal } from "@/components/calendar/ReplaceSelectionModal";
import { MoodEntry, AnalysisResult } from "@/hooks/useMoodEntries";
import { useBadge } from "@/contexts/BadgeContext";
import { usePrimaryPhoto } from "@/hooks/usePrimaryPhoto";
import { useSharedElement } from "@/contexts/SharedElementContext";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

// Validate that URL is from our trusted storage domain
const isValidStorageUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) return false;
    const supabaseHost = new URL(supabaseUrl).hostname;
    return parsedUrl.hostname === supabaseHost || parsedUrl.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
};

export interface CalendarEntryData {
  id: string;
  date: Date;
  photo: string;
  moodKey: TranslationKey;
  descKey: TranslationKey;
  careTipKey: TranslationKey;
  emoji: string;
  confidence: number;
  memo?: string;
  // Additional fields for AI-generated content
  moodText?: string;
  descText?: string;
  careTipText?: string;
}

interface DateGroup {
  dateKey: string;
  date: Date;
  representativeEntry: CalendarEntryData;
  allEntries: CalendarEntryData[];
}

interface FullScreenMoodViewerProps {
  allEntries: CalendarEntryData[]; // All entries (for date navigation)
  initialDateKey: string; // The date to start on (YYYY-MM-DD)
  onClose: (finalDateKey?: string) => void; // Now passes the final viewed date key
  // Pre-sync callback: called BEFORE animation starts, syncs calendar and returns target cell rect
  onPreClose?: (dateKey: string) => Promise<DOMRect | null>;

  // Use the SAME entry source + actions as the calendar screen so deletes/updates propagate.
  moodEntries: MoodEntry[];
  uploadImage: (imageData: string) => Promise<string>;
  analyzeMood: (imageBase64: string) => Promise<AnalysisResult>;
  createEntry: (imageUrl: string, analysis: AnalysisResult, memo?: string) => Promise<MoodEntry>;
  deleteEntry: (entryId: string) => Promise<void>;

  onReplace?: (newEntry: MoodEntry) => void;
  hasCredits?: boolean;
  isPremium?: boolean;
  onNavigateToProfile?: (openPlanSection?: boolean) => void;
}

export function FullScreenMoodViewer({
  allEntries,
  initialDateKey,
  onClose,
  onPreClose,
  moodEntries,
  uploadImage,
  analyzeMood,
  createEntry,
  deleteEntry,
  onReplace,
  hasCredits = true,
  isPremium = true,
  onNavigateToProfile,
}: FullScreenMoodViewerProps) {
  const { t } = useLanguage();
  const { addUnreadEntry, markEntryAsRead, isEntryUnread } = useBadge();
  const { getPrimaryPhoto, setPrimaryPhoto } = usePrimaryPhoto();
  const { photoFrame, setPhotoFrame, exitTargetRef } = useSharedElement();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [contentReady, setContentReady] = useState(false);
  // Force re-render when primary photo changes
  const [primaryUpdateKey, setPrimaryUpdateKey] = useState(0);
  // Local exit target state that triggers re-render before animation
  const [exitTarget, setExitTarget] = useState(photoFrame);

  // Group entries by date and determine representative per date
  // Uses primaryPhoto from localStorage if set, otherwise falls back to earliest entry
  const dateGroups = useMemo(() => {
    const groups = new Map<string, DateGroup>();
    
    // Sort entries by creation time (earliest first)
    const sortedEntries = [...allEntries].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    
    sortedEntries.forEach(entry => {
      const year = entry.date.getFullYear();
      const month = String(entry.date.getMonth() + 1).padStart(2, '0');
      const day = String(entry.date.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      if (!groups.has(dateKey)) {
        groups.set(dateKey, {
          dateKey,
          date: entry.date,
          representativeEntry: entry, // Placeholder, will be updated below
          allEntries: [entry],
        });
      } else {
        groups.get(dateKey)!.allEntries.push(entry);
      }
    });
    
    // Now determine the actual representative for each group
    groups.forEach((group, dateKey) => {
      const primaryId = getPrimaryPhoto(dateKey);
      if (primaryId) {
        // Try to find the primary entry
        const primaryEntry = group.allEntries.find(e => e.id === primaryId);
        if (primaryEntry) {
          group.representativeEntry = primaryEntry;
        }
        // If primary entry not found (maybe deleted), fall back to first
      }
      // Otherwise keep the first entry (already set)
    });
    
    // Sort by dateKey chronologically
    return Array.from(groups.values()).sort(
      (a, b) => a.dateKey.localeCompare(b.dateKey)
    );
  }, [allEntries, getPrimaryPhoto, primaryUpdateKey]);

  // Find initial index based on initialDateKey
  const initialIndex = useMemo(() => {
    const index = dateGroups.findIndex(g => g.dateKey === initialDateKey);
    return index >= 0 ? index : 0;
  }, [dateGroups, initialDateKey]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Carousel setup for date navigation
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false,
    startIndex: initialIndex,
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Track current slide and mark entries as read
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const newIndex = emblaApi.selectedScrollSnap();
    setCurrentIndex(newIndex);
    
    // Mark all entries for this date as read
    const dateGroup = dateGroups[newIndex];
    if (dateGroup) {
      dateGroup.allEntries.forEach(entry => {
        if (isEntryUnread(entry.id)) {
          markEntryAsRead(entry.id);
        }
      });
    }
  }, [emblaApi, dateGroups, isEntryUnread, markEntryAsRead]);

  // Subscribe to slide changes
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Mark initial date's entries as read when viewer opens
  useEffect(() => {
    const dateGroup = dateGroups[initialIndex];
    if (dateGroup) {
      dateGroup.allEntries.forEach(entry => {
        if (isEntryUnread(entry.id)) {
          markEntryAsRead(entry.id);
        }
      });
    }
  }, [dateGroups, initialIndex, isEntryUnread, markEntryAsRead]);

  const currentGroup = dateGroups[currentIndex];
  const currentEntry = currentGroup?.representativeEntry;
  const hasMultipleDates = dateGroups.length > 1;

  const MONTHS: TranslationKey[] = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
  ];

  const formattedDate = currentEntry 
    ? `${t(MONTHS[currentEntry.date.getMonth()])} ${currentEntry.date.getDate()}, ${currentEntry.date.getFullYear()}`
    : "";

  // Get MoodEntry objects for current date (for replace modal)
  // This must update when currentIndex changes (after swiping)
  const currentDateMoodEntries = useMemo(() => {
    const group = dateGroups[currentIndex];
    if (!group) return [];
    return moodEntries.filter((e) => {
      const entryDate = new Date(e.analyzed_at);
      return (
        entryDate.getFullYear() === group.date.getFullYear() &&
        entryDate.getMonth() === group.date.getMonth() &&
        entryDate.getDate() === group.date.getDate()
      );
    });
  }, [moodEntries, dateGroups, currentIndex]);

  // Show replace button if there's at least one entry for this date
  // Button is visible for all users, but action is gated by isPremium
  const showReplaceButton = currentDateMoodEntries.length >= 1;

  const handleReplacePhoto = () => {
    // If not premium, navigate to profile plan section instead
    if (!isPremium) {
      onNavigateToProfile?.(true);
      return;
    }
    setShowReplaceModal(true);
  };

  const handleSelectReplacement = async (selectedEntry: MoodEntry, reAnalyze: boolean) => {
    if (!currentEntry || !currentGroup) return;
    
    setIsProcessing(true);
    const dateKey = currentGroup.dateKey;
    
    try {
      if (reAnalyze) {
        // Validate URL before fetching
        if (!isValidStorageUrl(selectedEntry.image_url)) {
          toast.error("Invalid image source");
          setIsProcessing(false);
          return;
        }

        // Re-analyze the selected photo with timeout and validation
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
          const response = await fetch(selectedEntry.image_url, { signal: controller.signal });
          clearTimeout(timeout);
          
          // Validate content type
          const contentType = response.headers.get('content-type');
          if (!contentType?.startsWith('image/')) {
            throw new Error('Invalid content type');
          }
          
          const blob = await response.blob();
          
          // Validate blob size (max 10MB)
          if (blob.size > 10 * 1024 * 1024) {
            throw new Error('Image too large');
          }
          
          const reader = new FileReader();
          
          reader.onloadend = async () => {
            const imageData = reader.result as string;
            
            try {
              const analysisResult: AnalysisResult = await analyzeMood(imageData);
              const imageUrl = await uploadImage(imageData);
              const newEntry = await createEntry(imageUrl, analysisResult);
              
              // Set the new entry as the primary photo for this date
              setPrimaryPhoto(dateKey, newEntry.id);
              setPrimaryUpdateKey(k => k + 1);
              
              addUnreadEntry(newEntry.id, new Date(newEntry.analyzed_at));
              
              toast.success(
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Photo replaced and re-analyzed</span>
                </div>,
                { duration: 2000 }
              );
              
              if (onReplace && newEntry) {
                onReplace(newEntry);
              }
              
              onClose();
            } catch (error) {
              console.error("Error re-analyzing photo:", error);
              toast.error("Failed to re-analyze photo");
            } finally {
              setIsProcessing(false);
            }
          };
          reader.readAsDataURL(blob);
        } catch (fetchError) {
          clearTimeout(timeout);
          console.error("Error fetching image:", fetchError);
          toast.error("Failed to fetch image");
          setIsProcessing(false);
          return;
        }
      } else {
        // Just swap representative - set the selected entry as primary for this date
        setPrimaryPhoto(dateKey, selectedEntry.id);
        setPrimaryUpdateKey(k => k + 1);
        
        toast.success(
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>Representative photo changed</span>
          </div>,
          { duration: 2000 }
        );
        
        if (onReplace) {
          onReplace(selectedEntry);
        }
        
        setIsProcessing(false);
        onClose();
      }
    } catch (error) {
      console.error("Error replacing photo:", error);
      toast.error("Failed to replace photo");
      setIsProcessing(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!currentEntry) return;
    
    setIsProcessing(true);
    try {
      // Delete the entry from the database
      await deleteEntry(currentEntry.id);
      
      // Also mark as read to remove from badge count
      if (isEntryUnread(currentEntry.id)) {
        markEntryAsRead(currentEntry.id);
      }
      
      toast.success("Analysis card deleted");
      onClose();
    } catch (error) {
      console.error("Error deleting card:", error);
      toast.error("Failed to delete card");
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate origin position for animation - uses exitTarget for consistency
  // MUST be defined before early return to satisfy React hooks rules
  const getOriginTransform = useCallback(() => {
    const target = exitTarget || photoFrame;
    if (!target) return {};
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    // Card position
    const cardX = 8;
    const cardY = 8;
    const cardWidth = viewportWidth - 16;
    const cardHeight = viewportHeight - 8 - 96;
    
    // Calculate center offset
    const originCenterX = target.x + target.width / 2;
    const originCenterY = target.y + target.height / 2;
    const cardCenterX = cardX + cardWidth / 2;
    const cardCenterY = cardY + cardHeight / 2;
    
    return {
      x: originCenterX - cardCenterX,
      y: originCenterY - cardCenterY,
      scale: target.width / cardWidth,
    };
  }, [exitTarget, photoFrame]);

  const originTransform = getOriginTransform();

  if (!currentEntry || dateGroups.length === 0) return null;

  // Spring animation config for premium, emotionally warm motion
  const springTransition = {
    type: "spring" as const,
    stiffness: 260,
    damping: 26,
    mass: 0.95,
  };

  const contentStagger = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.15,
      },
    },
  };

  const contentItem = {
    hidden: { opacity: 0, y: 8 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    },
  };

  const handleClose = async () => {
    const currentDateKey = currentGroup?.dateKey;
    
    // If navigated to a different date, sync calendar BEFORE animation
    if (currentDateKey && currentDateKey !== initialDateKey && onPreClose) {
      // Pre-sync: update calendar to the new date and get target cell rect
      const targetRect = await onPreClose(currentDateKey);
      
      // Update exit target to animate to the new target cell
      if (targetRect && currentEntry) {
        const newTarget = {
          x: targetRect.left,
          y: targetRect.top,
          width: targetRect.width,
          height: targetRect.height,
          imageUrl: currentEntry.photo,
        };
        // Update both ref (for synchronous access) and state (to trigger re-render)
        exitTargetRef.current = newTarget;
        setExitTarget(newTarget);
        setPhotoFrame(newTarget);
        
        // Wait for React to re-render with the new exitTarget before starting animation
        await new Promise<void>(resolve => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve();
            });
          });
        });
      }
    }
    
    // Now start the exit animation
    setIsVisible(false);
    
    // Wait for exit animation before calling onClose
    setTimeout(() => {
      setPhotoFrame(null);
      exitTargetRef.current = null;
      onClose(currentDateKey);
    }, 420);
  };

  return (
    <div data-modal-container="true" onPointerDown={(e) => e.stopPropagation()}>
      <AnimatePresence mode="wait">
        {isVisible && (
          <>
            {/* Background dim overlay - NO blur, just subtle dim */}
            <motion.div
              className="fixed inset-0 bg-black/15 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              onClick={handleClose}
            />

            {/* Floating photo that morphs from circle to card image */}
            {(exitTarget || photoFrame) && (
              <motion.div
                className="fixed z-[51] pointer-events-none"
                initial={{
                  left: photoFrame?.x ?? 0,
                  top: photoFrame?.y ?? 0,
                  width: photoFrame?.width ?? 32,
                  height: photoFrame?.height ?? 32,
                  borderRadius: "9999px",
                  opacity: 1,
                  clipPath: "inset(0 round 9999px)",
                }}
                animate={{
                  left: 8,
                  top: 80, // Account for header
                  width: "calc(100vw - 16px)",
                  height: "calc((100vh - 8px - 96px) * 0.55)",
                  borderRadius: "0px",
                  opacity: contentReady ? 0 : 1,
                  clipPath: "inset(0 round 0px)",
                }}
                exit={{
                  left: (exitTarget || photoFrame)?.x ?? 0,
                  top: (exitTarget || photoFrame)?.y ?? 0,
                  width: (exitTarget || photoFrame)?.width ?? 32,
                  height: (exitTarget || photoFrame)?.height ?? 32,
                  borderRadius: "9999px",
                  opacity: 1,
                  clipPath: "inset(0 round 9999px)",
                }}
                transition={springTransition}
                onAnimationComplete={() => setContentReady(true)}
                style={{
                  boxShadow: "0 12px 40px -12px rgba(0,0,0,0.25)",
                  overflow: "hidden",
                }}
              >
                <img
                  src={(exitTarget || photoFrame)?.imageUrl ?? ""}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </motion.div>
            )}

            {/* Card container that expands from photo origin */}
            <motion.div
              className="fixed inset-x-2 top-2 bottom-24 z-50 overflow-hidden"
              initial={photoFrame ? {
                opacity: 0,
                scale: originTransform.scale || 0.1,
                x: originTransform.x || 0,
                y: originTransform.y || 0,
              } : {
                opacity: 0,
                scale: 0.92,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                x: 0,
                y: 0,
              }}
              exit={(exitTarget || photoFrame) ? {
                opacity: 0,
                scale: originTransform.scale || 0.1,
                x: originTransform.x || 0,
                y: originTransform.y || 0,
              } : {
                opacity: 0,
                scale: 0.92,
                y: 20,
              }}
              transition={springTransition}
            >
              {hasMultipleDates ? (
                /* Carousel container for date navigation */
                <div className="h-full relative">
                  <div className="overflow-hidden h-full rounded-3xl" ref={emblaRef}>
                    <div className="flex h-full">
                      {dateGroups.map((group, index) => {
                        const entry = group.representativeEntry;
                        const groupFormattedDate = `${t(MONTHS[entry.date.getMonth()])} ${entry.date.getDate()}, ${entry.date.getFullYear()}`;
                        const groupDateKey = group.dateKey;
                        const groupDateEntries = moodEntries.filter((e) => {
                          const d = new Date(e.analyzed_at);
                          const y = d.getFullYear();
                          const m = String(d.getMonth() + 1).padStart(2, "0");
                          const day = String(d.getDate()).padStart(2, "0");
                          const entryDateKey = `${y}-${m}-${day}`;
                          return entryDateKey === groupDateKey;
                        });
                        const groupShowReplace = groupDateEntries.length >= 1;
                        
                        return (
                          <motion.div 
                            key={group.dateKey} 
                            className="flex-[0_0_100%] min-w-0 h-full"
                            variants={contentStagger}
                            initial="hidden"
                            animate="visible"
                          >
                            <motion.div variants={contentItem} className="h-full">
                              <AnalysisCard
                                data={{
                                  imageUrl: entry.photo,
                                  mood: entry.moodText || t(entry.moodKey),
                                  moodEmoji: entry.emoji,
                                  moodDescription: entry.descText || t(entry.descKey),
                                  confidence: entry.confidence,
                                  careTip: entry.careTipText || t(entry.careTipKey),
                                }}
                                onClose={handleClose}
                                date={groupFormattedDate}
                                isClosing={isProcessing && currentIndex === index}
                                showReplaceButton={groupShowReplace}
                                onReplacePhoto={handleReplacePhoto}
                                onDelete={handleDeleteCard}
                                isEmbedded
                              />
                            </motion.div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Navigation arrows */}
                  {dateGroups.length > 1 && currentIndex > 0 && (
                    <motion.button
                      initial={false}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={scrollPrev}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-card/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-warm z-40 hover:bg-card transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-foreground" />
                    </motion.button>
                  )}
                  {dateGroups.length > 1 && currentIndex < dateGroups.length - 1 && (
                    <motion.button
                      initial={false}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={scrollNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-card/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-warm z-40 hover:bg-card transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-foreground" />
                    </motion.button>
                  )}
                </div>
              ) : (
                <motion.div
                  className="h-full"
                  variants={contentStagger}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div variants={contentItem} className="h-full">
                    <AnalysisCard
                      data={{
                        imageUrl: currentEntry.photo,
                        mood: currentEntry.moodText || t(currentEntry.moodKey),
                        moodEmoji: currentEntry.emoji,
                        moodDescription: currentEntry.descText || t(currentEntry.descKey),
                        confidence: currentEntry.confidence,
                        careTip: currentEntry.careTipText || t(currentEntry.careTipKey),
                      }}
                      onClose={handleClose}
                      date={formattedDate}
                      isClosing={isProcessing}
                      showReplaceButton={showReplaceButton}
                      onReplacePhoto={handleReplacePhoto}
                      onDelete={handleDeleteCard}
                    />
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Replace Selection Modal */}
      {showReplaceModal && (
        <ReplaceSelectionModal
          entries={currentDateMoodEntries}
          currentEntryId={currentEntry.id}
          onSelect={handleSelectReplacement}
          onClose={() => setShowReplaceModal(false)}
        />
      )}
    </div>
  );
}
