import Link from "next/link";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  return (
    <>
      <h2 className="font-display mb-6 text-xl">Log In</h2>
      {params.debug && (
        <pre className="mb-4 overflow-x-auto rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
          {JSON.stringify(params, null, 2)}
        </pre>
      )}
      <LoginForm />
      <p className="mt-6 text-center text-sm text-fg-muted">
        New here?{" "}
        <Link href="/signup" className="text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
