"use client";

import { useRef, useState } from "react";

export function PinInput({
  name,
  label,
  autoFocus,
}: {
  name: string;
  label: string;
  autoFocus?: boolean;
}) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function setDigit(i: number, raw: string) {
    const cleaned = raw.replace(/\D/g, "");

    // Handles paste/autofill of the full PIN landing in one box.
    if (cleaned.length > 1) {
      const next = [...digits];
      let idx = i;
      for (const ch of cleaned) {
        if (idx > 3) break;
        next[idx] = ch;
        idx++;
      }
      setDigits(next);
      inputs.current[Math.min(idx, 3)]?.focus();
      return;
    }

    const d = cleaned;
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 3) inputs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  }

  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-widest text-fg-muted">
        {label}
      </label>
      <div className="flex gap-3">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            type="password"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            autoFocus={autoFocus && i === 0}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="tabular h-14 w-14 rounded-lg border border-border bg-surface-2 text-center text-2xl text-fg focus:border-accent focus:outline-none"
          />
        ))}
      </div>
      <input type="hidden" name={name} value={digits.join("")} />
    </div>
  );
}
