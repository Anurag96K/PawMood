import { useState } from "react";
import { Clock, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface PendingDeletionScreenProps {
  deletionRequestedAt: string;
  onCancelled: () => void;
  onSignOut: () => void;
}

export function PendingDeletionScreen({ deletionRequestedAt, onCancelled, onSignOut }: PendingDeletionScreenProps) {
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

  const daysText = (t("deletionPendingDays") || "Account will be deleted in {days} days.").replace("{days}", String(daysRemaining));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-background flex flex-col p-6 items-center justify-center text-center"
    >
      <div className="w-full max-w-[320px] space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center shadow-inner">
          <Clock className="w-10 h-10 text-primary" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            {t("deletionPendingTitle") || "Account Deletion Pending"}
          </h2>
          <p className="text-base text-muted-foreground">
            {daysText}
          </p>
        </div>

        <div className="p-4 bg-muted/50 rounded-2xl border border-border/50 text-sm text-left">
          <p className="text-muted-foreground leading-relaxed">
            {t("deletionPendingNotice") || "You can cancel this request at any time before the deletion date by tapping the button below."}
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Button
            onClick={handleCancelDeletion}
            disabled={cancelling}
            className="w-full h-12 text-base font-bold rounded-2xl shadow-lg active:scale-95 transition-transform"
          >
            {cancelling ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : null}
            {t("cancelDeletion") || "Cancel Deletion"}
          </Button>

          <Button
            variant="ghost"
            onClick={onSignOut}
            disabled={cancelling}
            className="w-full h-12 text-base font-semibold text-muted-foreground hover:text-foreground active:scale-95"
          >
            <LogOut className="w-5 h-5 mr-2" />
            {t("signOut") || "Sign Out"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
