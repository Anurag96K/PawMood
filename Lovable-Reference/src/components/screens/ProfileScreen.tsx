import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, ChevronRight, Settings, HelpCircle, LogOut, Zap, Check, Globe, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/lib/translations";
import { SettingsPage } from "./SettingsPage";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SignOutConfirmModal } from "@/components/SignOutConfirmModal";
import { SubscriptionRequiredModal } from "@/components/SubscriptionRequiredModal";
import { useExtraCredits } from "@/contexts/ExtraCreditsContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format, addMonths, addYears } from "date-fns";
interface ProfileScreenProps {
  analysisCount: number;
  isPremium: boolean;
  currentPlan: "free" | "pro-monthly" | "pro-yearly";
  onSelectPlan: (plan: "free" | "pro-monthly" | "pro-yearly") => void;
  scrollToPlan?: boolean;
  onScrollComplete?: () => void;
  onSignOut: () => void;
  isFirstPaidMonth?: boolean;
}

const languageOptions: { id: Language; label: string; flag: string }[] = [
  { id: "ko", label: "한국어", flag: "🇰🇷" },
  { id: "en", label: "English", flag: "🇺🇸" },
  { id: "ja", label: "日本語", flag: "🇯🇵" },
];

export function ProfileScreen({ 
  analysisCount, 
  isPremium, 
  currentPlan, 
  onSelectPlan, 
  scrollToPlan, 
  onScrollComplete, 
  onSignOut,
  isFirstPaidMonth = false
}: ProfileScreenProps) {
  const { t, language, setLanguage } = useLanguage();
  const { profile, avatarSrc } = useProfile();
  const { addExtraCredits } = useExtraCredits();
  const planSectionRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsInitialSection, setSettingsInitialSection] = useState<"main" | "editProfile" | "help">("main");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  // Track direction: 1 = moving right (monthly→yearly), -1 = moving left (yearly→monthly)
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [showHelpDirectly, setShowHelpDirectly] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showSubscriptionRequired, setShowSubscriptionRequired] = useState(false);
  const [scheduledDowngradeDate, setScheduledDowngradeDate] = useState<Date | null>(null);
  const [showScheduledModal, setShowScheduledModal] = useState(false);
  // Handle billing cycle change with direction tracking
  const handleBillingCycleChange = (newCycle: "monthly" | "yearly") => {
    if (newCycle === billingCycle) return;
    setSlideDirection(newCycle === "yearly" ? 1 : -1);
    setBillingCycle(newCycle);
  };

  useEffect(() => {
    if (scrollToPlan && planSectionRef.current) {
      planSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      onScrollComplete?.();
    }
  }, [scrollToPlan, onScrollComplete]);

  // Plan pricing configuration
  const pricingConfig = {
    monthly: {
      price: "$8.99",
      credits: 50,
    },
    yearly: {
      price: "$89.90",
      credits: 70,
      monthlyEquivalent: "$7.49",
    },
  };

  const handleSignOutClick = () => {
    setShowSignOutConfirm(true);
  };

  const handleSignOutConfirm = () => {
    setShowSignOutConfirm(false);
    setShowSettings(false);
    onSignOut();
  };

  const handleSelectPlan = () => {
    const newPlan = billingCycle === "monthly" ? "pro-monthly" : "pro-yearly";
    const isUpgrade = currentPlan === "pro-monthly" && newPlan === "pro-yearly";
    const isDowngrade = currentPlan === "pro-yearly" && newPlan === "pro-monthly";

    if (isUpgrade) {
      // Fire toast FIRST before callback to ensure immediate display
      const effectiveDate = format(new Date(), "MM/dd/yyyy");
      toast.success(`Upgrade complete. Your Yearly plan is now active (${effectiveDate}).`, { duration: 3000 });
      onSelectPlan(newPlan);
    } else if (isDowngrade) {
      // Fire toast FIRST before state updates
      const effectiveDate = addYears(new Date(), 1);
      toast.success(`Downgrade scheduled. Your Monthly plan will start on (${format(effectiveDate, "MM/dd/yyyy")}).`, { duration: 3000 });
      setScheduledDowngradeDate(effectiveDate);
      setBillingCycle("yearly");
    } else {
      // Free → paid (first purchase)
      const planLabel = billingCycle === "yearly" ? "Yearly" : "Monthly";
      toast(`🎉 Great choice! ${planLabel} plan selected.`, { duration: 2000 });
      onSelectPlan(newPlan);
    }
  };

  // Get display plan name
  const getPlanDisplayName = () => {
    if (currentPlan === "free") return t("planFree");
    if (currentPlan === "pro-monthly") return `${t("planPro")} (${t("monthly")})`;
    return `${t("planPro")} (${t("yearly")})`;
  };

  // Get credits display with first purchase bonus
  const getCreditsDisplay = () => {
    if (currentPlan === "free") return `${analysisCount}`;
    if (isFirstPaidMonth) {
      const baseCredits = currentPlan === "pro-yearly" ? 70 : 50;
      return `${t("freeCreditsPlus")} ${baseCredits}`;
    }
    return `${analysisCount}`;
  };

  // Show settings page - but always render SignOutConfirmModal via portal
  if (showSettings) {
    return (
      <>
        <SettingsPage
          onClose={() => {
            setShowSettings(false);
            setSettingsInitialSection("main");
            setShowHelpDirectly(false);
          }}
          onSignOut={handleSignOutClick}
          currentPlan={getPlanDisplayName()}
          onUpgrade={() => {
            setShowSettings(false);
            setSettingsInitialSection("main");
            setShowHelpDirectly(false);
            setTimeout(() => {
              planSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}
          initialSection={showHelpDirectly ? "help" : settingsInitialSection}
        />
        {/* Sign Out Confirmation Modal - rendered via portal, always available */}
        <SignOutConfirmModal
          isOpen={showSignOutConfirm}
          onConfirm={handleSignOutConfirm}
          onCancel={() => setShowSignOutConfirm(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-full bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-10 pb-5">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{t("profileTitle")}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{t("profileSubtitle")}</p>
      </header>

      {/* User Profile Header */}
      <div className="px-5 mb-5">
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
          <div className="flex items-center gap-3.5">
            <Avatar className="w-12 h-12 rounded-2xl shadow-sm">
              <AvatarImage
                src={avatarSrc || undefined}
                alt="User profile avatar"
                loading="lazy"
                decoding="async"
              />
              <AvatarFallback className="bg-accent text-lg rounded-2xl">
                {profile?.display_name?.charAt(0)?.toUpperCase() || "🐕"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-foreground truncate">{profile?.display_name || t("petParent")}</h2>
              <p className="text-[11px] text-muted-foreground truncate">{profile?.email || ""}</p>
            </div>
            <button
              onClick={() => {
                setSettingsInitialSection("editProfile");
                setShowSettings(true);
              }}
              className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-accent transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Plans */}
      <div ref={planSectionRef} className="px-5 mb-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t("choosePlan")}</h3>
        

        {/* Pro Plan with Toggle */}
        <div className={cn(
          "relative p-4 rounded-xl border-2 transition-all duration-200",
          (currentPlan === "pro-monthly" && billingCycle === "monthly") || (currentPlan === "pro-yearly" && billingCycle === "yearly")
            ? "border-primary bg-accent/50 shadow-warm-glow"
            : "border-primary/50 bg-card"
        )}>
          {/* Billing Toggle - full-width stable structure */}
          <div className="mb-4">
            <div 
              className="relative w-full h-11 p-1 bg-muted rounded-xl"
              role="tablist"
              aria-label="Billing cycle"
            >
              {/* Sliding thumb - fixed size, moves with translateX only */}
              <motion.div
                className="absolute top-1 left-1 w-[calc(50%-4px)] h-[calc(100%-8px)] bg-background rounded-lg shadow-sm pointer-events-none"
                initial={false}
                animate={{
                  x: billingCycle === "monthly" ? 0 : "calc(100% + 4px)"
                }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              />
              
              {/* Monthly button - always mounted, fixed position */}
              <button
                role="tab"
                aria-selected={billingCycle === "monthly"}
                onClick={() => handleBillingCycleChange("monthly")}
                className={cn(
                  "absolute top-0 left-0 w-1/2 h-full flex items-center justify-center",
                  "text-sm font-semibold transition-colors duration-200 z-10",
                  "active:scale-[0.97] will-change-transform",
                  billingCycle === "monthly"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t("monthly")}
              </button>
              
              {/* Yearly button - always mounted, fixed position */}
              <button
                role="tab"
                aria-selected={billingCycle === "yearly"}
                onClick={() => handleBillingCycleChange("yearly")}
                className={cn(
                  "absolute top-0 right-0 w-1/2 h-full flex items-center justify-center",
                  "text-sm font-semibold transition-colors duration-200 z-10",
                  "active:scale-[0.97] will-change-transform",
                  billingCycle === "yearly"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t("yearly")}
              </button>
            </div>
          </div>

          {/* Plan Details - stable height container */}
          <div className="flex items-start justify-between mb-3 min-h-[52px]">
            <div>
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-primary" />
                <h4 className="text-base font-bold text-foreground">{t("planPro")}</h4>
                {/* Best Value badge - direction-aware slide + scale pop for Yearly only */}
                {/* Badge slides in same direction as content: Monthly→Yearly = L→R, Yearly→Monthly = R→L */}
                <motion.span
                  initial={false}
                  animate={{
                    opacity: billingCycle === "yearly" ? 1 : 0,
                    scale: billingCycle === "yearly" ? 1 : 0.93,
                    // When yearly: at rest (x=0). When monthly: slide out in same direction as content
                    // slideDirection=1 (to yearly): badge slides in from right (positive x)
                    // slideDirection=-1 (to monthly): badge slides out to right (positive x)
                    x: billingCycle === "yearly" ? 0 : slideDirection * 10,
                  }}
                  transition={{
                    duration: 0.18,
                    ease: billingCycle === "yearly" ? [0, 0, 0.2, 1] : [0.4, 0, 1, 1],
                  }}
                  className="text-[10px] font-semibold px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full origin-center"
                  style={{ 
                    pointerEvents: billingCycle === "yearly" ? "auto" : "none",
                  }}
                >
                  {t("bestValue")}
                </motion.span>
              </div>
              
              {/* Pricing Display - direction-aware horizontal slide + fade crossfade */}
              <div className="mt-1 relative min-h-[36px] overflow-hidden">
                {/* Monthly pricing - slides out in direction of movement */}
                <motion.div
                  initial={false}
                  animate={{ 
                    opacity: billingCycle === "monthly" ? 1 : 0,
                    x: billingCycle === "monthly" ? 0 : slideDirection * -10,
                  }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className={cn(
                    "will-change-transform",
                    billingCycle === "monthly" ? "relative" : "absolute inset-0"
                  )}
                >
                  <span className="text-xl font-bold text-foreground">{pricingConfig.monthly.price}</span>
                  <span className="text-xs text-muted-foreground">{t("perMonth")}</span>
                </motion.div>
                {/* Yearly pricing - slides in from direction of movement */}
                <motion.div
                  initial={false}
                  animate={{ 
                    opacity: billingCycle === "yearly" ? 1 : 0,
                    x: billingCycle === "yearly" ? 0 : slideDirection * 10,
                  }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className={cn(
                    "will-change-transform",
                    billingCycle === "yearly" ? "relative" : "absolute inset-0"
                  )}
                >
                  <div>
                    <span className="text-xl font-bold text-foreground">~{pricingConfig.yearly.monthlyEquivalent}</span>
                    <span className="text-xs text-muted-foreground">{t("perMonth")}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {pricingConfig.yearly.price}{t("perYear")} · {t("billedAnnually")}
                  </p>
                </motion.div>
              </div>
            </div>
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
              (currentPlan === "pro-monthly" && billingCycle === "monthly") || (currentPlan === "pro-yearly" && billingCycle === "yearly")
                ? "border-primary bg-primary"
                : "border-border"
            )}>
              {((currentPlan === "pro-monthly" && billingCycle === "monthly") || (currentPlan === "pro-yearly" && billingCycle === "yearly")) && (
                <Check className="w-3 h-3 text-primary-foreground" />
              )}
            </div>
          </div>

          {/* Credits Badge - direction-aware horizontal slide + fade transition */}
          <div className="bg-primary/10 rounded-lg p-2.5 mb-3 overflow-hidden">
            <div className="flex items-center justify-center gap-2 relative min-h-[24px]">
              <Zap className="w-4 h-4 text-primary flex-shrink-0" />
              {/* Monthly credits - slides out in direction of movement */}
              <motion.span
                initial={false}
                animate={{
                  opacity: billingCycle === "monthly" ? 1 : 0,
                  x: billingCycle === "monthly" ? 0 : slideDirection * -8,
                }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className={cn(
                  "text-primary text-sm font-medium will-change-transform",
                  billingCycle === "monthly" ? "relative" : "absolute"
                )}
              >
                {currentPlan === "free" && isFirstPaidMonth
                  ? <>{t("freeCreditsPlus")} {pricingConfig.monthly.credits} {t("monthlyCredits")}</>
                  : <>{pricingConfig.monthly.credits} {t("monthlyCredits")}</>
                }
              </motion.span>
              {/* Yearly credits - slides in from direction of movement */}
              <motion.span
                initial={false}
                animate={{
                  opacity: billingCycle === "yearly" ? 1 : 0,
                  x: billingCycle === "yearly" ? 0 : slideDirection * 8,
                }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className={cn(
                  "text-primary text-sm font-medium will-change-transform",
                  billingCycle === "yearly" ? "relative" : "absolute"
                )}
              >
                {currentPlan === "free" && isFirstPaidMonth
                  ? <>{t("freeCreditsPlus")} <span className="text-xl font-extrabold">{pricingConfig.yearly.credits}</span> {t("monthlyCredits")}</>
                  : <><span className="text-xl font-extrabold">{pricingConfig.yearly.credits}</span> {t("monthlyCredits")}</>
                }
              </motion.span>
            </div>
          </div>

          {/* Features list - fixed height, slide + fade for extra yearly item */}
          <ul className="space-y-1.5 mb-4 min-h-[88px] overflow-hidden">
            <li className="flex items-center gap-1.5 text-xs text-foreground">
              <Check className="w-3 h-3 text-primary flex-shrink-0" />
              <motion.span
                initial={false}
                animate={{ opacity: 1 }}
                className="will-change-transform"
              >
                <span className="font-bold">{billingCycle === "monthly" ? "50" : "70"}</span> {t("monthlyCredits")}
              </motion.span>
            </li>
            <li className="flex items-center gap-1.5 text-xs text-foreground">
              <Check className="w-3 h-3 text-primary flex-shrink-0" />
              {t("petAnalysisFeature")}
            </li>
            <li className="flex items-center gap-1.5 text-xs text-foreground">
              <Check className="w-3 h-3 text-primary flex-shrink-0" />
              {t("calendarCustomization")}
            </li>
            <li className="flex items-center gap-1.5 text-xs text-foreground">
              <Check className="w-3 h-3 text-primary flex-shrink-0" />
              {t("weeklyPetReport")}
            </li>
            {/* Extra yearly benefit - direction-aware horizontal slide + fade */}
            <motion.li
              initial={false}
              animate={{
                opacity: billingCycle === "yearly" ? 1 : 0,
                x: billingCycle === "yearly" ? 0 : slideDirection * 8,
              }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="flex items-center gap-1.5 text-xs text-foreground will-change-transform"
              style={{ pointerEvents: billingCycle === "yearly" ? "auto" : "none" }}
            >
              <Check className="w-3 h-3 text-primary flex-shrink-0" />
              {t("moreCreditsAnnual")}
            </motion.li>
          </ul>

          {/* CTA Button - shows for free users OR when viewing a different plan than current */}
          {(currentPlan === "free" || 
            (currentPlan === "pro-monthly" && billingCycle === "yearly") || 
            (currentPlan === "pro-yearly" && billingCycle === "monthly")
          ) && (
            <Button 
              onClick={() => {
                if (scheduledDowngradeDate) {
                  setShowScheduledModal(true);
                } else {
                  handleSelectPlan();
                }
              }}
              className="w-full active:scale-[0.97] transition-transform duration-100 will-change-transform" 
              size="sm"
            >
              {currentPlan === "free" 
                ? (isFirstPaidMonth ? t("startWithFreeCredits") : t("choosePlan"))
                : t("changePlan")
              }
            </Button>
          )}
        </div>
      </div>

      {/* Buy Extra Credits Section */}
      <div className="px-5 mb-6">
        <div className="relative px-4 py-5 rounded-xl border-2 border-primary/30 overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at center, hsl(var(--accent)) 0%, hsl(var(--accent) / 0.4) 100%)'
          }}
        >
          {/* Background sparkle decorations - distributed across background, avoiding card area */}
          <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
            {/* Top area - around title margins */}
            <span className="absolute top-1 left-3 text-sm opacity-40" style={{ transform: 'rotate(-15deg)' }}>✨</span>
            <span className="absolute top-2.5 right-2 text-xs opacity-35" style={{ transform: 'rotate(10deg)' }}>✨</span>
            <span className="absolute top-0.5 right-1/4 text-xs opacity-30" style={{ transform: 'rotate(-5deg)' }}>✨</span>
            
            {/* Side margins - left and right edges */}
            <span className="absolute top-1/3 left-0.5 text-base opacity-35" style={{ transform: 'rotate(8deg)' }}>✨</span>
            <span className="absolute top-2/5 right-0 text-sm opacity-30" style={{ transform: 'rotate(-12deg)' }}>✨</span>
            
            {/* Bottom area - below cards */}
            <span className="absolute bottom-1 left-4 text-xs opacity-40" style={{ transform: 'rotate(5deg)' }}>✨</span>
            <span className="absolute bottom-0.5 right-1/3 text-sm opacity-35" style={{ transform: 'rotate(-8deg)' }}>✨</span>
            <span className="absolute bottom-2 right-2 text-base opacity-45" style={{ transform: 'rotate(3deg)' }}>✨</span>
          </div>

          {/* Section Header */}
          <div className="relative text-center mb-4">
            <h4 className="text-xl font-extrabold text-foreground">{t("buyExtraCredits")}</h4>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t("oneTimePurchase")} {t("creditsNeverExpire")}
            </p>
          </div>

          {/* Credit Options Row */}
          <div className="relative grid grid-cols-3 gap-2">
            {[
              { id: "extra_credits_10", credits: 10, price: "$3.49" },
              { id: "extra_credits_20", credits: 20, price: "$4.99", popular: true },
              { id: "extra_credits_30", credits: 30, price: "$7.99" },
            ].map((pkg) => (
              <div
                key={pkg.id}
                className={cn(
                  "relative flex flex-col items-center py-4 px-2 rounded-xl transition-all",
                  pkg.popular 
                    ? "bg-primary/15 border-2 border-primary/25 shadow-md" 
                    : "bg-background/70 border border-border/40 shadow-sm"
                )}
              >
                {/* Soft top highlight for depth */}
                <div 
                  className={cn(
                    "absolute inset-x-0 top-0 h-12 rounded-t-xl pointer-events-none",
                    pkg.popular
                      ? "bg-gradient-to-b from-white/20 to-transparent"
                      : "bg-gradient-to-b from-white/10 to-transparent"
                  )}
                />
                
                {pkg.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold whitespace-nowrap">
                    {t("bestValue")}
                  </div>
                )}
                
                <span className="relative text-xl font-extrabold text-foreground">+{pkg.credits}</span>
                <span className="relative text-[10px] text-muted-foreground -mt-0.5">{t("credits")}</span>
                <span className="relative text-xs font-semibold text-foreground mt-2 mb-3">{pkg.price}</span>
                
                {/* Fixed height container prevents layout shift */}
                <div className="relative w-full h-8">
                  <Button
                    onClick={() => {
                      if (currentPlan === "free") {
                        setShowSubscriptionRequired(true);
                      } else {
                        // Add extra credits immediately
                        addExtraCredits(pkg.credits);
                        toast.success(`+${pkg.credits} credits have been added!`, {
                          duration: 1500,
                          icon: <Zap className="w-4 h-4 text-primary" />,
                        });
                      }
                    }}
                    size="sm"
                    className="absolute inset-0 text-[11px] font-semibold rounded-lg active:scale-[0.96] transition-transform duration-100 ease-out will-change-transform"
                  >
                    {t("addCredits")}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer - single line, muted styling */}
          <p className="text-[11px] text-muted-foreground/70 text-center mt-4 whitespace-nowrap leading-tight">
            Extra credits require an active subscription.
          </p>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t("settings")}</h3>
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
          {[
          { icon: HelpCircle, label: t("helpSupport"), action: () => {
              setShowHelpDirectly(true);
              setSettingsInitialSection("help");
              setShowSettings(true);
            }},
            { icon: Settings, label: t("settings"), action: () => {
              setShowHelpDirectly(false);
              setSettingsInitialSection("main");
              setShowSettings(true);
            }},
            { icon: LogOut, label: t("signOut"), danger: true, action: handleSignOutClick },
          ].map((item, index) => (
            <button
              key={item.label}
              onClick={item.action}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors",
                index > 0 && "border-t border-border/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center",
                  item.danger ? "bg-destructive/10" : "bg-muted/50"
                )}>
                  <item.icon className={cn(
                    "w-3.5 h-3.5",
                    item.danger ? "text-destructive" : "text-muted-foreground"
                  )} />
                </div>
                <span className={cn(
                  "text-sm font-medium",
                  item.danger ? "text-destructive" : "text-foreground"
                )}>
                  {item.label}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </button>
          ))}
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      <SignOutConfirmModal
        isOpen={showSignOutConfirm}
        onConfirm={handleSignOutConfirm}
        onCancel={() => setShowSignOutConfirm(false)}
      />

      {/* Subscription Required Modal */}
      <SubscriptionRequiredModal
        isOpen={showSubscriptionRequired}
        onClose={() => setShowSubscriptionRequired(false)}
        onChoosePlan={() => {
          setShowSubscriptionRequired(false);
          planSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      />

      {/* Scheduled Downgrade Modal */}
      <Dialog open={showScheduledModal} onOpenChange={setShowScheduledModal}>
        <DialogContent className="max-w-[320px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Plan change scheduled</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              Your plan will switch on {scheduledDowngradeDate ? format(scheduledDowngradeDate, "MM/dd/yyyy") : ""} after your current subscription period ends.
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => setShowScheduledModal(false)}
            className="w-full mt-2"
            size="sm"
          >
            OK
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Reusable locked feature overlay component
export function LockedFeatureOverlay({ 
  onNavigateToProfile 
}: { 
  onNavigateToProfile: () => void 
}) {
  const { t } = useLanguage();
  
  return (
    <div 
      className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center cursor-pointer z-10"
      onClick={onNavigateToProfile}
    >
      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
        <Lock className="w-6 h-6 text-primary" />
      </div>
      <p className="text-sm font-semibold text-foreground">{t("lockedFeature")}</p>
      <p className="text-[10px] text-muted-foreground">{t("unlockWithPro")}</p>
    </div>
  );
}