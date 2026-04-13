import { useState } from "react";
import { Plus, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExtraCreditPackage {
  id: string;
  credits: number;
  price: string;
  popular?: boolean;
}

interface ExtraCreditsProps {
  onPurchase: (packageId: string) => void;
  onSkip: () => void;
}

const creditPackages: ExtraCreditPackage[] = [
  { id: "extra_credits_10", credits: 10, price: "$3.49" },
  { id: "extra_credits_20", credits: 20, price: "$4.99", popular: true },
  { id: "extra_credits_30", credits: 30, price: "$7.99" },
];

export function ExtraCredits({ onPurchase, onSkip }: ExtraCreditsProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="pt-8 px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
          <Plus className="w-4 h-4" />
          One-time Add-ons
        </div>
        <h1 className="text-2xl font-bold text-emphasis">
          Need more analyses?
        </h1>
        <p className="text-muted-foreground text-sm mt-2">
          Add extra credits to your plan anytime
        </p>
      </div>

      {/* Packages */}
      <div className="flex-1 px-6 py-8">
        <div className="grid grid-cols-3 gap-3">
          {creditPackages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg.id === selectedPackage ? null : pkg.id)}
              className={`relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${
                selectedPackage === pkg.id
                  ? "border-primary bg-primary/5 shadow-warm"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold whitespace-nowrap">
                  Best Value
                </div>
              )}
              
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              
              <span className="text-xl font-bold text-emphasis">+{pkg.credits}</span>
              <span className="text-xs text-muted-foreground mb-2">credits</span>
              <span className="font-semibold text-foreground">{pkg.price}</span>

              {/* Selection indicator */}
              {selectedPackage === pkg.id && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          Extra credits require an active subscription to be used.
        </p>
      </div>

      {/* Actions */}
      <div className="px-6 pb-8 pt-4 space-y-3">
        <Button 
          className="w-full h-14 text-base font-semibold" 
          onClick={() => selectedPackage && onPurchase(selectedPackage)}
          disabled={!selectedPackage}
        >
          {selectedPackage 
            ? `Add ${creditPackages.find(p => p.id === selectedPackage)?.credits} Credits` 
            : "Select a package"}
        </Button>
        <Button 
          variant="ghost" 
          className="w-full text-muted-foreground"
          onClick={onSkip}
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}
