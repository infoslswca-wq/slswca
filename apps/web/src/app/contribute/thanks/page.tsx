import type { Metadata } from "next";
import { PaymentStatus } from "@/components/PaymentStatus";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Thank you", robots: { index: false } };

export default async function ThanksPage({ searchParams }: PageProps<"/contribute/thanks">) {
  const { order } = await searchParams;
  return (
    <Container className="flex min-h-[60dvh] flex-col justify-center gap-6 py-24">
      <PaymentStatus order={typeof order === "string" ? order : ""} />
    </Container>
  );
}
