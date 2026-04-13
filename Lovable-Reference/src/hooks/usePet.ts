import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Pet {
  id: string;
  user_id: string;
  name: string;
  type: "dog" | "cat" | "other";
  gender: "male" | "female" | null;
  birthday: string | null;
  purposes: string[];
  created_at: string;
  updated_at: string;
}

export function usePet() {
  const { user } = useAuth();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPet = useCallback(async () => {
    if (!user) {
      setPet(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("pets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setPet(data as Pet | null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch pet");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPet();
  }, [fetchPet]);

  const createPet = useCallback(async (petData: {
    name: string;
    type: "dog" | "cat" | "other";
    gender: "male" | "female" | null;
    birthday: Date | null;
    purposes: string[];
  }) => {
    if (!user) {
      return { error: { message: "Not authenticated" }, data: null };
    }

    try {
      const { data, error: insertError } = await supabase
        .from("pets")
        .insert({
          user_id: user.id,
          name: petData.name,
          type: petData.type,
          gender: petData.gender,
          birthday: petData.birthday ? petData.birthday.toISOString().split('T')[0] : null,
          purposes: petData.purposes,
        })
        .select()
        .single();

      if (insertError) {
        return { error: insertError, data: null };
      }

      setPet(data as Pet);
      return { error: null, data: data as Pet };
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : "Failed to create pet" }, data: null };
    }
  }, [user]);

  const updatePet = useCallback(async (updates: Partial<Omit<Pet, "id" | "user_id" | "created_at" | "updated_at">>) => {
    if (!user || !pet) {
      return { error: { message: "No pet to update" }, data: null };
    }

    try {
      const { data, error: updateError } = await supabase
        .from("pets")
        .update(updates)
        .eq("id", pet.id)
        .select()
        .single();

      if (updateError) {
        return { error: updateError, data: null };
      }

      setPet(data as Pet);
      return { error: null, data: data as Pet };
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : "Failed to update pet" }, data: null };
    }
  }, [user, pet]);

  return {
    pet,
    loading,
    error,
    fetchPet,
    createPet,
    updatePet,
    hasPet: !!pet,
  };
}
