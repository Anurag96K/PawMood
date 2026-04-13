import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const SUBSCRIPTION_HISTORY_KEY = "has_ever_subscribed";

/**
 * Hook to track if user has ever had a subscription (for lock screen copy differentiation)
 * 
 * - New users: never had a subscription → show "Start with 3 free credits ✨"
 * - Returning users: had subscription before → show "Start again ✨"
 */
export function useSubscriptionHistory() {
  const { user } = useAuth();
  const [hasEverSubscribed, setHasEverSubscribed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSubscriptionHistory = async () => {
      if (!user) {
        setHasEverSubscribed(false);
        setIsLoading(false);
        return;
      }

      // First check localStorage for cached value
      const cachedValue = localStorage.getItem(`${SUBSCRIPTION_HISTORY_KEY}_${user.id}`);
      if (cachedValue === "true") {
        setHasEverSubscribed(true);
        setIsLoading(false);
        return;
      }

      try {
        // Check if user has ever had a premium role (even if expired)
        const { data, error } = await supabase
          .from("user_roles")
          .select("role, granted_at")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking subscription history:", error);
          setHasEverSubscribed(false);
        } else if (data && data.role === "premium") {
          // User has or had premium - cache this permanently
          localStorage.setItem(`${SUBSCRIPTION_HISTORY_KEY}_${user.id}`, "true");
          setHasEverSubscribed(true);
        } else {
          setHasEverSubscribed(false);
        }
      } catch (err) {
        console.error("Error checking subscription history:", err);
        setHasEverSubscribed(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscriptionHistory();
  }, [user]);

  // Mark user as having subscribed (call when they purchase a plan)
  const markAsSubscribed = () => {
    if (user) {
      localStorage.setItem(`${SUBSCRIPTION_HISTORY_KEY}_${user.id}`, "true");
      setHasEverSubscribed(true);
    }
  };

  return { hasEverSubscribed, isLoading, markAsSubscribed };
}
