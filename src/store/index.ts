import { configureStore } from '@reduxjs/toolkit';
import cadreReducer from './cadreSlice';
import scrollReducer from './scrollSlice';
import mapReducer from './mapSlice';

const store = configureStore({
  reducer: {
    cadre: cadreReducer,
    scroll: scrollReducer,
    map: mapReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store; 