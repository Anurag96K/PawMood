import { useState, useEffect } from "react";
import { X, Sparkles, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ExtraCreditsPopupProps {
    onClose: () => void;
    onPurchase: (packageId: string) => void;
}

const creditPackages = [
    { id: "10", credits: 10, price: "$3.49" },
    { id: "20", credits: 20, price: "$4.99", popular: true },
    { id: "30", credits: 30, price: "$7.99" },
];

export function ExtraCreditsPopup({ onClose, onPurchase }: ExtraCreditsPopupProps) {
    const [selectedPackage, setSelectedPackage] = useState<string | null>("20");
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handlePurchase = async () => {
        if (!selectedPackage) return;
        setIsPurchasing(true);

        // Simulate payment
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsSuccess(true);
        onPurchase(selectedPackage);

        // Auto close after success
        setTimeout(onClose, 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-black/40 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-sm bg-card rounded-[32px] p-6 shadow-2xl relative overflow-hidden ring-1 ring-border/50"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors z-10"
                >
                    <X className="w-5 h-5 text-muted-foreground" />
                </button>

                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-emphasis mb-1">Buy Extra Credits</h2>
                    <p className="text-sm text-muted-foreground">One-time purchase. Credits never expire.</p>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-6">
                    {creditPackages.map((pkg) => (
                        <button
                            key={pkg.id}
                            onClick={() => setSelectedPackage(pkg.id)}
                            disabled={isPurchasing || isSuccess}
                            className={cn(
                                "relative flex flex-col items-center p-3 rounded-2xl border-2 transition-all",
                                selectedPackage === pkg.id
                                    ? "border-primary bg-primary/5 shadow-warm"
                                    : "border-border bg-muted/30 hover:border-primary/30"
                            )}
                        >
                            {pkg.popular && (
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold whitespace-nowrap">
                                    Best Value
                                </div>
                            )}
                            <span className="text-lg font-bold text-emphasis">+{pkg.credits}</span>
                            <span className="text-[10px] text-muted-foreground mb-1">credits</span>
                            <span className="font-bold text-[#432C23] text-sm">{pkg.price}</span>
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {!isSuccess ? (
                        <motion.div
                            key="button"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <Button
                                onClick={handlePurchase}
                                disabled={isPurchasing}
                                className="w-full h-[58px] rounded-[22px] text-lg font-black bg-primary hover:bg-primary/90 text-white shadow-warm active:scale-[0.97] transition-all"
                            >
                                {isPurchasing ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    "Add Credits"
                                )}
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center py-2"
                        >
                            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white mb-2">
                                <Check className="w-8 h-8 stroke-[3px]" />
                            </div>
                            <span className="font-bold text-green-600">Purchase Successful!</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <p className="text-[9px] text-muted-foreground/60 text-center mt-4 leading-relaxed font-medium">
                    EXTRA CREDITS REQUIRE AN ACTIVE SUBSCRIPTION.<br />
                    REFUNDABLE ONLY IF NONE OF THE CREDITS HAVE BEEN USED.
                </p>
            </motion.div>
        </motion.div>
    );
}
