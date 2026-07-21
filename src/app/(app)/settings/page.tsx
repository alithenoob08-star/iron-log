import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("unit_preference, leaderboard_opt_in")
    .eq("id", user.id)
    .single();

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
      <h1 className="font-display text-2xl">Settings</h1>
      <SettingsForm
        unitPreference={profile?.unit_preference ?? "kg"}
        leaderboardOptIn={profile?.leaderboard_opt_in ?? false}
      />
    </main>
  );
}
