"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OtpCode, OtpEmail } from "@slswca/core/schemas";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { errCls, inputCls, labelCls } from "./form";
import { Button, cn } from "./ui";

export function LoginForm({ next, google, linkError }: { next: string; google: boolean; linkError: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState(linkError ? "That sign-in link has expired. Request a new code." : "");
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(false); // resend allowed again after 60s
  useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown(false), 60_000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sb = supabaseBrowser();

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    const p = OtpEmail.safeParse({ email });
    if (!p.success) return setError(p.error.issues[0].message);
    if (!sb) return;
    setPending(true);
    setError("");
    const { error } = await sb.auth.signInWithOtp({ email: p.data.email, options: { shouldCreateUser: true } });
    setPending(false);
    if (error) {
      // Don't reveal whether an account exists; surface rate limits plainly.
      setError(error.status === 429 ? "Too many requests. Wait a minute, then try again." : "Couldn't send the code. Try again shortly.");
      return;
    }
    setEmail(p.data.email);
    setCooldown(true);
    setStep("code");
  }

  async function verify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = OtpCode.safeParse(new FormData(e.currentTarget).get("code"));
    if (!code.success) return setError(code.error.issues[0].message);
    if (!sb) return;
    setPending(true);
    setError("");
    const { error } = await sb.auth.verifyOtp({ email, token: code.data, type: "email" });
    if (error) {
      setPending(false);
      setError("That code is wrong or has expired.");
      return;
    }
    router.replace(next);
    router.refresh();
  }

  async function withGoogle() {
    if (!sb) return;
    setPending(true);
    const redirectTo = `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) {
      setPending(false);
      setError("Google sign-in is unavailable right now.");
    }
  }

  const box = "flex min-w-0 flex-col gap-5 border border-line bg-surface px-6 py-8 nav:px-8 nav:py-10";

  if (step === "code")
    return (
      <form onSubmit={verify} noValidate className={box} aria-label="Enter sign-in code">
        <p className="m-0 text-sm leading-relaxed text-muted">
          We sent a 6-digit code to <strong className="text-text">{email}</strong>. It expires in 1 hour.
        </p>
        <label className={labelCls}>Code
          <input
            name="code"
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            placeholder="123456"
            className={cn(inputCls, "font-display text-2xl tracking-[0.4em]")}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "login-err" : undefined}
          />
        </label>
        {error && <p id="login-err" role="alert" className={errCls}>{error}</p>}
        <Button type="submit" disabled={pending} className="self-start">{pending ? "Checking…" : "Sign in"}</Button>
        <div className="flex flex-wrap gap-5 text-[13px] text-muted">
          <button type="button" className="cursor-pointer underline decoration-gold underline-offset-2 hover:text-text" onClick={() => { setStep("email"); setError(""); }}>
            Use a different email
          </button>
          <button
            type="button"
            disabled={pending || cooldown}
            className="cursor-pointer underline decoration-gold underline-offset-2 hover:text-text disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
            onClick={() => sendCode()}
          >
            {cooldown ? "Resend code (wait 60s)" : "Resend code"}
          </button>
        </div>
      </form>
    );

  return (
    <form onSubmit={sendCode} noValidate className={box} aria-label="Sign in">
      <label className={labelCls}>Email
        <input
          type="email"
          autoComplete="email"
          inputMode="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputCls}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "login-err" : undefined}
        />
      </label>
      {error && <p id="login-err" role="alert" className={errCls}>{error}</p>}
      <Button type="submit" disabled={pending} className="self-start">{pending ? "Sending…" : "Email me a code"}</Button>
      {google && (
        <>
          <div className="flex items-center gap-3 text-xs font-bold tracking-[0.14em] text-faint uppercase">
            <span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" />
          </div>
          <Button type="button" variant="secondary" onClick={withGoogle} disabled={pending}>Continue with Google</Button>
        </>
      )}
      <p className="m-0 text-xs leading-relaxed text-faint">
        By signing in you agree to our <a href="/privacy" className="underline decoration-gold underline-offset-2">privacy notice</a>.
      </p>
    </form>
  );
}
