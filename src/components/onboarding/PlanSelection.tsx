import { useState } from "react";
import { Check, Sparkles, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";

interface PlanSelectionProps {
  onSelectPlan: (plan: "monthly" | "yearly") => void;
  onSkip: () => void;
}

const plans = [
  {
    id: "monthly" as const,
    name: "Monthly Plan",
    price: "$8.99",
    period: "/month",
    credits: "50 credits / month",
    trialCredits: "3 free analyses",
    features: [
      "50 monthly credits",
      "Pet analysis feature",
      "Calendar saving & customization",
      "Weekly pet report analysis",
      "Priority support",
    ],
  },
  {
    id: "yearly" as const,
    name: "Yearly Plan",
    price: "$89.90",
    period: "/year",
    credits: "70 credits / month",
    trialCredits: "10 free analyses",
    savings: "Save 33%",
    popular: true,
    features: [
      "70 monthly credits",
      "Pet analysis feature",
      "Calendar saving & customization",
      "Weekly pet report analysis",
      "More credits with annual billing",
    ],
  },
];

export function PlanSelection({ onSelectPlan, onSkip }: PlanSelectionProps) {
  const { offerings, purchase, getPrice } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const plans = [
    {
      id: "monthly" as const,
      name: "Monthly Plan",
      price: getPrice(offerings.monthly) || "$8.99",
      period: "/month",
      credits: "50 credits / month",
      trialCredits: "3 free analyses",
      features: [
        "50 monthly credits",
        "Pet analysis feature",
        "Calendar saving & customization",
        "Weekly pet report analysis",
        "Priority support",
      ],
    },
    {
      id: "yearly" as const,
      name: "Yearly Plan",
      price: getPrice(offerings.yearly) || "$89.90",
      period: "/year",
      credits: "70 credits / month",
      trialCredits: "10 free analyses",
      savings: "Save 33%",
      popular: true,
      features: [
        "70 monthly credits",
        "Pet analysis feature",
        "Calendar saving & customization",
        "Weekly pet report analysis",
        "More credits with annual billing",
      ],
    },
  ];

  const handleSelect = async () => {
    const pkg = selectedPlan === "monthly" ? offerings.monthly : offerings.yearly;
    if (!pkg) {
      // If no package, we can't proceed with live purchase
      // We'll call onSelectPlan directly if in dev/web, or show error
      onSelectPlan(selectedPlan);
      return;
    }

    setIsPurchasing(true);
    try {
      const success = await purchase(pkg);
      if (success) {
        setIsSuccess(true);
        onSelectPlan(selectedPlan);
        // Wait for success animation
        setTimeout(() => {
          setIsPurchasing(false);
          setIsSuccess(false);
        }, 1000);
      } else {
        setIsPurchasing(false);
      }
    } catch (error) {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="pt-6 px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          Start Free Trial
        </div>
        <h1 className="text-2xl font-bold text-emphasis">
          Choose your plan
        </h1>
        <p className="text-muted-foreground text-sm mt-2">
          Start with a free trial, cancel anytime
        </p>
      </div>

      {/* Plans */}
      <div className="flex-1 px-6 py-6 overflow-y-auto space-y-4">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`w-full text-left p-5 rounded-2xl border-2 transition-all relative ${selectedPlan === plan.id
              ? "border-primary bg-primary/5 shadow-warm ring-1 ring-primary/20"
              : "border-border/50 bg-background hover:bg-muted/5"
              }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                Most Popular
              </div>
            )}

            {plan.savings && (
              <div className="absolute -top-3 right-4 px-2 py-0.5 rounded-full bg-green-500 text-white text-xs font-semibold">
                {plan.savings}
              </div>
            )}

            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.credits}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-emphasis">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Free trial: {plan.trialCredits}
              </span>
            </div>

            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            {/* Selection indicator */}
            <div className={`absolute top-5 right-5 w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === plan.id
              ? "border-primary bg-primary"
              : "border-muted-foreground/40"
              }`}>
              {selectedPlan === plan.id && (
                <Check className="w-4 h-4 text-primary-foreground" />
              )}
            </div>
          </button>
        ))}

        {/* Trial Info */}
        <div className="p-4 rounded-2xl bg-muted/50">
          <h4 className="font-semibold text-foreground mb-2">How the free trial works</h4>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Start with free analyses during your trial
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              No charge until trial ends
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Cancel anytime before renewal
            </li>
          </ul>
        </div>
        
        {/* Auto-renewal disclaimer */}
        <p className="px-2 text-[10px] text-muted-foreground/60 text-center leading-tight">
          Your subscription will automatically renew at the then-current price unless you cancel at least 24 hours before the end of the current period.
        </p>
      </div>
      <div className="px-6 pb-6 pt-2 space-y-3">
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: isPurchasing ? 1.05 : 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-full"
            >
              <Button
                className={cn(
                  "w-full h-[58px] rounded-[22px] text-lg font-black bg-primary hover:bg-primary/90 text-white shadow-warm active:scale-[0.97] transition-all",
                  isPurchasing && "bg-primary/80 pointer-events-none"
                )}
                onClick={handleSelect}
                disabled={isPurchasing}
              >
                {isPurchasing ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  "Start with 3 free credits"
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full flex justify-center items-center h-[58px]"
            >
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg">
                <Check className="w-8 h-8 stroke-[3px]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
