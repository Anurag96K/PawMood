import { ArrowLeft } from "lucide-react";
import { useMoodEntries } from "@/hooks/useMoodEntries";
import { usePet } from "@/hooks/usePet";
import { useReportData } from "@/hooks/useReportData";
import { useLanguage } from "@/contexts/LanguageContext";
import { ReportPeriod } from "./ReportTypes";
import { ReportScenes } from "./ReportScenes";
import { NoDataState } from "./NoDataState";

interface ReportScreenProps {
  onClose: () => void;
  onNavigateToCamera?: () => void;
}

export function ReportScreen({ onClose }: ReportScreenProps) {
  const { t } = useLanguage();
  const { entries, loading: entriesLoading } = useMoodEntries();
  const { pet } = usePet();
  const petName = pet?.name || "Your pet";
  
  // Fixed to weekly only - no period switching needed
  const activePeriod: ReportPeriod = "weekly";
  
  // Compute report data - pass loading state to show "loading" status
  const reportData = useReportData(entries, activePeriod, entriesLoading);

  // CRITICAL: When data is ready OR loading, go directly to ReportScenes
  // ReportScenes handles its own entrance animation including loading state
  // This prevents ANY white loading screen from appearing
  if (reportData.status === "ready" || reportData.status === "loading") {
    return (
      <ReportScenes
        data={reportData}
        period={activePeriod}
        petName={petName}
        onClose={onClose}
        isLoading={reportData.status === "loading"}
        entries={entries}
      />
    );
  }

  // Status is "insufficient" - show no data state
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="relative px-5 pt-12 pb-4 z-10 flex-shrink-0">
        <button
          onClick={onClose}
          className="absolute left-4 top-12 p-2 rounded-full hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">{t("weeklyMoodReport")}</h1>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto pb-24">
        <NoDataState
          period={activePeriod}
          petName={petName}
          distinctDays={reportData.distinctDays}
        />
      </div>
    </div>
  );
}
