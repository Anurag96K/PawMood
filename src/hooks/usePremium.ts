import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function usePremium() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [planInterval, setPlanInterval] = useState<"monthly" | "yearly" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user) {
        setIsPremium(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role, expires_at, plan_interval")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking premium status:", error);
          setIsPremium(false);
          setPlanInterval(null);
        } else if (data) {
          // Log role for debugging (crucial for verifying pro yearly users)
          console.log(`[usePremium] User: ${user.email}, Role: ${data.role}, Plan: ${data.plan_interval}, Expires: ${data.expires_at}`);

          const role = data.role as any;
          const isActive = (role === "premium" || role === "pro") &&
            (data.expires_at === null || new Date(data.expires_at) > new Date());
          setIsPremium(isActive);
          setPlanInterval(data.plan_interval as "monthly" | "yearly" | null);
        } else {
          setIsPremium(false);
          setPlanInterval(null);
        }
      } catch (err) {
        console.error("Error checking premium status:", err);
        setIsPremium(false);
        setPlanInterval(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkPremiumStatus();
  }, [user]);

  return {
    isPremium,
    planInterval,
    isLoading,
    debugInfo: {
      user: user?.id,
      role: isPremium ? "premium" : "free",
      plan: planInterval
    }
  };
}
