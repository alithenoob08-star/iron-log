export default function OfflinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="font-display text-3xl text-accent">You&apos;re Offline</h1>
      <p className="text-sm text-fg-muted">
        Reconnect to keep logging your workout. Anything you&apos;ve already
        saved is safe.
      </p>
    </main>
  );
}
