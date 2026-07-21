"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Pause, Play, Plus, RotateCcw } from "lucide-react";

const DEFAULT_SECONDS = 90;

export function RestTimer({ lastSetAt }: { lastSetAt: string | null }) {
  const [duration, setDuration] = useState(DEFAULT_SECONDS);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const seenSetAt = useRef<string | null>(null);

  // A newly logged set (server-confirmed) auto-starts the rest timer.
  useEffect(() => {
    if (lastSetAt && lastSetAt !== seenSetAt.current) {
      seenSetAt.current = lastSetAt;
      setRemaining(duration);
      setRunning(true);
    }
    // duration intentionally excluded: changing the preset shouldn't restart a run in progress
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSetAt]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const mm = Math.floor(Math.max(remaining, 0) / 60);
  const ss = Math.max(remaining, 0) % 60;

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
      <div>
        <p className="text-xs uppercase tracking-widest text-fg-muted">
          Rest Timer
        </p>
        <p
          className={`tabular font-display text-3xl ${
            running && remaining <= 5 ? "text-accent" : "text-fg"
          }`}
        >
          {mm}:{String(ss).padStart(2, "0")}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Decrease rest duration"
          onClick={() => setDuration((d) => Math.max(15, d - 15))}
          className="rounded-lg border border-border p-2 text-fg-muted hover:border-accent hover:text-fg"
        >
          <Minus size={16} />
        </button>
        <span className="tabular w-10 text-center text-sm text-fg-muted">
          {duration}s
        </span>
        <button
          type="button"
          aria-label="Increase rest duration"
          onClick={() => setDuration((d) => Math.min(300, d + 15))}
          className="rounded-lg border border-border p-2 text-fg-muted hover:border-accent hover:text-fg"
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          aria-label={running ? "Pause rest timer" : "Start rest timer"}
          onClick={() => {
            if (!running && remaining <= 0) setRemaining(duration);
            setRunning((r) => !r);
          }}
          className="rounded-lg border border-border p-2 text-fg-muted hover:border-accent hover:text-fg"
        >
          {running ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button
          type="button"
          aria-label="Reset rest timer"
          onClick={() => {
            setRunning(false);
            setRemaining(0);
          }}
          className="rounded-lg border border-border p-2 text-fg-muted hover:border-accent hover:text-fg"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
