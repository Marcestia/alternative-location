import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata;

export default function QuoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
