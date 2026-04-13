import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useScrollLock } from "@/hooks/useScrollLock";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function DeleteAccountModal({ isOpen, onConfirm, onCancel, loading }: DeleteAccountModalProps) {
  const { t } = useLanguage();
  useScrollLock(isOpen);

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0 bg-black/40"
            onClick={onCancel}
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="relative bg-background rounded-3xl shadow-xl border border-border overflow-hidden w-full max-w-[320px] z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-destructive" />
              </div>

              <h3 className="text-lg font-bold text-foreground mb-2">
                {t("deleteAccountTitle") || "Delete Account?"}
              </h3>

              <div className="rounded-2xl bg-secondary/60 border border-border/40 px-4 py-3 mb-2 text-left">
                <ul className="text-sm text-muted-foreground leading-snug space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                    <span>{t("deleteAccountBody1") || "Your profile and data will be permanently removed."}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                    <span>{t("deleteAccountBody2") || "Active subscriptions will be cancelled."}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                    <span>{t("deleteAccountBody3") || "Deletion starts after 7 days."}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                    <span>{t("deleteAccountBody4") || "Log in during this period to cancel deletion."}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex border-t border-border p-2 gap-2">
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex-1 py-3 text-sm font-semibold text-foreground bg-secondary/50 rounded-xl hover:bg-secondary transition-colors active:scale-95 disabled:opacity-50"
              >
                {t("cancel") || "Cancel"}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 py-3 text-sm font-bold text-white bg-destructive rounded-xl hover:bg-destructive/90 transition-colors active:scale-95 shadow-lg shadow-destructive/20 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t("deleteAccountConfirm") || "Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
}
