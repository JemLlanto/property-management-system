import { createSlice } from "@reduxjs/toolkit";

const passwordToggleSlice = createSlice({
  name: "ui",
  initialState: { passwordVisible: false },
  reducers: {
    togglePasswordVisible: (state) => {
      state.passwordVisible = !state.passwordVisible;
    },
  },
});

export const { togglePasswordVisible } = passwordToggleSlice.actions;
export default passwordToggleSlice.reducer;
