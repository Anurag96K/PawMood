import { useState } from "react";
import { Check, X, Zap, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LegalBottomSheet } from "./LegalBottomSheet";

interface PlanSelectionProps {
  onSelectPlan: (plan: "monthly" | "yearly") => void;
  onSkip: () => void;
}

// Large phone hero illustration - high contrast outline
function PhoneHeroIllustration() {
  return (
    <svg
      viewBox="0 0 180 240"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Phone body - solid fill to block paw pattern */}
      <rect
        x="4"
        y="4"
        width="172"
        height="232"
        rx="28"
        fill="hsl(30, 30%, 97%)"
        stroke="hsl(var(--foreground) / 0.35)"
        strokeWidth="2.5"
      />
      {/* Screen area */}
      <rect
        x="14"
        y="20"
        width="152"
        height="200"
        rx="12"
        className="fill-background"
        stroke="hsl(var(--foreground) / 0.15)"
        strokeWidth="1"
      />
      {/* Notch/Dynamic Island */}
      <rect
        x="65"
        y="28"
        width="50"
        height="14"
        rx="7"
        className="fill-foreground/20"
      />
      {/* Camera dot */}
      <circle
        cx="102"
        cy="35"
        r="4"
        className="fill-foreground/30"
      />
      {/* Simple content placeholder - paw icon */}
      <g transform="translate(56, 65)">
        <circle cx="28" cy="10" r="9" className="fill-primary/25" />
        <circle cx="50" cy="10" r="9" className="fill-primary/25" />
        <circle cx="16" cy="32" r="9" className="fill-primary/25" />
        <circle cx="62" cy="32" r="9" className="fill-primary/25" />
        <ellipse cx="39" cy="60" rx="22" ry="20" className="fill-primary/30" />
      </g>
      {/* Analysis result indicator */}
      <rect
        x="28"
        y="148"
        width="124"
        height="22"
        rx="11"
        className="fill-primary/15"
      />
      <rect
        x="28"
        y="178"
        width="84"
        height="14"
        rx="7"
        className="fill-muted/40"
      />
      <rect
        x="28"
        y="198"
        width="104"
        height="14"
        rx="7"
        className="fill-muted/30"
      />
    </svg>
  );
}

