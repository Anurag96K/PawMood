import { useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface PendingDeletionBannerProps {
  deletionRequestedAt: string;
  onCancelled: () => void;
}

export function PendingDeletionBanner({ deletionRequestedAt, onCancelled }: PendingDeletionBannerProps) {
  const { t } = useLanguage();
  const [cancelling, setCancelling] = useState(false);

  const requestDate = new Date(deletionRequestedAt);
  const deletionDate = new Date(requestDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((deletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const handleCancelDeletion = async () => {
    setCancelling(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ deletion_requested_at: null } as any)
        .eq("user_id", user.id);

      if (error) throw error;
      onCancelled();
    } catch (err) {
      console.error("Error cancelling deletion:", err);
    } finally {
      setCancelling(false);
    }
  };

  const daysText = t("deletionPendingDays").replace("{days}", String(daysRemaining));

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-[320px] text-center space-y-5">
        {/* Soft icon */}
        <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Clock className="w-7 h-7 text-primary" />
        </div>

        {/* Title & subtitle */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            {t("deletionPendingTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {daysText}
          </p>
        </div>

        {/* Primary (recovery) button */}
        <Button
          onClick={handleCancelDeletion}
          disabled={cancelling}
          className="w-full"
        >
          {cancelling ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          {t("cancelDeletion")}
        </Button>
      </div>
    </div>
  );
}
