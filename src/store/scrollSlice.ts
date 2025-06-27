import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState = {
  isScrolling: false,
  scrollingSpeed: 20,
  direction: null as string | null,
  isAutoPlaying: false,
  progress: 0,
  pathLength: 2000,
  autoScrollDirection: 1, // 1 pour aller vers la droite, -1 pour aller vers la gauche
  isAutoScrollTemporarilyPaused: false,
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
    setAutoPlaying(state, action: PayloadAction<boolean>) {
      state.isAutoPlaying = action.payload;
    },
    setProgress(state, action: PayloadAction<number>) {
      state.progress = action.payload;
    },
    setPathLength(state, action: PayloadAction<number>) {
      state.pathLength = action.payload;
    },
    setAutoScrollDirection(state, action: PayloadAction<number>) {
      state.autoScrollDirection = action.payload;
    },
    setAutoScrollTemporarilyPaused(state, action: PayloadAction<boolean>) {
      state.isAutoScrollTemporarilyPaused = action.payload;
    },
  },
});

export const { 
  setIsScrolling, 
  setScrollingSpeed, 
  setDirection, 
  resetDirection, 
  setAutoPlaying,
  setProgress,
  setPathLength,
  setAutoScrollDirection,
  setAutoScrollTemporarilyPaused
} = scrollSlice.actions;
export default scrollSlice.reducer; 