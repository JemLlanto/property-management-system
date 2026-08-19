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
  const isLoading = useAppSelector((state) => state.loading.isLoading);

  const navLinks = [
    { name: "Home", href: "/home" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "Settings", href: "/settings" },
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
          <div className="bg-(--primary) text-(--background) flex justify-center items-center rounded-sm py-2 px-5">
            {isLoading
              ? "Loading..."
              : userData.username
                ? userData.username
                : userData.email}
          </div>
          <button
            className="size-10 bg-red-600 hover:bg-red-700 text-(--background) flex justify-center items-center rounded-sm px-2 transition duration-200 cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut size={17} strokeWidth={3} />
          </button>
        </div>
      </div>
      <nav className="w-full ">
        <ul className="bg-(--foreground)/90 text-(--background) flex justify-center items-center gap-10 p-3">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`pb-1 transition-all ${
                  pathname === link.href
                    ? "border-b-2 border-(--background)"
                    : "hover:border-b-2 hover:border-(--background)/50"
                }`}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};

export default NavBar;
