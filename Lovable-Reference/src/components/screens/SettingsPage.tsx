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
  RotateCcw,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import { DeleteAccountModal } from "@/components/DeleteAccountModal";
import { supabase } from "@/integrations/supabase/client";

type SettingsSection = 
  | "main" 
  | "changePassword" 
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

  const renderContent = () => {
    switch (activeSection) {
      case "changePassword":
        return <ChangePasswordSection onBack={() => setActiveSection("main")} />;
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
          onClick={activeSection === "main" ? onClose : handleBack}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <h1 className="flex-1 font-semibold text-foreground text-sm">
          {activeSection === "main" ? t("settings") : 
           activeSection === "changePassword" ? "Change Password" :
           activeSection === "editProfile" ? "Edit Profile" :
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
    </div>
  );
}

// Main Settings Menu
function MainSettingsMenu({ 
  onSelectSection, 
  onSignOut,
  currentPlan 
}: { 
  onSelectSection: (section: SettingsSection) => void;
  onSignOut: () => void;
  currentPlan: string;
}) {
  const { t } = useLanguage();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ deletion_requested_at: new Date().toISOString() } as any)
        .eq("user_id", user.id);

      if (error) throw error;

      setShowDeleteModal(false);
      // Sign out after marking for deletion
      await supabase.auth.signOut();
      onSignOut();
    } catch (err) {
      console.error("Error requesting account deletion:", err);
    } finally {
      setDeletingAccount(false);
    }
  };

  const menuItems = [
    { id: "changePassword" as const, icon: Lock, label: t("settingsChangePassword"), subtitle: t("settingsUpdatePassword") },
    { id: "editProfile" as const, icon: User, label: t("settingsEditProfile"), subtitle: t("settingsUpdateInfo") },
    { id: "language" as const, icon: Globe, label: t("language"), subtitle: "English, 한국어, 日本語" },
    { id: "help" as const, icon: HelpCircle, label: t("helpSupport"), subtitle: "FAQ, Contact us" },
    { id: "terms" as const, icon: FileText, label: t("settingsTerms"), subtitle: t("settingsPrivacyTerms") },
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
        className="w-full flex items-center gap-3 p-3 bg-destructive/10 rounded-xl border border-destructive/20 hover:bg-destructive/20 transition-colors mt-4"
      >
        <div className="w-9 h-9 rounded-lg bg-destructive/20 flex items-center justify-center">
          <LogOut className="w-4 h-4 text-destructive" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-destructive">{t("signOut")}</p>
          <p className="text-[10px] text-destructive/70">{t("settingsLogOutSubtitle")}</p>
        </div>
      </button>

      {/* Delete Account Button */}
      <button
        onClick={() => setShowDeleteModal(true)}
        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/5 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
          <Trash2 className="w-4 h-4 text-destructive/70" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-destructive/70">{t("deleteAccount")}</p>
          <p className="text-[10px] text-muted-foreground">{t("deleteAccountSubtitle")}</p>
        </div>
      </button>

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
        loading={deletingAccount}
      />
    </div>
  );
}

