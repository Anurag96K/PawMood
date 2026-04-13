import React, { useState } from "react";
import { X, Crown, Check, Calendar, Zap, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

type BillingCycle = "monthly" | "yearly";

interface ProPaywallProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (plan: "pro-monthly" | "pro-yearly") => void;
  isFirstPurchase?: boolean;
}

export function ProPaywall({ 
  isOpen, 
  onClose, 
  onSubscribe,
  isFirstPurchase = true 
}: ProPaywallProps) {
  const { t } = useLanguage();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");

  if (!isOpen) return null;

  const handleSubscribe = () => {
    onSubscribe(billingCycle === "monthly" ? "pro-monthly" : "pro-yearly");
  };

  // STATE A: First-time subscriber (isFirstPurchase true) shows free bonus
  // STATE B/C: Active or returning users show standard credits
  const benefits = [
    {
      icon: Zap,
      title: billingCycle === "monthly" 
        ? (isFirstPurchase ? t("freeCreditsPlus") + " 50 " + t("monthlyCredits") : "50 " + t("monthlyCredits"))
        : (isFirstPurchase ? t("freeCreditsPlus") + " 70 " + t("monthlyCredits") : "70 " + t("monthlyCredits")),
      description: t("paywallBenefitCreditsDesc"),
    },
    {
      icon: Calendar,
      title: t("calendarSaving"),
      description: t("paywallBenefitCalendarDesc"),
    },
    {
      icon: Sparkles,
      title: t("paywallBenefitPriority"),
      description: t("paywallBenefitPriorityDesc"),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Paywall Content */}
      <div className="relative z-10 w-full max-w-[375px] h-full bg-background overflow-y-auto">
        {/* Top Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-foreground">Pro</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-4 pb-8">
          {/* Hero Section */}
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🐾</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {t("paywallTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("paywallSubtitle")}
            </p>
          </div>

          {/* Benefits List */}
          <div className="space-y-3 mb-6">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 bg-card rounded-xl border border-border"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <benefit.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{benefit.title}</h3>
                  <p className="text-xs text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Plan Selector */}
          <div className="mb-6">
            <div className="flex gap-2 p-1 bg-muted rounded-xl mb-4">
              <motion.button
                onClick={() => setBillingCycle("monthly")}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.1, ease: "easeOut" }}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                  billingCycle === "monthly"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t("monthly")}
              </motion.button>
              <motion.button
                onClick={() => setBillingCycle("yearly")}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.1, ease: "easeOut" }}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors relative",
                  billingCycle === "yearly"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t("yearly")}
                <span className="absolute -top-2 -right-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full">
                  {t("bestValue")}
                </span>
              </motion.button>
            </div>

            {/* Price Display */}
            <div className="bg-card rounded-xl p-4 border-2 border-primary">
              {billingCycle === "monthly" ? (
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold text-foreground">$8.99</span>
                    <span className="text-sm text-muted-foreground">{t("perMonth")}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isFirstPurchase ? t("freeCreditsPlus") + " 50 " + t("monthlyCredits") : "50 " + t("monthlyCredits")}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold text-foreground">$7.49</span>
                    <span className="text-sm text-muted-foreground">{t("perMonth")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    $89.90{t("perYear")} • {t("billedAnnually")}
                  </p>
                  <p className="text-sm text-primary font-medium mt-1">
                    {isFirstPurchase ? t("freeCreditsPlus") + " 70 " + t("monthlyCredits") : "70 " + t("monthlyCredits")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Primary CTA */}
          {/* STATE A: First-time subscriber gets "Start with 3 free credits" */}
          {/* STATE B/C: Returning users get "Select plan" */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
          >
            <Button 
              onClick={handleSubscribe}
              className="w-full h-14 text-base font-semibold"
            >
              {isFirstPurchase ? t("startWithFreeCredits") : t("choosePlan")}
            </Button>
          </motion.div>

          {/* Secondary Action */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
          >
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full text-muted-foreground"
            >
              Maybe later
            </Button>
          </motion.div>

          {/* Footer */}
          <p className="text-[10px] text-muted-foreground text-center mt-6">
            {t("paywallFooter")}
          </p>
        </div>
      </div>
    </div>
  );
}
