"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  emailForSlug,
  isValidDisplayName,
  isValidPin,
  passwordForPin,
  slugify,
} from "@/lib/auth/identity";

export type AuthFormState = { error: string | null };

export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const pin = String(formData.get("pin") ?? "");
  const confirmPin = String(formData.get("confirmPin") ?? "");

  if (!isValidDisplayName(displayName)) {
    return { error: "Name must be 2-30 characters." };
  }
  if (!isValidPin(pin)) {
    return { error: "PIN must be exactly 4 digits." };
  }
  if (pin !== confirmPin) {
    return { error: "PINs don't match." };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("profile_lookup")
    .select("id")
    .ilike("display_name", displayName)
    .maybeSingle();

  if (existing) {
    return { error: "That name is already taken. Try logging in instead." };
  }

  const baseSlug = slugify(displayName);
  let slug = baseSlug;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: slugTaken } = await supabase
      .from("profile_lookup")
      .select("id")
      .eq("username_slug", slug)
      .maybeSingle();
    if (!slugTaken) break;
    slug = `${baseSlug}${Math.floor(Math.random() * 10000)}`;
  }

  const { error: signUpError } = await supabase.auth.signUp({
    email: emailForSlug(slug),
    password: passwordForPin(slug, pin),
    options: { data: { display_name: displayName, username_slug: slug } },
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  redirect("/");
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const pin = String(formData.get("pin") ?? "");

  if (!isValidDisplayName(displayName) || !isValidPin(pin)) {
    return { error: "Invalid name or PIN." };
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profile_lookup")
    .select("username_slug")
    .ilike("display_name", displayName)
    .maybeSingle();

  // Always attempt sign-in (even with a made-up email) so a nonexistent
  // name and a wrong PIN return the exact same error.
  const slug = profile?.username_slug ?? "_unknown_";

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: emailForSlug(slug),
    password: passwordForPin(slug, pin),
  });

  if (signInError) {
    return { error: "Invalid name or PIN." };
  }

  redirect("/");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
