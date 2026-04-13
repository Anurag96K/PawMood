import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
  credits: number; // Add credits
  deletion_requested_at?: string | null;
  created_at: string;
  updated_at: string;
}

type UpdateProfileInput = Partial<
  Omit<Profile, "id" | "user_id" | "created_at" | "updated_at">
>;

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  /**
   * Avatar URL with a stable cache key so it loads fast, but refreshes after profile updates.
   */
  avatarSrc?: string;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: UpdateProfileInput) => Promise<Profile>;
  uploadAvatar: (file: File) => Promise<string>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

async function getAuthedUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      if (!session) {
        queryClient.setQueryData(["profile"], null);
        queryClient.removeQueries({ queryKey: ["profile"] }); // Clear global cache
      }
      // We invalidate generic profile, but rely on keyed profile for data
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const profileQuery = useQuery<Profile | null, Error>({
    queryKey: ["profile", userId], // Key by userId to prevent stale data
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!userId, // Only fetch when we have a userId
    staleTime: 0, // Always check for freshness on mount/update given the sensitivity
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const updateMutation = useMutation<Profile, Error, UpdateProfileInput>({
    mutationFn: async (updates) => {
      const userId = await getAuthedUserId();
      if (!userId) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["profile", data.user_id], data);
    },
  });

  const fetchProfile = async () => {
    await profileQuery.refetch();
  };

  const updateProfile = async (updates: UpdateProfileInput) => {
    return updateMutation.mutateAsync(updates);
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    const userId = await getAuthedUserId();
    if (!userId) throw new Error("User not authenticated");

    const fileExt = file.name.split(".").pop() || "png";
    const fileName = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(fileName);

    await updateProfile({ avatar_url: publicUrl });

    return publicUrl;
  };

  const avatarSrc = useMemo(() => {
    const avatarUrl = profileQuery.data?.avatar_url;
    if (!avatarUrl) return undefined;

    // Use updated_at as a cache key so images cache well, but refresh after profile updates.
    const version = profileQuery.data?.updated_at ?? "";
    const sep = avatarUrl.includes("?") ? "&" : "?";
    return `${avatarUrl}${sep}v=${encodeURIComponent(version)}`;
  }, [profileQuery.data?.avatar_url, profileQuery.data?.updated_at]);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile: profileQuery.data ?? null,
      loading: profileQuery.isLoading,
      error: profileQuery.error?.message ?? null,
      avatarSrc,
      fetchProfile,
      updateProfile,
      uploadAvatar,
    }),
    [profileQuery.data, profileQuery.isLoading, profileQuery.error, avatarSrc]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfileContext() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within <ProfileProvider>");
  return ctx;
}
