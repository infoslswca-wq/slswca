import Image from "next/image";
import Link from "next/link";
import { site } from "@slswca/core/content";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-6 px-6 py-8 nav:px-10">
        <Image src="/logo-light.png" alt="SLSWCA" width={94} height={22} sizes="94px" className="h-[22px] w-auto opacity-70" />
        <p className="text-[13px] text-muted">{site.fullName} · Official member of the WSWCF</p>
        <div className="flex items-center gap-5 text-[13px] text-faint">
          <Link href="/privacy" className="-my-3 inline-flex min-h-11 items-center hover:text-gold">Privacy</Link>
          <span>© {new Date().getFullYear()} SLSWCA</span>
        </div>
      </div>
    </footer>
  );
}
