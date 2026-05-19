"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthShell, Field, Notice } from "./sign-up-form";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
  const next =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/quest/demo";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) {
      setError(signInErr.message);
      setIsLoading(false);
      return;
    }
    router.push(next);
  };

  return (
    <AuthShell
      tag="WELCOME BACK"
      title="Sign in to play"
      subtitle="Drop straight into your team — or pick a new hunt."
    >
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <Field
          id="email"
          label="Email"
          type="email"
          placeholder="you@unsw.edu.au"
          autoComplete="email"
          required
          value={email}
          onChange={setEmail}
        />
        <Field
          id="password"
          label="Password"
          type="password"
          placeholder="your password"
          autoComplete="current-password"
          required
          value={password}
          onChange={setPassword}
          rightLink={
            <Link
              href="/auth/forgot-password"
              className="text-[10px] tracking-[0.12em] uppercase text-[#6f6f7a] underline underline-offset-4 hover:text-[#1a1a22]"
            >
              Forgot?
            </Link>
          }
        />

        {error ? <Notice tone="bad">{error}</Notice> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-[#ef5b3a] text-white px-4 py-3 font-semibold disabled:opacity-60 hover:opacity-90"
        >
          {isLoading ? "Signing in…" : "Sign in & play →"}
        </button>

        <div className="text-sm text-[#6f6f7a] text-center mt-1">
          New here?{" "}
          <Link
            href={`/auth/sign-up?next=${encodeURIComponent(next)}`}
            className="underline underline-offset-4 text-[#1a1a22]"
          >
            Make an account
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
