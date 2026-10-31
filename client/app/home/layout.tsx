import { ReactNode } from "react";
import NavBar from "./NavBar";
import { Metadata } from "next";
import { Sidebar } from "lucide-react";
import SideBar from "./SideBar";
import SideBarMobile from "./SideBarMobile";

interface Props {
  children: ReactNode;
}

// `default` titles the /home page itself; `template` is inherited by the
// sub-routes (user-management, building-management, ...). Declaring a plain
// string title here would wipe the template for those descendants.
export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | Property Management System",
  },
  description: "Property Management System",
};
const HomeLayout = ({ children }: Props) => {
  return (
    <div className="relative h-dvh w-dvw flex overflow-auto">
      <header className="absolute top-0 left-0 w-full min-h-15 bg-(--background) shadow flex flex-col justify-between items-center z-50">
        <NavBar />
      </header>
      <aside>
        <SideBarMobile />
        <SideBar />
      </aside>
      <main className="h-full w-full px-5 md:px-10 lg:px-35 pt-20 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default HomeLayout;
