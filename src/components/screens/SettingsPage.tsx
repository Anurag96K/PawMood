import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Lock,
  User,
  Globe,
  HelpCircle,
  FileText,
  CreditCard,
  LogOut,
  ChevronRight,
  Eye,
  EyeOff,
  Check,
  Mail,
  Phone,
  Camera,
  Loader2,
  ShieldCheck,
  Cookie,
  Sparkles,
  CheckCircle,
  Image,
  ArrowUpCircle,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import { motion, AnimatePresence } from "framer-motion";
import { DeleteAccountModal } from "@/components/DeleteAccountModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Database } from "lucide-react";
import { useDataSeeding } from "@/hooks/useDataSeeding";

type SettingsSection =
  | "main"
  | "editProfile"
  | "language"
  | "help"
  | "terms"
  | "upgradePlan";

interface SettingsPageProps {
  onClose: () => void;
  onSignOut: () => void;
  currentPlan: string;
  onUpgrade: () => void;
  initialSection?: SettingsSection;
}

export function SettingsPage({ onClose, onSignOut, currentPlan, onUpgrade, initialSection = "main" }: SettingsPageProps) {
  const { t, language, setLanguage } = useLanguage();
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);
  const startedFromHelp = initialSection === "help";
  const startedFromEditProfile = initialSection === "editProfile";
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ deletion_requested_at: new Date().toISOString() } as any)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success(t("deletionRequested") || "Account deletion requested. You will be signed out.");
      setTimeout(() => {
        onSignOut();
      }, 2000);
    } catch (err) {
      console.error("Error requesting deletion:", err);
      toast.error("Failed to request deletion. Please try again.");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const renderContent = () => {
    switch (activeSection) {

      case "editProfile":
        return <EditProfileSection onBack={startedFromEditProfile ? onClose : () => setActiveSection("main")} />;
      case "language":
        return (
          <LanguageSection
            onBack={() => setActiveSection("main")}
            currentLanguage={language}
            onLanguageChange={setLanguage}
          />
        );
      case "help":
        return <HelpSupportSection onBack={() => setActiveSection("main")} />;
      case "terms":
        return <TermsSection onBack={() => setActiveSection("main")} />;
      case "upgradePlan":
        return (
          <UpgradePlanSection
            onBack={() => setActiveSection("main")}
            currentPlan={currentPlan}
            onUpgrade={onUpgrade}
          />
        );
      default:
        return (
          <MainSettingsMenu
            onSelectSection={setActiveSection}
            onSignOut={onSignOut}
            onDeleteAccount={() => setShowDeleteModal(true)}
            currentPlan={currentPlan}
          />
        );
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (startedFromHelp || startedFromEditProfile) {
      // If we started from help or edit profile (direct navigation), close entirely
      onClose();
    } else {
      // Otherwise, go back to main menu
      setActiveSection("main");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-3 pt-8 border-b border-border bg-background">
        <button
          key={activeSection === "main" ? "close" : "back"}
          onClick={activeSection === "main" ? onClose : handleBack}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <h1 className="flex-1 font-semibold text-foreground text-sm">
          {activeSection === "main" ? t("settings") :
            activeSection === "editProfile" ? t("editProfile") :
              activeSection === "language" ? t("language") :
                activeSection === "help" ? t("helpSupport") :
                  activeSection === "terms" ? "Terms & Conditions" :
                activeSection === "upgradePlan" ? "Upgrade Plan" : t("settings")}
        </h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        loading={deleting}
      />
    </div>
  );
}

// Main Settings Menu
function MainSettingsMenu({
  onSelectSection,
  onSignOut,
  onDeleteAccount,
  currentPlan
}: {
  onSelectSection: (section: SettingsSection) => void;
  onSignOut: () => void;
  onDeleteAccount: () => void;
  currentPlan: string;
}) {
  const { t } = useLanguage();

  const menuItems = [
    { id: "editProfile" as const, icon: User, label: t("editProfile"), subtitle: t("profileSubtitle") },
    { id: "language" as const, icon: Globe, label: t("language"), subtitle: "English, 한국어, 日本語" },
    { id: "help" as const, icon: HelpCircle, label: t("helpSupport"), subtitle: "FAQ, Contact us" },
    { id: "terms" as const, icon: FileText, label: t("termsConditions"), subtitle: t("privacyPolicy") },
  ];

  return (
    <div className="p-4 space-y-2">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelectSection(item.id)}
          className="w-full flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:bg-accent/50 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
            <item.icon className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-foreground">{item.label}</p>
            <p className="text-[10px] text-muted-foreground">{item.subtitle}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      ))}

      {/* Sign Out Button */}
      <button
        onClick={onSignOut}
        className="w-full flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:bg-accent/50 transition-colors mt-4"
      >
        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
          <LogOut className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-foreground">{t("signOut")}</p>
          <p className="text-[10px] text-muted-foreground">End your session</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Delete Account Button */}
      <button
        onClick={onDeleteAccount}
        className="w-full flex items-center gap-3 p-3 bg-destructive/5 rounded-xl border border-destructive/10 hover:bg-destructive/10 transition-colors mt-1"
      >
        <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
          <Trash2 className="w-4 h-4 text-destructive" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-destructive">{t("deleteAccount") || "Delete Account"}</p>
          <p className="text-[10px] text-destructive/60">Permanently remove data</p>
        </div>
        <ChevronRight className="w-4 h-4 text-destructive/40" />
      </button>
    </div>
  );
}



