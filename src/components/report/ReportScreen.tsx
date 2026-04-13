import { ArrowLeft } from "lucide-react";
import { useMoodEntries } from "@/hooks/useMoodEntries";
import { usePet } from "@/hooks/usePet";
import { useReportData } from "@/hooks/useReportData";
import { useWeeklyHeroPhoto } from "@/hooks/useWeeklyHeroPhoto";
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

    // Default to weekly
    const activePeriod: ReportPeriod = "weekly";
    const reportData = useReportData(entries, activePeriod, entriesLoading);
    const { lockedIntroBackground } = useWeeklyHeroPhoto(entries, reportData.hasEnoughData);

    if (reportData.status === "ready" || reportData.status === "loading") {
        return (
            <ReportScenes
                data={{ ...reportData, lockedIntroBackground }}
                period={activePeriod}
                petName={petName}
                onClose={onClose}
                isLoading={reportData.status === "loading"}
                entries={entries}
            />
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
            <header className="relative px-5 pt-12 pb-4 z-10 flex-shrink-0">
                <button
                    onClick={onClose}
                    className="absolute left-4 top-12 p-2 rounded-full hover:bg-muted/50 transition-colors touch-manipulation"
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
