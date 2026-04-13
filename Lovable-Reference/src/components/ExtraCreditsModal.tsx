import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Sparkles, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useExtraCredits } from "@/contexts/ExtraCreditsContext";

interface ExtraCreditPackage {
  id: string;
  credits: number;
  price: string;
  popular?: boolean;
}

interface ExtraCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPlans?: () => void;
  isFreeUser?: boolean;
}

const creditPackages: ExtraCreditPackage[] = [
  { id: "extra_credits_10", credits: 10, price: "$3.49" },
  { id: "extra_credits_20", credits: 20, price: "$4.99", popular: true },
  { id: "extra_credits_30", credits: 30, price: "$7.99" },
];

export function ExtraCreditsModal({
  isOpen,
  onClose,
  onNavigateToPlans,
  isFreeUser = false,
}: ExtraCreditsModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const { addExtraCredits } = useExtraCredits();

  const handlePurchase = () => {
    if (!selectedPackage) return;

    // If user is on free plan, they need to subscribe first
    if (isFreeUser) {
      onClose();
      onNavigateToPlans?.();
      return;
    }

    // Simulate purchase - in real app this would trigger payment flow
    const pkg = creditPackages.find(p => p.id === selectedPackage);
    if (pkg) {
      addExtraCredits(pkg.credits);
      toast.success(`+${pkg.credits} credits have been added!`, {
        duration: 1500,
        icon: <Zap className="w-4 h-4 text-primary" />,
      });
    }
    
    setSelectedPackage(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4"
          onClick={onClose}
        >
          {/* Backdrop - subtle dim */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

          {/* Compact Card */}
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
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Header */}
            <div className="pt-5 px-5 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                </div>
                <h2 className="text-base font-bold text-foreground">
                  Buy Extra Credits
                </h2>
              </div>
            </div>

            {/* Packages - horizontal row */}
            <div className="px-4 pb-4">
              <div className="grid grid-cols-3 gap-2">
                {creditPackages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id === selectedPackage ? null : pkg.id)}
                    className={`relative flex flex-col items-center py-3 px-2 rounded-xl border-2 transition-all ${
                      selectedPackage === pkg.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold whitespace-nowrap">
                        Best
                      </div>
                    )}
                    
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                    
                    <span className="text-sm font-bold text-foreground">+{pkg.credits}</span>
                    <span className="text-[10px] text-muted-foreground">credits</span>
                    <span className="font-semibold text-foreground text-xs mt-0.5">{pkg.price}</span>

                    {/* Selection indicator */}
                    {selectedPackage === pkg.id && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Purchase button */}
              <Button 
                className="w-full h-10 text-sm font-semibold mt-3 rounded-xl" 
                onClick={handlePurchase}
                disabled={!selectedPackage}
              >
                {selectedPackage 
                  ? `Add ${creditPackages.find(p => p.id === selectedPackage)?.credits} Credits` 
                  : "Select a package"}
              </Button>
            </div>
          </motion.div>

          {/* Disclaimer - outside the card, as sibling */}
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="relative z-10 text-[12px] text-muted-foreground/70 text-center mt-4 w-[90%] max-w-[300px]"
            onClick={(e) => e.stopPropagation()}
          >
            Extra credits require an active subscription to be used.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
