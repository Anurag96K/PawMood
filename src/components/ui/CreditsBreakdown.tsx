import { X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

interface CreditsBreakdownProps {
    isOpen: boolean;
    onClose: () => void;
    freeCredits: number;
    planCredits: number;
    extraCredits: number;
    onNavigateToPlan: () => void;
}

export function CreditsBreakdown({
    isOpen,
    onClose,
    freeCredits,
    planCredits,
    extraCredits,
    onNavigateToPlan
}: CreditsBreakdownProps) {
    const { t } = useLanguage();

    if (!isOpen) return null;

    const total = freeCredits + planCredits + extraCredits;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-[90%] max-w-[320px] bg-white rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="text-center mb-6">
                    <h2 className="text-xl font-extrabold text-foreground mb-1">Credits Balance</h2>
                    <p className="text-3xl font-black text-primary my-2">{total}</p>
                    <p className="text-xs text-muted-foreground">Total Available Credits</p>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <span className="text-sm font-semibold text-gray-600">Free Credits</span>
                        <span className="text-sm font-bold text-foreground">{freeCredits}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50/50 rounded-xl">
                        <span className="text-sm font-semibold text-gray-600">Plan Credits</span>
                        <span className="text-sm font-bold text-foreground">{planCredits}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <span className="text-sm font-semibold text-gray-600">Extra Credits</span>
                        <span className="text-sm font-bold text-foreground">{extraCredits}</span>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mb-4">
                    {total === 0 && (
                        <p className="text-center text-sm font-medium text-destructive mb-4">
                            0 credits remaining
                        </p>
                    )}
                    <p className="text-xs text-center text-muted-foreground">
                        Credits are used in this order:<br />Free → Plan → Extra
                    </p>
                </div>

                <Button
                    onClick={() => {
                        onClose();
                        onNavigateToPlan();
                    }}
                    className="w-full rounded-xl font-bold bg-primary hover:bg-primary/90"
                >
                    Get More Credits
                </Button>
            </div>
        </div>
    );
}
