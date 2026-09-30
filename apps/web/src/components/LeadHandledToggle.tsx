"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "./ui";

export function LeadHandledToggle({ id, handled }: { id: string; handled: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(handled);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  async function toggle() {
    const next = !value;
    setValue(next); // optimistic
    setError(false);
    const res = await fetch(`/api/v1/admin/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handled: next }),
    }).catch(() => null);
    if (!res?.ok) {
      setValue(!next);
      setError(true);
      return;
    }
    start(() => router.refresh());
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={value}
        className={cn(
          "min-h-9 cursor-pointer border px-3 py-1.5 text-xs font-bold tracking-[0.05em] whitespace-nowrap uppercase transition-colors disabled:opacity-60",
          value ? "border-line text-muted hover:text-text" : "border-gold text-gold hover:bg-gold hover:text-bg",
        )}
      >
        {value ? "Handled ✓" : "Mark handled"}
      </button>
      {error && <span role="alert" className="text-[11px] font-semibold text-danger">Couldn&apos;t save</span>}
    </div>
  );
}
