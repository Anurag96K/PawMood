import { useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LegalBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const sheetVariants = {
  hidden: { y: "100%" },
  visible: { y: 0 },
  exit: { y: "100%" },
};

export function LegalBottomSheet({ isOpen, onClose, title, children }: LegalBottomSheetProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="legal-sheet-overlay"
          className="fixed inset-0 z-[60] flex items-end justify-center"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {/* Dimmed backdrop */}
          <motion.div
            className="absolute inset-0 bg-foreground/40"
            variants={backdropVariants}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={onClose}
          />

          {/* Sheet panel */}
          <motion.div
            className="relative z-10 w-full max-w-[375px] bg-background rounded-t-[20px] flex flex-col"
            style={{ height: "82vh", maxHeight: "82vh" }}
            variants={sheetVariants}
            transition={{
              duration: 0.4,
              ease: [0.32, 0.72, 0, 1],
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-9 h-1 rounded-full bg-muted-foreground/25" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-border flex-shrink-0">
              <h2 className="text-sm font-bold text-foreground">{title}</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 text-xs text-muted-foreground leading-relaxed">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
