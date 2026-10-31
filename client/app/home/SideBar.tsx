"use client";
import SideBarLinks from "./SideBarLinks";

const SideBar = () => {
  return (
    <>
      <nav className="h-full w-70 hidden md:block">
        <SideBarLinks />
      </nav>
    </>
  );
};

export default SideBar;
