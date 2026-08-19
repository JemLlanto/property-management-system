import { createSlice } from "@reduxjs/toolkit";

const isLoadingSlice = createSlice({
  name: "ui",
  initialState: { isLoading: true },
  reducers: {
    setIsLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setIsLoading } = isLoadingSlice.actions;
export default isLoadingSlice.reducer;
