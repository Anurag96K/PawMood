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

const PET_CACHE_KEY = 'pawmood_pet_cache';

export function usePet() {
  const { user } = useAuth();
  
  // Try to load initial state from cache to prevent flickering
  const [pet, setPet] = useState<Pet | null>(() => {
    try {
      const cached = localStorage.getItem(PET_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  
  const [loading, setLoading] = useState(!pet); // Fast path if cached
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
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching pet:", fetchError);
        setError(fetchError.message);
      } else {
        const petData = data as Pet | null;
        setPet(petData);
        if (petData) {
          localStorage.setItem(PET_CACHE_KEY, JSON.stringify(petData));
        } else {
          localStorage.removeItem(PET_CACHE_KEY);
        }
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
          name: petData.name.slice(0, 12),
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

      const newPet = data as Pet;
      setPet(newPet);
      localStorage.setItem(PET_CACHE_KEY, JSON.stringify(newPet));
      return { error: null, data: newPet };
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : "Failed to create pet" }, data: null };
    }
  }, [user]);

  const updatePet = useCallback(async (updates: Partial<Omit<Pet, "id" | "user_id" | "created_at" | "updated_at">>) => {
    if (!user || !pet) {
      return { error: { message: "No pet to update" }, data: null };
    }

    try {
      const finalUpdates = { ...updates };
      if (finalUpdates.name) {
        finalUpdates.name = finalUpdates.name.slice(0, 12);
      }

      const { data, error: updateError } = await supabase
        .from("pets")
        .update(finalUpdates)
        .eq("id", pet.id)
        .select()
        .single();

      if (updateError) {
        return { error: updateError, data: null };
      }

      const updatedPet = data as Pet;
      setPet(updatedPet);
      localStorage.setItem(PET_CACHE_KEY, JSON.stringify(updatedPet));
      return { error: null, data: updatedPet };
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
