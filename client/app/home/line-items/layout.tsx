import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Line Items",
};

export default function LineItemsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
