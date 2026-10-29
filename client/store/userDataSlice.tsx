import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  id: "",
  username: "",
  email: "",
  type: "",
  name: "",
  unit_number: "",
  building: null as number | null,
  isLoggedIn: false,
};

const userDataSlice = createSlice({
  name: "userData",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.id = action.payload.id ?? action.payload.user_id ?? "";
      state.username = action.payload.username || action.payload.name || "";
      state.email = action.payload.email ?? "";
      state.type = action.payload.type || "";
      state.name = action.payload.name || "";
      state.unit_number = action.payload.unit_number || "";
      state.building = action.payload.building ?? null;
      state.isLoggedIn = true;
    },
    clearUser: () => initialState,
  },
});

export const { setUser, clearUser } = userDataSlice.actions;
export default userDataSlice.reducer;
