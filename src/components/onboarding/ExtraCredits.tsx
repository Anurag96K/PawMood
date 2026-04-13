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
  { id: "10", credits: 10, price: "$3.49" },
  { id: "20", credits: 20, price: "$4.99", popular: true },
  { id: "30", credits: 30, price: "$7.99" },
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
              className={`relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${selectedPackage === pkg.id
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
              <span className="font-bold text-[#432C23]">{pkg.price}</span>

              {/* Selection indicator */}
              {selectedPackage === pkg.id && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-2xl bg-muted/50 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Extra credits never expire and can be used anytime!
          </p>
          <div className="pt-2 border-t border-border/50">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
              Terms & Conditions
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-1 px-1">
              A Pro Subscription is required. Extra credits will be refundable only if none of the credits have been used.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-10 pt-4 space-y-3">
        <Button
          className="w-full h-[58px] rounded-[22px] text-lg font-black bg-primary hover:bg-primary/90 text-white shadow-warm active:scale-[0.97] transition-all"
          onClick={() => selectedPackage && onPurchase(selectedPackage)}
          disabled={!selectedPackage}
        >
          {selectedPackage
            ? `Add ${creditPackages.find(p => p.id === selectedPackage)?.credits} Credits`
            : "Select a package"}
        </Button>
      </div>
    </div>
  );
}
