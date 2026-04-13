import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function usePremium() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
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
          .select("role, expires_at")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking premium status:", error);
          setIsPremium(false);
        } else if (data) {
          const isActive = data.role === "premium" && 
            (data.expires_at === null || new Date(data.expires_at) > new Date());
          setIsPremium(isActive);
        } else {
          setIsPremium(false);
        }
      } catch (err) {
        console.error("Error checking premium status:", err);
        setIsPremium(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPremiumStatus();
  }, [user]);

  return { isPremium, isLoading };
}