export function PlanSelection({ onSelectPlan, onSkip }: PlanSelectionProps) {
  // Single state controls both toggle AND plan selection — always exactly one active
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [legalSheet, setLegalSheet] = useState<"tos" | "privacy" | null>(null);

  const pricingConfig = {
    monthly: { price: "$8.99", period: "/mo", credits: 50, sub: null },
    yearly: { price: "$7.49", period: "/mo", credits: 70, sub: "Billed annually · $89.90/yr" },
  };

  const pricing = pricingConfig[billingCycle];

  const handleCTA = () => {
    onSelectPlan(billingCycle);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden px-6 relative" style={{ background: 'hsl(30 30% 97%)' }}>
      {/* Paw pattern background - visible across full page */}
      <div 
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='%23b87333' fill-opacity='1'%3E%3Cellipse cx='30' cy='38' rx='8' ry='10'/%3E%3Ccircle cx='20' cy='26' r='5'/%3E%3Ccircle cx='40' cy='26' r='5'/%3E%3Ccircle cx='16' cy='36' r='4'/%3E%3Ccircle cx='44' cy='36' r='4'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px'
        }}
      />
      {/* Close button */}
      <button
        onClick={onSkip}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center z-20 hover:opacity-70 transition-opacity"
        aria-label="Close"
      >
        <X className="w-3.5 h-3.5 text-muted-foreground/50" />
      </button>

      {/* Headline */}
      <div className="flex-shrink-0 pt-12 pb-3 text-center relative z-10">
        <h1 
          className="text-[28px] text-primary leading-tight"
          style={{
            textShadow: '0 0 16px hsl(var(--primary) / 0.2), 0 0 32px hsl(var(--primary) / 0.1)'
          }}
        >
          <span className="font-semibold">1 Analysis =</span> <span className="font-bold">1 Credit</span>
        </h1>
      </div>

      {/* Phone illustration */}
      <div className="flex-shrink-0 flex items-center justify-center pt-1 pb-0 relative z-10">
        <div className="w-[85%] max-w-[280px]">
          <PhoneHeroIllustration />
        </div>
      </div>

      {/* Flexible spacer */}
      <div className="flex-1 min-h-2 max-h-4" />

      {/* Paywall bottom section */}
      <div className="flex-shrink-0 -mx-6 relative z-10">
        <div
          className="rounded-t-[32px] px-6 pt-5 pb-7 relative overflow-hidden"
          style={{
            backgroundColor: 'hsl(30 30% 97%)',
            boxShadow: '0 -8px 30px -6px hsl(25 30% 40% / 0.12), 0 -2px 10px -2px hsl(25 20% 35% / 0.08)',
          }}
        >
          {/* Paw pattern background layer — z-0, behind all content */}
          <div 
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              opacity: 0.04,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='%23b87333' fill-opacity='1'%3E%3Cellipse cx='30' cy='38' rx='8' ry='10'/%3E%3Ccircle cx='20' cy='26' r='5'/%3E%3Ccircle cx='40' cy='26' r='5'/%3E%3Ccircle cx='16' cy='36' r='4'/%3E%3Ccircle cx='44' cy='36' r='4'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '80px 80px'
            }}
          />

          {/* Billing Cycle Toggle */}
          <div className="relative z-10 mb-4">
            <div 
              className="relative w-full h-11 p-1 rounded-xl"
              style={{ backgroundColor: 'hsl(var(--muted))' }}
              role="tablist"
              aria-label="Billing cycle"
            >
              <motion.div
                className="absolute top-1 left-1 w-[calc(50%-4px)] h-[calc(100%-8px)] rounded-lg shadow-sm pointer-events-none"
                style={{ backgroundColor: 'hsl(var(--background))' }}
                initial={false}
                animate={{
                  x: billingCycle === "monthly" ? 0 : "calc(100% + 4px)"
                }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              />
              
              <motion.button
                role="tab"
                aria-selected={billingCycle === "monthly"}
                onClick={() => setBillingCycle("monthly")}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={cn(
                  "absolute top-0 left-0 w-1/2 h-full flex items-center justify-center",
                  "text-sm z-10",
                  billingCycle === "monthly"
                    ? "font-bold text-foreground"
                    : "font-normal text-muted-foreground/50"
                )}
              >
                Monthly
              </motion.button>
              
              <motion.button
                role="tab"
                aria-selected={billingCycle === "yearly"}
                onClick={() => setBillingCycle("yearly")}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={cn(
                  "absolute top-0 right-0 w-1/2 h-full flex items-center justify-center",
                  "text-sm z-10",
                  billingCycle === "yearly"
                    ? "font-bold text-foreground"
                    : "font-normal text-muted-foreground/50"
                )}
              >
                Yearly
              </motion.button>
            </div>
          </div>

          {/* Pro Plan Card — always selected, stable sizing */}
          <div className="relative z-10 mb-4">
            {/* Badges — absolutely positioned so they don't affect card height */}
            <div className={cn(
              "absolute -top-2 right-3 flex items-center gap-1.5 z-10 transition-opacity duration-200",
              billingCycle === "yearly" ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>
              <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full whitespace-nowrap">
                Best value
              </span>
              <span className="px-2 py-0.5 text-primary-foreground text-[10px] font-bold rounded-full whitespace-nowrap" style={{ backgroundColor: 'hsl(152 69% 41%)' }}>
                Save 17%
              </span>
            </div>

            <motion.div
              whileTap={{ scale: 0.975 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="w-full px-4 py-4 rounded-2xl relative overflow-hidden"
              style={{
                backgroundColor: "hsl(18 85% 52% / 0.08)",
                border: "2px solid hsl(var(--primary))",
              }}
            >
              {/* Solid masking layer — blocks paw pattern bleed-through */}
              <div
                className="absolute inset-0 z-0"
                style={{ backgroundColor: "hsl(30 30% 97%)" }}
              />
              {/* Tinted overlay */}
              <div
                className="absolute inset-0 z-0"
                style={{ backgroundColor: "hsl(18 85% 52% / 0.08)" }}
              />
              <div className="flex items-center justify-between relative z-10">
                {/* Left: Check + Plan info */}
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-primary" />
                      <span className="text-base font-bold text-foreground">Pro</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-medium text-primary">
                        {billingCycle === "yearly" ? (
                          <><span className="text-[14px] font-bold">{pricing.credits}</span> credits/mo</>
                        ) : (
                          <>{pricing.credits} credits/mo</>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Right: Price — min-width prevents reflow */}
                <div className="flex flex-col items-end min-w-[100px]">
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-xl font-bold text-primary">
                      {pricing.price}
                    </span>
                    <span className="text-sm text-muted-foreground">{pricing.period}</span>
                  </div>
                  {/* Reserved height for sub-text — prevents card resize */}
                  <span className={cn(
                    "text-[10px] text-muted-foreground h-4 leading-4",
                    !pricing.sub && "invisible"
                  )}>
                    {pricing.sub || "placeholder"}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Primary CTA — isolate + overflow-hidden blocks pattern */}
          <div className="relative z-10">
            <Button 
              className="w-full h-14 text-base font-semibold isolate overflow-hidden" 
              onClick={handleCTA}
            >
              Start with 3 free credits
            </Button>

            {/* Consent text — extra spacing from button */}
            <p className="text-[10px] text-muted-foreground text-center mt-5 pb-1 leading-relaxed">
              By upgrading, you agree to our{" "}
              <button
                type="button"
                onClick={() => setLegalSheet("tos")}
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Terms of Service
              </button>
              {" "}and{" "}
              <button
                type="button"
                onClick={() => setLegalSheet("privacy")}
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Privacy Policy
              </button>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Legal Bottom Sheets */}
      <LegalBottomSheet
        isOpen={legalSheet === "tos"}
        onClose={() => setLegalSheet(null)}
        title="Terms of Service"
      >
        <div className="space-y-3">
          <p>Welcome to PetMood. By using our service, you agree to these terms.</p>
          <p><strong className="text-foreground">1. Service Usage</strong> — PetMood provides AI-powered pet mood analysis for entertainment purposes only.</p>
          <p><strong className="text-foreground">2. User Content</strong> — You retain ownership of photos you upload.</p>
          <p><strong className="text-foreground">3. Accuracy</strong> — Mood analysis results are estimations and should not replace professional veterinary advice.</p>
          <p><strong className="text-foreground">4. Limitation of Liability</strong> — PetMood is not responsible for any decisions or actions taken based on the analysis results. The service is provided for informational and entertainment purposes only. Use of the service is at the user's own risk.</p>
          <p><strong className="text-foreground">5. Account Termination</strong> — We may suspend or terminate accounts that violate these terms, misuse the service, or engage in abusive or fraudulent behavior.</p>
          <p><strong className="text-foreground">6. Changes to These Terms</strong> — We may update these Terms & Conditions from time to time. Continued use of the service after any changes means acceptance of the updated terms.</p>
        </div>
      </LegalBottomSheet>

      <LegalBottomSheet
        isOpen={legalSheet === "privacy"}
        onClose={() => setLegalSheet(null)}
        title="Privacy Policy"
      >
        <div className="space-y-3">
          <p><strong className="text-foreground">Data Collection</strong> — We collect account information and photos you upload for analysis.</p>
          <p><strong className="text-foreground">Data Usage</strong> — Your data is used to provide mood analysis services.</p>
          <p><strong className="text-foreground">Third Parties</strong> — We do not sell your personal data to third parties.</p>
        </div>
      </LegalBottomSheet>
    </div>
  );
}
