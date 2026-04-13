import { useState, useEffect } from "react";
import { X, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useCalendarDecoration,
  stickerOptions,
  DayDecoration,
  DayStyle,
  dayStyleConfigs,
  accentColorConfigs,
} from "@/contexts/CalendarDecorationContext";
import {
  DecorationBorderColor,
  decorationBorderColorConfigs
} from "@/lib/moodColors";

interface DayDecorationModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateKey: string;
  dateLabel: string;
}

export function DayDecorationModal({
  isOpen,
  onClose,
  dateKey,
  dateLabel,
}: DayDecorationModalProps) {
  const { settings, getDayDecoration, setDayDecoration, removeDayDecoration } = useCalendarDecoration();

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

  const existingDecoration = getDayDecoration(dateKey);
  const [selectedSticker, setSelectedSticker] = useState<string | undefined>(
    existingDecoration?.sticker
  );
  const [selectedDayStyle, setSelectedDayStyle] = useState<DayStyle | undefined>(
    existingDecoration?.dayStyle
  );
  const [note, setNote] = useState<string>(existingDecoration?.note || "");
  const [selectedBorderColor, setSelectedBorderColor] = useState<DecorationBorderColor>(
    existingDecoration?.borderColorOverride ?
      (Object.keys(decorationBorderColorConfigs).find(
        key => decorationBorderColorConfigs[key as DecorationBorderColor].hsl === existingDecoration.borderColorOverride
      ) as DecorationBorderColor || 'none') :
      'none'
  );

  const accentHsl = accentColorConfigs[settings.accentColor].hsl;

  if (!isOpen) return null;

  const handleSave = () => {
    const decoration: DayDecoration = {};
    if (selectedSticker) decoration.sticker = selectedSticker;
    if (note.trim()) decoration.note = note.trim();
    if (selectedDayStyle) decoration.dayStyle = selectedDayStyle;
    // Add border color override if not 'none' (mood-based)
    if (selectedBorderColor !== 'none') {
      decoration.borderColorOverride = decorationBorderColorConfigs[selectedBorderColor].hsl;
    }

    if (Object.keys(decoration).length > 0) {
      setDayDecoration(dateKey, decoration);
    } else {
      removeDayDecoration(dateKey);
    }
    onClose();
  };

  const handleClear = () => {
    removeDayDecoration(dateKey);
    setSelectedSticker(undefined);
    setSelectedDayStyle(undefined);
    setNote("");
    setSelectedBorderColor('none');
  };

  const handleBorderColorClick = (color: DecorationBorderColor) => {
    setSelectedBorderColor(selectedBorderColor === color ? 'none' : color);
  };

  const handleStickerClick = (sticker: string) => {
    setSelectedSticker(selectedSticker === sticker ? undefined : sticker);
  };

  const handleDayStyleClick = (style: DayStyle) => {
    setSelectedDayStyle(selectedDayStyle === style ? undefined : style);
  };

  const getDayStylePreviewClasses = (style: DayStyle) => {
    switch (style) {
      case "pawRing":
        return "ring-2 ring-offset-1";
      case "gradientBorder":
        return "border-2";
      case "dashed":
        return "border-2 border-dashed";
      case "doubleLine":
        return "ring-2 ring-offset-2";
      case "glow":
        return "shadow-lg";
      case "dotted":
        return "border-2 border-dotted";
      default:
        return "border border-border";
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-warm-lg overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h3 className="text-base font-bold text-foreground">Decorate Day</h3>
            <p className="text-xs text-muted-foreground">{dateLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
          {/* Sticker Selection */}
          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">
              Add Sticker
            </label>
            <div className="grid grid-cols-6 gap-2">
              {stickerOptions.map((sticker) => (
                <button
                  key={sticker}
                  onClick={() => handleStickerClick(sticker)}
                  className={cn(
                    "aspect-square rounded-lg flex items-center justify-center text-xl transition-all border-2",
                    selectedSticker === sticker
                      ? "border-primary bg-primary/10 scale-110"
                      : "border-border hover:border-primary/50 hover:bg-muted"
                  )}
                >
                  {sticker}
                </button>
              ))}
            </div>
          </div>

          {/* Day Styles Section */}
          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">
              Day Styles
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(dayStyleConfigs) as DayStyle[]).map((style) => (
                <button
                  key={style}
                  onClick={() => handleDayStyleClick(style)}
                  className={cn(
                    "relative p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1",
                    selectedDayStyle === style
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold bg-card",
                      getDayStylePreviewClasses(style)
                    )}
                    style={{
                      ...(style !== "none" && style !== "glow" && {
                        borderColor: `hsl(${accentHsl})`,
                      }),
                      ...(style === "pawRing" && {
                        '--tw-ring-color': `hsl(${accentHsl})`,
                      } as React.CSSProperties),
                      ...(style === "doubleLine" && {
                        '--tw-ring-color': `hsl(${accentHsl})`,
                      } as React.CSSProperties),
                      ...(style === "glow" && {
                        boxShadow: `0 0 12px hsl(${accentHsl} / 0.5)`,
                      }),
                      ...(style === "gradientBorder" && {
                        borderImage: `linear-gradient(135deg, hsl(${accentHsl}), hsl(${accentHsl} / 0.4)) 1`,
                      }),
                    }}
                  >
                    {dayStyleConfigs[style].preview}
                  </div>
                  <span className="text-[9px] text-muted-foreground text-center">
                    {dayStyleConfigs[style].name}
                  </span>
                  {selectedDayStyle === style && (
                    <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-2 h-2 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Border Color Override Section */}
          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">
              Border Color Override
            </label>
            <p className="text-[10px] text-muted-foreground mb-2">
              Use global setting (Auto/manual) or override for this day only:
            </p>
            <div className="grid grid-cols-7 gap-2">
              {(Object.keys(decorationBorderColorConfigs) as DecorationBorderColor[]).map((color) => (
                <button
                  key={color}
                  onClick={() => handleBorderColorClick(color)}
                  className={cn(
                    "relative aspect-square rounded-full flex items-center justify-center text-lg transition-all border-2",
                    selectedBorderColor === color
                      ? "border-primary scale-110 shadow-md"
                      : "border-border hover:border-primary/50"
                  )}
                  style={color !== 'none' ? {
                    backgroundColor: `hsl(${decorationBorderColorConfigs[color].hsl})`
                  } : undefined}
                  title={decorationBorderColorConfigs[color].name}
                >
                  {color === 'none' && decorationBorderColorConfigs[color].preview}
                  {selectedBorderColor === color && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-2 h-2 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="text-xs font-medium text-foreground mb-2 block">
              Add Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., 🐶 vet visit, ✨ grooming day"
              maxLength={30}
              className="w-full h-10 px-3 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-[10px] text-muted-foreground text-right mt-1">
              {note.length}/30
            </p>
          </div>

          {/* Preview */}
          {(selectedSticker || note.trim() || selectedDayStyle || selectedBorderColor !== 'none') && (
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Preview:</p>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedSticker && <span className="text-lg">{selectedSticker}</span>}
                {selectedDayStyle && selectedDayStyle !== "none" && (
                  <span className="text-xs text-foreground">
                    Style: {dayStyleConfigs[selectedDayStyle].name}
                  </span>
                )}
                {selectedBorderColor !== 'none' && (
                  <span className="text-xs text-foreground flex items-center gap-1">
                    Border:
                    <span
                      className="w-3 h-3 rounded-full inline-block border border-border"
                      style={{ backgroundColor: `hsl(${decorationBorderColorConfigs[selectedBorderColor].hsl})` }}
                    />
                    {decorationBorderColorConfigs[selectedBorderColor].name}
                  </span>
                )}
                {note.trim() && (
                  <span className="text-xs text-foreground">{note}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-4 py-3 border-t border-border">
          {(existingDecoration?.sticker || existingDecoration?.note || existingDecoration?.dayStyle || existingDecoration?.borderColorOverride) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="gap-1.5 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            className="flex-1 gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
