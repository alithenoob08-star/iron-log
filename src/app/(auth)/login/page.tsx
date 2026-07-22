import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <>
      <h2 className="font-display mb-6 text-xl">Log In</h2>
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
