export const inputCls =
  "min-h-11 border border-line bg-bg px-3.5 py-[13px] text-sm font-normal tracking-normal text-text placeholder:text-faint focus:border-gold focus:outline-none aria-invalid:border-danger";
export const labelCls = "flex flex-col gap-[7px] text-xs font-bold tracking-[0.1em] text-muted uppercase";
export const errCls = "text-xs font-semibold tracking-normal text-danger normal-case";

export type Fields = Partial<Record<string, string>>;

export function issuesToFields(issues: { path: PropertyKey[]; message: string }[]) {
  const f: Fields = {};
  for (const i of issues) f[String(i.path[0] ?? "form")] ??= i.message;
  return f;
}
