import { X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { TranslationKey } from "@/lib/translations";

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
  // Additional fields for mood-based styling
  moodText?: string;
  descText?: string;
  careTipText?: string;
}

interface CalendarEntryModalProps {
  entry: CalendarEntryData;
  isPremium: boolean;
  isBasic: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onMemoChange?: (memo: string) => void;
}

export function CalendarEntryModal({
  entry,
  isPremium,
  isBasic,
  onClose,
  onUpgrade,
  onMemoChange,
}: CalendarEntryModalProps) {
  const { t } = useLanguage();

  const MONTHS: TranslationKey[] = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
  ];

  const formattedDate = `${t(MONTHS[entry.date.getMonth()])} ${entry.date.getDate()}, ${entry.date.getFullYear()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background w-full max-w-[375px] rounded-t-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors z-10"
        >
          <X className="w-4 h-4 text-foreground" />
        </button>

        {/* Photo */}
        <div className="relative aspect-square w-full">
          <img
            src={entry.photo}
            alt="Pet"
            className="w-full h-full object-cover rounded-t-2xl"
          />
          <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-background to-transparent" />
        </div>

        {/* Content */}
        <div className="px-4 pb-6 -mt-10 relative">
          {/* Date */}
          <p className="text-xs text-muted-foreground mb-1.5">{formattedDate}</p>

          {/* Mood */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-lg">
              {entry.emoji}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground">{t(entry.moodKey)}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${entry.confidence}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-primary">{entry.confidence}%</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-xs leading-relaxed mb-3">
            {t(entry.descKey)}
          </p>

          {/* Care Tip */}
          <div className="bg-accent/50 rounded-xl p-3 mb-3">
            <p className="text-[10px] font-semibold text-primary mb-0.5">{t("careTip")}</p>
            <p className="text-xs text-foreground">{t(entry.careTipKey)}</p>
          </div>

          {/* Memo Section */}
          {isPremium ? (
            <div className="mb-3">
              <label className="text-xs font-semibold text-foreground mb-1.5 block">
                {t("memoLabel")}
              </label>
              <textarea
                className="w-full h-16 p-2 bg-muted rounded-lg text-foreground text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t("memoPlaceholder")}
                value={entry.memo || ""}
                onChange={(e) => onMemoChange?.(e.target.value)}
              />
            </div>
          ) : isBasic ? (
            <div className="bg-muted rounded-xl p-3 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs font-medium text-foreground">{t("memoPremiumOnly")}</p>
                <p className="text-[10px] text-muted-foreground">{t("upgradeForMemo")}</p>
              </div>
              <Button size="sm" className="text-xs h-7 px-2" onClick={onUpgrade}>
                {t("upgrade")}
              </Button>
            </div>
          ) : null}

          {/* Disclaimer */}
          <p className="text-[10px] text-muted-foreground text-center">
            {t("analysisDisclaimer")}
          </p>
        </div>
      </div>
    </div>
  );
}