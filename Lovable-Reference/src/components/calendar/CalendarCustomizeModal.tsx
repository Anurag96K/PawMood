import { useEffect, useRef, useState, useCallback } from "react";
import { X, Check, Palette, Sparkles, Sticker, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useCalendarDecoration,
  CalendarTheme,
  AccentColor,
  CalendarCardBackground,
  themeConfigs,
  accentColorConfigs,
  calendarCardBackgroundConfigs,
  stickerOptions,
} from "@/contexts/CalendarDecorationContext";

interface CalendarCustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
}

type TabId = "theme" | "accent" | "calendar" | "stickers";

const TAB_ORDER: TabId[] = ["theme", "calendar", "accent", "stickers"];

// Easing for smooth, premium feel
const easeInOutCubic: [number, number, number, number] = [0.65, 0, 0.35, 1];

export function CalendarCustomizeModal({ isOpen, onClose, selectedDate }: CalendarCustomizeModalProps) {
  const { t } = useLanguage();
  const {
    settings,
    updateTheme,
    updateBorderColorMode,
    updateCalendarCardBackground,
    setDayDecoration,
    getDayDecoration,
  } = useCalendarDecoration();
  
  const [activeTab, setActiveTab] = useState<TabId>("theme");
  const [isTabSwitching, setIsTabSwitching] = useState(false);
  const wasOpenRef = useRef(false);
  const tabRefs = useRef<Map<TabId, HTMLButtonElement>>(new Map());
  const tabContainerRef = useRef<HTMLDivElement>(null);

  // Get date key for per-day stickers
  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  // Debounced tab switch to prevent double-taps
  const handleTabSwitch = useCallback((tabId: TabId) => {
    if (isTabSwitching || tabId === activeTab) return;
    setIsTabSwitching(true);
    setActiveTab(tabId);
    // Reset debounce after animation completes
    setTimeout(() => setIsTabSwitching(false), 280);
  }, [isTabSwitching, activeTab]);

  // Calculate pill position based on active tab
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });
  
  useEffect(() => {
    const activeButton = tabRefs.current.get(activeTab);
    const container = tabContainerRef.current;
    if (activeButton && container) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      setPillStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
      });
    }
  }, [activeTab, isOpen]);

  useEffect(() => {
    // Only set initial tab on the open edge; never override while already open
    if (isOpen && !wasOpenRef.current) {
      setActiveTab(selectedDate ? "stickers" : "theme");
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, selectedDate]);

  useEffect(() => {
    if (!isOpen) return;
    console.log(
      "Customize Calendar opened. selectedDate:",
      selectedDate ? getDateKey(selectedDate) : null
    );
  }, [isOpen, selectedDate]);

  useEffect(() => {
    if (activeTab !== "stickers") return;
    console.log(
      "Stickers tab reads selectedDate:",
      selectedDate ? getDateKey(selectedDate) : null
    );
  }, [activeTab, selectedDate]);

  // Get current sticker for selected date
  const currentDateKey = selectedDate ? getDateKey(selectedDate) : null;
  const currentDayDecoration = currentDateKey ? getDayDecoration(currentDateKey) : undefined;
  const currentSticker = currentDayDecoration?.sticker;

  // Handle sticker selection for specific date
  const handleStickerSelect = (sticker: string | undefined) => {
    if (!currentDateKey) return;
    setDayDecoration(currentDateKey, { sticker });
  };

  const tabs = [
    { id: "theme" as const, label: t("customizeTheme"), icon: Palette },
    { id: "accent" as const, label: t("customizeColors"), icon: Sparkles },
    { id: "calendar" as const, label: t("customizeCalendarTab"), icon: LayoutGrid },
    { id: "stickers" as const, label: t("customizeStickers"), icon: Sticker },
  ];

  // Direction for content slide based on tab order
  const getSlideDirection = (currentTab: TabId) => {
    const currentIndex = TAB_ORDER.indexOf(currentTab);
    return currentIndex;
  };

  return (
    <AnimatePresence mode="sync">
      {isOpen && (
        <>
          {/* Backdrop - covers calendar area only, NOT the bottom navigation */}
          <motion.div 
            className="fixed inset-x-0 top-0 bottom-[60px] z-40 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.34, ease: easeInOutCubic }}
            onClick={onClose}
          />
          
          {/* Modal panel - positioned to show just below weekday labels (~65-70% of screen) */}
          <motion.div
            data-modal-container="true"
            className="fixed inset-x-0 bottom-[60px] z-40 w-full max-w-lg mx-auto bg-card rounded-t-3xl shadow-warm-lg overflow-hidden flex flex-col"
            style={{ height: "calc(72vh - 60px)", maxHeight: "540px" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.34, ease: easeInOutCubic }}
          >
            {/* Header with orange Decorate icon */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'hsl(25 80% 95%)' }}
            >
              <Palette className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{t("customizeCalendar")}</h3>
              <p className="text-xs text-muted-foreground">{t("customizeCalendarSubtitle")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Tabs with sliding pill indicator - clipped container */}
        <div className="px-4 pt-4 pb-2">
          <div 
            ref={tabContainerRef}
            className="relative flex gap-1.5 overflow-hidden rounded-lg"
            style={{ isolation: "isolate" }}
          >
            {/* Animated pill indicator - constrained to X-axis only */}
            <motion.div
              className="absolute inset-y-0 bg-primary rounded-lg pointer-events-none"
              initial={false}
              animate={{
                x: pillStyle.left,
                width: pillStyle.width,
              }}
              transition={{
                duration: 0.24,
                ease: easeInOutCubic,
              }}
              style={{ 
                zIndex: 0,
                left: 0,
                top: 0,
                bottom: 0,
              }}
            />
            
            {tabs.map((tab) => (
              <button
                key={tab.id}
                ref={(el) => {
                  if (el) tabRefs.current.set(tab.id, el);
                }}
                onClick={() => handleTabSwitch(tab.id)}
                className={cn(
                  "relative z-10 flex-1 min-w-[80px] flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-[10px] font-medium transition-colors duration-200 whitespace-nowrap",
                  activeTab === tab.id
                    ? "text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                <tab.icon className="w-3 h-3 flex-shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content with fade + slide animation - fills remaining space */}
        <div className="px-4 py-3 pb-6 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{
                duration: 0.22,
                ease: easeInOutCubic,
              }}
              // Consistent min-height across all tabs to prevent layout jumps
              style={{ minHeight: 210 }}
            >
          {activeTab === "theme" && (
            <div className="grid grid-cols-3 gap-2">
              {/* Render color themes first (excluding pawprint) */}
              {(Object.keys(themeConfigs) as CalendarTheme[])
                .filter((theme) => theme !== "pawprint")
                .map((theme) => (
                  <button
                    key={theme}
                    onClick={() => updateTheme(theme)}
                    className={cn(
                      "relative p-3 rounded-xl border-2 transition-all",
                      settings.theme === theme
                        ? "border-primary shadow-warm"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div
                      className={cn("w-full h-10 rounded-lg mb-2", themeConfigs[theme].bg)}
                      style={{ backgroundColor: themeConfigs[theme].preview }}
                    />
                    <p className="text-xs font-medium text-foreground text-center">
                      {themeConfigs[theme].name}
                    </p>
                    <AnimatePresence>
                      {settings.theme === theme && (
                        <motion.div 
                          className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.18, ease: easeInOutCubic }}
                        >
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                ))}
              
              {/* Pawprint pattern theme at the bottom with visual pattern preview */}
              <button
                onClick={() => updateTheme("pawprint")}
                className={cn(
                  "relative p-3 rounded-xl border-2 transition-all",
                  settings.theme === "pawprint"
                    ? "border-primary shadow-warm"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div
                  className="w-full h-10 rounded-lg mb-2 relative overflow-hidden"
                  style={{ 
                    backgroundColor: themeConfigs.pawprint.preview,
                  }}
                >
                  {/* Pawprint pattern overlay */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 60 60'%3E%3Cg fill='%23b87333' opacity='0.25'%3E%3Cellipse cx='30' cy='38' rx='8' ry='10'/%3E%3Ccircle cx='20' cy='26' r='5'/%3E%3Ccircle cx='40' cy='26' r='5'/%3E%3Ccircle cx='16' cy='36' r='4'/%3E%3Ccircle cx='44' cy='36' r='4'/%3E%3C/g%3E%3C/svg%3E")`,
                      backgroundSize: '24px 24px'
                    }}
                  />
                </div>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-[10px] text-muted-foreground font-medium">{t("customizePattern")}</span>
                  <span className="text-xs font-medium text-foreground">🐾</span>
                </div>
                <AnimatePresence>
                  {settings.theme === "pawprint" && (
                    <motion.div 
                      className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: easeInOutCubic }}
                    >
                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          )}

          {activeTab === "accent" && (
            <div>
              <p className="text-xs text-muted-foreground mb-3">
                {t("customizeChooseBorderColor")}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {/* Auto (Mood-based) option first */}
                <button
                  onClick={() => updateBorderColorMode("auto")}
                  className={cn(
                    "relative p-2 rounded-xl border-2 transition-all",
                    settings.borderColorMode === "auto"
                      ? "border-primary shadow-warm"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="w-full h-8 rounded-lg mb-1.5 bg-gradient-to-r from-teal-400 via-amber-400 to-purple-400" />
                  <p className="text-[10px] font-medium text-foreground text-center truncate">
                    {t("customizeAutoMood")}
                  </p>
                  <AnimatePresence>
                    {settings.borderColorMode === "auto" && (
                      <motion.div 
                        className="absolute top-1 right-1 w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: easeInOutCubic }}
                      >
                        <Check className="w-2 h-2 text-primary-foreground" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
                {/* Manual color options */}
                {(Object.keys(accentColorConfigs) as AccentColor[]).map((color) => (
                  <button
                    key={color}
                    onClick={() => updateBorderColorMode(color)}
                    className={cn(
                      "relative p-2 rounded-xl border-2 transition-all",
                      settings.borderColorMode === color
                        ? "border-primary shadow-warm"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div
                      className="w-full h-8 rounded-lg mb-1.5"
                      style={{ backgroundColor: `hsl(${accentColorConfigs[color].hsl})` }}
                    />
                    <p className="text-[10px] font-medium text-foreground text-center truncate">
                      {accentColorConfigs[color].name}
                    </p>
                    <AnimatePresence>
                      {settings.borderColorMode === color && (
                        <motion.div 
                          className="absolute top-1 right-1 w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.18, ease: easeInOutCubic }}
                        >
                          <Check className="w-2 h-2 text-primary-foreground" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "calendar" && (
            <div>
              <p className="text-xs text-muted-foreground mb-3">
                {t("customizeChooseBgColor")}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(calendarCardBackgroundConfigs) as CalendarCardBackground[]).map((bg) => (
                  <button
                    key={bg}
                    onClick={() => updateCalendarCardBackground(bg)}
                    className={cn(
                      "relative p-3 rounded-xl border-2 transition-all",
                      settings.calendarCardBackground === bg
                        ? "border-primary shadow-warm"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div
                      className="w-full h-10 rounded-lg mb-2 border border-border/30"
                      style={{ backgroundColor: calendarCardBackgroundConfigs[bg].preview }}
                    />
                    <p className="text-xs font-medium text-foreground text-center">
                      {calendarCardBackgroundConfigs[bg].name}
                    </p>
                    <AnimatePresence>
                      {settings.calendarCardBackground === bg && (
                        <motion.div 
                          className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.18, ease: easeInOutCubic }}
                        >
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "stickers" && (
            <div style={{ minHeight: 140 }}>
              {selectedDate ? (
                <motion.div 
                  className="grid grid-cols-6 gap-2"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24, ease: easeInOutCubic, delay: 0.04 }}
                >
                  {/* None option */}
                  <button
                    onClick={() => handleStickerSelect(undefined)}
                    className={cn(
                      "relative p-3 rounded-xl border-2 transition-all aspect-square flex items-center justify-center",
                      !currentSticker
                        ? "border-primary shadow-warm bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-xs text-muted-foreground">{t("customizeNone")}</span>
                    <AnimatePresence>
                      {!currentSticker && (
                        <motion.div 
                          className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.18, ease: easeInOutCubic }}
                        >
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                  {stickerOptions.map((sticker) => (
                    <button
                      key={sticker}
                      onClick={() => handleStickerSelect(sticker)}
                      className={cn(
                        "relative p-3 rounded-xl border-2 transition-all aspect-square flex items-center justify-center",
                        currentSticker === sticker
                          ? "border-primary shadow-warm bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <span className="text-2xl">{sticker}</span>
                      <AnimatePresence>
                        {currentSticker === sticker && (
                          <motion.div 
                            className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.18, ease: easeInOutCubic }}
                          >
                            <Check className="w-2.5 h-2.5 text-primary-foreground" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  className="text-center py-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.26, ease: easeInOutCubic }}
                >
                  <Sticker className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">{t("customizeSelectDateFirst")}</p>
                </motion.div>
              )}
            </div>
          )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom padding for safe area */}
        <div className="pb-4" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}