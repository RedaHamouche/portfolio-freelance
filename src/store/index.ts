import { configureStore } from '@reduxjs/toolkit';
import scrollReducer from './scrollSlice';
import mapReducer from './mapSlice';
import cursorReducer from './cursorSlice';
import modalReducer from './modalSlice';

const store = configureStore({
  reducer: {
    scroll: scrollReducer,
    map: mapReducer,
    cursor: cursorReducer,
    modal: modalReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store; 