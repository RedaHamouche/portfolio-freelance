import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState = {
  isScrolling: false,
  scrollingSpeed: 20,
  direction: null as string | null,
};

const scrollSlice = createSlice({
  name: 'scroll',
  initialState,
  reducers: {
    setIsScrolling(state, action: PayloadAction<boolean>) {
      state.isScrolling = action.payload;
    },
    setScrollingSpeed(state, action: PayloadAction<number>) {
      state.scrollingSpeed = action.payload;
    },
    setDirection(state, action: PayloadAction<string | null>) {
      state.direction = action.payload;
      state.isScrolling = !!action.payload;
    },
    resetDirection(state) {
      state.direction = null;
      state.isScrolling = false;
    },
  },
});

export const { setIsScrolling, setScrollingSpeed, setDirection, resetDirection } = scrollSlice.actions;
export default scrollSlice.reducer; 