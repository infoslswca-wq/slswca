"use client";

import { useState } from "react";
import { instagramUrl, type InstagramMedia } from "@slswca/core/schemas";

/**
 * Click-to-load Instagram embed. Nothing from Instagram (scripts, cookies,
 * trackers) loads until the visitor asks for it, which keeps pages fast on
 * mobile data and avoids needing a cookie banner.
 */
export function InstagramEmbed({ media, title }: { media: InstagramMedia; title: string }) {
  const [on, setOn] = useState(false);
  const label = media.kind === "reel" ? "reel" : "post";

  if (on)
    return (
      <iframe
        src={`https://www.instagram.com/${media.kind}/${media.id}/embed/`}
        title={`${title}: Instagram ${label}`}
        className="h-[640px] w-full border border-line bg-surface"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        allow="encrypted-media; picture-in-picture"
      />
    );

  return (
    <div className="flex h-[640px] w-full flex-col items-center justify-center gap-5 border border-line bg-surface bg-[repeating-linear-gradient(135deg,transparent_0_14px,rgba(245,241,232,0.03)_14px_15px)] p-6 text-center">
      <span aria-hidden className="grid size-16 place-items-center border border-gold text-2xl text-gold">▶</span>
      <p className="m-0 font-display text-xl uppercase">{title}</p>
      <button
        type="button"
        onClick={() => setOn(true)}
        className="min-h-11 cursor-pointer bg-gold px-6 py-3 text-sm font-bold tracking-[0.06em] text-bg uppercase transition-colors hover:bg-text"
      >
        Load Instagram {label}
      </button>
      <p className="m-0 max-w-[36ch] text-xs leading-relaxed text-faint">
        Loads content from Instagram, which may set cookies.{" "}
        <a href={instagramUrl(media)} target="_blank" rel="noopener noreferrer" className="underline decoration-gold underline-offset-2 hover:text-text">
          Open on Instagram
        </a>{" "}
        instead.
      </p>
    </div>
  );
}
