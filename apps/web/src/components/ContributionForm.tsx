"use client";

import Link from "next/link";
import { useState } from "react";
import { funds } from "@slswca/core/content";
import { CONTRIBUTION_PRESETS_LKR, ContributionInput, type ApiResult, type CheckoutSession } from "@slswca/core/schemas";
import { type Fields, errCls, inputCls, issuesToFields, labelCls } from "./form";
import { Button, cn } from "./ui";

const lkr = new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 });

function Choice({ on, onClick, children, className }: { on: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "min-h-11 cursor-pointer border px-3 py-3 text-xs font-bold tracking-[0.05em] transition-colors",
        !className?.includes("text-left") && "uppercase",
        on ? "border-gold bg-gold text-bg" : "border-line bg-bg text-muted hover:border-line-strong hover:text-text",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Build and submit a real form so the browser navigates to PayHere. */
function redirectToCheckout(s: CheckoutSession) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = s.action;
  for (const [k, v] of Object.entries(s.fields)) {
    const i = document.createElement("input");
    i.type = "hidden";
    i.name = k;
    i.value = v;
    form.appendChild(i);
  }
  document.body.appendChild(form);
  form.submit();
}

export function ContributionForm({ cancelled = false }: { cancelled?: boolean }) {
  const [recurring, setRecurring] = useState(false);
  const [preset, setPreset] = useState<number | "custom">(2500);
  const [custom, setCustom] = useState("");
  const [fund, setFund] = useState<string>("general");
  const [errors, setErrors] = useState<Fields>({});
  const [formError, setFormError] = useState(cancelled ? "Payment was cancelled — nothing was charged. You can try again." : "");
  const [pending, setPending] = useState(false);

  const amount = preset === "custom" ? Number(custom.replace(/[^\d]/g, "")) || 0 : preset;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = ContributionInput.safeParse({
      amount,
      recurring,
      fund,
      firstName: fd.get("firstName"),
      lastName: fd.get("lastName"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      anonymous: fd.get("anonymous") === "on",
      consent: fd.get("consent") === "on",
    });
    if (!parsed.success) {
      setErrors(issuesToFields(parsed.error.issues));
      setFormError("");
      return;
    }
    setErrors({});
    setFormError("");
    setPending(true);
    try {
      const res = await fetch("/api/v1/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await res.json()) as ApiResult<CheckoutSession>;
      if (!json.ok) {
        setErrors(json.error.fields ?? {});
        setFormError(json.error.message);
        setPending(false);
        return;
      }
      redirectToCheckout(json.data); // leaves the page; keep "pending" state
    } catch {
      setFormError("Couldn't reach the server. Check your connection and try again.");
      setPending(false);
    }
  }

  const err = (k: string) => (errors[k] ? { "aria-invalid": true as const, "aria-describedby": `${k}-err` } : {});
  const msg = (k: string) => errors[k] && <span id={`${k}-err`} className={errCls}>{errors[k]}</span>;

  return (
    <form noValidate onSubmit={onSubmit} aria-label="Contribution form" className="flex min-w-0 flex-col gap-6 border border-line bg-surface px-5 py-8 nav:px-8 nav:py-9">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-xs font-bold tracking-[0.1em] text-muted uppercase">Frequency</legend>
        <div role="radiogroup" className="grid grid-cols-2 gap-2.5">
          <Choice on={!recurring} onClick={() => setRecurring(false)}>One-off</Choice>
          <Choice on={recurring} onClick={() => setRecurring(true)}>Monthly</Choice>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-xs font-bold tracking-[0.1em] text-muted uppercase">Amount (LKR)</legend>
        <div role="radiogroup" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {CONTRIBUTION_PRESETS_LKR.map((a) => (
            <Choice key={a} on={preset === a} onClick={() => setPreset(a)}>{lkr.format(a)}</Choice>
          ))}
          <Choice on={preset === "custom"} onClick={() => setPreset("custom")}>Custom</Choice>
        </div>
        {preset === "custom" && (
          <label className={cn(labelCls, "mt-2")}>Custom amount
            <input
              autoFocus
              inputMode="numeric"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="e.g. 10,000"
              className={inputCls}
              {...err("amount")}
            />
          </label>
        )}
        {msg("amount")}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-xs font-bold tracking-[0.1em] text-muted uppercase">What to fund</legend>
        <div role="radiogroup" className="grid gap-2.5 sm:grid-cols-2">
          {funds.map((f) => (
            <Choice key={f.key} on={fund === f.key} onClick={() => setFund(f.key)} className="text-left tracking-normal">
              <span className="block text-xs font-bold tracking-[0.05em] uppercase">{f.label}</span>
              <span className={cn("mt-1 block text-xs font-normal", fund === f.key ? "text-bg/80" : "text-faint")}>{f.body}</span>
            </Choice>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelCls}>First name
          <input name="firstName" autoComplete="given-name" maxLength={60} className={inputCls} {...err("firstName")} />
          {msg("firstName")}
        </label>
        <label className={labelCls}>Last name
          <input name="lastName" autoComplete="family-name" maxLength={60} className={inputCls} {...err("lastName")} />
          {msg("lastName")}
        </label>
        <label className={labelCls}>Email (for your receipt)
          <input name="email" type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" className={inputCls} {...err("email")} />
          {msg("email")}
        </label>
        <label className={labelCls}>Phone
          <input name="phone" type="tel" autoComplete="tel" maxLength={24} placeholder="+94 ..." className={inputCls} {...err("phone")} />
          {msg("phone")}
        </label>
      </div>

      <div className="flex flex-col gap-3 text-[13px] leading-relaxed text-muted">
        <label className="flex items-start gap-3">
          <input name="anonymous" type="checkbox" className="mt-1 size-4 accent-gold" />
          <span>Keep my contribution anonymous in any public thank-you.</span>
        </label>
        <label className="flex items-start gap-3">
          <input name="consent" type="checkbox" className="mt-1 size-4 accent-gold" {...err("consent")} />
          <span>
            I agree SLSWCA may store these details to process my contribution and send a receipt. See our{" "}
            <Link href="/privacy" className="text-text underline decoration-gold underline-offset-2">privacy notice</Link>.
            {msg("consent")}
          </span>
        </label>
      </div>

      <p aria-live="polite" className={cn("m-0 text-[13px] font-semibold text-danger", !formError && "sr-only")}>{formError}</p>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Redirecting to PayHere…" : `Contribute LKR ${lkr.format(amount || 0)}${recurring ? " / month" : ""}`}
        </Button>
        <p className="text-xs text-faint">Secure payment by PayHere. Card details never touch our servers.</p>
      </div>
    </form>
  );
}
