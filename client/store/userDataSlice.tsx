import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  id: "",
  username: "",
  email: "",
  isLoggedIn: false,
};

const userDataSlice = createSlice({
  name: "userData",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.id = action.payload.id;
      state.username = action.payload.username || "";
      state.email = action.payload.email;
      state.isLoggedIn = true;
    },
    clearUser: () => initialState,
  },
});

export const { setUser, clearUser } = userDataSlice.actions;
export default userDataSlice.reducer;