// Change Password Section
function ChangePasswordSection({ onBack }: { onBack: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (newPassword === confirmPassword && newPassword.length >= 8) {
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onBack();
      }, 1500);
    }
  };

  const isValid = currentPassword.length > 0 && 
                  newPassword.length >= 8 && 
                  newPassword === confirmPassword;

  return (
    <div className="p-4 space-y-4">
      {/* Current Password */}
      <div>
        <label className="text-xs font-medium text-foreground mb-1.5 block">Current Password</label>
        <div className="relative">
          <input
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            className="w-full h-10 px-3 pr-10 bg-muted rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* New Password */}
      <div>
        <label className="text-xs font-medium text-foreground mb-1.5 block">New Password</label>
        <div className="relative">
          <input
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full h-10 px-3 pr-10 bg-muted rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {newPassword.length > 0 && newPassword.length < 8 && (
          <p className="text-[10px] text-destructive mt-1">Password must be at least 8 characters</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="text-xs font-medium text-foreground mb-1.5 block">Confirm New Password</label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full h-10 px-3 pr-10 bg-muted rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {confirmPassword.length > 0 && newPassword !== confirmPassword && (
          <p className="text-[10px] text-destructive mt-1">Passwords do not match</p>
        )}
      </div>

      <Button onClick={handleSave} disabled={!isValid || saved} className="w-full" size="sm">
        {saved ? (
          <>
            <Check className="w-4 h-4" />
            Password Updated!
          </>
        ) : (
          "Update Password"
        )}
      </Button>
    </div>
  );
}

// Edit Profile Section
function EditProfileSection({ onBack }: { onBack: () => void }) {
  const { profile, avatarSrc, loading: profileLoading, updateProfile, uploadAvatar } = useProfile();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
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
      setPhone(profile.phone || "");
      setBio(profile.bio || "🐾 Pet lover");
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
        phone: phone || null,
        bio,
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

      {/* Email */}
      <div>
        <label className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
          <Mail className="w-3 h-3" /> Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-10 px-3 bg-muted rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
          <Phone className="w-3 h-3" /> Phone (optional)
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 234 567 8900"
          className="w-full h-10 px-3 bg-muted rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="text-xs font-medium text-foreground mb-1.5 block">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself and your pet..."
          className="w-full h-20 p-3 bg-muted rounded-lg text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          maxLength={150}
        />
        <p className="text-[10px] text-muted-foreground text-right">{bio.length}/150</p>
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
        <div className="space-y-1.5">
          {faqItems.map((item, index) => (
            <div key={index} className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="w-full p-3 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <item.icon className="w-3.5 h-3.5 text-muted-foreground/70 flex-shrink-0" />
                  <span className="text-xs font-medium text-foreground">{item.q}</span>
                </div>
                <ChevronRight className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ml-2",
                  expandedFaq === index && "rotate-90"
                )} />
              </button>
              {expandedFaq === index && (
                <div className="px-3 pb-3">
                  <p className="text-xs text-muted-foreground">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Contact Us</h3>
        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:bg-accent/50 transition-colors">
            <Mail className="w-4 h-4 text-primary" />
            <span className="text-xs text-foreground">support@petmood.app</span>
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="text-center pt-2">
        <p className="text-[10px] text-muted-foreground">Made with ❤️ for pet lovers</p>
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
            <p className="font-semibold text-foreground text-[11px] mb-0.5">1) Subscriptions & Billing</p>
            <p className="mb-1.5">Subscriptions automatically renew based on the selected monthly or yearly plan unless cancelled at least 24 hours before the end of the current billing period.</p>
            <p className="mb-1.5">All payments, subscription changes (upgrades or downgrades), renewals, cancellations, and refunds are managed directly by Apple (App Store) or Google (Google Play).</p>
            <p className="mb-1.5">We do not have the authority to modify subscription status, process refunds, or override billing decisions. All billing-related actions must be handled through the user's Apple ID or Google Play account in accordance with the respective store's policies.</p>
            <p>Subscription benefits and credits are available only while the subscription is active and in good standing.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground text-[11px] mb-0.5">2) Credits Overview</p>
            <p className="mb-1">Credits are provided as part of an active paid subscription plan.</p>
            <p className="mb-1">Plan-included credits:</p>
            <ul className="list-disc pl-4 space-y-0.5 mb-1.5">
              <li>Reset at the start of each billing cycle.</li>
              <li>Do not roll over to the next billing cycle.</li>
              <li>Expire when the subscription ends.</li>
            </ul>
            <p className="mb-1">When multiple types of credits exist in an account, they are consumed in the following order:</p>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>Free credits</li>
              <li>Plan-included credits</li>
              <li>Extra Credits</li>
            </ol>
          </div>
          <div>
            <p className="font-semibold text-foreground text-[11px] mb-0.5">3) Extra Credits</p>
            <p className="mb-1">"Extra Credits" refers to paid credits purchased separately from a subscription plan.</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Extra Credits do not expire once purchased.</li>
              <li>However, they can only be used while an active paid subscription is in place.</li>
              <li>Extra Credits cannot be purchased or used without an active paid plan.</li>
              <li>If a subscription expires, Extra Credits remain in the account but cannot be used until a new subscription is activated.</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground text-[11px] mb-0.5">4) Refund Policy</p>
            <p className="mb-1">Refund requests must be made through Apple Support or Google Play Support in accordance with their respective policies.</p>
            <p className="mb-1">If a refund is granted:</p>
            <ul className="list-disc pl-4 space-y-0.5 mb-1.5">
              <li>The subscription will be terminated immediately.</li>
              <li>All associated credits (used or unused) will be permanently removed from the account.</li>
              <li>If refunded credits have already been used, the account may be restricted or suspended.</li>
            </ul>
            <p>Repeated refund abuse or attempts to exploit the refund system may result in account restriction or permanent suspension.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground text-[11px] mb-0.5">5) Plan Changes & Credits</p>
            <p className="mb-1">Credits are applied based on the currently active subscription.</p>
            <p className="mb-1">When changing plans:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Credits are not prorated, transferred, or carried over.</li>
              <li>Switching plans does not grant additional credits beyond those included in the newly selected plan.</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-foreground text-[11px] mb-0.5">6) Account Deletion</p>
            <p>When an account is deleted, all remaining credits — including Extra Credits — will be permanently removed and cannot be restored.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground text-[11px] mb-0.5">7) Pricing & Taxes</p>
            <p>All displayed prices include applicable taxes where required by the user's region.</p>
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
          {expanded === section.id && (
            <div className="px-3 pb-3 text-[10px] text-muted-foreground leading-relaxed max-h-[50vh] overflow-y-auto">
              {section.content}
            </div>
          )}
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