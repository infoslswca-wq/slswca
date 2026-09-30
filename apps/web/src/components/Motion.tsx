"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Port of the design's motion.js: scroll reveal, count-up, hero parallax.
 * Hidden-state CSS lives in globals.css (only applies when scripting is on
 * and the user hasn't asked for reduced motion).
 */
export function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reveals = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];

    if (reduce) {
      reveals.forEach((el) => el.classList.add("is-revealed"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-revealed");
          io.unobserve(e.target);
        }),
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" },
    );
    reveals.forEach((el) => {
      const sibs = el.parentElement ? [...el.parentElement.children].filter((c) => c.hasAttribute("data-reveal")) : [el];
      el.style.setProperty("--reveal-i", String(Math.max(0, sibs.indexOf(el))));
      io.observe(el);
    });

    const counters: IntersectionObserver[] = [];
    document.querySelectorAll<HTMLElement>("[data-countup]").forEach((el) => {
      const target = parseInt(el.dataset.countup ?? "", 10);
      if (Number.isNaN(target)) return;
      const o = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return;
          o.disconnect();
          const t0 = performance.now();
          const step = (t: number) => {
            const p = Math.min(1, (t - t0) / 1400);
            el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        },
        { threshold: 0.5 },
      );
      o.observe(el);
      counters.push(o);
    });

    const pl = [...document.querySelectorAll<HTMLElement>("[data-parallax]")];
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() =>
        pl.forEach((el) => {
          const f = parseFloat(el.dataset.parallax ?? "") || 0.05;
          const r = el.getBoundingClientRect();
          el.style.transform = `translateY(${((r.top + r.height / 2 - innerHeight / 2) * -f).toFixed(1)}px)`;
        }),
      );
    };
    if (pl.length) {
      addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    return () => {
      io.disconnect();
      counters.forEach((o) => o.disconnect());
      removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  return null;
}
