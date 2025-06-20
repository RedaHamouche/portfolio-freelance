import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState = {
  mapWidth: 3000,
  mapHeight: 2000,
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setMapSize(state, action: PayloadAction<{ width: number; height: number }>) {
      state.mapWidth = action.payload.width;
      state.mapHeight = action.payload.height;
    },
  },
});

export const { setMapSize } = mapSlice.actions;
export default mapSlice.reducer; 