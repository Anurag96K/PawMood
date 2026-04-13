import { useScrollLock } from "@/hooks/useScrollLock";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface SignOutConfirmModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function SignOutConfirmModal({ isOpen, onConfirm, onCancel }: SignOutConfirmModalProps) {
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
                        className="fixed inset-0 z-[9999] bg-black/40"
                        onClick={onCancel}
                    />

                    {/* Modal Container - stable layout, no position animation */}
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            key="modal"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{
                                duration: 0.2,
                                ease: [0.4, 0, 0.2, 1]
                            }}
                            className="bg-background rounded-2xl shadow-xl border border-border overflow-hidden w-full max-w-[320px] pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Content */}
                            <div className="p-5 text-center">
                                {/* Icon */}
                                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-destructive/10 flex items-center justify-center">
                                    <LogOut className="w-5 h-5 text-destructive" />
                                </div>

                                {/* Title */}
                                <h3 className="text-base font-semibold text-foreground mb-1.5">
                                    {t("signOutConfirmTitle")}
                                </h3>

                                {/* Message */}
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {t("signOutConfirmMessage")}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex border-t border-border">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 py-3 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors border-r border-border active:bg-accent/70"
                                >
                                    {t("cancel")}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className="flex-1 py-3 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors active:bg-destructive/20"
                                >
                                    {t("signOut")}
                                </button>
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
