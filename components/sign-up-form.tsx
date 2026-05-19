"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
  const next =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/quest/demo";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);
    setInfo(null);

    if (password.length < 6) {
      setError("Pick a password with at least 6 characters.");
      setIsLoading(false);
      return;
    }

    const { data, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${next}`,
      },
    });

    if (signUpErr) {
      setError(signUpErr.message);
      setIsLoading(false);
      return;
    }

    // If the project has email confirmation off, signUp returns a session and the
    // user is already logged in — go straight to the demo. Otherwise, attempt a
    // password sign-in; if that fails it means confirmation is required.
    if (data.session) {
      router.push(next);
      return;
    }

    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) {
      // Most common case: email confirmation is enabled in Supabase Auth.
      setInfo(
        "Account created. Check your inbox for a confirmation link — once you tap it, you'll be sent into the hunt.",
      );
      setIsLoading(false);
      return;
    }
    router.push(next);
  };

  return (
    <AuthShell
      tag="START YOUR HUNT"
      title="Make a player account"
      subtitle="Email and a password is all you need. Use your UNSW email for a ✓ verified badge."
    >
      <form onSubmit={handleSignUp} className="flex flex-col gap-4">
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
          placeholder="at least 6 characters"
          autoComplete="new-password"
          required
          value={password}
          onChange={setPassword}
        />

        {error ? <Notice tone="bad">{error}</Notice> : null}
        {info ? <Notice tone="good">{info}</Notice> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-[#ef5b3a] text-white px-4 py-3 font-semibold disabled:opacity-60 hover:opacity-90"
        >
          {isLoading ? "Creating account…" : "Create account & play →"}
        </button>

        <div className="text-sm text-[#6f6f7a] text-center mt-1">
          Already have an account?{" "}
          <Link
            href={`/auth/login?next=${encodeURIComponent(next)}`}
            className="underline underline-offset-4 text-[#1a1a22]"
          >
            Sign in
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

// ---------------------------------------------------------------------------
// Local shared bits (kept here so existing imports don't change)
// ---------------------------------------------------------------------------

export function AuthShell({
  tag,
  title,
  subtitle,
  children,
}: {
  tag: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="w-full max-w-md rounded-3xl border-2 p-7 sm:p-8 shadow-[6px_8px_0_rgba(26,26,34,0.06)]"
      style={{
        background: "#fbf7ec",
        borderColor: "#1a1a22",
        color: "#1a1a22",
      }}
    >
      <div className="flex flex-col gap-2 mb-5">
        <span
          className="self-start text-[10px] tracking-[0.18em] uppercase font-semibold text-[#ef5b3a]"
          style={{ fontFamily: "var(--font-mono, ui-monospace), monospace" }}
        >
          {tag}
        </span>
        <h1
          className="text-4xl leading-[1]"
          style={{ fontFamily: "'Caveat', 'Bradley Hand', cursive" }}
        >
          {title}
        </h1>
        {subtitle ? <p className="text-sm text-[#6f6f7a]">{subtitle}</p> : null}
      </div>
      {children}
      <div className="mt-6 text-xs text-[#6f6f7a] text-center">
        <Link href="/" className="underline underline-offset-4 hover:text-[#1a1a22]">
          ← back to home
        </Link>
      </div>
    </div>
  );
}

export function Field({
  id,
  label,
  type,
  placeholder,
  autoComplete,
  required,
  value,
  onChange,
  rightLink,
}: {
  id: string;
  label: string;
  type: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  rightLink?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-[10px] tracking-[0.18em] uppercase font-semibold text-[#6f6f7a]"
          style={{ fontFamily: "var(--font-mono, ui-monospace), monospace" }}
        >
          {label}
        </label>
        {rightLink}
      </div>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border-2 px-3.5 py-2.5 bg-white text-[#1a1a22] focus:outline-none focus:ring-2 focus:ring-[#ef5b3a] focus:border-[#ef5b3a]"
        style={{ borderColor: "#d8d1bf" }}
      />
    </div>
  );
}

export function Notice({ tone, children }: { tone: "bad" | "good"; children: React.ReactNode }) {
  const color = tone === "bad" ? "#c0392b" : "#2f9e6b";
  const bg = tone === "bad" ? "rgba(192,57,43,0.08)" : "rgba(47,158,107,0.08)";
  return (
    <div
      className="rounded-xl px-3 py-2 text-sm leading-relaxed"
      style={{ background: bg, color, border: `1px solid ${color}33` }}
    >
      {children}
    </div>
  );
}
