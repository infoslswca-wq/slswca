"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { AcademyInterestInput, Pathway, type ApiResult } from "@slswca/core/schemas";
import { type Fields, errCls, inputCls, issuesToFields, labelCls } from "./form";
import { Button, cn } from "./ui";

const PATHS = Pathway.options;

export function AcademyInterestForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pathway, setPathway] = useState<string>("");
  const [errors, setErrors] = useState<Fields>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<{ name: string; pathway: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = { ...Object.fromEntries(fd), pathway, consent: fd.get("consent") === "on" };
    const parsed = AcademyInterestInput.safeParse(raw);
    if (!parsed.success) {
      setErrors(issuesToFields(parsed.error.issues));
      setFormError("");
      formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      return;
    }
    setErrors({});
    setFormError("");
    setPending(true);
    try {
      const res = await fetch("/api/v1/academy/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await res.json()) as ApiResult<{ id: string }>;
      if (!json.ok) {
        setErrors(json.error.fields ?? {});
        setFormError(json.error.message);
        return;
      }
      setDone({ name: parsed.data.name, pathway: parsed.data.pathway });
    } catch {
      setFormError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="flex min-w-0 flex-col items-start gap-3.5 border border-gold bg-surface px-6 py-12 nav:px-10">
        <p className="font-display text-[32px] text-gold uppercase">Received.</p>
        <p className="m-0 text-[15px] leading-[1.7] text-muted">
          Thanks {done.name} — your interest in the <strong className="text-text">{done.pathway}</strong> pathway has been recorded. The
          Academy will reach out via the contact details you provided.
        </p>
        <Button variant="secondary" onClick={() => { setDone(null); setPathway(""); }}>Submit another</Button>
      </div>
    );
  }

  const err = (k: string) =>
    errors[k] ? { "aria-invalid": true as const, "aria-describedby": `${k}-err` } : {};
  const msg = (k: string) =>
    errors[k] && <span id={`${k}-err`} className={errCls}>{errors[k]}</span>;

  return (
    <form
      ref={formRef}
      data-reveal
      noValidate
      onSubmit={onSubmit}
      aria-label="Academy interest form"
      className="relative flex min-w-0 flex-col gap-[18px] border border-line bg-surface px-5 py-8 nav:px-8 nav:py-9"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelCls}>Full name
          <input name="name" autoComplete="name" required maxLength={120} placeholder="Your name" className={inputCls} {...err("name")} />
          {msg("name")}
        </label>
        <label className={labelCls}>Club (if any)
          <input name="club" autoComplete="organization" maxLength={120} placeholder="e.g. Powertain Calisthenics" className={inputCls} />
        </label>
        <label className={labelCls}>Email
          <input name="email" type="email" autoComplete="email" inputMode="email" maxLength={254} placeholder="you@example.com" className={inputCls} {...err("email")} />
          {msg("email")}
        </label>
        <label className={labelCls}>Phone / WhatsApp
          <input name="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={24} placeholder="+94 ..." className={inputCls} {...err("phone")} />
          {msg("phone")}
        </label>
      </div>

      <fieldset className="flex flex-col gap-2" aria-describedby={errors.pathway ? "pathway-err" : undefined}>
        <legend className="mb-2 text-xs font-bold tracking-[0.1em] text-muted uppercase">Pathway</legend>
        <div role="radiogroup" className="grid gap-2.5 sm:grid-cols-3">
          {PATHS.map((p) => {
            const on = pathway === p;
            return (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => { setPathway(p); setErrors((e) => ({ ...e, pathway: undefined })); }}
                className={cn(
                  "min-h-11 cursor-pointer border px-2 py-[13px] text-xs font-bold tracking-[0.05em] uppercase transition-colors",
                  on ? "border-gold bg-gold text-bg" : "border-line bg-bg text-muted hover:border-line-strong hover:text-text",
                )}
              >
                {p}
              </button>
            );
          })}
        </div>
        {errors.pathway && <span id="pathway-err" className="text-xs font-semibold text-danger">Please pick a pathway.</span>}
      </fieldset>

      <label className={labelCls}>Experience &amp; goals
        <textarea name="message" rows={4} maxLength={2000} placeholder="Tell us about your training background and what you're aiming for…" className={cn(inputCls, "resize-y")} />
      </label>

      {/* Honeypot — hidden from people and assistive tech. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <label className="flex items-start gap-3 text-[13px] leading-relaxed text-muted">
        <input name="consent" type="checkbox" className="mt-1 size-4 accent-gold" {...err("consent")} />
        <span>
          I agree that SLSWCA may store these details and contact me about Academy programmes. See our{" "}
          <Link href="/privacy" className="text-text underline decoration-gold underline-offset-2">privacy notice</Link>.
          {errors.consent && <span id="consent-err" className="block text-xs font-semibold text-danger">{errors.consent}</span>}
        </span>
      </label>

      <p aria-live="polite" className={cn("m-0 text-[13px] font-semibold text-danger", !formError && "sr-only")}>{formError}</p>

      <Button type="submit" disabled={pending} className="self-start">{pending ? "Sending…" : "Submit interest"}</Button>
    </form>
  );
}
