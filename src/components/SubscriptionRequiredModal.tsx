import { useScrollLock } from "@/hooks/useScrollLock";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, X } from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface SubscriptionRequiredModalProps {
    isOpen: boolean;
    onClose: () => void;
    onChoosePlan: () => void;
}

export function SubscriptionRequiredModal({
    isOpen,
    onClose,
    onChoosePlan,
}: SubscriptionRequiredModalProps) {
    const { t } = useLanguage();

    // Lock body scroll when modal is open
    useScrollLock(isOpen);

    const modalContent = (
        <AnimatePresence mode="wait">
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 pointer-events-none">
                        <motion.div
                            key="modal"
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.94 }}
                            transition={{
                                duration: 0.2,
                                ease: "easeOut"
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-[320px] bg-card rounded-3xl shadow-2xl border border-border/50 overflow-hidden pointer-events-auto"
                        >
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted active:scale-90 transition-all z-10"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4 text-muted-foreground" />
                            </button>

                            {/* Content */}
                            <div className="px-6 pt-9 pb-6 text-center">
                                {/* Icon */}
                                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center shadow-inner">
                                    <Crown className="w-8 h-8 text-primary" />
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                    {t("subscriptionRequired") || "Subscription required"}
                                </h3>

                                {/* Message */}
                                <p className="text-sm text-balance text-muted-foreground leading-relaxed px-2">
                                    {t("extraCreditsRequirePlan") || "Extra credits can only be used with an active monthly or yearly plan."}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="px-6 pb-7 space-y-2.5">
                                <Button
                                    onClick={onChoosePlan}
                                    className="w-full h-13 text-sm font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
                                >
                                    {t("choosePlan") || "Choose a plan"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={onClose}
                                    className="w-full h-11 text-sm font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 active:bg-primary/20 transition-all border border-transparent active:border-primary/20"
                                >
                                    {t("cancel") || "Cancel"}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );

    if (typeof document !== 'undefined') {
        return createPortal(modalContent, document.body);
    }

    return modalContent;
}
