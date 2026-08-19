import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  DialogContentText,
} from "@mui/material";
import { useRef, useState } from "react";
interface Props {
  modalShow: boolean;
  handleOTPModal: () => void;
  handleRegister: () => void;
  loading: boolean;
}

const OTPVerificationModal = ({
  modalShow,
  handleOTPModal,
  handleRegister,
  loading,
}: Props) => {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const handleEntered = () => {
    inputs.current[0]?.focus();
  };

  const handleChange = (value: string, index: number) => {
    // Allow only numbers
    if (!/^\d*$/.test(value)) return;

    const digit = value.slice(-1); // Keep only last digit
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Move to next input
    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        // Clear current box
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        // Move back if current box is empty
        inputs.current[index - 1]?.focus();

        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pasted) return;

    const newOtp = [...otp];

    pasted.split("").forEach((digit, i) => {
      newOtp[i] = digit;
    });

    setOtp(newOtp);

    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <>
      <Dialog
        open={modalShow}
        onClose={handleOTPModal}
        TransitionProps={{
          onEntered: handleEntered,
        }}
      >
        <DialogTitle id="alert-dialog-title">
          <span>Verify your Email</span>
        </DialogTitle>
        <DialogContent>
          <div>
            <p>A One-Time Password (OTP) sent to {}</p>
          </div>
          <div className="flex justify-center gap-1 sm:gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                className="size-8 sm:size-12 text-center text-sm sm:text-xl border border-(--foreground)/20 rounded-lg focus:outline-none focus:border-(--primary)"
              />
            ))}
          </div>
        </DialogContent>
        <DialogActions>
          <div className="p-2">
            <Button onClick={handleOTPModal} autoFocus>
              Disagree
            </Button>
            <button
              className="bg-(--primary) text-(--background) rounded py-2 px-3"
              onClick={handleRegister}
            >
              <h6>{loading ? "Verifying..." : "Verify Email"}</h6>
            </button>
          </div>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OTPVerificationModal;
