import { configureStore } from "@reduxjs/toolkit";
import passwordReducer from "./passwordToggleSlice";
import sideBarReducer from "./sidebarMobileToggleSlice";
import userReducer from "./userDataSlice";
import isLoadingReducer from "./isLoading.slice";

export const store = configureStore({
  reducer: {
    password: passwordReducer,
    sideBar: sideBarReducer,
    userData: userReducer,
    loading: isLoadingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
