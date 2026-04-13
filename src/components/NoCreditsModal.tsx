import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoCreditsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBuyCredits: () => void;
}

export function NoCreditsModal({ isOpen, onClose, onBuyCredits }: NoCreditsModalProps) {
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
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-50 flex items-center justify-center px-6"
                    onClick={onClose}
                >
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 10 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-[320px] bg-card rounded-3xl border border-border/50 overflow-hidden"
                        style={{
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)',
                        }}
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-colors z-10"
                            aria-label="Close"
                        >
                            <X className="w-4 h-4 text-muted-foreground" />
                        </button>

                        <div className="px-6 pt-7 pb-5 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                                <Zap className="w-6 h-6 text-primary" />
                            </div>

                            <h3 className="text-base font-bold text-foreground mb-1.5">
                                0 Credits Left
                            </h3>

                            <p className="text-sm text-muted-foreground leading-relaxed">
                                You've used all your credits. Buy extra credits to continue analyzing.
                            </p>
                        </div>

                        <div className="px-5 pb-5 space-y-2">
                            <Button
                                onClick={onBuyCredits}
                                className="w-full h-11 text-sm font-semibold rounded-xl shadow-warm-glow hover:shadow-warm transition-all duration-300"
                            >
                                <Zap className="w-4 h-4 mr-2" />
                                Buy Extra Credits
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                className="w-full h-9 text-sm text-muted-foreground hover:text-foreground"
                            >
                                Cancel
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
