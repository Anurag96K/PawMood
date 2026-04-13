import { useProfileContext } from "@/contexts/ProfileContext";
export type { Profile } from "@/contexts/ProfileContext";

export function useProfile() {
  return useProfileContext();
}

