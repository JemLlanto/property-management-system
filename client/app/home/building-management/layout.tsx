import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Building Management",
};

export default function BuildingManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
