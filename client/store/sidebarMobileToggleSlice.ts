import { createSlice } from "@reduxjs/toolkit";

const sidebarMobileToggleSlice = createSlice({
  name: "sideBar",
  initialState: { sideBarVisible: false },
  reducers: {
    toggleSideBarVisible: (state) => {
      state.sideBarVisible = !state.sideBarVisible;
    },
  },
});

export const { toggleSideBarVisible } = sidebarMobileToggleSlice.actions;
export default sidebarMobileToggleSlice.reducer;
