import { ReactNode } from "react";
import type { Metadata } from "next";

interface Props {
  children: ReactNode;
}

export const metadata: Metadata = {
  title: "Sign In",
};

const AuthLayout = ({ children }: Props) => {
  return (
    <div className="h-dvh w-dvw bg-(--primary) flex justify-center items-center p-4">
      <div className="bg-(--background) w-full max-w-md rounded-2xl shadow-xl p-8">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
