"use client";
import { logout } from "@/services/auth.service";
import { LogOut, Menu } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { RootState } from "@/store";
import { toggleSideBarVisible } from "@/store/sidebarMobileToggleSlice";

const NavBar = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const userData = useAppSelector((state) => state.userData);
  const sideBarVisible = useAppSelector(
    (state: RootState) => state.sideBar.sideBarVisible,
  );

  const navLinks = [
    { name: "Dashboard", href: "/home" },
    { name: "Settings", href: "/home/settings" },
  ];

  const handleLogout = async () => {
    try {
      const response = await logout();

      if (response.success) {
        router.push("/");
      }
    } catch (err) {
      console.error("Unexpected error occured.");
    }
  };
  return (
    <>
      <div className="w-full flex justify-between items-center px-2 md:px-5 py-2 md:py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={sideBarVisible ? "Hide menu" : "Show menu"}
            className={`size-9 md:size-10 ${sideBarVisible ? "bg-(--primary_hover) text-(--background)" : "text-(--primary_hover)"} flex md:hidden justify-center items-center rounded-sm px-2 transition duration-200 cursor-pointer`}
            onClick={() => dispatch(toggleSideBarVisible())}
          >
            <Menu size={17} strokeWidth={3} />
          </button>
          <h5>BOILER PLATE</h5>
        </div>

        <div className="flex gap-2">
          <div className="bg-(--primary) text-(--background) hidden md:flex justify-center items-center rounded-sm py-2 px-5">
            {!userData.isLoggedIn
              ? "Loading..."
              : userData.username
                ? userData.username
                : userData.email}
          </div>
          <button
            className="size-9 md:size-10 bg-red-600 hover:bg-red-700 text-(--background) flex justify-center items-center rounded-sm px-2 transition duration-200 cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="hidden md:block" size={17} strokeWidth={3} />
            <LogOut className="block md:hidden" size={15} strokeWidth={3} />
          </button>
        </div>
      </div>
    </>
  );
};

export default NavBar;
