const EMAIL_DOMAIN = "gym.local";

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics left by NFKD
    .replace(/[^a-z0-9]/g, "");
  return base || "user";
}

export function emailForSlug(slug: string): string {
  return `${slug}@${EMAIL_DOMAIN}`;
}

// Supabase Auth requires a 6+ character password; a 4-digit PIN doesn't
// meet that on its own. Padding with the (public) slug satisfies the length
// requirement deterministically without a dashboard setting to remember —
// it adds no real secrecy, the PIN's 10,000 combinations are still the
// entire brute-force space, same as if the slug weren't there.
export function passwordForPin(slug: string, pin: string): string {
  return `${pin}.${slug}`;
}

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

export function isValidDisplayName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 30;
}
