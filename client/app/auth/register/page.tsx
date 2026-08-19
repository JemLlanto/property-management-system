"use client";
import RegisterForm from "@/app/auth/RegisterForm";
import { checkUser } from "@/utils/auth.helper";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const LoginPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const validateUser = async () => {
      const response = await checkUser();
      if (response.success) {
        router.push(`/home`);
      }
    };

    validateUser();
  }, []);

  return <RegisterForm />;
};

export default LoginPage;
