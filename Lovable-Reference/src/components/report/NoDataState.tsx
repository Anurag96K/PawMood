import { ReportPeriod, MIN_DATA_REQUIREMENTS } from "./ReportTypes";
import { useLanguage } from "@/contexts/LanguageContext";

interface NoDataStateProps {
  period: ReportPeriod;
  petName: string;
  distinctDays: number;
}

export function NoDataState({
  period,
  distinctDays,
}: NoDataStateProps) {
  const { t } = useLanguage();
  const minRequired = MIN_DATA_REQUIREMENTS[period];
  const progressPercentage = Math.min((distinctDays / minRequired) * 100, 100);
  
  const periodLabel = period === "weekly" 
    ? t("reportThisWeek").toLowerCase() 
    : period === "monthly" 
      ? t("january").toLowerCase() // placeholder for "this month"
      : t("january").toLowerCase(); // placeholder for "this year"

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      {/* Illustration */}
      <div className="mb-6">
        <div className="w-20 h-20 rounded-full bg-muted/60 flex items-center justify-center">
          <span className="text-4xl">📊</span>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-lg font-semibold text-foreground mb-1">
        {t("reportNotEnoughData")}
      </h2>

      {/* Subtitle */}
      <p className="text-sm text-muted-foreground mb-8">
        {t("reportNeedMoreData")}
      </p>

      {/* Progress bar and status */}
      <div className="w-full max-w-xs">
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-primary/60 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          {distinctDays} / {minRequired} {t("streakDaysInARow").split(" ")[0]} {periodLabel}
        </p>
      </div>
    </div>
  );
}
