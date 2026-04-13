import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function DeleteAccountModal({ isOpen, onConfirm, onCancel, loading }: DeleteAccountModalProps) {
  const { t } = useLanguage();

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[9999] bg-black/40"
            onClick={onCancel}
          />

          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="bg-background rounded-2xl shadow-xl border border-border overflow-hidden w-full max-w-[320px] pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 pt-4 pb-3 text-center">
                <div className="w-11 h-11 mx-auto mb-2 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-destructive" />
                </div>

                <h3 className="text-base font-semibold text-foreground mb-1.5">
                  {t("deleteAccountTitle")}
                </h3>

                <div className="rounded-2xl bg-secondary/60 border border-border/40 px-3.5 py-3">
                  <ul className="text-sm text-muted-foreground leading-snug space-y-1.5 text-left">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                      <span>{t("deleteAccountBody1")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                      <span>{t("deleteAccountBody2")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                      <span>{t("deleteAccountBody3")}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                      <span>{t("deleteAccountBody4")}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex border-t border-border">
                <button
                  onClick={onCancel}
                  disabled={loading}
                  className="flex-1 py-3 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors border-r border-border active:bg-accent/70"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 py-3 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors active:bg-destructive/20 disabled:opacity-50"
                >
                  {loading ? "..." : t("deleteAccountConfirm")}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
}
