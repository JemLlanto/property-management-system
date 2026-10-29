import { ReactNode } from "react";
import NavBar from "./NavBar";
import { Metadata } from "next";
import { Sidebar } from "lucide-react";
import SideBar from "./SideBar";
import PageTitle from "./PageTitle";

interface Props {
  children: ReactNode;
}

// The page-specific title is set client-side by PageTitle, because every
// page in this segment is a client component and cannot export metadata.
export const metadata: Metadata = {
  title: "Home",
  description: "Property Management System",
};
const HomeLayout = ({ children }: Props) => {
  return (
    <div className="h-dvh w-dvw flex overflow-auto">
      <PageTitle />
      <header className="absolute top-0 left-0 w-full min-h-15 bg-(--background) shadow flex flex-col justify-between items-center z-50">
        <NavBar />
      </header>
      <aside>
        <SideBar />
      </aside>
      <main className="h-full w-full px-35 pt-20">{children}</main>
    </div>
  );
};

export default HomeLayout;
