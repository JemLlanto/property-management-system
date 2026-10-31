"use client";
import { logout } from "@/services/auth.service";
import { LogOut } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import Link from "next/link";

const NavBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const userData = useAppSelector((state) => state.userData);

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
      <div className="w-full flex justify-between items-center px-5 py-2">
        <h5>BOILER PLATE</h5>
        <div className="flex gap-2">
          <div className="bg-(--primary) text-(--background) hidden md:flex justify-center items-center rounded-sm py-2 px-5">
            {!userData.isLoggedIn
              ? "Loading..."
              : userData.username
                ? userData.username
                : userData.email}
          </div>
          <button
            className="size-10 bg-red-600 hover:bg-red-700 text-(--background) flex justify-center items-center rounded-sm px-2 transition duration-200 cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="hidden md:block" size={17} strokeWidth={3} />
            <LogOut className="block md:hidden" size={17} strokeWidth={3} />
          </button>
        </div>
      </div>
    </>
  );
};

export default NavBar;
