"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApiResult } from "@slswca/core/schemas";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { errCls, inputCls, labelCls } from "./form";
import { Button } from "./ui";

export function AccountActions() {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function signOut() {
    await supabaseBrowser()?.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  async function del() {
    setPending(true);
    setError("");
    const res = await fetch("/api/v1/me", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm }) });
    const json = (await res.json()) as ApiResult<unknown>;
    if (!json.ok) {
      setPending(false);
      return setError(json.error.message);
    }
    await supabaseBrowser()?.auth.signOut();
    router.replace("/?deleted=1");
    router.refresh();
  }

  return (
    <section aria-label="Account settings" className="flex flex-col gap-6 border-t border-line pt-12">
      <div className="flex flex-wrap gap-4">
        <Button variant="secondary" onClick={signOut}>Sign out</Button>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="cursor-pointer text-[13px] text-faint underline underline-offset-2 hover:text-danger">
          Delete my account
        </button>
      </div>
      {open && (
        <div className="flex max-w-xl flex-col gap-4 border border-danger/50 px-6 py-6">
          <p className="m-0 text-sm leading-relaxed text-muted">
            This permanently deletes your account and profile. Records of past contributions are kept for the association&apos;s accounts but
            unlinked from you. This can&apos;t be undone.
          </p>
          <label className={labelCls}>Type DELETE to confirm
            <input value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} autoComplete="off" />
          </label>
          {error && <p role="alert" className={errCls}>{error}</p>}
          <Button onClick={del} disabled={pending || confirm !== "DELETE"} className="self-start bg-danger text-text hover:bg-danger/80">
            {pending ? "Deleting…" : "Delete permanently"}
          </Button>
        </div>
      )}
    </section>
  );
}
