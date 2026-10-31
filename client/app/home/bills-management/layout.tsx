import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bills Management",
};

export default function BillsManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
