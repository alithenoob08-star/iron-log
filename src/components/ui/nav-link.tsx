"use client";

import Link, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";

/**
 * A next/link wrapper that overlays a small spinner while the navigation it
 * triggered is pending, so a click never feels unacknowledged. The spinner
 * is rendered as an absolutely-positioned sibling of `children` (not a
 * wrapper around them) so it never disturbs flex/justify-between layouts
 * already present on the Link itself — position:absolute elements are
 * excluded from flex layout regardless of DOM order. prefetch=false is
 * required for useLinkStatus to reliably report a pending phase.
 */
export function NavLink({
  className,
  children,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link {...props} prefetch={false} className={`relative ${className ?? ""}`}>
      {children}
      <PendingIndicator />
    </Link>
  );
}

function PendingIndicator() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      role="status"
      aria-label="Loading"
      className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70"
    />
  );
}
