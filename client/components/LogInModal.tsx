import { AuthProps, login, register } from "@/services/auth.service";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useMediaQuery,
  useTheme,
  TextField,
  CircularProgress,
} from "@mui/material";
import { useState } from "react";

interface Props {
  open: boolean;
  handleClose: () => void;
  checkUser: () => void;
}

export default function LoginModal({ open, handleClose, checkUser }: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [formData, setFormData] = useState<AuthProps>({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);

    try {
      const data = await login(formData);

      if (data.success) {
        console.log("Logged in!", data.message); // "Logged in successfully."
        checkUser();
        handleClose();
      }

      if (data.errors) {
        // Laravel returns field-level errors like:
        console.error("Errors:", data.errors);
      }
    } catch (error) {
      console.error("Login failed. Please try again.");
      // setErrors({ general: "Login failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };
  const handleChange = (
    field: keyof AuthProps,
    value: string | number | null,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={handleClose}
      aria-labelledby="responsive-dialog-title"
    >
      <DialogTitle id="responsive-dialog-title">Login as Admin</DialogTitle>
      <DialogContent className="flex flex-col justify-center items-center gap-3">
        <TextField
          className="w-100"
          id="email"
          label="email"
          variant="filled"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          autoComplete="email"
          disabled={loading}
        />
        <TextField
          className="w-100"
          type="password"
          id="password"
          label="Password"
          variant="filled"
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          autoComplete="current-password" // 7. Correct autocomplete hint
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <div className="pe-4 pb-4">
          <button
            className="min-w-30 bg-(--primary) hover:bg-(--primary_hover) rounded text-neutral-50 py-1 px-2 transition duration-300 ease-in-out cursor-pointer"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <p>Login</p>
            )}
          </button>
        </div>
      </DialogActions>
    </Dialog>
  );
}
