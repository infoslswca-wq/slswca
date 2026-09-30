"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProfileUpdate, type ApiResult } from "@slswca/core/schemas";
import { type Fields, errCls, inputCls, issuesToFields, labelCls } from "./form";
import { Button, cn } from "./ui";

export function ProfileForm({ initial, clubs }: { initial: ProfileUpdate; clubs: { slug: string; name: string }[] }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Fields>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = ProfileUpdate.safeParse(Object.fromEntries(fd));
    if (!parsed.success) return setErrors(issuesToFields(parsed.error.issues));
    setErrors({});
    setPending(true);
    try {
      const res = await fetch("/api/v1/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const json = (await res.json()) as ApiResult<unknown>;
      if (!json.ok) {
        setErrors(json.error.fields ?? {});
        setMsg({ ok: false, text: json.error.message });
      } else {
        setMsg({ ok: true, text: "Saved." });
        router.refresh();
      }
    } catch {
      setMsg({ ok: false, text: "Couldn't reach the server." });
    } finally {
      setPending(false);
    }
  }

  const err = (k: string) => (errors[k] ? { "aria-invalid": true as const, "aria-describedby": `${k}-err` } : {});
  const m = (k: string) => errors[k] && <span id={`${k}-err`} className={errCls}>{errors[k]}</span>;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5 border border-line bg-surface px-5 py-7 nav:px-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelCls}>Full name
          <input name="fullName" defaultValue={initial.fullName} autoComplete="name" maxLength={120} className={inputCls} {...err("fullName")} />
          {m("fullName")}
        </label>
        <label className={labelCls}>Phone / WhatsApp
          <input name="phone" type="tel" defaultValue={initial.phone} autoComplete="tel" maxLength={24} placeholder="+94 ..." className={inputCls} {...err("phone")} />
          {m("phone")}
        </label>
        <label className={cn(labelCls, "sm:col-span-2")}>Club
          <select name="clubSlug" defaultValue={initial.clubSlug} className={cn(inputCls, "cursor-pointer")} {...err("clubSlug")}>
            <option value="">Independent / no club</option>
            {clubs.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          {m("clubSlug")}
        </label>
      </div>
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save profile"}</Button>
        <p aria-live="polite" className={cn("m-0 text-[13px] font-semibold", msg?.ok ? "text-gold" : "text-danger")}>{msg?.text}</p>
      </div>
    </form>
  );
}
