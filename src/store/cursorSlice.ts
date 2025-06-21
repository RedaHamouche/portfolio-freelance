import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CursorState {
  isClickable: boolean;
  direction: string;
}

const initialState: CursorState = {
  isClickable: false,
  direction: '',
};

const cursorSlice = createSlice({
  name: 'cursor',
  initialState,
  reducers: {
    setClickable: (state, action: PayloadAction<boolean>) => {
      state.isClickable = action.payload;
    },
    setDirection: (state, action: PayloadAction<string>) => {
      state.direction = action.payload;
    },
  },
});

export const { setClickable, setDirection } = cursorSlice.actions;
export default cursorSlice.reducer; 