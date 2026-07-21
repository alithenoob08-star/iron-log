export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl text-accent">Iron Log</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Track it. Beat it next time.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
