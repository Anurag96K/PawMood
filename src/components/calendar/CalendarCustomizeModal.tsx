import { useEffect, useRef, useState, useCallback } from "react";
import { X, Check, Palette, Sparkles, Sticker, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import {
  useCalendarDecoration,
  CalendarTheme,
  AccentColor,
  CalendarCardBackground,
  DayStyle,
  CalendarBackground,
  themeConfigs,
  accentColorConfigs,
  calendarCardBackgroundConfigs,
  dayStyleConfigs,
  calendarBackgroundConfigs,
  stickerOptions,
  themeOrder,
  accentColorOrder,
  calendarBackgroundOrder,
} from "@/contexts/CalendarDecorationContext";

interface CalendarCustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
}

type TabId = "theme" | "accent" | "calendar" | "stickers";

const easeInOutCubic: [number, number, number, number] = [0.65, 0, 0.35, 1];

export function CalendarCustomizeModal({ isOpen, onClose, selectedDate }: CalendarCustomizeModalProps) {
  const { t } = useLanguage();
  const {
    settings,
    updateTheme,
    updateBorderColorMode,
    updateCalendarCardBackground,
    updateGlobalDayStyle,
    updateCalendarBackground,
    setDayDecoration,
    getDayDecoration,
  } = useCalendarDecoration();

  const [activeTab, setActiveTab] = useState<TabId>("theme");
  const [isTabSwitching, setIsTabSwitching] = useState(false);
  const wasOpenRef = useRef(false);
  const tabRefs = useRef<Map<TabId, HTMLButtonElement>>(new Map());
  const tabContainerRef = useRef<HTMLDivElement>(null);

  const dragControls = useDragControls();

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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

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

  const accentHsl = accentColorConfigs[settings.accentColor]?.hsl || "18 85% 52%";

  return (
    <AnimatePresence mode="sync">
      {isOpen && (
        <>
          {/* Backdrop - covers calendar area only, NOT the bottom navigation */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.34, ease: easeInOutCubic }}
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            data-modal-container="true"
            className="fixed inset-x-0 bottom-[60px] z-50 w-full max-w-lg mx-auto bg-card rounded-t-[32px] shadow-warm-lg overflow-hidden flex flex-col"
            style={{ height: "calc(78vh - 60px)", maxHeight: "620px" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.34, ease: easeInOutCubic }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
              }
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Drag Handle & Header Area - The only draggable part */}
            <div
              className="w-full flex flex-col bg-card shrink-0 cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              {/* Pill Handle */}
              <div className="w-full flex items-center justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
              </div>

              {/* Header with orange Decorate icon */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-border">

                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'hsl(25 80% 95%)' }}
                  >
                    <Palette className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{t("customizeCalendar")}</h3>
                    {selectedDate ? (
                      <div className="flex items-center gap-1.5 text-[10px] text-primary font-medium">
                        <span>{t("customizeDecorating")}: {format(selectedDate, "MMM d, yyyy")}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">{t("customizeCalendarSubtitle")}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </div>

            {/* Tabs with sliding pill indicator */}
            <div className="px-4 pt-4 pb-2">
              <div
                ref={tabContainerRef}
                className="relative flex gap-1.5 overflow-hidden rounded-lg bg-muted/50 p-1"
                style={{ isolation: "isolate" }}
              >
                {/* Animated pill indicator */}
                <motion.div
                  className="absolute inset-y-1 bg-primary rounded-lg pointer-events-none"
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
                      "relative z-10 flex-1 min-w-[60px] flex items-center justify-center gap-1 py-2 px-1 rounded-lg text-[10px] font-medium transition-colors duration-200 whitespace-nowrap",
                      activeTab === tab.id
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <tab.icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content with fade + slide animation */}
            <div className="px-4 py-3 flex-1 overflow-y-auto pb-12 overscroll-y-contain">
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
                >
                  {activeTab === "theme" && (
                    <div className="space-y-6">
                      {/* Main Theme Section */}
                      <div>

                        <div className="grid grid-cols-3 gap-2">
                          {themeOrder.map((theme) => (
                            <button
                              key={theme}
                              onClick={() => updateTheme(theme)}
                              className={cn(
                                "relative p-3 rounded-xl border-2 transition-all",
                                settings.theme === theme
                                  ? "border-primary shadow-warm bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              <div
                                className={cn("w-full h-10 rounded-lg mb-2", themeConfigs[theme].bg)}
                                style={{ backgroundColor: themeConfigs[theme].preview }}
                              >
                                {theme === "pawprint" && (
                                  <div
                                    className="absolute inset-0"
                                    style={{
                                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 60 60'%3E%3Cg fill='%23b87333' opacity='0.25'%3E%3Cellipse cx='30' cy='38' rx='8' ry='10'/%3E%3Ccircle cx='20' cy='26' r='5'/%3E%3Ccircle cx='40' cy='26' r='5'/%3E%3Ccircle cx='16' cy='36' r='4'/%3E%3Ccircle cx='44' cy='36' r='4'/%3E%3C/g%3E%3C/svg%3E")`,
                                      backgroundSize: '16px 16px'
                                    }}
                                  />
                                )}
                              </div>
                              <p className="text-[10px] font-medium text-foreground text-center truncate">
                                {themeConfigs[theme].name}
                              </p>
                              {settings.theme === theme && (
                                <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 text-primary-foreground" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
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
                              ? "border-primary shadow-warm bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div className="w-full h-8 rounded-lg mb-1.5 bg-gradient-to-r from-teal-400 via-amber-400 to-purple-400" />
                          <p className="text-[9px] font-medium text-foreground text-center truncate">
                            {t("customizeAutoMood")}
                          </p>
                          {settings.borderColorMode === "auto" && (
                            <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center">
                              <Check className="w-2 h-2 text-primary-foreground" />
                            </div>
                          )}
                        </button>
                        {/* Manual color options */}
                        {accentColorOrder.map((color) => (
                          <button
                            key={color}
                            onClick={() => updateBorderColorMode(color)}
                            className={cn(
                              "relative p-2 rounded-xl border-2 transition-all",
                              settings.borderColorMode === color
                                ? "border-primary shadow-warm bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <div
                              className="w-full h-8 rounded-lg mb-1.5"
                              style={{ backgroundColor: `hsl(${accentColorConfigs[color].hsl})` }}
                            />
                            <p className="text-[9px] font-medium text-foreground text-center truncate">
                              {accentColorConfigs[color].name}
                            </p>
                            {settings.borderColorMode === color && (
                              <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center">
                                <Check className="w-2 h-2 text-primary-foreground" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "calendar" && (
                    <div className="space-y-6">
                      {/* Background Colors Section (Solid) */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-3">
                          Choose a background color for the calendar card:
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {(Object.keys(calendarCardBackgroundConfigs) as CalendarCardBackground[]).map((bg) => (
                            <button
                              key={bg}
                              onClick={() => updateCalendarCardBackground(bg)}
                              className={cn(
                                "relative p-3 rounded-xl border-2 transition-all",
                                settings.calendarCardBackground === bg
                                  ? "border-primary shadow-warm bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              <div
                                className="w-full h-10 rounded-lg mb-2 border border-border/30"
                                style={{ backgroundColor: calendarCardBackgroundConfigs[bg].preview }}
                              />
                              <p className="text-[10px] font-medium text-foreground text-center">
                                {calendarCardBackgroundConfigs[bg].name}
                              </p>
                              {settings.calendarCardBackground === bg && (
                                <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 text-primary-foreground" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "stickers" && (
                    <div>
                      {!selectedDate ? (
                        <div className="text-center py-8">
                          <Sticker className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                          <p className="text-sm text-muted-foreground">
                            {t("customizeSelectDateFirst")}
                          </p>
                        </div>
                      ) : (
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
                            <span className="text-[10px] text-muted-foreground">{t("customizeNone")}</span>
                            {!currentSticker && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-primary-foreground" />
                              </div>
                            )}
                          </button>
                          {stickerOptions.map((sticker) => (
                            <button
                              key={sticker}
                              onClick={() => handleStickerSelect(sticker)}
                              className={cn(
                                "relative p-3 rounded-xl border-2 transition-all aspect-square flex items-center justify-center text-2xl",
                                currentSticker === sticker
                                  ? "border-primary shadow-warm bg-primary/10"
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              <span>{sticker}</span>
                              {currentSticker === sticker && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 text-primary-foreground" />
                                </div>
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
