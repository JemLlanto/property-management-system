import { configureStore } from "@reduxjs/toolkit";
import passwordReducer from "./passwordToggleSlice";
import userReducer from "./userDataSlice";
import itemReducer from "./itemData.slice";
import isLoadingReducer from "./isLoading.slice";

export const store = configureStore({
  reducer: {
    password: passwordReducer,
    userData: userReducer,
    itemData: itemReducer,
    loading: isLoadingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