// Edit Profile Section
function EditProfileSection({ onBack }: { onBack: () => void }) {
  const { profile, avatarSrc, loading: profileLoading, updateProfile, uploadAvatar } = useProfile();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load profile data when available
  useEffect(() => {
    if (profile) {
      setName(profile.display_name || "Pet Parent");
      setEmail(profile.email || "");
      setAvatarUrl(avatarSrc || profile.avatar_url);
    }
  }, [profile, avatarSrc]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }

      // Store file for upload on save
      setPendingFile(file);

      // Show preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upload avatar if there's a pending file
      if (pendingFile) {
        setUploading(true);
        try {
          const newAvatarUrl = await uploadAvatar(pendingFile);
          setAvatarUrl(newAvatarUrl);
          setPendingFile(null);
        } catch (err) {
          console.error("Error uploading avatar:", err);
          // Continue with other updates even if avatar fails
        }
        setUploading(false);
      }

      // Update profile data
      await updateProfile({
        display_name: name,
        email,
      });

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onBack();
      }, 1500);
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="p-4 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Profile Picture */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <button
            onClick={handleAvatarClick}
            disabled={uploading}
            className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-2xl overflow-hidden hover:ring-2 hover:ring-primary transition-all disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>🐕</span>
            )}
          </button>
          <button
            onClick={handleAvatarClick}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Camera className="w-3 h-3 text-primary-foreground" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {pendingFile ? "Photo will be uploaded on save" : "Tap to change photo"}
        </p>
      </div>

      {/* Name */}
      <div>
        <label className="text-xs font-medium text-foreground mb-1.5 block">Display Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-10 px-3 bg-muted rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Email - Read Only */}
      <div>
        <label className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
          <Mail className="w-3 h-3" /> Email
        </label>
        <input
          type="email"
          value={email}
          readOnly
          disabled
          className="w-full h-10 px-3 bg-muted/50 rounded-lg text-sm text-muted-foreground focus:outline-none cursor-not-allowed opacity-70"
        />
      </div>

      <Button onClick={handleSave} disabled={saving || saved} className="w-full" size="sm">
        {saved ? (
          <>
            <Check className="w-4 h-4" />
            Profile Updated!
          </>
        ) : saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {uploading ? "Uploading..." : "Saving..."}
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </div>
  );
}

// Language Section
function LanguageSection({
  onBack,
  currentLanguage,
  onLanguageChange
}: {
  onBack: () => void;
  currentLanguage: string;
  onLanguageChange: (lang: "en" | "ko" | "ja" | "zh" | "es" | "fr" | "de" | "pt") => void;
}) {
  const languages = [
    { code: "en" as const, name: "English", nativeName: "English", flag: "🇺🇸" },
    { code: "ko" as const, name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
    { code: "ja" as const, name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
    { code: "zh" as const, name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
    { code: "es" as const, name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
    { code: "fr" as const, name: "French", nativeName: "Français", flag: "🇫🇷" },
    { code: "de" as const, name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
    { code: "pt" as const, name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
  ];

  return (
    <div className="p-4 space-y-1.5">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => {
            onLanguageChange(lang.code);
            setTimeout(onBack, 300);
          }}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-xl border transition-colors",
            currentLanguage === lang.code
              ? "bg-primary/10 border-primary"
              : "bg-card border-border hover:bg-accent/50"
          )}
        >
          <span className="text-2xl">{lang.flag}</span>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-foreground">{lang.name}</p>
            <p className="text-xs text-muted-foreground">{lang.nativeName}</p>
          </div>
          {currentLanguage === lang.code && (
            <Check className="w-4 h-4 text-primary" />
          )}
        </button>
      ))}
    </div>
  );
}

