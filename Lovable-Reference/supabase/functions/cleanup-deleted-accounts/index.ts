import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find profiles where deletion was requested more than 7 days ago
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: profiles, error: fetchError } = await supabase
      .from("profiles")
      .select("user_id")
      .not("deletion_requested_at", "is", null)
      .lte("deletion_requested_at", sevenDaysAgo);

    if (fetchError) throw fetchError;

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ message: "No accounts to delete", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const deletedUsers: string[] = [];

    for (const profile of profiles) {
      const userId = profile.user_id;

      try {
        // Delete user data from all tables
        await supabase.from("mood_entries").delete().eq("user_id", userId);
        await supabase.from("messages").delete().eq("sender_id", userId);
        await supabase.from("chat_participants").delete().eq("user_id", userId);
        await supabase.from("pets").delete().eq("user_id", userId);
        await supabase.from("user_uploads").delete().eq("user_id", userId);
        await supabase.from("user_roles").delete().eq("user_id", userId);
        await supabase.from("profiles").delete().eq("user_id", userId);

        // Delete storage files
        const { data: avatarFiles } = await supabase.storage
          .from("avatars")
          .list(userId);
        if (avatarFiles && avatarFiles.length > 0) {
          await supabase.storage
            .from("avatars")
            .remove(avatarFiles.map((f) => `${userId}/${f.name}`));
        }

        const { data: uploadFiles } = await supabase.storage
          .from("user-uploads")
          .list(userId);
        if (uploadFiles && uploadFiles.length > 0) {
          await supabase.storage
            .from("user-uploads")
            .remove(uploadFiles.map((f) => `${userId}/${f.name}`));
        }

        // Delete the auth user last
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError) {
          console.error(`Failed to delete auth user ${userId}:`, authError);
        } else {
          deletedUsers.push(userId);
        }
      } catch (userError) {
        console.error(`Error deleting data for user ${userId}:`, userError);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Deleted ${deletedUsers.length} accounts`,
        count: deletedUsers.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in cleanup-deleted-accounts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
