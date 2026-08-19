"use client";

import { AuthProps, register } from "@/services/auth.service";
import { useState } from "react";
import {
  handleChange,
  passwordChecks,
  validateEmail,
} from "@/utils/auth.helper";
import { useRouter } from "next/navigation";
import { Eye, EyeClosed } from "lucide-react";
import Swal from "sweetalert2";
import { RootState } from "@/store";
import { togglePasswordVisible } from "@/store/passwordToggleSlice";
import { setUser } from "@/store/userDataSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const RegisterForm = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const passwordVisible = useAppSelector(
    (state: RootState) => state.password.passwordVisible,
  );

  const [formData, setFormData] = useState<AuthProps>({
    username: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const isValid = formData.username && formData.email && formData.password;
  const getPasswordChecks = passwordChecks(formData.password);
  const isPasswordValid = Object.values(getPasswordChecks).every(Boolean);
  const [formError, setFormError] = useState<string>("");

  const handleRegister = async () => {
    if (!isValid) return;
    setLoading(true);

    try {
      const data = await register(formData);

      if (data.success) {
        // console.log("Logged in!", data.message); // "Logged in successfully."
        dispatch(setUser(data.user));
        Swal.fire({
          icon: "success",
          title: "Account Creation Successful",
          text: data.message,
        }).then(() => {
          router.push(`/home`);
        });
      }
    } catch (error) {
      console.error("Register failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-4">
        <h4 className="text-3xl font-bold">Create an Account</h4>
        <p className="text-gray-500 mt-1">Sign up to get started.</p>
      </div>

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleRegister();
        }}
      >
        {/* Use if you want to add email verification */}
        {/* <OTPVerificationModal
          modalShow={modalShow}
          handleOTPModal={handleOTPModal}
          handleRegister={handleRegister}
          loading={loading}
        /> */}
        {formError && (
          <div className="flex">
            <span className="w-10/10 text-sm bg-red-500/30 rounded p-2">
              {formError}
            </span>
          </div>
        )}
        {/* Username input */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-2">
            Username
          </label>
          <input
            id="username"
            type="text"
            placeholder="What would you like us to call you?"
            autoComplete="new-username"
            value={formData.username}
            onChange={(e) =>
              handleChange("username", e.target.value, setFormData)
            }
            className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
        </div>
        {/* Email Address Input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            autoComplete="new-email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value, setFormData)}
            onBlur={(e) => validateEmail(e.target.value, setFormError)}
            className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
        </div>
        {/* Pssword Input */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <div className="relative">
            {/* PASSWORD VISIBILITY TOGGLER */}
            <label
              htmlFor="password"
              className="absolute h-full w-full flex items-center justify-end pe-5"
            >
              <span onClick={(e) => dispatch(togglePasswordVisible())}>
                {passwordVisible ? (
                  <Eye className="text-(--foreground)/70 hover:text-(--foreground) transition duration-200 ease-in-out cursor-pointer" />
                ) : (
                  <EyeClosed className="text-(--foreground)/70 hover:text-(--foreground) transition duration-200 ease-in-out cursor-pointer" />
                )}
              </span>
            </label>
            <input
              id="password"
              type={passwordVisible ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="new-password"
              value={formData.password}
              onChange={(e) =>
                handleChange("password", e.target.value, setFormData)
              }
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-300"
            />
          </div>
          {/* Password realtime validation */}
          <div className="text-sm flex flex-col ms-1">
            <span
              className={`block ${getPasswordChecks.minLength ? "text-green-600" : "text-red-500"}`}
            >
              At least 8 characters.
            </span>
            <span
              className={`block ${getPasswordChecks.case ? "text-green-600" : "text-red-500"}`}
            >
              At least one upper and lowercase character.
            </span>
            <span
              className={`block ${getPasswordChecks.number ? "text-green-600" : "text-red-500"}`}
            >
              At least one number.
            </span>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !isValid || !isPasswordValid}
          className="w-full bg-(--primary) text-white mt-1 py-3 rounded-lg font-semibold disabled:bg-(--primary_hover)/50 hover:bg-(--primary_hover) transition cursor-pointer"
        >
          {loading ? "Saving Account..." : "Create my Account"}
        </button>
      </form>
    </>
  );
};

export default RegisterForm;
