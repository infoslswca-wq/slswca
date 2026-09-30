import Image from "next/image";
import { cn } from "./ui";

/**
 * Photo slot. Until real photography arrives, renders a branded placeholder
 * (decorative, hidden from assistive tech) instead of a broken image.
 */
export function ImageSlot({
  src,
  alt = "",
  label,
  className,
  fit = "cover",
  sizes = "(min-width: 900px) 50vw, 100vw",
  priority,
  parallax,
}: {
  src?: string;
  alt?: string;
  label: string;
  className?: string;
  fit?: "cover" | "contain";
  sizes?: string;
  priority?: boolean;
  parallax?: number;
}) {
  const dataParallax = parallax ? { "data-parallax": String(parallax) } : {};
  if (src) {
    return (
      <div className={cn("relative min-w-0 overflow-hidden", className)} {...dataParallax}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={fit === "contain" ? "object-contain" : "object-cover"} />
      </div>
    );
  }
  return (
    <div
      aria-hidden
      {...dataParallax}
      className={cn(
        "relative flex min-w-0 items-start overflow-hidden border border-line bg-surface p-4",
        "bg-[repeating-linear-gradient(135deg,transparent_0_14px,rgba(245,241,232,0.03)_14px_15px)]",
        className,
      )}
    >
      <span className="text-[11px] font-semibold tracking-[0.1em] text-faint uppercase">{label}</span>
    </div>
  );
}
