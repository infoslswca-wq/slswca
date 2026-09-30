"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RegistrationInput, type ApiResult, type CheckoutSession, type RegistrationResult } from "@slswca/core/schemas";
import { type Fields, errCls, inputCls, issuesToFields, labelCls } from "./form";
import { Button, cn } from "./ui";

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

type Props = {
  slug: string;
  paid: boolean;
  feeLabel: string;
  categories: string[];
  clubs: { slug: string; name: string }[];
  initial: { fullName: string; phone: string; clubSlug: string };
  waiver: string[];
  cancelled: boolean;
};

export function RegistrationForm({ slug, paid, feeLabel, categories, clubs, initial, waiver, cancelled }: Props) {
  const router = useRouter();
  const [errors, setErrors] = useState<Fields>({});
  const [formError, setFormError] = useState(cancelled ? "Payment was cancelled — nothing was charged. Your spot is held for 30 minutes if you try again." : "");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = RegistrationInput.safeParse({
      fullName: fd.get("fullName"),
      phone: fd.get("phone"),
      category: fd.get("category") ?? "",
      clubSlug: fd.get("clubSlug"),
      emergencyName: fd.get("emergencyName"),
      emergencyPhone: fd.get("emergencyPhone"),
      waiver: fd.get("waiver") === "on",
      adultOrGuardian: fd.get("adultOrGuardian") === "on",
    });
    if (!parsed.success) {
      setErrors(issuesToFields(parsed.error.issues));
      return;
    }
    if (categories.length && !parsed.data.category) return setErrors({ category: "Pick a category." });
    setErrors({});
    setFormError("");
    setPending(true);
    try {
      const res = await fetch(`/api/v1/events/${encodeURIComponent(slug)}/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await res.json()) as ApiResult<RegistrationResult>;
      if (!json.ok) {
        setErrors(json.error.fields ?? {});
        setFormError(json.error.message);
        setPending(false);
        return;
      }
      if (json.data.status === "confirmed") router.push(`/account/tickets/${json.data.ticketCode}`);
      else redirectToCheckout(json.data.checkout);
    } catch {
      setFormError("Couldn't reach the server. Check your connection and try again.");
      setPending(false);
    }
  }

  const err = (k: string) => (errors[k] ? { "aria-invalid": true as const, "aria-describedby": `${k}-err` } : {});
  const m = (k: string) => errors[k] && <span id={`${k}-err`} className={errCls}>{errors[k]}</span>;

  return (
    <form noValidate onSubmit={onSubmit} aria-label="Event registration" className="flex min-w-0 flex-col gap-6 border border-line bg-surface px-5 py-8 nav:px-8">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-xs font-bold tracking-[0.1em] text-muted uppercase">Athlete</legend>
        <label className={labelCls}>Full name
          <input name="fullName" defaultValue={initial.fullName} autoComplete="name" maxLength={120} className={inputCls} {...err("fullName")} />
          {m("fullName")}
        </label>
        <label className={labelCls}>Phone / WhatsApp
          <input name="phone" type="tel" defaultValue={initial.phone} autoComplete="tel" maxLength={24} placeholder="+94 ..." className={inputCls} {...err("phone")} />
          {m("phone")}
        </label>
        {categories.length > 0 && (
          <label className={labelCls}>Category
            <select name="category" defaultValue="" className={cn(inputCls, "cursor-pointer")} {...err("category")}>
              <option value="" disabled>Choose…</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {m("category")}
          </label>
        )}
        <label className={labelCls}>Club
          <select name="clubSlug" defaultValue={initial.clubSlug} className={cn(inputCls, "cursor-pointer")}>
            <option value="">Independent / no club</option>
            {clubs.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </label>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-xs font-bold tracking-[0.1em] text-muted uppercase">Emergency contact</legend>
        <label className={labelCls}>Name
          <input name="emergencyName" maxLength={120} className={inputCls} {...err("emergencyName")} />
          {m("emergencyName")}
        </label>
        <label className={labelCls}>Phone
          <input name="emergencyPhone" type="tel" maxLength={24} placeholder="+94 ..." className={inputCls} {...err("emergencyPhone")} />
          {m("emergencyPhone")}
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-xs font-bold tracking-[0.1em] text-muted uppercase">Waiver</legend>
        <ul className="m-0 flex max-h-56 flex-col gap-2 overflow-y-auto border border-line bg-bg p-4 text-[13px] leading-relaxed text-muted" tabIndex={0} aria-label="Waiver terms">
          {waiver.map((w) => <li key={w} className="flex gap-2.5"><span aria-hidden className="text-gold">—</span><span>{w}</span></li>)}
        </ul>
        <label className="flex items-start gap-3 text-[13px] leading-relaxed text-muted">
          <input name="waiver" type="checkbox" className="mt-1 size-4 accent-gold" {...err("waiver")} />
          <span>I have read and accept the waiver.{m("waiver")}</span>
        </label>
        <label className="flex items-start gap-3 text-[13px] leading-relaxed text-muted">
          <input name="adultOrGuardian" type="checkbox" className="mt-1 size-4 accent-gold" {...err("adultOrGuardian")} />
          <span>I am 18 or older, or my parent/guardian has agreed to this registration and waiver.{m("adultOrGuardian")}</span>
        </label>
      </fieldset>

      <p aria-live="polite" className={cn("m-0 text-[13px] font-semibold text-danger", !formError && "sr-only")}>{formError}</p>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? (paid ? "Redirecting to PayHere…" : "Registering…") : paid ? `Continue to payment · ${feeLabel}` : "Confirm registration"}
        </Button>
        {paid && <p className="m-0 text-xs text-faint">Your spot is held for 30 minutes while you pay.</p>}
      </div>
    </form>
  );
}
