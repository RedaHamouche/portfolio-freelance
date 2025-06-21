import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store';
import { setAutoScrolling, setAutoScrollDirection } from '../../../store/scrollSlice';

const PlayPauseButton: React.FC = () => {
  const isAutoScrolling = useSelector((state: RootState) => state.scroll.isAutoScrolling);
  const autoScrollDirection = useSelector((state: RootState) => state.scroll.autoScrollDirection);
  const dispatch = useDispatch();

  const handlePlayPause = () => {
    dispatch(setAutoScrolling(!isAutoScrolling));
  };

  const handleDirectionChange = () => {
    dispatch(setAutoScrollDirection(autoScrollDirection === 1 ? -1 : 1));
  };

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <button type="button" onClick={handlePlayPause}>
        {isAutoScrolling ? 'Pause' : 'Play'}
      </button>
      <button type="button" onClick={handleDirectionChange}>
        Direction: {autoScrollDirection === 1 ? '→' : '←'}
      </button>
    </div>
  );
};

export default PlayPauseButton; 