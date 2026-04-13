import { motion, AnimatePresence } from "framer-motion";
import { Crown, X } from "lucide-react";
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
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[320px] bg-card rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Content */}
            <div className="px-6 pt-8 pb-6 text-center">
              {/* Icon */}
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Crown className="w-7 h-7 text-primary" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-foreground mb-2">
                {t("subscriptionRequired") || "Subscription required"}
              </h3>

              {/* Message */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("extraCreditsRequirePlan") || "Extra credits can only be used with an active monthly or yearly plan."}
              </p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 space-y-2">
              <Button
                onClick={onChoosePlan}
                className="w-full h-12 text-sm font-semibold"
              >
                {t("choosePlan") || "Choose a plan"}
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full h-10 text-sm text-muted-foreground hover:text-foreground"
              >
                {t("cancel") || "Cancel"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
