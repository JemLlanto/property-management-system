import { ItemDataProps } from "@/services/Item.service";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: ItemDataProps[] = [];

const itemDataSlice = createSlice({
  name: "itemData",
  initialState,
  reducers: {
    setItems: (_, action: PayloadAction<ItemDataProps[]>) => {
      return action.payload;
    },
    clearItems: () => initialState,
  },
});

export const { setItems, clearItems } = itemDataSlice.actions;
export default itemDataSlice.reducer;
