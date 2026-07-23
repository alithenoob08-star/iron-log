"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Pause, Play, Plus, RotateCcw } from "lucide-react";

const DEFAULT_SECONDS = 180;

type TimerState = {
  duration: number;
  // Epoch ms the timer ends at, if currently running. Storing an absolute
  // deadline (not a tick count) means the countdown is correct even after
  // the tab is backgrounded/suspended for a while and JS timers are
  // throttled or paused entirely — on return we just recompute from the
  // real clock instead of resuming a stale interval.
  endAt: number | null;
  pausedRemaining: number;
  remaining: number;
};

function storageKey(sessionId: string) {
  return `iron-log:rest-timer:${sessionId}`;
}

function computeRemaining(endAt: number | null, pausedRemaining: number) {
  if (endAt === null) return pausedRemaining;
  return Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
}

function loadState(sessionId: string): TimerState {
  let duration = DEFAULT_SECONDS;
  let endAt: number | null = null;
  let pausedRemaining = 0;
  try {
    const raw = localStorage.getItem(storageKey(sessionId));
    if (raw) {
      const parsed = JSON.parse(raw);
      duration = parsed.duration ?? duration;
      endAt = parsed.endAt ?? null;
      pausedRemaining = parsed.pausedRemaining ?? 0;
    }
  } catch {
    // ignore corrupt/unavailable storage, fall back to defaults
  }
  return { duration, endAt, pausedRemaining, remaining: computeRemaining(endAt, pausedRemaining) };
}

function persist(sessionId: string, state: TimerState) {
  try {
    localStorage.setItem(
      storageKey(sessionId),
      JSON.stringify({
        duration: state.duration,
        endAt: state.endAt,
        pausedRemaining: state.pausedRemaining,
      })
    );
  } catch {
    // Storage unavailable (private browsing, etc.) — timer still works
    // in-memory for the current page load, just won't survive a reload.
  }
}

const INITIAL_STATE: TimerState = {
  duration: DEFAULT_SECONDS,
  endAt: null,
  pausedRemaining: 0,
  remaining: 0,
};

export function RestTimer({
  sessionId,
  lastSetAt,
}: {
  sessionId: string;
  lastSetAt: string | null;
}) {
  const [state, setState] = useState<TimerState>(INITIAL_STATE);
  const seenSetAt = useRef<string | null>(null);
  const hydrated = useRef(false);

  // Restore whatever was running (or paused) before the page was reloaded
  // or the app was backgrounded and evicted. This must run in an effect,
  // not a lazy useState initializer: localStorage isn't available during
  // server rendering, so the server/first-client-render both use
  // INITIAL_STATE (avoiding a hydration mismatch), then this effect
  // corrects it from storage once running client-side only.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loadState(sessionId));
    hydrated.current = true;
  }, [sessionId]);

  // A newly logged set (server-confirmed) auto-starts the rest timer.
  useEffect(() => {
    if (!hydrated.current) return;
    if (lastSetAt && lastSetAt !== seenSetAt.current) {
      seenSetAt.current = lastSetAt;
      setState((prev) => {
        const next: TimerState = {
          ...prev,
          endAt: Date.now() + prev.duration * 1000,
          pausedRemaining: 0,
          remaining: prev.duration,
        };
        persist(sessionId, next);
        return next;
      });
    }
  }, [lastSetAt, sessionId]);

  const { duration, endAt, remaining } = state;
  const running = endAt !== null;

  // Recompute from the real clock every second, and immediately whenever
  // the tab regains visibility (covers the case where background timers
  // were throttled or fully paused while the app was hidden).
  useEffect(() => {
    if (!running) return;

    const tick = () => {
      setState((prev) => {
        const left = computeRemaining(prev.endAt, prev.pausedRemaining);
        const next: TimerState =
          left <= 0
            ? { ...prev, endAt: null, pausedRemaining: 0, remaining: 0 }
            : { ...prev, remaining: left };
        if (left <= 0) persist(sessionId, next);
        return next;
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [running, sessionId]);

  const mm = Math.floor(Math.max(remaining, 0) / 60);
  const ss = Math.max(remaining, 0) % 60;

  function adjustDuration(next: number) {
    setState((prev) => {
      const updated = { ...prev, duration: next };
      persist(sessionId, updated);
      return updated;
    });
  }

  function toggleRunning() {
    setState((prev) => {
      let next: TimerState;
      if (prev.endAt !== null) {
        // Pause: freeze whatever time is left.
        const left = computeRemaining(prev.endAt, prev.pausedRemaining);
        next = { ...prev, endAt: null, pausedRemaining: left };
      } else {
        const startFrom = prev.remaining > 0 ? prev.remaining : prev.duration;
        next = { ...prev, endAt: Date.now() + startFrom * 1000, pausedRemaining: 0 };
      }
      persist(sessionId, next);
      return next;
    });
  }

  function reset() {
    setState((prev) => {
      const next = { ...prev, endAt: null, pausedRemaining: 0, remaining: 0 };
      persist(sessionId, next);
      return next;
    });
  }

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
          onClick={() => adjustDuration(Math.max(15, duration - 15))}
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
          onClick={() => adjustDuration(Math.min(300, duration + 15))}
          className="rounded-lg border border-border p-2 text-fg-muted hover:border-accent hover:text-fg"
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          aria-label={running ? "Pause rest timer" : "Start rest timer"}
          onClick={toggleRunning}
          className="rounded-lg border border-border p-2 text-fg-muted hover:border-accent hover:text-fg"
        >
          {running ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button
          type="button"
          aria-label="Reset rest timer"
          onClick={reset}
          className="rounded-lg border border-border p-2 text-fg-muted hover:border-accent hover:text-fg"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
