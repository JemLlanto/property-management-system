"use client";
import LoginForm from "@/app/auth/LoginForm";
import { checkUser } from "@/utils/auth.helper";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const LoginPage = () => {
  const router = useRouter();

  useEffect(() => {
    const validateUser = async () => {
      const response = await checkUser();
      if (response.success) {
        router.push(`/home`);
      }
    };

    validateUser();
  }, []);

  return <LoginForm />;
};

export default LoginPage;