// Help & Support Section
function HelpSupportSection({ onBack }: { onBack: () => void }) {
  const { seedFebruaryData } = useDataSeeding();
  const faqItems = [
    { icon: Sparkles, q: "How does mood analysis work?", a: "Our AI analyzes your pet's facial expressions and body language to determine their current emotional state." },
    { icon: CheckCircle, q: "Is the analysis accurate?", a: "The analysis is an estimation based on visual cues. It's not a medical diagnosis." },
    { icon: Image, q: "How are photos I take saved?", a: "Analysis cards are automatically saved to your Calendar after analysis." },
    { icon: ArrowUpCircle, q: "Can I upgrade my plan anytime?", a: "Plan changes are handled by the App Store / Google Play and may take effect immediately or at the start of the next billing cycle, depending on the type of change. Credits are applied based on the active plan and are not prorated when plans change." },
    { icon: RotateCcw, q: "How do refunds work?", a: "Refunds are only available through the app store (Apple App Store / Google Play). We do not process refunds directly. Please request refunds through your store account." },
  ];

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className="p-4 space-y-4">
      {/* FAQ Section */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Frequently Asked Questions</h3>
        <div className="space-y-1">
          {faqItems.map((item, index) => (
            <div key={index} className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="w-full p-2.5 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <item.icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="text-xs font-medium text-foreground">{item.q}</span>
                </div>
                <ChevronRight className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ml-2",
                  expandedFaq === index && "rotate-90"
                )} />
              </button>
              <AnimatePresence>
                {expandedFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3">
                      <p className="text-xs text-muted-foreground">{item.a}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Contact Us</h3>
        <div className="space-y-2">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = "mailto:support@petmood.app"}
            className="w-full flex items-center gap-3 p-2.5 bg-card rounded-xl border border-border hover:bg-accent/50 transition-colors"
          >
            <Mail className="w-4 h-4 text-primary" />
            <span className="text-xs text-foreground">support@petmood.app</span>
          </motion.button>
        </div>
      </div>

      {/* Seeding Section (Internal Testing) */}
      <div className="pt-4 border-t border-border/40">
        <Button
          variant="outline"
          size="sm"
          onClick={seedFebruaryData}
          className="w-full gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary"
        >
          <Database className="w-4 h-4" />
          Seed February Testing Data
        </Button>
        <p className="text-[10px] text-muted-foreground text-center mt-2 px-4 whitespace-normal">
          This will add diverse mood entries for Feb 2026 to verify the report logic. Requires login. 
        </p>
      </div>

      {/* App Info */}
      <div className="text-center pt-2">
        <p className="text-[10px] text-foreground/60">Made with ❤️ for pet lovers</p>
      </div>
    </div>
  );
}

// Terms & Conditions Section
function TermsSection({ onBack }: { onBack: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

  const sections = [
    {
      id: "tos",
      icon: FileText,
      title: "Terms of Service",
      content: (
        <div className="space-y-1.5">
          <p>Welcome to PetMood. By using our service, you agree to these terms.</p>
          <p><strong>1. Service Usage</strong> — PetMood provides AI-powered pet mood analysis for entertainment purposes only.</p>
          <p><strong>2. User Content</strong> — You retain ownership of photos you upload.</p>
          <p><strong>3. Accuracy</strong> — Mood analysis results are estimations and should not replace professional veterinary advice.</p>
          <p><strong>4. Limitation of Liability</strong> — PetMood is not responsible for any decisions or actions taken based on the analysis results. The service is provided for informational and entertainment purposes only. Use of the service is at the user's own risk.</p>
          <p><strong>5. Account Termination</strong> — We may suspend or terminate accounts that violate these terms, misuse the service, or engage in abusive or fraudulent behavior.</p>
          <p><strong>6. Changes to These Terms</strong> — We may update these Terms & Conditions from time to time. Continued use of the service after any changes means acceptance of the updated terms.</p>
        </div>
      ),
    },
    {
      id: "privacy",
      icon: ShieldCheck,
      title: "Privacy Policy",
      content: (
        <div className="space-y-1.5">
          <p><strong>Data Collection</strong> — We collect account information and photos you upload for analysis.</p>
          <p><strong>Data Usage</strong> — Your data is used to provide mood analysis services.</p>
          <p><strong>Third Parties</strong> — We do not sell your personal data to third parties.</p>
        </div>
      ),
    },
    {
      id: "cookies",
      icon: Cookie,
      title: "Cookie Policy",
      content: (
        <p>We use cookies to improve your experience and remember your preferences.</p>
      ),
    },
    {
      id: "plans",
      icon: CreditCard,
      title: "Plans & Credits",
      content: (
        <div className="space-y-3">
          <div>
            <p className="font-semibold text-foreground text-[11px] mb-0.5">Free Credits</p>
            <p>Free credits are considered a benefit included as part of a paid plan. They are not provided as a standalone free product.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground text-[11px] mb-0.5">Refund Policy (Plans & Additional Credits)</p>
            <p>Refunds are available only within 24 hours of purchase and only if there is no usage history. This applies to both subscription plans and additional credit purchases. If any credits have been used, refunds will not be provided.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground text-[11px] mb-0.5">Credits Usage Order</p>
            <p>The mb-1</p>
            <p className="mb-1">When multiple types of credits exist in an account, credits are consumed in the following order:</p>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>Free credits</li>
              <li>Plan-included credits</li>
              <li>Additional purchased credits</li>
            </ol>
          </div>
          <div>
            <p className="font-semibold text-foreground text-[11px] mb-0.5">Additional Credits</p>
            <p>Additional credits do not expire once purchased. However, additional credits can only be used while an active paid plan is in place.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground text-[11px] mb-0.5">Plan Requirement / Restrictions</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Additional credits cannot be used without an active paid plan.</li>
              <li>If a plan expires, additional credits cannot be used.</li>
              <li>If a plan is not active, users cannot purchase additional credits.</li>
            </ul>
            <p className="mt-1">To use or purchase additional credits, an active paid plan is required.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground text-[11px] mb-0.5">Subscription Status</p>
            <p>When a subscription ends, any remaining plan-included credits will no longer be available. Additional credits remain in the account but cannot be used unless a new plan is purchased.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground text-[11px] mb-0.5">Monthly Credit Reset (No Rollover)</p>
            <p>Plan-included credits reset at the start of each billing cycle and do not roll over. Unused plan credits will be cleared when a new billing cycle begins.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground text-[11px] mb-0.5">Plan Changes & Credits</p>
            <p>Credits are applied based on the active plan and are not prorated when plans change.</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 space-y-1.5">
      {sections.map((section) => (
        <div key={section.id} className="bg-card rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => toggle(section.id)}
            className="w-full p-3 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <section.icon className="w-3.5 h-3.5 text-muted-foreground/70 flex-shrink-0" />
              <span className="text-xs font-semibold text-foreground">{section.title}</span>
            </div>
            <ChevronRight className={cn(
              "w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ml-2",
              expanded === section.id && "rotate-90"
            )} />
          </button>
          <AnimatePresence>
            {expanded === section.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 text-[10px] text-muted-foreground leading-relaxed max-h-[50vh] overflow-y-auto">
                  {section.content}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      <p className="text-[10px] text-muted-foreground text-center pt-2">
        Last updated: February 2026
      </p>
    </div>
  );
}

// Upgrade Plan Section
function UpgradePlanSection({
  onBack,
  currentPlan,
  onUpgrade
}: {
  onBack: () => void;
  currentPlan: string;
  onUpgrade: () => void;
}) {
  const { t } = useLanguage();

  const plans = [
    {
      id: "free",
      name: t("planFree"),
      price: "$0",
      period: t("forever"),
      features: [
        t("freeAnalyses"),
        t("viewCommunity"),
        t("joinChatRooms"),
      ],
      highlighted: false,
    },
    {
      id: "basic",
      name: t("planBasic"),
      price: "$8.99",
      period: t("perMonth"),
      features: [
        t("monthlyAnalyses"),
        t("viewCommunity"),
        t("joinChatRooms"),
        t("calendarSaving"),
      ],
      highlighted: false,
    },
    {
      id: "premium",
      name: t("planPremium"),
      price: "$89.90",
      period: t("perYear"),
      features: [
        t("unlimitedAnalyses"),
        t("viewCommunity"),
        t("joinChatRooms"),
        t("calendarSaving"),
        t("memoDiary"),
        t("prioritySupport"),
      ],
      highlighted: true,
    },
  ];

  return (
    <div className="p-4 space-y-3">
      <p className="text-xs text-muted-foreground text-center mb-1">
        Current plan: <span className="font-semibold text-foreground">{currentPlan}</span>
      </p>

      {plans.map((plan) => (
        <div
          key={plan.id}
          className={cn(
            "rounded-xl border p-3",
            plan.highlighted
              ? "bg-primary/5 border-primary"
              : "bg-card border-border",
            currentPlan.toLowerCase() === plan.id && "ring-2 ring-primary"
          )}
        >
          {plan.highlighted && (
            <span className="inline-block px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full mb-1.5">
              {t("popular")}
            </span>
          )}

          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-lg font-bold text-foreground">{plan.price}</span>
            <span className="text-xs text-muted-foreground">{plan.period}</span>
          </div>

          <h4 className="text-sm font-semibold text-foreground mb-2">{plan.name}</h4>

          <ul className="space-y-1 mb-3">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check className="w-3 h-3 text-primary shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          <Button
            onClick={onUpgrade}
            className="w-full"
            size="sm"
            variant={currentPlan.toLowerCase() === plan.id ? "secondary" : "default"}
            disabled={currentPlan.toLowerCase() === plan.id}
          >
            {currentPlan.toLowerCase() === plan.id ? "Current Plan" : `Upgrade to ${plan.name}`}
          </Button>
        </div>
      ))}
    </div>
  );
}