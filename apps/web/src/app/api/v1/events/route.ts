import { battles, workshops } from "@slswca/core/content";
import { ok } from "@/lib/http";

export const dynamic = "force-static";
export const revalidate = 3600;
export function GET() {
  return ok({ competitions: battles, workshops });
}
